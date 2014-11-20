/*!
 * C_MultipleChoice
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
 *		4. Auto-mcSubmit - when a user selects an option, it is mcSubmitted without having to click mcSubmit. Default == false;
 *		5. Allows for a background image to utilized.
 *		6. Timer - a timer can be set which counts down until 0 - if they don't answer they get a zero.
 *		7. Ability to add higher score related to time to answer.
 *		8. Point weighted questions - more points for more difficult ones.
 */
function C_MultipleChoice(_type) {
	// var pageTitle;
	// var audioHolder;
    var myContent;//Body
    var optionHolderY = 0;
    var optionStartX = 0;
    var mcSubmitButtonY = 0;
    var attemptsAllowed = 2;
    var attemptsMade = 0;
    var optionLabeling = "a"; //"a" for alphabetic - "n" for numeric
    var type = _type;
    var option_arr = [];
    var feedbackType;
    var feedbackDisplay;
    var feedbackCorrectTitle;
    var feedbackIncorrectTitle;
    var feedbackIncorrectAttempt;
    var feedback;
    var iconClicked = false;
    var conHeight;
    var isMulti = false;

    var isComplete = false;
    var optionEdit_arr = [];
    var optionCount = 0;
    var graded = false;
    var mandatory = true;
    var randomize = false;
    var pageId;

    var order_arr = [];
    var scormVersion;

    var currentEditBankMember = 0;
    var revealMenu_arr;
    var currentEditBankMember = 0;
	var revealMenu_arr = [];
	var currentItem;

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
		if($(data).find("page").eq(currentPage).attr('randomize') == "true"){
			randomize = true;
		}

		pageTitle = new C_PageTitle();

		$('#stage').append('<div id="scrollableContent" class="antiscroll-wrap top"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="question" class="questionTop"></div><div id="answerOptions"></div></div></div>');

		audioHolder = new C_AudioHolder();

		optionCount = $(data).find("page").eq(currentPage).find("option").length;

		var correctCount = 0;
		for(var i = 0; i < optionCount; i++){
			if($(data).find("page").eq(currentPage).find("option").eq(i).attr('correct') == "true"){
				correctCount++;
			}
		}

		if(correctCount > 1){
			isMulti = true;
		}

		//Set Question
		myContent = $(data).find("page").eq(currentPage).find('question').text();
		$("#question").append(myContent);
		var cont = myContent;
		var ariaText = $(cont).text().replace(/'/g, "");
		$("#question").attr("aria-label", ariaText);
		pageAccess_arr.push($("#question"));
		//Place each option within the container $('#options') - this allows for easier cleanup, control and tracking.
		var iterator = 0;
		var optionY = 0;

		if(isMulti == false){
			$('#answerOptions').append('<div id="answer" class="radioSelector">');
		}else{
			$('#answerOptions').append('<div id="answer" class="checkBox">');
		}
		//console.log("number of options = " + optionCount);

		order_arr = [];
		//Randomize the answer order or set from previous...
		if(isComplete  && mode != "edit"){
			for(var k=0; k<questionResponse_arr.length; k++){
				if(currentPageID == questionResponse_arr[k].id){
					order_arr = [];
					order_arr = questionResponse_arr[k].order;
					break;
				}
			}
		}else{
			for (var i = 0; i < optionCount; i++){
				order_arr.push(i);
			}

			if(randomize){
				order_arr = shuffleArray(order_arr);
			}
		}

		//find every option in the xml - place them on the screen.
		for(var j = 0; j < order_arr.length; j++){
			var myNode = $(data).find("page").eq(currentPage).find("option").eq(order_arr[j]);
			//Create unique class name for each option
			var myOption = "option" + iterator;
			//Create each option as a div.
			var myLabel = String.fromCharCode(iterator % 26 + 65);

			if(isMulti == false){
				$('#answer').append('<div class="option" id="' + myOption + '"><input id="' + myOption + 'Check" type="radio" name=' + type + '" class="radio" value="' + myNode.attr("correct")+ '" role="button"/><label id="label" class="fixFunkyIssue" for="'+ myOption +'Check">'+ myLabel + '. ' +myNode.find("content").text() +'</label></div>');
			}else{
				$('#answer').append('<div class="option" id="' + myOption + '"><input id="' + myOption + 'Check" type="checkbox" name=' + type + '" class="radio" value="' + myNode.attr("correct")+ '" role="button"/><label id="label" class="fixFunkyIssue" for="'+ myOption +'Check">'+ myLabel + '. ' +myNode.find("content").text() +'</label></div>');
			}

			$(".fixFunkyIssue").click(function(){
				iconClicked = true;
			});

			$("#" + myOption + "Check").click(function(){
				iconClicked = true;
				if($(this).prop('checked') == true){
					$(this).parent().addClass("optionSelected")
				}else{
					$(this).parent().removeClass("optionSelected")
				}
			});


			//Add button click action to each option
			$('#' + myOption).click( function(){
				$("#mcSubmit").button({ disabled: false });

				if(isMulti == false){
					$(this).find('input').prop('checked', true);
					for(var i=0; i<option_arr.length; i++){
						if(option_arr[i].hasClass("optionSelected") ){
							option_arr[i].removeClass("optionSelected");
						}
					}
					$(this).addClass("optionSelected");
				}else if(isMulti == true){
					if($(this).find('input').prop('checked') == true){
						if(iconClicked != true){
							$(this).find('input').prop('checked', false);
							$(this).removeClass("optionSelected");
						}

					}else{
						if(iconClicked != true){
							$(this).find('input').prop('checked', true);
							$(this).addClass("optionSelected");
						}
					}
				}
				iconClicked = false;
			}).hover(function(){
					$(this).addClass("optionHover");
				},
				function(){
					$(this).removeClass("optionHover")
				}
			);

			if(!isMulti){
				$('#' + myOption).keypress(function(event) {
			        var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
			        if (chCode == 32){
				        $(this).click();
				    }
		        });
			}

			//iterate the iterators...
			optionY += $("#"+myOption).height() + 30;
			iterator++;
			option_arr.push($('#' + myOption));
			var cont = myNode;
			if(isMulti){
				var ariaText = myLabel + "." + $(cont).text().replace(/'/g, "") + ". Use the tab or shift-tab to hear other options. Press spacebar to select.";
			}else{
				var ariaText = myLabel + "." + $(cont).text().replace(/'/g, "") + ". Use up and down arrow keys to hear other options. Press spacebar to select.";
			}
			$('#' + myOption + "Check").attr("aria-label", ariaText);
			pageAccess_arr.push($('#' + myOption + "Check"));
		};

		$("#answerOptions").append('<div id="mcSubmit"></div>');

		$("#answerOptions").append("</div>");

		$("#mcSubmit").button({ label: $(data).find("page").eq(currentPage).attr("btnText"), disabled: true });

		$("#mcSubmit").click(checkAnswer).keypress(function(event) {
		    var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
		    if (chCode == 32){
			    $(this).click();
			}
	    });

		$("#mcSubmit").attr("aria-label", "Submit your answer.").attr("role", "button");
		pageAccess_arr.push($("#mcSubmit"));

		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top) + audioHolder.getAudioShim());
		if(isIE){
			$("#contentHolder").css("margin-bottom", "-16px");
		}

		if(type == "multipleChoiceMedia"){
        	$("#answerOptions").addClass("left");
        	mediaHolder = new C_VisualMediaHolder();
        	mediaHolder.loadVisualMedia(checkMode());
        }else{
			checkMode();
        }

		if(isComplete){
			disableOptions();
			$("#mcSubmit").button({ disabled: true });
			showUserAnswer();
		}

		if(transition == true){
			TweenMax.to($("#stage"), transitionLength, {css:{opacity:1}, ease:transitionType});
		}
		doAccess(pageAccess_arr);
	}


	//Called if the user closes the popup instead of proceed
	function disableOptions(){
		for(var i = 0; i < option_arr.length; i++){
			option_arr[i].unbind();
		}
	}


	function showUserAnswer(){
		for(var i = 0; i < questionResponse_arr.length; i++){
			if(currentPageID == questionResponse_arr[i].id){
				var temp_arr = questionResponse_arr[i].userAnswer;
				var tempCorrect = true;
				for(var k = 0; k < temp_arr.length; k++){
					option_arr[temp_arr[k]].find("input").prop("checked", "checked");
					if(option_arr[temp_arr[k]].find('input').attr("value") == "false"){
						tempCorrect = false;
						option_arr[temp_arr[k]].addClass("optionIncorrect");
					}else{
						option_arr[temp_arr[k]].addClass("optionCorrect");
					}
				}
				if(questionResponse_arr[i].correct == false){
					for(var j = 0; j < option_arr.length; j++){
						if(option_arr[j].find("input").attr("value") == "true"){
							option_arr[j].addClass("optionCorrect");
						}
					}
				}
				break;
			}
		}

		//set SCORM objective for page - C_SCORM.js
		setPageObjective(tempCorrect, graded);

		$(".radio").prop('disabled', true);
		mandatoryInteraction = false;
		checkNavButtons();
	}

	function checkAnswer(){
		//////////////////////////CHECK CORRECT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		var tempCorrect = true;
		attemptsMade++;
		var _title = pageTitle.getPageTitle().replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '');
		if(isMulti == false){
			var selected = $("#answer input[type='radio']:checked");
			if(selected.val() == "true"){
				tempCorrect = true;
			}else{
				tempCorrect = false;
			}
			//add true/false SCORM interaction here
			var label = $.trim($("label[for='"+ selected.attr('id') +"']").text().replace(/\s+/g, ''));
			//ensure it is a true/false options
			if(label.toLowerCase().indexOf("true") >= 0 || label.toLowerCase().indexOf("false") >= 0 ){
				var _learnerResponse = "false";
				if(label.toLowerCase().indexOf("true") >= 0){
					_learnerResponse = "true";
				}
				setInteractions(pageId, "true-false", _learnerResponse, tempCorrect, _title + " : " + $.trim($("#question").text()));
			}
			else{
				setInteractions(pageId, "choice", label, tempCorrect, _title + " : " + $.trim($("#question").text()));
			}

		}else{
			var _learnerResponse = [];
			for(var i = 0; i < option_arr.length; i++){
				if(option_arr[i].find('input').attr("value") == "true"){
					if(option_arr[i].find("input").prop("checked") == false){
						tempCorrect = false;
					}
				} else {
					if(option_arr[i].find("input").prop("checked") == true){
						tempCorrect = false;
					}
				}

				//build learnerResponse array for SCORM interaction
				//var label = $.trim($("label[for='"+ option_arr[i].find('input').attr('id') +"']").text().replace(/\s+/g, ''));
				if(option_arr[i].find("input").prop("checked")){
					_learnerResponse.push($.trim($("label[for='"+ option_arr[i].find("input").attr('id') +"']").text().replace(/\s+/g, '')));
				}

			}

			//add choice SCORM interaction here
			var _first = true;
			var _learnerResponseString = '';
			for (var i = 0; i < _learnerResponse.length; i++) {
				if(_first){
					_first = false;
					_learnerResponseString += _learnerResponse[i];
				}
				else{
					_learnerResponseString += "[,]" + _learnerResponse[i];
				}
			};
			setInteractions(pageId, "choice", _learnerResponseString, tempCorrect, _title + " : " + $.trim($("#question").text()) );
		}

		//////////////////////////FEEDBACK\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		var msg = "";

		if(feedbackType == 'undifferentiated'){
			//Undifferentiated correct answer
			if(tempCorrect == true){
				msg = '<div id="dialog-attemptResponse" class="correct" title="'+ feedbackCorrectTitle +'"><p> '+ feedback +'</p></div>';
			//Undifferentiated wrong answer
			}else{
				if(attemptsMade == attemptsAllowed){
					//incorrect feedback here
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p> '+ feedback +'</p></div>';
				}else{
					//try again.
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectAttempt +'</p></div>';
				}
			}
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////DIFFERENTIATED FEEDBACK FUNCTIONALITY.
		}else if(feedbackType == 'differentiated'){
			if(tempCorrect == true){
				var feedbackMsg = "";
				for(var i = 0; i < option_arr.length; i++){
					if(option_arr[i].find("input").prop("checked") == true){
						feedbackMsg += "<p><b>You selected</b>: " + $(data).find("page").eq(currentPage).find("option").eq(i).find("content").text() + ", ";
						if($(data).find("page").eq(currentPage).find("option").eq(i).attr("correct") == "true"){
							if(isMulti == true){
								feedbackMsg += "that was a correct response.</p>"
							}else{
								feedbackMsg += "that was the correct response.</p>"
							}
						}else{
							feedbackMsg += "that was an incorrect response.</p>"
						}
						feedbackMsg += "<p>" + $(data).find("page").eq(currentPage).find("option").eq(i).find("diffeed").text() + "</p>";
					}
				}
				msg = '<div id="dialog-attemptResponse" class="correct" title="'+ feedbackCorrectTitle +'"><p> '+ feedbackMsg +'</p></div>';
			}else{
				if(attemptsMade == attemptsAllowed){
					//incorrect feedback here
					var feedbackMsg = "";
					for(var i = 0; i < option_arr.length; i++){
						if(option_arr[i].find("input").prop("checked") == true){
							feedbackMsg += "<p><b>You selected</b>: " + $(data).find("page").eq(currentPage).find("option").eq(i).find("content").text() + ". ";
							if($(data).find("page").eq(currentPage).find("option").eq(i).attr("correct") == "true"){
								feedbackMsg += "That was a correct response.</p>"
							}else{
								feedbackMsg += "That was an incorrect response.</p>"
							}
							feedbackMsg += "<p>" + $(data).find("page").eq(currentPage).find("option").eq(i).find("diffeed").text() + "</p>";
						}
					}
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p> '+ feedbackMsg +'</p></div>';
				}else{
					//try again.
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectAttempt +'</p></div>';
				}
			}
		}else if(feedbackType == 'standardized'){
			if(tempCorrect == true){
				msg = '<div id="dialog-attemptResponse" class="correct" title="That is Correct."></div>';
			}else{
				if(attemptsMade == attemptsAllowed){
					msg = '<div id="dialog-attemptResponse" class="correct" title="That is not correct."></div>';
				}else{
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectAttempt +'</p></div>';
				}
			}
		}

		if(tempCorrect == true || attemptsMade == attemptsAllowed){
			var selected_arr = [];
			for(var i = 0; i < option_arr.length; i++){
				if(option_arr[i].find("input").prop("checked") == true){
					selected_arr.push(i);
				}
			}
			updateScoring(selected_arr, tempCorrect, order_arr);
			$("#mcSubmit").button({ disabled: true });
			showUserAnswer();
		}

		$("#stage").append(msg);

		if(feedbackDisplay == "pop"){
			var standardWidth = 550;
			if(standardWidth > windowWidth){
				standardWidth = windowWidth-20;
			}
			if(tempCorrect == true || attemptsMade == attemptsAllowed){
				$( "#dialog-attemptResponse" ).dialog({
					modal: true,
					width: standardWidth,
					dialogClass: "no-close",
					buttons: {
						Close: function(){
							disableOptions();
							$( this ).dialog( "close" );
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
						var cont = feedbackMsg;
						var ariaText = $(cont).text().replace(/'/g, "");
						$('.ui-dialog-buttonpane').find('button:contains("Proceed")').addClass('feedback-proceed-button').attr('aria-label', ariaText + ' Press spacebar to proceed.').focus();
					},
					close: function(){
						mandatoryInteraction = false;
						checkNavButtons();
						$("#dialog-attemptResponse").remove();
					}
				});
			}else{
				$( "#dialog-attemptResponse" ).dialog({
					modal: true,
					width: standardWidth,
					dialogClass: "no-close",
					buttons: {
						OK: function(){
							$( this ).dialog( "close" );
							$("#dialog-attemptResponse").remove();
						}
					},
					open: function(){
						$('.ui-dialog-buttonpane').find('button:contains("OK")').attr('aria-label', 'OK - That is incorrect. Please try again. Click here.').focus();
					},
					close: function(){
						$("#option0Check").focus();
					}
				});
			}
		}else if(feedbackDisplay == "inline"){

		}
	}

	function resizeForMobile(){

	}

	function checkMode(){
		$('.antiscroll-wrap').antiscroll();
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top) + audioHolder.getAudioShim());
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
			$('#answerOptions').prepend("<div id='questionEdit' class='btn_edit_text' title='Edit Text Question'></div>");

			$("#questionEdit").click(function(){
				updateOptionDialog();
			}).tooltip();
		}
	}


	function updateOptionDialog(){
		clearCKInstances();

		try { $("#questionEditDialog").remove(); } catch (e) {}

		feedback = $(data).find("page").eq(currentPage).find('feedback').text();

		var msg = "<div id='questionEditDialog' title='Create Multiple Choice Question'>";
		msg += "<label id='label' title='Define the number of attempts.'><b>no. of attempts: </b></label>";
		msg += "<input type='text' name='myName' id='inputAttempts' value='"+ attemptsAllowed +"' class='dialogInput' style='width:35px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label' title='Indicates if this page is graded.'><b>graded: </b></label>";
		msg += "<input id='isGraded' type='checkbox' name='graded' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label' title='Indicates if this page is must be completed before going to the next page.'><b>mandatory: </b></label>";
		msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'  title='Indicates if the order of the options are randomized on this page.'><b>randomize options: </b></label>";
		msg += "<input id='isRandom' type='checkbox' name='random' class='radio' value='true'/><br/>";
		msg += "<div id='feedbackTypeGroup'>";
		msg += "<label id='label'><b>feedback type: </b></label>";
		msg += "<input id='standardized' type='radio' name='manageFeedbackType' value='standardized' title='Standard feedback is used.'>standardized  </input>";
		msg += "<input id='undifferentiated' type='radio' name='manageFeedbackType' value='undifferentiated' title='One user defined feedback is used.'>undifferentiated  </input>";
		msg += "<input id='differentiated' type='radio' name='manageFeedbackType' value='differentiated' title='User defined feedback is used for each option.'>differentiated  </input>";
		msg += "</div>"

		if(feedbackType == "undifferentiated"){
			msg += "<div id='feedbackLabel'><b>Input your feedback:</b></div>";
			msg += "<div id='feedbackEditText' type='text' contenteditable='true' class='dialogInput'>" + feedback + "</div><br/>";
		}

		msg += "<div id='questionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Option Item Menu: </b></label></div><br/><br/>";
		msg += "</div>";
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

		if(!randomize){
			$("#isRandom").removeAttr('checked');
		}else{
			$("#isRandom").attr('checked', 'checked');
		}

		if(feedbackType == "undifferentiated"){
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
			//$("#feedbackEditText").height(40);
		}

		$('#' + feedbackType).prop('checked', true);

		//Switch to show the correct feedback type....
		$("#feedbackTypeGroup").change(function(){
			feedbackType = $('input[name=manageFeedbackType]:checked', '#feedbackTypeGroup').val();
			$("#questionEditDialog").remove();
			optionEdit_arr = [];
			updateOptionDialog();
		});

		updateRevealMenu();

		addOption(currentEditBankMember, false);

		//Style it to jQuery UI dialog
		$("#questionEditDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 800,
			height: 650,
			dialogClass: "no-close",
			buttons: [
				{
					text: "Add",
					title: "Add a new option.",
					click: function(){
						makeRevealDataStore();
						//Need to do these outside because blows up regular feedback...
						if (CKEDITOR.instances['optionText']) {
				            CKEDITOR.instances.optionText.destroy();
				        }
				        if (CKEDITOR.instances['optionDifFeedText']) {
				            CKEDITOR.instances.optionDifFeedText.destroy();
				        }
						try { $("#optionContainer").remove(); } catch (e) {}
						addOption(optionCount, true);
						updateRevealMenu();
					}
				},
				{
					text: "Done",
					title: "Saves and closes the edit dialog.",
					click: function(){
				        makeRevealDataStore();
				        clearCKInstances();
						saveQuestionEdit();
						$("#questionEditDialog").dialog("close");
						$("#questionEditDialog").remove();
					}
				}
			]

		});

		//adds tooltips to the edit dialog buttons
	    $(function () {
	        $(document).tooltip();
	    });
	}

	function clearCKInstances(){
		if (CKEDITOR.instances['optionText']) {
            CKEDITOR.instances.optionText.destroy();
        }
        if (CKEDITOR.instances['feedbackEditText']) {
            CKEDITOR.instances.feedbackEditText.destroy();
        }

        if (CKEDITOR.instances['optionDifFeedText']) {
            CKEDITOR.instances.optionDifFeedText.destroy();
        }
	}

	function makeRevealDataStore(){
		attemptsAllowed = $("#inputAttempts").val();
		$(data).find("page").eq(currentPage).attr("attempts", attemptsAllowed);

		if($("#isMandatory").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("mandatory", "true");
			mandatory = true;
		}else{
			$(data).find("page").eq(currentPage).attr("mandatory", "false");
			mandatory = false;
		}

		if($("#isGraded").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("graded", "true");
			graded = true;
		}else{
			$(data).find("page").eq(currentPage).attr("graded", "false");
			graded = false;
		}

		if($("#isRandom").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("randomize", "true");
		}else{
			$(data).find("page").eq(currentPage).attr("randomize", "false");
		}


		var newRevealContent = new DOMParser().parseFromString('<option></option>',  "text/xml");
		var revealCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["optionText"].getData());
		$(data).find("page").eq(currentPage).find("option").eq(currentEditBankMember).find("content").empty();
		$(data).find("page").eq(currentPage).find("option").eq(currentEditBankMember).find("content").append(revealCDATA);
		if(feedbackType == "undifferentiated"){
			var newFeedbackContent = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var feedbackCDATA = newFeedbackContent.createCDATASection(CKEDITOR.instances["feedbackEditText"].getData());
			$(data).find("page").eq(currentPage).find("feedback").empty();
			$(data).find("page").eq(currentPage).find("feedback").append(feedbackCDATA);
		}else if(feedbackType == "differentiated"){
			var newFeedbackContent = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var feedbackCDATA = newFeedbackContent.createCDATASection(CKEDITOR.instances["optionDifFeedText"].getData());
			$(data).find("page").eq(currentPage).find("option").eq(currentEditBankMember).find("diffeed").empty();
			$(data).find("page").eq(currentPage).find("option").eq(currentEditBankMember).find("diffeed").append(feedbackCDATA);
		}
		$(data).find("page").eq(currentPage).find("option").eq(currentEditBankMember).attr("correct", $("#optionCorrect").prop("checked"));
		$(data).find("page").eq(currentPage).attr("feedbacktype", feedbackType);
	}

	function updateRevealMenu(){
		revealMenu_arr = [];
		$(".questionBankItem").remove();
		var msg = "";
		for(var h = 0; h < optionCount; h++){
			var label = parseInt(h + 1);
			var tmpID = "revealItem"+h;
			msg += "<div id='"+tmpID+"' class='questionBankItem";
			if(currentEditBankMember == h){
				msg += " selectedEditBankMember";
			}else{
				msg += " unselectedEditBankMember";
			}
			msg += "' style='";

			if(h < 100){
				msg += "width:30px;";
			}else if(h > 99){
				msg += "width:45px;";
			}
			var cleanText = $(data).find("page").eq(currentPage).find("option").eq(h).find("content").text().replace(/<\/?[^>]+(>|$)/g, "");//////////////////////Need to clean out html tags.....
			//console.log("cleanText = " + cleanText);
			msg += "' data-myID='" + h + "' title='" + cleanText + "'>" + label + "</div>";

			revealMenu_arr.push(tmpID);
		}

		$("#questionMenu").append(msg);

		for(var j = 0; j < revealMenu_arr.length; j++){
			if(currentEditBankMember != j){
				var tmpID = "#" + revealMenu_arr[j];
				$(tmpID).click(function(){
					makeRevealDataStore();
					clearCKInstances();
					$('#bankItem'+ currentEditBankMember).removeClass("selectedEditBankMember").addClass("unselectedEditBankMember");
					$(this).removeClass("unselectedEditBankMember").addClass("selectedEditBankMember");
					$("#questionEditDialog").remove();
					currentEditBankMember = $(this).attr("data-myID");
					updateOptionDialog();
				}).tooltip();
			}
		}
	}

	/**********************************************************************
    ** areYouSure?  Make sure that user actually intended to remove content.
    **********************************************************************/
	function areYouSure(){
		$("#stage").append('<div id="dialog-removeContent" title="Remove this item from the page."><p class="validateTips">Are you sure that you want to remove this item from your page? <br/><br/>This cannot be undone!</div>');

	    $("#dialog-removeContent").dialog({
            modal: true,
            width: 550,
            close: function (event, ui) {
                $("#dialog-removeContent").remove();
            },
            buttons: {
                Cancel: function () {
                    $(this).dialog("close");
                },
                Remove: function(){
	                removeOption();
	                $(this).dialog("close");
                }
            }
        });
	}

	function removeOption(){
		if(optionCount > 1){
			$(data).find("page").eq(currentPage).find("option").eq(currentEditBankMember).remove();
			$("#optionContainer").remove();
			optionCount--;
			currentEditBankMember = 0;
			updateOptionDialog();
		}else{
			alert("you must have at least one bank item.");
		}
	}

	function addOption(_addID, _isNew){
		var optionLabel = parseInt(_addID) + 1;

		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("New Option");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).find("content").append(option1CDATA);
			$(data).find("page").eq(currentPage).find("option").eq(_addID).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct", "false");

			currentEditBankMember = _addID;
			optionCount++;
		}

		var optionContent = $(data).find("page").eq(currentPage).find("option").eq(_addID).find("content").text();
		var msg = "<div id='optionContainer' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='optionRemove' class='removeMedia' value='"+_addID+"' title='Click to remove this answer option'/>";
		msg += "<div id='optionInput' style='padding-bottom:5px;'><b>Option " + optionLabel + ":</b></div>";
		msg += "<div id='optionText' contenteditable='true' class='dialogInput'>" + optionContent + "</div>";
		msg += "<label id='label'><b>correct:</b></label>";
		if($(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct") == "true"){
			msg += "<input id='optionCorrect' type='checkbox' checked='checked' name='correct' class='radio' value='true' title='Indicates if the option is a correct answer.'/>";
		}else{
			msg += "<input id='optionCorrect' type='checkbox' name='correct' class='radio' value='true' title='Indicates if the option is a correct answer.'/>";
		}

		if(feedbackType == "differentiated"){
			msg += "<br/>"
			var difFeedContent = $(data).find("page").eq(currentPage).find("option").eq(_addID).find("diffeed").text();
			msg += "<label id='label'><b>Option " + optionLabel + " Differentiated Feedback:</b></label>";
			msg += "<div id='optionDifFeedText' contenteditable='true' class='dialogInput'>" + difFeedContent + "</div>";
		}
		msg += "</div>";

		$("#questionEditDialog").append(msg);

		$("#optionRemove").on('click', function(){
			areYouSure();
		});

		CKEDITOR.inline( "optionText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
		   	on: {
		      instanceReady: function(event){
		         $(event.editor.element.$).attr("title", "Click here to edit this option text.");
		    	}
		    }
		});

		if(feedbackType == "differentiated"){
			CKEDITOR.inline( "optionDifFeedText", {
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
		}
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

	/**********************************************************************
    **Save Question Edit - save updated question preferences to content.xml
    **********************************************************************/
	function saveQuestionEdit(_data){
		var extra = $(data).find("page").eq(currentPage).find("option").length;
		var active = optionCount;
		//var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("option").eq(i).remove();
		}

		markIncomplete();
		sendUpdateWithRefresh();
		fadeComplete();
	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.destroySelf = function() {
		 TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:Power2.easeIn, onComplete:fadeComplete});
    }

    this.fadeComplete = function() {
	    fadeComplete();
    }
    // fadeComplete() moved to C_UtilFunctions.js

    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}