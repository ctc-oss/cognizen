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
	var myObjective = "undefined";
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
		scormVersion = $(data).find('scormVersion').attr('value');
		
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
		
		if(isComplete && mode != "edit"){
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

		//set SCORM objectives
		if(scormVersion.indexOf('USSOCOM') == -1){
			var _objId = "";
	    	if(myObjective != undefined && myObjective !== "undefined"){
	    		//console.log(i + " : " + pageObj);
	 			//check for duplicates; manipulate objective name if so (this may not work!!!!)
	 			_objId = $(data).find("lessonTitle").attr("value").replace(/\s+/g, '') +"."+
	 						pageTitle.getPageTitle().replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '')+"."+
	 						myObjective.replace(/\s+/g, '_');

	    	}

	    	if(myObjItemId != undefined && myObjItemId !== "undefined"){
	    		if(_objId.length > 0){
	    			_objId += "." + myObjItemId.replace(/\s+/g, '_').replace(/:/g, '');
	    		}
	    		else{
		 			_objId = $(data).find("lessonTitle").attr("value").replace(/\s+/g, '') +"."+
	 						pageTitle.getPageTitle().replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '')+"."+
	 						myObjItemId.replace(/\s+/g, '_').replace(/:/g, '');						    			
	    		}
	    	}

			if(_objId.length > 0){	
				if(tempCorrect && graded){
					setObjectiveSuccess(_objId, true);
				}
				else if(!tempCorrect && graded){
					setObjectiveSuccess(_objId, false);
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
				updateOptionDialog();
			}).tooltip();
		}
	}
	
	function updateOptionDialog(){
		if (CKEDITOR.instances['optionText']) {
			CKEDITOR.remove(CKEDITOR.instances['optionText']);
		}
		if (CKEDITOR.instances['feedbackEditText']) {
			CKEDITOR.remove(CKEDITOR.instances['optionText']);
		}
		
		feedback = $(data).find("page").eq(currentPage).find('feedback').text();
		var msg = "<div id='questionEditDialog' title='Create Sequencing Assessment'>";
		msg += "<label id='label'><b>no. of attempts: </b></label>";
		msg += "<input type='text' name='myName' id='inputAttempts' value='"+ attemptsAllowed +"' class='dialogInput' style='width:35px;' title='Increase the number of attempts'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'><b>graded: </b></label>";
		msg += "<input id='isGraded' type='checkbox' name='graded' class='radio' value='true' title='Indicates if this page is graded.'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'><b>mandatory: </b></label>";
		msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true' title='Indicates if this page is must be completed before going to the next page.'/><br/>";
		msg += "<label>question objective: </label>";
		msg += "<input type='text' name='myName' id='inputObjective' value='"+ myObjective +"' class='dialogInput' style='width: 440px;' title='Unique description of the objective.'/><br/>";
		msg += "<label>module or lesson mapped (highest level): </label>";
		msg += "<input type='text' name='myName' id='inputObjItemId' value='"+ myObjItemId +"' class='dialogInput' style='width: 400px;' title='Name of the modules or lesson the objective is mapped to.'/><br/>";
		msg += "<div id='feedbackLabel'><b>Input your feedback:</b></div>";
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
		
		if(feedbackType == "undifferentiated"){
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
		}
		
		updateRevealMenu();
		
		//find every option in the xml - place them on the screen.
		addOption(currentEditBankMember, false);
				
		//Style it to jQuery UI dialog
		$("#questionEditDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 800,
			height: 650,
			dialogClass: "no-close",
			buttons: {
				Add: function(){
					try { $("#optionContainer").remove(); } catch (e) {}
					addOption(optionCount, true);
					updateRevealMenu();	
				},
				Done: function(){
					makeRevealDataStore();
					saveRevealEdit();
					$( this ).dialog( "close" );
				}
			},
			close: function(){
				$("#questionEditDialog").remove();
				if (CKEDITOR.instances['optionText']) {
		            CKEDITOR.remove(CKEDITOR.instances['optionText']);
		        }
		        if (CKEDITOR.instances['feedbackEditText']) {
		            CKEDITOR.remove(CKEDITOR.instances['optionText']);
		        }
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
			var cleanText = $(data).find("page").eq(currentPage).find("reveal").eq(h).find("content").text().replace(/<\/?[^>]+(>|$)/g, "");//////////////////////Need to clean out html tags.....
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
		console.log("ended");
	}
	
	function makeRevealDataStore(){
		myObjective = $("#inputObjective").val();
		myObjItemId = $("#inputObjItemId").val();
		
		attemptsAllowed = $("#inputAttempts").val();
		$(data).find("page").eq(currentPage).attr("attempts", attemptsAllowed);
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
	
	function removeOption(){
		if(optionCount > 1){
			$(data).find("pages").eq(currentPage).find("option").eq(currentEditBankMember).remove();
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
		msg += "<label id='label'><b>correct:</b></label>";
		msg += "<label id='label'>Option " + optionLabel + " Order #: </label>";
		msg += "<input type='text' name='myMatch' id='optionCorrect' value='"+ $(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct") +"' class='dialogInput' style='width:35px; text-align:center;' title='Indicates the order of the option.'/><br/>";
		
		msg += "</div>";
				
		$("#questionEditDialog").append(msg);
		
		$("#optionRemove").on('click', function(){
			removeOption($(this).attr("value"));
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
		var extra = $(data).find("page").eq(currentPage).find("reveal").length;
		var active = optionCount;
		//var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("reveal").eq(i).remove();
		}
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