/*!
 * C_Completion
 * VERSION: Version 1.0
 * DATE: 2014-01-10
 * JavaScript
 *
 * Copyright (c) 2014, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_Completion(_type) {
	var type = _type;
    // var pageTitle;
    // var mediaHolder;
    var mySidebar;
    var myContent;//Body
    // var audioHolder;
    var completed = true;
    var scoreText;
    var score_obj;
    var isScored;
    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    INITIALIZE AND BUILD TEMPLATE
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.initialize = function(){
    	//transition variable in C_Engine - set in content.xml
        if(transition == true){
        	$('#stage').css({'opacity':0});
        }

		//evaluate score
		isScored = $(data).find('scored').attr('value');
		if(isScored === "true"){
			score_obj = getFinalScore();
			
			if(score_obj.passed){
				scoreText = '<p class="completionText">You received a passing score for this lesson. ';
			}else{
				scoreText = '<p class="completionText">You did not receive a passing score for this lesson. ';
			}
			scoreText += 'The minimum score is ' + score_obj.minScore + '%.</p>';
			scoreText += '<p class="completionText">You answered ' + score_obj.correctQuestions + ' out of ' + score_obj.totalQuestions + ' questions correctly.</p>';
			scoreText += '<p class="completionText">Your total score is ' + score_obj.scorePercent + '%. </p>';
		}
		
		var trackedObjectives = false;
		//array used to track objectives for duplicates
		var remediationObjectives = [];
		var displayRemedObj = "";
		if(doScorm()){
			//get objectives, display ones with objectives.n.success_status == failed; only do link if choiceValid(lesson)
			var scormObjectives = getObjectives();
			for (var i = 0; i < scormObjectives.length; i++) {
				var tmpObject = scormObjectives[i];
				if(tmpObject.id != "undefined"){
					trackedObjectives = true;
					if(tmpObject.successStatus == "failed"){
						//check for duplicates
						if($.inArray(tmpObject.id, remediationObjectives) == -1){
							remediationObjectives.push(tmpObject.id);
							if(tmpObject.objItemId != "undefined" && choiceValid(tmpObject.objItemId)){
								displayRemedObj += "<li class='completionText'><a href='javascript:;' onclick='choice(\""+tmpObject.objItemId+"\")'>"+tmpObject.id+"</a></li>";
							}
							else{
								displayRemedObj += "<li class='completionText'>"+tmpObject.id+"</li>";
							}							
						}
					}
				}
				else if(tmpObject.objItemId != "undefined"){
					trackedObjectives = true;
						if(tmpObject.successStatus == "failed"){
							//check for duplicates
							if($.inArray(tmpObject.id, remediationObjectives) == -1){
								remediationObjectives.push(tmpObject.objItemId);
								if(choiceValid(tmpObject.objItemId)){
									displayRemedObj += "<li class='completionText'><a href='javascript:;' onclick='choice(\""+tmpObject.objItemId+"\")'>"+tmpObject.objItemId+"</a></li>";
								}
								else{
									displayRemedObj += "<li class='completionText'>"+tmpObject.objItemId+"</li>";
								}
							}
						}				
				}				
			}
		}
		else{
			for(var i = 0; i < questionResponse_arr.length; i++){
				if(questionResponse_arr[i].objective != "undefined"){
					trackedObjectives = true;
					if(!questionResponse_arr[i].correct){
						//check for duplicates
						if($.inArray(questionResponse_arr[i].objective, remediationObjectives) == -1){
							remediationObjectives.push(questionResponse_arr[i].objective);
							// if(questionResponse_arr[i].objItemId != "undefined"){
							// 	displayRemedObj += "<li class='completionText'><a href='javascript:;' onclick='choice(\""+questionResponse_arr[i].objItemId+"\")'>"+questionResponse_arr[i].objective+"</a></li>";
							// }
							// else{
								displayRemedObj += "<li class='completionText'>"+questionResponse_arr[i].objective+"</li>";
							// }
						}						
					}
				}
				else if(questionResponse_arr[i].objItemId != "undefined"){
					trackedObjectives = true;
						if(!questionResponse_arr[i].correct){
							//check for duplicates
							if($.inArray(questionResponse_arr[i].objItemId, remediationObjectives) == -1){
								remediationObjectives.push(questionResponse_arr[i].objItemId);
								//displayRemedObj += "<li class='completionText'><a href='javascript:;' onclick='choice(\""+questionResponse_arr[i].objItemId+"\")'>"+questionResponse_arr[i].objItemId+"</a></li>";
								displayRemedObj += "<li class='completionText'>"+questionResponse_arr[i].objItemId+"</li>";
							}
						}				
				}
			}
		}
		
		if(trackedObjectives && remediationObjectives != ""){
			scoreText += '<p class="completionText">You missed questions regarding the following objectives: ';
			scoreText += '<ul class="completionText">';
			scoreText += displayRemedObj;
			scoreText += '</ul></p>';
		}
		
		//Position the page text
        myContent = $(data).find("page").eq(currentPage).find("content").first().text();
        buildTemplate();
    }

    //Defines a private method - notice the difference between the public definitions above.
    function buildTemplate() {
		pageTitle = new C_PageTitle();
		
        //Add classes for page layouts - updatable in css
	    $("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div><div id="scoreFeedback"></div></div></div>');
		$("#scrollableContent").addClass("top");
		$("#content").append(myContent);
		$("#scoreFeedback").append(scoreText);
		
		$('<div id="completionButton">Continue</div>').insertAfter("#content");
		$("#completionButton").css({"postion": "relative", "width": "200px", "margin-left": "auto", "margin-right": "auto"});  //moved to css file
		$("#completionButton").button().click(function(){
			if(isScored === "true"){
				var _scormVersion = $(data).find('scormVersion').attr('value');
				if(_scormVersion === '1.2_CTCU' || _scormVersion === '2004_4th_USSOCOM'){
					completeLesson(score_obj.passed, score_obj.passed, score_obj.score);
				}
				else{
					completeLesson(completed, score_obj.passed, score_obj.score);
				}
			}
			else{
				completeLesson(true, true, 0);
			}
		});
        
        audioHolder = new C_AudioHolder();
        checkMode();
        
        if(transition == true){
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
        }
    }

    /*****************************************************************************************************************************************************************************************************************
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     PAGE EDIT FUNCTIONALITY
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     *****************************************************************************************************************************************************************************************************************/
     function checkMode(){
     	$(this).scrubContent();
     	$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		$('.antiscroll-wrap').antiscroll();

     	if(mode == "edit"){
           /*******************************************************
			* Edit Content
			********************************************************/
			//Add and style contentEdit button
            $("#content").attr('contenteditable', true);
            CKEDITOR.disableAutoInline = true;
			CKEDITOR.inline( 'content', {
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
				extraPlugins: 'sourcedialog',
				allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
			});
		}
	}
	
    /**********************************************************************
     **Save Content Edit - save updated content text to content.xml
     **********************************************************************/
    function saveContentEdit(_data){
        var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
        var newCDATA=docu.createCDATASection(_data);
        $(data).find("page").eq(currentPage).find("content").first().empty();
        $(data).find("page").eq(currentPage).find("content").first().append(newCDATA);
        sendUpdate();
    };
    
    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    ACESSIBILITY/508 FUNCTIONALITY
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function doAccess(){
		var tabindex = 1;

	   	$("#pageTitle").attr("tabindex", tabindex);
	   	tabindex++;
	   	/*for(var i = 0; i < buttonArray.length; i++){
		   	$(buttonArray[i]).attr("tabindex", tabindex);
		   	tabindex++;
		}*/
		$("#contentHolder").attr("tabindex", tabindex);
		tabindex++;
		$("#loader").attr("tabindex", tabindex);
	}
	//////////////////////////////////////////////////////////////////////////////////////////////////END ACCESSIBILITY

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.destroySelf = function() {
    	if(transition == true){
            TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:transitionType, onComplete:fadeComplete});
		}else{
            fadeComplete();
		}
	}

	this.fadeComplete = function(){
        	fadeComplete();
	}
	// fadeComplete() moved to C_UtilFunctions.js
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}

