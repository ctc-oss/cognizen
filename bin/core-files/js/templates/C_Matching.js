/*!
 * C_Matching
 * This class creates a template for multipleChoice type questions.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2013-1-25
 * JavaScript
 *
 * Copyright (c) 2012, CTC. All rights reserved.
 *
 * @author: Philip Double, doublep@ctc.com
 *
 * This function allows for multiple parameters including:
 * 		1. Number of attempts: defaults to 1
 *		2. Any number of options for the answer.
 *		3. Multiple feedback types:
 *			a. Differentiated.
 *			b. Single.
 *			c. None
 *		4. Auto-matchingSubmit - when a user selects an option, it is matchingSubmitted without having to click matchingSubmit. Default == false;
 *		5. Allows for a background image to utilized.
 *		6. Timer - a timer can be set which counts down until 0 - if they don't answer they get a zero.
 */
function C_Matching(_type) {
	var type = _type;
	// var pageTitle;
	// var audioHolder;
    var myContent;//Body
    var optionStartX = 0;
    var attemptsAllowed = 2;
    var attemptsMade = 0;
    var optionLabeling = "a"; //"a" for alphabetic - "n" for numeric
    var option_arr = [];
    var answer_arr = [];
    var feedbackType;
    var feedbackDisplay;
    var feedbackCorrectTitle;
    var feedbackIncorrectTitle;
    var feedbackIncorrectAttempt;
    var feedback;
    var drops = 0;
    var dropsMax = $(data).find("page").eq(currentPage).find("option").length;
    var drop_arr = [];
    var optionCount = 0;
    var optionEdit_arr = [];
    var answerCount = 0;
    var answerEdit_arr = [];
	var marking_arr;
	var tempCorrect = true;

    var optionStatementY = 0;
    var optionAnswerY = 0;
    var isComplete = false;
    var graded = false;
    var mandatory = true;
	var order_arr = [];
	var scormVersion;
	var pageId;


    //Defines a public method - notice the difference between the private definition below.
	this.initialize= function(){
		buildTemplate();
	}

	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		if(transition == true){
			$('#stage').css({'opacity':0});
		}

		//Clear accessibility on page load.
        pageAccess_arr = [];
        audioAccess_arr = [];

		isComplete = checkQuestionComplete();

		attemptsAllowed = $(data).find("page").eq(currentPage).attr('attempts');
		feedbackType = $(data).find("page").eq(currentPage).attr('feedbacktype');
		feedbackDisplay = $(data).find("page").eq(currentPage).attr('feedbackdisplay');
		feedbackCorrectTitle = $(data).find("page").eq(currentPage).find('correctresponse').text();
		feedbackIncorrectTitle = $(data).find("page").eq(currentPage).find('incorrectresponse').text();
		feedbackIncorrectAttempt = $(data).find("page").eq(currentPage).find('attemptresponse').text();
		feedback = $(data).find("page").eq(currentPage).find('feedback').text();
		scormVersion = $(data).find('scormVersion').attr('value');
		pageId = $(data).find("page").eq(currentPage).attr("id");

		if($(data).find("page").eq(currentPage).attr('graded') == "true"){
			graded = true;
		}
		if($(data).find("page").eq(currentPage).attr('mandatory') == "false"){
			mandatory = false;
		}

		pageTitle = new C_PageTitle();

		var msg = '<div id="scrollableContent" class="antiscroll-wrap matching">';
		msg += '<div class="box">';
		msg += '<div id="contentHolder" class="overthrow antiscroll-inner">';
		msg += '<div id="question" class="questionTop"></div>';
		msg += '<div id="matching">';
		msg += '<div id="matchingAnswers"></div>';
		msg += '<div id="matchingOptions"></div>';
		msg += '</div></div></div></div>';

		audioHolder = new C_AudioHolder();

		$('#stage').append(msg);

		if(type == "matchingDrag" && isMobilePhone){
			type = "matchingDragPhone";
		}

		if(type == "matching" || type == "matchingDragPhone"){
			$("#matchingOptions").addClass("matchingOptions");
			$("#matchingAnswers").addClass("matchingAnswers");
		}else if(type == "matchingDrag"){
			$("#matchingOptions").addClass("matchingDragImgOptions");
			$("#matchingAnswers").addClass("matchingDragImgAnswers");
		}

		//Set Question
		myContent = $(data).find("page").eq(currentPage).find('question').text();
		if(isMobilePhone){
			$("#contentHolder").prepend(myContent);
		}else{
			$("#question").append(myContent);
		}

		//var ariaText = myContent.replace(/\'/g, "").replace(/\"/g, "");
		//$("#question").attr("aria-label", ariaText);
		//pageAccess_arr.push($("#question"));

		placeOptions();
	}



	function placeOptions(){
		//Place each option within the container $('#options') - this allows for easier cleanup, control and tracking.
		var iterator = 0;

		//find every option in the xml - place them on the screen.
		$(data).find("page").eq(currentPage).find("option").each(function()
		{
			//Create unique class name for each option
			var myOption = "option" + iterator;
			//Create each option as a div.

			var matchString = "<div class='matchingStatement' id='"+ myOption + "'>";
			//Add text input field if regular matching
			if (type == "matching" || type == "matchingDragPhone"){
				matchString += "<input type='text' maxlength='1' id='myInput' name='myInput' class='matchingInput' />";
			}

			matchString += "<div id='myMatchingText' class='matchingText'>"+ $(this).text() + "</div></div>";

			// if(type == "matching"){
			// 	matchString += "</div>";
			// }

			$("#matchingOptions").append(matchString);
			$("#"+myOption).data("myMatch", $(this).attr("correct"));

			//#3392
			$('#'+myOption+' input[name="myInput"]').alpha();

			//Position each option with css
			//$("#"+myOption).css({'position':'static', 'paddingBottom':'10px', 'paddingTop':'10px', 'paddingLeft':'4px', 'paddingRight':'35px', 'margin':'10px'});

			/************************************
			IF DRAG DROP ADD DRAGGABLE FUNCTIONALITY
			************************************/
			if(type == "matchingDrag"){
				$('#' + myOption).draggable({	revert: "invalid",
						   	scroll: "true",
						   	scrollSensitivity: 100,
						   	cursor: "crosshair"
				}).button();
			}

			//iterate the iterators...
			optionStatementY += $("#"+myOption).height() + 20;

			iterator++;
			option_arr.push($('#' + myOption));

		});


		//Randomize the answer order or set from previous...
		if(isComplete && mode != "edit"){
			for(var k=0; k<questionResponse_arr.length; k++){
				if(currentPageID == questionResponse_arr[k].id){
					order_arr = [];
					order_arr = questionResponse_arr[k].order;
					break;
				}
			}
		}else{
			iterator = 0;
			$(data).find("page").eq(currentPage).find("answer").each(function(){
				order_arr.push(iterator);
				iterator++;
			});
			order_arr = shuffleArray(order_arr);
		}

		//find every answer or drop spot in the xml - place them on the screen.
		for(var j = 0; j < order_arr.length; j++){
			var myAnswer = "answer" + j;
			var myImg = $(data).find("page").eq(currentPage).find("answer").eq(order_arr[j]).attr("img");
			var myContent = $(data).find("page").eq(currentPage).find("answer").eq(order_arr[j]).find("content").text();
			var myLabel = String.fromCharCode(j % 26 + 65);
			if(type == "matching" || myImg == undefined){
				$("#matchingAnswers").append("<div class='matchingAnswer' id="+ myAnswer + ">"  + myLabel + ". " + myContent + "</div>");
			}
			else if(type == "matchingDragPhone"){
				$("#matchingAnswers").append("<div class='matchingAnswer' id="+ myAnswer + ">"  + myLabel + ". " +"<img id='funk' src='media/"  + myImg + "'></img></div>");
			}
			else if(type == "matchingDrag"){
				$("#matchingAnswers").append("<div class='matchingAnswer' id="+ myAnswer + "><img id='funk' src='media/"  + myImg + "'></img></div>");
				$("#funk").load(function(){
					var greaterHeight = 0;
					if($("#matchingAnswers").height() > $("#matchingOptions").height()){
						greaterHeight = $("#matchingAnswers").height();
					}else{
						greaterHeight = $("#matchingOptions").height();
					}
					$("#matching").height(greaterHeight);
					$('.antiscroll-wrap').antiscroll();
				});

				$('#' + myAnswer).droppable({
					activeClass: "ui-state-hover",
					hoverClass: "ui-state-active",
					start: function(event, ui){
						TweenMax.to(ui.draggable, 1, {css:{scaleX:1, scaleY:1}, ease:Bounce.easeOut, duration: 0.5});
					},
					drop: function(event, ui){
						var updateMove = false;
						for(var i = 0; i < drop_arr.length; i++){
							if(drop_arr[i].myDrag == ui.draggable.attr("id")){
								drop_arr[i].myDrag = ui.draggable.attr("id");
								drop_arr[i].myDrop = event.target.id;
								updateMove = true;
							}
						}

						if(updateMove == false){
							var tempObject = new Object();
							tempObject.myDrag = ui.draggable.attr("id");
							tempObject.myDrop = event.target.id;

							drop_arr.push(tempObject);

							drops++;
						}

						if(drops == dropsMax){
							checkAnswer();
						}
						ui.draggable.hover(
							function(){
								TweenMax.to($(this), 1, {css:{scaleX:1, scaleY:1}, ease:Bounce.easeOut, duration: 0.5});
							},
							function(){
								TweenMax.to($(this), 1, {css:{scaleX:.5, scaleY:.5}, ease:Bounce.easeIn, duration: 0.5});
							}
						);
						TweenMax.to(ui.draggable, 1, {css:{scaleX:.5, scaleY:.5}, ease:Bounce.easeOut, duration: 0.5});
					}
				});
			}

			$("#"+myAnswer).data("matchID", $(data).find("page").eq(currentPage).find("answer").eq(order_arr[j]).attr("correct"));
			$("#"+myAnswer).data("matchMap", myLabel);
			$("#"+myAnswer).css({'position':'static', 'paddingBottom':'10px', 'paddingTop':'10px', 'paddingLeft':'4px', 'paddingRight':'35px', 'margin':'10px'});

			//iterator++;
			answer_arr.push($('#' + myAnswer));
		};
		$("#matchingAnswers").append("</div>");

		var greaterHeight = 0;
		if($("#matchingAnswers").height() > $("#matchingOptions").height()){
			greaterHeight = $("#matchingAnswers").height();
		}else{
			greaterHeight = $("#matchingOptions").height();
		}
		$("#matching").height(greaterHeight);

		placematchingSubmit();

		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));

		//Do matching acessibility.
		for(var i = 0; i < option_arr.length; i++){

			var ariaText = "Matching Option: " + option_arr[i].text();
			ariaText += " enter the letter of the item which best matches this option:";
			for(var j = 0; j < answer_arr.length; j++){
				ariaText += "Answer Option: " + answer_arr[j].text();
			}


			var tempInput = option_arr[i].find("input");

			ariaText.replace(/'/g, "");
			$(tempInput).attr("aria-label", ariaText);
			pageAccess_arr.push($(tempInput));
		}

		pageAccess_arr.push($("#mcSubmit"));

		//////END Accessibility
        checkMode();

		if(isComplete && mode != "edit"){
			//disableOptions();
			//$("#mcSubmit").button({ disabled: true });
			showUserAnswer();
		}

		if(transition == true){
			TweenMax.to($("#stage"), transitionLength, {css:{opacity:1}, ease:transitionType});
		}

		doAccess(pageAccess_arr);
	}


	function placematchingSubmit(){
		if(type == "matching" || type == "matchingDragPhone"){
			$("#contentHolder").append('<div id="mcSubmit" aria-label="'+$(data).find("page").eq(currentPage).attr("btnText")+'"></div>');
			$("#mcSubmit").button({ label: $(data).find("page").eq(currentPage).attr("btnText")/*, disabled: true*/ });
			$("#mcSubmit").click(checkAnswer).keypress(function(event) {
		        var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
		        if (chCode == 32 || chCode == 13){
			        $(this).click();
			    }
	        });
		}

	}


	function showUserAnswer(){
		//Show markings - green check - red x
		for(var i=0; i<questionResponse_arr.length; i++){
			if(currentPageID == questionResponse_arr[i].id){
				var temp_arr = questionResponse_arr[i].userAnswer;
				tempCorrect = true;
				for(var k = 0; k < temp_arr.length; k++){
					if(type == "matching" || type == "matchingDragPhone"){
						option_arr[k].find("input").val(temp_arr[k]);
						//Map the user input to the matchID - needed since randomizing
						var userInput = option_arr[k].find('input').val().toUpperCase()
						var userMap = null;
						for(var h = 0; h < answer_arr.length; h++){
							if(answer_arr[h].data("matchMap") == userInput){
								userMap = answer_arr[h].data("matchID");
								break;
							}
						}

						if(option_arr[k].data("myMatch") != userMap){
							tempCorrect = false;
							option_arr[k].addClass("optionIncorrect");
							//Find the correct answer to display.
							var correctDisplay = "";
							for(var l = 0; l < answer_arr.length; l++){
								if(option_arr[k].data("myMatch") == answer_arr[l].data("matchID")){
									correctDisplay = answer_arr[l].data("matchMap");
								}
							}
							//Display the correct answer before the input.
							//$("<span style='position: relative; float: left; margin-top: 2px; margin-right: 5px;'><b>" + correctDisplay + "  </b></span>").insertBefore(option_arr[k].find('input'));
							option_arr[k].prepend("<span style='position: relative; float: left; margin-top: 2px; margin-right: 5px;'><b>" + correctDisplay + "  </b></span>");
						}else{
							option_arr[k].addClass("optionCorrect");
						}
					}else{
						var tempDrag = temp_arr[k].drag;
						var tempDrop = temp_arr[k].drop;
						if($("#" + tempDrop).data("matchID") != $("#" + tempDrag).data("myMatch")){
							tempCorrect = false;
							$("#" + tempDrag).addClass("optionIncorrect");
						}else{
							$("#" + tempDrag).addClass("optionCorrect");
						}
						$("#" + tempDrag).css({"top":temp_arr[k].top, "left":temp_arr[k].left, "position":"absolute"});
						TweenMax.to($("#" + tempDrag), 1, {css:{scaleX:.5, scaleY:.5}});
						$("#" + tempDrag).removeClass("ui-draggable");
					}
				}
			}
		}

		//set SCORM objective for page - C_SCORM.js
		setPageObjective(tempCorrect, graded);

		$(".matchingInput").prop('disabled', true);
		$("#mcSubmit").button({ disabled: true });
		mandatoryInteraction = false;
		checkNavButtons();
	}


	function checkAnswer(){
		//////////////////////////CHECK IF CORRECT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		$("#dialog-attemptResponse").remove();
		attemptsMade++;
		marking_arr = [];
		tempCorrect = true;

		/*check for regular matching*/
		if(type == "matching" || type == "matchingDragPhone"){
			for(var i=0; i < option_arr.length; i++){
				var markingObject = new Object();

				//Map the user input to the matchID - needed since randomizing
				var userInput = option_arr[i].find($('input[id=myInput]')).val().toUpperCase();
				var userMap = null;
				for(var h = 0; h < answer_arr.length; h++){
					if(answer_arr[h].data("matchMap") == userInput){
						userMap = answer_arr[h].data("matchID");
						break;
					}
				}

				if(option_arr[i].data("myMatch") != userMap){
					tempCorrect = false;
					markingObject.isCorrect = false;
				}else{
					//tempCorrect = true;
					markingObject.isCorrect = true;
				}
				markingObject.userInput = userInput;
				markingObject.myDrop = option_arr[i];
				marking_arr.push(markingObject);
			}
		}else if(type == "matchingDrag"){
			for(var i=0; i < drop_arr.length; i++){
				var tempDrag = $("#" + drop_arr[i].myDrag);
				var tempDrop = $("#" + drop_arr[i].myDrop);

				var markingObject = new Object();

				if(tempDrag.data("myMatch") != tempDrop.data("matchID")){
					tempCorrect = false;
					markingObject.isCorrect = false;
				}else{
					markingObject.isCorrect = true;
				}
				markingObject.myDrop = tempDrop;
				markingObject.myDrag = tempDrag;
				marking_arr.push(markingObject);
			}
		}

		//record SCORM cmi.interaction data
		var _title = pageTitle.getPageTitle().replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '');
		var _learnerResponse = '';

		for (var i = 0; i < marking_arr.length; i++) {
			if(type == "matching" || type == "matchingDragPhone"){
				var matchingItem = marking_arr[i].myDrop.find($('div[id=myMatchingText]')).text();
				_learnerResponse += matchingItem.replace(/\s+/g, '') + "[.]" + marking_arr[i].userInput;
			}
			else{
				var matchingItem = marking_arr[i].myDrag.find($('div[id=myMatchingText]')).text();
				_learnerResponse += matchingItem.replace(/\s+/g, '') + "[.]" + marking_arr[i].myDrop.data("matchID");
			}

			if(i+1 != marking_arr.length){
				_learnerResponse += "[,]";
			}
		};


		setInteractions(pageId, "matching", _learnerResponse, tempCorrect, _title +":"+ $.trim($("#question").text()));

		/************************************
		POPULATE FEEDBACK STRING
		************************************/
		var msg = "";
		//console.log(tempCorrect);
		if(feedbackType == 'undifferentiated'){
			if(tempCorrect == true){
				msg = '<div id="dialog-attemptResponse" class="correct" title="'+ feedbackCorrectTitle +'"><p> '+ feedback +'</p></div>';
			}else{
				if(attemptsMade == attemptsAllowed){
					//incorrect feedback here
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p> '+ feedback +'</p></div>';
				}else{
					//try again.
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectAttempt +'</p></div>';
				}
			}
		}else if(feedbackType == 'differentiated'){
			if(tempCorrect == true){
				msg = '<div id="dialog-attemptResponse" class="correct" title="That is Correct."></div>';
			}else{
				msg = '<div id="dialog-attemptResponse" class="correct" title="That is not correct."></div>';
			}
		}else if(feedbackType == 'standardized'){
			if(tempCorrect == true){
				msg = '<div id="dialog-attemptResponse" class="correct" title="That is Correct."></div>';
			}else{

			}
		}

		if(tempCorrect == true || attemptsMade == attemptsAllowed){
			var selected_arr = [];
			if(type == "matching" || type == "matchingDragPhone"){
				for(var i = 0; i < option_arr.length; i++){
					selected_arr.push(option_arr[i].find("input").val().toUpperCase());
				}
			}else{
				for(var i=0; i < drop_arr.length; i++){
					var tempDrag = drop_arr[i].myDrag;
					var tempDrop = drop_arr[i].myDrop;

					var selectedObject = new Object();
					selectedObject.top = $("#" + tempDrag).position().top;
					selectedObject.left = $("#" + tempDrag).position().left;
					selectedObject.drop = tempDrop;
					selectedObject.drag = tempDrag;
					selected_arr.push(selectedObject);
				}
			}

			updateScoring(selected_arr, tempCorrect, order_arr, 0);
			$("#mcSubmit").button({ disabled: true });
			showUserAnswer();
		}

		/************************************
		PLACE THE FEEDBACK
		************************************/

		$("#matching").prepend(msg);
		//all mobile content will use the pop display
		if(isMobile){
			feedbackDisplay = "pop";
		}
		if(feedbackDisplay == "pop"){
			if(tempCorrect == true || attemptsMade == attemptsAllowed){
				$( "#dialog-attemptResponse" ).dialog({
					modal: true,
					width: 550,
					dialogClass: "no-close",
					close: function(event, ui){
						pageAccess_arr[2].focus();
						mandatoryInteraction = false;
						checkNavButtons();
						$("#dialog-attemptResponse").remove();
					},
					buttons: {
						Close: function(){
							$( this ).dialog( "close" );
							$("#dialog-attemptResponse").remove();
						},
						Proceed: function(){
							$( this ).dialog( "close" );
							if(isLinear == true){
								updateTracking();
							}
							$("#next").click();
						}
					},
					open: function(){
						$('.ui-dialog-buttonpane').find('button:contains("Close")').addClass('feedback-close-button');
						//$('.ui-dialog-buttonpane').find('button:contains("Proceed")').addClass('feedback-proceed-button');
						var cont = feedback;
						var ariaText = cont.replace(/'/g, "");
						$('.ui-dialog-buttonpane').find('button:contains("Proceed")').addClass('feedback-proceed-button').attr('aria-label', ariaText + ' Press spacebar to proceed.').focus();
					}
				});
			}else{
				$( "#dialog-attemptResponse" ).dialog({
					modal: true,
					width: 550,
					dialogClass: "no-close",
					close: function(event, ui){
						if(type == "matchingDrag"){
							drops = 0;
							for(var i=0; i<option_arr.length; i++){
								TweenMax.to(option_arr[i], transitionLength, {css:{top:0, scaleX: 1, scaleY: 1, left:0}, ease:transitionType});
								option_arr[i].unbind("mouseenter mouseleave");
							}
							drop_arr = [];
						}
						pageAccess_arr[2].focus();
						$("#dialog-attemptResponse").remove();
					},
					buttons: {
						OK: function(){
							$( this ).dialog( "close" );
						}
					},
					open: function(){
						$('.ui-dialog-buttonpane').find('button:contains("OK")').attr('aria-label', 'OK - That is incorrect. Please try again. Click here.').focus();
					}

				});
			}
			$( "#dialog-attemptResponse" ).focus();
		}else if(feedbackDisplay == "inline"){

			if(type == "matchingDrag"){
				$( "#dialog-attemptResponse" ).addClass("inlineLeftFeedback");
			}else if(type == "matching"){
				$( "#dialog-attemptResponse" ).addClass("inlineBottomFeedback");
			}

			//If drag and attempts left - move options back to start point
			if(attemptsAllowed > attemptsMade && tempCorrect == false){
				if(type == "matchingDrag"){
					$("#dialog-attemptResponse").append("<div id='ok_but'>Try Again</div>");
					$("#ok_but").button().click(function(){
						$("#dialog-attemptResponse").remove();
						drops = 0;
						var tempStatementY = 0;
						for(var i=0; i<option_arr.length; i++){
							TweenMax.to(option_arr[i], transitionLength, {css:{top:tempStatementY, scaleX: 1, scaleY: 1, left:0}, ease:transitionType});
							tempStatementY += option_arr[i].height() + 20;
						}
						drop_arr = [];
					});
				}
			}
		}
	}

	function checkMode(){
		$('.antiscroll-wrap').antiscroll();

		if(mode == "edit"){
			/***************************************************************************************************
			EDIT QUESTION
			***************************************************************************************************/
			$("#question").attr('contenteditable', true);
			CKEDITOR.inline( 'question', {
				on: {
					blur: function (event){
						if(cachedTextPreEdit != event.editor.getData()){
							saveContentEdit(event.editor.getData());
						}
						enableNext();
						enableBack();
					},
					focus: function (event){
						cachedTextPreEdit = event.editor.getData();
						disableNext();
						disableBack();
					}
				},
				toolbar: contentToolbar,
				toolbarGroups :contentToolgroup,
				extraPlugins: 'sourcedialog'
			});


			/*******************************************************
			* Edit Question
			********************************************************/
               //Add and style titleEdit button
			$('#matching').prepend("<div id='questionEdit' class='btn_edit_text' title='Edit Text Question'></div>");

			$("#questionEdit").click(function(){
				updateQuestionEditDialog();
			}).tooltip();
		}
	}
	function updateQuestionEditDialog(){
		//Create the Content Edit Dialog
        var msg = "<div id='questionEditDialog' title='Set Question Preferences'>";
        msg += "<label id='label'>no. of attempts: </label>";
		msg += "<input type='text' name='myName' id='inputAttempts' value='"+ attemptsAllowed +"' class='dialogInput' style='width:35px;' title='Increase the number of attempts.'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'><b>graded: </b></label>";
		msg += "<input id='isGraded' type='checkbox' name='graded' class='radio' value='true' title='Indicates if this page is graded.'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'><b>mandatory: </b></label>";
		msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true' title='Indicates if this page is must be completed before going to the next page.'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        msg += "<label id='label'>drag and drop: </label>";
		msg += "<input id='dragAndDrop' type='checkbox' name='dragAndDrop' class='radio' value='true' title='Check for drag and drop functionality.'/><br/><br/>";
		msg += "<div id='feedbackLabel'>Input your feedback:</div>";
		msg += "<div id='feedbackEditText' type='text' contenteditable='true' class='dialogInput'>" + feedback + "</div><br/>";
		msg += "<b>Options:</b><br/><div id='myOptionList'></div><br/>";
		msg += "<b>Answers:</b><br/><div id='myAnswerList'></div>";
		$("#stage").append(msg);

        if(!graded){
			$("#isGraded").removeAttr('checked');
		}else{
			$("#isGraded").attr('checked', 'checked');
		}

        if(!mandatory){
			$("#isMandatory").removeAttr('checked');
		}else{
			$("#isMandatory").attr('checked', 'checked');
		}

		if(type == "matching"){
			$("#dragAndDrop").removeAttr('checked');
		}else{
			$("#dragAndDrop").attr('checked', 'checked');
		}

		$("#dragAndDrop").change(function(){
			if($("#dragAndDrop").prop("checked") == true){
				type = "matchingDrag";
			}else{
				type = "matching";
			}
			$("#questionEditDialog").dialog( "close" );
			optionEdit_arr = [];
			answerEdit_arr = [];
			updateQuestionEditDialog();
		});

		CKEDITOR.inline( "feedbackEditText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
		   	on: {
		      instanceReady: function(event){
		         $(event.editor.element.$).attr("title", "Click here to edit this feedback.");
		    	}
		    }
		});

		optionCount = option_arr.length;
		//find every option in the xml - place them on the screen.
		for (var i = 0; i < optionCount; i++){
			addOption(i, false);
		};

		for(var j = 0; j < answer_arr.length; j++){
			addAnswer(j, false);
		}

		//#3321 fixes dialog jumping issue
		$.ui.dialog.prototype._focusTabbable = function(){};

		//Style it to jQuery UI dialog
		$("#questionEditDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 800,
			height: 650,
			dialogClass: "no-close",
			close: function(){
				CKEDITOR.instances["feedbackEditText"].destroy();

				for(var i = 0; i < optionEdit_arr.length; i ++){
					 CKEDITOR.instances[optionEdit_arr[i]+"Text"].destroy();
				}
				//if($("#dragAndDrop").prop("checked") == false){
				for(var i = 0; i < answerEdit_arr.length; i ++){
					var editor = CKEDITOR.instances[answerEdit_arr[i]+"Text"];
					if(editor){editor.destroy(true);}
				}
				$("#questionEditDialog").remove();
			},
			buttons: [
				{
					text: "AddOption",
					title: "Adds a new matching option.",
					click: function(){
						addOption(optionEdit_arr.length, true);
					}
				},
				{
					text: "AddAnswer",
					title: "Adds a new matching answer.",
					click: function(){
						addAnswer(answerEdit_arr.length, true);
					}
				},
				{
					text: "Done",
					title: "Saves and closes the edit dialog.",
					click: function(){
						var tmpObj = new Object();
						tmpObj.attempts = $("#inputAttempts").val();

						if($("#isGraded").prop("checked") == true){
							$(data).find("page").eq(currentPage).attr("graded", "true");
							tmpObj.graded = true;
						}else{
							$(data).find("page").eq(currentPage).attr("graded", "false");
							tmpObj.graded = false;
						}
						if($("#isMandatory").prop("checked") == true){
							$(data).find("page").eq(currentPage).attr("mandatory", "true");
						}else{
							$(data).find("page").eq(currentPage).attr("mandatory", "false");
						}

						if($("#dragAndDrop").prop("checked") == true){
							tmpObj.layout = "matchingDrag";
						}else{
							tmpObj.layout = "matching";
						}


						tmpObj.feedbackUpdate = CKEDITOR.instances["feedbackEditText"].getData();
						var tmpOptionArray = new Array();
						for(var i = 0; i < optionEdit_arr.length; i++){
							var tmpOptionObj = new Object();
							tmpOptionObj.optionText = CKEDITOR.instances[optionEdit_arr[i]+"Text"].getData();
							tmpOptionObj.optionCorrect = $("#"+optionEdit_arr[i]+"Match").val();
							tmpOptionArray.push(tmpOptionObj);
						}
						tmpObj.option_arr = tmpOptionArray;

						var tmpAnswerArray = new Array();
						for(var i = 0; i < answerEdit_arr.length; i++){
							var tmpAnswerObj = new Object();

							if(tmpObj.layout == "matchingDrag"){
								tmpAnswerObj.answerText = $("#"+ answerEdit_arr[i]+"Text").val();
							}else{
								tmpAnswerObj.answerText = CKEDITOR.instances[answerEdit_arr[i]+"Text"].getData();
							}
							tmpAnswerObj.answerCorrect = $("#"+answerEdit_arr[i]+"Match").val();

							tmpAnswerArray.push(tmpAnswerObj);
						}
						tmpObj.answer_arr = tmpAnswerArray;

						saveQuestionEdit(tmpObj);
						$("#questionEditDialog").dialog("close");
					}
				}
			]

		});

		//adds tooltips to the edit dialog buttons

	    $(function () {
	        $(document).tooltip();
	    });

	}

	function addAnswer(_addID, _isNew){
		var answerID = "answer" + _addID;
		var answerLabel = _addID + 1;


		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<answer>"));
			var answer1 = new DOMParser().parseFromString('<answer></answer>', "text/xml");
			$(data).find("page").eq(currentPage).find("answer").eq(_addID).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			$(data).find("page").eq(currentPage).find("answer").eq(_addID).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var answer1CDATA = content1.createCDATASection("Input Answer");
			$(data).find("page").eq(currentPage).find("answer").eq(_addID).find("content").append(answer1CDATA);
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(currentPage).find("answer").eq(_addID).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(currentPage).find("answer").eq(_addID).attr("correct", "X");
			$(data).find("page").eq(currentPage).find("answer").eq(_addID).attr("img", "defaultReveal.png");
		}

		var myMatch = $(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct");
		//var myLabel = String.fromCharCode(_addID % 26 + 65);
		var myLabel = $(data).find("page").eq(currentPage).find("answer").eq(_addID).attr("correct");
		var msg = "<div id='"+answerID+"Container' class='templateAddItem'>";
		msg += "<div id='"+answerID+"Remove' class='removeMedia' value='"+_addID+"' title='Click to remove this answer'/>";
		msg += "<label id='label'>Answer "+ answerLabel +" Match: </label>";
		msg += "<input type='text' name='myLabel' id='"+answerID+"Match' value='"+ myLabel +"' class='dialogInput' style='width:35px; text-align:center' title='Click here to edit the answer label. This value must be an uppercase letter.'/><br/>";
		if(type == "matching"){
			var answerContent = $(data).find("page").eq(currentPage).find("answer").eq(_addID).find("content").text();
			msg += "<div id='"+answerID+"Input'>Answer " + answerLabel + " Text:</div>";
			msg += "<div id='"+answerID+"Text' contenteditable='true' class='dialogInput'>" + answerContent + "</div>";
		}else{
			var answerImage = $(data).find("page").eq(currentPage).find("answer").eq(_addID).attr("img");
			msg += "<div id='"+answerID+"Input'>Drop Spot " + answerLabel + " Image:</div>";
			msg += "<input id='"+answerID+"Text' class='dialogInput' type='text' value="+ answerImage + " defaultValue="+ answerImage + " style='width:85%;'/>";
		}
		msg += "</div>";

		$("#myAnswerList").append(msg);

		if(type == "matching"){
			CKEDITOR.inline( answerID+"Text", {
				toolbar: contentToolbar,
				toolbarGroups :contentToolgroup,
				enterMode : CKEDITOR.ENTER_BR,
				shiftEnterMode: CKEDITOR.ENTER_P,
				extraPlugins: 'sourcedialog',
			   	on: {
			      instanceReady: function(event){
			         $(event.editor.element.$).attr("title", "Click here to edit this matching answer text.");
			    	}
			    }
			});
		}

		//#3392
		$('#'+answerID+'Match').alpha("upper");

		$("#" +answerID+"Remove").click(function(){
			var arrIndex = $(this).attr('value');
			console.log($(data).find("pages").eq(currentPage).find("answer").length);
			$(data).find("pages").eq(currentPage).find("answer").eq(arrIndex).remove();
			console.log($(data).find("pages").eq(currentPage).find("answer").length);
			answerEdit_arr.splice(arrIndex, 1);
			$("#answer" + arrIndex+"Container").remove();
			for(var i = 0; i < answerEdit_arr.length; i++){
				$("#"+answerEdit_arr[i]).find(".removeMedia").attr("value", i);
			}
		});

		answerCount++;
		answerEdit_arr.push(answerID);
	}

	function addOption(_addID, _isNew){
		var optionID = "option" + _addID;
		var optionLabel = _addID + 1;

		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<option>"));
			var option= new DOMParser().parseFromString('<option></option>',  "text/xml");
			var optionCDATA = option.createCDATASection("Input Option");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).append(optionCDATA);
			$(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct", "X");
		}

		var myMatch = $(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct");

		var msg = "<div id='"+optionID+"Container' class='templateAddItem'>";
		msg += "<div id='"+optionLabel+"Remove' class='removeMedia' value='"+_addID+"' title='Click to remove this option'/>";
		msg += "<label id='label'>Option " + optionLabel + " Match: </label>";
		msg += "<input type='text' name='myMatch' id='"+optionID+"Match' value='"+ myMatch +"' value='X' class='dialogInput' style='width:35px; text-align:center;' title='Click here to edit the option label. This value must be an uppercase letter.'/><br/>";
		var optionContent = $(data).find("page").eq(currentPage).find("option").eq(_addID).text();
		msg +="<div id='"+optionID+"Input'>Option " + optionLabel + " Text:</div>";
		msg += "<div id='"+optionID+"Text' class='dialogInput' contenteditable='true'>" + optionContent + "</div>";
		msg += "</div>"
		$("#myOptionList").append(msg);

		CKEDITOR.inline( optionID+"Text", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
		   	on: {
		      instanceReady: function(event){
		         $(event.editor.element.$).attr("title", "Click here to edit this matching option.");
		    	}
		    }
		});
		
		//#3392
		$('#'+optionID+'Match').alpha("upper");

		$("#" +optionLabel+"Remove").click(function(){
			var arrIndex = $(this).attr('value');
			$(data).find("pages").eq(currentPage).find("option").eq(arrIndex).remove();
			optionEdit_arr.splice(arrIndex, 1);
			$("#option"+arrIndex+"Container").remove();
			for(var i = 0; i < answerEdit_arr.length; i++){
				$("#"+ optionEdit_arr[i]).find(".removeMedia").attr("value", i);
			}
		});

		optionEdit_arr.push(optionID);
	}

	/**********************************************************************
    **Save Content Edit - save updated content text to content.xml
    **********************************************************************/
    function saveContentEdit(_data){
        var docu = new DOMParser().parseFromString('<question></question>',  "application/xml")
        var newCDATA=docu.createCDATASection(_data);
        $(data).find("page").eq(currentPage).find("question").first().empty();
        $(data).find("page").eq(currentPage).find("question").first().append(newCDATA);
        sendUpdateWithRefresh();
    };

	function saveQuestionEdit(_data){
		var feedbackUpdate = _data.feedbackUpdate;
		var feedDoc = new DOMParser().parseFromString('<feedback></feedback>', 'application/xml');
		var feedCDATA = feedDoc.createCDATASection(feedbackUpdate);

		//Update the local xml - first clearning the content node and then updating it with out newCDATA
		$(data).find("page").eq(currentPage).find("feedback").empty();
		$(data).find("page").eq(currentPage).find("feedback").append(feedCDATA);
		$(data).find("page").eq(currentPage).attr("attempts", _data.attempts);

		for(var j = 0; j < questionResponse_arr.length; j++){
			if(questionResponse_arr[j].id == $(data).find('page').eq(currentPage).attr('id')){
				questionResponse_arr[j].graded = _data.graded;
			}
		}
		$(data).find("page").eq(currentPage).attr("graded", _data.graded);
		$(data).find("page").eq(currentPage).attr("mandatory", _data.mandatory);
		$(data).find("page").eq(currentPage).attr("layout", _data.layout);

		for(var i = 0; i < optionEdit_arr.length; i++){
			var optionText = _data.option_arr[i].optionText;
			var optionCorrect = _data.option_arr[i].optionCorrect;
			var newOption = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var optionCDATA = newOption.createCDATASection(optionText);
			$(data).find("page").eq(currentPage).find("option").eq(i).empty();
			$(data).find("page").eq(currentPage).find("option").eq(i).append(optionCDATA);
			$(data).find("page").eq(currentPage).find("option").eq(i).attr("correct", optionCorrect);
		}

		for(var i = optionEdit_arr.length; i < optionCount; i++){
			$(data).find("page").eq(currentPage).find("option").eq(i).remove();
		}

		for(var i = 0; i < answerEdit_arr.length; i++){
			var answerText = _data.answer_arr[i].answerText;
			var answerCorrect = _data.answer_arr[i].answerCorrect;
			if(_data.layout == "matching"){
				var newAnswer = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
				var answerCDATA = newAnswer.createCDATASection(answerText);
				$(data).find("page").eq(currentPage).find("answer").eq(i).find("content").empty();
				$(data).find("page").eq(currentPage).find("answer").eq(i).find("content").append(answerCDATA);
			}else{
				$(data).find("page").eq(currentPage).find("answer").eq(i).attr("img", answerText);
			}
			$(data).find("page").eq(currentPage).find("answer").eq(i).attr("correct", answerCorrect);
		}

		for(var i = answerEdit_arr.length; i < answerCount; i++){
			$(data).find("page").eq(currentPage).find("answer").eq(i).remove();
		}

		markIncomplete();
		sendUpdateWithRefresh();
		fadeComplete();
	}


	this.destroySelf = function() {
		 TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:Power2.easeIn, onComplete:fadeComplete});
    }

    this.fadeComplete = function(){
        	fadeComplete();
	}
    // fadeComplete() moved to C_UtilFunctions.js

}