/*!
 * C_QuestionBank
 * This class creates a template for multiple - multipleChoice type questions.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2014-4-3
 * JavaScript
 *
 * Copyright (c) 2014, CTC. All rights reserved.
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
function C_QuestionBank(_type) {

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
    var bankLength = 0;
    var bankitem = 0;
	var toComplete = 1;
	var showAll = false;
    var isComplete = false;
    var optionEdit_arr = [];
    var optionCount = 0;
    var graded = false;
    var mandatory = true;
    var randomize = false;
    var currentEditBankMember = 0;
    var scormVersion;
    var pageId;
    var questionDisplay_arr = [];
    var questionsComplete = 0; //
    var score_arr = [];
    var showAllOverride = false;


    //Defines a public method - notice the difference between the private definition below.
	this.initialize= function(){
		//Clear accessibility on page load.
        pageAccess_arr = [];
        audioAccess_arr = [];

        if(transition == true){
			$('#stage').css({'opacity':0});
		}

		if($(data).find("page").eq(currentPage).attr('graded') == "true"){
			graded = true;
		}
		if($(data).find("page").eq(currentPage).attr('mandatory') == "false"){
			mandatory = false;
		}

		showAllOverride = $(courseData).find("course").attr("showall");

		selectbankitems();
	}

	function showCompleteResult(){
		mandatory = false;
		mandatoryInteraction = false;
		checkNavButtons();
		pageTitle = new C_PageTitle();
		$('#stage').append('<div id="scrollableContent" class="antiscroll-wrap top"><div class="box"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content" class="contentTop"></div></div></div>');

		var numberCorrect = 0;
		for(var i = 0; i < questionResponse_arr.length; i++){
			if(currentPageID == questionResponse_arr[i].id){
				if(questionResponse_arr[i].correct == true){
					numberCorrect++;
				}
			}
		}

		var msg = "<p>You have already completed this question bank.</p>.";
			msg += "<p>You got " + numberCorrect + " out of " + toComplete + " correct.</p>";
			msg += "<button id='done'>Proceed</button>";

		$("#content").append(msg);


		$("#done").click(function(){
			$("#next").click();
		});

		if(transition == true){
			// fade stage in
			$('#stage').velocity({
				opacity: 1
			}, {
				duration: transitionLength
			});
		}
	}

	function selectbankitems(){
		if(mode != "edit"){
			isComplete = checkQuestionComplete();
		}

		bankLength = $(data).find("page").eq(currentPage).find("bankitem").length;

		//This is undefined for old question banks so always false.
		if($(data).find("page").eq(currentPage).attr("tocomplete")){
			toComplete = parseInt($(data).find("page").eq(currentPage).attr("tocomplete"));
		}

		//This is undefined for old question banks so always false.
		if($(data).find("page").eq(currentPage).attr("showall") == "true" || showAllOverride == "true" ){
			showAll = true;
			toComplete = bankLength;
		}

		if(isComplete && mode != "edit"){
			for(var i = 0; i < questionResponse_arr.length; i++){
				if(currentPageID == questionResponse_arr[i].id){
					if(toComplete == 1){
						bankitem = questionResponse_arr[i].bankID;
						currentEditBankMember = bankitem;
						buildTemplate();
					}else{
						showCompleteResult();
						break;
					}
				}
			}
		}else{
			//Generate questionDisplay_arr - either random selection range or show all.
			if(showAll){
				var iterator = 0;
				while(questionDisplay_arr.length < bankLength){
					questionDisplay_arr.push(iterator);
					iterator++;
				}
			}else{
				while(questionDisplay_arr.length < toComplete){
					var randomnumber=randomIntFromRange(0, bankLength-1);
					var found=false;
					for(var i=0;i<questionDisplay_arr.length;i++){
				    	if(questionDisplay_arr[i]==randomnumber){
					    	found=true;
					    	break
					    }
				  	}
				  	if(!found)questionDisplay_arr.push(randomnumber);
				}
			}
			bankitem = questionDisplay_arr[questionsComplete];
			//Set this so that when editing the editor will open the currently viewed question
			currentEditBankMember = bankitem;
			buildTemplate();
		}
	}

	function buildTemplate(){
		//reset option_arr #4964
		option_arr = [];
		attemptsAllowed = $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).attr('attempts');
		feedbackType = $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).attr('feedbacktype');
		feedbackDisplay = $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).attr('feedbackdisplay');
		feedbackCorrectTitle = $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find('correctresponse').text();
		feedbackIncorrectTitle = $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find('incorrectresponse').text();
		feedbackIncorrectAttempt = $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find('attemptresponse').text();
		feedback = $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find('feedback').text();
		scormVersion = $(data).find('scormVersion').attr('value');
		pageId = $(data).find("page").eq(currentPage).attr("id");

		if($(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).attr('randomize') == "true"){
			randomize = true;
		}
		else{
			randomize = false; //#4943
		}
		pageTitle = new C_PageTitle();
		if(toComplete > 1){
			$("#pageTitle").text($("#pageTitle").text() + " (question " + (questionsComplete + 1)  + " of " + toComplete + ")");
		}

		$('#stage').append('<div id="scrollableContent" class="antiscroll-wrap top"><div class="box"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="question" class="questionTop"></div><div id="answerOptions"></div></div></div></div>');

		audioHolder = new C_AudioHolder();

		optionCount = $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find("option").length;
		var correctCount = 0;
		for(var i = 0; i < optionCount; i++){
			if($(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find("option").eq(i).attr('correct') == "true"){
				correctCount++;
			}
		}

		if(correctCount > 1){
			isMulti = true;
		}else{
			isMulti = false;
		}

		//Set Question
		myContent = $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find('question').text();
		if(isMobilePhone){
			$("#contentHolder").prepend(myContent);
		}else{
			$("#question").append(myContent);
		}

		//var ariaText = $("#question").text().replace(/\'/g, "").replace(/\"/g, "");
		//$("#question").attr("aria-label", ariaText);
		//pageAccess_arr.push($("#question"));
		//Place each option within the container $('#options') - this allows for easier cleanup, control and tracking.
		var iterator = 0;
		var optionY = 0;

		if(isMulti == false){
			$('#answerOptions').append('<fieldset id="answer" class="radioSelector"><legend>Answer Options:</legend>');
		}else{
			$('#answerOptions').append('<fieldset id="answer" class="checkBox"><legend>Answer Options:</legend>');
		}

		var order_arr = [];
		for (var i = 0; i < optionCount; i++){
			order_arr.push(i);
		}

		if(randomize){
			var order_arr = shuffleArray(order_arr);
		}

		//find every option in the xml - place them on the screen.
		for(var j = 0; j < order_arr.length; j++){
			var myNode = $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find("option").eq(order_arr[j]);
			//Create unique class name for each option
			var myOption = "option" + iterator;
			//Create each option as a div.
			var myLabel = String.fromCharCode(iterator % 26 + 65);
			if(isMulti == false){
				$('#answer').append('<div class="option" id="' + myOption + '"><input id="' + myOption + 'Check" type="radio" name=' + type + '" class="radio" value="' + myNode.attr("correct")+ '"/><label id="label" class="fixFunkyIssue" for="'+ myOption +'Check">'+ myLabel + '. ' +myNode.find("content").text() +'</label></div>');
			}else{
				$('#answer').append('<div class="option" id="' + myOption + '"><input id="' + myOption + 'Check" type="checkbox" name=' + type + '" class="radio" value="' + myNode.attr("correct")+ '"/><label id="label" class="fixFunkyIssue" for="'+ myOption +'Check">'+ myLabel + '. ' +myNode.find("content").text() +'</label></div>');
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
				$("#mcSubmit").attr("tabindex", 1);
				pageAccess_arr.push($("#mcSubmit"));
				doAccess(pageAccess_arr);
				$(this).focus();
				if(isMulti){
					if(iconClicked != true){
						if($(this).find('input').prop('checked') == true){
							$(this).find('input').prop('checked', false);
							$(this).removeClass("optionSelected");
						}else{
							$(this).find('input').prop('checked', true);
							$(this).addClass("optionSelected");
						}
					}
				}else{
					//Remove selected class from previously selected and add to newly selected.
					$(this).find('input').prop('checked', true);
					for(var i=0; i<option_arr.length; i++){
						if(option_arr[i].hasClass("optionSelected") ){
							option_arr[i].removeClass("optionSelected");
						}
					}
					$(this).addClass("optionSelected");
				}
				iconClicked = false;
			}).hover(function(){
					$(this).addClass("optionHover");
				},
				function(){
					$(this).removeClass("optionHover")
				});

			//iterate the iterators...
			optionY += $("#"+myOption).height() + 30;
			iterator++;
			option_arr.push($('#' + myOption));
			//Section 508 code
			var cont = myNode;
			if(isMulti){
				var ariaText = myLabel + "." + $(cont).text().replace(/\'/g, "").replace(/\"/g, ""); + ". Use the tab or shift-tab to hear other options. Press spacebar to select.";
			}else{
				var ariaText = myLabel + "." + $(cont).text().replace(/\'/g, "").replace(/\"/g, ""); + ". Use up and down arrow keys to hear other options. Press spacebar to select.";
			}
			$('#' + myOption + "Check").attr("aria-label", ariaText);
			pageAccess_arr.push($('#' + myOption + "Check"));
		};

		$("#answerOptions").append('<div id="mcSubmit"></div>');

		$("#answerOptions").append("</div>");

		$("#mcSubmit").button({ label: $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).attr("btnText"), disabled: true });
		$("#mcSubmit").attr("tabindex", 0);
		//pageAccess_arr.push($("#mcSubmit"));
		$("#mcSubmit").click(checkAnswer).keyup(function (event) {
			        var key = event.keyCode || event.which;
			        if (key === 32 || key === 13) {
			            $(this).click();
			        }
			        return false;
			    });

		$("#mcSubmit").attr("aria-label", "Submit your answer.").attr("role", "button");
		//pageAccess_arr.push($("#mcSubmit"));

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

		if(isComplete && mode != "edit"){
			//disableOptions();
			$("#mcSubmit").button({ disabled: true });
			mandatoryInteraction = false;
			checkNavButtons();
			showUserAnswer();
		}

		if(transition == true){
			// fade stage in
			$('#stage').velocity({
				opacity: 1
			}, {
				duration: transitionLength
			});
		}

		doAccess(pageAccess_arr);
		//console.log(pageAccess_arr);
	}

	//Called if the user closes the popup instead of proceed
	function disableOptions(){
		for(var i = 0; i < option_arr.length; i++){
			option_arr[i].unbind();
		}
	}


	function showUserAnswer(){
		for(var i = 0; i < questionResponse_arr.length; i++){
			if(currentPageID == questionResponse_arr[i].id && questionsComplete == questionResponse_arr[i].subID){
				var temp_arr = questionResponse_arr[i].userAnswer;
				var tempCorrect = true;
				for(var k = 0; k < temp_arr.length; k++){
					option_arr[parseInt(temp_arr[k])].find("input").prop("checked", "checked");
					if(option_arr[parseInt(temp_arr[k])].find('input').attr("value") == "false"){
						tempCorrect = false;
						(graded) ? option_arr[temp_arr[k]].addClass("optionIncorrectGraded") : option_arr[temp_arr[k]].addClass("optionIncorrect");
					}else{
						(graded) ? option_arr[temp_arr[k]].addClass("optionCorrectGraded") : option_arr[temp_arr[k]].addClass("optionCorrect");
					}
				}
				if(questionResponse_arr[i].correct == false){
					for(var j = 0; j < option_arr.length; j++){
						if(option_arr[j].find("input").attr("value") == "true"){
							(graded) ? option_arr[j].addClass("optionCorrectGraded") : option_arr[j].addClass("optionCorrect");
						}
					}
				}
				if(mode=="edit"){
					questionResponse_arr[i].complete = false;
					questionResponse_arr[i].userAnswer = [];
				}
				break;
			}
		}



		$(".radio").prop('disabled', true);
		//mandatoryInteraction = false;
		disableOptions();
		//checkNavButtons();

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
			////////////////////////////////////////////////
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
			////////////////////////////////////////////////

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
				if(option_arr[i].find("input").prop("checked")){
					_learnerResponse.push($.trim($("label[for='"+ option_arr[i].find("input").attr('id') +"']").text().replace(/\s+/g, '')));
				}

			}

			//add choice SCORM interaction here
			//////////////////////////////////////////
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
			//////////////////////////////////////////
		}

		//get SOCRM objective status for page = C_SCORM.js
		var _pageObjectiveStatus = getPageObjectiveStatus();
		if(_pageObjectiveStatus != "failed"){
			//set SCORM objective for page - C_SCORM.js
			setPageObjective(tempCorrect, graded);
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
						feedbackMsg += "<p><b>You selected</b>: " + $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find("option").eq(i).find("content").text() + ", ";
						if($(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find("option").eq(i).attr("correct") == "true"){
							if(isMulti == true){
								feedbackMsg += "that was a correct response.</p>"
							}else{
								feedbackMsg += "that was the correct response.</p>"
							}
						}else{
							feedbackMsg += "that was an incorrect response.</p>"
						}
						feedbackMsg += "<p>" + $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find("option").eq(i).find("diffeed").text() + "</p>";
					}
				}
				msg = '<div id="dialog-attemptResponse" class="correct" title="'+ feedbackCorrectTitle +'"><p> '+ feedbackMsg +'</p></div>';
			}else{
				if(attemptsMade == attemptsAllowed){
					//incorrect feedback here
					var feedbackMsg = "";
					for(var i = 0; i < option_arr.length; i++){
						if(option_arr[i].find("input").prop("checked") == true){
							feedbackMsg += "<p><b>You selected</b>: " + $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find("option").eq(i).find("content").text() + ". ";
							if($(data).find("page").eq(currentPage).find("option").eq(i).attr("correct") == "true"){
								feedbackMsg += "That was a correct response.</p>"
							}else{
								feedbackMsg += "That was an incorrect response.</p>"
							}
							feedbackMsg += "<p>" + $(data).find("page").eq(currentPage).find("bankitem").eq(bankitem).find("option").eq(i).find("diffeed").text() + "</p>";
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
			updateScoring(selected_arr, tempCorrect, null, bankitem, questionsComplete);
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
				questionsComplete++;
				if(questionsComplete === toComplete){
					//#5023 don't use close button for NEL courses
					var _lms = $(courseData).find("course").attr("lms");
					if(_lms != 'NEL'){
						$( "#dialog-attemptResponse" ).dialog({
							modal: true,
							width: standardWidth,
							dialogClass: "no-close",
							buttons: {
								Close: function(){
									disableOptions();
									$( this ).dialog( "close" );
								},
								Next: function(){
									$( this ).dialog( "close" );
									$("#next").click();
								}
							},
							open: function(){
								$('.ui-dialog-buttonpane').find('button:contains("Close")').addClass('feedback-close-button');
								$('.ui-dialog-buttonpane').find('button:contains("Next")').addClass('feedback-proceed-button');
							},
							close: function(){
								if(isLinear == true){
									updateTracking();
								}
								mandatoryInteraction = false;
								checkNavButtons();
								$("#dialog-attemptResponse").remove();
							}
						});						
					}
					else{
						$( "#dialog-attemptResponse" ).dialog({
							modal: true,
							width: standardWidth,
							dialogClass: "no-close",
							buttons: {
								Next: function(){
									$( this ).dialog( "close" );
									$("#next").click();
								}
							},
							open: function(){
								$('.ui-dialog-buttonpane').find('button:contains("Next")').addClass('feedback-proceed-button');
							},
							close: function(){
								if(isLinear == true){
									updateTracking();
								}
								mandatoryInteraction = false;
								checkNavButtons();
								$("#dialog-attemptResponse").remove();
							}
						});
					}
				}else{
					$( "#dialog-attemptResponse" ).dialog({
						modal: true,
						width: standardWidth,
						dialogClass: "no-close",
						buttons: {
							Next: function(){
								attemptsMade = 0;
								mandatoryInteraction = true;
								//checkNavButtons();
								$( this ).dialog( "close" );
								if(isLinear == true){
									updateTracking();
								}
								$("#stage").empty();
								bankitem = questionDisplay_arr[questionsComplete];
								buildTemplate();
							}
						},
						open: function(){
							//$('.ui-dialog-buttonpane').find('button:contains("Close")').addClass('feedback-close-button');
							$('.ui-dialog-buttonpane').find('button:contains("Next")').addClass('feedback-proceed-button');
						},
						close: function(){
							//mandatoryInteraction = false;
							//checkNavButtons();
							$("#dialog-attemptResponse").remove();
						}
					});
				}
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
					}
				});
			}
			$( "#dialog-attemptResponse" ).focus();
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
			$('#answerOptions').prepend("<div id='questionEdit' class='btn_edit_text' title='Edit Question Bank'></div>");

			$("#questionEdit").click(function(){
				updateQuestionEditDialog();
			}).tooltip();
		}
	}


	function updateQuestionEditDialog(){
		try { $("#questionEditDialog").remove(); } catch (e) {}

		var tempToComplete;
		if($(data).find("page").eq(currentPage).attr("tocomplete")){
			tempToComplete = $(data).find("page").eq(currentPage).attr("tocomplete");
		}else{
			tempToComplete = 1;
		}

		var msg = "<div id='questionEditDialog' title='Edit Question Bank'>";
		msg += "<label style='position: relative; float: left; margin-right:20px;'><b>Bank Preferences: </b></label>";
		msg += "<label id='label' title='Indicates if this page is graded.'>graded: </label>";
		msg += "<input id='isGraded' type='checkbox' name='graded' class='radio' value='true'/>&nbsp;&nbsp;";
		msg += "<label id='label' title='Indicates if this page is must be completed before going to the next page.'>mandatory: </label>";
		msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true' />&nbsp;&nbsp;";
		msg += "<label id='label' title='Indicates if ALL questions should be presented.'>show all: </label>";
		msg += "<input id='isShowAll' type='checkbox' name='showAll' class='radio' value='true' /><br/>";
		msg += "<div id='inputNumberHolder'><label id='label' title='Indicates number of questions to be presented.'>ask how many: </label>";
		msg += "<input type='text' name='inputNumberToPresent' id='inputNumberToPresent' value='"+ tempToComplete +"' class='dialogInput' style='width:35px;'/>";
		msg += '<span id="inputNumberToPresentError" class="error">The value must be a numeric value</span></div><br/>';

		msg += "<div id='questionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Questions Menu: </b></label>";
		var questionMenu_arr = [];
		for(var h = 0; h < bankLength; h++){
			var label = h + 1;
			var tmpID = "bankItem"+h;
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

			var cleanText = $(data).find("page").eq(currentPage).find("bankitem").eq(h).find("question").text().replace(/<\/?[^>]+(>|$)/g, "");;//////////////////////Need to clean out html tags.....
			//var cleanText = someText.text();
			msg += "' data-myID='" + h + "' title='" + cleanText + "'>" + label + "</div>";

			questionMenu_arr.push(tmpID);
		}
		msg += "</div><br/><br/>";
		var labelNumber = parseInt(currentEditBankMember) + 1;
		var inputAttemptsAllowed = $(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr('attempts');
		msg += "<div><b>Edit Question #" + labelNumber + ":</b></div>";
		msg += "<div id='currentEditQuestion' class='editItemContainer'>"

		msg += "<div id='removeBankItem' class='removeMedia' title='Click to remove this bank item'/>";

		msg += "<div><label style='margin-right:20px;'><b>Question Preferences: </b></label>";
		msg += "<label id='label'>randomize options: </label>";
		msg += "<input id='isRandom' type='checkbox' name='random' class='radio' value='true' title='Indicates if the order of the options are randomized on this question.'/>&nbsp;&nbsp;";
		msg += "<label id='label'>no. of attempts: </label>";
		msg += "<input type='text' name='myName' id='inputAttempts' value='"+ inputAttemptsAllowed +"' class='dialogInput' style='width:35px;' title='Increase the number of attempts.'/>";
		msg += '<span id="attemptsError" class="error">The value must be a numeric value</span><br/>';
		msg += "<div id='label'><b>Input your question: </b></div>";
		msg += "<div id='questionEditText' class='dialogInput' contenteditable='true'></div>";
		msg += "<div id='feedbackTypeGroup'>";
		msg += "<label id='label' style='margin-right:20px;'><b>Question Feedback Type: </b></label>";
		//msg += "<input id='standardized' type='radio' name='manageFeedbackType' value='standardized'>standardized</input>";
		msg += "<input id='undifferentiated' type='radio' name='manageFeedbackType' value='undifferentiated' title='One user defined feedback is used.'>undifferentiated</input>";
		msg += "<input id='differentiated' type='radio' name='manageFeedbackType' value='differentiated' title='User defined feedback is used for each option.'>differentiated</input>";

		msg += "</div></div>"

		if($(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr("feedbacktype") == "undifferentiated"){
			msg += "<div id='feedbackLabel'><b>Input your feedback:</b></div>";
			msg += "<div id='feedbackEditText' type='text' contenteditable='true' class='dialogInput'>" + $(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find('feedback').text() + "</div>";
		}
		msg += "<br/></div></div>";
		$("#stage").append(msg);

		$("#questionEditText").append($(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("question").text());

		$("#removeBankItem").click(areYouSure).tooltip();

		CKEDITOR.inline( "questionEditText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
		   	on: {
		      instanceReady: function(event){
		         $(event.editor.element.$).attr("title", "Click here to edit this question.");
		    	}
		    }
		});

		for(var j = 0; j < questionMenu_arr.length; j++){
			if(currentEditBankMember != j){
				var tmpID = "#" + questionMenu_arr[j];
				$(tmpID).click(function(){
					var tmpObj = makeQuestionDataStore();
					saveQuestionEdit(tmpObj);
					$('#bankItem'+ currentEditBankMember).removeClass("selectedEditBankMember").addClass("unselectedEditBankMember");
					currentEditBankMember = $(this).attr("data-myID");
					$(this).removeClass("unselectedEditBankMember").addClass("selectedEditBankMember");
					$("#questionEditDialog").remove();
					optionEdit_arr = [];
					updateQuestionEditDialog();
				}).tooltip();
			}
		}

        if($(data).find("page").eq(currentPage).attr("graded") == "false"){
			$("#isGraded").removeAttr('checked');
		}else{
			$("#isGraded").attr('checked', 'checked');
		}

        if($(data).find("page").eq(currentPage).attr("mandatory") == "false"){
			$("#isMandatory").removeAttr('checked');
		}else{
			$("#isMandatory").attr('checked', 'checked');
		}

		if($(data).find("page").eq(currentPage).attr("showall") == "true"){
			$("#isShowAll").attr('checked', 'checked');
			$('#inputNumberHolder').hide();
		}else{
			$("#isShowAll").removeAttr('checked');
			$('#inputNumberHolder').show();
		}

		//disables inputNumberToPresent if isShowAll is checked.
		$('#isShowAll').change(function(){
			if($("#isShowAll").prop("checked") == true){
				$('#inputNumberHolder').hide();
			}
			else{
				$('#inputNumberHolder').show();
			}
		});

		//handles validation of numbertopresent field
		$('#inputNumberToPresent').change(function(){

			if(!$.isNumeric($("#inputNumberToPresent").val())){
				$('#inputNumberToPresentError').html('The value must be a numeric value');
				$('#inputNumberToPresentError').removeClass('error').addClass('error_show');
				$("#inputNumberToPresent").val(tempToComplete);
			}
			else{
				if($('#inputNumberToPresentError').hasClass('error_show')){
					$('#inputNumberToPresentError').removeClass('error_show').addClass('error');
				}

				var _inputValue = parseInt($("#inputNumberToPresent").val());

				if(_inputValue > bankLength){
					$('#inputNumberToPresentError').html('The number of question to present cannot be more then the number of questions in the question bank');
					$('#inputNumberToPresentError').removeClass('error').addClass('error_show');
					$("#inputNumberToPresent").val(bankLength.toString());
				}
				else if(_inputValue < 1){
					$('#inputNumberToPresentError').html('The number of question to present must be at least 1');
					$('#inputNumberToPresentError').removeClass('error').addClass('error_show');
					$("#inputNumberToPresent").val("1");
				}
			}
		});

		//#3230
		$('#inputAttempts').on('change', function(){
			if(!$.isNumeric($('#inputAttempts').val())){
				$('#attemptsError').removeClass('error').addClass('error_show');
				$('#inputAttempts').val(inputAttemptsAllowed);
			}
			else{
				if($('#attemptsError').hasClass('error_show')){
					$('#attemptsError').removeClass('error_show').addClass('error');
				}
			}
		});

		if($(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr('randomize') == "false"){
			$("#isRandom").removeAttr('checked');
		}else{
			$("#isRandom").attr('checked', 'checked');
		}

		if($(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr('feedbacktype') == "undifferentiated"){
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
		}

		$('#' + $(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr('feedbacktype')).prop('checked', true);

		//Switch to show the correct feedback type....
		$("#feedbackTypeGroup").change(function(){
			var tmpObj = makeQuestionDataStore(true);
			saveQuestionEdit(tmpObj);
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr('feedbacktype', $('input[name=manageFeedbackType]:checked', '#feedbackTypeGroup').val());
			$("#questionEditDialog").remove();
			optionEdit_arr = [];
			updateQuestionEditDialog();
		});

		//find every option in the xml - place them on the screen.
		for (var i = 0; i < $(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").length; i++){
			addOption(i, false);
		};

		//#3857 fixes dialog jumping issue
		$.ui.dialog.prototype._focusTabbable = function(){};
		
		//Style it to jQuery UI dialog
		$("#questionEditDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 800,
			height: 650,
			dialogClass: "no-close",
			buttons:[
				{
					text: "Add Question",
					title: "Adds a new question.",
					click: function(){
						var tmpObj = makeQuestionDataStore();
						saveQuestionEdit(tmpObj);
						addQuestion(bankLength);
					}
				},
				{
					text: "Add Option",
					title: "Adds a new matching option.",
					click: function(){
						addOption(optionEdit_arr.length, true);
					}
				},
				{
					text: "Done",
					title: "Saves and closes the edit dialog.",
					click: function(){
						var tmpObj = makeQuestionDataStore();
						saveBankEdit(tmpObj);
						$("#questionEditDialog").dialog("close");
						$("#questionEditDialog").remove();
					}
				}
			]

		});

	    $(function () {
	        $('.questionBankItem').tooltip({
				  position: {
				    my: "center bottom",
				    at: "right top"
				  }
				});	    	
	        $(document).tooltip();

	    });
	}

	function makeQuestionDataStore(_feedbackTypeChange){
		var tmpObj = new Object();
		tmpObj.attempts = $("#inputAttempts").val();
		$(data).find("page").eq(currentPage).attr("tocomplete", $("#inputNumberToPresent").val());
		if($("#isGraded").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("graded", "true");
			tmpObj.graded = true;
		}else{
			$(data).find("page").eq(currentPage).attr("graded", "false");
			tmpObj.graded = false;
		}
		if($("#isMandatory").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("mandatory", "true");
			tmpObj.mandatory = true;
		}else{
			$(data).find("page").eq(currentPage).attr("mandatory", "false");
			tmpObj.mandatory = false;
		}
		if($("#isShowAll").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("showall", "true");
			tmpObj.showAll = true;
		}else{
			$(data).find("page").eq(currentPage).attr("showall", "false");
			tmpObj.showAll = false;
		}

		if($("#isRandom").prop("checked") == true){
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr("randomize", "true");
		}else{
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr("randomize", "false");
		}
		tmpObj.question = CKEDITOR.instances["questionEditText"].getData();
		try { CKEDITOR.instances["questionEditText"].destroy() } catch (e) {}

		tmpObj.feedbackType = $('input[name=manageFeedbackType]:checked', '#feedbackTypeGroup').val();
		if(_feedbackTypeChange == true){
			tmpObj.feedbackTypeChange = true;
		}else{
			tmpObj.feedbackTypeChange = false;
		}
		if($(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr("feedbacktype") == "undifferentiated"){
			tmpObj.feedbackUpdate = CKEDITOR.instances["feedbackEditText"].getData();
			try { CKEDITOR.instances["feedbackEditText"].destroy() } catch (e) {}
		}
		var tmpOptionArray = new Array();

		for(var i = 0; i < optionEdit_arr.length; i++){
			var tmpOptionObj = new Object();
			tmpOptionObj.optionText = CKEDITOR.instances[optionEdit_arr[i]+"Text"].getData();
			try { CKEDITOR.instances[optionEdit_arr[i]+"Text"].destroy() } catch (e) {}
			tmpOptionObj.optionCorrect = $("#"+optionEdit_arr[i]+"Correct").prop("checked");
			if($(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr("feedbacktype") == "differentiated"){
				tmpOptionObj.difText = CKEDITOR.instances[optionEdit_arr[i]+"DifFeedText"].getData();
				try { CKEDITOR.instances[optionEdit_arr[i]+"DifFeedText"].destroy() } catch (e) {}
			}
			tmpOptionArray.push(tmpOptionObj);
		}
		tmpObj.option_arr = tmpOptionArray;
		return tmpObj;
	}

	/**********************************************************************
    ** areYouSure?  Make sure that user actually intended to remove content.
    **********************************************************************/
	function areYouSure(){
		$("#stage").append('<div id="dialog-removeContent" title="Remove this question from the page.">'+
			'<p class="validateTips">Are you sure that you want to remove this question from your page?<br/><br/>This cannot be undone!</div>');

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
	                removeBankItem();
	                $(this).dialog("close");
                }
            }
        });
	}

	function removeOption(_id){
		for(var i = 0; i < optionEdit_arr.length; i++){
			if(_id == $("#"+optionEdit_arr[i]+"Container").attr("value")){
				var arrIndex = i;
				break;
			}
		}
		$(data).find("pages").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(arrIndex).remove();
		optionEdit_arr.splice(arrIndex, 1);
		$("#option" + _id +"Container").remove();
	}

	function removeBankItem(){
		if(bankLength > 1){
			$(data).find("page").eq(currentPage).children("bankitem").eq(currentEditBankMember).remove();
			bankLength--;
			$("#questionEditDialog").remove();
			optionEdit_arr = [];
			if(currentEditBankMember != 0){
				currentEditBankMember--;
			}
			updateQuestionEditDialog();
		}else{
			alert("you must have at least one bank item.");
		}
	}

	function addQuestion(_addID){
		$(data).find("page").eq(currentPage).append($("<bankitem>"));
		var bankitem1 = new DOMParser().parseFromString('<bankitem></bankitem>',  "text/xml");

		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).append($("<question>"));
		var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
		var myQuestionCDATA = myQuestion.createCDATASection("<p>Input your question.</p>");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("question").append(myQuestionCDATA);

		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).append($("<option>"));
		var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("option").eq(0).append($("<content>"));
		var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
		var option1CDATA = content1.createCDATASection("True");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("option").eq(0).find("content").append(option1CDATA);
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("option").eq(0).append($("<diffeed>"));
		var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
		var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("option").eq(0).attr("correct", "true");

		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).append($("<option>"));
		var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("option").eq(1).append($("<content>"));
		var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
		var option2CDATA = content2.createCDATASection("False");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("option").eq(1).find("content").append(option2CDATA);
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("option").eq(1).append($("<diffeed>"));
		var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
		var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("option").eq(1).attr("correct", "false");

		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).append($("<attemptresponse>"));
		var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
		var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("That is not correct.  Please try again.");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("attemptresponse").append(myAttemptResponseCDATA);

		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).append($("<correctresponse>"));
		var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
		var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("correctresponse").append(myCorrectResponseCDATA);

		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).append($("<incorrectresponse>"));
		var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
		var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("incorrectresponse").append(myIncorrectResponseCDATA);

		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).append($("<feedback>"));
		var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
		var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).find("feedback").append(myFeedbackCDATA);

		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).attr("feedbacktype", "undifferentiated");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).attr("feedbackdisplay", "pop");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).attr("audio", "null");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).attr("btnText", "Submit");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).attr("attempts", 2);
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).attr("randomize", false);
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).attr("objective", "undefined");
		$(data).find("page").eq(currentPage).find("bankitem").eq(_addID).attr("objItemId", "undefined");

		bankLength++;

		currentEditBankMember = _addID;
		$("#questionEditDialog").remove();
		optionEdit_arr = [];
		updateQuestionEditDialog();
	}

	function addOption(_addID, _isNew){
		var optionID = "option" + _addID;
		var optionLabel = _addID + 1;

		if(_isNew == true){
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(_addID).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(_addID).find("content").append(option1CDATA);
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(_addID).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(_addID).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(_addID).attr("correct", "false");

		}

		var optionContent = $(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(_addID).find("content").text();
		var msg = "<div id='"+optionID+"Container' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='"+optionID+"Remove' class='removeMedia' value='"+_addID+"' title='Click to remove this answer option'/>";
		msg += "<div id='"+optionID+"Input' style='padding-bottom:5px;'><b>Option " + optionLabel + ":</b></div>";
		msg += "<div id='"+optionID+"Text' contenteditable='true' class='dialogInput'>" + optionContent + "</div>";
		msg += "<label id='label'><b>correct:</b></label>";
		if($(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(_addID).attr("correct") == "true"){
			msg += "<input id='"+optionID + "Correct' type='checkbox' checked='checked' name='correct' class='radio' value='true' title='Indicates if the option is a correct answer.'/>";
		}else{
			msg += "<input id='"+optionID + "Correct' type='checkbox' name='correct' class='radio' value='true' title='Indicates if the option is a correct answer.'/>";
		}

		if($(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr("feedbacktype") == "differentiated"){
			msg += "<br/>"
			var difFeedContent = $(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(_addID).find("diffeed").text();
			msg += "<label id='label'><b>Option " + optionLabel + " Differentiated Feedback:</b></label>";
			msg += "<div id='"+optionID+"DifFeedText' contenteditable='true' class='dialogInput'>" + difFeedContent + "</div>";
		}
		msg += "</div>";

		$("#currentEditQuestion").append(msg);

		$("#" +optionID+"Remove").on('click', function(){
			removeOption($(this).attr("value"));
		});

		CKEDITOR.inline( optionID+"Text", {
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

		if($(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr("feedbacktype") == "differentiated"){
			CKEDITOR.inline( optionID+"DifFeedText", {
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
		optionEdit_arr.push(optionID);
	}

	/**********************************************************************
    **Save Content Edit - save updated content text to content.xml
    **********************************************************************/
    function saveContentEdit(_data){
        var docu = new DOMParser().parseFromString('<question></question>',  "application/xml")
        var newCDATA=docu.createCDATASection(_data);
        $(data).find("page").eq(currentPage).find("bankitem").find("question").first().empty();
        $(data).find("page").eq(currentPage).find("bankitem").find("question").first().append(newCDATA);
        sendUpdateWithRefresh();
    };

	/**********************************************************************
    **Save Question Edit - save updated question preferences to content.xml
    **********************************************************************/
	function saveQuestionEdit(_data){

		var questionUpdate = _data.question;
		var questionDoc = new DOMParser().parseFromString('<question></question>', 'application/xml');
		var questionCDATA = questionDoc.createCDATASection(questionUpdate);
		$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("question").empty();
		$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("question").append(questionCDATA);

		if(_data.feedbackUpdate){
			var feedbackUpdate = _data.feedbackUpdate;
			var feedDoc = new DOMParser().parseFromString('<feedback></feedback>', 'application/xml');
			var feedCDATA = feedDoc.createCDATASection(feedbackUpdate);
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("feedback").empty();
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("feedback").append(feedCDATA);
		}

		$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr("attempts", _data.attempts);

		for(var j = 0; j < questionResponse_arr.length; j++){
			if(questionResponse_arr[j].id == $(data).find('page').eq(currentPage).attr('id')){
				questionResponse_arr[j].graded = _data.graded;
			}
		}
		$(data).find("page").eq(currentPage).attr("graded", _data.graded);
		$(data).find("page").eq(currentPage).attr("mandatory", _data.mandatory);
		$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr("feedbacktype", _data.feedbackType);
		for(var i = 0; i < optionEdit_arr.length; i++){
			var correctOptions = 0;
			var optionText = _data.option_arr[i].optionText;
			var optionCorrect = _data.option_arr[i].optionCorrect;
			var newOption = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var optionCDATA = newOption.createCDATASection(optionText);
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(i).find('content').empty();
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(i).find('content').append(optionCDATA);

			if(_data.option_arr[i].difText){
				var optionDifFeedText = _data.option_arr[i].difText;
				var optionDifFeedCDATA = newOption.createCDATASection(optionDifFeedText);
				$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(i).find('diffeed').empty();
				$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(i).find('diffeed').append(optionDifFeedCDATA);
			}
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(i).attr("correct", optionCorrect);
		}

		var extra = $(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").length;
		var active = optionEdit_arr.length;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).find("option").eq(i).remove();
		}
	}

	function saveBankEdit(_data){
		saveQuestionEdit(_data);
		var extra = $(data).find("page").eq(currentPage).find("bankitem").length;
		var active = bankLength;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("bankitem").eq(i).remove();
		}
		sendUpdateWithRefresh();
		fadeComplete();
	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.destroySelf = function() {
		// fade stage out
		$('#stage').velocity({
			opacity: 0
		}, {
			duration: transitionLength,
			complete: fadeComplete
		});
    }

    this.fadeComplete = function() {
	    fadeComplete();
    }
    // fadeComplete() moved to C_UtilFunctions.js
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN

}
