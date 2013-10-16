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
function C_MultipleChoice(_myType) {

    var myPageTitle;//Title of this page.
    var myContent;//Body
    var optionHolderY = 0;
    var optionStartX = 0;
    var mcSubmitButtonY = 0;
    var attemptsAllowed = 2;
    var attemptsMade = 0;
    var optionLabeling = "a"; //"a" for alphabetic - "n" for numeric
    var myType = _myType; //Other options are trueFalse,  multipleSelect
    var option_arr = [];
    var feedbackType;
    var feedbackDisplay;
    var feedbackCorrectTitle;
    var feedbackIncorrectTitle;
    var feedbackIncorrectAttempt;
    var feedback;
    var iconClicked = false;
    var conHeight;
    
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
		
		$('#stage').append('<div id="pageTitle"></div>');
		$('#stage').append('<div id="question" class="questionTop"></div>');
		$('#stage').append('<div id="answerOptions"></div>');
		$("#myCanvas").append("<div id='mcSubmit'></div>");
		
		
		
		optionCount = $(data).find("page").eq(currentPage).find("option").length;
		
		//Set Page Title		
		myPageTitle = $(data).find("page").eq(currentPage).find('title').text();
		$("#pageTitle").append(myPageTitle);
		
		//Set Question
		myContent = $(data).find("page").eq(currentPage).find('question').text();
		$("#question").append(myContent);
		
		//Figure out the question height to properly place the options
		 $("#body").append("<div id='testTop' class='testTop'></div>");
           $("#testTop").append(myContent);
           conHeight = $("#testTop").height();
           $("#testTop").remove();
           
           optionHolderY = $("#question").position().top + $("#question").height() + 50;
		
		$("#answerOptions").css({'position':'absolute', 'top':optionHolderY});
		
		//Place each option within the container $('#options') - this allows for easier cleanup, control and tracking.
		var iterator = 0;
		var optionY = 0;
		
		if(myType == "multipleChoice"){
			$('#answerOptions').append('<div id="answer" class="radioSelector">');
		}else if (myType == "multipleSelect"){
			$('#answerOptions').append('<div id="answer" class="checkBox">');
		}else if (myType == "trueFalse"){
			$("#answerOption").append("<div id='answer' class='trueFalse'>");
		}
		
		//find every option in the xml - place them on the screen.
		$(data).find("page").eq(currentPage).find("option").each(function()
		{	
			//Create unique class name for each option
			var myOption = "option" + iterator;
			//Create each option as a div.
			var myLabel = String.fromCharCode(iterator % 26 + 65);

			if(myType == "multipleChoice"){
				$('#answer').append('<div class="option" id="' + myOption + '"><input id="' + myOption + 'Check" type="radio" name=' + myType + '" class="radio" value="' + $(this).attr("correct")+ '"/><label id="label">'+ myLabel + '. ' +$(this).text() +'</label></div>');
			}else{
				$('#answer').append('<div class="option" id="' + myOption + '"><input id="' + myOption + 'Check" type="checkbox" name=' + myType + '" class="radio" value="' + $(this).attr("correct")+ '"/><label id="label">'+ myLabel + '. ' +$(this).text() +'</label></div>');
			}
			//Position each option with css
			$("#"+myOption).css({'position':'absolute', 'top':optionY});
			
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
				
				if(myType == "multipleChoice"){
					$(this).find('input').prop('checked', true);
					for(var i=0; i<option_arr.length; i++){
						if(option_arr[i].hasClass("optionSelected") ){
							option_arr[i].removeClass("optionSelected");
						}
					}
					$(this).addClass("optionSelected");
				}else if(myType == "multipleSelect"){
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
		$("#answerOptions").append("</div>");
		
		$("#mcSubmit").button({ label: $(data).find("page").eq(currentPage).attr("btnText"), disabled: true });
		$("#mcSubmit").click(checkAnswer);
		
		if(transition == true){
			TweenMax.to($("#stage"), transitionLength, {css:{opacity:1}, ease:Power2.easeIn, onComplete:checkMode});
		}
	}
	
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
		attemptsMade++;
		if(myType == "multipleChoice"){
			var selected = $("#answer input[type='radio']:checked");
			if(selected.val() == "true"){
				tempCorrect = true;
			}else{
				tempCorrect = false;
			}
		}else if (myType == "multipleSelect"){
			var tempCorrect = true;
			
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
			if(tempCorrect == true){
				msg = '<div id="dialog-attemptResponse" class="correct" title="'+ feedbackCorrectTitle +'"><p>'+feedbackCorrectTitle +'</p><p> '+ feedback +'</p></div>';	
				//update scoring.
						if(scored == true){
							//Gather the selected answers if scored. ///////////////ADDED for scoring 08/12/13 PD
							var selected_arr = [];
							for(var i = 0; i < option_arr.length; i++){
								if(option_arr[i].find("input").prop("checked") == true){
									selected_arr.push(i);
								}	
							}
							
							updateScoring(selected_arr, tempCorrect);
							mandatoryInteraction = false;
							checkNavButtons();
							showUserAnswer();
						}
			}else{
				if(attemptsMade == attemptsAllowed){
					//update scoring.
						if(scored == true){
							//Gather the selected answers if scored. ///////////////ADDED for scoring 08/12/13 PD
							var selected_arr = [];
							for(var i = 0; i < option_arr.length; i++){
								if(option_arr[i].find("input").prop("checked") == true){
									selected_arr.push(i);
								}	
							}
							updateScoring(selected_arr, tempCorrect);
							mandatoryInteraction = false;
							checkNavButtons();
							showUserAnswer();						}
					//incorrect feedback here
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectTitle +'</p><p> '+ feedback +'</p></div>';
				}else{
					//try again.
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectAttempt +'</p></div>';	
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
					Proceed: function(){
						$( this ).dialog( "close" );
						$("#dialog-attemptResponse").remove();
						if(isLinear == true){
							updateTracking();
						}				
						$("#next").click();
					}}
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
					}}
				});
			}
		}else if(feedbackDisplay == "inline"){
			
		}
	}
	
	function checkMode(){
		if(mode == "edit"){
			/*******************************************************
			* Edit Title
			********************************************************/
                //Add and style titleEdit button
			 $('#stage').append("<div id='titleEdit' class='btn_edit_text' title='Edit Title'></div>");
			 $("#titleEdit").css({'position':'absolute', 'top':$("#pageTitle").position().top - 18, 'left': $("#pageTitle").position().left + $("#pageTitle").width() - 18});
			 //Add title Edit functionality
			 $("#titleEdit").click(function(){
                	//Create the Dialog
			 	$("#stage").append("<div id='titleDialog' title='Input Page Title'><div id='titleEditText' type='text'>" + myPageTitle + "</div></div>");
			 	//Style it to jQuery UI dialog
			 	$("#titleDialog").dialog({
                    	autoOpen: true,
					modal: true,
					width: 550,
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: saveTitleEdit
				});

				$("#titleEditText").redactor({
                    	focus: true,
					buttons: ['bold', 'italic', 'underline', 'deleted', '|', 'fontcolor', 'backcolor']
				});
			}).tooltip();
			
			
			/*******************************************************
			* Edit Question
			********************************************************/
               //Add and style titleEdit button
			$('#stage').append("<div id='questionEdit' class='btn_edit_text' title='Edit Text Question'></div>");
			
			
			$("#questionEdit").css({'position':'absolute', 'top':$("#question").position().top - 18, 'left': $("#question").position().left + $("#question").width() - 18});

			$("#questionEditText").redactor({
				focus: true,
				buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
			});
			
			$("#questionEdit").click(function(){
				
				
				
               	//Create the Content Edit Dialog
				$("#stage").append("<div id='questionEditDialog' title='Create Multiple Choice Question'><label id='label'>no. of attempts: </label><input type='text' name='myName' id='inputAttempts' value='"+ attemptsAllowed +"' class='regText text ui-widget-content ui-corner-all' style='width:35px;'/><br/><br/><div id='questionLabel'>Input your question:</div><div id='questionEditText' type='text'  >" + myContent + "</div><br/><br/><div id='feedbackLabel'>Input your feedback:</div><div id='feedbackEditText' type='text'  >" + feedback + "</div><br/><br/>");
				
				$("#questionEditText").redactor({
					buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
				});
				
				$("#feedbackEditText").redactor({
					buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
				});
				
				//find every option in the xml - place them on the screen.
				for (var i = 0; i < optionCount; i++){
					var optionID = "option" + i;
					var optionLabel = i + 1;
					
					var optionContent = $(data).find("page").eq(currentPage).find("option").eq(i).text();				
					$("#questionEditDialog").append("<div id='"+optionID+"Input'>Option " + optionLabel + ":</div> <div id='"+optionID+"Text'>" + optionContent + "</div>");
					
					if($(data).find("page").eq(currentPage).find("option").eq(i).attr("correct") == "true"){
						$("#questionEditDialog").append("<label id='label'>correct option: </label><input id='"+optionID + "Correct' type='checkbox' checked='checked' name='correct' class='radio' value='true'/><br/><br/>");
					}else{
						$("#questionEditDialog").append("<label id='label'>correct option: </label><input id='"+optionID + "Correct' type='checkbox' name='correct' class='radio' value='true'/><br/><br/>");
					}
					
					$("#"+optionID+"Text").redactor({
						buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
					});
											
					optionEdit_arr.push(optionID);
				};
				
				
				//Style it to jQuery UI dialog
				$("#questionEditDialog").dialog({
					autoOpen: true,
					modal: true,
					width: 800,
					height: 650,
					buttons: {
						Add: function(){
							
							var optionID = "option" + optionCount;
							var optionLabel = optionCount + 1;
							
							var myOptionContent = "Input Option";
							$("#questionEditDialog").append("<div id='"+optionID+"Front'>Option " + optionLabel + " Text:</div> <div id='"+optionID+"Text'>" + myOptionContent + "</div><label id='label'>correct option:</label><input id='"+optionID + "Correct' type='checkbox' name='correct' class='radio' value='true'/><br/>");
							
							$("#"+optionID+"Text").redactor({
								buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
							});
							
							$(data).find("page").eq(currentPage).append($("<option>"));
							var option= new DOMParser().parseFromString('<option></option>',  "text/xml");
							var optionCDATA = option.createCDATASection("Input Option");
							$(data).find("page").eq(currentPage).find("option").eq(optionCount).append(optionCDATA);
								
							optionCount++;
							optionEdit_arr.push(optionID);	
						},
						Save: function(){
							$( this ).dialog( "close" );
						}
					},
					close: saveQuestionEdit
				});
			}).tooltip();
		}
	}
	
	/**********************************************************************
     **Save Title Edit - save updated page title text to content.xml
     **********************************************************************/
	function saveTitleEdit(){
        var titleUpdate = $("#titleEditText").getCode().replace('<p>', '').replace('</p>', '');;
	   	var docu = new DOMParser().parseFromString('<title></title>',  "application/xml");
	   	var newCDATA=docu.createCDATASection(titleUpdate);
	   	$("#pageTitle").html(titleUpdate);
	   	myPageTitle = titleUpdate;
	   	$("#titleEditText").destroyEditor();
	   	$(data).find("page").eq(currentPage).find("title").empty();
	   	$(data).find("page").eq(currentPage).find("title").append(newCDATA);
	   	$("#titleDialog").remove();
	   	sendUpdateWithRefresh();
	};	
	function saveQuestionEdit(){
		
		//Grab the updated text from redactor.
		var questionUpdate = $("#questionEditText").getCode();
		//We create an xml doc - add the contentUpdate into a CDATA Section
		var docu = new DOMParser().parseFromString('<question></question>',  "application/xml")
		var newCDATA=docu.createCDATASection(questionUpdate);
		//Now, destroy redactor.
		$("#question").html($("#questionEditText").html());
		$("#questionEditText").destroyEditor();
		
		var feedbackUpdate = $("#feedbackEditText").getCode();
		var feedDoc = new DOMParser().parseFromString('<feedback></feedback>', 'application/xml');
		var feedCDATA = feedDoc.createCDATASection(feedbackUpdate);
		$("#feedbackEditText").destroyEditor();
		//Update the local xml - first clearning the content node and then updating it with out newCDATA
		$(data).find("page").eq(currentPage).find("question").empty();
		$(data).find("page").eq(currentPage).find("question").append(newCDATA);
		$(data).find("page").eq(currentPage).find("feedback").empty();
		$(data).find("page").eq(currentPage).find("feedback").append(feedCDATA);
		$(data).find("page").eq(currentPage).attr("attempt", $("#inputAttempts").val());
		var correctOptions = 0;
		for(var i = 0; i < optionEdit_arr.length; i++){
			var optionText = $("#"+optionEdit_arr[i]+"Text").getCode();
			var optionCorrect = $("#"+optionEdit_arr[i]+"Correct").prop("checked");
			var newOption = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var optionCDATA = newOption.createCDATASection(optionText);
			$(data).find("page").eq(currentPage).find("option").eq(i).empty();
			$(data).find("page").eq(currentPage).find("option").eq(i).append(optionCDATA);
			$(data).find("page").eq(currentPage).find("option").eq(i).attr("correct", optionCorrect);
			
			$("#"+optionEdit_arr[i]+"Text").destroyEditor();
			
			if(optionCorrect == true){
				correctOptions++;
			}
		}
		
		if(correctOptions > 1){
			$(data).find("page").eq(currentPage).attr("layout", "multipleSelect");
		}else{
			$(data).find("page").eq(currentPage).attr("layout", "multipleChoice");
		}

		$("#questionEditDialog").remove();
		sendUpdate();
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
    
    function fadeComplete(){
	    $('#pageTitle').remove();
	    $('#question').remove();
	    $('#answerOptions').remove();
	    $("#mcSubmit").remove();
	    if(mode == "edit"){
		    $("#titleEdit").remove();
		    $("#questionEdit").remove();
		    $("#titleEditDialog").remove();
		    $("#questionEditDialog").remove();
	    }
	    loadPage();
    }

}