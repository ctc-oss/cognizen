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

var mode = "production";//mode can be set to production, edit and review.

var mobileWidth = 1023; //value should match the value set in C_Engine.css (@media all and (max-width: 600px) )
var windowWidth = $('body').width();
windowHeight = $(window).height();
var urlParams;

var dragFile = false;



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
	
    // This will prevent errors on slow connections.  We might need to set it to an actual number, as 0 means no timeout.
    require.config({
        waitSeconds: 0
    });
	//LOADING IN ALL OF THE EXTERNAL JS FILES
	//TODO: needs to be updated to build the required files based on the output e.g. SCORM
	require([		//Funtionality/utilities
				"js/libs/jqueryui/jquery-ui.min.js",
				"js/libs/SCORM_API_wrapper.js", //SCORM capabilities
				"js/libs/jquery.ui.touch-punch.min.js", //Adds touch drag to touchscreen devices.
				"js/libs/jquery.nanoscroller.min.js", //Add the hover mac like scrollbars
				"js/libs/overthrow.min.js",
				"js/libs/socket-client/socket.io.min.js", //required for edit mode.
				"js/libs/redactor/redactor.js", //Inline content editing tool
				"js/libs/C_DynamicBackgroundImage.js", //Allows us to set an image background on all browsers
				"js/libs/mediaElement/mediaelement-and-player.js", //Our audio and video solution
				"js/libs/greensock/TweenMax.min.js", //Our animation library.
				"js/libs/jquery.swfobject.1-1-1.min.js", //Method to embed .swf files.
				"js/libs/jquery.nestable.js",
				//Import Cognizen layout templates
				"js/templates/C_LessonTitle.js", 
				"js/templates/C_StaticContent.js", //All text and static media pages - text, .jpg, .png, .swf
				"js/templates/C_TabbedContent.js", //Tabs can be added to static by power users but this is more user friendly.
				"js/templates/C_Reveal.js", //Reveal text upon clicking on an image.
				"js/templates/C_Flashcard.js",
				"js/templates/C_Unity3D.js", //Template for importing Unity 3D swf files - requires more than regular swf
				//Import Cognizen Knowledge Check templates
				"js/templates/C_MultipleChoice.js", //Multiple choice quizzing
				"js/templates/C_MultipleChoiceImage.js",
				"js/templates/C_Matching.js", //Matching quizzing
				//Import Cognizen Utilities
				"js/util/C_Index.js",
				"js/util/C_AddPage.js",
				"js/util/C_Glossary.js",
				"js/util/C_DocList.js",
				"js/util/C_ScrubContent.js",
				"js/util/C_NavControl.js",
				"js/util/C_UtilFunctions.js",
				"js/util/C_Sockets.js",
				"js/util/C_SCORM.js",
				"js/util/C_Comment.js",
				"js/libs/jquery.corner.js",
				"js/libs/modernizr.js",
				"js/libs/siofu/client.js",
				"js/libs/pretty-data.js",
				//Give mouse super powers.
				"js/libs/jquery.mousewheel-3.0.6.pack.js",
				//Lightbox for media popups and galleries.
				"js/libs/fancybox/jquery.fancybox.js",
				"js/libs/fancybox/jquery.fancybox-thumbs.js"
	], startEngine);
}

function startEngine(){
	initializeSockets();
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