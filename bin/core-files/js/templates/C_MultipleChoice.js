/*!
 * C_MultipleChoice
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
 *		4. Auto-mcSubmit - when a user selects an option, it is mcSubmitted without having to click mcSubmit. Default == false;
 *		5. Allows for a background image to utilized.
 *		6. Timer - a timer can be set which counts down until 0 - if they don't answer they get a zero.
 *		7. Ability to add higher score related to time to answer.
 *		8. Point weighted questions - more points for more difficult ones.
 */
function C_MultipleChoice(_myType) {

    var myPageTitle;//Title of this page.
    var myContent;//Body
    var optionHolderY = 0;
    var optionStartX = 0;
    var mcSubmitButtonY = 0;
    var attemptsAllowed = 2;
    var attemptsMade = 0;
    var optionLabeling = "a"; //"a" for alphabetic - "n" for numeric
    var myType = _myType; //Other options are trueFalse,  multipleSelect
    var option_arr = [];
    var feedbackType;
    var feedbackDisplay;
    var feedbackCorrectTitle;
    var feedbackIncorrectTitle;
    var feedbackIncorrectAttempt;
    var feedback;
    var iconClicked = false;
    var conHeight;
    
    var isComplete;
    
    var optionEdit_arr = [];
    var optionCount = 0;
    
    //Defines a public method - notice the difference between the private definition below.
	this.initialize= function(){
		buildTemplate();
	}
		
	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		if(scored == true){	
			checkQuestionComplete();
		}
		
		attemptsAllowed = $(data).find("page").eq(currentPage).attr('attempts');
		feedbackType = $(data).find("page").eq(currentPage).attr('feedbackType');
		feedbackDisplay = $(data).find("page").eq(currentPage).attr('feedbackDisplay');
		feedbackCorrectTitle = $(data).find("page").eq(currentPage).find('correctresponse').text();
		feedbackIncorrectTitle = $(data).find("page").eq(currentPage).find('incorrectresponse').text();
		feedbackIncorrectAttempt = $(data).find("page").eq(currentPage).find('attemptresponse').text();
		feedback = $(data).find("page").eq(currentPage).find('feedback').text();
		
		$('#stage').append('<div id="pageTitle"></div>');
		$('#stage').append('<div id="question" class="questionTop"></div>');
		$('#stage').append('<div id="answerOptions"></div>');
		$("#myCanvas").append("<div id='mcSubmit'></div>");
		
		optionCount = $(data).find("page").eq(currentPage).find("option").length;
		
		//Set Page Title		
		myPageTitle = $(data).find("page").eq(currentPage).find('title').text();
		$("#pageTitle").append(myPageTitle);
		
		//Set Question
		myContent = $(data).find("page").eq(currentPage).find('question').text();
		$("#question").append(myContent);
		
		//Figure out the question height to properly place the options
		$("#body").append("<div id='testTop' class='testTop'></div>");
        $("#testTop").append(myContent);
        conHeight = $("#testTop").height();
        $("#testTop").remove();
           
        optionHolderY = $("#question").position().top + $("#question").height() + 50;
		
		$("#answerOptions").css({'position':'absolute', 'top':optionHolderY});
		
		//Place each option within the container $('#options') - this allows for easier cleanup, control and tracking.
		var iterator = 0;
		var optionY = 0;
		
		if(myType == "multipleChoice"){
			$('#answerOptions').append('<div id="answer" class="radioSelector">');
		}else if (myType == "multipleSelect"){
			$('#answerOptions').append('<div id="answer" class="checkBox">');
		}else if (myType == "trueFalse"){
			$("#answerOption").append("<div id='answer' class='trueFalse'>");
		}
		
		//find every option in the xml - place them on the screen.
		$(data).find("page").eq(currentPage).find("option").each(function()
		{	
			//Create unique class name for each option
			var myOption = "option" + iterator;
			//Create each option as a div.
			var myLabel = String.fromCharCode(iterator % 26 + 65);

			if(myType == "multipleChoice"){
				$('#answer').append('<div class="option" id="' + myOption + '"><input id="' + myOption + 'Check" type="radio" name=' + myType + '" class="radio" value="' + $(this).attr("correct")+ '"/><label id="label">'+ myLabel + '. ' +$(this).find("content").text() +'</label></div>');
			}else{
				$('#answer').append('<div class="option" id="' + myOption + '"><input id="' + myOption + 'Check" type="checkbox" name=' + myType + '" class="radio" value="' + $(this).attr("correct")+ '"/><label id="label">'+ myLabel + '. ' +$(this).find("content").text() +'</label></div>');
			}
			//Position each option with css
			$("#"+myOption).css({'position':'absolute', 'top':optionY});
			
			$("#" + myOption + "Check").click(function(){
				iconClicked = true;
				
				if($(this).prop('checked') == true){
					$(this).parent().addClass("optionSelected")
				}else{
					$(this).parent().removeClass("optionSelected")
				}
			});
			
			
			//Add button click action to each option
			$('#' + myOption).click( function(){
				$("#mcSubmit").button({ disabled: false });
				
				if(myType == "multipleChoice"){
					$(this).find('input').prop('checked', true);
					for(var i=0; i<option_arr.length; i++){
						if(option_arr[i].hasClass("optionSelected") ){
							option_arr[i].removeClass("optionSelected");
						}
					}
					$(this).addClass("optionSelected");
				}else if(myType == "multipleSelect"){
					if($(this).find('input').prop('checked') == true){
						if(iconClicked != true){
							$(this).find('input').prop('checked', false);
							$(this).removeClass("optionSelected");
						}	
						
					}else{
						if(iconClicked != true){
							$(this).find('input').prop('checked', true);
							$(this).addClass("optionSelected");
						}
					}
				}
				iconClicked = false;
			}).hover(function(){
					$(this).addClass("optionHover");
				},
				function(){
					$(this).removeClass("optionHover")
				});
			
			//iterate the iterators...
			optionY += $("#"+myOption).height() + 30;
			iterator++;
			option_arr.push($('#' + myOption));
			
		});

		if($(data).find("page").eq(currentPage).attr('img')!= undefined){
			myImage = $(data).find("page").eq(currentPage).attr('img');
			if(myImage != null){
				myImage = "media/" + myImage;
				$("#answerOptions").addClass("answerOptionsWImage");
				loadVisualMedia();
			}
		};

		$("#answerOptions").append("</div>");
		
		$("#mcSubmit").button({ label: $(data).find("page").eq(currentPage).attr("btnText"), disabled: true });
		$("#mcSubmit").click(checkAnswer);
		
		if(transition == true){
			TweenMax.to($("#stage"), transitionLength, {css:{opacity:1}, ease:Power2.easeIn, onComplete:checkMode});
		}
	}


/*****************************************************************************************************************************************************************************************************************
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     MEDIA FUNCTIONALITY
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     *****************************************************************************************************************************************************************************************************************/
    /**********************************************************************
     **Load Visual Content from Link  -  creates tags and media player instance -
     ** Currently handles - .png, .swf, .jpg, .gif, .mp4, .html
     **********************************************************************/
	 var mediaType;
	 var imageWidth;
	 var imageHeight;
	 var imgX;
	 var imgY;
	 
    function loadVisualMedia(){
    	$("#stage").append("<div id='loader' class='mcLoader'></div>");
        
        var questionH = $("#question").height();
        var questionW = $("#question").width();
        var questionX = $("#question").position().left;
        var questionY = $("#question").position().top;
        var titleY = $("#pageTitle").position().top;
        var titleH = $("#pageTitle").height();
       
        var mediaLinkType = $(data).find("page").eq(currentPage).attr('mediaLinkType');

        var parts = myImage.split('.'), i, l;
        var last = parts.length;

        mediaType = (parts[last - 1]);

        if(mediaType == "swf"){
            imageWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
            imageHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
            resizeForMobile();
            $("#loader").removeClass('loading');
            $("#loader").flash({swf:myImage,width:imageWidth,height:imageHeight});

            ////////////////////////////////////////////////HTML for edge or js apps.
        }else if (mediaType == "html"){
            imageWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
            imageHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
            resizeForMobile();

            $("#loader").append('<object id="edgeContent" data='+myImage+' type="text/html" width="' + imageWidth + '" height="' + imageHeight + '" align="absmiddle"></object>');
            $("#loader").removeClass('loading');
                       ////////////////////////////////////////////////HTML for edge or js apps.
        }else if (mediaType == "mp4"  || mediaLinkType == "youtube"){

            autoNext = $(data).find("page").eq(currentPage).attr('autoNext');
            imageWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
            imageHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
            autoPlay = $(data).find("page").eq(currentPage).attr('autoplay');
            resizeForMobile();

            var vidHTMLString = "<video id='videoplayer' width=" + imageWidth + " height=" + imageHeight + " controls='controls'";

            if(mediaLinkType == "youtube"){
                vidHTMLString += " preload='none'";
            }

            var hasPoster;
            var posterLink;
            var hasSubs;
            var subsLink;

            if($(data).find("page").eq(currentPage).attr('poster') != undefined && $(data).find("page").eq(currentPage).attr('poster') != "null" && $(data).find("page").eq(currentPage).attr('poster').length != 0){
                hasPoster = true;
                posterLink = $(data).find("page").eq(currentPage).attr('poster');
            }else{
                hasPoster = false;
            }

            //Check Poster
            if(hasPoster == true){
                vidHTMLString += "poster='"+posterLink+"'>";
            }else{
                vidHTMLString += ">";
            }

            vidHTMLString += "<source type='video/";

            //Check type and add appropriate.
            if(mediaLinkType == "youtube"){
                vidHTMLString += "youtube' ";
            }else{
                vidHTMLString += "mp4' ";
            }

            //Add the video source and close the source node.
            vidHTMLString += "src='" + myImage + "'/>";

            //Check for subs - defaults to false.
            if($(data).find("page").eq(currentPage).attr('subs') != undefined && $(data).find("page").eq(currentPage).attr('subs') != "null" && $(data).find("page").eq(currentPage).attr('subs').length != 0){
                hasSubs = true;
                subLink = $(data).find("page").eq(currentPage).attr('subs');
            }else{
                hasSubs = false;
            }

            //Check subs - if subs at track node.
            if(hasSubs == true){
                vidHTMLString += "<track kind='subtitles' src='" + subLink + "' srclang='en'/>"
            }

            vidHTMLString += "</video>";


            //Add the HTML to it's div.
            $("#loader").append(vidHTMLString);


            $('video').mediaelementplayer({
                success: function(player, node) {
                    //If autoNext then move to next page upon completion.
                    if(autoNext == "true"){
                        player.addEventListener('ended', function(e) {
                            hasEnded();
                        }, false);
                    }

                    //If autoplay - cick off the vid
                    if(autoPlay == "true"){
                        $('.mejs-overlay-button').trigger('click');
                    }
                }
            });
        }else{
            var img = new Image();
            $(img).load(function(){
                $("#loader").removeClass('loading').append(img);
                imageWidth = $(img).width();
                imageHeight = $(img).height();

                if(transition == true){
                    TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType/*, onComplete:setCaption*/});
                }else{
                    //setCaption();
                }
            }).attr('src', myImage).attr('alt', $(data).find("page").eq(currentPage).attr('alt')).attr('id', 'myImg');
        }

        //Other media types include their size so we don't need to wait for them to load to place the caption - images (png, gif, jpg) don't so we have to do caption inside of the load event.
        if(mediaType == "mp4" || mediaType == "html"  || mediaType == "swf" || mediaLinkType == "youtube"){

            if(transition == true){
                TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType/*, onComplete:setCaption*/});
            }else{
                //setCaption();
            }
        }

        $("#loader").removeClass('loading');
    }
    /////////////END of loadVisualMedia

	
	function checkQuestionComplete(){
		for(var i = 0; i < questionResponse_arr.length; i++){
			if(currentPageID == questionResponse_arr[i].id){
				if(questionResponse_arr[i].complete == true){
					isComplete = true;
				}
			}
		}
	}
	
	function showUserAnswer(){
		console.log("showUserAnswer");
		console.log("questionResponse_arr: " + questionResponse_arr.length);
		for(var i = 0; i < questionResponse_arr.length; i++){
			if(currentPageID == questionResponse_arr[i].id){
				console.log("found for this page");
				var temp_arr = questionResponse_arr[i].userAnswer;
				console.log("temp_arr.length = " + temp_arr.length);
				var tempCorrect = true;
				for(var k = 0; k < temp_arr.length; k++){
					option_arr[temp_arr[k]].find("input").prop("checked", "checked");
					console.log("made it in this far");
					if(option_arr[temp_arr[k]].find('input').attr("value") == "false"){
						console.log("should place an x");
						tempCorrect = false;
						option_arr[temp_arr[k]].addClass("optionIncorrect");
					}else{
						console.log("should place a y");
						option_arr[temp_arr[k]].addClass("optionCorrect");
					}
				}
				if(questionResponse_arr[i].correct == false){
					for(var j = 0; j < option_arr.length; j++){
						if(option_arr[j].find("input").attr("value") == "true"){
							console.log("should place a check");
							option_arr[j].addClass("optionCorrect");
						}
					}
				}
				break;
			}
		}
		$(".radio").prop('disabled', true);
	}
		
	function checkAnswer(){
		//////////////////////////CHECK CORRECT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		var tempCorrect = true;
		attemptsMade++;
		if(myType == "multipleChoice"){
			var selected = $("#answer input[type='radio']:checked");
			if(selected.val() == "true"){
				tempCorrect = true;
			}else{
				tempCorrect = false;
			}
		}else if (myType == "multipleSelect"){
			for(var i = 0; i < option_arr.length; i++){
				if(option_arr[i].find('input').attr("value") == "true"){
					if(option_arr[i].find("input").prop("checked") == false){
						tempCorrect = false;
					}
				} else {
					if(option_arr[i].find("input").prop("checked") == true){
						tempCorrect = false;
					}
				}
			}
		}
		
		//////////////////////////FEEDBACK\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		var msg = "";
		
		if(feedbackType == 'undifferentiated'){
			//Undifferentiated correct answer
			if(tempCorrect == true){
				msg = '<div id="dialog-attemptResponse" class="correct" title="'+ feedbackCorrectTitle +'"><p>'+feedbackCorrectTitle +'</p><p> '+ feedback +'</p></div>';	
			//Undifferentiated wrong answer	
			}else{
				if(attemptsMade == attemptsAllowed){
					//incorrect feedback here
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectTitle +'</p><p> '+ feedback +'</p></div>';
				}else{
					//try again.
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectAttempt +'</p></div>';	
				}
			}
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////DIFFERENTIATED FEEDBACK FUNCTIONALITY.
		}else if(feedbackType == 'differentiated'){
			if(tempCorrect == true){
				var feedbackMsg = "";
				for(var i = 0; i < option_arr.length; i++){
					if(option_arr[i].find("input").prop("checked") == true){
						feedbackMsg += "<p><b>You selected</b>: " + $(data).find("page").eq(currentPage).find("option").eq(i).find("content").text() + ", ";
						if($(data).find("page").eq(currentPage).find("option").eq(i).attr("correct") == "true"){
							feedbackMsg += "that was a correct response.</p>"
						}else{
							feedbackMsg += "that was an incorrect response.</p>"
						}
						feedbackMsg += "<p>" + $(data).find("page").eq(currentPage).find("option").eq(i).find("diffeed").text() + "</p>";
					}	
				}
				msg = '<div id="dialog-attemptResponse" class="correct" title="'+ feedbackCorrectTitle +'"><p> '+ feedbackMsg +'</p></div>';
			}else{
				if(attemptsMade == attemptsAllowed){
					//incorrect feedback here
					var feedbackMsg = "";
					for(var i = 0; i < option_arr.length; i++){
						if(option_arr[i].find("input").prop("checked") == true){
							feedbackMsg += "<p><b>You selected</b>: " + $(data).find("page").eq(currentPage).find("option").eq(i).find("content").text() + ". ";
							if($(data).find("page").eq(currentPage).find("option").eq(i).attr("correct") == "true"){
								feedbackMsg += "That was a correct response.</p>"
							}else{
								feedbackMsg += "That was an incorrect response.</p>"
							}
							feedbackMsg += "<p>" + $(data).find("page").eq(currentPage).find("option").eq(i).find("diffeed").text() + "</p>";
						}	
					}
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p> '+ feedbackMsg +'</p></div>';
				}else{
					//try again.
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectAttempt +'</p></div>';	
				}
			}
		}else if(feedbackType == 'standardized'){
			if(tempCorrect == true){
				msg = '<div id="dialog-attemptResponse" class="correct" title="That is Correct."></div>';
			}else{
				if(attemptsMade == attemptsAllowed){
					msg = '<div id="dialog-attemptResponse" class="correct" title="That is not correct."></div>';
				}else{
					msg = '<div id="dialog-attemptResponse" class="incorrect" title="'+ feedbackIncorrectTitle +'"><p>'+feedbackIncorrectAttempt +'</p></div>';
				}
			}
		}
		
		if(tempCorrect == true || attemptsMade == attemptsAllowed){
			if(scored == true){
				var selected_arr = [];
				for(var i = 0; i < option_arr.length; i++){
					if(option_arr[i].find("input").prop("checked") == true){
						selected_arr.push(i);
					}	
				}
				updateScoring(selected_arr, tempCorrect);
				mandatoryInteraction = false;
				checkNavButtons();
				showUserAnswer();
			}
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
					}
				});
			}
		}else if(feedbackDisplay == "inline"){
			
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
			
			$("#questionEdit").click(function(){
				updateQuestionEditDialog();
			}).tooltip();
		}
	}
	
	function updateQuestionEditDialog(){
		var msg = "<div id='questionEditDialog' title='Create Multiple Choice Question'>";
		msg += "<label id='label'><b>no. of attempts: </b></label>";
		msg += "<input type='text' name='myName' id='inputAttempts' value='"+ attemptsAllowed +"' class='regText text ui-widget-content ui-corner-all' style='width:35px;'/><br/>";
		msg += "<div id='feedbackTypeGroup'>";
		msg += "<label id='label'><b>feedback type: </b></label>";
		msg += "<input id='standardized' type='radio' name='manageFeedbackType' value='standardized'>standardized  </input>";
		msg += "<input id='undifferentiated' type='radio' name='manageFeedbackType' value='undifferentiated'>undifferentiated  </input>";
		msg += "<input id='differentiated' type='radio' name='manageFeedbackType' value='differentiated'>differentiated  </input>";
		
		msg += "</div>"
		msg += "<div id='questionLabel'><b>Input your question:</b></div>";
		msg += "<div id='questionEditText' type='text'  >" + myContent + "</div><br/>";
		if(feedbackType == "undifferentiated"){
			msg += "<div id='feedbackLabel'><b>Input your feedback:</b></div>";
			msg += "<div id='feedbackEditText' type='text'  >" + feedback + "</div><br/>";
		}
		msg += "</div>";
		$("#stage").append(msg);
		
		$('#' + feedbackType).prop('checked', true);
		
		//Switch to show the correct feedback type....
		$("#feedbackTypeGroup").change(function(){
			$("#questionEditText").destroyEditor();
			for(var i = 0; i < optionEdit_arr.length; i++){
				$("#"+optionEdit_arr[i]+"Text").destroyEditor();
				if(feedbackType == "differentiated"){
					$("#"+optionEdit_arr[i]+"DifFeedText").destroyEditor();
				}
			}
			feedbackType = $('input[name=manageFeedbackType]:checked', '#feedbackTypeGroup').val();
			$("#questionEditDialog").remove();
			optionEdit_arr = [];
			
			updateQuestionEditDialog();
		});
			
		$("#questionEditText").redactor({
			focus: true,
			buttons: ['html', '|', 'formatting', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'alignleft', 'aligncenter', 'alignright', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'fontcolor', 'backcolor', '|', 'table', 'link', 'image']
		});
			
		$("#feedbackEditText").redactor({
			buttons: ['html', '|', 'formatting', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'alignleft', 'aligncenter', 'alignright', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'fontcolor', 'backcolor', '|', 'table', 'link', 'image']
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
					$("#questionEditText").destroyEditor();
					for(var i = 0; i < optionEdit_arr.length; i++){
						$("#"+optionEdit_arr[i]+"Text").destroyEditor();
						if(feedbackType == "differentiated"){
							$("#"+optionEdit_arr[i]+"DifFeedText").destroyEditor();
						}
					}
					$( this ).dialog( "close" );	
				},
				Add: function(){
					addOption(optionEdit_arr.length, true);	
				},
				Save: function(){
					saveQuestionEdit();
				}
			},
			close: function(){
				$(this).remove();
			}
		});
	}
	
	function removeOption(_id){
		for(var i = 0; i < optionEdit_arr.length; i++){
			if(_id == $("#"+optionEdit_arr[i]+"Container").attr("value")){
				var arrIndex = i;
				break;
			}
		}
		$(data).find("pages").eq(currentPage).find("option").eq(arrIndex).remove();
		optionEdit_arr.splice(arrIndex, 1);
		$("#option"+_id+"Text").destroyEditor();
		if(feedbackType == "differentiated"){
			$("#option"+_id+"DifFeedText").destroyEditor();
		}
		$("#option" + _id +"Container").remove();
		
		
	}
	
	function addOption(_addID, _isNew){
		var optionID = "option" + _addID;
		var optionLabel = _addID + 1;
		
		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).find("content").append(option1CDATA);
			$(data).find("page").eq(currentPage).find("option").eq(_addID).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(currentPage).find("option").eq(_addID).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct", "false");
			
		}
					
		var optionContent = $(data).find("page").eq(currentPage).find("option").eq(_addID).find("content").text();				
		var msg = "<div id='"+optionID+"Container' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='"+optionID+"Remove' class='removeMedia' value='"+_addID+"' title='Click to remove this answer option'/>";
		msg += "<div id='"+optionID+"Input'><b>Option " + optionLabel + ":</b></div>";
		msg += "<div id='"+optionID+"Text'>" + optionContent + "</div>";
		msg += "<label id='label'><b>correct:</b></label>";
		if($(data).find("page").eq(currentPage).find("option").eq(_addID).attr("correct") == "true"){	
			msg += "<input id='"+optionID + "Correct' type='checkbox' checked='checked' name='correct' class='radio' value='true'/>";
		}else{
			msg += "<input id='"+optionID + "Correct' type='checkbox' name='correct' class='radio' value='true'/>";
		}
		
		if(feedbackType == "differentiated"){
			msg += "<br/>"
			var difFeedContent = $(data).find("page").eq(currentPage).find("option").eq(_addID).find("diffeed").text();
			msg += "<label id='label'><b>Option " + optionLabel + " Differentiated Feedback:</b></label>";
			msg += "<div id='"+optionID+"DifFeedText'>" + difFeedContent + "</div>";
		}
		msg += "</div>";
				
		$("#questionEditDialog").append(msg);
		
		$("#" +optionID+"Remove").on('click', function(){
			removeOption($(this).attr("value"));
		});
					
		$("#"+optionID+"Text").redactor({
			buttons: ['html', '|', 'formatting', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'alignleft', 'aligncenter', 'alignright', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'fontcolor', 'backcolor', '|', 'table', 'link', 'image']
		});
		
		if(feedbackType == "differentiated"){
			$("#"+optionID+"DifFeedText").redactor({
				buttons: ['html', '|', 'formatting', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'alignleft', 'aligncenter', 'alignright', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'fontcolor', 'backcolor', '|', 'table', 'link', 'image']
			});
		}
																	
		optionEdit_arr.push(optionID);
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
		
		if(feedbackType == "undifferentiated"){
			var feedbackUpdate = $("#feedbackEditText").getCode();
			var feedDoc = new DOMParser().parseFromString('<feedback></feedback>', 'application/xml');
			var feedCDATA = feedDoc.createCDATASection(feedbackUpdate);
			$("#feedbackEditText").destroyEditor();
			$(data).find("page").eq(currentPage).find("feedback").empty();
			$(data).find("page").eq(currentPage).find("feedback").append(feedCDATA);
		}
		//Update the local xml - first clearning the content node and then updating it with out newCDATA
		$(data).find("page").eq(currentPage).find("question").empty();
		$(data).find("page").eq(currentPage).find("question").append(newCDATA);
		
		$(data).find("page").eq(currentPage).attr("attempts", $("#inputAttempts").val());
		$(data).find("page").eq(currentPage).attr("feedbackType", $('input[name=manageFeedbackType]:checked', '#feedbackTypeGroup').val());
		var correctOptions = 0;
		for(var i = 0; i < optionEdit_arr.length; i++){
			var optionText = $("#"+optionEdit_arr[i]+"Text").getCode();
			var optionCorrect = $("#"+optionEdit_arr[i]+"Correct").prop("checked");
			var newOption = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var optionCDATA = newOption.createCDATASection(optionText);
			$(data).find("page").eq(currentPage).find("option").eq(i).find('content').empty();
			$(data).find("page").eq(currentPage).find("option").eq(i).find('content').append(optionCDATA);
			if(feedbackType == "differentiated"){
				var optionDifFeedText = $("#"+optionEdit_arr[i]+"DifFeedText").getCode();
				var optionDifFeedCDATA = newOption.createCDATASection(optionDifFeedText);
				$(data).find("page").eq(currentPage).find("option").eq(i).find('diffeed').empty();
				$(data).find("page").eq(currentPage).find("option").eq(i).find('diffeed').append(optionDifFeedCDATA);
			}
			$(data).find("page").eq(currentPage).find("option").eq(i).attr("correct", optionCorrect);
			
			$("#"+optionEdit_arr[i]+"Text").destroyEditor();
			
			if(optionCorrect == true){
				correctOptions++;
			}
		}
		
		if(correctOptions > 1){
			$(data).find("page").eq(currentPage).attr("layout", "multipleSelect");
		}else{
			$(data).find("page").eq(currentPage).attr("layout", "multipleChoice");
		}
		
		var extra = $(data).find("page").eq(currentPage).find("option").length;
		var active = optionEdit_arr.length;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("option").eq(i).remove();
		}
		
		$("#questionEditDialog").dialog("close");
		sendUpdateWithRefresh();
		fadeComplete();
	}
	
	/*****************************************************************************************************************************************************************************************************************
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     ACESSIBILITY/508 FUNCTIONALITY
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     *****************************************************************************************************************************************************************************************************************/
	function doAccess(){
        var tabindex = 1;

	   	$("#pageTitle").attr("tabindex", tabindex);
	   	tabindex++;
	   	
	   	$('#question').attr("tabindex", tabindex);
	   	tabindex++;
	   	
	   	for(var i = 0; i < option_arr.length; i++){
		   	$(option_arr[i]).attr("tabindex", tabindex);
		   	tabindex++;
		}
		
		
		$("#pageTitle").focus();
	}
	//////////////////////////////////////////////////////////////////////////////////////////////////END ACCESSIBILITY
	
	this.destroySelf = function() {
		 TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:Power2.easeIn, onComplete:fadeComplete});
    }
    
    this.fadeComplete = function() {
	    fadeComplete();
    }
    
    function fadeComplete(){
	    $('#pageTitle').remove();
	    $('#question').remove();
	    $('#answerOptions').remove();
		$('#loader').remove();
	    $("#mcSubmit").remove();
	    if(mode == "edit"){
		    $("#titleEdit").remove();
		    $("#questionEdit").remove();
		    $("#titleEditDialog").remove();
		    $("#questionEditDialog").remove();
	    }
	    loadPage();
    }

}