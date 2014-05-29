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

		lmsConnected = scorm.init();
		lessonStatus = scorm.status("get");

		//course has already been completed
		if(lessonStatus == "completed"){
			scorm.quit();
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
				if(scorm.get("cmi.entry") == "resume"){
					var location = scorm.get("cmi.location");
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

			var finalLesson = $(data).find('finalLesson').attr('value');
			//handle completion for USSOCOM publish
			if(scorm.VERSION.indexOf('USSOCOM') != -1){
				if(attemptExceeded){
					scorm.set("adl.nav.request", "exitAll");
				}
				else{
					// if(remediate){
					// 	scorm.set("adl.nav.request", "previous");
					// }
					// else{
						scorm.set("adl.nav.request", "continue");
					//}
				}
			}
			else{
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
		}
		else if(scorm.VERSION === "1.2"){
			var raw = score*100;
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

function getObjectives(){

	var objectives_arr = [];
	var num = parseInt(scorm.get("cmi.objectives._count"));

    for (var i=0; i < num; ++i) {
    	var objectivesObj = new Object();
    	var setId = scorm.get("cmi.objectives." + i + ".id").split(".");
    	if(setId.length > 1){
	    	objectivesObj.id = setId[2].replace(/_/g, ' ');
	    	objectivesObj.successStatus = scorm.get("cmi.objectives." + i + ".success_status");
	    	objectivesObj.objItemId = setId[setId.length - 1].replace(/_/g, ' ').replace(/:/g, '');
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

function setObjectiveSuccess(objId, success){
	if(doScorm()){

		var objIndex = findObjective(objId);

		var successStatus = (success) ? "passed":"failed";

		var completionStatus = (success) ? "completed":"incomplete";

		scorm.set("cmi.objectives." + objIndex + ".success_status", successStatus);
		scorm.set("cmi.objectives." + objIndex + ".completion_status", completionStatus);

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
    var num = parseInt(scorm.get("cmi.objectives._count"));
    var objIndex = -1;

    for (var i=0; i < num; ++i) {
        if (scorm.get("cmi.objectives." + i + ".id") == objId) {
            objIndex = i;
            break;
        }
    }

    if (objIndex == -1) {
        //message("Objective " + objId + " not found.");
        objIndex = num;
        //message("Creating new objective at index " + objIndex);
        scorm.set("cmi.objectives." + objIndex + ".id", objId);
    }
    return objIndex;
}