/*
 *  	C_API
 *  	Requires jQuery v1.9 or later
 *	
 *      API for accessing funcitons within cognizen
 *  	Version: 0.5
 *		Date Created: 03/01/14
 *		Created by: Philip Double
 *		Date Updated: 03/01/14
 *		Updated by: Philip Double
 *		History: Moved all glossary functionality into its own js file.
 *		Function List:
 				C_EnableNext
 				C_DisableNext
 				C_EnableBack
 				C_DisableBack
 				C_EnableIndex
 				C_DisableIndex
 				C_DisableNav
 				C_EnableNav
 				C_UpdateTracking
 				C_PassCorrect:Boolean
 				C_PassScore
 				C_Pass:Boolean
 				C_Complete
 */
 
 
 /*************************************************************************
 C_DisableNav
 Utilized to disable all nav items - specifically developed for assessments.
 *************************************************************************/
function C_DisableNav(){
	disableNext();
	disableBack();
	disableIndex();
}

/*************************************************************************
 C_EnableNav
 Utilized to enable all nav items - specifically developed for assessments.
 *************************************************************************/
function C_EnableNav(){
	enableNext();
	enableBack();
	enableIndex();
	checkNavButtons();
}

/*************************************************************************
 C_DisableNext
 Disable the next button.
*************************************************************************/
function C_DisableNext(){
	disableNext();
}

/*************************************************************************
 C_EnableNext
 Enable the next button.
*************************************************************************/
function C_EnableNext(){
	enableNext();
}

/*************************************************************************
 C_DisableBack
 Disable the back button.
*************************************************************************/
function C_DisableBack(){
	disableBack();
}

/*************************************************************************
 C_EnableBack
 Enable the back button.
*************************************************************************/ 
function C_EnableBack(){
	enableBack();
}

/*************************************************************************
 C_DisableIndex
 Disable and hide the index toggle button.
*************************************************************************/
function C_DisableIndex(){
	disableIndex();
}

/*************************************************************************
 C_EnableIndex
 Enable and show the index toggle button.
*************************************************************************/
function C_EnableIndex(){
	enableIndex();
}

/*************************************************************************
 C_PassCorrect
 For externally imported Knowledge Check - method to pass back:
 1. user answer
 2. whether the user got it correct as a boolean.
 
 Passes this to update scoring and then updatesTracking....
*************************************************************************/
function C_AnswerResponse(_answer_arr, _correct){
	var selected_arr = _answer_arr;
	var tempCorrect = _correct;
	updateScoring(selected_arr, tempCorrect);
	updateTracking();
}

/*************************************************************************
 C_PassScore
 Pass score for a multiple step assesment.
*************************************************************************/
function C_PassScore(_score){
	var myScore = _score;
}

/*************************************************************************
 C_PassPass
 Pass whether a user passed a full assessment as a Boolean.
*************************************************************************/
function C_PassPass(_pass){
	var myPass = _pass;
}

/*************************************************************************
 C_Complete
 Pass whether a lesson is complete as a Boolean.
*************************************************************************/
function C_PageComplete(_complete){
	var myComplete = _complete;
	updateTracking();
}

/*************************************************************************
 C_Complete
 Pass whether a lesson is complete as a Boolean.
*************************************************************************/
function C_LessonComplete(_complete){
	var myComplete = _complete;
	updateTracking();
}