/*!
 * C_Slider
 * This class creates a template for slider type questions.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2014-12-11
 * JavaScript
 *
 * Copyright (c) 2012, CTC. All rights reserved.
 *
 * @author: Tyler Shumaker, shumaket@ctc.com
 *
 * This function allows for multiple parameters including:
 * 		1. 
 */
function C_Slider(_type) {
    var myContent;//Body
    var optionHolderY = 0;
    var optionStartX = 0;
    var mcSubmitButtonY = 0;
    var attemptsAllowed = 1;
    var attemptsMade = 0;
    var optionLabeling = "a"; //"a" for alphabetic - "n" for numeric
    var type = _type;
    var option_arr = [];
    var feedbackType;
    var feedbackDisplay;
    var iconClicked = false;
    var conHeight;

    var isComplete = false;
    var optionEdit_arr = [];
    var graded = false;
    var mandatory = true;
    var pageId;

    var order_arr = [];
    var scormVersion;
    var diffeedEdit_arr = [];


    //Defines a public method - notice the difference between the private definition below.
	this.initialize= function(){
		
		buildTemplate();
	}

	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		if(transition == true){
			$('#stage').css({'opacity':0});
		}

		//Clear accessibility on page load.
        pageAccess_arr = [];
        audioAccess_arr = [];

		isComplete = checkQuestionComplete();

		feedbackType = $(data).find("page").eq(currentPage).attr('feedbacktype');
		feedbackDisplay = $(data).find("page").eq(currentPage).attr('feedbackdisplay');
		scormVersion = $(data).find('scormVersion').attr('value');
		pageId = $(data).find("page").eq(currentPage).attr("id");

		if($(data).find("page").eq(currentPage).attr('graded') == "true"){
			graded = true;
		}
		if($(data).find("page").eq(currentPage).attr('mandatory') == "false"){
			mandatory = false;
		}

		pageTitle = new C_PageTitle();

		var msg = '<div id="scrollableContent" class="antiscroll-wrap top">';
		msg += '<div class="box">';
		msg += '<div id="contentHolder" class="overthrow antiscroll-inner">';
		msg += '<div id="question" class="questionTop"></div>';
		msg += '<div id="sliderHolder"></div>';
		//close of contentHolder, box and scrollableContent
		msg += '</div></div></div>';

		try { audioHolder.destroy(); } catch (e) {}
		audioHolder = new C_AudioHolder();

		$('#stage').append(msg);

		//Set Question
		myContent = $(data).find("page").eq(currentPage).find('question').text();
		$("#question").append(myContent);

		//var ariaText = $("#question").text().replace(/\'/g, "").replace(/\"/g, "");
		//$("#question").attr("aria-label", ariaText);
		//pageAccess_arr.push($("#question"));

		//buildslider
		var myNode = $(data).find("page").eq(currentPage).find('slider');
		var sliderContent = myNode.find('content').text().replace("<![CDATA[", "").replace("]]>", "");
		msg = '<p><label for="display">'+sliderContent+'</label>';
		msg += '<input type="text" id="display">'
		msg += '</p>';
		msg += '<div id="slider"></div>';

		$('#sliderHolder').append(msg);

		var myValue = parseFloat(myNode.attr("start"));
		var myMin = parseFloat(myNode.attr("min"));
		var myMax = parseFloat(myNode.attr("max"));
		var myStep = parseFloat(myNode.attr("step"));
		//get attemptsAllowed
		attemptsAllowed = myNode.attr("attempts");

		$('#slider').slider({
			value: myValue,
			min: myMin,
			max: myMax,
			step: myStep,
			orientation: myNode.attr("orientation"),
			slide: function( event, ui ){
				$('#display').val( ui.value );
			}
		});

		$("#slider").draggable();

		$('#display').val( $('#slider').slider("value") );
		
		$("#display").change(function(){
			var displayValue = $("#display").val();
			if(!$.isNumeric(displayValue)){
				alert("The value must be a numeric value.");
				$("#slider").slider("value", myValue);
				$('#display').val(myValue);		
			}
			else if(displayValue > myMax){
				alert("The value cannot be greater the the max value for the slider.");
				$("#slider").slider("value", myMax);
				$('#display').val(myMax);
			}
			else{
				$("#slider").slider("value", displayValue);
			}
		});
		
		pageAccess_arr.push($("#display"))
		$('.ui-slider-handle').attr("tabindex", "-1");
		$('.ui-slider-handle').find('a').attr("tabindex", "-1");
		//pageAccess_arr.push($("#slider"));
		
		if(!isComplete){
			$("#contentHolder").append('<div id="mcSubmit"></div>');
			$("#mcSubmit").button({ label: $(data).find("page").eq(currentPage).attr("btnText")/*, disabled: true*/ });
			$("#mcSubmit").click(checkAnswer).keypress(function(event) {
			    var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
			    if (chCode == 32 || chCode == 13){
				    $(this).click();
				}
		    });

			$("#mcSubmit").attr("aria-label", "Submit your answer.").attr("role", "button");
			pageAccess_arr.push($("#mcSubmit"));			
		}
		else{
			mandatory = false;
			checkNavButtons();
			showUserAnswer();
		}

		checkMode();

		if(transition == true){
			TweenMax.to($("#stage"), transitionLength, {css:{opacity:1}, ease:transitionType});
		}

		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top) + audioHolder.getAudioShim());
		if(isIE){
			$("#contentHolder").css("margin-bottom", "-16px");
		}

		doAccess(pageAccess_arr);
	}


	function showUserAnswer(){
		var tempCorrect = false;
		for(var i = 0; i < questionResponse_arr.length; i++){
			if(currentPageID == questionResponse_arr[i].id){
				var temp_arr = questionResponse_arr[i].userAnswer;
				if(questionResponse_arr[i].complete){
					$("#slider").slider( "disable" );
					$("#slider").slider( "option", "value", parseFloat(temp_arr[0]) );
					$('#display').val( $('#slider').slider("value") );
				}
				
				var tempCorrect = questionResponse_arr[i].correct;
				if(tempCorrect){
					$("#display").addClass("optionCorrect");
				}
				else{
					$("#display").addClass("optionIncorrect");
				}
				break;
			}
		}

		//set SCORM objective for page - C_SCORM.js
		setPageObjective(tempCorrect, graded);

		mandatory = false;
		checkNavButtons();
	}

	function checkAnswer(){
		//////////////////////////CHECK CORRECT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		var tempCorrect = true;
		attemptsMade++;
		var _title = pageTitle.getPageTitle().replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '');

		var correctAnswer = $(data).find("page").eq(currentPage).find('slider').attr("correctanswer");

		var userAnswer = $("#display").val();//$( "#slider" ).slider( "option", "value" );

		if(parseFloat(correctAnswer) != userAnswer){
			tempCorrect = false;
		}

		setInteractions(pageId, "choice", userAnswer, tempCorrect, _title + " : " + $.trim($("#question").text()));


		//////////////////////////FEEDBACK\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		var msg = "";

		if(tempCorrect == true){
			var feedbackMsg = "";
			feedbackMsg += "<p><b>You selected</b>: " + userAnswer + ". </p>";
			var feedbackCorrectTitle = $(data).find("page").eq(currentPage).find('slider').find("correctresponse").text();
			feedbackMsg += "<p>"+ feedbackCorrectTitle.replace("<![CDATA[", "").replace("]]>", "") + "</p>";

			msg = '<div id="dialog-attemptResponse" class="correct" title="'+ feedbackCorrectTitle +'"><p> '+ feedbackMsg +'</p></div>';

			$("#mcSubmit").remove();
		}else{
			var feedbackIncorrectTitle = $(data).find("page").eq(currentPage).find('slider').find("diffeed").eq(attemptsMade-1).text();
			if(attemptsMade == attemptsAllowed){
				//incorrect feedback here
				var feedbackMsg = "";
				feedbackMsg += "<p><b>You selected</b>: " + userAnswer + ". </p>";
				feedbackMsg += "<p>" + feedbackIncorrectTitle.replace("<![CDATA[", "").replace("]]>", "") + "</p>";

				msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p> '+ feedbackMsg +'</p></div>';

				$("#mcSubmit").remove();
			}
			else{
				//try again.
				msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectTitle.replace("<![CDATA[", "").replace("]]>", "")  +'</p></div>';
			}
		}

		if(tempCorrect == true || attemptsMade == attemptsAllowed){
			var selected_arr = [];
			selected_arr.push(userAnswer);
			updateScoring(selected_arr, tempCorrect);
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
						var cont = feedbackMsg;
						var ariaText = $(cont).text().replace(/'/g, "");
						$('.ui-dialog-buttonpane').find('button:contains("Proceed")').addClass('feedback-proceed-button').attr('aria-label', ariaText + ' Press spacebar to proceed.').focus();
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
					},
					open: function(){
						$('.ui-dialog-buttonpane').find('button:contains("OK")').attr('aria-label', 'OK - That is incorrect. Please try again. Click here.').focus();
					},
					close: function(){
						$("#option0Check").focus();
					}
				});
			}
			$( "#dialog-attemptResponse" ).focus();
		}else if(feedbackDisplay == "inline"){

		}
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
			$('#sliderHolder').prepend("<div id='questionEdit' class='btn_edit_text' title='Edit Text Question'></div>");

			$("#questionEdit").click(function(){
				updateOptionDialog();
			}).tooltip();
		}
	}


	function updateOptionDialog(){

		try { $("#questionEditDialog").remove(); } catch (e) {}

		feedback = $(data).find("page").eq(currentPage).find('feedback').text();

		var msg = "<div id='questionEditDialog' title='Edit slider options'>";
		msg += "<label id='label' title='Define the number of attempts.'><b>no. of attempts: </b></label>";
		msg += "<input type='text' name='inputAttempts' id='inputAttempts' value='"+ attemptsAllowed +"' class='dialogInput' style='width:35px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label' title='Indicates if this page is graded.'><b>graded: </b></label>";
		msg += "<input id='isGraded' type='checkbox' name='graded' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label' title='Indicates if this page is must be completed before going to the next page.'><b>mandatory: </b></label>";
		msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<div id='label'><b>Input your question: </b></div>";
		msg += "<div id='questionEditText' class='dialogInput' contenteditable='true'></div>";
		msg += "<div id='inputCRLabel'><b>Correct Response Feedback: </b></div>";
		msg += "<div id='inputCorrectResponse' class='dialogInput' contenteditable='true'></div>";	
		msg += "<br/><label id='label' title='Set the values for the slider.'><b>slider configurations: </b></label><br/>";
		msg += "<label id='label' title='Define the maximum value of the slider.'><b>max: </b></label>";
		msg += "<input type='text' name='myName' id='max' value='"+ $(data).find("page").eq(currentPage).find('slider').attr("max") +"' class='dialogInput' style='width:45px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label' title='Define the minimum value of the slider.'><b>min: </b></label>";
		msg += "<input type='text' name='myName' id='min' value='"+ $(data).find("page").eq(currentPage).find('slider').attr("min") +"' class='dialogInput' style='width:45px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";		
		msg += "<label id='label' title='Determines the size or amount of each interval or step the slider takes between the min and max."+
		" The full specified value range of the slider (max - min) should be evenly divisible by the step..'><b>step: </b></label>";
		msg += "<input type='text' name='myName' id='step' value='"+ $(data).find("page").eq(currentPage).find('slider').attr("step") +"' class='dialogInput' style='width:45px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";	
		msg += "<br/><br/><label id='label' title='Initialize the slider with the value option specified.'><b>start: </b></label>";
		msg += "<input type='text' name='myName' id='start' value='"+ $(data).find("page").eq(currentPage).find('slider').attr("start") +"' class='dialogInput' style='width:45px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";	
		msg += "<label id='label' title='Define the correct slider value.'><b>correct answer: </b></label>";
		msg += "<input type='text' name='myName' id='correctanswer' value='"+ $(data).find("page").eq(currentPage).find('slider').attr("correctanswer") +"' class='dialogInput' style='width:45px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";					
		msg += "<div id='diffeedEdit'/>";

		msg += "</div>";
		$("#stage").append(msg);

		$("#questionEditText").append($(data).find("page").eq(currentPage).find('content').text().replace("<p>", "").replace("</p>", ""));
		$("#inputCorrectResponse").append($(data).find("page").eq(currentPage).find('correctresponse').text());

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

		//find every diffeed in the xml - place them on the screen
		for (var j = 0; j < $(data).find("page").eq(currentPage).find('slider').find("diffeed").length; j++){
			addDiffeed(j, false);
		};			

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

		$("#inputAttempts").change(function(){
			var displayValue = $("#inputAttempts").val();
			if(!$.isNumeric(displayValue)){
				alert("The value must be a numeric value.");
				$('#inputAttempts').val(attemptsAllowed);		
			}
		});

		$("#max").change(function(){
			var displayValue = $("#max").val();
			if(!$.isNumeric(displayValue)){
				alert("The value must be a numeric value.");
				$("#max").val($(data).find("page").eq(currentPage).find('slider').attr("max"));		
			}
		});	

		$("#min").change(function(){
			var displayValue = $("#min").val();
			if(!$.isNumeric(displayValue)){
				alert("The value must be a numeric value.");
				$("#min").val($(data).find("page").eq(currentPage).find('slider').attr("min"));		
			}
		});	

		$("#step").change(function(){
			var displayValue = $("#step").val();
			if(!$.isNumeric(displayValue)){
				alert("The value must be a numeric value.");
				$("#step").val($(data).find("page").eq(currentPage).find('slider').attr("step"));		
			}
		});

		$("#start").change(function(){
			var displayValue = $("#start").val();
			if(!$.isNumeric(displayValue)){
				alert("The value must be a numeric value.");
				$("#start").val($(data).find("page").eq(currentPage).find('slider').attr("start"));		
			}
		});	

		$("#correctanswer").change(function(){
			var displayValue = $("#correctanswer").val();
			if(!$.isNumeric(displayValue)){
				alert("The value must be a numeric value.");
				$("#correctanswer").val($(data).find("page").eq(currentPage).find('slider').attr("correctanswer"));		
			}
		});														

		//Style it to jQuery UI dialog
		$("#questionEditDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 800,
			height: 650,
			dialogClass: "no-close",
			buttons: [
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
						saveQuestionEdit(tmpObj);
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

	function addDiffeed(_addID, _isNew){
		var diffeedCount = $(data).find("page").eq(currentPage).find('slider').find("diffeed").length;
		if(_isNew == true){
			diffeedCount++;
		}
		var attemptCount = parseInt($("#inputAttempts").val());
		if(diffeedCount <= attemptCount){
			var diffeedID = "diffeed" + _addID;
			var diffeedLabel = _addID + 1;
			if(_isNew == true){
				$(data).find("page").eq(currentPage).find("slider").eq(0).append($("<diffeed>"));
				var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
				var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
				$(data).find("page").eq(currentPage).find("slider").eq(0).find("diffeed").append(difFeed1CDATA);	
			}

			var diffeedContent = $(data).find("page").eq(currentPage).find('slider').find("diffeed").eq(_addID).text();
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

	function removeDiffeed(_id){
		if($(data).find("page").eq(currentPage).find("slider").find("diffeed").length > 1){
			for(var i = 0; i < diffeedEdit_arr.length; i++){
				if(_id == $("#"+diffeedEdit_arr[i]+"Container").attr("value")){
					var arrIndex = i;
					break;
				}
			}
			$(data).find("page").eq(currentPage).find("slider").find("diffeed").eq(arrIndex).remove();
			diffeedEdit_arr.splice(arrIndex, 1);
			$("#diffeed" + _id +"Container").remove();	
		}
		else{
			alert("you must have at least one feedback.")
		}	
	}

	function makeQuestionDataStore(){
		var tmpObj = new Object();
		tmpObj.attempts = $("#inputAttempts").val();
		tmpObj.max = $("#max").val();
		tmpObj.min = $("#min").val();
		tmpObj.step = $("#step").val();
		tmpObj.start = $("#start").val();
		tmpObj.correctanswer = $("#correctanswer").val();

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

	function saveQuestionEdit(_data){
		
		var questionUpdate = _data.question;
		var questionDoc = new DOMParser().parseFromString('<content></content>', 'text/xml')
		var questionCDATA = questionDoc.createCDATASection(questionUpdate);
		$(data).find("page").eq(currentPage).find("slider").eq(0).find('content').empty();
		$(data).find("page").eq(currentPage).find("slider").eq(0).find('content').append(questionCDATA);				

		var correctResponseUpdate = _data.correctResponse;
		var correctResponseDoc = new DOMParser().parseFromString('<correctresponse></correctresponse>', 'text/xml')
		var correctResponseCDATA = correctResponseDoc.createCDATASection(correctResponseUpdate);
		$(data).find("page").eq(currentPage).find("slider").find('correctresponse').eq(0).empty();
		$(data).find("page").eq(currentPage).find("slider").find('correctresponse').eq(0).append(correctResponseCDATA);
	
		for(var i = 0; i < diffeedEdit_arr.length; i++){
			//var correctOptions = 0;
			var diffeedText = _data.diffeed_arr[i].diffeedText;
			var newDiffeed = new DOMParser().parseFromString('<diffeed></diffeed>',  "text/xml");
			var diffeedCDATA = newDiffeed.createCDATASection(diffeedText);
			$(data).find("page").eq(currentPage).find("slider").eq(0).find("diffeed").eq(i).empty();
			$(data).find("page").eq(currentPage).find("slider").eq(0).find("diffeed").eq(i).append(diffeedCDATA);

		}	

		$(data).find("page").eq(currentPage).find("slider").eq(0).attr("attempts", _data.attempts);
		$(data).find("page").eq(currentPage).find("slider").eq(0).attr("max", _data.max);
		$(data).find("page").eq(currentPage).find("slider").eq(0).attr("min", _data.min);
		$(data).find("page").eq(currentPage).find("slider").eq(0).attr("step", _data.step);
		$(data).find("page").eq(currentPage).find("slider").eq(0).attr("start", _data.start);
		$(data).find("page").eq(currentPage).find("slider").eq(0).attr("correctanswer", _data.correctanswer);		


		$(data).find("page").eq(currentPage).attr("graded", _data.graded);
		$(data).find("page").eq(currentPage).attr("mandatory", _data.mandatory);

        markIncomplete();
		sendUpdateWithRefresh();
		fadeComplete();
		
	}

	/**********************************************************************
    ** areYouSure?  Make sure that user actually intended to remove content.
    **********************************************************************/
	function areYouSure(){
		$("#stage").append('<div id="dialog-removeContent" title="Remove this item from the page."><p class="validateTips">Are you sure that you want to remove this item from your page? <br/><br/>This cannot be undone!</div>');

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
	                removeOption();
	                $(this).dialog("close");
                }
            }
        });
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