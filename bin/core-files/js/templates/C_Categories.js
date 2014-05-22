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
    var maxConcurrentDisplay = 3;
    //var dropsMax = $(data).find("page").eq(currentPage).find("option").length;
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
    var myObjective = "undefined";
    var myObjItemId = "undefined";
	var order_arr = [];
	var question_arr = []
	var cycle = false;
	var currentQuestion = 0;
	var randomize = true;
    
    //Defines a public method - notice the difference between the private definition below.
	this.initialize= function(){
		if(transition == true){
			$('#stage').css({'opacity':0});
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
		
		buildTemplate();
	}
	
	function buildTemplate(){
		pageTitle = new C_PageTitle();
		
		var msg = '<div id="scrollableContent" class="antiscroll-wrap matching">';
		msg += '<div id="contentHolder" class="overthrow antiscroll-inner">';
		msg += '<div id="question" class="questionTop"></div>';
		msg += '<div id="categoryHolder" class="categoryHolder">';
		msg += '<div id="categoryOptionHolder" class="categoryOptionHolder"></div>';
		msg += '<div id="categoryAnswerHolder" class="categoryAnswerHolder">';
		msg += '<div id="categoryAnswerButtonsHolder" class="categoryAnswerButtonsHolder"></div>';
		msg += '</div></div></div></div>';
		
		audioHolder = new C_AudioHolder();
		
		$('#stage').append(msg);
		
		myContent = $(data).find("page").eq(currentPage).find('content').first().text();
		$("#question").append(myContent);
		
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()) + 5);
		$("#categoryHolder").height($("#contentHolder").height() - $("#categoryHolder").position().top - 5);
		
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
			questionIterator++;
		});
		
		if(randomize == true){
			question_arr = shuffleArray(question_arr);
		}
		
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
			TweenMax.to($("#stage"), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:placeQuestion, onCompleteParams:[currentQuestion] });
		}else{
			placeQuestion(currentQuestion);
		}
	}
	
	function placeQuestion(_id){
		var myCorrect = question_arr[_id].match;
		var myLabel = question_arr[_id].content;
		$("#categoryOptionHolder").append("<div id='categoryOptionItem' class='categoryOptionItem' value='" + myCorrect + "'>"+myLabel+"</div>");
		$("#categoryOptionItem").css({'top': ($("#categoryOptionHolder").height() - $("#categoryOptionItem").height())/2, 'transform':'scale(.1)', '-webkit-transform': 'scale(.1)', '-ms-transform':'scale(.1)', 'opacity': '0'});
		TweenMax.to($("#categoryOptionItem"), 1, {css:{scaleX:1, scaleY:1, opacity: 1}});
		enableAnswerButtons();
	}
	
	function placeAnswer(_id){
		var myCorrect = $(data).find("page").eq(currentPage).find("answer").eq(_id).attr("correct");
		var myLabel = $(data).find("page").eq(currentPage).find("answer").eq(_id).find("content").text();
		$("#categoryAnswerButtonsHolder").append("<div id='" + _id + "' class='categoryAnswerItem' value='" + myCorrect + "'>"+myLabel+"</div>");
		$("#"+_id).button().click(function(){
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
		question_arr[currentQuestion].attempt = _selection.attr("value");
		if(_selection.attr("value") == $("#categoryOptionItem").attr("value")){
			question_arr[currentQuestion].complete = true;
			question_arr[currentQuestion].correct = true;
			_selection.addClass("categoryCorrect");
			$("#displayResult").addClass("categoryDisplayCorrect");
		}else{
			question_arr[currentQuestion].correct = false;
			_selection.addClass("categoryIncorrect");
			$("#displayResult").addClass("categoryDisplayIncorrect");
		}
		TweenMax.to($("#displayResult"), .5, {css:{opacity: 1}, ease:transitionType});
		TweenMax.to($("#categoryOptionItem"), 2, {css:{scaleX:4, scaleY:4, opacity: 0}, ease:transitionType, onComplete:fadeDisplayResult, onCompleteParams:[_selection]});
	}
		
	function fadeDisplayResult(_selection){
		$("#categoryOptionItem").remove();
		TweenMax.to($("#displayResult"), .5, {css:{opacity: 0}, ease:transitionType, onComplete:removeDisplayResult, onCompleteParams:[_selection]});
	}
	
	function removeDisplayResult(_selection){
		$("#displayResult").remove();
		try { _selection.removeClass("categoryCorrect");} catch (e) {}
		try { _selection.removeClass("categoryIncorrect");} catch (e) {}
		currentQuestion++;
		if(currentQuestion == question_arr.length){
			if(cycle == false){
				doPageCompleteNoCycle();
			}
		}else{
			placeQuestion(currentQuestion);
		}
	}
	
	function doPageCompleteNoCycle(){
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
		msg += "</div>";
		$("#question").remove();
		$("#categoryOptionHolder").remove();
		$("#categoryAnswerHolder").remove();
		$("#categoryHolder").remove();
		$("#contentHolder").append(msg);
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