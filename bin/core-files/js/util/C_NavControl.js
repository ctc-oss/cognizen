/*
 *  	C_NavControl
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses index functionality for cognizen
 *  	Version: 0.5
 *		Date Created: 10/19/13
 *		Created by: Philip Double
 *		Date Updated: 10/19/13
 *		Updated by: Philip Double
 *		History: Moved all glossary functionality into its own js file.
 *		Todo: 	- Turn this into a plugin.  This did reside in C_Engine which was becoming unruly.
 *				- Optimize code.
 */
var currentTemplate;//Object representing the current template - many can have types, which are a parameter for those classes.
var currentTemplateType;//String tracking the page type i.e. An instance of the most common template C_StaticContent() takes a type("left", "top", "text", "right", "bottom"). This allows one class to handle multiple layouts instead of creating much redundant code.
var transition = false;//Boolean set in xml/preferences section - true - animated transitions  false - jump cut from page to page.
var transitionType;
var transitionLength = 1;

var pageCount = false;
var currentPage = 0;//Integer representing the current page
var currentPageID; //Needed for someone is sorting pages, may change node order and then a change would be sent to the wrong xml node.
var totalPages;//total pages in the presentation

var sectionLength = 0;
var scored = false;
var passScore = 0;
var restartOnFail = false;
var totalQuestions;
var questionResponse_arr;
var mandatoryInteraction = false;
var hoverSubNav = false;
var nextBack = false;
var nextDisabled = true;
var backDisabled = false;
var helpButton = false;
var helpURL = "";
var printButton = false;
var referenceButton = false;
var referenceURL = "";

function checkNav(){
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

	//Check if we are using help button - if so, set it up.
	//Positioning can be updated in css/C_Engine.css
	helpButton = $(data).find('help').attr('value');
	if(helpButton == "true"){
		helpButton = true;
		$('#myCanvas').append("<button id='help'>help</button>");
		//Style the Help button and give it its listener
		$("#help").button({
			icons:{
				primary: 'ui-icon-help'
			}
		});
		//grab URL of help file and attach click action
		helpURL = $(data).find('help').attr('url');
		$("#help").click(function() {
			window.open(helpURL, 'helpWindow', 'menubar=0, status=0, toolbar=0, resizable=1, scrollbars=1, width=807, height=750');
		});
	}

	//Check if we are using print button - if so, set it up.
	//Positioning can be updated in css/C_Engine.css
	printButton = $(data).find('print').attr('value');
	if(printButton == "true"){
		printButton = true;
		$('#myCanvas').append("<button id='print'>print</button>");
		//Style the Print button and give it its listener
		$("#print").button({
			icons:{
				primary: 'ui-icon-print'
			}
		});
		//attach print action
		$("#print").click(function() {
			window.print();
			return false;
		});
	}

	//Check if we are using reference button - if so, set it up.
	//Positioning can be updated in css/C_Engine.css
	referenceButton = $(data).find('reference').attr('value');
	if(referenceButton == "true"){
		referenceButton = true;
		$('#myCanvas').append("<button id='reference'>reference</button>");
		//Style the Reference button and give it its listener
		$("#reference").button({
			icons:{
				primary: 'ui-icon-document'
			}
		});
		//grab URL of reference file and attach click action
		referenceURL = $(data).find('reference').attr('url');
		$("#reference").click(function() {
			window.open(referenceURL, 'referenceWindow', 'menubar=0, status=0, toolbar=0, resizable=1, scrollbars=1, width=817, height=750');
		});
	}

	//Check if we are using home button - if so, set it up.
	//Positioning can be updated in css/C_Engine.css
	homeButton = $(data).find('homeButton').attr('value');
	if(homeButton == "true"){
		homeButton = true;
		$('#myCanvas').append("<button id='homeButton'>home</button>");
		//Style the Print button and give it its listener
		$("#homeButton").button({
			icons:{
				primary: 'ui-icon-home'
			}
		});
		//attach home action (go to first page)
		$("#homeButton").click(function() {
			currentPage = 0;
			currentTemplate.destroySelf();
		});
	}


	//Check if we are using transitions.  Set in preferences xml/Content.xml
	//if so, set them up.
	transition = $(data).find('transition').attr('value');
	if(transition == "true"){
		transition = true;
		transitionType = $(data).find('transitionType').attr('value');
		transitionLength = $(data).find('transitionLength').attr('value');
	 }
	 
	 if(nextBack){
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
	}
}

function addEditNav(){
	$("#myCanvas").append("<div id='preferences' class='btn_preferences' title='Set Project Preferences'></div>");
	$("#preferences").tooltip().click(launchPrefs);
}


function launchPrefs(){
	var msg = '<div id="dialog-lessonPrefs" title="Set Lesson Preferences"><p class="validateTips">Set your lesson preferences below:</p>';
	//Add the scorm form
	msg += "<p>";
	msg += "<form id='scormform' title='Set SCORM Version'>";
	msg += "<label id='label'>SCORM Version: </label>";
	msg += "<select id='scormVersion'>";
	msg += "<option>2004_4th</option>";
	msg += "<option>2004_3rd</option>";
	msg += "<option>1.2</option>";
	msg += "<option>none</option>";
	msg += "</select></form>";
	msg += "</p>";
	//Add the glossary checkbox.
	msg += "<div class='preferences_option' id='hasGlossaryDialog' title='Add/Remove Glossary'>";
	msg += "<label id='label'>Glossary: </label>";
	msg += "<input id='hasGlossary' type='checkbox' name='hasGlossary' class='radio'/>";
	msg += "</div><br/>";
	msg += "<div id='clearLessonComments'>Clear Lesson Comments</div>";
	//Add the resources/docs checkbox.   -------TODO
	msg += "</div>";
	
	$("#stage").append(msg);
	
	//Make it a dialog
	$("#dialog-lessonPrefs").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
				$("#dialog-lessonPrefs").remove();
			},
		buttons: {
			Close: function () {
            	$(this).dialog("close");
            },
            Save: function(){
	            savePreferences();
            },
            Publish: function(){
	            //clickPublish();
	            savePreferences(true);
	            $(this).dialog("close");
            }
		}
	});
	
	$("#clearLessonComments").button().click(function(){
		openCommentKillerDialog();
		//cognizenSocket.emit("clearLessonComments", {lesson: urlParams['id']})
	});
	
	$("#scormform").tooltip();
	
	if(glossary == true){
		$("#hasGlossary").attr('checked', true);
	}else{
		$("#hasGlossary").attr('checked', false);
	}
	
	$("#scormVersion").val($(data).find('scormVersion').attr('value'));
	
	$("#hasGlossaryDialog").tooltip();
}

function openCommentKillerDialog(){
	var msg = '<div id="dialog-removeComments" title="Remove ALL Lesson Comments"><p class="validateTips">Do you want to remove all lesson comments?</p>';
	//Add the scorm form
	msg += "<p>Be 100% sure that this is what you want to do before pressing yes.  This will remove all comments for this lesson and they are recoverable.</p>";
	
	//Add the resources/docs checkbox.   -------TODO
	msg += "</div>";
	
	$("#stage").append(msg);
	
	//Make it a dialog
	$("#dialog-removeComments").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
				$("#dialog-removeComments").remove();
			},
		buttons: {
			No: function () {
            	$(this).dialog("close");
            },
            Yes: function(){
            	cognizenSocket.emit("clearLessonComments", {lesson: urlParams['id']});
            	$("#dialog-lessonPrefs").remove();
	            $(this).dialog("close");
            }
		}
	});
}

function savePreferences(_pub){
	//check if glossary changed.
	var glossarySelected = $("#hasGlossary").is(':checked');
	var updateNeeded = false;
	
	if(glossary != glossarySelected){
		$(data).find('glossary').attr('value', glossarySelected);
		updateNeeded = true;
	}
	
	var selectedScorm = $('#scormVersion').find(':selected').text();
	var myScormVersion = $(data).find('scormVersion').attr('value');
	if(scormVersion != myScormVersion){
		$(data).find('scormVersion').attr('value', selectedScorm);
		updateNeeded = true;
	}
	 
	if(updateNeeded == true && _pub != true){
		sendUpdateWithRefresh("updatePrefs");
		$("#dialog-lessonPrefs").dialog("close");
	}else if(updateNeeded == true && _pub == true){
		sendUpdateWithRefresh("updatePrefsWithPublish");
	}else if(updateNeeded == false && _pub == true){
		clickPublish();
	}else{
		$("#dialog-lessonPrefs").dialog("close");
	}
}

function updatePrefs(_pub){
	$.ajax({
	    type: "GET",
	    url: "xml/content.xml",
	    dataType: "xml",
	    async: false,
	    success: function(_data){
	    	data = _data;
			var tmpGloss = false;
			if($(data).find('glossary').attr('value') == "true"){
				tmpGloss = true;
			}
			if(glossary != tmpGloss){
				glossary = tmpGloss;
				if(tmpGloss = true){
					checkGlossary();
				}else{
					$("#glossaryPane").remove();
				}
			}
			if(_pub == true){
				clickPublish();
			}
		},
		error: function(){
	   		alert("unable to load content.xml in updatePrefs")
	   	}
	});
}

function clickPublish(){
	$('#myCanvas').append('<div id="publishLoader"><div id="publishLoaderText">Please Wait.<br/><br/>The little gnomes at our server facility are casting all kinds of spells to ensure that your content will work perfectly in any SCORM ' + $(data).find('scormVersion').attr('value') + ' conformant LMS as well as run nicely on your android or iOS mobile device.<br/><br/>These guys are artisans, this may take a couple of minutes.</div></div>');

	// $(data).find('mode').attr("value", 'production');
	// sendUpdate();

	var myScormVersion = $(data).find('scormVersion').attr('value');
	var publishData = {
		content: {type: urlParams['type'], id: urlParams['id']},
		scorm: {version : myScormVersion}
	};

	cognizenSocket.emit('publishContent', publishData, function(fdata) {
		//this function gets called once the server is done writing to the zip file
		//$(data).find('mode').attr("value", 'edit');
		sendUpdate();
		$('#publishLoader').remove();

		parsePackageLocation(fdata);
	});
	$("#dialog-lessonPrefs").dialog("close");
}


////checkLock Mode and enable pass functions....
function checkLockMode(){
	if(mode == "edit" || mode == "admin"){
		$("#myCanvas").append("<div id='passLock' class='btn_passLock' title='Relinquish Edit Control'></div>");
	}else if(forcedReviewer == true){
		$("#myCanvas").append("<div id='passLock' class='btn_requestLock' title='Request Edit Control'></div>");
	}
	$("#passLock").tooltip().click(function(){
		//Relinquish Edit Control
		//console.log("In checkLockMode(). forcedReviewer = " + forcedReviewer);
		if(!forcedReviewer){
			var msg = '<div id="dialog-relinquishEdit" title="Relinquish Edit Control"><p class="validateTips">Do you want to relinquish edit control of the lesson?</p></div>';
			
			//Add to stage.
			$("#stage").append(msg);
				
			//Make it a dialog
			$("#dialog-relinquishEdit").dialog({
				dialogClass: "no-close",
				modal: true,
				width: 550,
				close: function(event, ui){
					$("#dialog-relinquishEdit").remove();
				},
				buttons: {
					YES: function () {
						mode = "review";
						justRelinquishedLock = true;
						forcedReviewer = true;
						cognizenSocket.emit('passLock', { me: username });
						$(this).dialog("close");
						nextDisabled = true;
						backDisabled = true;
						buildInterface();
					},
					NO: function(){
						$(this).dialog("close");
					}
				}
			});
		}
		//Request Edit Control
		else{
			var msg = '<div id="dialog-requestEdit" title="Request Edit Control"><p class="validateTips">Ask '+ activeEditor +' to permit you to take editing controls.</p><p>Would you like to send this request?</p></div>';
			
			//Add to stage.
			$("#stage").append(msg);
				
			//Make it a dialog
			$("#dialog-requestEdit").dialog({
				dialogClass: "no-close",
				modal: true,
				width: 550,
				close: function(event, ui){
					$("#dialog-requestEdit").remove();
				},
				buttons: {
					YES: function () {
						//console.log("username on yes = " + username);
						cognizenSocket.emit('requestLock', {me: username});
						$(this).dialog("close");
					},
					NO: function(){
						$(this).dialog("close");
					}
				}
			});
		}
	});
}

function checkToggleMode(){
	$("#myCanvas").append("<div id='toggleMode' class='toggleOn' title='Toggle edit mode.'></div>");
	$("#toggleMode").tooltip().click(function(){
		if($("#toggleMode").hasClass('toggleOn')){
			$("#toggleMode").removeClass("toggleOn");
			$("#toggleMode").addClass("toggleOff");
			$("#scormform").hide();
			$("#publish").hide();
			$("#preferences").hide();
			$("#passLock").hide();
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
			$("#passLock").show();
			$("#comment").show();
			$("#addPage").show();
			$("#audioDrop").show();
			mode = "edit";
		}
		currentTemplate.fadeComplete();
	});
}


//If this is a graded exercise, track the questions.  Am marking questions as graded so that you can have questions that ARE NOT scored as well...
if($(data).find('scored').attr("value") == 'true'){
	scored = true;
	
	if($(data).find('restartOnFail').attr("value") == 'true'){
		restartOnFail = true;
	}
	
	questionResponse_arr = [];
	for(var i = 0; i < totalPages; i++){
		if($(data).find("page").eq(i).attr('graded')){
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
if($(data).find('progressMode').attr("value") == 'linear' || $(data).find('progressMode').attr("value") == 'lockStep'){
	buildTrackingArray();
}
	//END OF TRACKING SET UP.

//If the course is linear - must complete page by page - setup a page completion tracking array.
function buildTrackingArray(){
	isLinear = true;
	tracking_arr = [];
	for(var i = 0; i < totalPages; i++){
		var page_obj = new Object();
		page_obj.id = $(data).find('page').eq(i).attr('id');
		page_obj.complete = false;
		tracking_arr.push(page_obj);
	}
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
}

function clickNext(){
	if(indexState == true){
		toggleIndex();
	}
	currentPage++;
	currentTemplate.destroySelf();
	
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
 
/****************************************************
********************************** TRACKING
*****************************************************/
function rejoinTracking(_location){
	for(var i = 0; i < _location; i++){
		tracking_arr[i].complete = true;
	}
	updateMenuItems();
}

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
		//clear the page comments from last page
		if(pageComments && pageComments.length > 0){
			pageComments.length = 0;
	    }
		//get the page comments
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
		case "completion":
			currentTemplate = new C_Completion(currentTemplateType);
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