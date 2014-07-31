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
	// Create new ieUserAgent object
	var ieUserAgent = {
	    init: function () {
	        // Get the user agent string
	        var ua = navigator.userAgent;
	        this.compatibilityMode = false;
	        
	        // Detect whether or not the browser is IE
	        var ieRegex = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
	        if (ieRegex.exec(ua) == null)
	            this.exception = "The user agent detected does not contain Internet Explorer.";
	 
	        // Get the current "emulated" version of IE
	        this.renderVersion = parseFloat(RegExp.$1);
	        this.version = this.renderVersion;

	        // Check the browser version with the rest of the agent string to detect compatibility mode
	        if(document.documentMode == 5 || document.documentMode == 6 || document.documentMode == 7 || document.documentMode == 8){
	        	this.compatibilityMode = true;
	        	this.version = document.documentMode;
	        }
	        else if (ua.indexOf("Trident/6.0") > -1) {
	            if (ua.indexOf("MSIE 7.0") > -1) {
	                this.compatibilityMode = true;
	                this.version = 10;                  // IE 10
	            }
	        }
	        else if (ua.indexOf("Trident/5.0") > -1) {      
	            if (ua.indexOf("MSIE 7.0") > -1 ||
	            	ua.indexOf("MSIE 8.0") > -1) {
	                this.compatibilityMode = true;
	                this.version = 9;                   // IE 9
	            }
	        }
	        //dashboard does not support IE8
            else if (ua.indexOf("MSIE 8.0") > -1) {
                this.compatibilityMode = true;
                this.version = 8;                   // IE 8
            }
	        else if (ua.indexOf("MSIE 7.0") > -1){
	            this.version = 7;                       // IE 7
	            this.compatibilityMode = true;     //not truly compatibilityMode IE7 is not supported
	        }
	        
	        else{
	        	this.compatibilityMode = false;
	            this.version = -1;                       // IE 6	        	
	        }

	    }
	};
	 
	// Initialize the ieUserAgent object
	ieUserAgent.init();

    var val = "IE" + ieUserAgent.renderVersion;
    if(ieUserAgent.renderVersion == 7){
    	val += " or Compatibility View";
    }
    if (ieUserAgent.compatibilityMode)
    {
        val += "<br/>Compatibility Mode (IE" + ieUserAgent.version + " emulation)";
        //alert(val);
    	$('body').empty();
		$('body').append("<div style=\"background-color: #FFFFFF\"> <p>We have detected the following IE browser: " + val + "<br/><br/>"+
			"This content has been tested on IE9+, Chrome, Firefox and Safari but does not support Compatibility Mode or Document Mode of \"Quirks Mode\", \"IE8 Standards\" and \"IE7 Standards\" in IE.<br/></p>"+
			"<p>Instructions for disabling Compatibility Mode:</p>"+
			"<ol><li>Go to tools (on the top) on Internet Explorer 8, 9 or 10.</li>"+
			"<li>Click on \"Compatibility View Settings\".</li>"+
			"<li>Uncheck \"Display intranet sites in Compatibility View.”  \".</li>"+
			"<li>Uncheck \"Display all websites in compatibility view\" if it is checked.</li>"+
			"<li>Click on \"Close\". You are now done. Please refresh the page.</li></ol></div>");
    }
    else{	
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
				"js/libs/jquery.nestable.js",
				"js/pretty-data.js", 
				"js/C_DynamicBackgroundImage.js", //Allows us to set an image background on all browsers
				"js/libs/greensock/TweenMax.min.js", //Our animation library.
				"js/templates/C_Login.js", //Secure login mechanism.
				"js/templates/C_Dashboard.js",
				"js/libs/jquery.cookie.js",
				"js/util/C_Outline.js", 
				"js/jquery.treeview.js",
				"js/listorder-min.js",
				"js/jquery.corner.js"
				], function($) {  
	    //Once all of the external js has loaded, build the application.
	    buildInterface();
	   
	});
	}
}

var oldIE = false;

function isOldIE() {
    "use strict";

    // Detecting IE
   
    if ($('html').is('.ie6, .ie7, .ie8', '.ie9')) {
        oldIE = true;
    }
    //console.log("isOldIE = " + oldIE);
}

/****************************************************
******************************** STEP 3 - BUILD SHELL
****************************************************/
//Place all permanent items in the UI - background - title - nav
function buildInterface(){
	
//	var url = cognizenServerUrl();
	//var xhr = true;
	//socket = (xhr) ? io.connect(null, {resource: "server", 'sync disconnect on unload' : true, transports: ["websockets", "xhr-polling"]}) :
                     //io.connect(null, {resource: "server", 'sync disconnect on unload' : true});
	
	if (isOldIE()){
		socket = io.connect(null, {resource: "server", transports: ["flashsocket", "xhr-polling"], 'sync disconnect on unload' : true, 'connect timeout': 1000});
		//console.log("saying is IE");
	}else{
		//console.log("not IE");
		socket = io.connect(null, {resource: "server", 'sync disconnect on unload' : true, 'connect timeout': 1000});
	}
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
