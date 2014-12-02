/*!
 * C_TextInput
 * This class creates a template for TextInput questions.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2014-4-28
 * JavaScript
 *
 * Copyright (c) 2014, CTC. All rights reserved. 
 * 
 * @author: Tyler Shumaker, shumaket@ctc.com
 * 
 * This function allows for multiple parameters including:
 * 		1. 
 */
function C_TextInput(_type) {
	var type = _type;
    var myContent;//Body
    var questionCount = 0;
    var graded = false;
    var mandatory = true;
    var input_arr = [];
    var inputIds = [];
    var trackFeedbackNum = [];
    var correctAnswers = [];
    var textComboFeedback = [];
    var correctResponses = [];
    var attempts = [];
    var acceptedResponseEdit_arr = [];
    var currentEditBankMember = 0;
    var diffeedEdit_arr = [];
    var userAttempts = [];
    var isComplete = false;
    var scormVersion;

    //Defines a public method - notice the difference between the private definition below.
	this.initialize= function(){
		buildTemplate();
	}

	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		if(transition == true){
			$('#stage').css({'opacity':0});
		}

		isComplete = checkQuestionComplete();

		questionCount = $(data).find("page").eq(currentPage).find("question").length;
		scormVersion = $(data).find('scormVersion').attr('value');

		//randomize currentEditBankMember

		if($(data).find("page").eq(currentPage).attr('graded') == "true"){
			graded = true;
		}
		if($(data).find("page").eq(currentPage).attr('mandatory') == "false" || $(data).find("page").eq(currentPage).attr('mandatory') == undefined){
			mandatory = false;
		}
		
		pageTitle = new C_PageTitle();

		var msg = '<div id="scrollableContent" class="antiscroll-wrap text">';
		msg += '<div class="box">';
		msg += '<div id="contentHolder" class="overthrow antiscroll-inner">';
		msg += '<div id="textInputHolder" class="textInputHolder"></div>';
		msg += '</div></div></div>';		

		try { audioHolder.destroy(); } catch (e) {}
		console.log("add audio holder");
		audioHolder = new C_AudioHolder();
		
		$('#stage').append(msg);
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		if(isIE){
			$("#contentHolder").css("margin-bottom", "-16px");
		}

		placeQuestions();

	}

	function placeQuestions(){

		for (var i = 0; i < questionCount; i++){
			input_arr.push(i);
		}
		//input_arr = shuffleArray(order_arr);
		var autoComplete_arr = [];
		var msg = "<div>";
		for(var j = 0; j < input_arr.length; j++){

			var myNode = $(data).find("page").eq(currentPage).find("question").eq(input_arr[j]);
			var myQuestion = "question" + j;
	
			msg += myNode.find('content').text() + '<div class="ui-widget"><input type="text" name="' + myQuestion  + '" id="' + myQuestion  + '" class="dialogInput" style="width: 440px;" value=""></div>';
			msg += '<div id="fb'+myQuestion+'"></div>';
			inputIds.push(myQuestion);
			trackFeedbackNum.push(new Array(myQuestion, 0));
			correctResponses.push(new Array(myQuestion, myNode.find('correctresponse').text()));
			attempts.push(new Array(myQuestion, myNode.attr("attempts")));

			if(myNode.attr("autocomplete") == "true"){
				autoComplete_arr.push(true);
			}
			else{
				autoComplete_arr.push(false);
			}
			userAttempts.push(new Array(myQuestion, 0));
			
			var ars = [];
			for (var m = 0; m < myNode.find('acceptedresponse').length; m++) {
				ars.push($.trim(myNode.find('acceptedresponse').eq(m).text().replace("<![CDATA[", "").replace("]]>", "")));
			};

			correctAnswers.push(ars);

			for (var k = 0; k < myNode.find('diffeed').length; k++) {
				textComboFeedback.push(new Array(myQuestion, myNode.find('diffeed').eq(k).text()))
			};
		}

		msg += '</div>';
		$('#textInputHolder').append(msg);

		//apply accepted answers to autocorrect
		for(var w = 0; w < inputIds.length; w++){
			if(autoComplete_arr[w]){
				$("#question"+w).autocomplete({
					minLength: 2,
					source: correctAnswers[w]
				});
			}
		}

		var textInputQuestion_obj = new Object();
		for(var i = 0; i < questionResponse_arr.length; i++){
			if(currentPageID == questionResponse_arr[i].id){
				var _tiQuestions = questionResponse_arr[i].textInputQuestions;
				if(_tiQuestions.length > 0){
					for(var j = 0; j < _tiQuestions.length; j++){
						textInputQuestion_obj = _tiQuestions[j];
						if(textInputQuestion_obj.question == "question" + j)
						{
							$("#"+textInputQuestion_obj.question).val(textInputQuestion_obj.userAnswer);
							if($.trim(textInputQuestion_obj.userAnswer).length != 0){
								if(textInputQuestion_obj.correct)
								{
									$('#fb'+textInputQuestion_obj.question).html('Correct, the answer is '+ textInputQuestion_obj.userAnswer).css("color", "green");
									$('#'+textInputQuestion_obj.question).removeClass();
									$('#'+textInputQuestion_obj.question).addClass("dialogInputCorrect");
									$("#"+textInputQuestion_obj.question).attr("disabled", "disabled");
								}
								else{

									if(textInputQuestion_obj.userAttempts >= textInputQuestion_obj.maxAttempts){
										var qAnswers = correctAnswers[j];
										//$("#"+textInputQuestion_obj.question).val('Correct, the answer is '+$.trim(qAnswers[0]).replace("<![CDATA[", "").replace("]]>", "").toLowerCase());
										$("#"+textInputQuestion_obj.question).attr("disabled", "disabled");
									}

									for (var m = 0; m < userAttempts.length; m++) {
										if(userAttempts[m][0] == textInputQuestion_obj.question){
											userAttempts[m][1] = textInputQuestion_obj.userAttempts;
										}
									}

									$('#fb'+textInputQuestion_obj.question).html(textInputQuestion_obj.feedback).css("color", "red");					
									$('#'+textInputQuestion_obj.question).removeClass();
									$('#'+textInputQuestion_obj.question).addClass("dialogInputIncorrect");	
								}
							}
							else{
								$('#fb'+textInputQuestion_obj.question).html('Please provide an answer.').css("color", "red");;
							}							
						}
					}
				}
				else{
					for(var k = 0; k < input_arr.length; k++){
						var _tempTIQ_obj = new Object();
						_tempTIQ_obj.question = "question" + k;
						_tempTIQ_obj.userAnswer = '';
						_tempTIQ_obj.correct = false;
						_tempTIQ_obj.feedback = '';
						_tempTIQ_obj.userAttempts = 0;
						_tempTIQ_obj.maxAttempts = parseInt(attempts[k][1]);
						questionResponse_arr[i].textInputQuestions.push(_tempTIQ_obj);
					}
				}				
			}
		}

		if(!isComplete){
			$("#contentHolder").append('<div id="mcSubmit"></div>');
			$("#mcSubmit").button({ label: $(data).find("page").eq(currentPage).attr("btnText")/*, disabled: true*/ });
			$("#mcSubmit").click(checkTextCombo);	
		}
		else{
			mandatoryInteraction = false;
			checkNavButtons();
		}

		checkMode();

		if(transition == true){
			TweenMax.to($("#stage"), transitionLength, {css:{opacity:1}, ease:transitionType});
		}

	}

	// checks results, tracks feedback and attempts
	/////////////////////////////////////////////////////////////
	function checkTextCombo()
	{
		var allComplete = true;
		var selected_arr = [];

		var textInputQuestion_obj = new Object();
		for(var i = 0; i < questionResponse_arr.length; i++){
			if(currentPageID == questionResponse_arr[i].id){
				var _tiQuestions = questionResponse_arr[i].textInputQuestions;
				if(_tiQuestions.length > 0){
					for(var j = 0; j < _tiQuestions.length; j++){
						textInputQuestion_obj = _tiQuestions[j];
						if(textInputQuestion_obj.question == "question" + j)
						{
							if(!textInputQuestion_obj.correct)
							{
								var inputAnswer = $("#"+textInputQuestion_obj.question).val();
								textInputQuestion_obj.userAnswer = inputAnswer;
								selected_arr.push(inputAnswer);

								if($.trim(inputAnswer).length != 0){
									var qAttemptCount = 0;
									var qMaxAttempt = 0;
									for (var k = 0; k < userAttempts.length; k++) {
										if(userAttempts[k][0] == textInputQuestion_obj.question){
											var qAttemptCount = userAttempts[k][1] + 1;
											textInputQuestion_obj.userAttempts = userAttempts[k][1] = qAttemptCount;

										}
										if(attempts[k][0] == textInputQuestion_obj.question){
											qMaxAttempt = parseInt(attempts[k][1]);
											textInputQuestion_obj.maxAttempts = qMaxAttempt;
										}

									};

									var isCorrect = false;
									var qAnswers = correctAnswers[j];
									if(qMaxAttempt>=qAttemptCount){
										for(var m = 0; m<qAnswers.length; m++){
											if($.trim(qAnswers[m]).replace("<![CDATA[", "").replace("]]>", "").toLowerCase() === inputAnswer.toLowerCase()){
												isCorrect = true;
											}
										}
									}

									textInputQuestion_obj.correct = isCorrect;

									if(isCorrect === true){
										var crPos = returnCorrectResponse(textInputQuestion_obj.question);
										if(crPos != -1){
											$('#fb'+textInputQuestion_obj.question).html(correctResponses[crPos][1]).css("color", "green");
										}
										else{
											$('#fb'+textInputQuestion_obj.question).html('Correct, the answer is '+ qAnswers[0]).css("color", "green");
										}
										$('#'+textInputQuestion_obj.question).removeClass();
										$('#'+textInputQuestion_obj.question).addClass("dialogInputCorrect");
										$("#"+textInputQuestion_obj.question).attr("disabled", "disabled");
									}
									else{
										var feedbackPos = returnTCFeedback(textInputQuestion_obj.question);
										if(feedbackPos != -1){
											textInputQuestion_obj.feedback = textComboFeedback[feedbackPos][1];
											$('#fb'+textInputQuestion_obj.question).html(textComboFeedback[feedbackPos][1]).css("color", "red");
											if(getFeedbackAttempt(textInputQuestion_obj.question) < attempts[returnAttemptsPos(textInputQuestion_obj.question)][1]){
												increaseFeedbackAttempt(textInputQuestion_obj.question);
												textComboFeedback.splice(feedbackPos, 1);	
											}
										}
										if(qAttemptCount >= qMaxAttempt){
											//$("#"+textInputQuestion_obj.question).val('Correct, the answer is '+$.trim(qAnswers[0]).replace("<![CDATA[", "").replace("]]>", "").toLowerCase());
											$("#"+textInputQuestion_obj.question).attr("disabled", "disabled");
										}
										else{
											allComplete = false;
										}
										$('#'+textInputQuestion_obj.question).removeClass();
										$('#'+textInputQuestion_obj.question).addClass("dialogInputIncorrect");		

									}

									updateTextInputQuestionResponse(textInputQuestion_obj);

								}
								else
								{
									allComplete = false;
									$('#fb'+textInputQuestion_obj.question).html('Please provide an answer.').css("color", "red");;
								}
							}																												
						}
					}
				}		
			}
		}		


		//set SCORM objective for page - C_SCORM.js
		setPageObjective(allComplete, graded);

		if(allComplete){					
			updateScoring(selected_arr, allComplete, null, null);
			mandatoryInteraction = false;
			$("#mcSubmit").remove();		
			checkNavButtons();
		}



	}

	function returnTCFeedback(id){
		for (var i = 0; i < textComboFeedback.length; i++) {
			if(textComboFeedback[i][0] == id){
				return i;
			}
		};
		return -1;
	}

	function returnCorrectResponse(id){
		for (var i = 0; i < correctResponses.length; i++) {
			if(correctResponses[i][0] == id){
				return i;
			}
		};
		return -1;
	}	

	function returnAttemptsPos(id){
		for (var i = 0; i < attempts.length; i++) {
			if(attempts[i][0] == id){
				return i;
			}
		};
		return -1;
	}		

	function increaseFeedbackAttempt(id){
		for (var i = 0; i < trackFeedbackNum.length; i++) {
			var tempArray = trackFeedbackNum[i];
			if(tempArray[0] == id){
				tempArray[1] = tempArray[1]+1;
			}
		};		
	}

	function getFeedbackAttempt(id){
		for (var i = 0; i < trackFeedbackNum.length; i++) {
			var tempArray = trackFeedbackNum[i];
			if(tempArray[0] == id){
				return tempArray[1];
			}
		};		
		return -1;
	}		

	///////////////////////////////////////////////

	function checkMode(){
		$('.antiscroll-wrap').antiscroll();
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top) + audioHolder.getAudioShim());
		//
		if(mode == "edit"){		
			/*******************************************************
			* Edit Question
			********************************************************/
	        //Add and style titleEdit button
			$('#textInputHolder').prepend("<div id='questionEdit' class='btn_edit_text' title='Edit Text Question'></div>");
			$("#questionEdit").click(function(){
				updateQuestionEditDialog();
			}).tooltip();
		}
	}	

	function updateQuestionEditDialog(){
		var msg = "<div id='questionEditDialog' title='Create Text Input Question(s)'>";
		msg += "<label id='label'><b>graded: </b></label>";
		msg += "<input id='isGraded' type='checkbox' name='graded' class='radio' value='true' title='Indicates if this page is graded.'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label' title='Mandatory means that this page must be completed before proceeding.(disabled in edit mode)'><b>mandatory: </b></label>";
		msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</br>";
		msg += "<div id='questionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Questions Menu: </b></label>";	
		var questionMenu_arr = [];
		for (var i = 0; i < questionCount; i++) {
			var label = i + 1;
			var tmpID = "bankItem" + i;
			msg += "<div id='"+tmpID+"' class='questionBankItem";
			if(currentEditBankMember == i){
				msg += " selectedEditBankMember";
			}else{
				msg += " unselectedEditBankMember";
			}
			msg += "' style='";
			
			if(i < 100){
				msg += "width:30px;";
			}else if(i > 99){
				msg += "width:45px;";
			}
			var cleanText = $(data).find("page").eq(currentPage).find("question").eq(i).find("content").text().replace("<p>", "").replace("</p>", "");
			msg += "' data-myID='" + i + "' title='" + cleanText + "'>" + label + "</div>";

			questionMenu_arr.push(tmpID);

		}

		var autoCompleteValue = true;
		var _autoCompleteString = $(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).attr('autocomplete'); 
		if(_autoCompleteString == "false" || _autoCompleteString == undefined){
			autoCompleteValue = false;
		}
		msg += "</div><br/><br/>";
		var labelNumber = parseInt(currentEditBankMember) + 1;
		msg += "<div><b>Edit Question #" + labelNumber + ":</b></div>"; 
		msg += "<div id='currentEditQuestion' class='editItemContainer'>"
		msg += "<div id='removeBankItem' class='removeMedia' title='Click to remove this bank item'/>";
		msg += "<div><label style='margin-right:20px;'><b>Question Preferences: </b></label>";
		msg += "<label id='label'>no. of attempts: </label>";
		msg += "<input type='text' name='myName' id='inputAttempts' title='Increase the number of attempts.' value='"+ $(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).attr('attempts') +"' class='dialogInput' style='width:35px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'>Autocomplete: </label>";
		msg += "<input type='checkbox' name='autocomplete' id='inputAutoComplete' title='Enable autocomplete functionality.' class='radio' style='width:35px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<div id='label'><b>Input your question: </b></div>";
		msg += "<div id='questionEditText' class='dialogInput' contenteditable='true'></div>";
		msg += "<div id='inputCRLabel'><b>Correct Response Feedback: </b></div>";
		msg += "<div id='inputCorrectResponse' class='dialogInput' contenteditable='true'></div>";	
		msg += "</div><br/>"
		msg += "<div id='acceptedResponseEdit'/>";
		msg += "<div id='diffeedEdit'/>";

		msg += "<br/></div></div>";
		$("#stage").append(msg);

		$("#questionEditText").append($(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("content").text().replace("<p>", "").replace("</p>", ""));
		$("#inputCorrectResponse").append($(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("correctresponse").eq(0).text());
		$("#removeBankItem").click(removeBankItem).tooltip();

		CKEDITOR.inline( "questionEditText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
		   	on: {
		      instanceReady: function(event){
		         $(event.editor.element.$).attr("title", "Click here to edit the question.");
		    	}
		    }
		});

		CKEDITOR.inline( "inputCorrectResponse", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
		   	on: {
		      instanceReady: function(event){
		         $(event.editor.element.$).attr("title", "Click here to edit the feedback given when the question is answered correctly.");
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
					acceptedResponseEdit_arr = [];
					diffeedEdit_arr = [];
					updateQuestionEditDialog();
				}).tooltip();
			}
		}

		if(!autoCompleteValue){
			$("#inputAutoComplete").removeAttr('checked');
		}
		else{
			$("#inputAutoComplete").attr('checked', 'checked');
		}

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

		//find every acceptedresponse in the xml - place them on the screen.
		for (var i = 0; i < $(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("acceptedresponse").length; i++){
			addAcceptedResponse(i, false);
		};

		//find every diffeed in the xml - place them on the screen
		for (var j = 0; j < $(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("diffeed").length; j++){
			addDiffeed(j, false);
		};		

		//Style it to jQuery UI dialog
		$("#questionEditDialog").dialog({
			autoOpen: true,
			dialogClass: "no-close",
			modal: true,
			width: 875,
			height: 650,
			buttons: [
				{
					text: "Add Question",
					title: "Adds a new question.",
					click: function(){
						var tmpObj = makeQuestionDataStore();
						saveQuestionEdit(tmpObj);
						addQuestion(questionCount);
					}	
				},
				{
					text: "Add Accepted Response",
					title: "Adds a new accepted response phrase.",
					click: function(){
						addAcceptedResponse(acceptedResponseEdit_arr.length, true);
					}
				},
				{
					text: "Add Feedback",
					title: "Adds a new feedback based off of the number of attempts.",
					click: function(){
						addDiffeed(diffeedEdit_arr.length, true);
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

		//adds tooltips to the edit dialog buttons
	    $(function () {
	        $(document).tooltip();
	    });

	}	

	function makeQuestionDataStore(){
		var tmpObj = new Object();
		tmpObj.attempts = $("#inputAttempts").val();
		if($("#inputAutoComplete").prop("checked") == true){
			//$(data).find("page").eq(currentPage).attr("graded", "true");
			tmpObj.autoComplete= true;
		}else{
			//$(data).find("page").eq(currentPage).attr("graded", "false");
			tmpObj.autoComplete = false;
		}		

		tmpObj.correctResponse = CKEDITOR.instances["inputCorrectResponse"].getData();
		try{ CKEDITOR.instances["inputCorrectResponse"].destroy() } catch (e) {}

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
		tmpObj.question = CKEDITOR.instances["questionEditText"].getData();
		try { CKEDITOR.instances["questionEditText"].destroy() } catch (e) {}

		var tmpAcceptedArray = new Array();

		for(var i = 0; i < acceptedResponseEdit_arr.length; i++){
			var tmpAcceptedObj = new Object();
			tmpAcceptedObj.acceptedText = CKEDITOR.instances[acceptedResponseEdit_arr[i]+"Text"].getData();
			try { CKEDITOR.instances[acceptedResponseEdit_arr[i]+"Text"].destroy() } catch (e) {}
			tmpAcceptedArray.push(tmpAcceptedObj);
		}
		tmpObj.accepted_arr = tmpAcceptedArray;

		var tmpDiffeedArray = new Array();
		for (var j = 0; j < diffeedEdit_arr.length;j++) {
			var tmpFeedObj = new Object();
			tmpFeedObj.diffeedText = CKEDITOR.instances[diffeedEdit_arr[j]+"Text"].getData();
			try {CKEDITOR.instances[diffeedEdit_arr[j]+"Text"].destroy() } catch (e) {}
			tmpDiffeedArray.push(tmpFeedObj);
		};
		tmpObj.diffeed_arr = tmpDiffeedArray;

		return tmpObj;
	}

	function removeAcceptedResponse(_id){
		if($(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("acceptedresponse").length > 1){
			for(var i = 0; i < acceptedResponseEdit_arr.length; i++){
				if(_id == $("#"+acceptedResponseEdit_arr[i]+"Container").attr("value")){
					var arrIndex = i;
					break;
				}
			}
			$(data).find("pages").eq(currentPage).find("question").eq(currentEditBankMember).find("acceptedresponse").eq(arrIndex).remove();
			acceptedResponseEdit_arr.splice(arrIndex, 1);
			$("#acceptedResponse" + _id +"Container").remove();	
		}
		else{
			alert("you must have at least one accepted response.")
		}	
	}

	function removeDiffeed(_id){
		if($(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("diffeed").length > 1){
			for(var i = 0; i < diffeedEdit_arr.length; i++){
				if(_id == $("#"+diffeedEdit_arr[i]+"Container").attr("value")){
					var arrIndex = i;
					break;
				}
			}
			$(data).find("pages").eq(currentPage).find("question").eq(currentEditBankMember).find("diffeed").eq(arrIndex).remove();
			diffeedEdit_arr.splice(arrIndex, 1);
			$("#diffeed" + _id +"Container").remove();	
		}
		else{
			alert("you must have at least one feedback.")
		}	
	}	

	function removeBankItem(){
		if(questionCount > 1){
			$(data).find("pages").eq(currentPage).find("question").eq(currentEditBankMember).remove();
			questionCount--;
			$("#questionEditDialog").remove();
			acceptedResponseEdit_arr = [];
			diffeedEdit_arr = [];
			currentEditBankMember = 0;
			updateQuestionEditDialog();
		}else{
			alert("you must have at least one bank item.");
		}
	}	

	function addQuestion(_addID){

		$(data).find("page").eq(currentPage).append($("<question>"));
		var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
		$(data).find("page").eq(currentPage).find("question").eq(_addID).attr("attempts", 1);
		$(data).find("page").eq(currentPage).find("question").eq(_addID).attr("autocomplete", false);
		//content
		$(data).find("page").eq(currentPage).find("question").eq(_addID).append($("<content>"));
		var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
		var question1CDATA = content1.createCDATASection("<p>Input a question.</p>");
		$(data).find("page").eq(currentPage).find("question").eq(_addID).find("content").append(question1CDATA);
		//acceptedresponse
		$(data).find("page").eq(currentPage).find("question").eq(_addID).append($("<acceptedresponse>"));
		var acceptedResponse1 = new DOMParser().parseFromString('<acceptedresponse></acceptedresponse>', "text/xml");
		var acceptedResponse1CDATA = acceptedResponse1.createCDATASection("Yes");
		$(data).find("page").eq(currentPage).find("question").eq(_addID).find("acceptedresponse").append(acceptedResponse1CDATA);
		//diffeed
		$(data).find("page").eq(currentPage).find("question").eq(_addID).append($("<diffeed>"));
		var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
		var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
		$(data).find("page").eq(currentPage).find("question").eq(_addID).find("diffeed").append(difFeed1CDATA);
		//correctresponse
		$(data).find("page").eq(currentPage).find("question").eq(_addID).append($("<correctresponse>"));
		var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
		var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
		$(data).find("page").eq(currentPage).find("question").eq(_addID).find("correctresponse").eq(0).append(myCorrectResponseCDATA);		

		questionCount++;
		currentEditBankMember = _addID;
		$("#questionEditDialog").remove();
		acceptedResponseEdit_arr  = [];
		diffeedEdit_arr = [];
		updateQuestionEditDialog();

	}

	function addAcceptedResponse(_addID, _isNew){
		var acceptedID = "acceptedResponse" + _addID;
		var acceptedLabel = _addID + 1;
		if(_isNew == true){
			$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).append($("<acceptedresponse>"));
			var acceptedResponse1 = new DOMParser().parseFromString('<acceptedresponse></acceptedresponse>', "text/xml");
			var acceptedResponse1CDATA = acceptedResponse1.createCDATASection("Yes");
			$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("acceptedresponse").append(acceptedResponse1CDATA);		
		}

		var acceptedContent = $(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("acceptedresponse").eq(_addID).text();
		var msg = "<div id='"+acceptedID+"Container' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='"+acceptedID+"Remove' class='removeMedia' value='"+_addID+"' title='Click to remove this accepted response'/>";
		msg += "<div id='"+acceptedID+"Input' style='padding-bottom:5px;'><b>Accepted Response " + acceptedLabel + ":</b></div>";
		msg += "<div id='"+acceptedID+"Text' contenteditable='true' class='dialogInput' >" + acceptedContent + "</div>";	
		msg += "</div>";
				
		$("#acceptedResponseEdit").append(msg);		

		$("#" +acceptedID+"Remove").on('click', function(){
			removeAcceptedResponse($(this).attr("value"));
		});	

		CKEDITOR.inline( acceptedID+"Text", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
		   	on: {
		      instanceReady: function(event){
		         $(event.editor.element.$).attr("title", "Click here to edit this accepted response.");
		    	}
		    }			
		});
		acceptedResponseEdit_arr.push(acceptedID);			
	}

	function addDiffeed(_addID, _isNew){
		var diffeedCount = $(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("diffeed").length;
		if(_isNew == true){
			diffeedCount++;
		}
		var attemptCount = parseInt($("#inputAttempts").val());
		if(diffeedCount <= attemptCount){
			var diffeedID = "diffeed" + _addID;
			var diffeedLabel = _addID + 1;
			if(_isNew == true){
				$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).append($("<diffeed>"));
				var diffeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
				var diffeed1CDATA = diffeed1.createCDATASection("Input unique option feedback.");
				$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("diffeed").append(diffeed1CDATA);		
			}

			var diffeedContent = $(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("diffeed").eq(_addID).text();
			var msg = "<div id='"+diffeedID+"Container' class='templateAddItem' value='"+_addID+"'>";
			msg += "<div id='"+diffeedID+"Remove' class='removeMedia' value='"+_addID+"' title='Click to remove this feedback'/>";
			msg += "<div id='"+diffeedID+"Input' style='padding-bottom:5px;'><b>Incorrect Feedback " + diffeedLabel + ":</b></div>";
			msg += "<div id='"+diffeedID+"Text' contenteditable='true' class='dialogInput'>" + diffeedContent + "</div>";	
			msg += "</div>";
					
			$("#diffeedEdit").append(msg);		

			$("#" +diffeedID+"Remove").on('click', function(){
				removeDiffeed($(this).attr("value"));
			});	

			CKEDITOR.inline( diffeedID+"Text", {
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

			diffeedEdit_arr.push(diffeedID);
		}
		else{
			alert("You can't have more feedback items then number of attempts. Increase the number of attempts to add more feedback. ");
		}			
	}	

	function saveQuestionEdit(_data){
		
		var questionUpdate = _data.question;
		var questionDoc = new DOMParser().parseFromString('<content></content>', 'text/xml')
		var questionCDATA = questionDoc.createCDATASection(questionUpdate);
		$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find('content').empty();
		$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find('content').append(questionCDATA);				

		$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).attr("attempts", _data.attempts);
		$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).attr("autocomplete", _data.autoComplete);

		var correctResponseUpdate = _data.correctResponse;
		var correctResponseDoc = new DOMParser().parseFromString('<correctresponse></correctresponse>', 'text/xml')
		var correctResponseCDATA = correctResponseDoc.createCDATASection(correctResponseUpdate);
		$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find('correctresponse').eq(0).empty();
		$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find('correctresponse').eq(0).append(correctResponseCDATA);

		for(var j = 0; j < questionResponse_arr.length; j++){
			if(questionResponse_arr[j].id == $(data).find('page').eq(currentPage).attr('id')){
				questionResponse_arr[j].graded = _data.graded;
			}
		}
		$(data).find("page").eq(currentPage).attr("graded", _data.graded);
		$(data).find("page").eq(currentPage).attr("mandatory", _data.mandatory);

		for(var i = 0; i < acceptedResponseEdit_arr.length; i++){
			//var correctOptions = 0;
			var acceptedResponseText = _data.accepted_arr[i].acceptedText;
			var newAcceptedResponse = new DOMParser().parseFromString('<acceptedresponse></acceptedresponse>',  "text/xml");
			var acceptedCDATA = newAcceptedResponse.createCDATASection(acceptedResponseText);
			$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("acceptedresponse").eq(i).empty();
			$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("acceptedresponse").eq(i).append(acceptedCDATA);

		}
		
		var extra = $(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("acceptedresponse").length;
		var active = acceptedResponseEdit_arr.length;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("acceptedresponse").eq(i).remove();
		}

		//im here updating the diffeedEdit_arr
		for(var i = 0; i < diffeedEdit_arr.length; i++){
			//var correctOptions = 0;
			var diffeedText = _data.diffeed_arr[i].diffeedText;
			var newDiffeed = new DOMParser().parseFromString('<diffeed></diffeed>',  "text/xml");
			var diffeedCDATA = newDiffeed.createCDATASection(diffeedText);
			$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("diffeed").eq(i).empty();
			$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("diffeed").eq(i).append(diffeedCDATA);

		}
		
		var extra = $(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("diffeed").length;
		var active = diffeedEdit_arr.length;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("question").eq(currentEditBankMember).find("diffeed").eq(i).remove();
		}		
		
	}

	function saveBankEdit(_data){
		saveQuestionEdit(_data);
		var extra = $(data).find("page").eq(currentPage).find("question").length;
		var active = questionCount;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("question").eq(i).remove();
		}
		markIncomplete();
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

	this.destroySelf = function() {
		 TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:Power2.easeIn, onComplete:fadeComplete});
    }
    
    this.fadeComplete = function(){
        	fadeComplete();
	}			
}