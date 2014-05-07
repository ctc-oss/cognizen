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
    var myObjItemId = "undefined";
  
    
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
		
		if($(data).find("page").eq(currentPage).attr('objItemId')){
			myObjItemId = $(data).find("page").eq(currentPage).attr('objItemId');
		}
		
		pageTitle = new C_PageTitle();
		
		var msg = '<div id="scrollableContent" class="antiscroll-wrap matching">';
		msg += '<div id="contentHolder" class="overthrow antiscroll-inner">';
		msg += '<div id="question" class="questionTop"></div>';
		msg += '<div id="sequenceHolder" class="sequenceHolder">';
		msg += '</div></div></div>';
		
		try { audioHolder.destroy(); } catch (e) {}
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
		
		if(isComplete){
			for(var k=0; k<questionResponse_arr.length; k++){
				if(currentPageID == questionResponse_arr[k].id){
					for(var h = 0; h < questionResponse_arr[k].userAnswer.length; h++){
						order_arr.push(questionResponse_arr[k].userAnswer[h] - 1);
					}
				}
			}
		}else{
			for (var i = 0; i < optionCount; i++){
				order_arr.push(i);
			}
			order_arr = shuffleArray(order_arr);
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
			$('#sequenceHolder').prepend("<div id='questionEdit' class='btn_edit_text' title='Edit Text Question'></div>");
			$("#questionEdit").click(function(){
				updateQuestionEditDialog();
			}).tooltip();
		}
	}
	function updateQuestionEditDialog(){
		var msg = "<div id='questionEditDialog' title='Create Multiple Choice Question'>";
		msg += "<label id='label'><b>no. of attempts: </b></label>";
		msg += "<input type='text' name='myName' id='inputAttempts' value='"+ attemptsAllowed +"' class='dialogInput' style='width:35px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'><b>graded: </b></label>";
		msg += "<input id='isGraded' type='checkbox' name='graded' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'><b>mandatory: </b></label>";
		msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label style='position: relative; float: left; vertical-align:middle; line-height:30px;'>question objective: </label>";
		msg += "<input type='text' name='myName' id='inputObjective' value='"+ myObjective +"' class='dialogInput' style='width: 440px;'/><br/><br/>";
		msg += "<label style='position: relative; float: left; vertical-align:middle; line-height:30px;'>module or lesson mapped (highest level): </label>";
		msg += "<input type='text' name='myName' id='inputObjItemId' value='"+ myObjItemId +"' class='dialogInput' style='width: 440px;'/><br/><br/>";		
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
					tmpObj.objective = $("#inputObjective").val();
					tmpObj.objItemId = $("#inputObjItemId").val();
					if($("#isGraded").prop("checked") == true){
						$(data).find("page").eq(currentPage).attr("graded", "true");
					}else{
						$(data).find("page").eq(currentPage).attr("graded", "false");
					}
					if($("#isMandatory").prop("checked") == true){
						$(data).find("page").eq(currentPage).attr("mandatory", "true");
					}else{
						$(data).find("page").eq(currentPage).attr("mandatory", "false");
					}
					
					tmpObj.feedbackType = $('input[name=manageFeedbackType]:checked', '#feedbackTypeGroup').val();
					if(feedbackType == "undifferentiated"){
						tmpObj.feedbackUpdate = CKEDITOR.instances["feedbackEditText"].getData();
					}
					var tmpOptionArray = new Array();
					for(var i = 0; i < optionEdit_arr.length; i++){
						var tmpOptionObj = new Object();
						tmpOptionObj.optionText = CKEDITOR.instances[optionEdit_arr[i]+"Text"].getData();
						tmpOptionObj.optionCorrect = $("#"+optionEdit_arr[i]+"Correct").val();
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
	
	
	function addOption(_addID, _isNew){
		var optionID = "option" + _addID;
		var optionLabel = _addID + 1;
		
		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("Sequencing Item");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).find("content").append(option1CDATA);
			$(data).find("page").eq(currentPage).find("option").eq(_addID).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct", _addID + 1);
			
		}
					
		var optionContent = $(data).find("page").eq(currentPage).find("option").eq(_addID).find("content").text();				
		var msg = "<div id='"+optionID+"Container' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='"+optionID+"Remove' class='removeMedia' value='"+_addID+"' title='Click to remove this option'/>";
		msg += "<div id='"+optionID+"Input' style='padding-bottom:5px;'><b>Option " + optionLabel + ":</b></div>";
		msg += "<div id='"+optionID+"Text' contenteditable='true' class='dialogInput'>" + optionContent + "</div>";
		msg += "<label id='label'><b>correct:</b></label>";
		msg += "<label id='label'>Option " + optionLabel + " Order #: </label>";
		msg += "<input type='text' name='myMatch' id='"+optionID+"Correct' value='"+ $(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct") +"' class='dialogInput' style='width:35px; text-align:center;'/><br/>";
		
		/*if($(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct") == "true"){	
			msg += "<input id='"+optionID + "Correct' type='checkbox' checked='checked' name='correct' class='radio' value='true'/>";
		}else{
			msg += "<input id='"+optionID + "Correct' type='checkbox' name='correct' class='radio' value='true'/>";
		}*/
		
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
	
	function saveQuestionEdit(_data){
		if(_data.feedbackType == "undifferentiated"){
			var feedbackUpdate = _data.feedbackUpdate;//$("#feedbackEditText").getCode();
			var feedDoc = new DOMParser().parseFromString('<feedback></feedback>', 'application/xml');
			var feedCDATA = feedDoc.createCDATASection(feedbackUpdate);
			$(data).find("page").eq(currentPage).find("feedback").empty();
			$(data).find("page").eq(currentPage).find("feedback").append(feedCDATA);
		}
		
		$(data).find("page").eq(currentPage).attr("attempts", _data.attempts);
		$(data).find("page").eq(currentPage).attr("objective", _data.objective);
		$(data).find("page").eq(currentPage).attr("objItemId", _data.objItemId);
		for(var j = 0; j < questionResponse_arr.length; j++){
			if(questionResponse_arr[j].id == $(data).find('page').eq(currentPage).attr('id')){
				questionResponse_arr[j].graded = _data.graded;
				questionResponse_arr[j].objective = _data.objective;
				questionResponse_arr[j].objItemId = _data.objItemId;
			}
		}
		$(data).find("page").eq(currentPage).attr("graded", _data.graded);
		$(data).find("page").eq(currentPage).attr("mandatory", _data.mandatory);
		$(data).find("page").eq(currentPage).attr("feedbacktype", _data.feedbackType);
		for(var i = 0; i < optionEdit_arr.length; i++){
		var correctOptions = 0;
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
	
	
	this.destroySelf = function() {
		 TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:Power2.easeIn, onComplete:fadeComplete});
    }
    
    this.fadeComplete = function(){
        	fadeComplete();
	}
    // fadeComplete() moved to C_UtilFunctions.js
}