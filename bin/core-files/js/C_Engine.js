/*!
 * C_Engine
 * This file is the Main js file for the Cognizen
 * VERSION: Cognizen alpha 0.8
 * VERSION DATE: 3/1/2013
 * CREATION DATE: 2013-01-16
 * JavaScript
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */

//VARIABLES
var data;

var stageX;
var stageY;
var stageH;
var stageW;
var username;
var mode = "production";//mode can be set to production, edit and review.

var mobileWidth = 1023; //value should match the value set in C_Engine.css (@media all and (max-width: 600px) )
var windowWidth = $('body').width();
windowHeight = $(window).height();
var urlParams;

var dragFile = false;
var corePath = "../../../../core-files/";

var audioVolume = 0.8; //persistant audio volume between pages
var audioMute = false; //persistant audio mute state between pages

/****************************************************
*********************************** STEP 1 - LOAD XML
****************************************************/
//LOAD THE XML AS SOON AS THE DOCUMENT IS READY
$(document).ready(function(){
	$.ajax({
		type: "GET",
		url: "xml/content.xml",
		dataType: "xml",
		async: false,
		success: initScripts,
		error: function(){
			alert("unable to load content.xml")
		}
	});
});

/****************************************************
**************************** STEP 2 - LOAD JS Modules
****************************************************/
function initScripts(_data){
	data = _data;
	//console.log(data);
	totalPages = $(data).find('page').length;
	mode = $(data).find('mode').attr("value");
	if(mode == "production" || mode == "Production" || mode == "prod"){
		corePath = "";
	}
    // This will prevent errors on slow connections.  We might need to set it to an actual number, as 0 means no timeout.
    require.config({
        waitSeconds: 0
    });
	//LOADING IN ALL OF THE EXTERNAL JS FILES
	//TODO: needs to be updated to build the required files based on the output e.g. SCORM
	require([		//Funtionality/utilities
				corePath +"js/libs/jqueryui/jquery-ui.min.js",
				corePath +"js/libs/SCORM_API_wrapper.js", //SCORM capabilities
				corePath +"js/libs/jquery.ui.touch-punch.min.js", //Adds touch drag to touchscreen devices.
				corePath +"js/libs/jquery.nanoscroller.min.js", //Add the hover mac like scrollbars
				corePath +"js/libs/overthrow.min.js",
				corePath +"js/libs/socket-client/socket.io.min.js", //required for edit mode.
				corePath +"js/libs/redactor/redactor.js", //Inline content editing tool
				corePath +"js/libs/C_DynamicBackgroundImage.js", //Allows us to set an image background on all browsers
				corePath +"js/libs/mediaElement/mediaelement-and-player.js", //Our audio and video solution
				corePath +"js/libs/greensock/TweenMax.min.js", //Our animation library.
				corePath +"js/libs/jquery.swfobject.1-1-1.min.js", //Method to embed .swf files.
				corePath +"js/libs/jquery.nestable.js",
				//Import Cognizen layout templates
				corePath +"js/templates/C_LessonTitle.js", 
				corePath +"js/templates/C_StaticContent.js", //All text and static media pages - text, .jpg, .png, .swf
				corePath +"js/templates/C_TabbedContent.js", //Tabs can be added to static by power users but this is more user friendly.
				corePath +"js/templates/C_Reveal.js", //Reveal text upon clicking on an image.
				corePath +"js/templates/C_Flashcard.js",
				corePath +"js/templates/C_Unity3D.js", //Template for importing Unity 3D swf files - requires more than regular swf
				//Import Cognizen Knowledge Check templates
				corePath +"js/templates/C_MultipleChoice.js", //Multiple choice quizzing
				corePath +"js/templates/C_MultipleChoiceImage.js",
				corePath +"js/templates/C_Matching.js", //Matching quizzing
				//Import Cognizen Utilities
				corePath +"js/util/C_Index.js",
				corePath +"js/util/C_AddPage.js",
				corePath +"js/util/C_Glossary.js",
				corePath +"js/util/C_DocList.js",
				corePath +"js/util/C_ScrubContent.js",
				corePath +"js/util/C_NavControl.js",
				corePath +"js/util/C_UtilFunctions.js",
				corePath +"js/util/C_Sockets.js",
				corePath +"js/util/C_SCORM.js",
				corePath +"js/util/C_Comment.js",
				corePath +"js/libs/jquery.corner.js",
				corePath +"js/libs/modernizr.js",
				corePath +"js/libs/siofu/client.js",
				corePath +"js/libs/pretty-data.js",
				//Give mouse super powers.
				corePath +"js/libs/jquery.mousewheel-3.0.6.pack.js",
				//Lightbox for media popups and galleries.
				corePath +"js/libs/fancybox/jquery.fancybox.js",
				corePath +"js/libs/fancybox/jquery.fancybox-thumbs.js"
	], startEngine);
}

function startEngine(){
	//Enable popups from within the dialogs.
	$.widget( "ui.dialog", $.ui.dialog, {
		_allowInteraction: function( event ) {
			return $( event.target ).closest( ".ui-draggable" ).length;
		}
	});
	initializeSockets();
}

function updateActiveEditor(_user){
	if(username == _user){
		var msg = '<div id="dialog-offerEdit" title="Editor Queue"><p class="validateTips">'+ activeEditor +' has left this session and you are the next in line to edit.</p><p>Would you like to edit this lesson?</p></div>';
			
		//Add to stage.
		$("#stage").append(msg);
				
		//Make it a dialog
		$("#dialog-offerEdit").dialog({
			modal: true,
			width: 550,
			close: function(event, ui){
				$("#dialog-offerEdit").remove();
			},
			buttons: {
				YES: function () {
					mode = "edit";
					forcedReviewer = false;
					activeEditor = username;
					buildInterface();
					$(this).dialog("close");
				},
				NO: function(){
					cognizenSocket.emit('passLock', { me: username });
					$(this).dialog("close");
				}
			}
		});
	}
}

function openLockRequest(_data){
	if(username == _data.requestee){
		var msg = '<div id="dialog-incomingLockRequest" title="Request for Edit Control"><p class="validateTips">'+ _data.requester +' is requesting permission to edit this lesson.</p><p>You currently hold the lock on edit controls.  Would you like to give '+ _data.requester +' the edit lock?  Your rights will be changed to reviewer mode.</p></div>';
			
		//Add to stage.
		$("#stage").append(msg);
				
		//Make it a dialog
		$("#dialog-incomingLockRequest").dialog({
			modal: true,
			width: 550,
			close: function(event, ui){
				$("#dialog-incomingLockRequest").remove();
			},
			buttons: {
				YES: function () {
					mode = "review";
					forcedReviewer = true;
					activeEditor = _data.requester;
					cognizenSocket.emit('approveLockRequest', { me: username, requester: _data.requester });
					buildInterface();
					$(this).dialog("close");
				},
				NO: function(){
					cognizenSocket.emit('refuseLockRequest', { me: username, requester: _data.requester });
					$(this).dialog("close");
				}
			}
		});
	}
}

function openLockRequestAccepted(_data){
	//console.log("requested Beatch!?!?");
	if(username == _data.requester){
		var msg = '<div id="dialog-incomingLockRequest" title="Request for Edit Control"><p class="validateTips">'+ _data.requestee +' has passed you the lock to edit this lesson.</p><p>You currently hold the lock on edit controls. <b>Be certain to close this lesson window or relinquish lock if you are not actively working on the lesson!</b></p></div>';
			
		//Add to stage.
		$("#stage").append(msg);
				
		//Make it a dialog
		$("#dialog-incomingLockRequest").dialog({
			modal: true,
			width: 550,
			close: function(event, ui){
				$("#dialog-incomingLockRequest").remove();
			},
			buttons: {
				OK: function () {
					mode = "edit";
					forcedReviewer = false;
					activeEditor = _data.requester;
					buildInterface();
					$(this).dialog("close");
				}
			}
		});
	}
}

function openLockRequestRefused(_data){
	if(username == _data.requester){
		var msg = '<div id="dialog-incomingLockRequest" title="Request for Edit Control"><p class="validateTips">'+ _data.requestee +' has refused your request for edit controls.  Contact them at their e-mail to follow up and plan access.</p></div>';
			
		//Add to stage.
		$("#stage").append(msg);
				
		//Make it a dialog
		$("#dialog-incomingLockRequest").dialog({
			modal: true,
			width: 550,
			close: function(event, ui){
				$("#dialog-incomingLockRequest").remove();
			},
			buttons: {
				OK: function(){
					$(this).dialog("close");
				}
			}
		});
	}
}



function forcedReviewAlert(){
	var msg = '<div id="dialog-locked" title="Content: Locked"><p class="validateTips">This lesson is currently being edited by '+ activeEditor +'.</p><p>Your priveleges are being set to review mode. You can view the content but cannot edit it.</p></div>';
			
	//Add to stage.
	$("#stage").append(msg);
			
	//Make it a dialog
	$("#dialog-locked").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
			$("#dialog-locked").remove();
		},
		buttons: {
			OK: function () {
				$(this).dialog("close");
			}
		}
	});
}
/****************************************************
******************************** STEP 3 - BUILD SHELL
****************************************************/
//Place all permanent items in the UI - background - title - nav
function buildInterface(){
	$('body').empty();
	$('body').append("<div id='outer'><div id='inner'><div id='myCanvas'><div id='stage'></div><div id='courseTitle'></div><div id='lessonTitle'></div><div id='panes'></div></div></div></div>");

	//Set variables consumed by templates.
	stageX = $("#stage").position().left;
	stageY = $("#stage").position().top;
	stageW = $("#stage").height();
	stageH = $("#stage").height();
	
	if(forcedReviewer == true){
		forcedReviewAlert();
	}
	
	
	//This call positions the background graphic - funciton is in C_DynamicBackgroundImage       /*************************Note: Will make this optional - allow them to use css background instead*/
	//Image can be updated in css/C_Engine.css and resides in css/images/ folder.
	$("#myCanvas").fitToBackgroundImage();

	//Place the course title.																	 /*************************Note: Will make this optional*/
	var courseTitle = $(data).find("courseTitle").attr("value");
	$("#courseTitle").append(courseTitle);

	//Place the lesson title																	 /*************************Note: Will make this optional*/
	var lessonTitle = $(data).find("lessonTitle").attr("value");
	$("#lessonTitle").append(lessonTitle);
	
	checkNav(); 
	if(mode == "edit"){
		addEditNav();
	}
	
	if(mode == "edit" || mode == "review"){
		checkComment();
		checkToggleMode();
	}
	
	checkLockMode();
	checkIndex();
	checkGlossary();
	checkDocs();

	checkScorm();
	loadPage();
}

/**
* sendUpdateWithRefresh
* @description Sends xml to the server to update and refreshes the xml upon success.
*/
function sendUpdateWithRefresh(_type){
	//Serialize the xml and send it to nodejs using socket.
	var myData = $(data);
	var xmlString = undefined;
	//IE being a beatch, as always - have handle xml differently.
	if (window.ActiveXObject){
        xmlString = myData[0].xml;
	}
	
	if(xmlString === undefined){
		var oSerializer = new XMLSerializer();
		xmlString = oSerializer.serializeToString(myData[0]);
	}
	
	var pd = new pp();
	var xmlString  = pd.xml(xmlString);
	
	if(_type == undefined){
		socket.emit('updateXMLWithRefresh', { my: xmlString });
	}else if(_type == 'glossary'){
		socket.emit('updateXMLGlossary', { my: xmlString });
	}else if(_type == 'updatePrefs'){
		socket.emit('updateXMLPrefs', { my: xmlString });
	}else if (_type == 'updatePrefsWithPublish'){
		socket.emit('updateXMLPrefsWithPublish', { my: xmlString });
	}
}


function sendUpdate(){
	//Serialize the xml and send it to nodejs using socket.
	var myData = $(data);
	var xmlString;
	//IE being a beatch, as always - have handle xml differently.
	if (window.ActiveXObject){
        xmlString = myData[0].xml;
	}
	
	if(xmlString === undefined){
		var oSerializer = new XMLSerializer();
		xmlString = oSerializer.serializeToString(myData[0]);
	}
	
	var pd = new pp();
	var xmlString  = pd.xml(xmlString);
	socket.emit('updateXML', { my: xmlString });
}

/*************************************************************
** Changes the styling when the browser window is resized
*************************************************************/
$(window).resize(function(){
	windowWidth = $('body').width();
	windowHeight = $(window).height();
    $("#myCanvas").fitToBackgroundImage();
});