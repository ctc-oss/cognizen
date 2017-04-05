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
	var testNotAttempted = false;
	var showRemediate = true;
	var hideIndex = false;
	var retainScore = false;
	var passedPreviously = false;
	var hasMedia = false;
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
        
		//Clear accessibility on page load.
        pageAccess_arr = [];
        audioAccess_arr = [];

		$("#myCanvas").append("<div class='C_Loader'><div class='C_LoaderText'>Calculating Results</div></div>");

		scormVersion = $(data).find('scormVersion').attr('value');
		finalLesson = $(data).find('finalLesson').attr('value');
		lessonTitle = $(data).find('lessonTitle').attr('value').replace(/\s+/g, '');

		if($(data).find("page").eq(currentPage).attr('review')){
			review = $(data).find("page").eq(currentPage).attr('review');
		}
		
		if($(data).find("page").eq(currentPage).attr('indexhide')){
			if($(data).find("page").eq(currentPage).attr('indexhide') == "true"){
				hideIndex = true;
			}
		}else{
			$(data).find("page").eq(currentPage).attr('indexhide', false);
		}

		if($(data).find("page").eq(currentPage).attr('retainscore')){
			if($(data).find("page").eq(currentPage).attr('retainscore') == "true"){
				retainScore = true;
			}
		}else{
			$(data).find("page").eq(currentPage).attr('retainscore', false);
		}		

		if($(data).find("page").eq(currentPage).attr('showremediate')){
			if($(data).find("page").eq(currentPage).attr('showremediate') == "false"){
				showRemediate = false;
			}
		}
		
		//Additional code to check if pre-media enabled completion page and update if so...  PD- 08/05/15
		if($(data).find("page").eq(currentPage).attr("subs") == undefined){
			$(data).find("page").eq(currentPage).attr("subs", "null");
			$(data).find("page").eq(currentPage).attr("poster", "null");
			$(data).find("page").eq(currentPage).attr("popup", "defaultTop.png");
			$(data).find("page").eq(currentPage).attr("popcaps", " ");
			$(data).find("page").eq(currentPage).attr("popalt", " ");
			$(data).find("page").eq(currentPage).attr("img", "defaultTop.png");
			$(data).find("page").eq(currentPage).attr("w", "350");
			$(data).find("page").eq(currentPage).attr("h", "260");
			$(data).find("page").eq(currentPage).attr("enlarge", "");
			$(data).find("page").eq(currentPage).attr("controlType", "bar");
			$(data).find("page").eq(currentPage).attr("autoplay", "false");
			$(data).find("page").eq(currentPage).attr("autonext", "false");
			$(data).find("page").eq(currentPage).attr("alt", "image description");
			$(data).find("page").eq(currentPage).attr("mediaLinkType", "");
			$(data).find("page").eq(currentPage).attr("objectItemId", "undefined");
			$(data).find("page").eq(currentPage).attr("objective", "undefined");
			$(data).find("page").eq(currentPage).attr("poploop", "true");
			$(data).find("page").eq(currentPage).attr("withmedia", "false");
		}
		
		if($(data).find("page").eq(currentPage).attr("withmedia") == "true"){
			hasMedia = true;
		}else{
			hasMedia = false;
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

		// if(doScorm() && lms == "JKO"){
		// 	if(scorm.get("cmi.entry") == "resume"){
		// 		var suspend_data = scorm.get("cmi.suspend_data");
		// 		if(suspend_data.length != 0){
		// 			var tmpData = suspend_data.split("~");
		// 			if(tmpData[0] !== "na"){
		// 				var tmpscore = tmpData[0].replace(/##/g , ',').split(",");
		// 				score_obj.passed = (tmpscore[0] === "true");
		// 				score_obj.minScore = parseInt(tmpscore[1]);
		// 				score_obj.correctQuestions = parseInt(tmpscore[2]);
		// 				score_obj.totalQuestions = parseInt(tmpscore[3]);
		// 				score_obj.scorePercent = parseInt(tmpscore[4]);
		// 				score_obj.score = parseFloat(tmpscore[5]);
		// 				var tmpQArray = tmpData[2].split(",");
		// 				for (var i = 0; i < tmpQArray.length; i++) {
		// 					stringQR_arr.push(tmpQArray[i]);
		// 				};
		// 				resumed = true;
		// 			}
		// 		}

		// 	}
		// }

		if(isScored === "true"){
			if(!resumed){
				score_obj = getFinalScore();
			}

			//retain score if already passed #3589
			if(retainScore){
				if(review === "true"){
					var reviewStrip = lessonTitle.split("Review");
					lessonTitle = reviewStrip[0];

				}	
				var _objIndex = findObjective(lessonTitle.replace(/[^\w\s]/gi, '')+"_satisfied");
		        var savedScore = scorm.get("cmi.objectives."+_objIndex+".score.scaled");			
		        var numSavedScore = 0;

				if(savedScore.length != 0){
					numSavedScore = Math.round(parseFloat(savedScore) * 100);
					if(numSavedScore >= score_obj.minScore){
						score_obj.passed = true;
						score_obj.score = savedScore;
						score_obj.scorePercent = numSavedScore;
						passedPreviously = true;
						scoreText += '<p class="completionText">You have already passed this lesson with a score of ' + score_obj.scorePercent + '%. </p>';
					}
				}	


			}

			if(score_obj.passed){

				if($(data).find("page").eq(currentPage).find("passedresponse").length == 0){					
					scoreText += '<p class="completionText">You received a passing score for this lesson. ';
				}
				else{
					scoreText += '<p class="completionText">' + $(data).find("page").eq(currentPage).find("passedresponse").eq(0).text();
				}

			}
			else{
				if($(data).find("page").eq(currentPage).find("failedresponse").length == 0){	
					scoreText += '<p class="completionText">You did not receive a passing score for this lesson. ';
				}
				else{
					scoreText += '<p class="completionText">' + $(data).find("page").eq(currentPage).find("failedresponse").eq(0).text();
				}
			}

			if(!passedPreviously){
				scoreText += 'The minimum score is ' + score_obj.minScore + '%.</p>';
				scoreText += '<p class="completionText">You answered ' + score_obj.correctQuestions + ' out of ' + score_obj.totalQuestions + ' questions correctly.</p>';
				scoreText += '<p class="completionText">Your total score is ' + score_obj.scorePercent + '%. </p>';
			}
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
	    var msg = '<div id="scrollableContent" class="antiscroll-wrap">';
	    	msg += '<div class="box">';
	    	msg += '<div id="contentHolder" class="overthrow antiscroll-inner">';
	    	msg += '<div id="content"></div>';

	    	msg += '<div id="instructionMsg"></div>';
	    	msg += '<div id="scoreFeedback"></div>';
	    	msg += '</div></div></div>';
	    $("#stage").append(msg);
		if(hasMedia){
	    	mediaHolder = new C_VisualMediaHolder();
			mediaHolder.loadVisualMedia();
			$("#scrollableContent").addClass("top");
			//$("#contentHolder").addClass("top");
		}else{
			$("#scrollableContent").addClass("text");
			$("#contentHolder").addClass("text");
		}

		// Moved audioHolder declare to be before showScoreEdit() resolves #4965
        audioHolder = new C_AudioHolder();

		showScoreEdit();

		determineReviewList();

		$("#content").append(myContent);
		$("#scoreFeedback").append(scoreText);
		if(attemptExceeded){
			$("#instructionMsg").append("You have exceeded the attempt limit of the test. <br/>" +
				"You will need to drop the course and reenroll to retake the course. Press the \"Continue\" button to end the coures.");
		}
		else{
			if(review === "true"){
				var reviewStrip = $(data).find('lessonTitle').attr('value').split(" Review");
				if(remediationObjectives.length != 0){
					$("#content").empty();
					$("#instructionMsg").append("<img src='media/cognizen_warning_icon.png' alt='Warning icon'><i> "+
					" You did not pass the "+ reviewStrip[0] + ". You will need to pass the " +
					reviewStrip[0] +" in order to receive course credit and print your course certificate.</i><br/><br/>"+
					"Use the list below to review any missed objectives. You can come back to this module at any time to review this list. "+
					"<br/><br/>Select a module to review or select the test module to retry the test. <br/><br/>");
				}
				else if(testNotAttempted){
					$("#content").empty();
					$("#instructionMsg").append(reviewStrip[0] + " has not been attempted. You will need to pass the " +
					$(data).find('lessonTitle').attr('value') +" in order to receive course credit and print your course certificate. " );					
				}
				else{
					$("#content").empty();
					$("#instructionMsg").append("You have passed the "+ reviewStrip[0] + ". Use the <b>Next Lesson</b> button in the header to access the next module. " );
				}

			}
			else if(lms == "JKO" && testReview == "true"){
				$("#instructionMsg").append("<br/><br/>Use the list below to review any missed objectives and press the <b>Next Lesson</b> button in the header to access the review page.");
			}
			else if(lms == "JKO"){
				$("#instructionMsg").append("Press the <b>Next Lesson</b> button in the header to access the next module.<br/><br/>");
			}

		}

		if(doScorm() && lms == "JKO" && scormVersion != "1.2"){
			var tmpLessonTitle = lessonTitle;
			if(review === "true"){
				var reviewStrip = lessonTitle.split("Review");
				tmpLessonTitle = reviewStrip[0];
			}

			var _objIndex = findObjective(tmpLessonTitle.replace(/[^\w\s]/gi, '') +"_satisfied");

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
						//scorm.set("cmi.exit", "suspend");
						scorm.set("cmi.exit", "normal");
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
				if(review != "true"){
					scorm.set("cmi.objectives."+_objIndex+".success_status", "passed");
					scorm.set("cmi.objectives."+_objIndex+".completion_status", "completed");
				}
				else{
					if(scorm.get("cmi.objectives."+_objIndex+".success_status") === "passed"){
						scorm.set("cmi.objectives."+_objIndex+".completion_status", "completed");
						var num = parseInt(scorm.get("cmi.objectives._count"));
						for (var i=0; i < num; ++i) {
							scorm.set("cmi.objectives."+i+".success_status", "passed");
						}												
					}
				}
				//scorm.set("cmi.score.scaled", score_obj.score.toString());
				//scorm.set("adl.nav.request", "continue");
				scorm.set("cmi.exit", "normal");
				scorm.API.getHandle().Terminate("");
			}
		}
		else if(doScorm()){
			//#4993 handles user leaving completion page before clicking continue
			scorm.set("cmi.location", $(data).find("page").eq(0).attr("id"));
			
            //do not write score if no pages are graded
            //#5016 - fix for Lessons that do not have any graded pages are setting success_status to failed 
            if(isScored === "true"){
				score_obj.passed ? scorm.set("cmi.success_status", "passed") : scorm.set("cmi.success_status", "failed");
				score_obj.passed ? scorm.status("set", "completed") : scorm.status("set", "incomplete");
	         	scorm.set("cmi.score.scaled", score_obj.score.toString());
	         	var raw = score_obj.score*100;
	         	scorm.set("cmi.score.raw", raw.toString());
        	}
			else{
				score_obj.passed ? scorm.status("set", "completed") : scorm.status("set", "incomplete");
			}

			$('<div id="completionButton">Continue</div>').insertAfter("#scoreFeedback");
			$("#completionButton").css({"width": "200px"});  //moved to css file
			$("#completionButton").button().click(function(){
				var _objIndex = findObjective(lessonTitle +"_satisfied");
				if(isScored === "true"){
					//#3219 updated to use passed status to set completions, parameter 1
					//#3568 reverted change for #3219 except for CTCU courses
					if(scormVersion === '1.2_CTCU' || lms === 'CTCU') {
						completeLesson(score_obj.passed, score_obj.passed, score_obj.score, false, false, false);
					}
                    else if(lms === 'NEL'){
                        scorm.set("adl.nav.request", "continue");
                        //#5013 - If a lessson is not passed cmi.exit will be set to suspend.  This avoids a new attempt on parent nodes. 
                        score_obj.passed ? scorm.set("cmi.exit", "normal") : scorm.set("cmi.exit", "suspend");
                        scorm.API.getHandle().Terminate("");                        
                    }					
					else{
						completeLesson(completed, score_obj.passed, score_obj.score, false, false, false);
					}
				}
				else{
					//#3568 - don't set success_status for non scored lessons
					completeLesson(true, 'undefined', 0, false, false, true);
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
		
		//$("#content").attr("aria-label", $("#content").text().replace(/'/g, ""));
        //pageAccess_arr.push($("#content"));
        pageAccess_arr.push($("#completionButton"));

        checkMode();

        if(transition == true){
			// fade stage in
			$('#stage').velocity({
				opacity: 1
			}, {
				duration: transitionLength,
				complete: removeLoader
			});
        }else{
	        $(".C_Loader").remove();
        }
        doAccess(pageAccess_arr);
    }

    function removeLoader(){
	    $(".C_Loader").remove();
    }

    function determineReviewList(){
		var trackedObjectives = false;
		var displayRemedObj = "";
		var displayRemedObjAlt = "";
		var unknownObjsCount = 0;

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
						else if(tmpObject.successStatus == "unknown"){
							unknownObjsCount++;
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
							else if(tmpObject.successStatus == "unknown"){
								unknownObjsCount++;
							}							
					}
				}

				//determine if test review is launched before test is tried
				if(unknownObjsCount >= scormObjectives.length){
					testNotAttempted = true;
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
					//#3879 only show graded assessment pages in remediation list
					if($(data).find("page[id='"+questionResponse_arr[i].id+"']").attr('graded') == 'true'){
						if(questionResponse_arr[i].objective != "undefined" && questionResponse_arr[i].objective != undefined ){
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
						else if(questionResponse_arr[i].objItemId != "undefined" && questionResponse_arr[i].objItemId != undefined){
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
		if(isDisplayRemed && trackedObjectives && remediationObjectives.length != 0 && showRemediate){
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
		else if(mode == 'review'){
			enableBack();
			enableIndex();
		}
	}

	function showScoreEdit(){
     	$(this).scrubContent();
     	$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		$('.antiscroll-wrap').antiscroll();

     	if(mode == "edit"){

            //Add and style titleEdit button
			$('#scoreFeedback').prepend("<div id='questionEdit' class='btn_edit_text' title='Edit Text Question'></div>");

			$("#questionEdit").click(function(){
				updateOptionDialog();
			}).tooltip();			
		}		
	}

	function updateOptionDialog(){
		
		try { clearInterval(counter); } catch (e){}
		try { $("#questionEditDialog").remove(); } catch (e) {}

		feedback = $(data).find("page").eq(currentPage).find('feedback').text();

		var msg = "<div id='questionEditDialog' title='Completion Edit Dialog'>";
		msg += "<label id='label' title='Indicates if this page should have a media element.'><b>media: </b></label>";
		msg += "<input id='hasMedia' type='checkbox' name='hasMedia' class='radio' value='true'/>&nbsp;&nbsp;";
		msg += "<label id='label' title='Prevent completion page from showing up in the Index.'><b>Hide in Index: </b></label>";
		msg += "<input id='hideFromIndex' type='checkbox' name='hideFromIndex' class='radio' value='true'/><br/>";

		if(isScored === "true"){
			msg += "<label id='label' title='Display remediation objectives.'><b>Show Remediation: </b></label>";
			msg += "<input id='isRemediate' type='checkbox' name='isRemediate' class='radio' value='true'/>&nbsp;&nbsp;";

			msg += "<label id='label' title='Retains a passing score for the lesson once it has been achieved on retry.'><b>Retain passing score on retry: </b></label>";
			msg += "<input id='retainScore' type='checkbox' name='retainScore' class='radio' value='true'/>&nbsp;&nbsp;";		
			msg += "<div id='inputPRLabel'><b>Passed Response Feedback: </b></div>";
			msg += "<div id='inputPassedResponse' class='dialogInput' contenteditable='true'></div>";
			msg += "<div id='inputFRLabel'><b>Failed Response Feedback: </b></div>";
			msg += "<div id='inputFailedResponse' class='dialogInput' contenteditable='true'></div>";
		}	

		msg += "</div>";
		$("#stage").append(msg);	
		
		if(!hasMedia){
			$("#hasMedia").removeAttr('checked');
		}else{
			$("#hasMedia").attr('checked', 'checked');
		}
		
		if(hideIndex){
			$("#hideFromIndex").attr('checked', 'checked');
		}else{
			$("#hideFromIndex").removeAttr('checked');
		}
		
		if(isScored === "true"){
	        if(!showRemediate){
				$("#isRemediate").removeAttr('checked');
			}else{
				$("#isRemediate").attr('checked', 'checked');
			}

			if(!retainScore){
				$('#retainScore').removeAttr('checked');
			}else{
				$('#retainScore').attr('checked', 'checked');
			}

			if($(data).find("page").eq(currentPage).find("passedresponse").length == 0){
				$("#inputPassedResponse").append("You received a passing score for this lesson.");
			}
			else{
				$("#inputPassedResponse").append($(data).find("page").eq(currentPage).find("passedresponse").eq(0).text());
			}

			if($(data).find("page").eq(currentPage).find("failedresponse").length == 0){
				$("#inputFailedResponse").append("You did not receive a passing score for this lesson.");
			}
			else{
				$("#inputFailedResponse").append($(data).find("page").eq(currentPage).find("failedresponse").eq(0).text());
			}

			CKEDITOR.inline( "inputPassedResponse", {
				toolbar: contentToolbar,
				toolbarGroups :contentToolgroup,
				enterMode : CKEDITOR.ENTER_BR,
				shiftEnterMode: CKEDITOR.ENTER_P,
				extraPlugins: 'sourcedialog',
			   	on: {
			      instanceReady: function(event){
			         $(event.editor.element.$).attr("title", "Click here to edit the passed feedback given.");
			    	}
			    }			
			});

			CKEDITOR.inline( "inputFailedResponse", {
				toolbar: contentToolbar,
				toolbarGroups :contentToolgroup,
				enterMode : CKEDITOR.ENTER_BR,
				shiftEnterMode: CKEDITOR.ENTER_P,
				extraPlugins: 'sourcedialog',
			   	on: {
			      instanceReady: function(event){
			         $(event.editor.element.$).attr("title", "Click here to edit the failed feedback given.");
			    	}
			    }			
			});	
		}

		//prevents dialog jumping issue
		$.ui.dialog.prototype._focusTabbable = function(){};		

		//Style it to jQuery UI dialog
		$("#questionEditDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 600,
			height: 300,
			dialogClass: "no-close",
			buttons: [
				{
					text: "Done",
					title: "Saves and closes the edit dialog.",
					click: function(){
				        makeRevealDataStore();
						saveEditDialog();
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

	function makeRevealDataStore(){
		if($("#hasMedia").prop("checked") == true){
        	$(data).find("page").eq(currentPage).attr("withmedia", "true");
        	hasMedia = true;
        }else{
	        $(data).find("page").eq(currentPage).attr("withmedia", "false");
        	hasMedia = false;
        }

		if($("#hideFromIndex").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("indexhide", "true");
			hideIndex = true;
		}else{
			$(data).find("page").eq(currentPage).attr("indexhide", "false");
			hideIndex = false;
		}
		
		if(isScored === "true"){		
			if($("#isRemediate").prop("checked") == true){
				$(data).find("page").eq(currentPage).attr("showremediate", "true");
				showRemediate = true;
			}else{
				$(data).find("page").eq(currentPage).attr("showremediate", "false");
				showRemediate = false;
			}
			
			if($("#retainScore").prop("checked") == true){
				$(data).find("page").eq(currentPage).attr("retainscore", "true");
				retainScore = true;
			}else{
				$(data).find("page").eq(currentPage).attr("retainscore", "false");
				retainScore = false;
			}

			var passedResponseUpdate = CKEDITOR.instances["inputPassedResponse"].getData();
			try{ CKEDITOR.instances["inputPassedResponse"].destroy() } catch (e) {}
			var passedResponseDoc = new DOMParser().parseFromString('<passedresponse></passedresponse>', 'text/xml')
			var passedResponseCDATA = passedResponseDoc.createCDATASection(passedResponseUpdate);
			if($(data).find("page").eq(currentPage).find("passedresponse").length == 0){
				$(data).find("page").eq(currentPage).append($("<passedresponse>"));
			}
			else{
				$(data).find("page").eq(currentPage).find('passedresponse').empty();
			}		
			$(data).find("page").eq(currentPage).find('passedresponse').append(passedResponseCDATA);	

			var failedResponseUpdate = CKEDITOR.instances["inputFailedResponse"].getData();
			try{ CKEDITOR.instances["inputFailedResponse"].destroy() } catch (e) {}
			var failedResponseDoc = new DOMParser().parseFromString('<failedresponse></failedresponse>', 'text/xml')
			var failedResponseCDATA = failedResponseDoc.createCDATASection(failedResponseUpdate);
			if($(data).find("page").eq(currentPage).find("failedresponse").length == 0){
				$(data).find("page").eq(currentPage).append($("<failedresponse>"));
			}
			else{
				$(data).find("page").eq(currentPage).find('failedresponse').empty();
			}		
			$(data).find("page").eq(currentPage).find('failedresponse').append(failedResponseCDATA);				
		}
	}

	function saveEditDialog(){
		sendUpdateWithRefresh();
		fadeComplete();
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
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.destroySelf = function() {
    	if(transition == true){
			// fade stage out
			$('#stage').velocity({
				opacity: 0
			}, {
				duration: transitionLength,
				complete: fadeComplete
			});
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

