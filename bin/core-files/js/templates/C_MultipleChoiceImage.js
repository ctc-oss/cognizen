/*!
 * C_MultipleChoiceImage
 * This class creates a template for multipleChoice type questions.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2013-6-05
 * JavaScript
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
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
function C_MultipleChoiceImage(_type) {

    // var myPageTitle;//Title of this page.
    // var myContent;//Body
    var optionHolderY = 0;
    var optionStartX = 0;
    var mcSubmitButtonY = 0;
    var attemptsAllowed = 2;
    var attemptsMade = 0;
    var optionLabeling = "a"; //"a" for alphabetic - "n" for numeric
    var type = _type; //Other options are trueFalse,  multipleSelect
    var option_arr = [];
    var feedbackType;
    var feedbackDisplay;
    var feedbackCorrectTitle;
    var feedbackIncorrectTitle;
    var feedbackIncorrectAttempt;
    var feedback;
    
    //Defines a public method - notice the difference between the private definition below.
	this.initialize= function(){
		buildTemplate();
	}
		
	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		//Discern feedback info
		feedbackType = $(data).find("page").eq(currentPage).attr('feedbackType');
		feedbackDisplay = $(data).find("page").eq(currentPage).attr('feedbackDisplay');
		feedbackCorrectTitle = $(data).find("page").eq(currentPage).find('correctResponse').text();
		feedbackIncorrectTitle = $(data).find("page").eq(currentPage).find('incorrectResponse').text();
		feedbackIncorrectAttempt = $(data).find("page").eq(currentPage).find('attemptResponse').text();
		feedback = $(data).find("page").eq(currentPage).find('feedback').text();
		
		$('#stage').append('<div id="pageTitle"></div>');
		$('#stage').append('<div id="question"></div>');
		
		$("#myCanvas").append("<div id='mcSubmit'></div>");
		
		if(type == "multipleChoiceImageTop" || type == "multipleSelectImageTop"){
			$("#question").addClass("questionTop");
		}else if(type == "multipleChoiceImageLeft"){
			$("#question").addClass("questionLeft");
		}else if (type == "multipleChoiceImageRight"){
			$("#question").addClass("questionRight");
		}
		
		
		//Set Page Title		
		myPageTitle = $(data).find("page").eq(currentPage).find('title').text();
		$("#pageTitle").append(myPageTitle);
		
		//Set Question
		myContent = $(data).find("page").eq(currentPage).find('question').text();
		$("#question").append(myContent);
		
		//Fade page in - questions have multiple fades - first title and question - then options - looks cool but is also 
		//needed to properly postion the options...  Some questions are longer than others... Question height registers as
		//zero if invisible...
		if(transition == true){
			// fade stage in
       		$('#stage').velocity({
       			opacity: 1
       		}, {
       			duration: transitionLength,
       			complete: placeOptions
       		});
		}
	}
	
	
	var selected = [];
	var retry = false;
	
	function placeOptions(){
		$('#stage').append('<div id="answerOptionsImage"></div>');
		//Place the options container.
		optionHolderY = $("#question").position().top + $("#question").height() + 50;
		
		if(transition == true){
			$("#answerOptionsImage").css({'opacity': 0});
		}
		
		//Place each option within the container $('#options') - this allows for easier cleanup, control and tracking.
		var iterator = 0;
		var optionY = 0;
		var horPos = 0;
		var verPos = 0;
		
		//$('#answerOptionsImage').append('<div id="answer" class=""></div>');
		
		//find every option in the xml - place them on the screen.
		for(var i=0; i < $(data).find("page").eq(currentPage).find("option").length; i++){	
			var currentImg = $(data).find("page").eq(currentPage).find("option").eq(i).attr("imgStyle");
			var currentAlt = $(data).find("page").eq(currentPage).find("option").eq(i).attr("alt");
			var currentStyle = $(data).find("page").eq(currentPage).find("option").eq(i).attr("style");
			var myContent = $(data).find("page").eq(currentPage).find("option").eq(i).text();
			
			//Create unique class name for each option
			var myOption = "option" + iterator;
			//Create each option as a div.
			var myLabel = String.fromCharCode(iterator % 26 + 65);
			
			$("#answerOptionsImage").append("<div id='"+myOption+"' class='multipleChoiceOptionImage' style='"+ currentStyle+"'><div id='"+ myOption + "Img' class='optionImage' style='"+ currentImg+"'/><div id='"+myOption+"Label' class='multipleChoiceImageLabel'>"+ myContent +"</div></div>");
			
			//Position each option with css
			
			if(type == "multipleChoiceImageTop" || type == "multipleSelectImageTop"){
				$("#"+myOption).css({'position':'absolute', 'left':horPos});
			}else if(type == "multipleChoiceImageLeft" || type == "multipleChoiceImageRight"){
				$("#"+myOption).css({'position':'absolute', 'top':verPos});
			}
			//Add button click action to each option
			$('#' + myOption).click( function(){
				if(type == "multipleChoiceImageTop"){
					selected.push($(this));
					checkAnswer();
				}else if (type == "multipleSelectImageTop"){
					if($(this).data("selected") == "false"){
						$(this).data("selected", "true");
						selected.push($(this));
						$(this).unbind('mouseenter mouseleave');
					}else{
						$(this).data("selected", "false");
						$(this).hover(function(){
								$(this).addClass("multipleChoiceImageHover");
							},
							function(){
								$(this).removeClass("multipleChoiceImageHover")
							});
						var itemtoRemove = $(this);
						selected.splice($.inArray(itemtoRemove, selected),1);
					}
					if(selected.length > 0){
						$("#mcSubmit").button({ disabled: false });
					}else{
						$("#mcSubmit").button({ disabled: true });
					}
				}
			}).hover(function(){
					$(this).addClass("multipleChoiceImageHover");
				},
				function(){
					$(this).removeClass("multipleChoiceImageHover")
				});
			
			$("#" + myOption).data("correct", $(data).find("page").eq(currentPage).find("option").eq(i).attr("correct"));
			$("#" + myOption).data("selected", "false");
			
			//iterate the iterators...
			horPos += $("#" + myOption).width() + 40;
			verPos += $("#" + myOption).height() + 20;
			iterator++;
			option_arr.push($('#' + myOption));
			
		}
		
		if(type == "multipleChoiceImageTop" || type == "multipleSelectImageTop"){
			$("#answerOptionsImage").css({'position':'absolute', 'top':optionHolderY, 'left': ($("#stage").width() - horPos)/2});
		}else if (type == "multipleChoiceImageLeft"){
			$("#answerOptionsImage").css({'position':'absolute', 'top': 10, 'left': 600});
		}else if (type == "multipleSelectImageRight"){
			$("#answerOptionsImage").css({'position':'absolute', 'top':optionHolderY});
		}
		
		if(type == "multipleSelectImageTop"){
			placemcSubmit();
		}
		if(transition == true){
       		$('#answerOptionsImage').velocity({
       			opacity: 1
       		}, {
       			duration: transitionLength
       		});
		}
	}
	
	function placemcSubmit(){
		$("#mcSubmit").button({ label: $(data).find("page").eq(currentPage).attr("btnText"), disabled: true });
		$("#mcSubmit").click(checkAnswer);
	}
	
	var marking_arr;
	function checkAnswer(){
		//////////////////////////CHECK CORRECT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		attemptsMade++;
		var tempCorrect = true;
		marking_arr = [];
		if(type == "multipleChoiceImageTop" || type == "multipleChoiceImageLeft" || type == "multipleChoiceImageRight"){
			var markingObject = new Object();
			if(selected[0].data("correct") == "true"){
				tempCorrect = true;
				markingObject.isCorrect = true;
			}else{
				tempCorrect = false;
				markingObject.isCorrect = false;
			}
			markingObject.myObject = selected[0];
			marking_arr.push(markingObject);
			
			if(tempCorrect == false){
				var correctObject = new Object();
				for(var i = 0; i < option_arr.length; i++){
					if(option_arr[i].data("correct") == "true"){
						correctObject.isCorrect = true;
						correctObject.myObject = option_arr[i];
						marking_arr.push(correctObject);
					}
				}
			}
		}else if (type == "multipleSelectImageTop"){
			
			for( var i = 0; i < option_arr.length; i++){
				if(option_arr[i].data("selected") != option_arr[i].data("correct")){
					tempCorrect = false;
				}
			}
			
			for(var i = 0; i < option_arr.length; i++){
				var markingObject = new Object();
				if(option_arr[i].data("correct") == "true"){
					markingObject.isCorrect = true;
				}else{
					markingObject.isCorrect = false;
				}
				markingObject.myObject = option_arr[i];
				marking_arr.push(markingObject);
			}
		}
		
		if(tempCorrect == true || attemptsMade == attemptsAllowed){
			for(var i=0; i<marking_arr.length; i++){
				if(marking_arr[i].isCorrect == false){
					marking_arr[i].myObject.append("<div id='myMark' class='markMCImageWrong'></div>");
				}else{
					marking_arr[i].myObject.append("<div id='myMark' class='markMCImageCorrect'></div>");
				}
			}
		}
		
		//////////////////////////FEEDBACK\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		var msg = "";
		
		if(feedbackType == 'undifferentiated'){
			if(tempCorrect == true){
				msg = '<div id="dialog-attemptResponse" class="correct" title="'+ feedbackCorrectTitle +'"><p>'+feedbackCorrectTitle +'</p><p> '+ feedback +'</p></div>';
			}else{
				if(attemptsMade == attemptsAllowed){
					//incorrect feedback here
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectTitle +'</p><p> '+ feedback +'</p></div>';
				}else{
					//try again.
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectAttempt+'</p></div>';	
				}
			}
		}else if(feedbackType == 'differentiated'){
			if(tempCorrect == true){
				msg = '<div id="dialog-attemptResponse" class="correct" title="That is Correct."></div>';
			}else{
				
			}
		}else if(feedbackType == 'standardized'){
			if(tempCorrect == true){
				msg = '<div id="dialog-attemptResponse" class="correct" title="That is Correct."></div>';
			}else{
				
			}
		}
		
		$("#stage").append(msg);
		
		if(feedbackDisplay == "pop"){
			if(tempCorrect == true || attemptsMade == attemptsAllowed){
				$( "#dialog-attemptResponse" ).dialog({
					modal: true,
					width: 550,
					close: function(){
						for(var i = 0; i < option_arr.length; i++){
							option_arr[i].unbind('mouseenter mouseleave click');
						}
						
						for(var i = 0; i < selected.length; i++){
							selected[i].addClass("multipleChoiceImageHover");
						}
						$("#dialog-attemptResponse").remove();
					},
					buttons: {
						Close: function(){
							$( this ).dialog( "close" );
						},
						Proceed: function(){
							$( this ).dialog( "close" );
							$("#next").click();
						}
					}
				});
			}else{
				$( "#dialog-attemptResponse" ).dialog({
					modal: true,
					width: 550,
					close: function(){
						selected = [];
						if(type == "multipleChoiceImageTop"){
							for(var i = 0; i < option_arr.length; i++){
								option_arr[i].data("selected", "false");
							}
						}
						$("#dialog-attemptResponse").remove();
					},
					buttons: {
						OK: function(){
							$( this ).dialog( "close" );
						}
					}
				});
			}
		}else if(feedbackDisplay == "inline"){
			
		}
	}
	
	this.destroySelf = function() {
		// fade stage out
		$('#stage').velocity({
			opacity: 0
		}, {
			duration: transitionLength,
			complete: fadeComplete()
		});
    }
    // fadeComplete() moved to C_UtilFunctions.js

}