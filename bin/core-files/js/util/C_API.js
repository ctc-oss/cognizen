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
 				C_CheckNavButtons
 				C_UpdateTracking
 				C_EnableIndex
 				C_DisableIndex
 				C_DisableNav
 				C_EnableNav
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