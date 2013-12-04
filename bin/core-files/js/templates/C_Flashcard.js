/*!
 * C_Flashcard
 * This class creates a template for a creating basic flashcard exercises
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2013-06-03
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_Flashcard(_type) {
	
	var cardCount//number of tabs.
	var myImage;//image to be loaded.
	var myPageTitle;//Title of this page.
	var myContent;//Body
	var myCaption;//Caption text if needed.
	var myAudio;
	var autoPlay = false;//Boolean: true - attached media plays on load.  false - user interaction required to play media.  
	var autoNext = false;//Boolean: true - next page loads automatically upon media completion.  false - user interaction required to load the next page.
    
	var hasCaption = false;
	var hasAudio = false;
    
	var currentCard;
	var card_arr = [];
	var cardEdit_arr = [];
    
	var imageWidth;
	var imageHeight;
	
	var mediaLink;
	
	var stageW = $("#stage").width();
    var stageH = $("#stage").height();
    var audioShim = 0;
	
	var titleX;
	var titleY;
	var titleW;
	
	var contX;
	var contY;
	var contW;
	var contH;
	
	var imgY;
	var imgX;
	var imgW;
	var imgH;
    
	var contentY;
	var contentH;
	
	var cardCount;
	
	var type = _type;
	
	var mediaType;
	
	var virgin = true;
	
	var myIndex = 1;
	
	
	 //Defines a public method - notice the difference between the private definition below.
	this.initialize = function(){
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		/*****************************************
		**Set template variables.
		*****************************************/
		if($(data).find("page").eq(currentPage).attr('autonext') == "true"){
			autoNext = true;
		}
		
		if($(data).find("page").eq(currentPage).attr('autoplay') == "true"){
			autoPlay = true;
		}
		
		//Dynamically populate positions from the content.xml
		//Position the page title
		myPageTitle = $(data).find("page").eq(currentPage).find('title').text();
		
		//Position the page text		
		cardCount = $(data).find("page").eq(currentPage).find("card").length;
		
		myContent = $(data).find("page").eq(currentPage).find("content").text();		
		
		if(type == 'flashcardMedia'){
			mediaLink = $(data).find("page").eq(currentPage).attr('img');
			//Check if the page has captions
			if($(data).find("page").eq(currentPage).find('caption').text().length != 0){
				hasCaption = true;
				myCaption = $(data).find("page").eq(currentPage).find('caption').text();
			}
		}
		
		//Check if the page has an associated audio file.
		if($(data).find("page").eq(currentPage).attr('audio') != undefined && $(data).find("page").eq(currentPage).attr('audio') != "null"){
			if($(data).find("page").eq(currentPage).attr('audio').length != 0){
				hasAudio = true;
				audioShim = 30;
				myAudio = $(data).find("page").eq(currentPage).attr('audio');
			}
		}

		buildTemplate();
	}
	
	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
				
		//PAGE TITLE		
		$('#stage').append('<div id="pageTitle"></div>');
		$("#pageTitle").append(myPageTitle);
		
		$("#stage").append('<div id="scrollableContent" class="nano"><div id="contentHolder" class="overthrow content"><div id="content"></div><div id="flashcardHolder"></div></div></div>');
		$("#scrollableContent").css("overflow", "visible");
		$("#contentHolder").addClass("top");
        $("#content").addClass("top");
        var conSpot = $("#scrollableContent").position().top;
        $("#contentHolder").height(stageH - (audioShim + conSpot));
        //$("#content").width($("#contentHolder").width());
        $("#scrollableContent").height(stageH - ($("#scrollableContent").position().top + audioShim));
		 
		$("#content").append(myContent);
		
		$("#flashcardHolder").css({"top": $("#content").position().top + $("#content").height()+"px"});
		
		shuffle();		
		//check the xml for audio / if so, kick off audio code.
        if(hasAudio == true){
            $('#stage').append('<div id="audioCon"></div>');
            loadAudio();
        }
   	}
	
	function shuffle(){
		card_arr.length = 0;
		
		//FLASHCARDS
		currentCard = cardCount - 1;
		$("#flashcardHolder").css({'top': $("#contentHolder").position().top + $("#content").height() + 10 + "px", 'overflow': 'visible'});
		
		for(var i=0; i<cardCount; i++){
			var myTerm = $(data).find("page").eq(currentPage).find("card").eq(i).find("term").text();
			var myDef = $(data).find("page").eq(currentPage).find("card").eq(i).find("definition").text();
			var tempID = "card" + i;
			var tempTextID = "cardText" + i;
			if(type == "flashcardText"){
				$("#flashcardHolder").append("<div id='"+tempID+"' class='flashcard'><div id='"+tempTextID +"' class='cardText'>" + myTerm + "</div></div>");
			}else if(type == "flashcardMedia"){
				$("#flashcardHolder").append("<div id='"+tempID+"' class='flashcard'><div id='"+tempTextID +"' class='cardImg' style='" + myTerm + "'></div></div>");
			}
			//Position the card.
			$("#" + tempID).css({'left': (($("#contentHolder").width() - $("#content").position().left *2) -  (($("#" + tempID).width()) * 2 + 100))/2 + (i*4)});
			//Postion the text within the card.
			$("#" + tempTextID).css({'position': 'absolute', 'top': ($("#" + tempID).height() - $("#"+tempTextID).height())/2, 'left': ($("#" + tempID).width() - $("#"+tempTextID).width())/2});
			
			$("#" + tempID).data("myTerm", myTerm);
			$("#" + tempID).data("myDef", myDef);
			
			card_arr.push("#" + tempID);
		}
		
		if(transition == true){
			if (virgin == true){
				TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
				virgin = false;
			}else{
				TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
			}
		}else{
			if (virgin == true){
				checkMode();
				virgin = false;
			}
		}		
		enableNextCard();
	}
	
	function enableNextCard(){
		$(card_arr[currentCard]).hover(function(){
				$(this).addClass("flashcardHover");
			},function(){
				$(this).removeClass("flashcardHover");
			}).click(function(){
				$(this).unbind('mouseenter mouseleave click');
				$(this).removeClass("flashcardHover");
				TweenMax.to($(this), .2, {rotationY:90, left: $(this).position().left + $(this).width() + 25, zIndex: myIndex, onComplete:function(target){
					target.empty();
					tempID = "cardBackText" + myIndex;
					target.append("<div id='"+tempID+"' class='cardText'>"+target.data("myDef")+"</dev>");
					$("#" + tempID).css({'position': 'absolute', 'top': (target.height() - $("#" + tempID).height())/2, 'left': (target.width() - $("#" + tempID).width())/2});
					target.addClass("flashcardBack");
					TweenMax.to(target, .2, {rotationY:0, left: target.position().left + (4 * myIndex)});
					
				}, onCompleteParams:[$(this)]});
				myIndex++;
				
				if(currentCard == 0){
					$("#stage").append("<div id='flashcardReshuffle'>shuffle</div>");
					$("#flashcardReshuffle").button().click(function(){
						$("#flashcardHolder").empty();
						card_arr = [];
						myIndex = 1;
						shuffle();
						$(this).remove();
					});
				}else{
					currentCard--;
					enableNextCard();
				}
			});
	}
	
	
	/*****************************************************************************************************************************************************************************************************************
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	PAGE EDIT FUNCTIONALITY
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	function checkMode(){
		$(".nano").nanoScroller({
        	flashDelay: 1000,
			flash: true
		});
		if(mode == "edit"){
			/**
			* Edit Title
			*/
			//Add and style titleEdit button
			$('#stage').append("<div id='titleEdit' class='btn_edit_text' title='Edit Title'></div>");
			$("#titleEdit").css({'position':'absolute', 'top':$("#pageTitle").position().top - 15, 'left': $("#pageTitle").position().left + $("#pageTitle").width() - 15});
			//Add title Edit functionality
			$("#titleEdit").click(function(){
				//Create the Dialog
				$("#stage").append("<div id='titleDialog' title='Input Page Title'><div id='titleEditText' type='text'>" + myPageTitle + "</div></div>");
				//Style it to jQuery UI dialog
				$("#titleDialog").dialog({ 	
					autoOpen: true,
					modal: true,
					width: 550,
					buttons:{
						Cancel: function(){
							$(this).dialog("close");
						},
						Save: function(){
							saveTitleEdit();
						}
					},
					close: function(){
						$("#titleEditText").destroyEditor();
						$(this).remove();
					}
				});
				
				$("#titleEditText").redactor({
					focus: true,
					buttons: ['bold', 'italic', 'underline', 'deleted', '|', 'fontcolor', 'backcolor']
				});
			}).tooltip();
			
			
			/**
			* Edit Content
			*/
			//Add and style contentEdit button
			$('#contentHolder').append("<div id='conEdit' class='btn_edit_text' title='Edit Text Content'></div>");
			$("#conEdit").css({'position':'absolute', 'top':$("#content").position().top, 'left': $("#content").width() - 18});
				
			$("#conEdit").click(function(){
									
				//Create the Content Edit Dialog
				var msg = "<div id='contentEditDialog' title='Input Page Content'>";
				msg += "<div id='contentEditText' type='text' style='width:" + $('#contentHolder').width() + "; height:85%' >" + myContent + "</div>";
				msg += "</div>";
				$("#stage").append(msg);
				
				$("#contentEditText").redactor({
					focus: true,
					buttons: ['html', '|', 'formatting', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'alignleft', 'aligncenter', 'alignright', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'fontcolor', 'backcolor', '|', 'table', 'link', 'image']				});
						
				var myHeight;
				
				//Style it to jQuery UI dialog
				$("#contentEditDialog").dialog({ 	
					autoOpen: true,
					modal: true,
					width: 600,
					height: 400,
					buttons: {
						Cancel: function(){
							$( this ).dialog( "close" );
						},
						Save: function(){
							saveContentEdit();
						}
					},
					close: function(){
						$("#contentEditText").destroyEditor();
						$(this).remove();
					}
				});
			}).tooltip();
			
			/**
			* Edit Cards
			*/
			$('#contentHolder').append("<div id='cardEdit' class='btn_edit_text' title='Edit Cards'></div>");
			$("#cardEdit").css({'position':'absolute', 'top':$("#content").position().top +  $("#content").height(), 'left': $("#conEdit").position().left});
			
			$("#cardEdit").click(function(){
				cardEdit_arr.length = 0;
				//Create the Content Edit Dialog
				var msg = "<div id='cardEditDialog' title='Input Card Content'></div>";
				$("#stage").append(msg);
				for(var i = 0; i < cardCount; i++){
					addCard(i, false);
				}
				
				//Style it to jQuery UI dialog
				$("#cardEditDialog").dialog({ 	
					autoOpen: true,
					modal: true,
					width: 600,
					height: 500,
					buttons: {
						Cancel: function(){
							$( this ).dialog( "close" );
						},
						Add: function(){
							addCard(cardEdit_arr.length, true);	
						},
						Save: function(){
							saveCardEdit();
						}
					},
					close: function(){
						for(var i = 0; i < cardEdit_arr.length; i++){
							$("#"+cardEdit_arr[i]+"FrontText").destroyEditor();
							$("#"+cardEdit_arr[i]+"BackText").destroyEditor();
						}	
						$(this).remove();
					} 
				});
			}).tooltip();
			
			/*******************************************************
			* Edit Audio
			********************************************************/
	        if(dragFile == true){
	        	var contentId = urlParams['type'] + '_' + urlParams['id'];
		     	siofu.addEventListener("complete", function(event){
					siofu.removeEventListener("complete");
					siofu.removeEventListener("load");
					//if successful upload, else....
									
					var myFile = event.file.name;
					var myExt = getExtension(myFile);
					if(myExt == "mp3" || myExt == "MP3"){	
						if(event.success == true){
							if(myExt == "mp3" || myExt == "MP3"){
								var audioText;
								audioText = myFile;
								
								var msg = "<div id='audioEditDialog' title='Input Audio Path'>";
								msg += "<div id='audioEditDialog' title='Input Audio Path'><input id='audioPath' type='text' value="+ audioText + " defaultValue="+ audioText + " style='width:100%;'/>";
								msg += "<input id='autoplay' type='checkbox' name='autoplay' class='radio' value='true'/><label id='label'>autoplay</label></input>";
								msg += "<input id='autonext' type='checkbox' name='autonext' class='radio' value='true'/><label id='label'>autonext</label></input>";
								msg += "<input id='subs' type='checkbox' name='hasSubs' class='radio' value='true'/><label id='label'>subtitles</label></input>";
								msg += "</div>";
								
								$("#stage").append(msg);
								
								//Style it to jQuery UI dialog
								$("#audioEditDialog").dialog({
									autoOpen: true,
									modal: true,
									width: 500,
									height: 200,
									buttons:{
										Cancel: function(){
											$(this).dialog("close");
										},
										Save: function(){
											saveAudioEdit();
										}
									},
									close: function(){
										$(this).remove();
									}
								});
							}
						}
					}	
				});
					
				siofu.addEventListener("start", function(event){
					var myFile = event.file.name;
					var myExt = getExtension(myFile);
					if(myExt == "mp3"){
						try { $("#audioDrop").tooltip("destroy"); } catch (e) {}
						$("#stage").append("<div id='mediaLoader' class='mediaLoader'></div>");
						$("#mediaLoader").css({'position':'absolute', 'top': $("#audioDrop").position().top, 'left': $("#audioDrop").position().left, 'height': $("#audioDrop").height(), 'width': $("#audioDrop").width()});
					}
				});
		     		
		     	$('#stage').append("<div id='audioDrop' class='audioDropSpot' title='click to browse or drag mp3 to this location'>AudioDrop</div>");
		     	
		     	if(hasAudio == true){
		     		$("#audioDrop").css({'position':'absolute', 'bottom':30, 'right': 20});
		     	}else{
			   		$("#audioDrop").css({'position':'absolute', 'bottom':0, 'right': 20});
		     	}
		     	
		     	$("#audioDrop").attr('data-content', contentId);
			 	$("#audioDrop").find('*').attr('data-content', contentId);
			 	
			 	$("#audioDrop").click(function(){
					try { $("#audioDrop").tooltip("destroy"); } catch (e) {}
					siofu.prompt($("#audioDrop").attr('data-content'));
				}).tooltip();
					
				siofu.listenOnDrop(document.getElementById("audioDrop"));
		     } 
		     	
		     $('#stage').append("<div id='audioEdit' class='btn_edit_audio' title='Edit Page Audio'></div>");
			 //Move the audio edit button up if so as not to lay over the player, if there's audio on the page.
			if(hasAudio == true){
		   		$("#audioEdit").css({'position':'absolute', 'bottom':30, 'right': 0});
			}else{
	          	$("#audioEdit").css({'position':'absolute', 'bottom':0, 'right': 0});	
			}
				
				
			//Add Audio Edit
			$("#audioEdit").click(function(){
				//Create the Content Edit Dialog
				var audioText;
				if(myAudio == "null"){
	            	audioText = "yourFile.mp3";
				}else{
	            	audioText = myAudio;
				}
				
				var msg = "<div id='audioEditDialog' title='Input Audio Path'>";
				msg += "<div id='audioEditDialog' title='Input Audio Path'><input id='audioPath' type='text' value="+ audioText + " defaultValue="+ audioText + " style='width:100%;'/>";
				msg += "<input id='autoplay' type='checkbox' name='autoplay' class='radio' value='true'/><label id='label'>autoplay</label></input>";
				msg += "<input id='autonext' type='checkbox' name='autonext' class='radio' value='true'/><label id='label'>autonext</label></input>";
				msg += "<input id='subs' type='checkbox' name='hasSubs' class='radio' value='true'/><label id='label'>subtitles</label></input>";
				msg += "</div>";
								
				$("#stage").append(msg);
				
				if(hasSubs == true){
					$("#subs").attr("checked", "checked");
				}
								
				if(autoPlay == true){
					$("#autoplay").prop("checked", "checked");
				}
								
				if(autoNext == true){
					$("#autonext").prop("checked", "checked");
				}
								
				//Style it to jQuery UI dialog
				$("#audioEditDialog").dialog({
					autoOpen: true,
					modal: true,
					width: 500,
					height: 200,
					buttons:{
						Cancel: function(){
							$(this).dialog("close");
						},
						Save: function(){
							saveAudioEdit();
						}
					},
					close: function(){
						$(this).remove();
					}
				});
			}).tooltip();
		}
		$(this).scrubContent();	
	}
	
	function addCard(_addID, _isNew){
		//ADD to XML if new....
		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<card><term/><definition/></card>"));
			var newFront1 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack1 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA1 = newFront1.createCDATASection("<p>New Card Term</p>");
			var backCDATA1 = newBack1.createCDATASection("<p>New Card Definition</p>");
			$(data).find("page").eq(currentPage).find("card").eq(_addID).find("term").append(frontCDATA1);
			$(data).find("page").eq(currentPage).find("card").eq(_addID).find("definition").append(backCDATA1);
			cardCount++;
		}
		
		var cardID = "card" + _addID;
		var cardLabel = _addID + 1;
		
		var myCardFront = $(data).find("page").eq(currentPage).find("card").eq(_addID).find("term").text();	
		var myCardBack = $(data).find("page").eq(currentPage).find("card").eq(_addID).find("definition").text();
		var removeID = "removeMedia" + _addID;
		
		var msg = "<div id='"+cardID+"' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='"+removeID+"' value='"+_addID+"' class='removeMedia' title='Remove this image'/>";
		msg += "<div id='"+cardID+"Front'><b>Card " + cardLabel + " Front:</b></div>";
		msg += "<div id='"+cardID+"FrontText'>" + myCardFront + "</div>";
		msg += "<div id='"+cardID+"Back'><b>Card " + cardLabel + " Back:</b></div>";
		msg += "<div id='"+cardID+"BackText'>" + myCardBack + "</div><br/>";
		msg += "</div>";
		
		$("#cardEditDialog").append(msg);
		
		$("#" + removeID).click(function(){
			removeCard($(this).attr("value"));	
		});
							
		$("#"+cardID+"FrontText").redactor({
			buttons: ['html', '|', 'formatting', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'alignleft', 'aligncenter', 'alignright', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'fontcolor', 'backcolor', '|', 'table', 'link', 'image']
		});
				
		$("#"+cardID+"BackText").redactor({
			buttons: ['html', '|', 'formatting', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'alignleft', 'aligncenter', 'alignright', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'fontcolor', 'backcolor', '|', 'table', 'link', 'image']
		});
		
		cardEdit_arr.push(cardID);
	}
	
	function removeCard(_removeID){
		for(var i = 0; i < cardEdit_arr.length; i++){
			if(_removeID == $("#"+cardEdit_arr[i]).attr("value")){
				var arrIndex = i;
				break;
			}
		}
									
		card_arr.splice(arrIndex, 1);
		cardEdit_arr.splice(arrIndex, 1);
		var myItem = "#card" + _removeID;
		$(myItem + "FrontText").destroyEditor();
		$(myItem + "BackText").destroyEditor();
		$(myItem).remove();
	}
	
	/**********************************************************************
	**Save Title Edit
	**********************************************************************/
	function saveTitleEdit(){
		var titleUpdate = $("#titleEditText").getCode().replace('<p>', '').replace('</p>', '');;
		var docu = new DOMParser().parseFromString('<title></title>',  "application/xml");
		var newCDATA=docu.createCDATASection(titleUpdate);
		
		$(data).find("page").eq(currentPage).find("title").empty();
		$(data).find("page").eq(currentPage).find("title").append(newCDATA);
		$("#titleEditDialog").dialog("close");
		sendUpdateWithRefresh();
		fadeComplete();
	};
	
	/**********************************************************************
	**Save Content Edit
	**********************************************************************/
	/**saveContentEdit
	* Sends the updated content to node.
	*/
	function saveContentEdit(){
		//Grab the updated text from redactor.
		var contentUpdate = $("#contentEditText").getCode();
		//We create an xml doc - add the contentUpdate into a CDATA Section
		var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
		var newCDATA=docu.createCDATASection(contentUpdate);
		
		//Update the local xml - first clearning the content node and then updating it with out newCDATA
		$(data).find("page").eq(currentPage).find("content").empty();
		$(data).find("page").eq(currentPage).find("content").append(newCDATA);
		$("#contentEditDialog").dialog("close");
		sendUpdateWithRefresh();
		fadeComplete();
	};
	
	/**********************************************************************
	**Save Card Edit
	**********************************************************************/
	/**saveCardEdit
	* Sends the updated content to node.
	*/
	function saveCardEdit(){
		for(var i = 0; i < cardEdit_arr.length; i++){
			var frontText = $("#"+cardEdit_arr[i]+"FrontText").getCode();
			var backText = $("#"+cardEdit_arr[i]+"BackText").getCode();
			var newCardFront = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newCardBack = new DOMParser().parseFromString('<definition></definition>',  "text/xml");
			var frontCDATA = newCardFront.createCDATASection(frontText);
			var backCDATA = newCardBack.createCDATASection(backText);
			$(data).find("page").eq(currentPage).find("card").eq(i).find("term").empty();
			$(data).find("page").eq(currentPage).find("card").eq(i).find("term").append(frontCDATA);
			$(data).find("page").eq(currentPage).find("card").eq(i).find("definition").empty();
			$(data).find("page").eq(currentPage).find("card").eq(i).find("definition").append(backCDATA);
		}
		
		var extra = $(data).find("page").eq(currentPage).find("card").length;
		var active = cardEdit_arr.length;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("card").eq(i).remove();
		}
		
		$("#cardEditDialog").dialog( "close" );
		sendUpdateWithRefresh();
		fadeComplete();
	};
	
	/**********************************************************************
	**Save Audio Edit
	**********************************************************************/
	/**saveAudioEdit
	* Sends the updated content to node.
	*/
	function saveAudioEdit(){
        var audioPath =  $("#audioPath").val();
	   	var parts = audioPath.split('.'), i, l;
	   	var last = parts.length;

	   	var fileType = (parts[last - 1]);
	   	if(fileType == "mp3"){
            if(audioPath == "yourFile.mp3"){
                $(data).find("page").eq(currentPage).attr("audio", "null");
			}else{
                $(data).find("page").eq(currentPage).attr("audio", audioPath);
			}
			
			var strippedPath = "";
			
			for(var i = 0; i < last-1; i++){
				strippedPath += parts[i];
			}
			
			if($("#subs").prop("checked") == true){
				$(data).find("page").eq(currentPage).attr("subs", strippedPath + ".srt");
			}else{
				$(data).find("page").eq(currentPage).attr("subs", "null");
			}
			
			if($("#autoplay").prop("checked") == true){
				$(data).find("page").eq(currentPage).attr("autoplay", "true");
			}else{
				$(data).find("page").eq(currentPage).attr("autoplay", "false");
			}
						
			if($("#autonext").prop("checked") == true){
				$(data).find("page").eq(currentPage).attr("autonext", "true");
			}else{
				$(data).find("page").eq(currentPage).attr("autonext", "false");
			}
			
			$("#audioEditDialog").dialog("close");
			sendUpdateWithRefresh();
			fadeComplete();
		}else{
          	$("#audioEditDialog").append("<div id='addError' style='color:#FF0000'><br/><br/>* Only .mp3 audio files are supported at this time.</div>");
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////////////////////END EDIT MODE
	
	/**********************************************************************
     **Load Audio Content from Link  -  creates audio player instance at bottom of stage.
     **********************************************************************/
    function loadAudio(){
        var audioString = "<audio id='audioPlayer' src='media/"+myAudio+ "' type='audio/mp3' controls='controls'>";

        //Check for subs - defaults to false.
        if($(data).find("page").eq(currentPage).attr('subs') != undefined && $(data).find("page").eq(currentPage).attr('subs') != "null" && $(data).find("page").eq(currentPage).attr('subs').length != 0){
            hasSubs = true;
            subLink = "media/" + $(data).find("page").eq(currentPage).attr('subs');
        }else{
            hasSubs = false;
        }

        //Check subs - if subs at track node.
        if(hasSubs == true){
            audioString += "<track kind='subtitles' src='" + subLink + "' srclang='en'/>"
        }
		
        audioString += "</audio>";

        $("#audioCon").append(audioString);

        $('#audioPlayer').css({'width':stageW, 'height': 20});

        $('#audioPlayer').mediaelementplayer({
            success: function(player, node) {
                if(autoNext == true){
                    player.addEventListener('ended', function(e) {
                        hasEnded();
                    }, false);
                }
                if(autoPlay == true){
                    player.play();
                }
            }
        });
    }
    ////////////END of loadAudio
	
	//Function called on video/audio complete if autoNext == true
    function hasEnded(){
        $('#next').click();
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
		/*for(var i = 0; i < buttonArray.length; i++){
			$(buttonArray[i]).attr("tabindex", tabindex);
			tabindex++;
		}*/
		$("#content").attr("tabindex", tabindex);
		tabindex++;
		$("#loader").attr("tabindex", tabindex);
	}
	//////////////////////////////////////////////////////////////////////////////////////////////////END ACCESSIBILITY
	
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
    
	function fadeComplete() {
		$('#pageTitle').remove();
		$('#contentHolder').remove();
		$("#flashcardHolder").remove();
		$("#flashcardReshuffle").remove();
		$("#scrollableContent").remove();
		
		if(hasAudio == true){
	    	$('#audioCon').remove();
	    	$('#player').remove();
	    }
	    $("#audioDialog").remove();
		
		$("#audioEdit").remove();
		if(mode == "edit" && dragFile == true){
			siofu.destroy();
			$("#audioDrop").unbind();
			$("#audioDrop").remove();
		}
	    
	    if(mode == "edit"){
		    $("#titleEdit").remove();
		    $("#conEdit").remove();
		    $("#imgEdit").remove();
		    $("#captionEdit").remove();
		    $("#titleDialog").remove();
		    $("#imgDialog").remove();
		    $("#swfDialog").remove();
		    $("#cardEditDialog").remove();
		    $("#cardEdit").remove();
	    }
	    
	    $("#mediaLoader").remove();
	    		    
	    if(hasCaption == true){
		    $('#caption').remove();
	    }
	    	
	    $('#loader').remove();

	    loadPage();
     }
}