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
	
	this.cardCount//number of tabs.
	this.myImage;//image to be loaded.
	this.myPageTitle;//Title of this page.
	this.myContent;//Body
	this.myCaption;//Caption text if needed.
	this.myAudio;
	this.autoplay = false;//Boolean: true - attached media plays on load.  false - user interaction required to play media.  
	this.autoNext = false;//Boolean: true - next page loads automatically upon media completion.  false - user interaction required to load the next page.
    
	var hasCaption = false;
	var hasAudio = false;
    
	var currentCard;
	var card_arr = [];
    
	var imageWidth;
	var imageHeight;
	
	var mediaLink;
	
	var stageW;
	var stageH;
	var stageX;
	var stageY;
	
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
	
	
	 //Defines a public method - notice the difference between the private definition below.
	this.initialize = function(){
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		 
		
		/*****************************************
		**Set template variables.
		*****************************************/
		
		autoNext = $(data).find("page").eq(currentPage).attr('autoNext');
		autoPlay = $(data).find("page").eq(currentPage).attr('autoplay');
		
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
		if($(data).find("page").eq(currentPage).attr('audio') != undefined){
			if($(data).find("page").eq(currentPage).attr('audio').length != 0){
				hasAudio = true;
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
		
		 //Add classes for page layouts - updatable in css
		 $('#stage').append('<div id="contentHolder" class="nano top"><div id="content" class="overthrow content"></div></div>');
		 
		 
		  $("#contentHolder").addClass("top");
            $("#stage").append("<div id='testTop' class='testTop'></div>");
            $("#testTop").append(myContent);
            var conHeight = $("#testTop").height();
            $("#testTop").remove();
            $("#contentHolder").height(conHeight);
		 
		 $("#content").append(myContent);
		
		 $(".nano").nanoScroller({
        		flashDelay: 1000,
               flash: true
		});
		
		shuffle();		
		//check the xml for audio / if so, kick off audio code.
		if(hasAudio == true){
			loadAudio()
		}
		
	}
	
	function shuffle(){
		//FLASHCARDS
		currentCard = cardCount - 1;
		$('#stage').append('<div id="flashcardHolder"></div>');
		$("#flashcardHolder").css({'top': $("#content").position().top + $("#content").height() - 10, 'height': $("#stage").height() - ($("#content").position().top + $("#content").height() -10)});
		
		for(var i=0; i<cardCount; i++){
			
			var myTerm = $(data).find("page").eq(currentPage).find("card").eq(i).find("term").text();
			var myDef = $(data).find("page").eq(currentPage).find("card").eq(i).find("definition").text();
			var tempID = "card" + i;
			var tempTextID = "cardText" + i;
			if(type == "flashcardText"){
				$("#flashcardHolder").append("<div id='"+tempID+"' class='flashcard'><div id='"+tempTextID +"' class='cardText'>"+myTerm+"</div></div>");
			}else if(type == "flashcardMedia"){
				$("#flashcardHolder").append("<div id='"+tempID+"' class='flashcard'><div id='"+tempTextID +"' class='cardImg' style='" + myTerm + "'></div></div>");
			}
			$("#" + tempID).css({	'top': ($("#flashcardHolder").height() - $("#" + tempID).height())/2 + (i * 4) - ((cardCount * 4) /2),
								'left': (($("#stage").width() - $("#content").position().left *2) -  (($("#" + tempID).width()) * 2 + 100))/2 + (i*4)					
			});
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
	
	var virgin = true;
	
	var myIndex = 1;
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
						$("#flashcardHolder").remove();
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
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: saveTitleEdit
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
			$('#stage').append("<div id='conEdit' class='btn_edit_text' title='Edit Text Content'></div>");
			$("#conEdit").css({'position':'absolute', 'top':$("#contentHolder").position().top - 15, 'left': $("#contentHolder").position().left + $("#contentHolder").width() - 15});
				
			$("#conEdit").click(function(){
									
				//Create the Content Edit Dialog
				$("#stage").append("<div id='contentEditDialog' title='Input Page Content'><div id='contentEditText' type='text' style='width:" + $('#contentHolder').width() + "; height:85%' >" + myContent + "</div>");
						
				var myHeight;
						
				if($("#content").height() < 300){
					myHeight = 300;
				}else if($("#content").height() > (stageH - 80)){
					myHeight = stageH - 80;
				}else{
					myHeight = $("#content").height();
				}
				//Style it to jQuery UI dialog
				$("#contentEditDialog").dialog({ 	
					autoOpen: true,
					modal: true,
					width: $("#content").width() + 100,
					height: myHeight + 150,
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: saveContentEdit
				});
						
				$("#contentEditText").redactor({
					focus: true,
					buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
				});
			}).tooltip();
			
			/**
			* Edit Cards
			*/
			$('#stage').append("<div id='cardEdit' class='btn_edit_text' title='Edit Cards'></div>");
			$("#cardEdit").css({'position':'absolute', 'top':$("#contentHolder").position().top +  $("#contentHolder").height() , 'left': $("#conEdit").position().left});
			
			$("#cardEdit").click(function(){
			
			
			//Create the Content Edit Dialog
				$("#stage").append("<div id='cardEditDialog' title='Input Card Content'></div>");
				for(var i = 0; i < cardCount; i++){
					var cardID = "card" + i;
					var cardLabel = i + 1;
					
					var myCardFront = $(data).find("page").eq(currentPage).find("card").eq(i).find("term").text();	
					var myCardBack = $(data).find("page").eq(currentPage).find("card").eq(i).find("definition").text();	
					console.log(myCardFront);				
					$("#cardEditDialog").append("<div id='"+cardID+"Front'>Card " + cardLabel + " Front:</div> <div id='"+cardID+"FrontText'>" + myCardFront + "</div><div id='"+cardID+"Back'>Card " + cardLabel + " Back:</div> <div id='"+cardID+"BackText'>" + myCardBack + "</div><br/>");
					
					$("#"+cardID+"FrontText").redactor({
						buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
					});
					
					$("#"+cardID+"BackText").redactor({
						buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
					});
						
					cardEdit_arr.push(cardID);
				}
						
				//Style it to jQuery UI dialog
				$("#cardEditDialog").dialog({ 	
					autoOpen: true,
					modal: true,
					width: 600,
					height: 500,
					buttons: {
						Add: function(){
							
							var cardID = "card" + cardCount;
							var cardLabel = cardCount + 1;
							
							var myCardContent = "New Card Content";
							$("#cardEditDialog").append("<div id='"+cardID+"Front'>Card " + cardLabel + " Front:</div> <div id='"+cardID+"FrontText'>" + myCardFront + "</div><div id='"+cardID+"Back'>Card " + cardLabel + " Back:</div> <div id='"+cardID+"BackText'>" + myCardBack + "</div><br/>");
							
							$("#"+cardID+"FrontText").redactor({
								buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
							});
							
							$("#"+cardID+"BackText").redactor({
								buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
							});
							
							$(data).find("page").eq(currentPage).append($("<card><term/><definition/></card>"));
							var newFront1 = new DOMParser().parseFromString('<term></term>',  "text/xml");
							var newBack1 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
							var frontCDATA1 = newFront1.createCDATASection("<p>New Card Term</p>");
							var backCDATA1 = newBack1.createCDATASection("<p>New Card Definition</p>");
							$(data).find("page").eq(currentPage).find("card").eq(cardCount).find("term").append(frontCDATA1);
							$(data).find("page").eq(currentPage).find("card").eq(cardCount).find("definition").append(backCDATA1);
							
								
							cardCount++;
							cardEdit_arr.push(cardID);	
						},
						Save: function(){
							$( this ).dialog( "close" );
						}
					},
					close: saveCardEdit
				});
			}).tooltip();
		}
		$(this).scrubContent();	
	}
	
	var cardEdit_arr = [];
	
	/**********************************************************************
	**Save Title Edit
	**********************************************************************/
	function saveTitleEdit(){
		var titleUpdate = $("#titleEditText").getCode();
		var docu = new DOMParser().parseFromString('<title></title>',  "application/xml");
		var newCDATA=docu.createCDATASection(titleUpdate);
		$("#pageTitle").html($("#titleEditText").html());
		$("#titleEditText").destroyEditor();
		$(data).find("page").eq(currentPage).find("title").empty();
		$(data).find("page").eq(currentPage).find("title").append(newCDATA);
		sendUpdateWithRefresh();
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
		//Now, destroy redactor.
		$("#content").html($("#contentEditText").html());
		$("#contentEditText").destroyEditor();
		//Update the local xml - first clearning the content node and then updating it with out newCDATA
		$(data).find("page").eq(currentPage).find("content").empty();
		$(data).find("page").eq(currentPage).find("content").append(newCDATA);
		
		sendUpdate();
	};
	
	/**********************************************************************
	**Save Card Edit
	**********************************************************************/
	/**saveCardEdit
	* Sends the updated content to node.
	*/
	function saveCardEdit(){
		for(var i = 0; i < cardEdit_arr.length; i++){
			//var revealImg = $("#"+revealEdit_arr[i]+"ImageText").val();
			//var imgW = $("#"+revealEdit_arr[i]+"Width").val();
			//var imgH = $("#"+revealEdit_arr[i]+"Height").val();
			/*if(type == "revealRight" || type == "revealLeft"){
				var boxW = parseInt(imgW) + 10;
			}else{
				var boxW = 280;
			}*/
			//var boxH = parseInt(imgH) + 10;
			//var imgAttr = 'position:relative; top:5px; left:5px; width:' + imgW + 'px; height:' + imgH + 'px; background:url('+ revealImg +') no-repeat; background-size: ' + imgW + 'px ' + imgH + 'px;" alt="Default Image Picture"';
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
			
			$("#"+cardEdit_arr[i]+"FrontText").destroyEditor();
			$("#"+cardEdit_arr[i]+"BackText").destroyEditor();
		}

		$("#cardEditDialog").remove();
		sendUpdate();
		fadeComplete();
	};
	
	//////////////////////////////////////////////////////////////////////////////////////////////////END EDIT MODE
	
	/**********************************************************************
     **Load Audio Content from Link  -  creates audio player instance at bottom of stage.
     **********************************************************************/
    function loadAudio(){
        var contentH = $("#contentHolder").height();
        var contentW = $("#contentHolder").width();
        var contentX = $("#contentHolder").position().left;
        var contentY = $("#contentHolder").position().top;
        var titleY = $("#pageTitle").position().top;
        var titleH = $("#pageTitle").height();

        var audioString = "<audio id='audioPlayer' src='"+myAudio+ "' type='audio/mp3' controls='controls'>";

        //Check for subs - defaults to false.
        if($(data).find("page").eq(currentPage).attr('subs') != undefined && $(data).find("page").eq(currentPage).attr('subs') != "null" && $(data).find("page").eq(currentPage).attr('subs').length != 0){
            hasSubs = true;
            subLink = $(data).find("page").eq(currentPage).attr('subs');
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

                if(autoNext == "true"){
                    player.addEventListener('ended', function(e) {
                        hasEnded();
                    }, false);
                }
                if(autoPlay == "true"){
                    player.play();
                }
            }
        });
    }
    ////////////END of loadAudio
	
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
		
		
		if(hasAudio == true){
	    		$('#audioCon').remove();
	    		$('#player').remove();
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
	    		    
	    if(hasCaption == true){
		    $('#caption').remove();
	    }
	    	
	    $('#loader').remove();

	    loadPage();
     }
}
















