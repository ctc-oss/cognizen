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
    var scoreText = '';
    var score_obj = new Object();;
    var isScored = "false";
    var scormVersion;
    var finalLesson;
    var HTMLString;
    var attemptExceeded = false;
    var review = "false";
    var attemptCount = 0;
    var resumed = false;
    var score_arr = [];
    var stringQR_arr = [];
    var lessonTitle = '';
	var remediationObjectives = [];    //array used to track objectives for duplicates
	var lms = '';
	var testReview = '';
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

		scormVersion = $(data).find('scormVersion').attr('value');
		finalLesson = $(data).find('finalLesson').attr('value');
		lessonTitle = $(data).find('lessonTitle').attr('value').replace(/\s+/g, '');
		
		if($(data).find("page").eq(currentPage).attr('review')){
			review = $(data).find("page").eq(currentPage).attr('review');
		}		
		//evaluate score
		for(var k = 0; k < $(data).find("page").length; k++){
			if($(data).find("page").eq(k).attr('graded') === "true" &&
				$(data).find("page").eq(k).attr('type') === "kc"){
				isScored = "true";
				break;
			}
		}

		//isScored = $(data).find('scored').attr('value');
		lms = $(courseData).find("course").attr("lms");

		testReview = $(courseData).find('item[name="'+$(data).find('lessonTitle').attr('value')+'"]').find('sequencing').attr('testReview');

		if(doScorm() && lms == "JKO"){
			if(scorm.get("cmi.entry") == "resume"){
				var suspend_data = scorm.get("cmi.suspend_data");
				if(suspend_data.length != 0){
					var tmpData = suspend_data.split("~");
					if(tmpData[0] !== "na"){
						var tmpscore = tmpData[0].replace(/##/g , ',').split(",");
						score_obj.passed = (tmpscore[0] === "true");
						score_obj.minScore = parseInt(tmpscore[1]);
						score_obj.correctQuestions = parseInt(tmpscore[2]);
						score_obj.totalQuestions = parseInt(tmpscore[3]);
						score_obj.scorePercent = parseInt(tmpscore[4]);
						score_obj.score = parseFloat(tmpscore[5]);
						var tmpQArray = tmpData[2].split(",");
						for (var i = 0; i < tmpQArray.length; i++) {
							stringQR_arr.push(tmpQArray[i]);
						};
						resumed = true;
					}
				}
				
			}
		}

		if(isScored === "true"){
			if(!resumed){
				score_obj = getFinalScore();
			}

			if(score_obj.passed){
				scoreText = '<p class="completionText">You received a passing score for this lesson. ';
			}else{
				scoreText = '<p class="completionText">You did not receive a passing score for this lesson. ';
			}
			scoreText += 'The minimum score is ' + score_obj.minScore + '%.</p>';
			scoreText += '<p class="completionText">You answered ' + score_obj.correctQuestions + ' out of ' + score_obj.totalQuestions + ' questions correctly.</p>';
			scoreText += '<p class="completionText">Your total score is ' + score_obj.scorePercent + '%. </p>';
			//check attempt for USSOCOM publish, using SCORM objectives
			if(doScorm() && lms == "JKO"){
				//convert score_obj to score_arr
				score_arr.push(score_obj.passed);
				score_arr.push(score_obj.minScore);
				score_arr.push(score_obj.correctQuestions);
				score_arr.push(score_obj.totalQuestions);
				score_arr.push(score_obj.scorePercent);
				score_arr.push(score_obj.score);
				score_arr = score_arr.join();
				//attemptCount = parseInt(getAttemptObjectivesCount());
				var suspend_data = scorm.get("cmi.suspend_data")
				var tmpData = suspend_data.split("~");
				if(tmpData.length > 1){
					attemptCount = parseInt(tmpData[1]);
				}

				if(!resumed){				
					//update the number here to increase or decrease attempts
					if(attemptCount + 1 == 99 ){
						if(!score_obj.passed){
							attemptExceeded = true;
						}
					}
					else{
							attemptCount = attemptCount + 1;
					}
				}
				//var tmpCount = attemptCount + 1;
				//setObjectiveSuccess("attempt_"+tmpCount, true);
						
			}			
		}
		

		//Position the page text
        myContent = $(data).find("page").eq(currentPage).find("content").first().text();
        buildTemplate();
    }


    //Defines a private method - notice the difference between the public definitions above.
    function buildTemplate() {
		pageTitle = new C_PageTitle();
		
        //Add classes for page layouts - updatable in css
	    $("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div id="contentHolder" class="overthrow antiscroll-inner">'+
	    	'<div id="preloadholder" class="mediaLoader"></div><div id="content"></div><div id="scoreFeedback"></div></div></div>');
		$("#scrollableContent").addClass("top");
		$("#preloadholder").css({'position':'absolute', 'margin-left': 'auto', 'margin-right':'auto', 'height': $("#preloadholder").height(), 'width': $("#preloadholder").width(), 'top': "0px"});
		$("#preloadholder").append("<div id='preloadholderText'>Please Wait.<br/><br/>Your media is being uploaded to the server.<br/><br/>Larger files may take a few moments.</div>");
		$("#preloadholderText").css({'position':'absolute', 'height': $("#preloadholder").height(), 'width': $("#preloadholder").width()});
		
		determineReviewList();
		
		$("#preloadholder").remove();	
		$("#content").append(myContent);
		$("#scoreFeedback").append(scoreText);
		if(attemptExceeded){
			$("#content").append("You have exceeded the attempt limit of the test. <br/>" +
				"You will need to drop the course and reenroll to retake the course. Press the \"Continue\" button to end the coures.");
		}
		else{
			if(review === "true"){
				if(remediationObjectives.length != 0){
					$("#content").empty();
					$("#content").append("Use the list below to review any missed objectives. You can come back to this module at any time to review this list. "+
					"<br/><br/>Select a module to review or select the test module to retry the test. <br/><br/>");//+
					//"<br/><br/>If you have passed the test you can use the <b>Next Lesson</b> button in the header to access the survey.  All lessons and the test must be completed to take the survey." );//press the \"Continue\" button to retry the coures.");					
				}
				else{
					$("#content").empty();
					$("#content").append("You have passed the test. Use the <b>Next Lesson</b> button in the header to access the survey.  All lessons and the test must be completed to take the survey." );				
				}

			}			
			else if(lms == "JKO" && testReview == "true"){
				$("#content").append("<br/><br/>Use the list below to review any missed objectives and press the <b>Next Lesson</b> button in the header to access the review page.");
			}
			else if(lms == "JKO"){
				$("#content").append("<br/><br/>Press the <b>Next Lesson</b> button in the header to access the next module.<br/><br/>");
			}

		}

		if(doScorm() && lms == "JKO"){
			var _objIndex = findObjective(lessonTitle +"_satisfied");
			if(isScored === "true"){

				if(attemptExceeded){
					
					scorm.set("cmi.completion_status", "incomplete");
					scorm.set("cmi.success_status", "failed");
					scorm.set("cmi.score.scaled", score_obj.score.toString());	
					scorm.set("adl.nav.request", "exitAll");
					scorm.set("cmi.exit", "normal");
					scorm.API.getHandle().Terminate("");
					//completeLesson(score_obj.passed, score_obj.passed, score_obj.score, false, true);
				}
				else{
					if(!score_obj.passed){
						// scorm.set("adl.nav.request", "{target=Module10FinalTest_id}jump");
						// scorm.set("cmi.location", $(data).find("page").eq(0).attr("id"));
						// scorm.set("cmi.suspend_data", "na~"+attemptCount);
						// scorm.set("cmi.completion_status", "incomplete");
						// scorm.set("cmi.exit", "suspend");
						// scorm.API.getHandle().Terminate("");
						
						scorm.set("cmi.location", $(data).find("page").eq(0).attr("id"));
						// scorm.set("cmi.suspend_data", "na~"+attemptCount);
						scorm.set("cmi.completion_status", "incomplete");
						scorm.set("cmi.success_status", "failed");
						scorm.set("cmi.score.scaled", score_obj.score.toString());
						scorm.set("cmi.objectives."+_objIndex+".success_status", "failed");
						scorm.set("cmi.objectives."+_objIndex+".completion_status", "incomplete");
						//scorm.set("adl.nav.request", "continue");																	
						scorm.set("cmi.exit", "suspend");
						scorm.API.getHandle().Terminate("");								
					}
					else{
						
						//scorm.set("cmi.location", $(data).find("page").eq(0).attr("id"));
						//scorm.set("cmi.suspend_data", "na~"+attemptCount);
						scorm.set("cmi.completion_status", "completed");
						scorm.set("cmi.success_status", "passed");
						scorm.set("cmi.score.scaled", score_obj.score.toString());	
						scorm.set("cmi.objectives."+_objIndex+".success_status", "passed");
						scorm.set("cmi.objectives."+_objIndex+".completion_status", "completed");
						//have to satisfy all objectives
						var num = parseInt(scorm.get("cmi.objectives._count"));
						for (var i=0; i < num; ++i) {
							scorm.set("cmi.objectives."+i+".success_status", "passed");
						}							
						//scorm.set("adl.nav.request", "continue");
						scorm.set("cmi.exit", "normal");
						scorm.API.getHandle().Terminate("");
					}
					//completeLesson(score_obj.passed, score_obj.passed, score_obj.score, !score_obj.passed, false);
				}

			}
			else{
				//completeLesson(true, true, 0, false, false);

				//scorm.set("cmi.location", $(data).find("page").eq(0).attr("id"));
				//scorm.set("cmi.suspend_data", "na~"+attemptCount);
				scorm.set("cmi.completion_status", "completed");
				scorm.set("cmi.success_status", "passed");
				scorm.set("cmi.objectives."+_objIndex+".success_status", "passed");
				scorm.set("cmi.objectives."+_objIndex+".completion_status", "completed");
				//scorm.set("cmi.score.scaled", score_obj.score.toString());	
				//scorm.set("adl.nav.request", "continue");					
				//scorm.set("cmi.exit", "normal");
				//scorm.API.getHandle().Terminate("");					
			}
		}
		else if(doScorm() && lms != "JKO"){
			$('<div id="completionButton">Continue</div>').insertAfter("#scoreFeedback");
			$("#completionButton").css({"width": "200px"});  //moved to css file
			$("#completionButton").button().click(function(){
				var _objIndex = findObjective(lessonTitle +"_satisfied");
				if(isScored === "true"){
					if(scormVersion === '1.2_CTCU') {
						completeLesson(score_obj.passed, score_obj.passed, score_obj.score, false, false);
					}
					else{
						completeLesson(completed, score_obj.passed, score_obj.score, false, false);
					}
				}
				else{
					completeLesson(true, true, 0, false, false);		
				}
			});
		}
		else if(scormVersion.indexOf('none') != -1){
			$('<div id="completionButton">Return to Main Menu</div>').insertAfter("#scoreFeedback");
			$("#completionButton").css({"width": "260px"});  //moved to css file
			$("#completionButton").button().click(function(){
				parent.history.back();
				return false;
			});
		}

		// if(scormVersion.indexOf('USSOCOM') != -1 && finalLesson === 'true'){
		// 	$('<div id="printButton">Print</div>').insertAfter("#scoreFeedback");
		// 	$("#printButton").css({"postion": "relative", "width": "200px", "margin-left": "auto", "margin-right": "auto"});  //moved to css file
		// 	$("#printButton").button().click(function(){
		// 		newWin = window.open();
		// 		newWin.document.write(HTMLString);
		// 		newWin.focus();
		// 		newWin.print();
		// 		newWin.close();
		// 	});
		// }		
        
        audioHolder = new C_AudioHolder();
        checkMode();
        
        if(transition == true){
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
        }
    }

    function determineReviewList(){
		var trackedObjectives = false;
		var displayRemedObj = "";
		var displayRemedObjAlt = "";

		if(doScorm()) {//&& scormVersion.indexOf('USSOCOM') == -1){
			//get objectives, display ones with objectives.n.success_status == failed; only do link if choiceValid(lesson)
			var scormObjectives = getObjectives();
			if(scormObjectives.length > 0){
				for (var i = 0; i < scormObjectives.length; i++) {
					var tmpObject = scormObjectives[i];
					if(tmpObject.id != "undefined"){
						trackedObjectives = true;
						if(tmpObject.successStatus == "failed"){
							//check for duplicates
							if($.inArray(tmpObject.id, remediationObjectives) == -1){
								remediationObjectives.push(tmpObject.id);
								var split = tmpObject.id.split("%20id");
								// if(tmpObject.objItemId != "undefined" && choiceValid(tmpObject.objItemId)){
								// 	var split = tmpObject.objItemId.split("id");
								// 	//displayRemedObj += "<li class='completionText'><a href='javascript:;' onclick='choice(\""+split[0]+"\")'>"+tmpObject.id+"</a></li>";
								// 	displayRemedObj += "<li class='completionText'><a href='javascript:;' onclick='jump(\""+split[0]+"\",\""+score_arr+"\", "+attemptCount+")'>"+tmpObject.id+"</a></li>";
									
								// }
								// else{
								if($(courseData).find('item[id="'+decodeURIComponent(split[0])+'"]').attr('name') != undefined){
									var itemName = $(courseData).find('item[id="'+decodeURIComponent(split[0])+'"]').attr('name');	
									var itemTlo = $(courseData).find('item[id="'+decodeURIComponent(split[0])+'"]').attr('tlo');									
									displayRemedObj += "<li class='completionText'>"+itemName+" : "+itemTlo +"</li>";
								}	
								else{
									displayRemedObj += "<li class='completionText'>"+decodeURIComponent(tmpObject.id)+"</li>";
								}
								//}							
							}
						}
					}
					else if(tmpObject.objItemId != "undefined"){
						trackedObjectives = true;
							if(tmpObject.successStatus == "failed"){
								//check for duplicates
								if($.inArray(tmpObject.id, remediationObjectives) == -1){
									remediationObjectives.push(tmpObject.objItemId);
									var split = tmpObject.objItemId.split("_id");
									//  if(choiceValid(tmpObject.objItemId)){
									// 	//displayRemedObj += "<li class='completionText'><a href='javascript:;' onclick='choice(\""+split[0]+"\")'>"+split[0]+"</a></li>";
									// 	displayRemedObj += "<li class='completionText'><a href='javascript:;' onclick='jump(\""+split[0]+"\",\""+score_arr+"\", "+attemptCount+")'>"+split[0]+"</a></li>";
									// }
									// else{
									var itemName = $(courseData).find('item[id="'+decodeURIComponent(split[0])+'"]').attr('name');	
									var itemTlo = $(courseData).find('item[id="'+decodeURIComponent(split[0])+'"]').attr('tlo');									
										displayRemedObj += "<li class='completionText'>"+itemName+" : "+itemTlo +"</li>";
									//}
								}
							}				
					}				
				}
			}
		}
		else{

			// for(var i = 0; i < questionResponse_arr.length; i++){
			// 	//should try this
			// 	//stringQR_arr.push(JSON.stringify(questionResponse_arr[i]).encodeURIComponent());
			// }
			//use this for SOCOM, push 4 things separated by | as string to stringQR_arr, use to build displayRemedObj, parse at start and read in.  
			if(stringQR_arr.length == 0){

				for(var i = 0; i < questionResponse_arr.length; i++){
					if(questionResponse_arr[i].objective != "undefined"){
						trackedObjectives = true;
						if(!questionResponse_arr[i].correct){
							//check for duplicates
							if($.inArray(questionResponse_arr[i].objective, remediationObjectives) == -1){
								remediationObjectives.push(questionResponse_arr[i].objective);
								if(doScorm() && lms == "JKO"){
									stringQR_arr.push(questionResponse_arr[i].objItemId.replace(/:/g , '') + "|" + score_arr.replace(/,/g , '##') + "|" + attemptCount + "|" + questionResponse_arr[i].objective.replace(/,/g , '##'));
								}
								else{
									displayRemedObj += "<li class='completionText'>"+questionResponse_arr[i].objective+"</li>";
								}
								//displayRemedObjAlt += "<li class='completionText'>"+questionResponse_arr[i].objective+"</li>";
								//stringQR_arr.push(questionResponse_arr[i].objItemId. + "|" + score_arr.replace(/,/g , '##') + "|" + attemptCount + "|" + questionResponse_arr[i].objective.replace(/,/g , '##'));
								//displayRemedObj += "<li class='completionText'><a href='javascript:;' onclick='jump(\""+questionResponse_arr[i].objItemId+"\",\""+score_arr+"\", "+attemptCount+")'>"+questionResponse_arr[i].objective+"</a></li>";
							}						
						}
					}
					else if(questionResponse_arr[i].objItemId != "undefined"){
						trackedObjectives = true;
							if(!questionResponse_arr[i].correct){
								//check for duplicates
								if($.inArray(questionResponse_arr[i].objItemId, remediationObjectives) == -1){
									remediationObjectives.push(questionResponse_arr[i].objItemId);
									if(doScorm() && lms == "JKO"){
										stringQR_arr.push(questionResponse_arr[i].objItemId.replace(/:/g , '') + "|" + score_arr.replace(/,/g , '##') + "|" + attemptCount + "|" + questionResponse_arr[i].objItemId);
									}
									else{
									var itemName = $(courseData).find('item[id="'+questionResponse_arr[i].objItemId+'"]').attr('name');	
									var itemTlo = $(courseData).find('item[id="'+questionResponse_arr[i].objItemId+'"]').attr('tlo');									
										displayRemedObj += "<li class='completionText'>"+itemName+" : "+itemTlo +"</li>";										
									}
									//displayRemedObjAlt += "<li class='completionText'>"+questionResponse_arr[i].objItemId+"</li>";
									//stringQR_arr.push(questionResponse_arr[i].objItemId + "|" + score_arr.replace(/,/g , '##') + "|" + attemptCount + "|" + questionResponse_arr[i].objItemId);
									//displayRemedObj += "<li class='completionText'><a href='javascript:;' onclick='jump(\""+questionResponse_arr[i].objItemId+"\",\""+score_arr+"\", "+attemptCount+")'>"+questionResponse_arr[i].objItemId+"</a></li>";
								}
							}				
					}
				}
			}

			if(lms == "JKO"){
				var stringQR_arr_string = stringQR_arr.join();
				for (var i = 0; i < stringQR_arr.length; i++) {
					trackedObjectives = true;
					var li = stringQR_arr[i].split("|");
					remediationObjectives.push(li[3]);
					displayRemedObj += "<li class='completionText'><a href='javascript:;' onclick='jump(\""+li[0]+"\",\""+li[1]+"\", \""+li[2]+"\", \""+stringQR_arr_string+"\")'>"+li[3].replace(/##/g , ',')+"</a></li>";
				};
			}
		}

		var isDisplayRemed = false;
		if(isScored === "true" || review === "true"){
			isDisplayRemed = true;
		}
		if(isDisplayRemed && trackedObjectives && remediationObjectives.length != 0){
			var scoreTextAlt = scoreText;
			scoreText += '<p class="completionText">You missed questions regarding the following objectives: ';
			scoreText += '<ul class="completionText">';
			scoreText += displayRemedObj;
			scoreText += '</ul></p><br/><br/>';
			// if(scormVersion.indexOf('USSOCOM') != -1){
				
			// 	HTMLString = '<HTML>\n';
			// 	HTMLString += '<HEAD><TITLE>Test Review</TITLE></HEAD>\n';
			// 	HTMLString += '<BODY>\n';
			// 	HTMLString += scoreTextAlt;
			// 	HTMLString += '<p class="completionText">You missed questions regarding the following objectives: ';
			// 	HTMLString += '<ul class="completionText">';
			// 	HTMLString += displayRemedObjAlt;
			// 	HTMLString += '</ul></p>';				
			// 	HTMLString += '<p>Press \"Ctrl+P\" on your keyboard to print this page.</p>';
			// 	HTMLString += '</BODY></HTML>';
			// 	newwindow = window.open('','','width=400, height=600');
			// 	newdocument = newwindow.document;
			// 	newdocument.write(HTMLString);
			// 	newdocument.close();
			// 	scoreText += '<p>The results have opened in another browser window that you can keep open as a refererence. <br/>';
			// 	//'To print this list for reference while reviewing the modules before retaking the test press the print button.</p>';
			// }

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
        $(data).find("page").eq(currentPage).attr("review", review);
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

