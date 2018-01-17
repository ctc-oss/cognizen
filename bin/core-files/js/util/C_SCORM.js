/*
 *  	C_SCORM
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses Houses SCORM functionality
 *
 *      ©Concurrent Technologies Corporation 2018
 */


var isScorm = false;//indicates if is a SCORM course
var lessonStatus;//holds the status of the SCORM lesson
var lmsConnected = false;//indicates if connected to the LMS
var scorm;//Set after script is initialized. = pipwerks.SCORM;//var for SCORM API wrapper
var markResume = false; //had to use this for JKO since it doesn't call terminate() successfully
var lmsObjectives_arr = [];

/*************************************************************
** SCORM Funcitonality
*************************************************************/

function checkScorm(){
	scorm = pipwerks.SCORM;
	//check to see if the scorm perference is set to true
	//and mode is production
	if(doScorm()){
		isScorm = true;
		scorm.VERSION = $(data).find('scormVersion').attr('value');
//		debugger;
		lmsConnected = scorm.init();

		if(!lmsConnected && $(courseData).find("course").attr("lms") == "JKO"){
			scorm.connection.isActive = true;
				// scorm.API.getHandle().Terminate("");
				// lmsConnected = scorm.init();	
		}
		lessonStatus = scorm.status("get");

		//pop local objectives var to be used in findObjective
		if(lmsObjectives_arr.length == 0){
			populateObjectivesArr();
		}

		var _lessonTitle = $(data).find('lessonTitle').attr('value').replace(/\s+/g, '');

		var review = "false";
		if($(data).find("page").eq(currentPage).attr('review')){
			review = $(data).find("page").eq(currentPage).attr('review');
		}

		if(review === "true"){
			var reviewStrip = _lessonTitle.split("Review");
			_lessonTitle = reviewStrip[0];

		}
		
		var _objIndex = findObjective(_lessonTitle+"_satisfied");

		//find passed/failed status of module/lesson objective
		var _successStatus = '';
        switch(scorm.version){
            case "1.2" : 
            	_successStatus = scorm.get("cmi.objectives."+_objIndex+".status");
            	break;
            //2004	
            default : 
				_successStatus = scorm.get("cmi.objectives."+_objIndex+".success_status");
            	break;
        }		

		//course has already been completed
		if(lessonStatus == "completed"){
			//do nothing
			// if(scorm.version != "1.2"){
			// 	scorm.set("cmi.success_status", "passed");
			// }
			//scorm.quit();
		}
		else if(_successStatus === "passed"){
			scorm.status("set", "completed");
			if(scorm.version != "1.2"){
				scorm.set("cmi.success_status", "passed");
				//#5012 If a SCO (lesson) has been passed and a score.scaled has been recorded to the 
				//global objective the value stored in the objective needs to be set to cmi.score.scaled
				var objScoreScaled = scorm.get("cmi.objectives."+_objIndex+".score.scaled");
				if( objScoreScaled != undefined && objScoreScaled != null && objScoreScaled != ""){
					scorm.set("cmi.score.scaled", objScoreScaled);
				}					
			}
		}
		else{
			scorm.status("set", "incomplete");

			//resume on page
			var location = "";
			var scormEntry = "";

            switch(scorm.version){
                case "1.2" : 
                	scormEntry = scorm.get("cmi.core.entry");
                	location = scorm.get("cmi.core.lesson_location");
                	break;
                //2004	
                default : 
                	scormEntry = scorm.get("cmi.entry");	
                	location = scorm.get("cmi.location");
                	break;
            }
            if($(courseData).find("course").attr("lms") != "ADLS"){
	            if(scormEntry === "resume"){
	            	var suspendedQuestionResponse = scorm.get("cmi.suspend_data");
	            	var qrObject_arr = suspendedQuestionResponse.split("|");
	            	for (var i = 0; i < qrObject_arr.length-1; i++) {
	            		questionResponse_arr.push(jQuery.parseJSON(qrObject_arr[i]));
	            	};
	            	
					if(location != ""){
						buildTrackingArray();
						loadPageFromID(location);
						rejoinTracking(location);
					}            	
	            }
        	}
        	else{
				if(location != ""){
	            	var suspendedQuestionResponse = scorm.get("cmi.suspend_data");
	            	var qrObject_arr = suspendedQuestionResponse.split("|");
	            	for (var i = 0; i < qrObject_arr.length-1; i++) {
	            		questionResponse_arr.push(jQuery.parseJSON(qrObject_arr[i]));
	            	};
	            	
	                markResume = true;
					buildTrackingArray();
					loadPageFromID(location);
					rejoinTracking(location);
				}  
        	}

		}
	}
}

function doScorm(){
	if($(data).find('scorm').attr('value') == "true" && mode == "production"){
		return true;
	}
	else{
		return false;
	}
}

function completeLessonDefault(){
	if(doScorm()){
		scorm.status("set", "completed");
		if(scorm.VERSION == "1.2"){
			//no calls 4 now
		}
		else if(scorm.VERSION.substring(0,4) == "2004"){
			scorm.set("cmi.success_status", "passed");
		}
		scorm.quit();
	}
}

function completeLesson(completion, success, score, remediate, attemptExceeded, suspend){
	if(doScorm()){
		var raw = score*100;

		if(completion){
			scorm.status("set", "completed");	
		}
		else{
			scorm.status("set", "incomplete");
		}

		if(scorm.VERSION.substring(0,4) == "2004"){
			//#3568 if success is undefined do not set success_status
			if(success === 'undefined'){
				//do nothing
			}
			else if(success){
				scorm.set("cmi.success_status", "passed");			
			}
			else{
				scorm.set("cmi.success_status", "failed");
			}

			scorm.set("cmi.score.scaled", score.toString());
			scorm.set("cmi.score.raw", raw.toString());

			var finalLesson = $(data).find('finalLesson').attr('value');

			if(finalLesson === 'true' && !remediate){
				scorm.set("adl.nav.request", "exitAll");
			}
			else
			{
				var validContinue = scorm.get("adl.nav.request_valid.continue");
				if(validContinue === 'true')
				{
					scorm.set("adl.nav.request", "continue");
				}
				else
				{
					scorm.set("adl.nav.request", "exit");
				}
			}

		}
		else if(scorm.VERSION === "1.2"){			
			scorm.set("cmi.core.score.raw", raw.toString());
		}

		// reset location for next time lesson is opened
		var currentPageID = 0;
		if(scorm.VERSION == "1.2"){
			scorm.set("cmi.core.lesson_location", currentPageID);
		}
		else if(scorm.VERSION.substring(0,4) == "2004"){
			scorm.set("cmi.location", currentPageID);
		}

		if(scorm.VERSION === '1.2_CTCU'){
			var raw = score*100;
			scorm.set("cmi.core.score.raw", raw.toString());
			// wait for SCORM termination, then close popup windows
			var terminated = scorm.quit();
			if(terminated){
				if(window.opener){
					window.opener.lessonComplete();
				}
				window.close();
			}else{
				console.log("SCORM termination failed");
			}

		}
		else if(suspend){
	        switch(scorm.version){
	            case "1.2" : 
					scorm.set("cmi.core.exit", "suspend");
					scorm.API.getHandle().LMSFinish("");	
	            	break;
	            //2004	
	            default : 
					scorm.set("cmi.exit", "suspend");
					scorm.API.getHandle().Terminate("");	
	            	break;
	        }
	
		}
		else{
	        switch(scorm.version){
	            case "1.2" : 
					scorm.set("cmi.core.exit", "logout");
					scorm.API.getHandle().LMSFinish("");	
	            	break;
	            //2004	
	            default : 
					scorm.set("cmi.exit", "normal");
					scorm.API.getHandle().Terminate("");
	            	break;
	        }			
	
		}
	}
}

function choice(lesson){
	if(doScorm()){
		var lessonNameTrim = lesson.replace(/\s+/g, '');

		scorm.set("adl.nav.request", "{target="+lessonNameTrim+"_id}choice");
		scorm.set("cmi.exit", "normal");
		scorm.API.getHandle().Terminate("");
	}
}

function jump(lesson, scoreTxt, attemptCount, listString){
	if(doScorm()){
		var lessonNameTrim = lesson.replace(/\s+/g, '');

		scorm.set("adl.nav.request", "{target="+lessonNameTrim+"_id}jump");
		//scorm.set("cmi.location", currentPg);
		scorm.set("cmi.suspend_data", scoreTxt+"~"+attemptCount+"~"+listString);
		scorm.set("cmi.competion_status", "incomplete");
		scorm.set("cmi.exit", "suspend");
		scorm.API.getHandle().Terminate("");
	}
}

function choiceValid(lesson){
	if(doScorm()){
		var lessonNameTrim = lesson.replace(/\s+/g, '');
		var valid = (scorm.get("adl.nav.request_valid.choice.{target="+lessonNameTrim+"_id}") === 'true');
		return valid;
	}
	return false;
}

function setPageObjective(_correct, _graded){

	if(doScorm()){

		var eo = '';

		if($(data).find("page").eq(currentPage).attr('eo')){
			eo = $(data).find("page").eq(currentPage).attr('eo').replace('.', '');
		}

		var _objId = buildPageObjectiveId();

		if(_objId.length > 0){	
			_objId += "_id";
			if(_correct && _graded){
				setObjectiveSuccess(_objId, true, eo);
			}
			else if(!_correct && _graded){
				setObjectiveSuccess(_objId, false, eo);
			}
		}	
	}
}

function getPageObjectiveStatus(){
	if(doScorm()){

		var _objId = buildPageObjectiveId();
		var _status = '';

		if(_objId.length > 0){	
			_objId += "_id";
			var objIndex = findObjective(_objId);
	        switch(scorm.version){
	            case "1.2" : 
	            	_status = scorm.get("cmi.objectives." + objIndex + ".status");
	            	break;
	            //2004	
	            default : 
					_status = scorm.get("cmi.objectives." + objIndex + ".success_status");
	            	break;
	        }
		}

		return _status;	
	}	
}

function buildPageObjectiveId(){
		var _objId = "";
		var myObjective = 'undefined';
		var myObjItemId = 'undefined';
		var _pgTitle = encodeURIComponent(pageTitle.getPageTitle().replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '').replace(/:/g, '').replace(/&nbsp;/g, '')).replace('.', '');

		if($(data).find("page").eq(currentPage).attr('objective')){
			myObjective = $(data).find("page").eq(currentPage).attr('objective');
		}

		if($(data).find("page").eq(currentPage).attr('objItemId')){
			myObjItemId = $(data).find("page").eq(currentPage).attr('objItemId');
		}	

		var tlo = '';
		if($(data).find("tlo").attr("value")){
			tlo = $(data).find("tlo").attr("value");
		}

		var lessonIndicator = 'undefined';
		if(tlo != 'undefined' && tlo != undefined){
			lessonIndicator = tlo.replace(/\s+/g, '').replace('.', '');
		}
		else{
			lessonIndicator = $(data).find("lessonTitle").attr("value").replace(/\s+/g, '').replace('.', '').replace(/[^\w\s]/gi, '');
		}

		if(myObjective != undefined && myObjective !== "undefined"){
			//check for duplicates; manipulate objective name if so (this may not work!!!!)
			_objId = lessonIndicator +"."+
				_pgTitle+"."+
				myObjective.replace(/\s+/g, '_').replace('.', '');

		}

		if(myObjItemId != undefined && myObjItemId !== "undefined"){
			if(_objId.length > 0){
				_objId += "." + myObjItemId.replace(/\s+/g, '_').replace('.', '');
			}
			else{
	 			_objId = lessonIndicator +"."+
					_pgTitle+"."+
					myObjItemId.replace(/\s+/g, '_').replace('.', '');						    			
			}
		}

		return _objId;	
}

function getObjectives(){

	var objectives_arr = [];
	var num = parseInt(scorm.get("cmi.objectives._count"));

    for (var i=0; i < num; ++i) {
    	var objectivesObj = new Object();
    	var setId = scorm.get("cmi.objectives." + i + ".id").split(".");
    	if(setId.length > 1){
	    	objectivesObj.id = encodeURIComponent(setId[2].replace(/_/g, ' '));
	        switch(scorm.version){
	            case "1.2" : 
	            	objectivesObj.successStatus = scorm.get("cmi.objectives." + i + ".status");
	            	break;
	            //2004	
	            default : 
					objectivesObj.successStatus = scorm.get("cmi.objectives." + i + ".success_status");
	            	break;
	        }	    		    	
	    	objectivesObj.objItemId = setId[setId.length - 1].replace(/_/g, ' ');//.replace(/:/g, '');
	    	objectives_arr.push(objectivesObj);
    	}
    }

	return objectives_arr;
}

function getAttemptObjectivesCount(){
	var num = parseInt(scorm.get("cmi.objectives._count"));
	var attemptCount = 0;
	for (var i=0; i < num; ++i) {
    	var objId = scorm.get("cmi.objectives." + i + ".id");
    	if(objId.indexOf("attempt_") != -1){
    		attemptCount++;
    	}
    }
    return attemptCount;
}

function setObjectiveSuccess(objId, success, eo){
	if(doScorm()){

		var objIndex = findObjective(objId);

		var successStatus = (success) ? "passed":"failed";

		var completionStatus = (success) ? "completed":"incomplete";

        switch(scorm.version){
            case "1.2" : 
            	scorm.set("cmi.objectives." + objIndex + ".status", successStatus);
            	break;
            //2004	
            default : 
				scorm.set("cmi.objectives." + objIndex + ".success_status", successStatus);
				if($(courseData).find("course").attr("lms") != "JKO"){
					scorm.set("cmi.objectives." + objIndex + ".completion_status", completionStatus);
					scorm.set("cmi.objectives." + objIndex + ".description", eo);
				}
            	break;
        }

	}

}

function getObjectiveSuccess(objId){
	if(doScorm()){
		var objIndex = findObjective(objId);
		if(objIndex != -1){
	        switch(scorm.version){
	            case "1.2" : 
	            	return scorm.get("cmi.objectives." + objIndex + ".status");
	            //2004	
	            default : 
					return scorm.get("cmi.objectives." + objIndex + ".success_status");
	            	
	        }
        }
        else{
        	return "undefined";
        }		
	}
	else{
		return "undefined";
	}
}

function setInteractions(_id, _type, _response, _result, _description){
	if(doScorm()){
		var num = parseInt(scorm.get("cmi.interactions._count"));

		if($(courseData).find("course").attr("lms") != "JKO"){
			scorm.set("cmi.interactions." + num + ".id", _id);
			scorm.set("cmi.interactions." + num + ".type", _type);						
		}

        switch(scorm.version){
            case "1.2" : 
            	scorm.set("cmi.interactions." + num + ".student_response", _response);
            	var result = (_result) ? "correct":"wrong";
            	scorm.set("cmi.interactions." + num + ".result", result);
            	break;
            //2004	
            default : 
            	var result = (_result) ? "correct":"incorrect";
            	scorm.set("cmi.interactions." + num + ".result", result);
				scorm.set("cmi.interactions." + num + ".learner_response", _response);
				scorm.set("cmi.interactions." + num + ".description", _description);
            	break;
        }

	}
}

/*******************************************************************************
**
** Function findObjective(objId)
** Inputs:  objId - the id of the objective
** Return:  the index where this objective is located 
**
** Description:
** This function looks for the objective within the objective array and returns 
** the index where it was found or it will create the objective for you and return 
** the new index.
** From ADL APIWrapper.js
*******************************************************************************/
function findObjective(objId) 
{
    var objIndex = -1;
    var encodedObjId = objId;//encodeURIComponent(objId);

	if(lmsObjectives_arr.length != 0){
		for (var i = 0; i < lmsObjectives_arr.length; i++) {
			if(lmsObjectives_arr[i].id == encodedObjId){
				objIndex = lmsObjectives_arr[i].index;
				break;
			}
		}
	}

	if(objIndex == -1){

	    var num = parseInt(scorm.get("cmi.objectives._count"));

	    for (var i=0; i < num; ++i) {
	        if (scorm.get("cmi.objectives." + i + ".id") == encodedObjId) {
	            objIndex = i;
	            break;
	        }
	    }

	    //don't create objectives in JKO
	    if ($(courseData).find("course").attr("lms") != "JKO" && objIndex == -1) {
	        objIndex = num;
	        scorm.set("cmi.objectives." + objIndex + ".id", encodedObjId);
	    }
	}
    return objIndex;
}

function populateObjectivesArr()
{
	var num = parseInt(scorm.get("cmi.objectives._count"));

    for (var i=0; i < num; ++i) {
    	var _obj = {id : scorm.get("cmi.objectives." + i + ".id"), index : i };
    	lmsObjectives_arr.push(_obj);
    }
}