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
	if($(data).find('scorm').attr('value') == "true" && mode == "production"){
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
					}
				}
			}
			else if(scorm.VERSION.substring(0,4) == "2004"){
				if(scorm.get("cmi.entry") == "resume"){
					var location = scorm.get("cmi.location");
					if(location != ""){
						//figure out what is going on here.
						loadPageFromID(location);
					}
				}
			}
		}
	}
}

function completeCourse(){
	scorm.status("set", "completed");
	if(scorm.VERSION == "1.2"){
		scorm.set("cmi.core.exit", "");
	}
	else if(scorm.VERSION.substring(0,4) == "2004"){
		scorm.set("cmi.exit", "normal");
	}
	scorm.quit();
}

function completeLession(){
	//scorm.status("set", "");
	
}