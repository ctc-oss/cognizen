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
function C_Categories(_type) {
	var type = _type;
    var myContent;//Body
    var optionStartX = 0;
    var attemptsAllowed = 2;
    var attemptsMade = 0;
    //var feedbackType;
    //var feedbackDisplay;
    //var feedbackCorrectTitle;
    //var feedbackIncorrectTitle;
    //var feedbackIncorrectAttempt;
    //var feedback;
    var answerCount = 0;
    var isComplete = false;
    var graded = false;
    var mandatory = true;
    var myObjective = "undefined";
    var myObjItemId = "undefined";
	var order_arr = [];
	var question_arr = [];
	var answer_arr = [];
	var cycle = false;
	var currentQuestion = 0;
	var randomize = false;
	var cycleQuestion = 0;
	var currentEditAnswerBankMember = 0;
	var currentEditQuestionBankMember = 0;
	var answerCount = 0;
	var optionCount = 0;
    
    //Defines a public method - notice the difference between the private definition below.
	this.initialize= function(){
		answerCount = $(data).find("page").eq(currentPage).find("answer").length;
		optionCount = $(data).find("page").eq(currentPage).find("option").length;
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		if($(data).find("page").eq(currentPage).attr('cycle') == "true"){
			cycle = true;
		}
		
		if($(data).find("page").eq(currentPage).attr('objective')){
			myObjective = $(data).find("page").eq(currentPage).attr('objective');
		}

		if($(data).find("page").eq(currentPage).attr('objItemId')){
			myObjItemId = $(data).find("page").eq(currentPage).attr('objItemId');
		}		
		
		if($(data).find("page").eq(currentPage).attr('graded') == "true"){
			graded = true;
		}
		if($(data).find("page").eq(currentPage).attr('mandatory') == "false"){
			mandatory = false;
		}
		if($(data).find("page").eq(currentPage).attr('randomize') == "true"){
			randomize = true;
		}
		
		isComplete = checkQuestionComplete();
		
		pageTitle = new C_PageTitle();
		
		var msg = '<div id="scrollableContent" class="antiscroll-wrap matching">';
		msg += '<div class="box">'
		msg += '<div id="contentHolder" class="overthrow antiscroll-inner">';
		msg += '<div id="question" class="questionTop"></div>';
		msg += '<div id="categoryHolder" class="categoryHolder">';
		msg += '<div id="categoryOptionHolder" class="categoryOptionHolder"></div>';
		msg += '<div id="categoryAnswerHolder" class="categoryAnswerHolder">';
		msg += '<div id="categoryAnswerButtonsHolder" class="categoryAnswerButtonsHolder"></div>';
		msg += '</div>';
		msg += '<div id="categoryProgressTracker" class="categoryProgressTracker">';
		msg += '<div id="categoryTrackingMenu" class="categoryTrackingMenu">';
		msg += '<div class="categoryProgressLabel"><span style="display:inline-block; vertical-align:middle;">Progress:  </span></div></div></div></div></div></div></div>';
		
		audioHolder = new C_AudioHolder();
		
		$('#stage').append(msg);
		
		myContent = $(data).find("page").eq(currentPage).find('content').first().text();
		$("#question").append(myContent);
		
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()) + 5);
		$("#categoryHolder").height($("#contentHolder").height() - $("#categoryHolder").position().top - 5);
		
		if(isComplete && mode != "edit"){
			if(cycle){
				// fade stage in
				$('#stage').velocity({
					opacity: 1
				}, {
					duration: transitionLength
				});
				doPageCompleteCycle();
			}else{
				for(var k=0; k<questionResponse_arr.length; k++){
					if(currentPageID == questionResponse_arr[k].id){
						question_arr = [];
						question_arr = questionResponse_arr[k].order;
						break;
					}
				}
				// fade stage in
				$('#stage').velocity({
					opacity: 1
				}, {
					duration: transitionLength
				});
				doPageCompleteNoCycle();
			}
		}else{
			buildTemplate();
		}
	}
	
	function buildTemplate(){
		/***********************************************************************************************************
		ADD QUESTIONS TO THE SCREEN
		***********************************************************************************************************/
		//create array of question objects.
		question_arr = [];
		var questionIterator = 0;
		
		$(data).find("page").eq(currentPage).find("option").each(function(){
			var questionObj = new Object();
			questionObj.correct = null;
			questionObj.match = $(data).find("page").eq(currentPage).find("option").eq(questionIterator).attr("correct");
			questionObj.content = $(data).find("page").eq(currentPage).find("option").eq(questionIterator).find("content").text();
			questionObj.feedback = $(data).find("page").eq(currentPage).find("option").eq(questionIterator).find("diffeed").text();
			questionObj.complete = false;
			questionObj.attempt = null;
			question_arr.push(questionObj);
			addTrackingMenuItem(questionIterator);
			questionIterator++;
		});
		
		if(randomize == true){
			question_arr = shuffleArray(question_arr);
		}
		
		$("#categoryTrackingMenu").css({'top': ($("#categoryProgressTracker").height() - $("#categoryTrackingMenu").height())/2});
		
		/***********************************************************************************************************
		ADD ANSWERS TO THE SCREEN
		***********************************************************************************************************/
		var answerIterator = 0;
		var answerHolderWidth = 0;
		
		$(data).find("page").eq(currentPage).find("answer").each(function(){
			placeAnswer(answerIterator);
			answerHolderWidth += ($("#" + answerIterator).width() + 5);
			answerIterator++;
		});
		$("#categoryAnswerButtonsHolder").width(answerHolderWidth);
		$("#categoryAnswerButtonsHolder").css({'top': ($("#categoryAnswerHolder").height() - $("#categoryAnswerButtonsHolder").height())/2});
		
		
		if(transition == true){
			$('#stage').velocity({
				opacity: 1
			}, {
				duration: transitionLength,
				complete: function(){
					placeQuestion(currentQuestion);
				}
			});
		}else{
			placeQuestion(currentQuestion);
		}
		
		checkMode();
	}
	
	function addTrackingMenuItem(_id){
		var label = _id + 1;
		$("#categoryTrackingMenu").append("<div id='categoryTrackingMenuItem"+_id+"' class='categoryTrackingMenuItem'><span style='display:inline-block; vertical-align:middle;'>"+ label +"</span></div>");
	}
	
	function placeQuestion(_id){
		highlightMenuItem(_id);
		var myCorrect = question_arr[_id].match;
		var myLabel = question_arr[_id].content;
		$("#categoryOptionHolder").append("<div id='categoryOptionItem' class='categoryOptionItem' value='" + myCorrect + "'>"+myLabel+"</div>");
		$("#categoryOptionItem").css({'top': ($("#categoryOptionHolder").height() - $("#categoryOptionItem").height())/2, 'transform':'scale(.1)', '-webkit-transform': 'scale(.1)', '-ms-transform':'scale(.1)', 'opacity': '0'});
		$('#categoryOptionItem').velocity({
			scaleX: 1, 
			scaleY: 1, 
			opacity: 1
		}, {
			duration: 1000
		});
		enableAnswerButtons();
	}
	
	function highlightMenuItem(_id){
		$("#categoryTrackingMenuItem" + _id).addClass("categoryTrackingMenuItemHighlight")
	}
	
	function placeAnswer(_id){
		var myCorrect = $(data).find("page").eq(currentPage).find("answer").eq(_id).attr("correct");
		var myLabel = $(data).find("page").eq(currentPage).find("answer").eq(_id).find("content").text();
		$("#categoryAnswerButtonsHolder").append("<div id='" + _id + "' class='categoryAnswerItem' value='" + myCorrect + "'>"+myLabel+"</div>");
		$("#"+_id).button().click(function(){
			$("#categoryTrackingMenuItem"+cycleQuestion).removeClass("categoryTrackingMenuItemHighlight");
			disableAnswerButtons();
			checkAnswer($(this));
		});
	}
	/*CHECK AND PROCESS EACH USER ANSWER*/
	function checkAnswer(_selection){
		//Add the correct incorrect fluff and pomp...
		$("#categoryOptionHolder").prepend("<div id='displayResult'></div>");
		$("#displayResult").height($("#categoryOptionHolder").height());
		$("#displayResult").css({'opacity': '0'});
		$("#displayResult").width($("#categoryOptionHolder").width());
		
		//Store what the user attempted.
		question_arr[cycleQuestion].attempt = _selection.attr("value");
		if(_selection.attr("value") == $("#categoryOptionItem").attr("value")){
			try { $("#categoryTrackingMenuItem" + cycleQuestion).removeClass("categoryTrackingMenuItemIncorrect");} catch (e) {}
			$("#categoryTrackingMenuItem" + cycleQuestion).addClass("categoryTrackingMenuItemCorrect");
			question_arr[cycleQuestion].complete = true;
			question_arr[cycleQuestion].correct = true;
			_selection.addClass("categoryCorrect");
			$("#displayResult").addClass("categoryDisplayCorrect");
			$('#categoryOptionItem').velocity({
				scaleX: 4, 
				scaleY: 4, 
				opacity: 0
			}, {
				duration: 2000,
				complete: function(){
					fadeDisplayResult(_selection);
				}
			});
		}else{
			question_arr[cycleQuestion].correct = false;
			$("#categoryTrackingMenuItem" + cycleQuestion).addClass("categoryTrackingMenuItemIncorrect");
			_selection.addClass("categoryIncorrect");
			$("#displayResult").addClass("categoryDisplayIncorrect");
			$('#categoryOptionItem').velocity({
				scaleX: .1, 
				scaleY: .1, 
				opacity: 0
			}, {
				duration: 2000,
				complete: function(){
					fadeDisplayResult(_selection);
				}
			});
		}
		$('#displayResult').velocity({
			opacity: 1
		}, {
			duration: 500
		});
	}
		
	function fadeDisplayResult(_selection){
		$("#categoryOptionItem").remove();
		$('#displayResult').velocity({
			opacity: 0
		}, {
			duration: 500,
			complete: function(){
				removeDisplayResult(_selection);
			}
		});
	}
	
	function removeDisplayResult(_selection){
		$("#displayResult").remove();
		try { _selection.removeClass("categoryCorrect");} catch (e) {}
		try { _selection.removeClass("categoryIncorrect");} catch (e) {}
		currentQuestion++;
		cycleQuestion = currentQuestion;
		if(currentQuestion >= question_arr.length){
			if(cycle){
				var cycleComplete = true;
				for(var i = 0; i < question_arr.length; i++){
					if(question_arr[i].correct == false){
						cycleComplete = false;
						cycleQuestion = i;
						placeQuestion(i);
						break;
					}
				}
				if(cycleComplete){
					doPageCompleteCycle();
					updateScoring(question_arr, true, question_arr);
				}
			}else{
				doPageCompleteNoCycle();
			}
		}else{
			placeQuestion(currentQuestion);
		}
	}
	
	function doPageCompleteCycle(){
		mandatoryInteraction = false;
		checkNavButtons();
		var msg = "<div id='categoryCompletion' class='categoryCompletion'><p>Congratulations, you have completed the exercise.</p></div>";
		$("#question").remove();
		$("#categoryOptionHolder").remove();
		$("#categoryAnswerHolder").remove();
		$("#categoryProgressTracker").remove();
		$("#categoryHolder").remove();
		$("#contentHolder").append(msg);
		$("#categoryCompletion").addClass("categoryPerfect");
	}
	
	function doPageCompleteNoCycle(){
		mandatoryInteraction = false;
		checkNavButtons();
		var msg = "<div id='categoryCompletion' class='categoryCompletion'><p>Congratulations, you have completed the exercise.</p>";
		var perfect = true;
		var missedItems = 0;
		for(var i = 0; i < question_arr.length; i++){
			if(question_arr[i].correct == false){
				missedItems++;
				if(perfect == true){
					msg += "<p>You answered the following items incorrectly: <br/>";
					perfect = false;
				}
				var myQuestion = question_arr[i].content;
				var myResponse;
				var myCorrect;
				for(var j = 0; j < $(data).find("page").eq(currentPage).find("answer").length; j++){
					if(question_arr[i].attempt == $(data).find("page").eq(currentPage).find("answer").eq(j).attr("correct")){
						myResponse = $(data).find("page").eq(currentPage).find("answer").eq(j).find("content").text();
					}
					if(question_arr[i].match == $(data).find("page").eq(currentPage).find("answer").eq(j).attr("correct")){
						myCorrect = $(data).find("page").eq(currentPage).find("answer").eq(j).find("content").text();
					}
				}
				msg += "For " + myQuestion + " you answered: " + myResponse + " the correct answer is: " + myCorrect + "<br/>";
			}			
		}
		if(perfect){
			msg += "<p>Great job - you got them all right!</p>"
		}else{
			msg += "</p>";
		}
		updateScoring(question_arr, perfect, question_arr);
		msg += "</div>";
		$("#question").remove();
		$("#categoryOptionHolder").remove();
		$("#categoryAnswerHolder").remove();
		//$("#categoryHolder").remove();
		$("#categoryHolder").prepend(msg);
		if(perfect == true){
			$("#categoryCompletion").addClass("categoryPerfect");
		}else{
			$("#categoryCompletion").addClass("categoryImperfect");
		}
	}
	
	function enableAnswerButtons(){
		$('.categoryAnswerItem').button("enable");
	}
	
	function disableAnswerButtons(){
		$('.categoryAnswerItem').button("disable");
	}
	
	/*****************************************************************************************************************************************************************************************************************
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	PAGE EDIT FUNCTIONALITY
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	function checkMode(){
		$(this).scrubContent();	
		$('.antiscroll-wrap').antiscroll();	
		if(mode == "edit"){			
			$("#question").attr('contenteditable', true);
            CKEDITOR.disableAutoInline = true;
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
				extraPlugins: 'sourcedialog',
				allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
			});
			
			//Edit media and reveal content.
			$("#categoryHolder").prepend("<div id='conEdit' class='btn_edit_text' title='Edit Exercise Options'></div>");
			
			$("#conEdit").click(function(){
				updateExerciseDialog();
			}).tooltip();
		}
	}
	
	/**********************************************************************
    **Save Content Edit - save updated content text to content.xml
    **********************************************************************/
    function saveContentEdit(_data){
        var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
        var newCDATA=docu.createCDATASection(_data);
        $(data).find("page").eq(currentPage).find("content").first().empty();
        $(data).find("page").eq(currentPage).find("content").first().append(newCDATA);
        sendUpdate();
    };
    
    /**********************************************************************
    ** updateExerciseDialog -- Adds the exercise edit dialog to the screen.
    **********************************************************************/
    function updateExerciseDialog(){
	    try { $("#contentEditDialog").remove(); } catch (e) {}
	    
	    var msg = "<div id='contentEditDialog' title='Create Multiple Choice Question'>";
		//msg += "<label id='label'><b>no. of attempts: </b></label>";
		//msg += "<input type='text' name='myName' id='inputAttempts' value='"+ attemptsAllowed +"' class='dialogInput' style='width:35px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'><b>graded: </b></label>";
		msg += "<input id='isGraded' type='checkbox' name='graded' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'><b>cycle: </b></label>";
		msg += "<input id='isCycle' type='checkbox' name='cycle' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'><b>mandatory: </b></label>";
		msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'><b>randomize options: </b></label>";
		msg += "<input id='isRandom' type='checkbox' name='random' class='radio' value='true'/><br/><br/>";
		msg += "<label style='position: relative; float: left; vertical-align:middle; line-height:30px;'>exercise objective: </label>";
		msg += "<input type='text' name='myName' id='inputObjective' value='"+ myObjective +"' class='dialogInput' style='width: 440px;'/>";
		msg += "<label style='position: relative; float: left; vertical-align:middle; line-height:30px;'>module or lesson mapped (highest level): </label>";
		msg += "<input type='text' name='myName' id='inputObjItemId' value='"+ myObjItemId +"' class='dialogInput' style='width: 300px;'/><br/><br/>";
		msg += "<div id='questionEditMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Question Item Menu: </b></label></div><br/><br/>";
		msg += "<div id='questionContainer' class='templateAddItem' value='"+currentEditQuestionBankMember+"'></div>";
		msg += "<div id='answerEditMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Answer Item Menu: </b></label></div><br/><br/>";
		msg += "<div id='answerContainer' class='templateAddItem' value='"+currentEditAnswerBankMember+"'></div>";		
		//msg += "<div id='feedbackTypeGroup'>";
		//msg += "<label id='label'><b>feedback type: </b></label>";
		//msg += "<input id='standardized' type='radio' name='manageFeedbackType' value='standardized'>standardized  </input>";
		//msg += "<input id='undifferentiated' type='radio' name='manageFeedbackType' value='undifferentiated'>undifferentiated  </input>";
		//msg += "<input id='differentiated' type='radio' name='manageFeedbackType' value='differentiated'>differentiated  </input>";
		//msg += "</div>"
		
		//if(feedbackType == "undifferentiated"){
			//msg += "<div id='feedbackLabel'><b>Input your feedback:</b></div>";
			//msg += "<div id='feedbackEditText' type='text' contenteditable='true' class='dialogInput'>" + feedback + "</div><br/>";
		//}
		msg += "</div>";
		$("#stage").append(msg);
		
        if(!graded){
			$("#isGraded").removeAttr('checked');
		}else{
			$("#isGraded").attr('checked', 'checked');
		}
		
		if(!cycle){
			$("#isCycle").removeAttr('checked');
		}else{
			$("#isCycle").attr('checked', 'checked');
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
		
		updateQuestionEditMenu();
		updateAnswerEditMenu();
		addQuestion(currentEditQuestionBankMember, false);
		addAnswer(currentEditAnswerBankMember, false);
		
		//Style it to jQuery UI dialog
		$("#contentEditDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 800,
			height: 750,
			resizable: false,
			dialogClass: "no-close",
			close: function(){
				$("#contentEditDialog").remove();
			},
			buttons: {
				AddQuestion: function(){
					updateExerciseData();
					try { $("#questionContainer").empty(); } catch (e) {}
					addQuestion(question_arr.length, true);
					updateQuestionEditMenu();	
				},
				AddAnswer: function(){
					updateExerciseData();
					try { $("#answerContainer").empty(); } catch (e) {}
					addAnswer(answerCount, true);
					updateAnswerEditMenu();	
				},
				Done: function(){
					updateExerciseData();
					saveExerciseEdit();
					$( this ).dialog( "close" );
				}
			}
		});
    }
    
    function addQuestion(_addID, _isNew){
		var questionID = "question" + _addID;
		var questionLabel = parseInt(_addID) + 1;
		
		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("input your question here");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).find("content").append(option1CDATA);
			$(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct", "A");
			currentEditQuestionBankMember = _addID;
			optionCount++;
		}
		
		var myMatch = $(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct");
		
		var msg = "<div id='questionRemove' class='removeMedia' value='"+_addID+"' title='Click to remove question'/>";
			msg += "<span style='position:relative; float:left;'><b>Question "+questionLabel+":</b>";
			msg += "<label id='myMatch' style='position:relative;'>   <b>match: </b></label>";
			msg += "<input id='questionMatchText' class='dialogInput' type='text' value='"+myMatch+"' defaultValue='"+myMatch+"' style='width:30px;'/></span><br/>";
					
		var myQuestionContent = $(data).find("page").eq(currentPage).find("option").eq(_addID).find("content").text();	
			msg += "<div style='margin-top:10px;'><b>Question:</b></div>";
			msg += "<div id='questionContentText' class='dialogInput'>" + myQuestionContent + "</div>";
		$("#questionContainer").append(msg);
					
		$("#questionRemove").click(function(){
			removeQuestion();
		});
					
		CKEDITOR.replace( "questionContentText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			height: '50px',
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
			allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
		});
	}
	
	function addAnswer(_addID, _isNew){
		var answerID = "answer" + _addID;
		var answerLabel = parseInt(_addID) + 1;
		
		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<answer>"));
			var answer1 = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
			$(data).find("page").eq(currentPage).find("answer").eq(_addID).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var answer1CDATA = content1.createCDATASection("input your answer option");
			$(data).find("page").eq(currentPage).find("answer").eq(_addID).find("content").append(answer1CDATA);
			$(data).find("page").eq(currentPage).find("answer").eq(_addID).attr("correct", "A");
			currentEditAnswerBankMember = _addID;
			answerCount++;
		}
		
		var myMatch = $(data).find("page").eq(currentPage).find("answer").eq(_addID).attr("correct");
		
		var msg = "<div id='answerRemove' class='removeMedia' value='"+_addID+"' title='Click to remove question'/>";
			msg += "<span style='position:relative; float:left;'><b>Answer "+answerLabel+":</b>";
			msg += "<label id='myMatch' style='position:relative;'>   <b>match: </b></label>";
			msg += "<input id='answerMatchText' class='dialogInput' type='text' value='"+myMatch+"' defaultValue='"+myMatch+"' style='width:30px;'/></span><br/>";
					
		var myAnswerContent = $(data).find("page").eq(currentPage).find("answer").eq(_addID).find("content").text();	
			msg += "<div style='margin-top:10px;'><b>Answer:</b></div>";
			msg += "<div id='answerContentText' class='dialogInput'>" + myAnswerContent + "</div>";
		$("#answerContainer").append(msg);
					
		$("#answerRemove").click(function(){
			removeAnswer();
		});
					
		CKEDITOR.replace( "answerContentText", {
			toolbar: contentToolbar,
			height: '50px',
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
			allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
		});
	}
	
	function removeQuestion(){
		if($(data).find("page").eq(currentPage).find("option").length > 1){
			$(data).find("pages").eq(currentPage).find("option").eq(currentEditQuestionBankMember).remove();
			$("#questionContainer").empty();
			optionCount--;
			currentEditQuestionBankMember = 0;
			updateExerciseDialog()
		}else{
			alert("you must have at least one bank item.");
		}
	}
	
	function removeAnswer(){
		if(answerCount > 2){
			$(data).find("pages").eq(currentPage).find("answer").eq(currentEditAnswerBankMember).remove();
			$("#answerContainer").empty();
			answerCount--;
			currentEditAnswerBankMember = 0;
			updateExerciseDialog();
		}else{
			alert("you must have at least two answer items.");
		}
	}
	
    /**********************************************************************
    **updateExerciseData - save updated content text to content.xml
    **********************************************************************/
    function updateExerciseData(){
		myObjective = $("#inputObjective").val();
		myObjItemId = $("#inputObjItemId").val();
		
		$(data).find("page").eq(currentPage).attr('objective', myObjective);
		$(data).find("page").eq(currentPage).attr('objItemId', myObjItemId);
		
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
			randomize = true;
		}else{
			$(data).find("page").eq(currentPage).attr("randomize", "false");
			randomize = false;
		}
		
		if($("#isCycle").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("cycle", "true");
			cycle = true;
		}else{
			$(data).find("page").eq(currentPage).attr("cycle", "false");
			cycle = false;
		}
		
		var newQuestionContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
		var questionCDATA = newQuestionContent.createCDATASection(CKEDITOR.instances["questionContentText"].getData());
		$(data).find("page").eq(currentPage).find("option").eq(currentEditQuestionBankMember).find("content").empty();
		$(data).find("page").eq(currentPage).find("option").eq(currentEditQuestionBankMember).find("content").append(questionCDATA);
		$(data).find("page").eq(currentPage).find("option").eq(currentEditQuestionBankMember).attr("correct", $("#questionMatchText").val());
		
		var newAnswerContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
		var answerCDATA = newAnswerContent.createCDATASection(CKEDITOR.instances["answerContentText"].getData());
		$(data).find("page").eq(currentPage).find("answer").eq(currentEditAnswerBankMember).find("content").empty();
		$(data).find("page").eq(currentPage).find("answer").eq(currentEditAnswerBankMember).find("content").append(answerCDATA);
		$(data).find("page").eq(currentPage).find("answer").eq(currentEditAnswerBankMember).attr("correct", $("#answerMatchText").val());
	}
    
    function updateQuestionEditMenu(){
		$(".questionEditBankItem").remove();
		questionEditMenu_arr = [];
		var msg = "";
		for(var h = 0; h < $(data).find("page").eq(currentPage).find("option").length; h++){
			var label = parseInt(h + 1);
			var tmpID = "questionItem"+h;
			msg += "<div id='"+tmpID+"' class='questionBankItem questionEditBankItem";
			if(currentEditQuestionBankMember == h){
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
			msg += "' data-myID='" + h + "' title='" + cleanText + "'>" + label + "</div>";
			
			questionEditMenu_arr.push(tmpID);
		}
		
		$("#questionEditMenu").append(msg);
		
		for(var j = 0; j < questionEditMenu_arr.length; j++){
			if(currentEditQuestionBankMember != j){
				var tmpID = "#" + questionEditMenu_arr[j];
				$(tmpID).click(function(){
					updateExerciseData();
					$('#questionBankItem'+ currentEditQuestionBankMember).removeClass("selectedEditBankMember").addClass("unselectedEditBankMember");
					$(this).removeClass("unselectedEditBankMember").addClass("selectedEditBankMember");
					$("#contentEditDialog").remove();
					currentEditQuestionBankMember = $(this).attr("data-myID");
					console.log("currentEditQuestionBankMember = " + currentEditQuestionBankMember);
					updateExerciseDialog();
				}).tooltip();
			}
		}
	}
	
	function updateAnswerEditMenu(){
		answerEditMenu_arr = [];
		$(".answerEditBankItem").remove();
		var msg = "";
		for(var h = 0; h < answerCount; h++){
			var label = parseInt(h + 1);
			var tmpID = "answerItem"+h;
			msg += "<div id='"+tmpID+"' class='questionBankItem answerEditBankItem";
			if(currentEditAnswerBankMember == h){
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
			var cleanText = $(data).find("page").eq(currentPage).find("answer").eq(h).find("content").text().replace(/<\/?[^>]+(>|$)/g, "");//////////////////////Need to clean out html tags.....
			msg += "' data-myID='" + h + "' title='" + cleanText + "'>" + label + "</div>";
			
			answerEditMenu_arr.push(tmpID);
		}
		
		$("#answerEditMenu").append(msg);
		
		for(var j = 0; j < answerCount; j++){
			if(currentEditAnswerBankMember != j){
				var tmpID = "#" + answerEditMenu_arr[j];
				$(tmpID).click(function(){
					updateExerciseData();
					$('#bankItem'+ currentEditAnswerBankMember).removeClass("selectedEditBankMember").addClass("unselectedEditBankMember");
					$(this).removeClass("unselectedEditBankMember").addClass("selectedEditBankMember");
					$("#answerEditDialog").remove();
					currentEditAnswerBankMember = $(this).attr("data-myID");
					console.log("currentEditAnswerBankMember = " + currentEditAnswerBankMember);
					updateExerciseDialog();
				}).tooltip();
			}
		}
	}
	
	/**********************************************************************
	**Save Reveal Edit
	**********************************************************************/
	/**saveRevealEdit
	* Sends the updated content to node.
	*/
	function saveExerciseEdit(){
		var extraOption = $(data).find("page").eq(currentPage).find("option").length;
		var activeOption = optionCount;
		//var removed = extra - active;
		for(var i = extraOption + 1; i >= activeOption; i--){
			$(data).find("page").eq(currentPage).find("option").eq(i).remove();
		}
		
		var extraAnswer = $(data).find("page").eq(currentPage).find("answer").length;
		var activeAnswer = answerCount;
		
		//var removed = extra - active;
		for(var i = extraOption + 1; i >= activeOption; i--){
			$(data).find("page").eq(currentPage).find("answer").eq(i).remove();
		}
		sendUpdateWithRefresh();
		fadeComplete();
	};
    /*****************************************************************************************************************************************************************************************************************
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	END OF PAGE EDIT FUNCTIONALITY
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	
	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.destroySelf = function() {
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