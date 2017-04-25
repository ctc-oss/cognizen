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
var userID;
var mode = "production";//mode can be set to production, edit and review.
var clientReview = false;

var windowWidth = $('body').width();
windowHeight = $(window).height();  //this can be inaccurate and probably needs to go

var oldIE = false;
var isIE = false;
var isFF = false;
var isMobile = false;
var isMobilePhone = false;
var hasTouch = false;

var urlParams;

var dragFile = false;
var corePath = "../../../../core-files/";

var audioVolume = 0.8; //persistant audio volume between pages
var audioMute = false; //persistant audio mute state between pages

var cachedTextPreEdit;
var connected;
var audioPlayer;

var pageTitle;
var mediaHolder;
var audioHolder;

var counter;//For any timed countdowns. (set interval).
//var io;
//Accessibility control arrays.
var pageAccess_arr = [];
var globalAccess_arr = [];
var audioAccess_arr = [];
var courseData;
var searchEnabled = false; // #3559
/****************************************************
*********************************** STEP 1 - LOAD XML
****************************************************/
//LOAD THE XML AS SOON AS THE DOCUMENT IS READY
$(document).ready(function(){
	$("body").width(1024);
	$("body").append("<div class='C_Loader'><div class='C_LoaderText'>Loading content.xml</div></div>");
	$.ajax({
		type: "GET",
		url: "xml/content.xml",
		dataType: "xml",
		async: false,
		success: loadCourseXML,
		error: function(){
			alert("unable to load content.xml")
		}
	});
});


function loadCourseXML(_data){
	$('.C_LoaderText').text("Loading Course.xml");
	data = _data;
	var loc = window.location.pathname;
	var dir = loc.substring(0, loc.lastIndexOf('/'));
	var courseXMLPath = unescape(dir + '/../course.xml');
	$.ajax({
		type: "GET",
		url: courseXMLPath,
		dataType: "xml",
		async: false,
		success: initScripts,
		error: function(){
			alert("unable to load course.xml")
		}
	});
}

/****************************************************
**************************** STEP 2 - LOAD JS Modules
****************************************************/
function initScripts(_data){
	$('.C_LoaderText').text("Initializing scripts.");
	courseData = _data;
	////console.log(data);

	// Create new ieUserAgent object
	var ieUserAgent = {
	    init: function () {
	        // Get the user agent string
	        var ua = navigator.userAgent;
	        this.compatibilityMode = false;

	        // Detect whether or not the browser is IE
	        var ieRegex = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
	        if (ieRegex.exec(ua) == null){
	            this.exception = "The user agent detected does not contain Internet Explorer.";
	        }else{
	        	isIE = true;
	        }

	        // Get the current "emulated" version of IE
	        this.renderVersion = parseFloat(RegExp.$1);
	        this.version = this.renderVersion;

	        // Check the browser version with the rest of the agent string to detect compatibility mode
	        if(document.documentMode == 5 || document.documentMode == 6 || document.documentMode == 7){
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
	            if (ua.indexOf("MSIE 7.0") > -1) {
	                this.compatibilityMode = true;
	                this.version = 9;                   // IE 9
	            }
	        }
	        else if (ua.indexOf("Trident/4.0") > -1) {
	            if (ua.indexOf("MSIE 7.0") > -1) {
	                this.compatibilityMode = true;
	                this.version = 8;                   // IE 8
	            }
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
        val += " Compatibility Mode (IE" + ieUserAgent.version + " emulation)";
        //alert(val);
    	$('body').empty();
		$('body').append("<div style=\"background-color: #FFFFFF\"> <p>We have detected the following IE browser: " + val + "<br/><br/>"+
			"This content has been tested on IE8+, Chrome, Firefox and Safari but does not support Compatibility Mode or Document Mode of \"Quirks Mode\" and \"IE7 Standards\" in IE.<br/></p>"+
			"<p>Instructions for disabling Compatibility Mode:</p>"+
			"<ol><li>Go to tools (on the top) on Internet Explorer 8, 9 or 10.</li>"+
			"<li>Click on \"Compatibility View Settings\".</li>"+
			"<li>Uncheck \"Display intranet sites in Compatibility View.”  \".</li>"+
			"<li>Uncheck \"Display all websites in compatibility view\" if it is checked.</li>"+
			"<li>Click on \"Close\". You are now done. Please refresh the page.</li></ol></div>");
    }
    else{

		totalPages = $(data).find('page').length;
		var ckpath = corePath + "js/libs/ckeditor/ckeditor.js";
		var ckAdapath = corePath + "js/libs/ckeditor/adapters/jquery.js";
		mode = $(data).find('mode').attr("value");
		if(mode == "production" || mode == "Production" || mode == "prod"){
			corePath = "../";
			ckpath = '';
			ckAdapath = '';
		}

	    // This will prevent errors on slow connections.  We might need to set it to an actual number, as 0 means no timeout.
	    require.config({
	        waitSeconds: 0
	    });

	    /*require([corePath + 'js/libs/socket.io.js'], function(foo){
			io = foo;
		});*/
		//GATHERING AND LOADING ALL OF THE ENGINE PARTS
		require([
			//Funtionality/utilities
					corePath +"js/libs/jquery.min.js",
					corePath +"js/libs/jqueryui/jquery-ui.min.js",
					corePath +"js/libs/jquery.magnific-popup.js",
					corePath +"js/libs/SCORM_API_wrapper.js", //SCORM capabilities
					corePath +"js/libs/jquery.ui.touch-punch.min.js", //Adds touch drag to touchscreen devices.
					corePath +"js/libs/overthrow.min.js",
					ckpath,
					ckAdapath,
					corePath +"js/libs/C_DynamicBackgroundImage.js", //Allows us to set an image background on all browsers
					corePath +"js/libs/mediaElement/mediaelement-and-player.js", //Our audio and video solution
					corePath +"js/libs/velocity.min.js", //Our animation library.
					corePath +"js/libs/jquery.swfobject.1-1-1.min.js", //Method to embed .swf files.
					corePath +"js/libs/jquery.nestable.js",
					corePath +"js/libs/jquery.browser.js",
					corePath +"js/libs/jquery.corner.js",
					corePath +"js/libs/modernizr.js",
					corePath +"js/libs/siofu/client.js",
					corePath +"js/libs/socket.io/socket.io.min.js",
					corePath +"js/libs/underscore-min.js",
					corePath +"js/libs/pretty-data.js",
					corePath +"js/libs/jquery.alphanum.js",
					corePath +"js/libs/widget2chart.js",
					corePath +"js/libs/chart.min.js",
			//Import Cognizen layout templates
					corePath +"js/templates/C_Branching.js",
					corePath +"js/templates/C_Categories.js",
					corePath +"js/templates/C_Chaining.js",
					corePath +"js/templates/C_ClickImage.js",
					corePath +"js/templates/C_ClickListRevealText.js",
					corePath +"js/templates/C_Completion.js",
					corePath +"js/templates/C_Pathing.js",
					corePath +"js/templates/C_StaticContent.js", //All text and static media pages - text, .jpg, .png, .swf
					corePath +"js/templates/C_TabbedContent.js", //Tabs can be added to static by power users but this is more user friendly.
					corePath +"js/templates/C_Reveal.js", //Reveal text upon clicking on an image.
					corePath +"js/templates/C_Flashcard.js",
					corePath +"js/templates/C_Unity3D.js", //Template for importing Unity 3D swf files - requires more than regular swf
			//Import Cognizen Knowledge Check templates
					corePath +"js/templates/C_MultipleChoiceFancy.js",
					corePath +"js/templates/C_MultipleChoice.js", //Multiple choice quizzing
					corePath +"js/templates/C_MultipleChoiceImage.js",
					corePath +"js/templates/C_Matching.js", //Matching quizzing
					corePath +"js/templates/C_QuestionBank.js", //Matching quizzing
					corePath +"js/templates/C_Sequencing.js",
					corePath +"js/templates/C_TextInput.js",
					corePath +"js/templates/C_EssayCompare.js",
					corePath +"js/templates/C_Slider.js",
			//Import Cognizen Components
					corePath +"js/components/C_PageTitle.js",
					corePath +"js/components/C_VisualMediaHolder.js",
					corePath +"js/components/C_AudioHolder.js",
					corePath +"js/components/C_MediaBrowser.js",
			//Import Cognizen Utilities
					corePath +"js/util/C_Access.js",
					corePath +"js/util/C_AddPage.js",
					corePath +"js/util/C_API.js",
					corePath +"js/util/C_Comment.js",
					corePath +"js/util/C_DocList.js",
					corePath +"js/util/C_EditorToolbarFormat.js",
					corePath +"js/util/C_Glossary.js",
					corePath +"js/util/C_Index.js",
					corePath +"js/util/C_Lock.js",
					corePath +"js/util/C_NavControl.js",
					corePath +"js/util/C_ScrubContent.js",
					corePath +"js/util/C_SCORM.js",
					corePath +"js/util/C_Sockets.js",
					corePath +"js/util/C_UtilFunctions.js",
			//Give mouse super powers.
					corePath +"js/libs/jquery.mousewheel-3.0.6.pack.js",
					corePath +"js/libs/antiscroll.js"
		], loadStreamer);
	}
	if((ieUserAgent.renderVersion < 10) || (document.documentMode < 10)){
        oldIE = true;
	}
}

function loadStreamer(){
	require([corePath + 'js/libs/socket.io-stream'], function (foo) {
   		ss = foo;
   		ss.forceBase64 = true;
		startEngine();
	});
}

//VROOM VROOM
function startEngine(){

	//Enable popups from within the dialogs.
	$.widget("ui.dialog", $.ui.dialog, {
		_allowInteraction: function(event) {
			return !!$(event.target).closest(".cke_dialog").length || this._super(event);
		}
	});
	//Function found in C_Socket.js
	initializeSockets();
}

/****************************************************
******************************** STEP 3 - BUILD SHELL
****************************************************/
//Place all permanent items in the UI - background - title - nav

function checkFF(){
	isFF = typeof InstallTrigger !== 'undefined';
}


// MOBILE DETECTION
function checkMobile(){
	if(!oldIE){
		if(window.matchMedia("(max-device-width: 1023px), (max-device-height: 699px)").matches) {
			isMobile = true;
			//console.log("mobile device detected");
		}

		if(window.matchMedia("screen and (max-device-width: 599px)").matches) {
			isMobilePhone = true;
			//console.log("mobile phone detected");
		}

		// Detect touch device
		// from http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
		window.addEventListener('touchstart', function setHasTouch () {
			hasTouch = true;
			//console.log("touch device detected");
			// Remove event listener once fired, otherwise it'll kill scrolling
			// performance
			window.removeEventListener('touchstart', setHasTouch);
		}, false);
	}
}


function doOnOrientationChange(){
	// reload page if device is rotated
	stageX = $("#stage").position().left;
	stageY = $("#stage").position().top;
	stageW = $("#stage").width();
	stageH = $("#stage").height();
	if( (currentTemplateType!="essayCompare") && (currentTemplateType!="chaining") && (currentTemplateType!="branching") && (currentTemplateType!="questionBank") && (currentTemplateType!="pathing") ){
		loadPageFromID(currentPageID);
	}
}


function buildInterface(){
	checkFF();
	checkMobile();
	//added for handling of scorm handling of suspending of scoring data
	////////////////////////////////////////////
	//function in C_SCORM.js
	checkScorm();
	//function in C_NavControl.js
	ncInitialize();
	////////////////////////////////////////////
	try { clearInterval(counter); } catch (e){}
	$('body').empty();

	if (isMobilePhone){
		// add div that hides content in landscape orientation
		$('body').append("<div id='landscape'></div>");
	}
	if (isMobile){
		//console.log("mobile site");
		$('body').append("<div id='myCanvas'><div id='stage'></div><div id='courseTitle'></div><div id='lessonTitle'></div><div id='icon'></div><div id='panes'><div id='optional-panes'/><div id='nav-panes'/></div></div>");
	}else{
		//console.log("desktop site");
		$('body').append("<div id='outer'><div id='inner'><div id='myCanvas'><h1 id='courseTitle'></h1><h1 id='lessonTitle'></h1><div id='stage'></div><div id='panes'></div></div></div></div>");
	}

	//Set variables consumed by templates.
	stageX = $("#stage").position().left;
	stageY = $("#stage").position().top;
	stageW = $("#stage").width();
	stageH = $("#stage").height();

	if(forcedReviewer == true && justRelinquishedLock == false){
		forcedReviewAlert();
	}

	justRelinquishedLock  = false;

	//This call positions the background graphic - funciton is in C_DynamicBackgroundImage       /*************************Note: Will make this optional - allow them to use css background instead*/
	//Image can be updated in css/C_Engine.css and resides in css/images/ folder.
	$("#myCanvas").fitToBackgroundImage();

	//Place the course title.
	var courseTitle;
	if($(courseData).find('course').attr('coursedisplaytitle')){
		if($(courseData).find('course').attr('coursedisplaytitle') == ""){
			//$(data).find("coursedisplaytitle").attr("value", $(data).find("courseTitle").attr("value"));
			$(courseData).find('course').attr('coursedisplaytitle', $(data).find("courseTitle").attr("value"));
			if(mode == "edit"){
				sendCourseUpdate();
			}
		}
		courseTitle = $(courseData).find('course').attr('coursedisplaytitle');
	}else{
		$(courseData).find('course').attr('coursedisplaytitle', $(data).find("courseTitle").attr("value"));
		if(mode== "edit"){
			sendCourseUpdate();
		}
		courseTitle = $(courseData).find('course').attr('coursedisplaytitle');
	}


	$("#courseTitle").append(courseTitle);

	//Place the lesson title																	 /*************************Note: Will make this optional*/
	var lessonTitle;

	if($(data).find("lessondisplaytitle").length != 0 ){
		if($(data).find("lessondisplaytitle").attr("value") == ""){
			$(data).find("lessondisplaytitle").attr("value", $(data).find("lessonTitle").attr("value"));
		}
		lessonTitle = $(data).find("lessondisplaytitle").attr("value");

	}else{
		$(data).find("preferences").append($("<lessondisplaytitle>", data));
		$(data).find("lessondisplaytitle").attr("value", $(data).find("lessonTitle").attr("value"));
		lessonTitle = $(data).find("lessondisplaytitle").attr("value");
	}

	if(!lessonTitle){
		lessonTitle = $(data).find("lessonTitle").attr("value");
	}

	document.title = lessonTitle;
	$("#lessonTitle").append(lessonTitle);

	checkNav();
	if(mode == "edit"){
		addEditNav();
		//addMediaDrop();
		addObjEdit();
		addMediaBrowser();											////////////////////////////////////////////////////////// Comment out before push
	}

	if(mode == "edit" || mode == "review"){
		checkComment();
		checkLockMode();
	}

	//check if search is enabled.  if so set it up. #3559
	if($(data).find('search').length == 0){

		$(data).find("preferences").append($('<search>', data));
		$(data).find("search").attr("value", "false");
		searchEnabled = false;
	}else{
		var searchValue = $(data).find('search').attr('value');
		if(searchValue == "false" || searchValue == undefined){
			searchEnabled = false;
		}else{
			searchEnabled = true;
		}
	}

	checkIndex();
	checkGlossary();
	checkDocs();

	//checkScorm();

	// Determine if the default page should be loaded or if a specific ID as been requested.
	// Create a hidden element on the parent of iFrame with an id equal to startPageID,
	// this is the id of <page> you wish to direct the course to.
	var pageID = $("input[id$=startPageID]", window.parent.document).val();
	if (pageID != null && pageID != ''){
		loadPageFromID(pageID);
	}

	loadPage();

	if(mode == "edit" || mode == "review"){
		connected = socket.socket.connected;

		if(!connected){
			fireConnectionError();
		}
	}
	// detect rotated tablet
	if (isMobile && !isMobilePhone){
		window.addEventListener('orientationchange', doOnOrientationChange);
	}
}

/**
* sendUpdateWithRefresh
* @description Sends xml to the server to update and refreshes the xml upon success.
*/
function sendUpdateWithRefresh(_type){
	console.log("sendUpdateWithRefresh(" + _type + ")");
	connected = socket.socket.connected;

	if(connected){
		updateTotalGradedQuestions();
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
	}else{
		fireConnectionError()
	}
}

function sendCourseUpdate(){
	connected = socket.socket.connected;

	if(connected){
		//Serialize the xml and send it to nodejs using socket.
		var myData = $(courseData);
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
		socket.emit('updateCourseXMLWithRefresh', { my: xmlString });
	}else{
		fireConnectionError();
	}
}

function sendUpdate(){
	connected = socket.socket.connected;

	if(connected){
		updateTotalGradedQuestions();
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
	}else{
		fireConnectionError();
	}
}

function fireConnectionError(){
	var msg = '<div id="dialog-connectionLost" title="ALERT: Connection Lost">';
	msg += '<p>Your socket connection to the server has been compromised.</p>';
	msg += '<p>You must close this lesson (by clicking "OK" below) and relaunch it.</p>';
	msg += '</div>';

	//Add to stage.
	$("#stage").append(msg);

	//Make it a dialog
	$("#dialog-connectionLost").dialog({
		dialogClass: "no-close",
		modal: true,
		width: 550,
		close: function(event, ui){
			$("#dialog-connectionLost").remove();
		},
		buttons: {
			OK: function () {
				$(this).dialog("close");
				window.close();
			}
		}
	});
}

/*************************************************************
** Changes the styling when the browser window is resized
*************************************************************/
$(window).resize(function(){
	windowWidth = $('body').width();
	windowHeight = $(window).height();
    $("#myCanvas").fitToBackgroundImage();
});