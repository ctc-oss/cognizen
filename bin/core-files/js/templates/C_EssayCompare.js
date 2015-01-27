/*!
 * C_TextInput
 * This class creates a template for TextInput questions.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2014-4-28
 * JavaScript
 *
 * Copyright (c) 2014, CTC. All rights reserved. 
 * 
 * @author: Tyler Shumaker, shumaket@ctc.com
 * 
 * This function allows for multiple parameters including:
 * 		1. 
 */
function C_EssayCompare(_type) {
	var type = _type;
    var myContent;//Body
    var questionCount = 0;
    var graded = false;
    var mandatory = true;
    var myObjective = "undefined";
    var myObjItemId = "undefined";
    var feedbackDisplay;
    var scormVersion;
	var isComplete = false;
 
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

		feedbackDisplay = $(data).find("page").eq(currentPage).attr('feedbackdisplay');
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

		var msg = '<div id="scrollableContent" class="antiscroll-wrap text">';
		msg += '<div class="box">'
		msg += '<div id="contentHolder" class="overthrow antiscroll-inner">';
		msg += '<div id="essayCompareHolder" class="essayCompareHolder"></div>';
		msg += '</div></div></div>';		

		try { audioHolder.destroy(); } catch (e) {}
		
		audioHolder = new C_AudioHolder();
		
		$('#stage').append(msg);
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		if(isIE){
			$("#contentHolder").css("margin-bottom", "-16px");
		}

		//Set Question
		myContent = $(data).find("page").eq(currentPage).find('question').text();
		var question = myContent + '<div id="essayInputHolder"><textarea rows="12" cols="50" name="essayInput" id="essayInput"></textarea></div>';

		$("#essayCompareHolder").append(question);

		if(isComplete){
			for(var i = 0; i < questionResponse_arr.length; i++){
				if(currentPageID == questionResponse_arr[i].id){
					$("#essayInput").val(questionResponse_arr[i].userAnswer[0]);
					$("#essayInput").attr('readonly','readonly');
				}
			}
			_addExpertResponse();
		}

		if(!isComplete){
			$("#contentHolder").append('<div id="mcSubmit"></div>');
			$("#mcSubmit").button({ label: $(data).find("page").eq(currentPage).attr("btnText")/*, disabled: true*/ });
			//$('#mcSubmit').css({"top": "300px"});
			$("#mcSubmit").click(checkEssay);	
		}
		else{
			mandatoryInteraction = false;
			checkNavButtons();
		}
		
		pageAccess_arr.push($("#essayInput"));
		pageAccess_arr.push($("#mcSubmit"));
		
		checkMode();

		if(transition == true){
			TweenMax.to($("#stage"), transitionLength, {css:{opacity:1}, ease:transitionType});
		}
		doAccess(pageAccess_arr);
	}

	function checkEssay(){
		var msg = '';
		if($('#essayInput').val() === ""){
			msg = '<div id="dialog-attemptResponse" class="correct" >Please answer the question in the text box.</div>';	
		}
		else{
			$("#mcSubmit").remove();
			var feedback = $(data).find("page").eq(currentPage).find('feedback').text();

			_addExpertResponse();

			msg = '<div id="dialog-attemptResponse" class="correct" >'+feedback+'</div>';
			$("#essayInput").attr('readonly','readonly');

			var _selected_arr = [];
			_selected_arr.push($('#essayInput').val());

			//set SCORM objectives
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
				_objId += "_id";
				if(graded){
					setObjectiveSuccess(_objId, true);
				}
			}	


			updateScoring(_selected_arr, true);

			mandatoryInteraction = false;
			checkNavButtons();	

		}

		$("#stage").append(msg);

		if(feedbackDisplay == "pop"){
			var standardWidth = 550;
			if(standardWidth > windowWidth){
				standardWidth = windowWidth-20;
			}
			$( "#dialog-attemptResponse" ).dialog({
				modal: true,
				width: standardWidth,
				dialogClass: "no-close",
				buttons: {
					OK: function(){
						$( this ).dialog( "close" );
						$("#dialog-attemptResponse").remove();
						if($('#essayInput').val() === ""){
							$("#essayInput").focus();
						}else{
							$("#expertResponse").focus();
						}
					}
				}
			});
			$( "#dialog-attemptResponse" ).focus();
		}else if(feedbackDisplay == "inline"){
			
		}				
	}

	function _addExpertResponse(){
		var correctResponse = $.trim($(data).find("page").eq(currentPage).find('correctresponse').text()).replace("<![CDATA[", "").replace("]]>", "").replace(/<br.*?>/g, "\u2028");
		var expert = '<div id="expertResponseHolder"><textarea rows="12" cols="50" name="expertResponse" id="expertResponse" tabindex=0 readOnly="readonly">'+ correctResponse +'</textarea></div>';
		$("#essayCompareHolder").append(expert);		
	}

	///////////////////////////////////////////////

	function checkMode(){
		$('.antiscroll-wrap').antiscroll();
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top) + audioHolder.getAudioShim());
		//
		if(mode == "edit"){		
			/*******************************************************
			* Edit Question
			********************************************************/
	        //Add and style titleEdit button
			$('#essayCompareHolder').prepend("<div id='questionEdit' class='btn_edit_text' title='Edit Text Question'></div>");
			$("#questionEdit").click(function(){
				updateQuestionEditDialog();
			}).tooltip();
		}
	}	

	function updateQuestionEditDialog(){
		var msg = "<div id='questionEditDialog' title='Create Essay Compare Question'>";
		msg += "<label id='label'><b>graded: </b></label>";
		msg += "<input id='isGraded' type='checkbox' name='graded' class='radio' value='true' title='Indicates if this page is graded.'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		msg += "<label id='label'><b>mandatory: </b></label>";
		msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true' title='Indicates if this page is must be completed before going to the next page.'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</br>";
		msg += "<label style='position: relative; float: left; vertical-align:middle; line-height:30px;'>question objective: </label>";
		msg += "<input type='text' name='myName' id='inputObjective' value='"+ myObjective +"' class='dialogInput' style='width: 440px;' title='Unique description of the objective.'/><br/><br/>";
		msg += "<label style='position: relative; float: left; vertical-align:middle; line-height:30px;'>module or lesson mapped (highest level): </label>";
		msg += "<input type='text' name='myName' id='inputObjItemId' value='"+ myObjItemId +"' class='dialogInput' style='width: 440px;' title='Name of the modules or lesson the objective is mapped to.'/><br/><br/>";		
		msg += "<div id='label'><b>Input your question: </b></div>";
		msg += "<div id='questionEditText' class='dialogInput' contenteditable='true'></div>";
		msg += "<div id='inputCRLabel'><b>Expert Response: </b></div>";
		msg += "<div id='inputCorrectResponse' class='dialogInput' contenteditable='true'></div>";
		msg += "<div id='inputFeedbackLabel'><b>Feedback: </b></div>";
		msg += "<div id='inputFeedback' class='dialogInput' contenteditable='true'></div>";			
		msg += "</div><br/>"

		$("#stage").append(msg);

		$("#questionEditText").append($(data).find("page").eq(currentPage).find("question").text());
		$("#inputCorrectResponse").append($(data).find("page").eq(currentPage).find("correctresponse").text());
		$("#inputFeedback").append($(data).find("page").eq(currentPage).find("feedback").text());

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
		         $(event.editor.element.$).attr("title", "Click here to edit the expert response.");
		    	}
		    }			
		});

		CKEDITOR.inline( "inputFeedback", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
		   	on: {
		      instanceReady: function(event){
		         $(event.editor.element.$).attr("title", "Click here to edit the feedback.");
		    	}
		    }			
		});		

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

		//Style it to jQuery UI dialog
		$("#questionEditDialog").dialog({
			autoOpen: true,
			dialogClass: "no-close",
			modal: true,
			width: 875,
			height: 650,
			buttons: {
				Done: function(){
					var tmpObj = makeQuestionDataStore();
					saveQuestionEdit(tmpObj);
					$("#questionEditDialog").dialog("close");
				}
			},
			close: function(){
				$("#questionEditDialog").remove();
			}
		});	

		//adds tooltips to the edit dialog buttons
	    $('button').eq(3).attr('title', 'Saves and closes the edit dialog.');
	    $(function () {
	        $(document).tooltip();
	    });

	}	

	function makeQuestionDataStore(){
		var tmpObj = new Object();
		tmpObj.objective = $("#inputObjective").val();
		tmpObj.objItemId = $("#inputObjItemId").val();
		tmpObj.correctResponse = CKEDITOR.instances["inputCorrectResponse"].getData();
		try{ CKEDITOR.instances["inputCorrectResponse"].destroy() } catch (e) {}

		tmpObj.feedback = CKEDITOR.instances["inputFeedback"].getData();
		try{ CKEDITOR.instances["inputFeedback"].destroy() } catch (e) {}		

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

		return tmpObj;
	}

	function saveQuestionEdit(_data){
		
		var questionUpdate = _data.question;
		var questionDoc = new DOMParser().parseFromString('<question></question>', 'text/xml')
		var questionCDATA = questionDoc.createCDATASection(questionUpdate);
		$(data).find("page").eq(currentPage).find("question").empty();
		$(data).find("page").eq(currentPage).find("question").append(questionCDATA);				

		var correctResponseUpdate = _data.correctResponse;
		var correctResponseDoc = new DOMParser().parseFromString('<correctresponse></correctresponse>', 'text/xml')
		var correctResponseCDATA = correctResponseDoc.createCDATASection(correctResponseUpdate);
		$(data).find("page").eq(currentPage).find('correctresponse').eq(0).empty();
		$(data).find("page").eq(currentPage).find('correctresponse').eq(0).append(correctResponseCDATA);

		var feedbackUpdate = _data.feedback;
		var feedbackDoc = new DOMParser().parseFromString('<feedback></feedback>', 'text/xml')
		var feedbackCDATA = feedbackDoc.createCDATASection(feedbackUpdate);
		$(data).find("page").eq(currentPage).find('feedback').eq(0).empty();
		$(data).find("page").eq(currentPage).find('feedback').eq(0).append(feedbackCDATA);		

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

		sendUpdateWithRefresh();
		fadeComplete();
		
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////END ACCESSIBILITY

	this.destroySelf = function() {
		 TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:Power2.easeIn, onComplete:fadeComplete});
    }
    
    this.fadeComplete = function(){
        	fadeComplete();
	}			
}