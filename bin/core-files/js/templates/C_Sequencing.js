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
	var marking_arr;
	var tempCorrect = true;

    var optionStatementY = 0;
    var isComplete = false;
    var graded = false;
    var mandatory = true;
    var order_arr = [];
    var scormVersion;

    var currentEditBankMember = 0;
	var revealMenu_arr = [];
	var currentItem;

    //Defines a public method - notice the difference between the private definition below.
	this.initialize= function(){
		//Clear accessibility on page load.
        pageAccess_arr = [];
        audioAccess_arr = [];
        
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
		scormVersion = $(data).find('scormVersion').attr('value');

		if($(data).find("page").eq(currentPage).attr('graded') == "true"){
			graded = true;
		}
		if($(data).find("page").eq(currentPage).attr('mandatory') == "false" || $(data).find("page").eq(currentPage).attr('mandatory') == undefined){
			mandatory = false;
		}

		pageTitle = new C_PageTitle();

		var msg = '<div id="scrollableContent" class="antiscroll-wrap matching">';
		msg += '<div class="box">';
		msg += '<div id="contentHolder" class="overthrow antiscroll-inner">';
		msg += '<div id="question" class="questionTop"></div>';
		msg += '<div id="sequenceHolder" class="sequenceHolder" role="application">';
		msg += '</div></div></div></div>';

		try { audioHolder.destroy(); } catch (e) {}
		audioHolder = new C_AudioHolder();

		$('#stage').append(msg);

		//Set Question
		myContent = $(data).find("page").eq(currentPage).find('question').text();
		$("#question").append(myContent);

		placeOptions();
		
	}

	function keyboardUp(_id){
		console.log(_id);
		isRefresh = true;
		var holder = order_arr.splice(_id, 1);
		order_arr.splice(_id+1, 0, holder);
		$("#sortable").remove();
		placeOptions();
	}
	
	function keyboardDown(_id){
		if(_id >= 1){
			isRefresh = true;
			var holder = order_arr.splice(_id, 1);
			order_arr.splice(_id-1, 0, holder);
			$("#sortable").remove();
			placeOptions();
		}
	}
	
	var isRefresh = false;
	var currentAccActive = null;	
	
	function placeOptions(){
		////Place each option within the container $('#options') - this allows for easier cleanup, control and tracking.
		var iterator = 0;

		if(!isRefresh){
			if(isComplete/* && mode != "edit"*/){
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
			isRefresh = false;
		}

		var msg = "<div id='sortable' style='list-style-type: none;'>";
		for(var j = 0; j < order_arr.length; j++){
			var myNode = $(data).find("page").eq(currentPage).find("option").eq(order_arr[j]);
			//Create unique class name for each option
			var myOption = "option" + j;
			//Create each option as a div.
			//myNode.attr("correct")
			msg += '<div class="sequenceOption" id="' + myOption + '" aria-label="'+myNode.find("content").text()+' to move this item press u to move up or d to move down" data="'+j+'" value="' + myNode.attr("correct")+ '">' +myNode.find("content").text() +'</div>';
		}
		msg += "</div>"
		$('#sequenceHolder').append(msg);
		$( "#sortable" ).sortable();
		$( "#sortable" ).disableSelection();
		
		//Accessibility stuff
		for(var j = 0; j < order_arr.length; j++){
			pageAccess_arr.push($("#option" + j));
			$("#option" + j).keypress(function(event) {
				var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
				 switch(chCode) {
				    case 117:
				    	currentAccActive = $(this).attr('value');
				    	keyboardDown($(this).attr('data'));
				    	break;
				    case 100:
				    	currentAccActive = $(this).attr('value');
				    	keyboardUp($(this).attr('data'));
				    	break;
				    default:
				        break;
				}
        	});
		}
		
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
		doAccess(pageAccess_arr, true);
		
		if(currentAccActive != null){
			for (var i = 0; i < order_arr.length; i++){
				console.log($("#option"+i).attr("value"));
				if(currentAccActive == $("#option"+i).attr("value")){
					$("#option"+i).focus();
					break;
				}
			}
		}
	}


	function placematchingSubmit(){
		$("#contentHolder").append('<div id="mcSubmit"></div>');
		$("#mcSubmit").button({ label: $(data).find("page").eq(currentPage).attr("btnText")/*, disabled: true*/ });
		$("#mcSubmit").click(checkAnswer).keypress(function(event) {
			var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
			if (chCode == 32 || chCode == 13){
				$(this).click();
			}
		});
		pageAccess_arr.push($("#mcSubmit"));
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

		//set SCORM objective for page - C_SCORM.js
		setPageObjective(tempCorrect, graded);

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
		if(isMobile){
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
			$( "#dialog-attemptResponse" ).focus();
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
				updateOptionDialog();
			}).tooltip();
		}
	}

	function updateOptionDialog(){
		clearCKInstances();

		try { $("#questionEditDialog").remove(); } catch (e) {}
		feedback = $(data).find("page").eq(currentPage).find('feedback').text();
		var msg = "<div id='questionEditDialog' title='Create Sequencing Assessment'>";
		msg += "<label id='label' title='Increase the number of attempts'><b>no. of attempts: </b></label>";
		msg += "<input type='text' name='myName' id='inputAttempts' value='"+ attemptsAllowed +"' class='dialogInput' style='width:35px;'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += '<span id="attemptsError" class="error">The value must be a numeric value</span><br/>';
		msg += "<label id='label' title='Indicates if this page is graded.'><b>graded: </b></label>";
		msg += "<input id='isGraded' type='checkbox' name='graded' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label' title='Mandatory means that interactives on this page must be completed before proceeding. (disabled in edit mode).'><b>mandatory: </b></label>";
		msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true'/><br/>";
		msg += "<div id='feedbackLabel' title='Feedback that will be displayed to users upon completing the sequence.'><b>Input your feedback:</b></div>";
		msg += "<div id='feedbackEditText' type='text' contenteditable='true' class='dialogInput'>" + feedback + "</div><br/>";
		msg += "<div id='questionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Option Item Menu: </b></label></div><br/><br/>";
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

		try { CKEDITOR.inline( "feedbackEditText", {
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
		});} catch (e) {}

		//#3230
		$('#inputAttempts').on('change', function(){
			if(!$.isNumeric($('#inputAttempts').val())){
				$('#attemptsError').removeClass('error').addClass('error_show');
				$('#inputAttempts').val(attemptsAllowed);		
			}
			else{
				if($('#attemptsError').hasClass('error_show')){
					$('#attemptsError').removeClass('error_show').addClass('error');
				}
			}		
		});

		updateRevealMenu();

		addOption(currentEditBankMember, false);

		//Style it to jQuery UI dialog
		$("#questionEditDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 800,
			height: 650,
			dialogClass: "no-close",
			buttons: [
				{
					text: "Add",
					title: "Add a new sequencing item.",
					click: function(){
						makeRevealDataStore();
						//clearCKInstances();
						if (CKEDITOR.instances['optionText']) {
				            CKEDITOR.instances.optionText.destroy();
				        }
						try { $("#optionContainer").remove(); } catch (e) {}
						addOption(optionCount, true);
						updateRevealMenu();
					}
				},
				{
					text:"Done",
					title: "Close this dialog.",
					click: function(){
						makeRevealDataStore();
						clearCKInstances();
						saveRevealEdit();
						$('#questionEditDialog').dialog( "close" );
					}
				}
			],
			close: function(){
				$("#questionEditDialog").remove();
			}
		});

		//adds tooltips to the edit dialog buttons
	    $('button').eq(1).attr('title', 'Adds a new sequencing option.');
	    $('button').eq(2).attr('title', 'Closes the edit dialog.');
	    $(function () {
	        $(document).tooltip();
	    });
	}

	function updateRevealMenu(){
		console.log("started");
		revealMenu_arr = [];
		$(".questionBankItem").remove();
		var msg = "";
		for(var h = 0; h < optionCount; h++){
			var label = parseInt(h + 1);
			var tmpID = "revealItem"+h;
			msg += "<div id='"+tmpID+"' class='questionBankItem";
			if(currentEditBankMember == h){
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
			console.log("cleanText = " + cleanText);
			msg += "' data-myID='" + h + "' title='" + cleanText + "'>" + label + "</div>";

			revealMenu_arr.push(tmpID);
		}

		$("#questionMenu").append(msg);

		for(var j = 0; j < revealMenu_arr.length; j++){
			if(currentEditBankMember != j){
				var tmpID = "#" + revealMenu_arr[j];
				$(tmpID).click(function(){
					makeRevealDataStore();
					$('#bankItem'+ currentEditBankMember).removeClass("selectedEditBankMember").addClass("unselectedEditBankMember");
					$(this).removeClass("unselectedEditBankMember").addClass("selectedEditBankMember");
					$("#questionEditDialog").remove();
					currentEditBankMember = $(this).attr("data-myID");
					updateOptionDialog();
				}).tooltip();
			}
		}
	}

	function makeRevealDataStore(){
		attemptsAllowed = $("#inputAttempts").val();
		$(data).find("page").eq(currentPage).attr("attempts", attemptsAllowed);

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

		var newFeedbackContent = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
		var newRevealContent = new DOMParser().parseFromString('<option></option>',  "text/xml");
		var revealCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["optionText"].getData());
		$(data).find("page").eq(currentPage).find("option").eq(currentEditBankMember).find("content").empty();
		$(data).find("page").eq(currentPage).find("option").eq(currentEditBankMember).find("content").append(revealCDATA);
		var feedbackCDATA = newFeedbackContent.createCDATASection(CKEDITOR.instances["feedbackEditText"].getData());
		$(data).find("page").eq(currentPage).find("feedback").empty();
		$(data).find("page").eq(currentPage).find("feedback").append(feedbackCDATA);
		$(data).find("page").eq(currentPage).find("option").eq(currentEditBankMember).attr("correct", $("#optionCorrect").val());
		//$(data).find("page").eq(currentPage).find("option").eq(currentEditBankMember).attr("correct", $("#optionCorrect").val());
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

	function removeOption(){
		if(optionCount > 1){
			$(data).find("page").eq(currentPage).find("option").eq(currentEditBankMember).remove();
			$("#optionContainer").remove();
			optionCount--;
			currentEditBankMember = 0;
			updateOptionDialog();
		}else{
			alert("you must have at least one bank item.");
		}
	}

	function addOption(_addID, _isNew){

		var optionLabel = parseInt(_addID) + 1;

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

			currentEditBankMember = _addID;
			optionCount++;
		}

		var optionContent = $(data).find("page").eq(currentPage).find("option").eq(_addID).find("content").text();
		var msg = "<div id='optionContainer' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='optionRemove' class='removeMedia' value='"+_addID+"' title='Click to remove this option'/>";
		msg += "<div id='optionInput' style='padding-bottom:5px;'><b>Option " + optionLabel + ":</b></div>";
		msg += "<div id='optionText' contenteditable='true' class='dialogInput'>" + optionContent + "</div>";
		msg += "<label id='label' title='Indicates the correct position of the option in the sequence order.'><b>Correct position in sequence:</b> </label>";
		msg += "<input type='text' name='myMatch' id='optionCorrect' value='"+ $(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct") +"' class='dialogInput' style='width:35px; text-align:center;'/><br/>";

		msg += "</div>";

		$("#questionEditDialog").append(msg);

		$("#optionRemove").on('click', function(){
			areYouSure();
		});

		CKEDITOR.inline( "optionText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
		   	on: {
		      instanceReady: function(event){
		         $(event.editor.element.$).attr("title", "Click here to edit this option text.");
		    	}
		    }
		});
	}

	function clearCKInstances(){
		if (CKEDITOR.instances['optionText']) {
            CKEDITOR.instances.optionText.destroy();
        }
        if (CKEDITOR.instances['feedbackEditText']) {
            CKEDITOR.instances.feedbackEditText.destroy();
        }
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
	**Save Reveal Edit
	**********************************************************************/
	/**saveRevealEdit
	* Sends the updated content to node.
	*/
	function saveRevealEdit(){
		var extra = $(data).find("page").eq(currentPage).find("option").length;
		var active = optionCount;
		//var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("option").eq(i).remove();
		}

		markIncomplete();
		sendUpdateWithRefresh();
		fadeComplete();
	};



	this.destroySelf = function() {
		 TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:Power2.easeIn, onComplete:fadeComplete});
    }

    this.fadeComplete = function(){
        	fadeComplete();
	}
    // fadeComplete() moved to C_UtilFunctions.js
}