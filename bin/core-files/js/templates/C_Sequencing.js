/*!
 * C_Sequencing
 * This class creates a template for sequncing items in to the correct order.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2014-2-25
 * JavaScript
 *
 * Copyright (c) 2014, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 * 
 * This function allows for multiple parameters including:
 * 		1. Number of attempts: defaults to 1
 *		2. Undifferentiated Feedback
 */
function C_Sequencing(_type) {
	var type = _type;
	var pageTitle;
	var audioHolder;
    var myContent;//Body
    var optionStartX = 0;
    var attemptsAllowed = 2;
    var attemptsMade = 0;
    var optionLabeling = "a"; //"a" for alphabetic - "n" for numeric
    var option_arr = [];
	
    var feedbackType = "undifferentiated";
    var feedbackDisplay;
    var feedbackCorrectTitle;
    var feedbackIncorrectTitle;
    var feedbackIncorrectAttempt;
    var feedback;
    var optionCount = 0;
    var optionEdit_arr = [];
	var marking_arr;
	var tempCorrect = true;
    
    var optionStatementY = 0;
    var isComplete = false;
    var graded = false;
    var mandatory = true;
    var myObjective = "undefined";
    var order_arr = [];
  
    
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
		
		feedbackType = $(data).find("page").eq(currentPage).attr('feedbacktype');
		attemptsAllowed = $(data).find("page").eq(currentPage).attr('attempts');
		feedbackDisplay = $(data).find("page").eq(currentPage).attr('feedbackdisplay');
		feedbackCorrectTitle = $(data).find("page").eq(currentPage).find('correctresponse').text();
		feedbackIncorrectTitle = $(data).find("page").eq(currentPage).find('incorrectresponse').text();
		feedbackIncorrectAttempt = $(data).find("page").eq(currentPage).find('attemptresponse').text();
		feedback = $(data).find("page").eq(currentPage).find('feedback').text();
		optionCount = $(data).find("page").eq(currentPage).find("option").length;
		
		
		if($(data).find("page").eq(currentPage).attr('graded') == "true"){
			graded = true;
		}
		if($(data).find("page").eq(currentPage).attr('mandatory') == "false" || $(data).find("page").eq(currentPage).attr('mandatory') == undefined){
			mandatory = false;
		}
		
		if($(data).find("page").eq(currentPage).attr('objective')){
			myObjective = $(data).find("page").eq(currentPage).attr('objective');
		}

		
		pageTitle = new C_PageTitle();
		
		var msg = '<div id="scrollableContent" class="antiscroll-wrap matching">';
		msg += '<div id="contentHolder" class="overthrow antiscroll-inner">';
		msg += '<div id="question" class="questionTop"></div>';
		msg += '<div id="sequenceHolder" class="sequenceHolder">';
		msg += '</div></div></div>';
		
		try { audioHolder.destroy(); } catch (e) {}
		console.log("add audio holder");
		audioHolder = new C_AudioHolder();
		
		$('#stage').append(msg);
		
		//Set Question
		myContent = $(data).find("page").eq(currentPage).find('question').text();
		$("#question").append(myContent);
		
		placeOptions();
	}
	
	
	
	function placeOptions(){
		////Place each option within the container $('#options') - this allows for easier cleanup, control and tracking.
		var iterator = 0;
		
		if(isComplete == false){
			for (var i = 0; i < optionCount; i++){
				order_arr.push(i);
			}
			order_arr = shuffleArray(order_arr);
		}else{
			for(var k=0; k<questionResponse_arr.length; k++){
				if(currentPageID == questionResponse_arr[k].id){
					for(var h = 0; h < questionResponse_arr[k].userAnswer.length; h++){
						order_arr.push(questionResponse_arr[k].userAnswer[h] - 1);
					}
				}
			}
		}
		
		
		var msg = "<div id='sortable' style='list-style-type: none;'>";
		for(var j = 0; j < order_arr.length; j++){	
			var myNode = $(data).find("page").eq(currentPage).find("option").eq(order_arr[j]);
			//Create unique class name for each option
			var myOption = "option" + j;
			//Create each option as a div.
			//myNode.attr("correct")
			msg += '<div class="sequenceOption" id="' + myOption + '" value="' + myNode.attr("correct")+ '">' +myNode.find("content").text() +'</div>';
		}
		msg += "</div>"
		$('#sequenceHolder').append(msg);
		$( "#sortable" ).sortable();
		$( "#sortable" ).disableSelection();
		
		placematchingSubmit();
		
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		//
        checkMode();
		//
		if(isComplete){
			//disableOptions();
			$("#mcSubmit").button({ disabled: true });
			showUserAnswer();
		}
		
		if(transition == true){
			TweenMax.to($("#stage"), transitionLength, {css:{opacity:1}, ease:transitionType});
		}
	}
	
	
	function placematchingSubmit(){
		$("#contentHolder").append('<div id="mcSubmit"></div>');
		$("#mcSubmit").button({ label: $(data).find("page").eq(currentPage).attr("btnText")/*, disabled: true*/ });
		$("#mcSubmit").click(checkAnswer);	
	}


	function showUserAnswer(){
		//Show markings - green check - red x
		for(var i=0; i<questionResponse_arr.length; i++){
			if(currentPageID == questionResponse_arr[i].id){
				var temp_arr = questionResponse_arr[i].userAnswer;
				var tempCorrect = true;
				for(var k = 0; k < temp_arr.length; k++){
					if(temp_arr[k] != k + 1){
						tempCorrect = false;
						$("#sequenceHolder").find(".sequenceOption").eq(k).addClass("optionIncorrect");
					}else{
						$("#sequenceHolder").find(".sequenceOption").eq(k).addClass("optionCorrect");
					}
				}
			}
		}
		$(".sequenceInput").prop('disabled', true);
		$("#mcSubmit").button({ disabled: true });
		mandatoryInteraction = false;
		checkNavButtons();
	}

	
	function checkAnswer(){
		$("#dialog-attemptResponse").remove();
		attemptsMade++;
		marking_arr = [];
		tempCorrect = true;
		
		for(var i = 0; i < $("#sequenceHolder").find(".sequenceOption").length; i++){
			var markingObject = new Object();
			
			if(parseInt($("#sequenceHolder").find(".sequenceOption").eq(i).attr("value")) != i + 1){
				tempCorrect = false;
				markingObject.isCorrect = false;
			}else{
				markingObject.isCorrect = true;
			}
			marking_arr.push(markingObject);
		}
		
		///************************************
		//POPULATE FEEDBACK STRING
		//************************************/
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
		}
		
		if(tempCorrect == true || attemptsMade == attemptsAllowed){
			var selected_arr = [];
			
			for(var j = 0; j < $("#sequenceHolder").find(".sequenceOption").length; j++){
				selected_arr.push(parseInt($("#sequenceHolder").find(".sequenceOption").eq(j).attr("value")));
			}
			
			updateScoring(selected_arr, tempCorrect);
			showUserAnswer();
		}
		
		///************************************
		//PLACE THE FEEDBACK
		//************************************/
		
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
						$('.ui-dialog-buttonpane').find('button:contains("Proceed")').addClass('feedback-proceed-button');
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
			}else if(type == "matching"){
				$( "#dialog-attemptResponse" ).addClass("inlineBottomFeedback");
			}		
		}
	}
	
	function checkMode(){
		$('.antiscroll-wrap').antiscroll();
		//
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
       // var msg = "<div id='questionEditDialog' title='Set Question Preferences'>";
       // msg += "<label id='label'>no. of attempts: </label>";
	   //	msg += "<input type='text' name='myName' id='inputAttempts' value='"+ attemptsAllowed +"' class='dialogInput' style='width:35px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	   //	msg += "<label id='label'><b>graded: </b></label>";
	   //	msg += "<input id='isGraded' type='checkbox' name='graded' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	   //	msg += "<label id='label'><b>mandatory: </b></label>";
	   //	msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
       // msg += "<label id='label'>drag and drop: </label>";
	   //	msg += "<input id='dragAndDrop' type='checkbox' name='dragAndDrop' class='radio' value='true'/><br/><br/>";
	   //	msg += "<div id='feedbackLabel'>Input your feedback:</div>";
	   //	msg += "<div id='feedbackEditText' type='text' contenteditable='true' class='dialogInput'>" + feedback + "</div><br/>";
	   //	msg += "<b>Options:</b><br/><div id='myOptionList'></div><br/>";
	   //	msg += "<b>Answers:</b><br/><div id='myAnswerList'></div>";
	   //	$("#stage").append(msg);
	   //			
       // if(!graded){
	   //		$("#isGraded").removeAttr('checked');
	   //	}else{
	   //		$("#isGraded").attr('checked', 'checked');
	   //	}
	   //
       // if(!mandatory){
	   //		$("#isMandatory").removeAttr('checked');
	   //	}else{
	   //		$("#isMandatory").attr('checked', 'checked');
	   //	}
	   //
	   //	if(type == "matching"){
	   //		$("#dragAndDrop").removeAttr('checked');
	   //	}else{
	   //		$("#dragAndDrop").attr('checked', 'checked');
	   //	}
	   //			
	   //	$("#dragAndDrop").change(function(){
	   //		if($("#dragAndDrop").prop("checked") == true){
	   //			type = "matchingDrag";
	   //		}else{
	   //			type = "matching";
	   //		}
	   //		$("#questionEditDialog").dialog( "close" );
	   //		optionEdit_arr = [];
	   //		answerEdit_arr = [];
	   //		updateQuestionEditDialog();
	   //	});
	   //							
	   //	CKEDITOR.inline( "feedbackEditText", {
	   //		toolbar: contentToolbar,
	   //		toolbarGroups :contentToolgroup,
	   //		enterMode : CKEDITOR.ENTER_BR,
	   //		shiftEnterMode: CKEDITOR.ENTER_P,
	   //		extraPlugins: 'sourcedialog'
	   //	});	
	   //			
	   //	optionCount = option_arr.length;
	   //	//find every option in the xml - place them on the screen.
	   //	for (var i = 0; i < optionCount; i++){
	   //		addOption(i, false);
	   //	};
	   //			
	   //	for(var j = 0; j < answer_arr.length; j++){
	   //		addAnswer(j, false);
	   //	}
	   //			
	   //	//Style it to jQuery UI dialog
	   //	$("#questionEditDialog").dialog({
	   //		autoOpen: true,
	   //		modal: true,
	   //		width: 800,
	   //		height: 650,
	   //		close: function(){
	   //			CKEDITOR.instances["feedbackEditText"].destroy();
	   //			
	   //			for(var i = 0; i < optionEdit_arr.length; i ++){
	   //				 CKEDITOR.instances[optionEdit_arr[i]+"Text"].destroy();
	   //			}
	   //			//if($("#dragAndDrop").prop("checked") == false){
	   //			for(var i = 0; i < answerEdit_arr.length; i ++){
	   //				var editor = CKEDITOR.instances[answerEdit_arr[i]+"Text"];
	   //				if(editor){editor.destroy(true);}
	   //			}
	   //			$("#questionEditDialog").remove();
	   //		},
	   //		buttons: {
	   //			Cancel: function(){
	   //				$("#questionEditDialog").dialog("close");
	   //			},
	   //			AddOption: function(){
	   //				addOption(optionEdit_arr.length, true);	
	   //			},
	   //			AddAnswer: function(){
	   //				addAnswer(answerEdit_arr.length, true);	
	   //			},
	   //			Save: function(){
	   //				var tmpObj = new Object();
	   //				tmpObj.attempts = $("#inputAttempts").val();
	   //
	   //				if($("#isGraded").prop("checked") == true){
	   //					$(data).find("page").eq(currentPage).attr("graded", "true");
	   //				}else{
	   //					$(data).find("page").eq(currentPage).attr("graded", "false");
	   //				}
	   //				if($("#isMandatory").prop("checked") == true){
	   //					$(data).find("page").eq(currentPage).attr("mandatory", "true");
	   //				}else{
	   //					$(data).find("page").eq(currentPage).attr("mandatory", "false");
	   //				}
	   //				
	   //				if($("#dragAndDrop").prop("checked") == true){
	   //					tmpObj.layout = "matchingDrag";
	   //				}else{
	   //					tmpObj.layout = "matching";
	   //				}
	   //				
	   //				
//TURN //BACK ON IF MATCHING GETS DIFFERENTIATED
//	   //						tmpObj.feedbackType = $('input[name=manageFeedbackType]:checked', '#feedbackTypeGroup').val();
//	   //						if(feedbackType == "undifferentiated"){
	   //				tmpObj.feedbackUpdate = CKEDITOR.instances["feedbackEditText"].getData();
//	   //						}
	   //				var tmpOptionArray = new Array();
	   //				for(var i = 0; i < optionEdit_arr.length; i++){
	   //					var tmpOptionObj = new Object();
	   //					tmpOptionObj.optionText = CKEDITOR.instances[optionEdit_arr[i]+"Text"].getData();
	   //					tmpOptionObj.optionCorrect = $("#"+optionEdit_arr[i]+"Match").val();
//	   //					if(feedbackType == "differentiated"){
//	   //						tmpOptionObj.difText = CKEDITOR.instances[optionEdit_arr[i]+"DifFeedText"].getData()
//	   //					}
	   //					tmpOptionArray.push(tmpOptionObj);
	   //				}
	   //				tmpObj.option_arr = tmpOptionArray;
	   //						
	   //				var tmpAnswerArray = new Array();
	   //				for(var i = 0; i < answerEdit_arr.length; i++){
	   //					var tmpAnswerObj = new Object();
	   //					
	   //					if(tmpObj.layout == "matchingDrag"){
	   //						tmpAnswerObj.answerText = $("#"+ answerEdit_arr[i]+"Text").val();
	   //					}else{
	   //						tmpAnswerObj.answerText = CKEDITOR.instances[answerEdit_arr[i]+"Text"].getData();
	   //					}	
	   //					tmpAnswerObj.answerCorrect = $("#"+answerEdit_arr[i]+"Match").val();
	   //							
	   //					tmpAnswerArray.push(tmpAnswerObj);
	   //				}
	   //				tmpObj.answer_arr = tmpAnswerArray;
	   //						
	   //				saveQuestionEdit(tmpObj);
	   //				$("#questionEditDialog").dialog("close");
	   //			}
	   //		}
	   //	});
	}
	
	
	function addOption(_addID, _isNew){
		//var optionID = "option" + _addID;
		//var optionLabel = _addID + 1;
		//
		//if(_isNew == true){
		//	$(data).find("page").eq(currentPage).append($("<option>"));
		//	var option= new DOMParser().parseFromString('<option></option>',  "text/xml");
		//	var optionCDATA = option.createCDATASection("Input Option");
		//	$(data).find("page").eq(currentPage).find("option").eq(_addID).append(optionCDATA);
		//	$(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct", "X");			
		//}
		//
		//var myMatch = $(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct");					
		//
		//var msg = "<div id='"+optionID+"Container' class='templateAddItem'>";
		//msg += "<div id='"+optionLabel+"Remove' class='removeMedia' value='"+_addID+"' title='Click to remove this option'/>";
		//msg += "<label id='label'>Option " + optionLabel + " Match: </label>";
		//msg += "<input type='text' name='myMatch' id='"+optionID+"Match' value='"+ myMatch +"' value='X' class='dialogInput' style='width:35px; text-align:center;'/><br/>";
		//var optionContent = $(data).find("page").eq(currentPage).find("option").eq(_addID).text();			
		//msg +="<div id='"+optionID+"Input'>Option " + optionLabel + " Text:</div>";
		//msg += "<div id='"+optionID+"Text' class='dialogInput' contenteditable='true'>" + optionContent + "</div>";
		//msg += "</div>"
		//$("#myOptionList").append(msg);
		//					
		//CKEDITOR.inline( optionID+"Text", {
		//	toolbar: contentToolbar,
		//	toolbarGroups :contentToolgroup,
		//	enterMode : CKEDITOR.ENTER_BR,
		//	shiftEnterMode: CKEDITOR.ENTER_P,
		//	extraPlugins: 'sourcedialog'
		//});	
		//					
		//$("#" +optionLabel+"Remove").click(function(){
		//	var arrIndex = $(this).attr('value');
		//	$(data).find("pages").eq(currentPage).find("option").eq(arrIndex).remove();
		//	optionEdit_arr.splice(arrIndex, 1);
		//	$("#option"+arrIndex+"Container").remove();
		//});
		//
		//optionEdit_arr.push(optionID);
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
		//var feedbackUpdate = _data.feedbackUpdate;
		//var feedDoc = new DOMParser().parseFromString('<feedback></feedback>', 'application/xml');
		//var feedCDATA = feedDoc.createCDATASection(feedbackUpdate);
		//
		////Update the local xml - first clearning the content node and then updating it with out newCDATA
		//$(data).find("page").eq(currentPage).find("feedback").empty();
		//$(data).find("page").eq(currentPage).find("feedback").append(feedCDATA);
		//$(data).find("page").eq(currentPage).attr("attempts", _data.attempts);
		//$(data).find("page").eq(currentPage).attr("graded", _data.graded);
		//$(data).find("page").eq(currentPage).attr("mandatory", _data.mandatory);
		//$(data).find("page").eq(currentPage).attr("layout", _data.layout);
		//
		//for(var i = 0; i < optionEdit_arr.length; i++){
		//	var optionText = _data.option_arr[i].optionText;
		//	var optionCorrect = _data.option_arr[i].optionCorrect;
		//	var newOption = new DOMParser().parseFromString('<option></option>',  "text/xml");
		//	var optionCDATA = newOption.createCDATASection(optionText);
		//	$(data).find("page").eq(currentPage).find("option").eq(i).empty();
		//	$(data).find("page").eq(currentPage).find("option").eq(i).append(optionCDATA);
		//	$(data).find("page").eq(currentPage).find("option").eq(i).attr("correct", optionCorrect);
		//}
		//
		//for(var i = optionEdit_arr.length; i < optionCount; i++){
		//	$(data).find("page").eq(currentPage).find("option").eq(i).remove();
		//}
		//
		//for(var i = 0; i < answerEdit_arr.length; i++){
		//	var answerText = _data.answer_arr[i].answerText;
		//	var answerCorrect = _data.answer_arr[i].answerCorrect;
		//	if(_data.layout == "matching"){
		//		var newAnswer = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
		//		var answerCDATA = newAnswer.createCDATASection(answerText);
		//		$(data).find("page").eq(currentPage).find("answer").eq(i).find("content").empty();
		//		$(data).find("page").eq(currentPage).find("answer").eq(i).find("content").append(answerCDATA);
		//	}else{
		//		$(data).find("page").eq(currentPage).find("answer").eq(i).attr("img", answerText);
		//	}
		//	$(data).find("page").eq(currentPage).find("answer").eq(i).attr("correct", answerCorrect);
		//}
		//
		//for(var i = answerEdit_arr.length; i < answerCount; i++){
		//	$(data).find("page").eq(currentPage).find("answer").eq(i).remove();
		//}
		//
		//sendUpdateWithRefresh();
		//fadeComplete();
	}	
	
	
	this.destroySelf = function() {
		 TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:Power2.easeIn, onComplete:fadeComplete});
    }
    
    this.fadeComplete = function(){
        	fadeComplete();
	}
    // fadeComplete() moved to C_UtilFunctions.js
}