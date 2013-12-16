/*!
 * C_Engine
 * This file is the Main js file for the Cognizen
 * VERSION: Cognizen 1.0
 * VERSION DATE: 3/1/2013
 * CREATION DATE: 2013-01-16
 * JavaScript
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */

//VARIABLES
var cognizenServerPort = 8080;
var data;
var currentTemplate;//Object representing the current template - many can have types, which are a parameter for those classes.
var currentTemplateType;//String tracking the page type i.e. An instance of the most common template C_StaticContent() takes a type("left", "top", "text", "right", "bottom"). This allows one class to handle multiple layouts instead of creating much redundant code.
var transition = false;//Boolean set in xml/preferences section - true - animated transitions  false - jump cut from page to page.
var transitionType;
var transitionLength = 1;

var currentPage = 0;//Integer representing the current page
var currentPageID; //Needed for someone is sorting pages, may change node order and then a change would be sent to the wrong xml node.
var totalPages;//total pages in the presentation

var stageX;
var stageY;
var stageW;
var stageH;

var socket;

var user = {};

var mode = "prod";//mode can be set to production, edit and review.

// IE Fix for lack of console.log -- IE breaks down for console calls otherwise.
var alertFallback = true;

if (typeof console === "undefined" || typeof console.log === "undefined") {
    console = {};
    if (alertFallback) {
        console.log = function(msg) {
            //alert(msg);
        };
    } else {
        console.log = function() {};
    }
}


//var cognizenServerUrl = function() {
//    return [document.location.protocol, '//', document.location.hostname, ':', cognizenServerPort].join('');
//}
//
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
	    alert("unable to load content data")
    }
  });
});

/****************************************************
**************************** STEP 2 - LOAD JS Modules
****************************************************/
function initScripts(_data){
	data = _data;
	totalPages = $(data).find('page').length;
	mode = $(data).find('mode').attr("value");
	
	// This will prevent errors on slow connections.  We might need to set it to an actual number, as 0 means no timeout.
    require.config({
        waitSeconds: 0
    });
	//LOADING IN ALL OF THE EXTERNAL JS FILES
	require([	//Already included in require.js
				//Funtionality
				"js/libs/jqueryui/jquery-ui.min.js", //Theming engine.
				"js/jquery.ui.touch-punch.min.js", //Adds touch drag to touchscreen devices.
				"js/libs/socket.io-client/dist/socket.io.js",
				"js/libs/underscore-min.js", 
				//"js/jquery.fontface.js",
				"js/C_DynamicBackgroundImage.js", //Allows us to set an image background on all browsers
				"js/libs/greensock/TweenMax.min.js", //Our animation library.
				//"js/jquery.swfobject.1-1-1.min.js", //Method to embed .swf files.
				"js/templates/C_Login.js", //Secure login mechanism.
				//"js/templates/C_RandomMedia.js", //Template to display Adobe Edge packages.
				//"js/templates/C_LeaderBoard.js",//Load the multiplayer leaderBoard template.
				//"js/templates/C_MultiplayerQuiz.js", //Load the multiplayer quiz template.
				"js/templates/C_Dashboard.js",
				"js/libs/jquery.cookie.js", 
				"js/jquery.treeview.js",
				"js/listorder-min.js",
				"js/jquery.corner.js"
				], function($) {  
	    //Once all of the external js has loaded, build the application.
	    buildInterface();
	   
	});
}



/****************************************************
******************************** STEP 3 - BUILD SHELL
****************************************************/
//Place all permanent items in the UI - background - title - nav
function buildInterface(){
	
//	var url = cognizenServerUrl();
	var xhr = true;
	socket = (xhr) ? io.connect(null, {resource: "server", transports: ["websockets", "xhr-polling"]}) :
                     io.connect(null, {resource: "server"});

	//Simple listener checking connectivity
	socket.on('onConnect', function (data) {
	  	//console.log(data.bankPath);
	});

    socket.on('loadDashboardPage', function(status) {
        user = status.user;
        if (user) {
            currentTemplate = new C_Dashboard(currentTemplateType);
        }
        else {
            currentTemplate = new C_Login(currentTemplateType);
        }
        currentTemplate.initialize();
    });
	
	
	$('body').append("<div id='myCanvas'><div id='bg'></div><div id='stage'></div></div>");
	
	$("#bg").fitToBackgroundImage();
	//Utilized in many of the templates for positioning and autoScrolling
	//DO NOT REMOVE
	stageX = $("#stage").position().left;
	stageY = $("#stage").position().top;
	stageW = $("#stage").width();
	stageH = $("#stage").height();
			
	//Check if we are using transitions.  Set in preferences xml/Content.xml
	//if so, set them up. 
	transition = $(data).find('transition').attr('value');
	if(transition == "true"){
		transition = true;
		transitionType = $(data).find('transitionType').attr('value');
		transitionLength = $(data).find('transitionLength').attr('value');
	 }


	//Load the first page.
	loadPage();
}



/****************************************************
********************************** STEP 4 - LOAD PAGE
*****************************************************
**Details:
***Function is called from templates - last line of fadeComplete.
***utilizes this. namespace so that it can be referenced from external template files.
***Was placed like that to enable page fade tranistions.
***utilizes currentPage variable, which is an int representing a node in content .xml*/
//Function to load page content
this.loadPage = function(){
	currentTemplateType = $(data).find("page").eq(currentPage).attr('layout');
	currentPageID = $(data).find("page").eq(currentPage).attr("id");
    socket.emit('checkLoginStatus');
}

/*************************************************************
** Utility Funcitonality
*************************************************************/
function findNodeByID(){
	for(var i = 0; i < totalPages; i++){
		if(currentPageID == $(data).find("page").eq(i).attr("id")){
			return i;
			break;
		}
	}
}

function loadPageFromID(_id){
	for(var i = 0; i < totalPages; i++){
		if($(data).find("page").eq(i).attr("id") == _id){
			currentPage = i;
			currentTemplate.destroySelf();
			break;
		}
	}
}