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

    var myPageTitle;//Title of this page.
    var myContent;//Body
    var optionHolderY = 0;
    var answerHolderY = 0;
    var optionStartX = 0;
    var matchingSubmitButtonY = 0;
    var attemptsAllowed = 2;
    var attemptsMade = 0;
    var optionLabeling = "a"; //"a" for alphabetic - "n" for numeric
    var type = _type; //Other options are -----------------------------------------------------------------ARE TO BE DEFINED
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
    
    var optionStatementY = 0;
    var optionAnswerY = 0;
    
    
    //Defines a public method - notice the difference between the private definition below.
	this.initialize= function(){
		buildTemplate();
	}
		
	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		feedbackType = $(data).find("page").eq(currentPage).attr('feedbackType');
		feedbackDisplay = $(data).find("page").eq(currentPage).attr('feedbackDisplay');
		feedbackCorrectTitle = $(data).find("page").eq(currentPage).find('correctresponse').text();
		feedbackIncorrectTitle = $(data).find("page").eq(currentPage).find('incorrectresponse').text();
		feedbackIncorrectAttempt = $(data).find("page").eq(currentPage).find('attemptresponse').text();
		feedback = $(data).find("page").eq(currentPage).find('feedback').text();
		
		$('#stage').append('<div id="pageTitle"></div>');
		$('#stage').append('<div id="question" class="questionTop"></div>');
		$("#stage").append('<div id="matchingAnswers"></div>');
		$('#stage').append('<div id="matchingOptions"></div>');
		$("#myCanvas").append("<div id='matchingSubmit'></div>");
		
		if(type == "matching"){
			$("#matchingOptions").addClass("matchingOptions");
			$("#matchingAnswers").addClass("matchingAnswers");
		}else if(type == "matchingDrag"){
			$("#matchingOptions").addClass("matchingDragImgOptions");
			$("#matchingAnswers").addClass("matchingDragImgAnswers");
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
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:Power2.easeIn, onComplete:placeOptions});
		}
	}
	
	
	
	function placeOptions(){
		//Place the options container.
		optionHolderY = $("#question").position().top + $("#question").height() + 10;
		
		$("#matchingOptions").css({'position':'absolute', 'top':optionHolderY});
		$("#matchingAnswers").css({'position':'absolute', 'top':optionHolderY});
		if(transition == true){
			$("#matchingOptions").css({'opacity': 0});
			$("#matchingAnswers").css({'opacity': 0});
		}
		
		//Place each option within the container $('#options') - this allows for easier cleanup, control and tracking.
		var iterator = 0;
		
		var randomOrderLength = $(data).find("page").eq(currentPage).find("answer").length;

		//find every option in the xml - place them on the screen.
		$(data).find("page").eq(currentPage).find("option").each(function()
		{	
			//Create unique class name for each option
			var myOption = "option" + iterator;
			//Create each option as a div.
						
			var matchString = "<div class='matchingStatement' id="+ myOption + ">";
			//Add text input field if regular matching
			if (type == "matching"){
				matchString += "<input type='text' maxlength='1' id='myInput' class='matchingInput' />"+ "  <div class='matchingText'>";
			}
			
			matchString += $(this).text() + "</div></div>"; 
			
			$("#matchingOptions").append(matchString);
			$("#"+myOption).data("myMatch", $(this).attr("correct"));
						
			//Position each option with css
			$("#"+myOption).css({'position':'absolute', 'top':optionStatementY});
			
			
			//Add button click action to each option
			
			
			
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
		$("#matchingOptions").append("</div>");
		
		iterator = 0;
		
		//find every answer or drop spot in the xml - place them on the screen.
		$(data).find("page").eq(currentPage).find("answer").each(function(){
			var myAnswer = "answer" + iterator;
			var myImg = $(this).attr("img");
			var myLabel = String.fromCharCode(iterator % 26 + 65);
			
			if(type == "matching" || myImg == undefined){
				$("#matchingAnswers").append("<div class='matchingAnswer' id="+ myAnswer + ">"  + myLabel + ". " + $(this).text() + "</div>");
			}else if(type == "matchingDrag"){
				$("#matchingAnswers").append("<div class='matchingAnswer' id="+ myAnswer + "><img width='"+$(this).attr("w") +"' height='"+ $(this).attr("h") +"' src='"  + myImg + "'></img></div>");
				$('#' + myAnswer).droppable({
					activeClass: "ui-state-hover",
					hoverClass: "ui-state-active",
					start: function(event, ui){
						TweenMax.to(ui.draggable, 1, {css:{scaleX:2, scaleY:2}, ease:Bounce.easeOut, duration: 0.5});
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
			
			$("#"+myAnswer).data("matchID", $(this).attr("correct"));
			$("#"+myAnswer).css({'position':'absolute', 'top':optionAnswerY});
			
			optionAnswerY += $("#"+myAnswer).height() + 20;	
			iterator++;
			answer_arr.push($('#' + myAnswer));
		});
		$("#matchingAnswers").append("</div>");
		
		
		if(transition == true){
			TweenMax.to([$("#matchingOptions"), $("#matchingAnswers")], transitionLength, {css:{opacity:1}, ease:Power2.easeIn, onComplete:placematchingSubmit});
		}
	}
	
	var matchingSubmitButtonY;
	
	function placematchingSubmit(){
		if(type == "matching"){
			$("#matchingSubmit").button({ label: $(data).find("page").eq(currentPage).attr("btnText")/*, disabled: true*/ });
			$("#matchingSubmit").click(checkAnswer);
		}
		
		checkMode();
	}
	
	var marking_arr;
	
	function checkAnswer(){
		//////////////////////////CHECK IF CORRECT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		$("#dialog-attemptResponse").remove();
		attemptsMade++;
		var tempCorrect = true;
		marking_arr = [];
		/*check for regular matching*/
		if(type == "matching"){
			for(var i=0; i < option_arr.length; i++){
				var markingObject = new Object();
				
				if(option_arr[i].data("myMatch") != option_arr[i].find($('input[id=myInput]')).val().toUpperCase()){
					tempCorrect = false;
					markingObject.isCorrect = false;		
				}else{
					markingObject.isCorrect = true;
				}
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
				marking_arr.push(markingObject);
			}
		}
		
		//Show markings - green check - red x
		if(tempCorrect == true || attemptsMade == attemptsAllowed){
			for(var i=0; i<marking_arr.length; i++){
				if(marking_arr[i].isCorrect == false){
					marking_arr[i].myDrop.append("<div id='myMark' class='markWrong'></div>");
				}else{
					marking_arr[i].myDrop.append("<div id='myMark' class='markCorrect'></div>");
				}
			}
		}
		
		/************************************
		POPULATE FEEDBACK STRING
		************************************/
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
		
		
		/************************************
		PLACE THE FEEDBACK
		************************************/
		
		$("#stage").append(msg);
		//all mobile content will use the pop display
		if(windowWidth <= mobileWidth){
			feedbackDisplay = "pop";
		}
		if(feedbackDisplay == "pop"){
			if(tempCorrect == true || attemptsMade == attemptsAllowed){
				$( "#dialog-attemptResponse" ).dialog({
					modal: true,
					width: 550,
					dialogClass: "no-close",
					close: function(event, ui){
						$("#dialog-attemptResponse").remove();
					},
					buttons: {
						Close: function(){
							$( this ).dialog( "close" );
							$("#dialog-attemptResponse").remove();
						},
						Proceed: function(){
							$( this ).dialog( "close" );
							$("#dialog-attemptResponse").remove();
							$("#next").click();
						}
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
							var optionStatementY = 0;
							for(var i=0; i<option_arr.length; i++){
								TweenMax.to(option_arr[i], transitionLength, {css:{top:optionStatementY, scaleX: 1, scaleY: 1, left:0}, ease:transitionType});
								optionStatementY += option_arr[i].height() + 20;
								option_arr[i].unbind("mouseenter mouseleave");
							}
							drop_arr = [];
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
			
			if(type == "matchingDrag"){
				$( "#dialog-attemptResponse" ).addClass("inlineLeftFeedback");
				if(tempCorrect == true || attemptsAllowed == attemptsMade){
					$("#dialog-attemptResponse").css({'position':'absolute', 'top':optionHolderY});
				}else{
					$("#dialog-attemptResponse").css({'position':'absolute', 'top':optionHolderY + optionStatementY});
				}
			}else if(type == "matching"){
				$( "#dialog-attemptResponse" ).addClass("inlineBottomFeedback");
				var inlineY;
				//Get the y position of the feedback by figuring out if options or answers is taller.
				if(optionStatementY > optionAnswerY){
					inlineY = optionHolderY + optionStatementY +  20;
				}else{
					inlineY = optionHolderY + optionAnswerY + 20;
				}
				$("#dialog-attemptResponse").css({'position':'absolute', 'top':inlineY});
			}
			
			
			//If drag and attempts left - move options back to start point
			if(attemptsAllowed > attemptsMade && tempCorrect == false){
				if(type == "matchingDrag"){
					drops = 0;
					var tempStatementY = 0;
					for(var i=0; i<option_arr.length; i++){
						TweenMax.to(option_arr[i], transitionLength, {css:{top:tempStatementY, left:0}, ease:transitionType});
						tempStatementY += option_arr[i].height() + 20;
					}
					drop_arr = [];
				}
			}		
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
				$("#stage").append("<div id='questionEditDialog' title='Create Multiple Choice Question'><label id='label'>no. of attempts: </label><input type='text' name='myName' id='inputAttempts' value='"+ attemptsAllowed +"' class='regText text ui-widget-content ui-corner-all' style='width:35px;'/><br/><br/><div id='questionLabel'>Input your question:</div><div id='questionEditText' type='text'  >" + myContent + "</div><br/><br/><div id='feedbackLabel'>Input your feedback:</div><div id='feedbackEditText' type='text'  >" + feedback + "</div><br/><br/><b>Options:</b><br/><div id='myOptionList'></div><br/><b>Answers:</b><br/><div id='myAnswerList'></div>");
				
				$("#questionEditText").redactor({
					buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
				});
				
				$("#feedbackEditText").redactor({
					buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
				});
				optionCount = option_arr.length;
				//find every option in the xml - place them on the screen.
				for (var i = 0; i < optionCount; i++){
					var optionID = "option" + i;
					var optionLabel = i + 1;
					var myMatch = $(data).find("page").eq(currentPage).find("option").eq(i).attr("correct");
					
					$("#myOptionList").append("<label id='label'>Option " + optionLabel + " Match: </label><input type='text' name='myMatch' id='"+optionID+"Match' value='"+ myMatch +"' class='regText text ui-widget-content ui-corner-all' style='width:35px;'/><br/>");
					
					var optionContent = $(data).find("page").eq(currentPage).find("option").eq(i).text();				
					$("#myOptionList").append("<div id='"+optionID+"Input'>Option " + optionLabel + " Text:</div> <div id='"+optionID+"Text'>" + optionContent + "</div>");
					
					$("#"+optionID+"Text").redactor({
						buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'fontcolor', 'backcolor']
					});
											
					optionEdit_arr.push(optionID);
				};
				
				answerCount = answer_arr.length;
				
				for(var j = 0; j < answerCount; j++){
					var answerID = "answer" + j;
					var answerLabel = j + 1;
					var myLabel = $(data).find("page").eq(currentPage).find("answer").eq(j).attr("correct");
					
					$("#myAnswerList").append("<label id='label'>Answer "+ answerLabel +" Label: </label><input type='text' name='myLabel' id='"+answerID+"Match' value='"+ myLabel +"' class='regText text ui-widget-content ui-corner-all' style='width:35px;'/><br/>");
					var answerContent = $(data).find("page").eq(currentPage).find("answer").eq(j).text();
					$("#myAnswerList").append("<div id='"+answerID+"Input'>Answer " + answerLabel + " Text:</div> <div id='"+answerID+"Text'>" + answerContent + "</div><br/><br/>");
					
					$("#"+answerID+"Text").redactor({
						buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'fontcolor', 'backcolor']
					});
					
					answerEdit_arr.push(answerID);
				}
				
				//Style it to jQuery UI dialog
				$("#questionEditDialog").dialog({
					autoOpen: true,
					modal: true,
					width: 800,
					height: 650,
					buttons: {
						AddOption: function(){
							
							var optionID = "option" + optionCount;
							var optionLabel = optionCount + 1;
							
							
							$("#myOptionList").append("<label id='label'>Option " + optionLabel + " Match: </label><input type='text' name='myMatch' id='"+optionID+"Match' value='X' class='regText text ui-widget-content ui-corner-all' style='width:35px;'/><br/>");
							
							var optionContent = "Input Option";
											
							$("#myOptionList").append("<div id='"+optionID+"Input'>Option " + optionLabel + ":</div> <div id='"+optionID+"Text'>" + optionContent + "</div>");
							$("#"+optionID+"Text").redactor({
								buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
							});
							
							$(data).find("page").eq(currentPage).append($("<option>"));
							var option= new DOMParser().parseFromString('<option></option>',  "text/xml");
							var optionCDATA = option.createCDATASection("Input Option");
							$(data).find("page").eq(currentPage).find("option").eq(optionCount).append(optionCDATA);
							$(data).find("page").eq(currentPage).find("option").eq(optionCount).attr("correct", "X");
							
								
							optionCount++;
							optionEdit_arr.push(optionID);	
						},
						AddAnswer: function(){
							
							var answerID = "answer" + answerCount;
							var answerLabel = answerCount + 1;
							var myLabel = "X";
							
							$("#myAnswerList").append("<label id='label'>Answer "+ answerLabel +" Label: </label><input type='text' name='myLabel' id='"+answerID+"Match' value='"+ myLabel +"' class='regText text ui-widget-content ui-corner-all' style='width:35px;'/><br/>");
							
							var myAnswerContent = "Input Answer";
							$("#myAnswerList").append("<div id='"+answerID+"Input'>Answer " + answerLabel + " Text:</div> <div id='"+answerID+"Text'>" + answerContent + "</div><br/><br/>");
							
							$("#"+answerID+"Text").redactor({
								buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'fontcolor', 'backcolor']
							});
							
							$(data).find("page").eq(currentPage).append($("<answer>"));
							var answer= new DOMParser().parseFromString('<answer></answer>',  "text/xml");
							var answerCDATA = answer.createCDATASection("Input Answer");
							$(data).find("page").eq(currentPage).find("answer").eq(answerCount).append(answerCDATA);
								
							answerCount++;
							answerEdit_arr.push(answerID);	
						},
						Save: function(){
							saveQuestionEdit();
							$( this ).dialog( "close" );
						}
					}
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
			var optionCorrect = $("#"+optionEdit_arr[i]+"Match").val();
			var newOption = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var optionCDATA = newOption.createCDATASection(optionText);
			$(data).find("page").eq(currentPage).find("option").eq(i).empty();
			$(data).find("page").eq(currentPage).find("option").eq(i).append(optionCDATA);
			$(data).find("page").eq(currentPage).find("option").eq(i).attr("correct", optionCorrect);
			
			$("#"+optionEdit_arr[i]+"Text").destroyEditor();
		}
		
		for(var i = 0; i < answerEdit_arr.length; i++){
			var answerText = $("#"+answerEdit_arr[i]+"Text").getCode();
			var answerCorrect = $("#"+answerEdit_arr[i]+"Match").val();;
			var newAnswer = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
			var answerCDATA = newAnswer.createCDATASection(answerText);
			$(data).find("page").eq(currentPage).find("answer").eq(i).empty();
			$(data).find("page").eq(currentPage).find("answer").eq(i).append(answerCDATA);
			$(data).find("page").eq(currentPage).find("answer").eq(i).attr("correct", answerCorrect);
			
			$("#"+answerEdit_arr[i]+"Text").destroyEditor();
		}
		

		$("#questionEditDialog").remove();
		sendUpdate();
		fadeComplete();
	}	
	
	
	this.destroySelf = function() {
		 TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:Power2.easeIn, onComplete:fadeComplete});
    }
    
    function fadeComplete(){
	    $('#pageTitle').remove();
	    $('#question').remove();
	    $('#matchingOptions').remove();
	    $("#matchingAnswers").remove();
	    $("#matchingSubmit").remove();
	    $("#dialog-attemptResponse").remove();
	    if(mode == "edit"){
		    $("#titleEdit").remove();
		    $("#questionEdit").remove();
		    $("#titleEditDialog").remove();
		    $("#questionEditDialog").remove();
	    }
	    loadPage();
    }

}