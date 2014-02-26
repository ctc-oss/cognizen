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
	var pageTitle;
	var audioHolder;
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
    
    var isComplete;
    var optionEdit_arr = [];
    var optionCount = 0;
        
    //Defines a public method - notice the difference between the private definition below.
	this.initialize= function(){
		buildTemplate();
	}
		
	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		if(scored == true){	
			checkQuestionComplete();
		}
		
		attemptsAllowed = $(data).find("page").eq(currentPage).attr('attempts');
		feedbackType = $(data).find("page").eq(currentPage).attr('feedbackType');
		feedbackDisplay = $(data).find("page").eq(currentPage).attr('feedbackDisplay');
		feedbackCorrectTitle = $(data).find("page").eq(currentPage).find('correctresponse').text();
		feedbackIncorrectTitle = $(data).find("page").eq(currentPage).find('incorrectresponse').text();
		feedbackIncorrectAttempt = $(data).find("page").eq(currentPage).find('attemptresponse').text();
		feedback = $(data).find("page").eq(currentPage).find('feedback').text();
		
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
           		
		//Place each option within the container $('#options') - this allows for easier cleanup, control and tracking.
		var iterator = 0;
		var optionY = 0;
		
		if(isMulti == false){
			$('#answerOptions').append('<div id="answer" class="radioSelector">');
		}else{
			$('#answerOptions').append('<div id="answer" class="checkBox">');
		}		
		//find every option in the xml - place them on the screen.
		$(data).find("page").eq(currentPage).find("option").each(function()
		{	
			//Create unique class name for each option
			var myOption = "option" + iterator;
			//Create each option as a div.
			var myLabel = String.fromCharCode(iterator % 26 + 65);

			if(isMulti == false){
				$('#answer').append('<div class="option" id="' + myOption + '"><input id="' + myOption + 'Check" type="radio" name=' + type + '" class="radio" value="' + $(this).attr("correct")+ '"/><label id="label">'+ myLabel + '. ' +$(this).find("content").text() +'</label></div>');
			}else{
				$('#answer').append('<div class="option" id="' + myOption + '"><input id="' + myOption + 'Check" type="checkbox" name=' + type + '" class="radio" value="' + $(this).attr("correct")+ '"/><label id="label">'+ myLabel + '. ' +$(this).find("content").text() +'</label></div>');
			}
			
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
				});
			
			//iterate the iterators...
			optionY += $("#"+myOption).height() + 30;
			iterator++;
			option_arr.push($('#' + myOption));
			
		});
		
		$("#answerOptions").append('<div id="mcSubmit"></div>');

		$("#answerOptions").append("</div>");
		
		$("#mcSubmit").button({ label: $(data).find("page").eq(currentPage).attr("btnText"), disabled: true });
		$("#mcSubmit").click(checkAnswer);
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top) + audioHolder.getAudioShim);
		
		if(type == "multipleChoiceMedia"){
        	$("#answerOptions").addClass("left");
        	mediaHolder = new C_VisualMediaHolder();
        	mediaHolder.loadVisualMedia(checkMode());
        }else{
			checkMode();
        }
		if(transition == true){
			TweenMax.to($("#stage"), transitionLength, {css:{opacity:1}, ease:transitionType});
		}
	}
	
	
	//Called if the user closes the popup instead of proceed
	function disableOptions(){
		for(var i = 0; i < option_arr.length; i++){
			option_arr[i].unbind();
		}
	}


	//questionResponse_arr is in....
	function checkQuestionComplete(){
		for(var i = 0; i < questionResponse_arr.length; i++){
			if(currentPageID == questionResponse_arr[i].id){
				if(questionResponse_arr[i].complete == true){
					isComplete = true;
				}
			}
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
		$(".radio").prop('disabled', true);
	}
		
	function checkAnswer(){
		//////////////////////////CHECK CORRECT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		var tempCorrect = true;
		attemptsMade++;
		if(isMulti == false){
			var selected = $("#answer input[type='radio']:checked");
			if(selected.val() == "true"){
				tempCorrect = true;
			}else{
				tempCorrect = false;
			}
		}else{
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
			}
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
			if(scored == true){
				updateScoring(selected_arr, tempCorrect);
				mandatoryInteraction = false;
				checkNavButtons();
			}
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
						$('.ui-dialog-buttonpane').find('button:contains("Proceed")').addClass('feedback-proceed-button');
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
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top) + audioHolder.getAudioShim);
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
					},
					focus: function (event){
						cachedTextPreEdit = event.editor.getData();
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
				updateQuestionEditDialog();
			}).tooltip();
		}
	}
	
	
	function updateQuestionEditDialog(){
		var msg = "<div id='questionEditDialog' title='Create Multiple Choice Question'>";
		msg += "<label id='label'><b>no. of attempts: </b></label>";
		msg += "<input type='text' name='myName' id='inputAttempts' value='"+ attemptsAllowed +"' class='dialogInput' style='width:35px;'/><br/>";
		msg += "<div id='feedbackTypeGroup'>";
		msg += "<label id='label'><b>feedback type: </b></label>";
		msg += "<input id='standardized' type='radio' name='manageFeedbackType' value='standardized'>standardized  </input>";
		msg += "<input id='undifferentiated' type='radio' name='manageFeedbackType' value='undifferentiated'>undifferentiated  </input>";
		msg += "<input id='differentiated' type='radio' name='manageFeedbackType' value='differentiated'>differentiated  </input>";
		
		msg += "</div>"
		
		if(feedbackType == "undifferentiated"){
			msg += "<div id='feedbackLabel'><b>Input your feedback:</b></div>";
			msg += "<div id='feedbackEditText' type='text' contenteditable='true' class='dialogInput'>" + feedback + "</div><br/>";
		}
		msg += "</div>";
		$("#stage").append(msg);
		
		if(feedbackType == "undifferentiated"){
			CKEDITOR.inline( "feedbackEditText", {
				toolbar: contentToolbar,
				toolbarGroups :contentToolgroup,
				enterMode : CKEDITOR.ENTER_BR,
				shiftEnterMode: CKEDITOR.ENTER_P,
				extraPlugins: 'sourcedialog'
			});
			//$("#feedbackEditText").height(40);			
		}
		
		$('#' + feedbackType).prop('checked', true);
		
		//Switch to show the correct feedback type....
		$("#feedbackTypeGroup").change(function(){
			feedbackType = $('input[name=manageFeedbackType]:checked', '#feedbackTypeGroup').val();
			$("#questionEditDialog").remove();
			optionEdit_arr = [];
			updateQuestionEditDialog();
		});
		
		//find every option in the xml - place them on the screen.
		for (var i = 0; i < optionCount; i++){
			addOption(i, false);
		};
				
		//Style it to jQuery UI dialog
		$("#questionEditDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 800,
			height: 650,
			buttons: {
				Cancel: function(){
					$( this ).dialog( "close" );	
				},
				Add: function(){
					addOption(optionEdit_arr.length, true);	
				},
				Save: function(){
					var tmpObj = new Object();
					tmpObj.attempts = $("#inputAttempts").val();
					tmpObj.feedbackType = $('input[name=manageFeedbackType]:checked', '#feedbackTypeGroup').val();
					if(feedbackType == "undifferentiated"){
						tmpObj.feedbackUpdate = CKEDITOR.instances["feedbackEditText"].getData();
					}
					var tmpOptionArray = new Array();
					for(var i = 0; i < optionEdit_arr.length; i++){
						var tmpOptionObj = new Object();
						tmpOptionObj.optionText = CKEDITOR.instances[optionEdit_arr[i]+"Text"].getData();
						tmpOptionObj.optionCorrect = $("#"+optionEdit_arr[i]+"Correct").prop("checked");
						if(feedbackType == "differentiated"){
							tmpOptionObj.difText = CKEDITOR.instances[optionEdit_arr[i]+"DifFeedText"].getData()
						}
						tmpOptionArray.push(tmpOptionObj);
					}
					tmpObj.option_arr = tmpOptionArray;
					saveQuestionEdit(tmpObj);
					$("#questionEditDialog").dialog("close");
				}
			},
			close: function(){
				$("#questionEditDialog").remove();
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
		$(data).find("pages").eq(currentPage).find("option").eq(arrIndex).remove();
		optionEdit_arr.splice(arrIndex, 1);
		$("#option" + _id +"Container").remove();
		
		
	}
	
	function addOption(_addID, _isNew){
		var optionID = "option" + _addID;
		var optionLabel = _addID + 1;
		
		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).find("content").append(option1CDATA);
			$(data).find("page").eq(currentPage).find("option").eq(_addID).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct", "false");
			
		}
					
		var optionContent = $(data).find("page").eq(currentPage).find("option").eq(_addID).find("content").text();				
		var msg = "<div id='"+optionID+"Container' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='"+optionID+"Remove' class='removeMedia' value='"+_addID+"' title='Click to remove this answer option'/>";
		msg += "<div id='"+optionID+"Input'><b>Option " + optionLabel + ":</b></div>";
		msg += "<div id='"+optionID+"Text' contenteditable='true' class='dialogInput'>" + optionContent + "</div>";
		msg += "<label id='label'><b>correct:</b></label>";
		if($(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct") == "true"){	
			msg += "<input id='"+optionID + "Correct' type='checkbox' checked='checked' name='correct' class='radio' value='true'/>";
		}else{
			msg += "<input id='"+optionID + "Correct' type='checkbox' name='correct' class='radio' value='true'/>";
		}
		
		if(feedbackType == "differentiated"){
			msg += "<br/>"
			var difFeedContent = $(data).find("page").eq(currentPage).find("option").eq(_addID).find("diffeed").text();
			msg += "<label id='label'><b>Option " + optionLabel + " Differentiated Feedback:</b></label>";
			msg += "<div id='"+optionID+"DifFeedText' contenteditable='true' class='dialogInput'>" + difFeedContent + "</div>";
		}
		msg += "</div>";
				
		$("#questionEditDialog").append(msg);
		
		$("#" +optionID+"Remove").on('click', function(){
			removeOption($(this).attr("value"));
		});
		
		CKEDITOR.inline( optionID+"Text", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog'
		});	
		
		if(feedbackType == "differentiated"){
			CKEDITOR.inline( optionID+"DifFeedText", {
				toolbar: contentToolbar,
				toolbarGroups :contentToolgroup,
				enterMode : CKEDITOR.ENTER_BR,
				shiftEnterMode: CKEDITOR.ENTER_P,
				extraPlugins: 'sourcedialog'
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
        $(data).find("page").eq(currentPage).find("question").first().empty();
        $(data).find("page").eq(currentPage).find("question").first().append(newCDATA);
        sendUpdateWithRefresh();
    };

	/**********************************************************************
    **Save Question Edit - save updated question preferences to content.xml
    **********************************************************************/
	function saveQuestionEdit(_data){
		if(_data.feedbackType == "undifferentiated"){
			var feedbackUpdate = _data.feedbackUpdate;//$("#feedbackEditText").getCode();
			var feedDoc = new DOMParser().parseFromString('<feedback></feedback>', 'application/xml');
			var feedCDATA = feedDoc.createCDATASection(feedbackUpdate);
			$(data).find("page").eq(currentPage).find("feedback").empty();
			$(data).find("page").eq(currentPage).find("feedback").append(feedCDATA);
		}

		$(data).find("page").eq(currentPage).attr("attempts", _data.attempts);
		$(data).find("page").eq(currentPage).attr("feedbackType", _data.feedbackType);
		var correctOptions = 0;
		for(var i = 0; i < optionEdit_arr.length; i++){
			var optionText = _data.option_arr[i].optionText;
			var optionCorrect = _data.option_arr[i].optionCorrect;
			var newOption = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var optionCDATA = newOption.createCDATASection(optionText);
			$(data).find("page").eq(currentPage).find("option").eq(i).find('content').empty();
			$(data).find("page").eq(currentPage).find("option").eq(i).find('content').append(optionCDATA);
			if(_data.feedbackType == "differentiated"){
				var optionDifFeedText = _data.option_arr[i].difText;
				var optionDifFeedCDATA = newOption.createCDATASection(optionDifFeedText);
				$(data).find("page").eq(currentPage).find("option").eq(i).find('diffeed').empty();
				$(data).find("page").eq(currentPage).find("option").eq(i).find('diffeed').append(optionDifFeedCDATA);
			}
			$(data).find("page").eq(currentPage).find("option").eq(i).attr("correct", optionCorrect);
			
		}
		
		var extra = $(data).find("page").eq(currentPage).find("option").length;
		var active = optionEdit_arr.length;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("option").eq(i).remove();
		}
		
		sendUpdateWithRefresh();
		fadeComplete();
	}
	
	/*****************************************************************************************************************************************************************************************************************
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     ACESSIBILITY/508 FUNCTIONALITY
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     *****************************************************************************************************************************************************************************************************************/
	function doAccess(){
        var tabindex = 1;

	   	$("#pageTitle").attr("tabindex", tabindex);
	   	tabindex++;
	   	
	   	$('#question').attr("tabindex", tabindex);
	   	tabindex++;
	   	
	   	for(var i = 0; i < option_arr.length; i++){
		   	$(option_arr[i]).attr("tabindex", tabindex);
		   	tabindex++;
		}
		
		$("#pageTitle").focus();
	}
	//////////////////////////////////////////////////////////////////////////////////////////////////END ACCESSIBILITY
	

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
    
    function fadeComplete(){
		try { pageTitle.destroy(); } catch (e) {}
        try { audioHolder.destroy(); } catch (e) {}
        try { mediaHolder.destroy(); } catch (e) {}
        
		try { $("#scrollableContent").remove(); } catch (e) {}
				
		for(name in CKEDITOR.instances){
			try { CKEDITOR.instances[name].destroy() } catch (e) {}
		}
		
		loadPage();
    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}