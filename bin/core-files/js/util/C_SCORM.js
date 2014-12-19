/*
 *  	C_SCORM
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses Houses SCORM functionality
 *  	Version: 0.5
 *		Date Created: 10/19/13
 *		Created by: Philip Double
 *		Date Updated: 10/19/13
 *		Updated by: Philip Double
 *		History: Moved all glossary functionality into its own js file.
 *		Todo: 	- Turn this into a plugin.  This did reside in C_Engine which was becoming unruly.
 *				- Optimize code.
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
		var _objIndex = findObjective(_lessonTitle+"_satisfied");

		//course has already been completed
		if(lessonStatus == "completed"){
			scorm.set("cmi.success_status", "passed");
			//scorm.quit();
		}
		else if(scorm.get("cmi.objectives."+_objIndex+".success_status") === "passed"){
			scorm.status("set", "completed");
			scorm.set("cmi.success_status", "passed");
		}
		else{
			scorm.status("set", "incomplete");

			//resume on page
			if(scorm.VERSION == "1.2"){
				if(scorm.get("cmi.core.entry") == "resume"){
					var location = scorm.get("cmi.core.lesson_location");
					if(location != ""){
						//figure out what is going on here.
						loadPageFromID(location);
						rejoinTracking(location);
					}
				}
			}
			else if(scorm.VERSION.substring(0,4) == "2004"){
				if(scorm.get("cmi.entry") == "resume" || scorm.VERSION.indexOf('USSOCOM') != -1){
					var location = scorm.get("cmi.location");
					markResume = true;
					if(location != ""){
						//figure out what is going on here.
						loadPageFromID(location);
						rejoinTracking(location);
					}
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

function completeLesson(completion, success, score, remediate, attemptExceeded){
	if(doScorm()){
		var raw = score*100;

		if(completion){
			scorm.status("set", "completed");	
		}
		else{
			scorm.status("set", "incomplete");
		}

		if(scorm.VERSION.substring(0,4) == "2004"){
			if(success){
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
		else{
			scorm.quit();
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
		var _objId = "";
		var myObjective = 'undefined';
		var myObjItemId = 'undefined';
		var eo = '';
		var _pgTitle = encodeURIComponent(pageTitle.getPageTitle().replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '').replace(/:/g, '')).replace('.', '');

		if($(data).find("page").eq(currentPage).attr('eo')){
			eo = $(data).find("page").eq(currentPage).attr('eo').replace('.', '');
		}

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
			lessonIndicator = $(data).find("lessonTitle").attr("value").replace(/\s+/g, '').replace('.', '');
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

function getObjectives(){

	var objectives_arr = [];
	var num = parseInt(scorm.get("cmi.objectives._count"));

    for (var i=0; i < num; ++i) {
    	var objectivesObj = new Object();
    	var setId = scorm.get("cmi.objectives." + i + ".id").split(".");
    	if(setId.length > 1){
	    	objectivesObj.id = encodeURIComponent(setId[2].replace(/_/g, ' '));
	    	objectivesObj.successStatus = scorm.get("cmi.objectives." + i + ".success_status");
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

		scorm.set("cmi.objectives." + objIndex + ".success_status", successStatus);
		if($(courseData).find("course").attr("lms") != "JKO"){
			scorm.set("cmi.objectives." + objIndex + ".completion_status", completionStatus);
			scorm.set("cmi.objectives." + objIndex + ".description", eo);
		}

	}

}

function setInteractions(_id, _type, _response, _result, _description){
	if(doScorm()){
		var num = parseInt(scorm.get("cmi.interactions._count"));
		var result = (_result) ? "correct":"incorrect";

		if($(courseData).find("course").attr("lms") != "JKO"){
			scorm.set("cmi.interactions." + num + ".id", _id);
			scorm.set("cmi.interactions." + num + ".type", _type);
			scorm.set("cmi.interactions." + num + ".result", result);			
		}

		scorm.set("cmi.interactions." + num + ".learner_response", _response);
		scorm.set("cmi.interactions." + num + ".description", _description);
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

	    if (objIndex == -1) {
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