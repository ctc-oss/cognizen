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
var totalGradedQuestions = 0;
var questionResponse_arr = [];
var mandatoryInteraction = false;
var assessment = false;
var hoverSubNav = false;
var nextBack = false;
var nextDisabled = true;
var backDisabled = false;
var indexDisabled = false;
var helpButton = false;
var helpURL = "";
var helpHeight = "750";
var helpWidth = "800";
var printButton = false;
var referenceButton = false;
var referenceURL = "";

function checkNav(){
	//Style is tied to the selected jquery ui theme set in index.
	nextBack = $(data).find('nextBack').attr('value');
	if(nextBack == "true"){
		nextBack = true;
		$("#myCanvas").append("<button id='back'>back</button><button id='next'>next</button>");
		//Adding new for accessibility 10/7/14 PD
		globalAccess_arr.push($("#next"));
		globalAccess_arr.push($("#back"));
	}

	//Check if we are using page counter - if so, set it up.
	//Positioning can be updated in css/C_Engine.css
	pageCount = $(data).find('pageCount').attr('value');
	if(pageCount == "true"){
		pageCount = true;
		$('#myCanvas').append("<div id='pageCount'></div>");
		updatePageCount();
		//Adding new for accessibility 10/7/14 PD
		$("#pageCount").attr("role", "presentation");
		globalAccess_arr.push($("#pageCount"));
	}

	//Check if we are using help button - if so, set it up.
	//Positioning can be updated in css/C_Engine.css
	helpButton = $(data).find('help').attr('value');
	if(helpButton == undefined || helpButton == "undefined"){
		$(data).find("preferences").append($('<help>'));
		// var newHelp = new DOMParser().parseFromString('<help></help>',  "text/xml");
		// $(data).find("help").append(newHelp);
		$(data).find("help").attr("value", "false");
		$(data).find("help").attr("url", "");
		$(data).find("help").attr("width", helpWidth);
		$(data).find("help").attr("height", helpHeight);
		helpButton = false;
	}
	else{
		helpButton = ($(data).find('help').attr('value') === 'true');
		var tempWidth = $(data).find('help').attr('width');
		if(tempWidth != undefined && tempWidth != 'undefined'){
			helpWidth = tempWidth;
		}
		else{
			$(data).find("help").attr("width", helpWidth);
		}
		var tempHeight = $(data).find('help').attr('height');
		if(tempHeight != undefined && tempHeight != "undefined"){
			helpHeight = tempHeight;
		}
		else{
			$(data).find("help").attr("height", helpHeight);
		}
	}

	checkHelp();

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
		$("#homeButton").click(clickHome);
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
	$("#preferences").tooltip().click(function(){
		connected = socket.socket.connected;

		if(connected){
			launchPrefs();
		}else{
			fireConnectionError();
		}
	});
}

function addObjEdit(){
	$('#myCanvas').append('<div id="objEdit" class="btn_objedit" title="View and edit learning objectives."></div>');

	$('#objEdit').click(function(){
		launchObjEdit();
	});

	$('#objEdit').tooltip();
}

function launchObjEdit(){

	var msg = '<div id="dialog-objEdit" title="Learning Objectives Edit Window.">';
	msg += "<div id='objEditDialog'>"
	msg += '<b>instructional goal: </b>' + $(courseData).find("course").attr("instructionalgoal") + '<br/>';
    //display tlo
    msg += '<b>terminal objective: </b>' + $(data).find('tlo').attr('value') + '<br/>';
	//enter elo
 	msg += "<label for='eo' title='Update the enabling objective.'>enabling objective: </label>";
    msg += '<input type="text" name="eo" id="eo" value="undefined" /> <br/>';
 	msg += "<label for='out_pageObjective'";
 	msg += 'title="Update the learner friendly objective description or reference to this page in the lesson. This value is used on completion pages to show missed objectives to students.">objective description: </label>';
    msg += '<input type="text" name="out_pageObjective" id="out_pageObjective" ';
	msg += 'value="'+ $(data).find('page').eq(currentPage).attr("objective") + '" /> <br/>';

	//enter tlo referenced for assessments
    if($(data).find('page').eq(currentPage).attr("type") == "kc"){
		msg += "<label for='objItemId' title='Name of the modules or lesson the objective is mapped to.'>module or lesson mapped (highest level): </label>";
     	msg += "<select name='objItemId' id='objItemId'>";
     	//for loop through items in course.xml
		for(var k = 0; k < $(courseData).find("item").length; k++){
			var itemId = $(courseData).find("item").eq(k).attr('id');
			var itemName = $(courseData).find("item").eq(k).attr('name');
			var itemTLO = $(courseData).find("item").eq(k).attr('tlo');
			msg += '<option value ="'+itemId+'"';
			if(itemId == $(data).find('id').attr('value')){
				msg += ' selected';
			}
			msg += '>'+itemName+' : '+itemTLO+'</option>';
		}
     	msg += "</select><br/>";
 	}
	msg += "<br/>";
	msg += "</div></div>";

	$("#stage").append(msg);

	var questionResponseIndex = 0;
	for(var j = 0; j < questionResponse_arr.length; j++){
		if(questionResponse_arr[j].id == $(data).find('page').eq(currentPage).attr('id')){
			questionResponseIndex = j;
			break;
		}
	}

 	//if objItemId not set set to current in xml
	if($(data).find('page').eq(currentPage).attr("type") == "kc"){
		if($(data).find('page').eq(currentPage).attr("objItemId")){
			if($(data).find('page').eq(currentPage).attr("objItemId") == 'undefined'){
				$(data).find('page').eq(currentPage).attr("objItemId",$('#objItemId option:selected').val());
				questionResponse_arr[questionResponseIndex].objItemId = $('#objItemId option:selected').val();
				//updateModuleXML(currentPageParentModule);
			}
			else{
				$('#objItemId').val($(data).find('page').eq(currentPage).attr("objItemId"));
			}

		}
		else{
			$(data).find('page').eq(currentPage).attr("objItemId",$('#objItemId option:selected').val());
			questionResponse_arr[questionResponseIndex].objItemId = $('#objItemId option:selected').val();
			//updateModuleXML(currentPageParentModule);
		}
	}

 	//add .on change for objItemId
 	$('#objItemId').on("change", function(){
		$(data).find('page').eq(currentPage).attr("objItemId",$('#objItemId option:selected').val());
		questionResponse_arr[questionResponseIndex].objItemId = $('#objItemId option:selected').val();
		//updateModuleXML(currentPageParentModule);
 	});

	//set enabling based off value in xml
	if($(data).find('page').eq(currentPage).attr("eo")){
		$("#eo").val($(data).find('page').eq(currentPage).attr("eo"));
	}

	// update the xml when the enabling is changed
    $("#eo").on("change", function(){
	    $(data).find('page').eq(currentPage).attr("eo", $("#eo").val().replace('<p>', '').replace('</p>', '').trim());
	    //updateModuleXML(currentPageParentModule);
    }).css({'width': '500px', 'color': '#3383bb;'});

    $("#out_pageObjective").on("change", function(){
     	var objUpdate = $("#out_pageObjective").val().trim();
	   	$(data).find('page').eq(currentPage).attr('objective', objUpdate);
	   	questionResponse_arr[questionResponseIndex].objective = objUpdate;
		//updateModuleXML(currentPageParentModule);
    }).css({'width': '500px', 'color': '#3383bb;'});

	//Make it a dialog
	$("#dialog-objEdit").dialog({
		dialogClass: "no-close",
		modal: true,
		width: 700,
		buttons: [
            {
	            text: "Done",
	            title: "Saves and closes the media drop dialog.",
	            click: function(){
	            	sendUpdateWithRefresh();
		            $(this).dialog("close");
		            $("#dialog-objEdit").remove();
		        }
            }
		]
	});

	$("#dialog-objEdit").tooltip();

}

function addMediaDrop(){
	$("#myCanvas").append("<div id='mediaDrop' class='btn_mediaDrop' title='Add files to the media directory.'></div>");

	$("#mediaDrop").click(function(){
		launchMediaDrop();
	});

	$("#mediaDrop").tooltip();
}

function launchMediaDrop(){

	var msg = '<div id="dialog-mediaDrop" title="Media File Upload Window.">';
	msg += "<div id='mediaDropDialog'>"
	msg += '<p class="validateTips">Add media files to the media directory for the lesson by <br/>'
	+ 'Dragging and Dropping file onto the Media Drop button or click on the button to browse your computer.</p>';
	msg += "<div id='inputMedia' title='Browse for file to be used.' class='audioDropSpot'>Media Drop</div>";
	msg += "<div id='inputFeedback' />";
	msg += "<br/>";
	msg += "</div></div>";

	$("#stage").append(msg);

	//Make it a dialog
	$("#dialog-mediaDrop").dialog({
		dialogClass: "no-close",
		modal: true,
		width: 550,
		buttons: [
            {
	            text: "Done",
	            title: "Saves and closes the media drop dialog.",
	            click: function(){
		            $(this).dialog("close");
		            $("#dialog-mediaDrop").remove();
		        }
            }
		]
	});

	//adds tooltips to the edit dialog buttons
    $(function () {
        $(document).tooltip();
    });

	var contentId = urlParams['type'] + '_' + urlParams['id'];

	$("#inputMedia").attr('data-content', contentId);
	$("#inputMedia").find('*').attr('data-content', contentId);

	$("#inputMedia").click(function(){
		siofu.prompt($("#inputMedia").attr('data-content'));
	});

	siofu.listenOnDrop(document.getElementById("inputMedia"));

	siofu.addEventListener("complete", function(event){
		if($('#dialog-mediaDrop').length > 0){
			siofu.removeEventListener("complete");
			siofu.removeEventListener("load");
			//if successful upload, else....
			var myFile = event.file.name;
			var myExt = getExtension(myFile);
		    //var favoriteTypes = ["mp4", "swf", "jpg", "png", "html", "htm", "gif", "jpeg", "swf", "mp3", "svg", "pdf", "doc", "docx", "pptx", "ppt", "xls", "xlsx"];
		    var convertableVideoTypes = ["ogv", "avi", "mov", "wmv", "flv", "webm"];
		    var convertableVectorTypes = ["eps"];
		    var convertableAudioTypes = ["wav", "ogg", "m4a", "aiff", "flac", "wma"];
		    var convertableTypes = convertableVideoTypes.concat(convertableAudioTypes, convertableVectorTypes);
        	$("#inputFeedback").empty();
	  //       if (favoriteTypes.indexOf(myExt.toLowerCase()) >= 0) {
			// 	if(event.success == true){
			// 		$("#inputFeedback").append(myFile + " has been uploaded to the media directory so a link can be created in the content.</div>");
			// 	}else{
			// 		$("#stage").append("<div id='uploadErrorDialog' title='Upload Error'>There was an error uploading your content. Please try again, if the problem persists, please contact your program administrator.</div>");
			// 		//Theres an error
			// 		//Style it to jQuery UI dialog
			// 		$("#uploadErrorDialog").tooltip().dialog({
			// 	    	autoOpen: true,
			// 			modal: true,
			// 			width: 400,
			// 			height: 200,
			// 			buttons: [ { text: "Close", click: function() {$( this ).dialog( "close" ); $( this ).remove()} }]
			// 		});
			// 	}
			// }
			if(myExt == "zip" || myExt == "ZIP"){
				// $("#inputFeedback").append("Your zip file is now being unzipped into your media folder.");
				cognizenSocket.on('unzipComplete', _unzipComplete);
				//$("#dialog-mediaDrop").remove();
			}
			else if (convertableTypes.indexOf(myExt.toLowerCase()) >= 0) {
				$("#stage").append("<div id='uploadConversionDialog' title='Upload Coverting'>The file format that you uploaded can't be played in most browsers. We are converting it to a compatibile format for you!<br/><br/>Larger files may take a few moments. <br/><br/></div>");
				$("#uploadConversionDialog").append("<div id='conversionProgress'><div class='progress-label'>Converting...</div></div>");
				$("#conversionProgress").progressbar({
					value: 0,
					change: function() {
						$(".progress-label").text($("#conversionProgress").progressbar("value") + "%");
					},
					complete: function() {
						$(".progress-label").text("Complete!");
					}
				});

				$("#conversionProgress > div").css({ 'background': '#3383bb'});

				$("#uploadConversionDialog").tooltip().dialog({
			    	autoOpen: true,
					modal: true,
					width: 400,
					height: 350,
					buttons: [ { text: "Close", click: function() {$( this ).dialog( "close" ); $( this ).remove()} }]
				});

				cognizenSocket.on('mediaConversionProgress', _mediaConversionProgress);
				cognizenSocket.on('mediaInfo', _mediaInfo);
				cognizenSocket.on('mediaConversionComplete', _mediaConversionComplete);
				$("#dialog-mediaDrop").remove();
			}
			else{
				if(event.success == true){
					var urlParams = queryStringParameters();
					cognizenSocket.emit('contentSaved', {
			            content: {type: urlParams['type'], id: urlParams['id']},
			            user: {id: urlParams['u']}
			        });
					$("#inputFeedback").append(myFile + " has been uploaded to the media directory so a link can be created in the content.</div>");
				}
				else{
					$("#stage").append("<div id='uploadErrorDialog' title='Upload Error'>There was an error uploading your content. Please try again, if the problem persists, please contact your program administrator.</div>");
					//Theres an error
					//Style it to jQuery UI dialog
					$("#uploadErrorDialog").tooltip().dialog({
				    	autoOpen: true,
						modal: true,
						width: 400,
						height: 200,
						buttons: [ { text: "Close", click: function() {$( this ).dialog( "close" ); $( this ).remove()} }]
					});
				}

			}
		}
	});

	$("#dialog-mediaDrop").tooltip();

}

function _mediaConversionProgress(data){
    $("#conversionProgress").progressbar("value", Math.floor(data.percent))
}

function _mediaInfo(data){
	if(data.video != ""){
		var splitDim = data.video_details[2].split("x");
		mediaWidth = splitDim[0];
		mediaHeight = splitDim[1];
	}
}

function _mediaConversionComplete(data){
	var splitPath = data.split("/");
	var last = splitPath.length;
	var mediaPath = splitPath[last-1];
	var splitType = splitPath[last-1].split(".");
	var type = splitType[splitType.length-1];
	if(type == "mp4"){
		try{ saveImageEdit(mediaPath, true); } catch(e){};
	}

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
	msg += "<div class='preferences_option' id='helpDialog' title='Add/Remove Help Button'>"
	msg += "<label id='helpLabel'>Help: </label>";
	msg += "<input id='hasHelp' type='checkbox' name='hasHelp'>";
	msg += "<div id='inputHelp' title='Browse for file to be used.' class='audioDropSpot'>Help Drop</div>";
	msg += "<div id='selectedHelp' title='Current file used for help section.'>"+$(data).find('help').attr('url')+"</div>";
	msg += "<label id='helpWidthLabel'>Help window width: </label>";
	msg += "<input id='helpWidth' type='text' name='helpWidth' value='"+helpWidth+"' disabled='disabled' size='4'>";
	msg += "<br/><label id='helpHeightLabel'>Help window height: </label>";
	msg += "<input id='helpHeight' type='text' name='helpHeight' value='"+helpHeight+"' disabled='disabled' size='4'>";
	msg += "</div><br/>";
	msg += "<div id='clearLessonComments'>Clear Lesson Comments</div>";
	//Add the resources/docs checkbox.   -------TODO
	msg += "</div>";

	$("#stage").append(msg);



	//Make it a dialog
	$("#dialog-lessonPrefs").dialog({
		dialogClass: "no-close",
		modal: true,
		width: 550,
		// close: function(event, ui){
		// 		$("#dialog-lessonPrefs").remove();
		// 	},
		buttons: [
			{
				text: "Cancel",
				title: "Cancel any changes.",
				click: function () {
	            	$(this).dialog("close");
	            	$("#dialog-lessonPrefs").remove();
	            }
            },
            {
	            text: "Publish",
	            title: "Publishes the lesson to the chosen format.",
	            click: function(){
		            //clickPublish();
		            savePreferences(true);
		            $(this).dialog("close");
	            }
            },
            {
	            text: "Done",
	            title: "Saves and closes the preferences dialog.",
	            click: function(){
		            savePreferences();
		        }
            }
		]
	});

	//adds tooltips to the edit dialog buttons
    $(function () {
        $(document).tooltip();
    });

	$("#clearLessonComments").button().click(function(){
		openCommentKillerDialog();
		//cognizenSocket.emit("clearLessonComments", {lesson: urlParams['id']})
	});

	$("#scormform").tooltip();

	if(glossary == true){
		$("#hasGlossary").attr('checked', true);
	} else{
		$("#hasGlossary").attr('checked', false);
	}
	var contentId = urlParams['type'] + '_' + urlParams['id'];

	$("#inputHelp").attr('data-content', contentId);
	$("#inputHelp").find('*').attr('data-content', contentId);

	if(helpButton == true){
		$("#hasHelp").attr('checked', true);
		$("#helpWidth").attr('disabled', false);
		$("#helpHeight").attr('disabled', false);
	} else{
		$("#hasHelp").attr('checked', false);
		$("#helpWidth").attr('disabled', true);
		$("#helpHeight").attr('disabled', true);
	}

	$("#hasHelp").click(function() {
		$("#inputHelp").toggle(this.checked);
	});

	$("#inputHelp").click(function(){
		siofu.prompt($("#inputHelp").attr('data-content'));
	});

	siofu.listenOnDrop(document.getElementById("inputHelp"));

	siofu.addEventListener("complete", function(event){
		siofu.removeEventListener("complete");
		siofu.removeEventListener("load");
		//if successful upload, else....
		var myFile = event.file.name;
		var myExt = getExtension(myFile);
	    var favoriteTypes = ["mp4", "swf", "jpg", "png", "html", "htm", "gif", "jpeg", "svg", "pdf", "doc", "docx", "pptx", "ppt", "xls", "xlsx"];
        if (favoriteTypes.indexOf(myExt.toLowerCase()) >= 0) {
			if(event.success == true){
				$(data).find('help').attr('url', 'media/' + myFile );
				$("#selectedHelp").text(myFile);
				$("#hasHelp").attr('checked', true);
				var urlParams = queryStringParameters();
				cognizenSocket.emit('contentSaved', {
			        content: {type: urlParams['type'], id: urlParams['id']},
			        user: {id: urlParams['u']}
			    });
			}else{
				$("#stage").append("<div id='uploadErrorDialog' title='Upload Error'>There was an error uploading your content. Please try again, if the problem persists, please contact your program administrator.</div>");
				//Theres an error
				//Style it to jQuery UI dialog
				$("#uploadErrorDialog").dialog({
			    	autoOpen: true,
					modal: true,
					width: 400,
					height: 200,
					buttons: [ { text: "Close", click: function() {$( this ).dialog( "close" ); $( this ).remove()} }]
				});
			}
		}
		// else if(myExt == "zip" || myExt == "ZIP"){
		// 	// $("#mediaLoaderText").empty();
		// 	// $("#mediaLoaderText").append("Your zip file is now being unzipped into your media folder.");
		// 	cognizenSocket.on('unzipComplete', _unzipComplete);
		// 	$("#dialog-lessonPrefs").remove();
		// }
	});

	$("#scormVersion").val($(data).find('scormVersion').attr('value'));

	$("#hasGlossaryDialog").tooltip();
	$("#helpDialog").tooltip();

}

function _unzipComplete(){
	try { cognizenSocket.removeListener("unzipComplete", _unzipComplete);; } catch (e) {}
	// var msg = "<div id='zipUploadCompleteDialog' title='Unzipping Complete'>";
	var msg = "<p>Your zip file has been uploaded and it's contents placed in your media folder.</p>";
	msg += "<p><b>IF</b> your zip is a zip of a folder, you will have to add that folder to your path when accessing the media. Ex. myFolder/myMedia.mp4</p>";
	msg += "<p>If you simply zipped a group of files, they can be accessed as you usually would.  Ex. myImage.png, myImage2.png and myImage3.png</p>"
	// msg += "</div>";

	// $("#stage").append(msg);
	$("#inputFeedback").append(msg);

	// //Style it to jQuery UI dialog
	// $("#zipUploadCompleteDialog").dialog({
	// 	autoOpen: true,
	// 	modal: true,
	// 	width: 500,
	// 	height: 400,
	// 	buttons:{
	// 		OK: function(){
	// 			$(this).dialog("close");
	// 			sendUpdateWithRefresh();
	// 		},
	// 	},
	// 	close: function(){
	// 		$("#zipUploadCompleteDialog").remove();
	// 	}
	// });
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

	var helpSelected = $("#hasHelp").is(':checked');
	if(helpButton != helpSelected){
		$(data).find('help').attr('value', helpSelected);
		updateNeeded = true;
	}

	helpWidth = $("#helpWidth").val();
	$(data).find('help').attr('width', helpWidth);

	helpHeight = $("#helpHeight").val();
	$(data).find('help').attr('height', helpHeight);

	if(helpSelected){
		helpButton = true;
	}
	else{ helpButton = false; }

	if(updateNeeded == true && _pub != true){
		sendUpdateWithRefresh("updatePrefs");
		$("#dialog-lessonPrefs").dialog("close");
		$("#dialog-lessonPrefs").remove();
	}else if(updateNeeded == true && _pub == true){
		sendUpdateWithRefresh("updatePrefsWithPublish");
	}else if(updateNeeded == false && _pub == true){
		clickPublish();
	}else{
		$("#dialog-lessonPrefs").dialog("close");
		$("#dialog-lessonPrefs").remove();
	}
	currentTemplate.fadeComplete();
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
			checkHelp();
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

function checkHelp(){
	if(helpButton == true){
		if($("#help").length == 0){
			$('#myCanvas').append("<button id='help' title='Access help information.'>help</button>");
			//Style the Help button and give it its listener
			$("#help").button({
				icons:{
					primary: 'ui-icon-help'
				}
			});

		}
		//grab URL of help file and attach click action
		helpURL = $(data).find('help').attr('url');
		$("#help").click(function() {
			window.open(helpURL, 'helpWindow', 'menubar=0, status=0, toolbar=0, resizable=1, scrollbars=1, width='+helpWidth+', height='+helpHeight+'');
		});
	}
	else{
		$("#help").remove();
	}
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
		connected = socket.socket.connected;

		if(connected){
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
							activeEditor = null;
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
				if(activeEditor == null){
					var msg = '<div id="dialog-requestEdit" title="Take Edit Controls"><p class="validateTips">No one is currently editing the lesson.</p><p>Would you like to assume the edit controls?</p></div>';
				}else{
					var msg = '<div id="dialog-requestEdit" title="Request Edit Control"><p class="validateTips">Ask '+ activeEditor +' to permit you to take editing controls.</p><p>Would you like to send this request?</p></div>';
				}

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
		}else{
			fireConnectionError();
		}
	});
}

//If this is a graded exercise, track the questions.  Am marking questions as graded so that you can have questions that ARE NOT scored as well...
//if($(data).find('scored').attr("value") == 'true'){
	scored = true;
	if($(data).find('restartOnFail').attr("value") == 'true'){
		restartOnFail = true;
	}
	passScore = $(data).find('minScore').attr("value") / 100;


function updateTotalGradedQuestions(){
	totalGradedQuestions = 0;
	for(var i = 0; i < totalPages; i++){
		if( ($(data).find("page").eq(i).attr('type') == 'kc') && ($(data).find("page").eq(i).attr('graded') == 'true') ){
			totalGradedQuestions++;
		}
	}
}

updateTotalGradedQuestions();

questionResponse_arr = [];

for(var i = 0; i < totalPages; i++){
	if($(data).find("page").eq(i).attr('type') == 'kc'){
		var userSelection_arr = [];
		var question_obj = new Object();
		question_obj.complete = false;
		question_obj.correct = null;
		if($(data).find("page").eq(i).attr('objective') == undefined){
			question_obj.objective = "undefined";
		}else{
			question_obj.objective = $(data).find("page").eq(i).attr('objective');
		}

		if($(data).find("page").eq(i).attr('objItemId') == undefined){
			question_obj.objItemId = "undefined";
		}else{
			question_obj.objItemId = $(data).find("page").eq(i).attr('objItemId');
		}

		if($(data).find("page").eq(i).attr('graded') == 'true'){
			question_obj.graded = true;
		}else{
			question_obj.graded = false;
		}

		if($(data).find("page").eq(i).attr('layout') == 'textInput'){
			var _textInputQuestions = [];
			question_obj.textInputQuestions = _textInputQuestions;
		}

		question_obj.id = $(data).find('page').eq(i).attr('id');
		question_obj.userAnswer = userSelection_arr;
		questionResponse_arr.push(question_obj);
	}
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
** Next/Back/Home Button Funcitonality
*************************************************************/
function clickBack(){
	disableBack();
	if(indexState == true){
		toggleIndex();
	}
	currentPage--;
	currentTemplate.destroySelf();
}

function clickNext(){
	disableNext();
	if(indexState == true){
		toggleIndex();
	}
	currentPage++;
	currentTemplate.destroySelf();
}

function clickHome(){
	if(indexState == true){
		toggleIndex();
	}
	currentPage = 0;
	currentTemplate.destroySelf();
}

function disableBack(){
	$('#back').attr('aria-disabled', 'true');
	$('#back').addClass('disabled');
	$('#back').off('click');
	backDisabled = true;
}

function enableBack(){
	$('#back').attr('aria-disabled', 'false');
	$('#back').removeClass('disabled');
	//ensure all click events are off on "#back
	$('#back').off('click');
	$("#back").click(clickBack);
	backDisabled = false;
}

function disableNext(){
	$('#next').attr('aria-diabled', 'true');
	$('#next').addClass('disabled');
	$('#next').off('click');
	nextDisabled = true;
}

function enableNext(){
	$('#back').attr('aria-diabled', 'false');
	$('#next').removeClass('disabled');
	$("#next").click(clickNext);
	nextDisabled = false;
}

function disableHome(){
	$('#homeButton').addClass('disabled');
	$('#homeButton').off('click');
	homeDisabled = true;
}

function enableHome(){
	$('#homeButton').removeClass('disabled');
	$("#homeButton").click(clickHome);
	homeDisabled = false;
}

function disableIndex(){
	$('#indexTab').addClass('disabled');
	$('#indexTab').off('click');
	indexDisabled = true;
}

function enableIndex(){
	if(indexDisabled){
		$('#indexTab').removeClass('disabled');
		$('#indexTab').click(toggleIndex);
		indexDisabled = false;
	}
}

//Turns the next/back button off for first/last page.
function checkNavButtons(){

	if(assessment && mode != "edit"){
		disableIndex();
		disableHome();
	}else{
		enableIndex();
		enableHome();
	}

	if(currentPage == 0 || assessment == true){
		disableBack();
	}else{
		var _cmi = 'cmi.core.entry';
		if($(data).find('scormVersion').attr('value').substring(0,4) == "2004"){
			_cmi = 'cmi.entry';
		}
		if(backDisabled == true || scorm.get(_cmi) == "resume" || markResume == true){
			enableBack();
			markResume = false;
		}
	}

	if(currentPage == totalPages -1 || mandatoryInteraction == true){
		disableNext();

	}else{
		if(nextDisabled == true){
			enableNext();
		}
	}

	if(currentPage == totalPages -1 && isScorm && !mandatoryInteraction && $(data).find("page").eq(currentPage).attr('layout') != "completion"){
		completeLessonDefault();
	}
	else if(currentPage > totalPages -1 && isScorm && mandatoryInteraction && $(data).find("page").eq(currentPage).attr('layout') != "completion"){
		completeLessonDefault();
	}

}


/*************************************************************
** Page Counter Funcitonality
*************************************************************/
function updatePageCount(){
	var tempPage = currentPage + 1;
	if(isMobilePhone){
		$('#pageCount').text(tempPage + " of " + totalPages);
	}
	else{
		$('#pageCount').text("Page " + tempPage + " of " + totalPages);
		$('#pageCount').attr('aria-label', "Page " + tempPage + " of " + totalPages);
	}
}

/****************************************************
********************************** TRACKING
*****************************************************/
function rejoinTracking(_location){
	var foundCurrPage = 0;
	for(var i = 0; i < tracking_arr.length; i++){
		if(tracking_arr[i].id === _location)
		{
			foundCurrPage = 1;
			tracking_arr[i].complete = true;
		}
		else if(foundCurrPage == 0)
		{
			tracking_arr[i].complete = true;
		}

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
function updateScoring(_userSelection, _correct, _order, _bankID){
	for(var i = 0; i < questionResponse_arr.length; i++){
		if(currentPageID == questionResponse_arr[i].id){
			questionResponse_arr[i].complete = true;
			for(var j = 0; j < _userSelection.length; j++){
				questionResponse_arr[i].userAnswer.push(_userSelection[j]);
				questionResponse_arr[i].correct = _correct;
			}
			//Assures that we display correctly upon return
			if(_order){
				questionResponse_arr[i].order = _order;
			}
			//Show proper bank item, if a bank...
			if(_bankID){
				questionResponse_arr[i].bankID = _bankID;
			}
			break;
		}
	}

	if(restartOnFail == true){
		checkForRestart();
	}
}

function checkForRestart(){
	var allowedMisses = Math.ceil(totalGradedQuestions - (totalGradedQuestions * passScore));

	var misses = 0;

	for (var i = 0; i < questionResponse_arr.length; i++){
		if(questionResponse_arr[i].correct == false && questionResponse_arr[i].graded){
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
	var score_obj = new Object();
	score_obj.totalQuestions = totalGradedQuestions;
//	console.log("totalGradedQuestions = " + totalGradedQuestions);
	score_obj.correctQuestions = 0;
	score_obj.score = 0;
	score_obj.scorePercent = 0;
	score_obj.minScore = parseInt($(data).find('minScore').attr('value'));
	score_obj.passed = false;

	for(var i = 0; i < questionResponse_arr.length; i++){
		if(questionResponse_arr[i].correct && questionResponse_arr[i].graded){
			score_obj.correctQuestions++;
		}
	}
	score_obj.score = score_obj.correctQuestions / score_obj.totalQuestions;
	score_obj.scorePercent = Math.round(score_obj.score*100);
	if(score_obj.scorePercent >= score_obj.minScore){
		score_obj.passed = true;
	}

	return score_obj;
}

function checkQuestionComplete(){
	var isComplete = false;
	for(var i = 0; i < questionResponse_arr.length; i++){
		if(currentPageID == questionResponse_arr[i].id){
			if(questionResponse_arr[i].complete == true){
				isComplete = true;
			}
		}
	}
//	console.log("isComplete = " + isComplete);
	return isComplete;
}

function updateTextInputQuestionResponse(_questionObj){
	for(var i = 0; i < questionResponse_arr.length; i++){
		if(currentPageID == questionResponse_arr[i].id){

			for(var j = 0; j < questionResponse_arr[i].textInputQuestions.length; j++){
				if(_questionObj.question == questionResponse_arr[i].textInputQuestions[j].question){
					questionResponse_arr[i].textInputQuestions[j].userAnswer = _questionObj.userAnswer;
					questionResponse_arr[i].textInputQuestions[j].correct = _questionObj.correct;
					questionResponse_arr[i].textInputQuestions[j].feedback = _questionObj.feedback;
					questionResponse_arr[i].textInputQuestions[j].userAttempts = _questionObj.userAttempts;
					questionResponse_arr[i].textInputQuestions[j].maxAttempts = _questionObj.maxAttempts;
				}
			}

		}
	}
}

function markIncomplete(){
	for(var i = 0; i < questionResponse_arr.length; i++){
		if(currentPageID == questionResponse_arr[i].id){
			questionResponse_arr[i].complete = false;
			/*for(var j = 0; j < questionResponse_arr[i].textInputQuestions.length; j++){
				// if(_questionObj.question == questionResponse_arr[i].textInputQuestions[j].question){
					questionResponse_arr[i].textInputQuestions[j].userAnswer = '';
					questionResponse_arr[i].textInputQuestions[j].correct = false;
					questionResponse_arr[i].textInputQuestions[j].feedback = '';
					questionResponse_arr[i].textInputQuestions[j].userAttempts = 0;
					//questionResponse_arr[i].textInputQuestions[j].maxAttempts = _questionObj.maxAttempts;
				// }
			}*/

		}
	}
}

/////////////////////////////////////////////////////END SCORING FUNCTIONALITY

/****************************************************
********************************** STEP 4 - LOAD PAGE
*****************************************************
**Details:
***utilizes this. namespace so that it can be referenced from external template files.
***Was placed like that to enable page fade tranistions.
***utilizes currentPage variable, which is an int representing a node in content .xml*/
//Function to load page content
this.loadPage = function(){
	try { $(".ui-tooltip-content").tooltip("destroy"); } catch (e) {}
	try { $(".ui-tooltip").tooltip("close"); } catch (e) {}
	if(isLinear == true){
		updateTracking();
	}

	if($(data).find("page").eq(currentPage).attr("mandatory") == "true" && mode != "edit"){
		if($(data).find("page").eq(currentPage).attr("graded") == "true"){
			assessment = true;
		}else{
			assessment = false;
		}
		mandatoryInteraction = true;
	}else{
		mandatoryInteraction = false;
		assessment = false;
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
			scorm.save();
		}
		else if(scorm.VERSION.substring(0,4) == "2004"){
			scorm.set("cmi.location", currentPageID);
			scorm.set("cmi.exit", "suspend");
			scorm.save();
		}
	}

	if(mode == "edit"){
		//clear the page comments from last page
		if(currentTemplateType == "graphicOnly" || currentTemplateType == "top" || currentTemplateType == "left" || currentTemplateType == "bottom" || currentTemplateType == "right" || currentTemplateType == "multipleChoiceMedia" || currentTemplateType == "tabsLeft"){
			$("#mediaDrop").css({opacity: 0});
	    }
		else{
			$("#mediaDrop").css({opacity: 1});
		}
	}

	switch (currentTemplateType) {
		//Satic Layouts
		case "group":
			currentTemplate = new C_StaticContent("textOnly");
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
		case "clickImage":
			currentTemplate = new C_ClickImage(currentTemplateType);
			currentTemplate.initialize();
			break;
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
		case "flashcard":
			currentTemplate = new C_Flashcard(currentTemplateType);
			currentTemplate.initialize();
			break;
		//Knowledge Check Layouts
		case "categories":
			currentTemplate = new C_Categories(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "questionBank":
			currentTemplate = new C_QuestionBank(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleChoice":
			currentTemplate = new C_MultipleChoice(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "multipleSelect":
			currentTemplate = new C_MultipleChoice("multipleChoice");
			currentTemplate.initialize();
			break;
		case "multipleChoiceMedia":
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
		case "sequence":
			currentTemplate = new C_Sequencing(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "textInput":
			currentTemplate = new C_TextInput(currentTemplateType);
			currentTemplate.initialize();
			break;
		case "essayCompare":
			currentTemplate = new C_EssayCompare(currentTemplateType);
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
		case "clickListRevealText":
			currentTemplate = new C_ClickListRevealText(currentTemplateType);
			currentTemplate.initialize();
			break;
	}
}