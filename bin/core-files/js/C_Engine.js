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
var currentTemplate;//Object representing the current template - many can have types, which are a parameter for those classes.
var currentTemplateType;//String tracking the page type i.e. An instance of the most common template C_StaticContent() takes a type("left", "top", "text", "right", "bottom"). This allows one class to handle multiple layouts instead of creating much redundant code.
var transition = false;//Boolean set in xml/preferences section - true - animated transitions  false - jump cut from page to page.
var transitionType;
var transitionLength = 1;
var masterIndex = false;
var indexState = false;
var indexClosePos = 0;
var indexClosePosMobile = 0;
var glossary = false;
var glossaryState = false;
var glossaryClosePos = 0;
var glossaryClosePosMobile = 0;
var docs = false;
var totalDocs = 0;
var docState = false;
var docClosePos = 0;
var docClosePosMobile = 0;
var totalGlossary = 0;
var pageCount = false;
var currentPage = 0;//Integer representing the current page
var currentPageID; //Needed for someone is sorting pages, may change node order and then a change would be sent to the wrong xml node.
var totalPages;//total pages in the presentation
var nextBack = false;
var nextDisabled = true;
var backDisabled = false;
var currentIndexItem = 'indexMenuItem0';
var socket;
var cognizenSocket;
var siofu;
var siofuInitialized = {};
var pushedUpdate = false;//edit mode, live communication stuff...
var newPageAdded = false;
var indexItem_arr = [];
var stageX;
var stageY;
var stageH;
var stageW;

var hoverSubNav = false;
var sectionLength = 0;
var scored = false;
var passScore = 0;
var restartOnFail = false;
var totalQuestions;
var questionResponse_arr;
var mandatoryInteraction = false;

var isLinear = false;
var tracking_arr;

var commentsOpen = false;

var mode = "production";//mode can be set to production, edit and review.

var isScorm = false;//indicates if is a SCORM course
var lessonStatus;//holds the status of the SCORM lesson
var lmsConnected = false;//indicates if connected to the LMS
var scorm;//Set after script is initialized. = pipwerks.SCORM;//var for SCORM API wrapper

var mobileWidth = 1023; //value should match the value set in C_Engine.css (@media all and (max-width: 600px) )
var windowWidth = $('body').width();
var pageType_arr = ["textOnly", "graphicOnly", "top", "left", "right", "bottom", "sidebar", "tabsOnly", "revealRight", "revealBottom", "revealTop", "revealLeft", "flashcardText", "flashcardMedia", "multipleChoice", "matching"/*",multipleSelect", "multipleChoiceImageTop", "multipleChoiceImageLeft", "multipleChoiceImageRight", "multipleSelectImageTop",  "matchingDrag", "unity", "tabsLeft", "unityOnly", "tabbedContentMedia"*/];
windowHeight = $(window).height();

var xhr = true;
var urlParams;
var pageComments;

var dragFile = false;

// IE Fix for lack of console.log -- IE breaks down for console calls otherwise.
var alertFallback = true;

var secureSocket = window.location.protocol == 'https:';

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


function checkFileApi(){ 
    if(window.File && window.FileReader){
	    dragFile = true;
    }
}

checkFileApi()

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
	totalPages = $(data).find('page').length;
	mode = $(data).find('mode').attr("value");
	
	//If this is a graded exercise, track the questions.  Am marking questions as graded so that you can have questions that ARE NOT scored as well...
	if($(data).find('scored').attr("value") == 'true'){
		scored = true;
		
		if($(data).find('restartOnFail').attr("value") == 'true'){
			restartOnFail = true;
		}
		questionResponse_arr = [];
		for(var i = 0; i < totalPages; i++){
			if($(data).find("page").eq(i).attr('graded') == "true"){
				var userSelection_arr = [];
				var question_obj = new Object();
				question_obj.complete = false;
				question_obj.correct = null;
				question_obj.id = $(data).find('page').eq(i).attr('id');
				question_obj.userAnswer = userSelection_arr;
				questionResponse_arr.push(question_obj);
			}
		}
		passScore = $(data).find('minScore').attr("value") / 100;
	}
	//END OF SCORING SET UP.
	
	//If the course is linear - must complete page by page - setup a page completion tracking array.
	if($(data).find('linear').attr("value") == 'true'){
		isLinear = true;
		tracking_arr = [];
		for(var i = 0; i < totalPages; i++){
			var page_obj = new Object();
			page_obj.id = $(data).find('page').eq(i).attr('id');
			page_obj.complete = false;
			tracking_arr.push(page_obj);
		}
	}
	//END OF TRACKING SET UP.

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
				"js/util/C_ScrubContent.js",
				"js//libs/jquery.corner.js",
				"js/libs/modernizr.js",
				"js/libs/siofu/client.js",
				//Give mouse super powers.
				"js/libs/jquery.mousewheel-3.0.6.pack.js",
				//Lightbox for media popups and galleries.
				"js/libs/fancybox/jquery.fancybox.js",
				"js/libs/fancybox/jquery.fancybox-thumbs.js"
	], initializeSockets);
}

function initializeSockets(){
	if(mode == "edit"){
	    urlParams = queryStringParameters();
		//if we are in edit or review mode establish a socket to the server.
	    cognizenSocket = (xhr) ? io.connect(null, {resource: 'server', transports: ["websockets", "xhr-polling"], 'force new connection': true, secure: secureSocket}) :
	                             io.connect(null, {resource: 'server', 'force new connection': true, secure: secureSocket});
	    
	    cognizenSocket.emit('userPermissionForContent', {
        	content: {type: urlParams['type'], id: urlParams['id']},
			user: {id: urlParams['u']}
        });

	    cognizenSocket.on("contentPermissionFound", function(data){
			if(data.permission == "admin" || data.permission == "editor"){
				mode = "edit";
			}else if(data.permission == "reviewer"){
				mode = "review";
			}
			 
			buildInterface();  
	    });
	    
	    cognizenSocket.on('connect_failed', function(){
	    	buildInterface();
    		alert('There is an error connecting to the production server. You can only view content.');
		});

	    cognizenSocket.on('commentAdded', function (data) {
	        	cognizenSocket.emit('getContentComments', {
				contentId: urlParams['id'],
				pageId: $(data).find("page").eq(currentPage).attr("id")
			});
	        commentsOpen = true;
	        updateIndexCommentFlags();
	    });
	    
	    cognizenSocket.on("packageLinkAlert", function(data){
		    var msg = '<div id="dialog-dlPackage" title="Retrieve your package"><p class="validateTips">A mail has been sent to you with a link for your package.</p><p>You can also download your content package by clicking the link below:<br/><br><a href='+data.path+' target="_blank">GET PACKAGE</a></p></div>';

		
			//Add to stage.
			$("#stage").append(msg);
		
			//Make it a dialog
			$("#dialog-dlPackage").dialog({
				modal: true,
				width: 550,
				close: function(event, ui){
						$("#dialog-dlPackage").remove();
					},
				buttons: {
					Close: function () {
		                    $(this).dialog("close");
					}
				}
			});
	    });
	    
	    cognizenSocket.on('retrievedContentComments', function (data) {
	         if(pageComments && pageComments.length > 0){
		         pageComments.length = 0;
	         }
	         pageComments = data;

	        if(commentsOpen == true){
		         refreshPageComments();
			    $("#commentInputText").empty();
	        }
	        
	        if(mode == "edit" || mode == "review"){
	        	if(pageComments.length > 0){
	        		$("#comment").removeClass('commentOpen');
					$("#comment").removeClass('commentClosed');
	        		var last = pageComments.length - 1;
		   		var status = pageComments[last].status;
		   		
		        	if(status == 'new' || status == 'inprogress'){
		        		$("#comment").addClass('commentOpen');
		        	}else{
			        	$("#comment").addClass('commentClosed');
		        	}
		      }else{
		      	$("#comment").removeClass('commentOpen');
		      	$("#comment").removeClass('commentClosed');
		      }  
	        }

	    });
	    
	    cognizenSocket.on("updateCommentIndex", function(data){
		  if(data && data.length > 0){
			  if(urlParams['id'] == data[0].contentId){
				  for(var i = 0; i < data.length; i++){
					  for(var j = 0; j < indexItem_arr.length; j++){
						  if(data[i].pageId == $(indexItem_arr[j]).attr('myID')){
							  $(indexItem_arr[j]).children("#commentSpot").removeClass("indexItemWithOpenComment");
							  $(indexItem_arr[j]).children("#commentSpot").removeClass("indexItemWithClosedComment");
							  if(data[i].status == 'closed'){
								$(indexItem_arr[j]).children("#commentSpot").addClass("indexItemWithClosedComment");  
							  }else{
							  	$(indexItem_arr[j]).children("#commentSpot").addClass("indexItemWithOpenComment");
							  }
						  }
					  }
				  }
				  cognizenSocket.emit('getContentComments', {
					contentId: urlParams['id'],
					pageId: $(data).find("page").eq(currentPage).attr("id")
				  });  
			   }
			}
	    });

	    cognizenSocket.on('commentNotAdded', function (data) {
	        //console.log('FOO');
	    });

	    siofu = new SocketIOFileUpload(cognizenSocket);

		socket = (xhr) ? io.connect(null, {resource: urlParams['id'], transports: ["websockets", "xhr-polling"], 'force new connection': true, secure: secureSocket}) :
                         io.connect(null, {resource: urlParams['id'], 'force new connection': true, secure: secureSocket});
		
		//Simple listener checking connectivity
		socket.on('onConnect', function (data) {
            //console.log('connected to cserver' + data);
		});
		
		socket.on('siofu_progress', function (data) {
            //console.log('progress data: ' + data);
		});
		

		socket.on('updateXMLWithRefreshComplete', function(){
            cognizenSocket.emit('contentSaved', {
                content: {type: urlParams['type'], id: urlParams['id']},
                user: {id: urlParams['u']}
            });
            updateIndex();
		});

        socket.on('pushUpdateXMLWithRefreshComplete', function(){
            pushedUpdate = true;
            cognizenSocket.emit('contentSaved', {
                content: {type: urlParams['type'], id: urlParams['id']},
                user: {id: urlParams['u']}
            });
            updateIndex();
        });
	}else{
		buildInterface();
	}
	
}


var queryStringParameters = function() {
	var match,
     pl     = /\+/g,  // Regex for replacing addition symbol with a space
	search = /([^&=]+)=?([^&]*)/g,
	decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
	query  = window.location.search.substring(1);

	var urlParams = {};
	while (match = search.exec(query)) {
		urlParams[decode(match[1])] = decode(match[2]);
	}
	return urlParams;
}


function refreshPageComments(){
	$("#pageComments").empty();
	
	var even = true;

	for(var i = 0; i < pageComments.length; i++){
		var myFirstName = pageComments[i].user.firstName;
		var myLastName = pageComments[i].user.lastName;
		var myTime = pageComments[i].created;
		var myComment = pageComments[i].comment;
		
		if(even == true){
			$("#pageComments").append("<div class='commentHolder'><div class='commentHeaderEven'>" + myFirstName + " " + myLastName + " posted at " + myTime + "</div><div class='commentItemEven'>"+ myComment +"</div></div>");
		}else{
			$("#pageComments").append("<div class='commentHolder'><div class='commentHeaderOdd'>" + myFirstName + " " + myLastName + " posted at " + myTime + "</div><div class='commentItemOdd'>"+ myComment +"</div></div>");
		}
		if(even == true){
			even = false;
		}else{
			even = true;
		}
	}
	
	 $(".nano").nanoScroller({
      	flashDelay: 4000,
		flash: true,
		sliderMaxHeight: 350,
		scroll: 'bottom'
	});
}

/****************************************************
******************************** STEP 3 - BUILD SHELL
****************************************************/
//Place all permanent items in the UI - background - title - nav
function buildInterface(){
	scorm = pipwerks.SCORM;

	$('body').empty();
	$('body').append("<div id='outer'><div id='inner'><div id='myCanvas'><div id='stage'></div><div id='courseTitle'></div><div id='lessonTitle'></div><div id='panes'></div></div></div></div>");

	//Set variables consumed by templates.
	stageX = $("#stage").position().left;
	stageY = $("#stage").position().top;
	stageW = $("#stage").height();
	stageH = $("#stage").height();

	//Check if we are using next and back - if so, set em up.
	//Positioning can be updated in css/C_Engine.css
	//Style is tied to the selected jquery ui theme set in index.
	nextBack = $(data).find('nextBack').attr('value');
	if(nextBack == "true"){
		nextBack = true;
		$("#myCanvas").append("<button id='back'>back</button><button id='next'>next</button>");
	}

	//Check if we are using page counter - if so, set it up.
	//Positioning can be updated in css/C_Engine.css
	pageCount = $(data).find('pageCount').attr('value');
	if(pageCount == "true"){
		pageCount = true;
		$('#myCanvas').append("<div id='pageCount'></div>");
		updatePageCount();
	}

	//Check if we are using transitions.  Set in preferences xml/Content.xml
	//if so, set them up.
	transition = $(data).find('transition').attr('value');
	if(transition == "true"){
		transition = true;
		transitionType = $(data).find('transitionType').attr('value');
		transitionLength = $(data).find('transitionLength').attr('value');
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


	 //Style the Back Button and give it its listener
	 $("#back").button({
		icons:{
			primary: 'ui-icon-circle-triangle-w'
		}
	});

	//Style the Next Button and give it its listener
	$("#next").button({
		icons:{
			secondary: 'ui-icon-circle-triangle-e'
		}
	});


	if(mode == "edit"){
		$('#myCanvas').append(	"        <form id='scormform' title='Scorm Version'>"+
							"           <select id='scormVersion'>"+
							"			<option>2004_4th</option>"+
							"			<option>2004_3rd</option>"+
							"			<option>1.2</option>"+
							"		</select></form>"+
							"		<div id='publish' class='btn_publish' title='Publish Project'></div>");
		$("#scormform").tooltip();

		$("#publish").tooltip().click(clickPublish);

		$("#myCanvas").append("<div id='preferences' class='btn_preferences' title='Set Project Preferences'></div>");
		$("#preferences").tooltip().click();


	}
	
	if(mode == "edit" || mode == "review"){
		$("#myCanvas").append("<div id='comment' class='btn_comment' title='Add a Page Comment'></div>");
		$("#comment").tooltip().click(function(){
			var pageNumber = currentPage + 1;
			
			//Create the Comment Dialog
			$("#stage").append("<div id='commentDialog' title='Comments for Page "+ pageNumber + ": " + $(data).find("page").eq(currentPage).find('title').text() + "'><div id='commentDisplayHolder' class='nano'><div id='pageComments' class='commentDisplay overthrow content'></div></div><div id='commentInputText' class='commentInput' type='text'>Add Comment Here...</div><label id='label'>Resolved: </label><input id='commentStatus' type='checkbox' name='status' class='radio' value='true'/><br/></div>");
			
						
			if(pageComments.length > 0){
				var last = pageComments.length - 1;
				var myStatus = pageComments[last].status;
				if(myStatus == 'new' || myStatus == 'inprogress'){
					$("#commentStatus").removeAttr("checked");
				}else{
					$("#commentStatus").attr("checked", 'checked');
				}
			}
			
			//Toggle to switch formatting of comments to alternate....
			var even = true;

			for(var i = 0; i < pageComments.length; i++){
				var myFirstName = pageComments[i].user.firstName;
				var myLastName = pageComments[i].user.lastName;
				var myTime = pageComments[i].created;
				var myComment = pageComments[i].comment;
				
				if(even == true){
					$("#pageComments").append("<div class='commentHolder'><div class='commentHeaderEven'>" + myFirstName + " " + myLastName + " posted at " + myTime + "</div><div class='commentItemEven'>"+ myComment +"</div></div>");
				}else{
					$("#pageComments").append("<div class='commentHolder'><div class='commentHeaderOdd'>" + myFirstName + " " + myLastName + " posted at " + myTime + "</div><div class='commentItemOdd'>"+ myComment +"</div></div>");
				}
				if(even == true){
					even = false;
				}else{
					even = true;
				}
			}



			//Style it to jQuery UI dialog
			$("#commentDialog").dialog({
				autoOpen: true,
				modal: true,
				width: 600,
				height: 625,
				buttons:{
					Close: function(){
						$( this ).dialog( "close" );
						commentsOpen = false;
					},
					Save: function(){
						var myStatus;
						if($("#commentStatus").prop("checked") == true){
							myStatus = 'closed';
						}else{
							myStatus = 'inprogress';
						}
						cognizenSocket.emit('addComment', {
							user: {id: urlParams['u']},
							content: {type: urlParams['type'], id: urlParams['id']},
							page: {id: $(data).find("page").eq(currentPage).attr("id")},
							text: $("#commentInputText").getCode(),
							status: myStatus
						});
					}
				},
				close: function(){
					$("#commentDialog").remove();
				}
			});

			$("#commentInputText").redactor({
				focus: true,
				buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'link', 'fontcolor', 'backcolor']
			});
			 
			 //Set Scrollbar for comments if one is needed...
			 $(".nano").nanoScroller({
                	flashDelay: 4000,
			 	flash: true,
			 	sliderMaxHeight: 350,
			 	scroll: 'bottom'
			 });

		});
		
		$("#myCanvas").append("<div id='toggleMode' class='toggleOn' title='Toggle edit mode.'></div>");
		$("#toggleMode").tooltip().click(function(){
			if($("#toggleMode").hasClass('toggleOn')){
				$("#toggleMode").removeClass("toggleOn");
				$("#toggleMode").addClass("toggleOff");
				$("#scormform").hide();
				$("#publish").hide();
				$("#preferences").hide();
				$("#comment").hide();
				$("#addPage").hide();
				$("#audioDrop").hide();				
				mode = "prod";
			}else{
				$("#toggleMode").removeClass("toggleOff");
				$("#toggleMode").addClass("toggleOn");
				$("#scormform").show();
				$("#publish").show();
				$("#preferences").show();
				$("#comment").show();
				$("#addPage").show();
				$("#audioDrop").show();
				mode = "edit";
			}
			currentTemplate.fadeComplete();
		});

	}

	//Place panels - index, glossary, resources, references, others...
	if($(data).find('masterIndex').attr('value') == "true"){
		masterIndex = true;
		
		$('#panes').append("<div id='indexPane' class='pane'><div id='indexTab' class='paneTab' title='click here to toggle content index'/></div>");
		
		//Set index tab action to open and close the index.
		$('#indexTab').click(toggleIndex).tooltip();

		addIndex();
	}

	//Set up Glossary pane.
	if($(data).find('glossary').attr('value') == "true"){
		glossary = true;
		addGlossary();
	}
	
	//Set up Doc pane, if needed...
	totalDocs = $(data).find('docItem').length;
	if(totalDocs > 0){
		docs = true;
		addDocs();
	}

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
	if(isLinear == true){
		updateTracking();
	}
	
	if($(data).find("page").eq(currentPage).attr("graded") == "true"){
		mandatoryInteraction = true;
	}else{
		mandatoryInteraction = false;
	}
	
	if(mode == "edit" || mode == "review"){
		if(pageComments && pageComments.length > 0){
			pageComments.length = 0;
	     }
		
		cognizenSocket.emit('getContentComments', {
			contentId: urlParams['id'],
			pageId: $(data).find("page").eq(currentPage).attr("id")
		});
	}


	//Check if nave buttons should be disabled.
	checkNavButtons();
	updatePageCount();

	currentTemplateType = $(data).find("page").eq(currentPage).attr('layout');
	currentPageID = $(data).find("page").eq(currentPage).attr("id");
	if(isScorm){
		if(scorm.VERSION == "1.2"){
			scorm.set("cmi.core.lesson_location", currentPageID);
			scorm.set("cmi.core.exit", "suspend");
		}
		else if(scorm.VERSION.substring(0,4) == "2004"){
			scorm.set("cmi.location", currentPageID);
			scorm.set("cmi.exit", "suspend");
		}


	}


	switch (currentTemplateType) {
		//Satic Layouts
		case "group":
			currentTemplate = new C_LessonTitle(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "textOnly":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "graphicOnly":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "top":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "left":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "right":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "bottom":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "sidebar":
			currentTemplate = new C_StaticContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		//Interactive Layouts
		case "tabsOnly":
			currentTemplate = new C_TabbedContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "tabsLeft":
			currentTemplate = new C_TabbedContent(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "revealRight":
			currentTemplate = new C_Reveal(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "revealBottom":
			currentTemplate = new C_Reveal(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "revealTop":
			currentTemplate = new C_Reveal(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "revealLeft":
			currentTemplate = new C_Reveal(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "flashcardText":
			currentTemplate = new C_Flashcard(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "flashcardMedia":
			currentTemplate = new C_Flashcard(currentTemplateType);
			currentTemplate.initialize();
			break;
		//Knowledge Check Layouts
		case "multipleChoice":
			currentTemplate = new C_MultipleChoice(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleSelect":
			currentTemplate = new C_MultipleChoice(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleChoiceImageTop":
			currentTemplate = new C_MultipleChoiceImage(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleChoiceImageLeft":
			currentTemplate = new C_MultipleChoiceImage(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleChoiceImageRight":
			currentTemplate = new C_MultipleChoiceImage(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleSelectImageTop":
			currentTemplate = new C_MultipleChoiceImage(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "matching":
			currentTemplate = new C_Matching(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "matchingDrag":
			currentTemplate = new C_Matching(currentTemplateType);
			currentTemplate.initialize();
			break;
		//UNITY SWF Layouts
		case "unity":
			currentTemplate = new C_Unity3D(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "unityOnly":
			currentTemplate = new C_Unity3D(currentTemplateType);
			currentTemplate.initialize();
			break;
	}
}

/****************************************************
********************************** TABS
*****************************************************
*Details:
*** Positioning can be updated in the css/C_Engine.css*/


//addIndex
//If masterIndex == true  add the index.

function updateMenuItems(){
	if(isLinear == true){
		for(var i = 0; i < tracking_arr.length; i++){
			var thisID = "indexMenuItem"+i;
			if(tracking_arr[i].complete == true){
				$("#" + thisID).removeClass('ui-state-disabled').addClass('indexMenuVisited');
			}else{
				$("#" + thisID).addClass('ui-state-disabled');
			}
		}
	}else{
		var thisID = "indexMenuItem"+currentPage;
		$("#" + thisID).addClass('indexMenuVisited').toggleClass('ui-state-disabled').siblings().removeClass('ui-state-disabled');
	}
}


var updateOutput = function(e){
	var list   = e.length ? e : $(e.target),
        output = list.data('output');
    if (window.JSON) {
    	console.log((window.JSON.stringify(list.nestable('serialize'))));//, null, 2));
    } else {
    	output.val('JSON browser support required for this demo.');
    }
};

function checkForGroup(_id){
	var virgin = true;
	for(var i = 0; i < indexGroupID_arr.length; i++){
		if(indexGroupID_arr[i] == _id){
			virgin = false;
		}
	}
	if(virgin == true){
		indexGroupID_arr.push(_id);
	}
	return virgin;
}

var indexGroupID_arr

function addIndex(){
	indexItem_arr = [];
	totalPages = $(data).find('page').length;
	$("#indexPane").append("<div id='indexContent' class='paneContent'></div>");
	
	if(mode == "edit"){
		$("#indexContent").addClass('indexContentEdit');
		$("#indexPane").append("<div id='addPage'>Add a New Page</div>");//<div id='removePage'>Remove</div>");
		$("#addPage").button({
			icons:{
				primary: 'ui-icon-circle-plus'
			}
		}).click(addPage);

		/*$("#removePage").button({
			icons:{
				primary: 'ui-icon-circle-minus'
			}
		}).click(removePage);*/
	}

	//loop through the xml and add items to index.
	var thisID;
	var groupMode;
	indexGroupID_arr = [];
	
	var indexString = '<div class="dd" id="C_Index"><ol class="dd-list">';
	for(var i = 0; i < totalPages; i++){
		thisID = "indexMenuItem" + i;
		var pageID = $(data).find("page").eq(i).attr("id");
		if($(data).find("page").eq(i).attr("type") == "group"){
			//Resolves issue of group butting into group...
			if(groupMode == true){
				indexString += '</ol></li>';
			}
			groupMode = true;
			
			var isVirgin = checkForGroup(thisID);
			if(isVirgin){
				indexString += '<li id="'+pageID+'"class="dd-item dd3-item" data-id="'+ i + '">';
				if(mode == "edit"){
					indexString += '<div class="dd-handle dd3-handle">Drag</div>';
				}
				indexString += '<div id="'+thisID+'" class="dd3-content" tag="'+i+'" myID="'+$(data).find("page").eq(i).attr("id")+'">'+$(data).find("page").eq(i).find("title").first().text() +'</div><ol class="dd-list">';
			}
		}else{
			if($(data).find("page").eq(i).parent().attr("type") != "group"){
				if(groupMode == true){
					groupMode = false;
					indexString += '</ol></li>';
				}
			}
			indexString += '<li id="'+pageID+'" class="dd-item dd3-item" data-id="'+i+'">';
			//If edit mode attach drag spot - otherwise don't....
			if(mode == "edit"){
				indexString += '<div class="dd-handle dd3-handle">Drag</div>';
			}
			indexString += '<div id="'+thisID+'" class="dd3-content" tag="'+i+'" myID="'+$(data).find("page").eq(i).attr("id")+'">'+ $(data).find("page").eq(i).find('title').first().text() +'<div id="commentSpot"></div></div></li>';
		}
		indexItem_arr.push("#" + thisID);
	}
	
	indexString += "</ol></div>";
	
	$("#indexContent").append(indexString);
	
	var oldNodePos;
	var newNodePos;
	var oldParent;
	var newParent;
	var startChild = false; //If dragged object started as a child or root
	var startParent; //If dragged object started as a child - what was it's parent.
	var startChildrenLength; //Used to calculate top
	
	$('#C_Index').nestable({maxDepth: 2})
		.on('change', function(){
			//console.log("onChange");
		})
		.on('start', function(e, _item){
			oldNodePos = _item.attr('data-id');
			for(var i = 0; i < startList.length; i++){
				if(oldNodePos == startList[i].id){
					startChild = false;
					break;
				}
				if(startList[i].children){
					for(var j = 0; j < startList[i].children.length; j++){
						if(oldNodePos == startList[i].children[j].id){
							startChild = true;
							startParent = i;
							startChildrenLength = startList[i].children.length;
							break;
						}
					}
				}
			}
		})
		.on('stop', function(e, _item){
			//updateOutput($('#C_Index').data('output', $('#nestable-output')));
			newNodeID = _item.attr('id');
			//Convert list to JSON list
			var tmp = $('#C_Index').data('output', $('#nestable-output'));
			var tmpList   = tmp.length ? tmp : $(tmp.target);
			var list = tmpList.nestable('serialize');
			var listJSON = window.JSON.stringify(list);
			var isChild = false;
			var childParent;
			var moveUp = false;
			var isSub = false;
			var createNewGroup = false;
			var addToGroup = false;
			
			if(listJSON != startListJSON){
				var iterator = 0;
				for(var i = 0; i < list.length; i++){
					//IS A ROOT NODE
					if(oldNodePos == list[i].id){
						newNodePos = iterator;
						//Check if started as a child if so - if iterator is == to it being last in parent node them move up level for xml.
						if(startChild){
							if(iterator == startChildrenLength + startParent){
								newNodePos = startParent;
								moveUp = true;
							}
						}
						break;
					}
					iterator++;
					if(list[i].children){
						for(var j = 0; j < list[i].children.length; j++){
							//IS A CHILD NODE

							if(oldNodePos == list[i].children[j].id){
								isChild = true;
								childParent = list[i].id;
								newNodePos = iterator;
								if($(data).find("page").eq(childParent).attr("type") == "group"){
									addToGroup = true;	
								}else{
									createNewGroup = true;
								}
								break;
							}
							iterator++;
						}
					}
				}
				if(addToGroup){
					$(data).find("page").eq(oldNodePos).appendTo($(data).find("page").eq(childParent));
				}else if (createNewGroup){
					$(data).find("page").eq(oldNodePos).insertBefore($(data).find("page").eq(newNodePos));
					var secondID = $(data).find("page").eq(newNodePos).attr("id");
					//Create a Unique ID for the page
					var myID = guid();
					//Place a page element
					$(data).find("page").eq(childParent).before($('<page id="'+ myID +'" layout="group" type="group"></page>'));
					
					//Place the page title element
					$(data).find("page").eq(childParent).append($("<title>"));
					var newPageTitle = new DOMParser().parseFromString('<title></title>',  "application/xml");
					var titleCDATA = newPageTitle.createCDATASection("New Group Title");
					$(data).find("page").eq(childParent).find("title").append(titleCDATA);
					$(data).find("page").eq(childParent).append($("<content>"));
					var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
					var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
					$(data).find("page").eq(childParent).find("content").append(contentCDATA);
					$(data).find("page").eq(childParent).attr("type", "group");
					
					if(isLinear == true){
						var page_obj = new Object();
						page_obj.id = myID;
						page_obj.complete = false;
						tracking_arr.push(page_obj);
					}
					
					for(var i = 0; i < $(data).find("page").length; i++){
						if($(data).find("page").eq(i).attr("id") == myID){
							var newGroupSpot = i;
							var newSub = i+1;
						}
					}
					$(data).find("page").eq(newSub).appendTo($(data).find("page").eq(newGroupSpot));
					
					for(var i = 0; i < $(data).find("page").length; i++){
						if(secondID == $(data).find("page").eq(i).attr("id")){
							var tmpID = i;
						}
					}
					$(data).find("page").eq(tmpID).appendTo($(data).find("page").eq(newGroupSpot));
					
				}else if(newNodePos < oldNodePos && moveUp == false || isSub){
					$(data).find("page").eq(oldNodePos).insertBefore($(data).find("page").eq(newNodePos));
				}else{
					$(data).find("page").eq(oldNodePos).insertAfter($(data).find("page").eq(newNodePos));
				}
				sendUpdateWithRefresh();
			}
		});
		
	var tmpStart = $('#C_Index').data('output', $('#nestable-output'));
	var tmpStartList   = tmpStart.length ? tmpStart : $(tmpStart.target);
	var startList = tmpStartList.nestable('serialize');
	var startListJSON = window.JSON.stringify(startList);
	//Start with all closed...
	if(mode != "edit"){	
		$('#C_Index').nestable('collapseAll');
	}
	
	//Set the button functions
	for (var i = 0; i < indexItem_arr.length; i++){
		addRollovers($(indexItem_arr[i]));
		$(indexItem_arr[i]).click(function(){
			if(hoverSubNav == false){
				loadPageFromID($(this).attr("myID"));
				if(indexState){
					toggleIndex();
				}
			}
		});
	}

	if(pushedUpdate == true){
		currentTemplate.fadeComplete();
		pushedUpdate = false;
	}
	
	if(mode == "edit" || mode == "review"){
		updateIndexCommentFlags();
	}
	
	updatePageCount();
	//updateOutput($('#C_Index').data('output', $('#nestable-output')));

}
//Index end.

function removePage(myNode){
	if(myNode == undefined){
		myNode = currentPage;
	}
	//Create the Dialog
	$("#stage").append("<div id='dialog-removePage' title='Remove Current Page'><p>Are you sure that you want to remove this page from your content?</p></div>");
	//Style it to jQuery UI dialog
	$("#dialog-removePage").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
			$("dialog-removePage").remove();
		},
		buttons: {
			Yes: function(){
				if(totalPages > 1){
					$(data).find("page").eq(myNode).remove();
					if(currentPage == myNode){
						if(currentPage == 0){
							currentPage++;
						}else{
							currentPage--;
						}
						//Load either previous or next page if you are removing the currentPage...
						currentPageID = $(data).find("page").eq(currentPage).attr("id");
						currentTemplate.fadeComplete();
					}
					sendUpdateWithRefresh();
				}else{
					$("#stage").append("<div id='dialog-removePageError' title='Error Removing Page'><p>Your content must have at least one page.</p><p>If you would like to remove this page you must first create another and then remove it.</p></div>");
					$("#dialog-removePage").dialog({
						modal: true,
						width: 550,
						close: function(event, ui){
							$("dialog-removePageError").remove();
						},
						buttons: {
							cancel: function(){
								$(this).dialog("close");
							}
						}
					});
				}
				$( this ).dialog( "close" );
			},
			No: function(){
				$( this ).dialog( "close" );
			}
		}
	});
}


function addRollovers(myItem){
	//ADD Program Level Buttons
    myItem.hover(
    	function () {
            $(this).append("<div id='myRemove' class='pageRemove' title='Remove this page from your content.'></div>");
            $("#myRemove").click(function(){
            	removePage(findNodeByID(myItem.attr("myid")));
	        }).hover(
            	function () {
                	hoverSubNav = true;
                },
				function () {
                	hoverSubNav = false;
                }
            ).tooltip({
            	show: {
                	delay: 1500,
                    effect: "fadeIn",
                    duration: 200
                }
           });
        },
        function () {
			$("#myRemove").remove();
	});   
}

/****************************************************
********************************** CONTENT EDIT FUNCTIONALITY
*****************************************************/

function updateIndexCommentFlags(){
	cognizenSocket.emit('getCourseCommentPages', {
		contentId: urlParams['id']
	});
}


/****************************************************
********************************** TRACKING
*****************************************************/


function updateTracking(){
	tracking_arr[currentPage].complete = true;
	updateMenuItems();
}

/////////////////////////////////////////////////////END TRACKING

/****************************************************
********************************** SCORING FUNCTIONALITY
*****************************************************/
function updateScoring(_userSelection, _correct){
	for(var i = 0; i < questionResponse_arr.length; i++){
		if(currentPageID == questionResponse_arr[i].id){
			questionResponse_arr[i].complete = true;
			for(var j = 0; j < _userSelection.length; j++){
				questionResponse_arr[i].userAnswer.push(_userSelection[j]);
				questionResponse_arr[i].correct = _correct;
			}
			break;
		}
	}
	
	if(restartOnFail == true){
		checkForRestart();
	}
}

function checkForRestart(){
	var allowedMisses = Math.ceil(questionResponse_arr.length - (questionResponse_arr.length * passScore));
	
	var misses = 0;
	
	for (var i = 0; i < questionResponse_arr.length; i++){
		if(questionResponse_arr[i].correct == false){
			misses++
		} 
	}
	
	if(misses == allowedMisses){
		sendRestartOnFail();
	}
}

function sendRestartOnFail(){
	$("#stage").append('<div id="dialog-failedTraining" title="Failed"><p class="validateTips">You have missed too many questions to pass this training.</p><p>You must start this training over. Please click <b>Restart</b> below to restart the training. Close your browser window to quit.</p></div>');
	
	//Make it a dialog
	$("#dialog-failedTraining").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
				location.reload();
				$("#dialog-failedTraining").remove();
			},
		buttons: {
			Restart: function () {
                    $(this).dialog("close");
                    
			}
		}
	});
}

function getFinalScore(){
	var correct = 0;
	var scoreString = "";
	for(var i = 0; i < questionResponse_arr.length; i++){
		if(questionResponse_arr[i].correct != false){
			correct++;
		}
	}
	scoreString = correct + " out of " + questionResponse_arr.length;
	alert("you got a score of: " + scoreString);
}

/////////////////////////////////////////////////////END SCORING FUNCTIONALITY

/************************************************************************************
ADD NEW PAGE
************************************************************************************/
function addPage(){
	//Create the base message.
	var msg = '<div id="dialog-addPage" title="Add Page"><p class="validateTips">Complete the form to create your new page.</p>';

	//Add the page type dropdown
	msg += '<p><label for="pageTypeList">Select a page type:</label><select id="pageTypeList" name="pageTypeList">';
	for(var i=0; i < pageType_arr.length; i++){
		msg += '<option value="' + pageType_arr[i]+ '">' + pageType_arr[i] + '</option>';
	}
	msg += '</select></p>';

	$("#pageTypeList").spinner();

	msg += '</div>';

	//Add to stage.
	$("#stage").append(msg);

	//Make it a dialog
	$("#dialog-addPage").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
				
				//$("#userList").remove();
				$("#pageTypeList").remove();
				$("#dialog-addPage").remove();
			},
		buttons: {
			Cancel: function () {
                    $(this).dialog("close");
			},
			Add: function(){
				//Grab the updated text from redactor.
				var newPageType = $("#pageTypeList").val();
				createNewPageByType(newPageType);
				toggleIndex();
				$(this).dialog("close");

			}
		}
	});
}

function createNewPageByType(_myType){
	//Create a Unique ID for the page
	var myID = guid();
	//Place a page element
	$(data).find("page").eq(currentPage).after($('<page id="'+ myID +'" layout="'+_myType+'" audio="null" prevPage="null" nextPage="null"></page>'));

	//Place the page title element
	$(data).find("page").eq(currentPage + 1).append($("<title>"));
	var newPageTitle = new DOMParser().parseFromString('<title></title>',  "application/xml");
	var titleCDATA = newPageTitle.createCDATASection("New Page Title");
	$(data).find("page").eq(currentPage + 1).find("title").append(titleCDATA);
	
	if(isLinear == true){
		var page_obj = new Object();
		page_obj.id = myID;
		page_obj.complete = false;
		tracking_arr.push(page_obj);
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//ADD PAGE SPECIFIC ELEMENTS
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	switch (_myType) {
		//Satic Layouts
		case "group":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage + 1).attr("type", "group");
			break;
		case "textOnly":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			break;
		case "graphicOnly":
			$(data).find("page").eq(currentPage + 1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("<p></p>");
			$(data).find("page").eq(currentPage + 1).find("caption").append(captionCDATA);
			$(data).find("page").eq(currentPage + 1).attr("img", "defaultTop.png");
			$(data).find("page").eq(currentPage + 1).attr("popup", "");
			$(data).find("page").eq(currentPage + 1).attr("popcaps", "");
			$(data).find("page").eq(currentPage + 1).attr("enlarge", "");
			$(data).find("page").eq(currentPage + 1).attr("alt", "image description");
			break;
		case "top":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage + 1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("<p></p>");
			$(data).find("page").eq(currentPage + 1).find("caption").append(captionCDATA);
			$(data).find("page").eq(currentPage + 1).attr("img", "defaultTop.png");
			$(data).find("page").eq(currentPage + 1).attr("popup", "");
			$(data).find("page").eq(currentPage + 1).attr("popcaps", "");
			$(data).find("page").eq(currentPage + 1).attr("enlarge", "");
			$(data).find("page").eq(currentPage + 1).attr("alt", "image description");
			break;
		case "left":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage + 1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("<p></p>");
			$(data).find("page").eq(currentPage + 1).find("caption").append(captionCDATA);
			$(data).find("page").eq(currentPage + 1).attr("img", "defaultLeft.png");
			$(data).find("page").eq(currentPage + 1).attr("popup", "");
			$(data).find("page").eq(currentPage + 1).attr("popcaps", "");
			$(data).find("page").eq(currentPage + 1).attr("enlarge", "");
			$(data).find("page").eq(currentPage + 1).attr("alt", "image description");
			break;
		case "right":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage + 1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("<p></p>");
			$(data).find("page").eq(currentPage + 1).find("caption").append(captionCDATA);
			$(data).find("page").eq(currentPage + 1).attr("img", "defaultLeft.png");
			$(data).find("page").eq(currentPage + 1).attr("popup", "");
			$(data).find("page").eq(currentPage + 1).attr("popcaps", "");
			$(data).find("page").eq(currentPage + 1).attr("enlarge", "");
			$(data).find("page").eq(currentPage + 1).attr("alt", "image description");
			break;
		case "bottom":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage + 1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("<p></p>");
			$(data).find("page").eq(currentPage + 1).find("caption").append(captionCDATA);
			$(data).find("page").eq(currentPage + 1).attr("img", "defaultTop.png");
			$(data).find("page").eq(currentPage + 1).attr("popup", "");
			$(data).find("page").eq(currentPage + 1).attr("popcaps", "");
			$(data).find("page").eq(currentPage + 1).attr("enlarge", "");
			$(data).find("page").eq(currentPage + 1).attr("alt", "image description");
			break;
		case "sidebar":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage + 1).append($("<sidebar>"));
			var newSidebarContent = new DOMParser().parseFromString('<sidebar></sidebar>',  "text/xml");
			var sidebarCDATA = newSidebarContent.createCDATASection("<p>New Page Sidebar</p>");
			$(data).find("page").eq(currentPage + 1).find("sidebar").append(sidebarCDATA);
			break;
		case "tabsOnly":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);

			$(data).find("page").eq(currentPage + 1).append($("<tab id='1' title='tab1'>"));
			var newTabContent1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA1 = newTabContent1.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(currentPage + 1).find("tab").eq(0).append(tabCDATA1);

			$(data).find("page").eq(currentPage + 1).append($("<tab id='2' title='tab2'>"));
			var newTabContent2 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA2 = newTabContent2.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(currentPage + 1).find("tab").eq(1).append(tabCDATA2);
			break;
		case "tabsLeft":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);

			$(data).find("page").eq(currentPage + 1).append($("<tab id='1' title='tab1'>"));
			var newTabContent1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA1 = newTabContent1.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(currentPage + 1).find("tab").eq(0).append(tabCDATA1);

			$(data).find("page").eq(currentPage + 1).append($("<tab id='2' title='tab2'>"));
			var newTabContent2 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA2 = newTabContent2.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(currentPage + 1).find("tab").eq(1).append(tabCDATA2);

			$(data).find("page").eq(currentPage + 1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("<p></p>");
			$(data).find("page").eq(currentPage + 1).find("caption").append(captionCDATA);

			$(data).find("page").eq(currentPage + 1).attr("img", "defaultLeft.png");
			$(data).find("page").eq(currentPage + 1).attr("alt", "image description");
			break;
		case "revealRight":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA1 = newRevealContent1.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).append(revealCDATA1);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('style', 'width:160px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('imgStyle', 'position:relative; top:5px; left:5px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Image Picture"');
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA2 = newRevealContent2.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).append(revealCDATA2);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('style', 'width:160px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('imgStyle', 'position:relative; top:5px; left:5px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Image Picture"');
			
			$(data).find("page").eq(currentPage + 1).attr("interact", "click");
			break;
		case "revealLeft":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA1 = newRevealContent1.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).append(revealCDATA1);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('style', 'width:160px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('imgStyle', 'position:absolute; top:5px; right:5px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Image Picture"');
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA2 = newRevealContent2.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).append(revealCDATA2);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('style', 'width:160px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('imgStyle', 'position:absolute; top:5px; right:5px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Image Picture"');
			
			$(data).find("page").eq(currentPage + 1).attr("interact", "click");
			break;
		case "revealTop":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA1 = newRevealContent1.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).append(revealCDATA1);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('style', 'width:280px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('imgStyle', 'position:absolute; bottom:5px; right:65px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Reveal Image"');
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA2 = newRevealContent2.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).append(revealCDATA2);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('style', 'width:280px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('imgStyle', 'position:absolute; bottom:5px; right:65px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Reveal Image"');
			
			$(data).find("page").eq(currentPage + 1).attr("interact", "click");
			break;
		case "revealBottom":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA1 = newRevealContent1.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).append(revealCDATA1);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('style', 'width:280px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('imgStyle', 'position:relative; top:5px; margin-left:auto; margin-right:auto; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px; alt="Default Reveal Image"');
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA2 = newRevealContent2.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).append(revealCDATA2);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('style', 'width:280px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('imgStyle', 'position:relative; top:5px; margin-left:auto; margin-right:auto; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px; alt="Default Reveal Image"');
			
			$(data).find("page").eq(currentPage + 1).attr("interact", "click");
			break;
		case "flashcardText":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<card><term/><definition/></card>"));
			var newFront1 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack1 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA1 = newFront1.createCDATASection("<p>New Card Term</p>");
			var backCDATA1 = newBack1.createCDATASection("<p>New Card Definition</p>");
			$(data).find("page").eq(currentPage + 1).find("card").eq(0).find("term").append(frontCDATA1);
			$(data).find("page").eq(currentPage + 1).find("card").eq(0).find("definition").append(backCDATA1);
			
			$(data).find("page").eq(currentPage + 1).append($("<card><term/><definition/></card>"));
			var newFront2 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack2 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA2 = newFront2.createCDATASection("<p>New Card Term</p>");
			var backCDATA2 = newBack2.createCDATASection("<p>New Card Definition</p>");
			$(data).find("page").eq(currentPage + 1).find("card").eq(1).find("term").append(frontCDATA2);
			$(data).find("page").eq(currentPage + 1).find("card").eq(1).find("definition").append(backCDATA2);
			
			break;
			
		case "flashcardMedia":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<card><term/><definition/></card>"));
			var newFront1 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack1 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA1 = newFront1.createCDATASection("position:absolute; bottom:5px; right:65px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;");
			var backCDATA1 = newBack1.createCDATASection("<p>New Card Definition</p>");
			$(data).find("page").eq(currentPage + 1).find("card").eq(0).find("term").append(frontCDATA1);
			$(data).find("page").eq(currentPage + 1).find("card").eq(0).find("definition").append(backCDATA1);
			
			$(data).find("page").eq(currentPage + 1).append($("<card><term/><definition/></card>"));
			var newFront2 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack2 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA2 = newFront2.createCDATASection("position:absolute; bottom:5px; right:65px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;");
			var backCDATA2 = newBack2.createCDATASection("<p>New Card Definition</p>");
			$(data).find("page").eq(currentPage + 1).find("card").eq(1).find("term").append(frontCDATA2);
			$(data).find("page").eq(currentPage + 1).find("card").eq(1).find("definition").append(backCDATA2);
			
			break;
			
		case "multipleChoice":
			$(data).find("page").eq(currentPage + 1).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("Input a question.");
			$(data).find("page").eq(currentPage + 1).find("question").append(myQuestionCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option1CDATA = option1.createCDATASection("True");
			$(data).find("page").eq(currentPage + 1).find("option").eq(0).append(option1CDATA);
			$(data).find("page").eq(currentPage + 1).find("option").eq(0).attr("correct", "true");
			
			$(data).find("page").eq(currentPage + 1).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option2CDATA = option2.createCDATASection("False");
			$(data).find("page").eq(currentPage + 1).find("option").eq(1).append(option2CDATA);
			$(data).find("page").eq(currentPage + 1).find("option").eq(1).attr("correct", "false");
			
			$(data).find("page").eq(currentPage + 1).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("That is not correct.  Please try again.");
			$(data).find("page").eq(currentPage + 1).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(currentPage + 1).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(data).find("page").eq(currentPage + 1).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(currentPage + 1).find("feedback").append(myFeedbackCDATA);
			
			$(data).find("page").eq(currentPage + 1).attr("feedbackType", "undifferentiated");
			$(data).find("page").eq(currentPage + 1).attr("feedbackDisplay", "pop");
			$(data).find("page").eq(currentPage + 1).attr("audio", "null");
			$(data).find("page").eq(currentPage + 1).attr("btnText", "Submit");
			
			if(scored == true){
				$(data).find("page").eq(currentPage + 1).attr("attempts", 1);
				$(data).find("page").eq(currentPage + 1).attr("graded", true);
			}else{
				$(data).find("page").eq(currentPage + 1).attr("attempts", 2);
				$(data).find("page").eq(currentPage + 1).attr("graded", false);
			}
			break;
			
		case "matching":
			$(data).find("page").eq(currentPage + 1).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("Match the items on the left to the items on the right:");
			$(data).find("page").eq(currentPage + 1).find("question").append(myQuestionCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option1CDATA = option1.createCDATASection("A. Option1");
			$(data).find("page").eq(currentPage + 1).find("option").eq(0).append(option1CDATA);
			$(data).find("page").eq(currentPage + 1).find("option").eq(0).attr("correct", "A");
			
			$(data).find("page").eq(currentPage + 1).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option2CDATA = option2.createCDATASection("B. Option2");
			$(data).find("page").eq(currentPage + 1).find("option").eq(1).append(option2CDATA);
			$(data).find("page").eq(currentPage + 1).find("option").eq(1).attr("correct", "B");
			
			$(data).find("page").eq(currentPage + 1).append($("<answer>"));
			var answer1 = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
			var answer1CDATA = answer1.createCDATASection("Answer 1");
			$(data).find("page").eq(currentPage + 1).find("answer").eq(0).append(answer1CDATA);
			$(data).find("page").eq(currentPage + 1).find("answer").eq(0).attr("correct", "A");
			
			$(data).find("page").eq(currentPage + 1).append($("<answer>"));
			var answer2 = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
			var answer2CDATA = answer2.createCDATASection("answer2");
			$(data).find("page").eq(currentPage + 1).find("answer").eq(1).append(answer2CDATA);
			$(data).find("page").eq(currentPage + 1).find("answer").eq(1).attr("correct", "B");
			
			$(data).find("page").eq(currentPage + 1).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("That is not correct.  Please try again.");
			$(data).find("page").eq(currentPage + 1).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(currentPage + 1).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(data).find("page").eq(currentPage + 1).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(currentPage + 1).find("feedback").append(myFeedbackCDATA);
			
			//$(data).find("page").eq(currentPage + 1).attr("attempts", 2);
			$(data).find("page").eq(currentPage + 1).attr("feedbackType", "undifferentiated");
			$(data).find("page").eq(currentPage + 1).attr("feedbackDisplay", "pop");
			$(data).find("page").eq(currentPage + 1).attr("audio", "null");
			$(data).find("page").eq(currentPage + 1).attr("btnText", "Submit");
			if(scored == true){
				$(data).find("page").eq(currentPage + 1).attr("attempts", 1);
				$(data).find("page").eq(currentPage + 1).attr("graded", true);
			}else{
				$(data).find("page").eq(currentPage + 1).attr("attempts", 2);
				$(data).find("page").eq(currentPage + 1).attr("graded", false);
			}
			
			break;
	}
	newPageAdded = true;
	sendUpdateWithRefresh();
}

/*****************************************************************
RANDOM GUID GENERATION
*****************************************************************/
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}
/**********************************************************END RANDOM GUID GENERATION*/



//addDocs pane
function addDocs(){
	$('#panes').append("<div id='docPane' class='pane'><button id='docTab' class='paneTab'></button><div id='docContent' class='docContent'></div></div>");
	for (var i = 0; i < totalDocs; i++){
		var linkID = "docPaneItem" + i;
		var thisLink = $(data).find('docItem').eq(i).find('doc').attr('link');
		var thisDoc = $(data).find('docItem').eq(i).find('doc').text();
		var thisDescription = $(data).find('docItem').eq(i).find('description').text();
		$("#docContent").append("<div class='docPaneItem'><a href='"+thisLink+"' id='"+linkID+"' target='_blank'>"+thisDoc+"</a><div class='docPaneItemDescription'>"+thisDescription+"</div></div>");
		$('#'+linkID).button();
	}
	
	$('#docTab').click(toggleDoc);	
}

var glossaryTerm_arr;
//addGlossary
//If glossary == true  add the glossary.
function addGlossary(){
	totalGlossary = $(data).find('glossaryItem').length;
	glossaryTerm_arr = [];
	//var icon = 'ui-icon-circle-triangle-n';
	if(windowWidth <= mobileWidth){
		$('#panes').append("<div id='glossaryPane' class='pane'><button id='glossaryTab' class='paneTab'></button><div id='glossaryContent' class='glossaryContent'></div></div>");
	}
	else{
		$('#panes').append("<div id='glossaryPane' class='pane'><div id='glossaryTab' class='paneTab' title='click here to toggle the glossary'/><div id='glossaryTerms' class='glossaryTerms'></div><div id='glossaryContent' class='glossaryContent'></div></div>");
	}
	
	var thisTerm;
	var termID;
	
	for(var i = 0; i < totalGlossary; i++){
		thisTerm = "term" + i;
		termID = "#"+thisTerm;
		$("#glossaryTerms").append("<div id='"+thisTerm+"' class='glossaryItem'>"+$(data).find('glossaryItem').eq(i).find('term').text()+"</div>");
		$(termID).data("definition", $(data).find('glossaryItem').eq(i).find('content').text());
		$(termID).click(function(){
			console.log("clicke");
			console.log("definition = " + $(this).data("definition"));
			$("#glossaryContent").text($(this).data("definition"));
		});
	}
	
	/*$('#glossaryContent').append('<ul id="myList">');
	for(var i = 0; i < totalGlossary; i++){
		thisTerm = $(data).find("glossaryItem").eq(i).find("term").text();
		$('#myList').append('<li class="glossaryItem"><a href="#'+ thisTerm +'">' + thisTerm + '</a></li>');
	};

	$('#glossaryContent').append('</ul>');

	for(var j = 0; j < totalGlossary; j++){
		$('#glossaryContent').append('<div id="'+ $(data).find("glossaryItem").eq(j).find("term").text() +'">' + $(data).find("glossaryItem").eq(j).find("content").text() + '</div>');
	};

	$('#glossaryContent').tabs().addClass('ui-tabs-vertical ui-helper-clearfix');
	$('#glossaryContent li').removeClass("ui-corner-top").addClass("ui-corner-left");*/

	$('#glossaryTab').click(toggleGlossary).tooltip();
}

/*************************************************************
** Next/Back Button Funcitonality
*************************************************************/
function clickBack(){
	if(indexState == true){
		toggleIndex();
	}
	currentPage--;
	currentTemplate.destroySelf();
	/*if(masterIndex == true){
		var tempString = '#indexMenuItem' + currentPage;
		$(tempString).click();
	}*/
}

function clickNext(){
	if(indexState == true){
		toggleIndex();
	}
	currentPage++;
	currentTemplate.destroySelf();
	/*if(masterIndex == true){
		var tempString = '#indexMenuItem' + currentPage;
		$(tempString).click();
	}*/
}

//Turns the next/back button off for first/last page.
function checkNavButtons(){
	if(currentPage == 0){
		$('#back').css({opacity:.5});
		$('#back').off('click');
		backDisabled = true;
	}else{
		$('#back').css({opacity: 1});
		if(backDisabled == true){
			$("#back").click(clickBack);
			backDisabled = false;
		}
	}

	if(currentPage == totalPages -1 || mandatoryInteraction == true){
		$('#next').css({opacity:.5});
		$('#next').off('click');
		nextDisabled = true;
		//on the last page so complete the course
		if(isScorm ){
			completeCourse();
		};
	}else{
		$('#next').css({opacity: 1});
		if(nextDisabled == true){
			$("#next").click(clickNext);
			nextDisabled = false;
		}
	}
}


/*************************************************************
** Page Counter Funcitonality
*************************************************************/
function updatePageCount(){
	var tempPage = currentPage + 1;
	if(windowWidth <= mobileWidth){
		$('#pageCount').text(tempPage + " of " + totalPages);
	}
	else{
		$('#pageCount').text("Page " + tempPage + " of " + totalPages);
	}
}

/*************************************************************
** Index Button Funcitonality
*************************************************************/
function toggleIndex(){
	$("#indexPane").css({'z-index':1});
	$("#glossaryPane").css({'z-index':0});
	$("#docPane").css({'z-index':0});
	//var icon = 'ui-icon-circle-triangle-s';
	if(indexState == false){
		indexState = true;
		gimmeIndexPos();
		TweenMax.to($('#indexPane'), transitionLength, {css:{left:0}, ease:transitionType});


	}
	else{
		indexState = false;
		TweenMax.to($('#indexPane'), transitionLength, {css:{left:indexClosePos}, ease:transitionType});

	}
}

function gimmeIndexPos(){
	indexClosePos = ($("#indexPane").position().left);
}

/*************************************************************
** DOC Button Funcitonality
*************************************************************/
function toggleDoc(){
	$("#docPane").css({'z-index':1});
	$("#indexPane").css({'z-index':0});
	$("#glossaryPane").css({'z-index':0});
	
	if(docState == false){
		docState = true;
		gimmeDocPos();
		TweenMax.to($('#docPane'), transitionLength, {css:{left:0}, ease:transitionType});


	}
	else{
		docState = false;
		TweenMax.to($('#docPane'), transitionLength, {css:{left:docClosePos}, ease:transitionType});

	}
}

function gimmeDocPos(){
	docClosePos = ($("#docPane").position().left);
}

function gimmeIndexPos(){
	indexClosePos = ($("#indexPane").position().left);
}

/*************************************************************
** Glossary Button Funcitonality
*************************************************************/
function toggleGlossary(){
	$("#glossaryPane").css({'z-index':1});
	$("#indexPane").css({'z-index':0});
	$("#docPane").css({'z-index':0});
	var icon = 'ui-icon-circle-triangle-s';
	if(glossaryState == false){
		glossaryState = true;

		gimmeGlosPos();
		if(windowWidth <= mobileWidth){
			//icon = 'ui-icon-circle-triangle-n';
			//TweenMax.to($('#glossaryPane'), transitionLength, {css:{left:windowWidth-410}, ease:transitionType});
			TweenMax.to($('#glossaryPane'), transitionLength, {css:{top:0}, ease:transitionType});
		}
		else{
			//icon = 'ui-icon-circle-triangle-s';
			TweenMax.to($('#glossaryPane'), transitionLength, {css:{left:0}, ease:transitionType});
		}
	}
	else{
		glossaryState = false;
		if(windowWidth <= mobileWidth){
			//icon = 'ui-icon-circle-triangle-s';
			TweenMax.to($('#glossaryPane'), transitionLength, {css:{top:glossaryClosePosMobile}, ease:transitionType});
		}
		else{
			//icon = 'ui-icon-circle-triangle-n';
			TweenMax.to($('#glossaryPane'), transitionLength, {css:{left:glossaryClosePos}, ease:transitionType});
		}
	}
	/*$("#glossaryTab").button({
		icons:{
			primary: icon
		}
	});*/
}

function gimmeGlosPos(){
	glossaryClosePos = ($("#glossaryPane").position().left);
	glossaryClosePosMobile = ($("#glossaryPane").position().top);
}

/*************************************************************
** Utility Funcitonality
*************************************************************/
function findNodeByID(myID){
	if(myID == undefined){
		myID = currentPageID;
	}
	for(var i = 0; i < totalPages; i++){
		if(myID == $(data).find("page").eq(i).attr("id")){
			return i;
			break;
		}
	}
}

function loadPageFromID(_id){
	for(var i = 0; i < totalPages; i++){
		if($(data).find("page").eq(i).attr("id") == _id){
			currentPage = i;
			if(currentTemplate !== undefined){
				currentTemplate.destroySelf();
			}
			break;
		}
	}
}

/*************************************************************
** EDIT mode Funcitonality
*************************************************************/
function updateIndex(){
	$.ajax({
	    	type: "GET",
	    	url: "xml/content.xml",
	    	dataType: "xml",
	    	async: false,
	    	success: function(_data){
	    		data = _data;
	    		$("#indexContent").remove();
	    		if(mode == "edit"){
		    		$("#addPage").remove();
		    		$("#removePage").remove();
		    	}
		    	//Update the current page value to avoid editing the wrong page!
		    	if(newPageAdded == true){
			    	newPageAdded = false;
			    	clickNext();
		    	}else{
		    		currentPage = findNodeByID();
		    	}
		    	addIndex();
		},
		error: function(){
	    	alert("unable to load content.xml in updateIndex")
	    }
	});
}

/**
* sendUpdateWithRefresh
* @description Sends xml to the server to update and refreshes the xml upon success.
*/
function sendUpdateWithRefresh(){
	
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
	socket.emit('updateXMLWithRefresh', { my: xmlString });
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
	socket.emit('updateXML', { my: xmlString });
}
//temp function for clicking publish button
function clickPublish(){

	if(mode == "edit"){
		$('#myCanvas').append('<div id="publishLoader"><div id="publishLoaderText">Please Wait.<br/><br/>The little gnomes at our server facility are casting all kinds of spells to ensure that your content will work perfectly in any SCORM ' + $(data).find('scormVersion').attr('value') + ' conformant LMS as well as run nicely on your android or iOS mobile device.<br/><br/>These guys are artisans, this may take a couple of minutes.</div></div>');
		var selectedScorm = $('#scormVersion').find(':selected').text();
		var myScormVersion = $(data).find('scormVersion').attr('value');
		if (selectedScorm != myScormVersion){
			$(data).find('scormVersion').attr('value', selectedScorm);
		}

		$(data).find('mode').attr("value", 'production');
		sendUpdate();

		var myScormVersion = $(data).find('scormVersion').attr('value');
		socket.emit('publishSCORM',{ my : myScormVersion}, function(fdata) {
			///////////////////////////////////////////////////////////////////////////  This function is not getting called for me.  Phil - July 3
			//this function gets called once the server is done writing to the zip file
			$(data).find('mode').attr("value", 'edit');
			sendUpdate();
			$('#publishLoader').remove();

			parsePackageLocation(fdata);
		} );


	}
}

function getExtension(myFile){
	var parts = myFile.split('.'), i, l;
	var last = parts.length;

	mediaType = (parts[last - 1]);
	
	return mediaType;	  	
}

function parsePackageLocation(myPath){
	var splitPath = myPath.split("/");
	var notYet = true;
	var first = true;
	var dlPath = "";
	for(var i = 0; i < splitPath.length; i++){
		if(splitPath[i] == "programs"){
			notYet = false;
		}
		if(notYet == false){
			if(first == false){
				dlPath += "/";
			}else{
				first = false;
			}
			dlPath += splitPath[i];
		}
	}
	
	cognizenSocket.emit("sendPackageMail", {
		user: urlParams['u'],
		path: dlPath
	});
	
}


/*************************************************************
** SCORM Funcitonality
*************************************************************/

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

/*************************************************************
** Changes the styling when the browser window is resized
*************************************************************/
$(window).resize(function(){
	windowWidth = $('body').width();
	windowHeight = $(window).height();
    $("#myCanvas").fitToBackgroundImage();
    //TODO: add code here so that content like 3d and video resize too
    // $('#stage').remove();
    // $('#myCanvas').remove();
    // buildInterface();

});

