/*!
 * C_Reveal
 * This class creates a template for placing clickable images - reaveals text.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2013-03-04
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_Reveal(_type) {
	
	var revealCount//number of tabs.
	var myPageTitle;//Title of this page.
	var myContent;//Body
	var myAudio;
    
	var hasCaption = false;
	var hasAudio = false;

    
	var imageWidth;
	var imageHeight;
	
	var mediaLink;
	
	var stageW = $("#stage").width();
    var stageH = $("#stage").height();
    var audioShim = 0;
	
	var titleY;
	
	var imgW;
	var imgH;
	
    var contentY;
	var contentH;
	
	var rev_arr = [];
	var revealEdit_arr = [];
	var editStartLength;
	
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
		//Position the page title
		myPageTitle = $(data).find("page").eq(currentPage).find('title').text();
		
		//Position the page text
				
		revealCount = $(data).find("page").eq(currentPage).find("reveal").length;
		
		myContent = $(data).find("page").eq(currentPage).find("content").text();		
		
		//Check if the page has an associated audio file.
		if($(data).find("page").eq(currentPage).attr('audio') != undefined){
			if($(data).find("page").eq(currentPage).attr('audio').length != 0 && $(data).find("page").eq(currentPage).attr('audio') != "null"){
				hasAudio = true;
				myAudio = $(data).find("page").eq(currentPage).attr('audio');
			}
		}

		buildTemplate();
	}
	
	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
				
		//Add the divs for the page title and the tabs divs.		
		$('#stage').append('<div id="pageTitle"></div>');
		$("#pageTitle").append(myPageTitle);
		
		$("#stage").append('<div id="scrollableContent" class="nano"><div id="contentHolder" class="overthrow content"><div id="content">' + $(data).find("page").eq(currentPage).find("content").text() + '</div></div></div>');
		$("#scrollableContent").css("overflow", "visible");
		$("#contentHolder").addClass("top");
        $("#content").addClass("top");
        var conSpot = $("#scrollableContent").position().top;
        $("#contentHolder").height(stageH - (audioShim + conSpot));
        //$("#content").width($("#contentHolder").width());
        $("#scrollableContent").height(stageH - ($("#scrollableContent").position().top + audioShim));
		var myTop = $("#content").height();
		
		var interact = $(data).find("page").eq(currentPage).attr("interact");
		var horPos = 0;
		var verPos = myTop;
		
			
		for(var i = 0; i < revealCount; i++){
			
			var currentImg = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("imgStyle");
			var currentAlt = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("alt");
			var currentStyle = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("style");
			var myContent = $(data).find("page").eq(currentPage).find("reveal").eq(i).text();
	
			//if mobile revealBottom type and revealTop type will be handled as revealRight for UI reasons
			if(windowWidth <= mobileWidth){
				if(type == "revealBottom" || type == "revealTop"){
					type = "revealRight";
				}  
				currentStyle = "width:160px; height:160px;"
			}			
			
			var revID = "revID" + i;
			
			if(type == "revealRight"){
				$("#content").append("<div id='"+revID+"' class='"+ type +"' style='"+ currentStyle+"'><div id='"+ revID + "Img' class='"+type+"Image' style='"+ currentImg+"'/></div><br/>");
			}else if (type == "revealBottom"){
				$("#content").append("<div id='"+revID+"' class='"+ type +"' style='"+ currentStyle+" left:"+ horPos +"px; position:absolute;'><div id='"+ revID + "Img' class='"+type+"Image' style='"+ currentImg+"'/></div>");
			}else if (type == "revealTop"){
				$("#content").append("<div id='"+revID+"' class='"+ type +"' style='"+ currentStyle+" bottom:30px; left:"+ horPos +"px; position:absolute;'><div id='"+ revID + "Img' class='"+type+"Image' style='"+ currentImg+"'/></div>");
			}else if (type == "revealLeft"){
				$("#content").append("<div id='"+revID+"' class='"+ type +"' style='"+ currentStyle+" right:30px; top:"+verPos + "px; position:absolute;'><div id='"+ revID + "Img' class='"+type+"Image' style='"+ currentImg+"'/></div><br/>");
			}
			
			$("#"+revID).data("myText", myContent);
			$("#"+revID).data("myWidth", $("#"+revID).width());
			$("#"+revID).data("myHeight", $("#"+revID).height());
			$("#"+revID).data("myLeft", $("#"+revID).position().left);
			if(type != "revealTop"){
				$("#"+revID).data("myTop", $("#"+revID).position().top);
			}else{
				$("#"+revID).data("myTop", $("#"+revID).position().bottom);
			}
			
			////////////////////////////////////////  PLACE THE INTERACTIONS  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
			if(interact == "click"){
				$("#"+revID).hover(function(){
					if(type == "revealRight"){
						TweenMax.to($(this), transitionLength, {css:{width:$(this).width() + 20}, ease:transitionType});
					}else if(type == "revealBottom"){
						TweenMax.to($(this), transitionLength, {css:{height:$(this).height() + 20}, ease:transitionType});
					}else if (type == "revealTop"){
						TweenMax.to($(this), transitionLength, {css:{height:$(this).height() + 20, top: $(this).position().bottom + 20}, ease:transitionType});
					}else if (type == "revealLeft"){
						TweenMax.to($(this), transitionLength, {css:{width:$(this).width() + 20, left: $(this).position().left - 20}, ease:transitionType});
					}
				},function(){
					if(type == "revealRight"){
						TweenMax.to($(this), transitionLength, {css:{width:$(this).data("myWidth")}, ease:transitionType});
					}else if(type == "revealBottom"){
						TweenMax.to($(this), transitionLength, {css:{height:$(this).data("myHeight")}, ease:transitionType});
					}else if (type == "revealTop"){
						TweenMax.to($(this), transitionLength, {css:{height:$(this).data("myHeight"), bottom: $(this).data("myTop")}, ease:transitionType});
					}else if (type == "revealLeft"){
						TweenMax.to($(this), transitionLength, {css:{width:$(this).data("myWidth"), left: $(this).data("myLeft")}, ease:transitionType});
					}
				}).click(function(){
					$(this).unbind('mouseenter mouseleave click');
					if(type == "revealRight"){
						TweenMax.to($(this), transitionLength, {css:{width:$("#contentHolder").width() - ($("#content").position().left * 2)}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							
							$("#" + currentSelected).append("<div id='"+currentSelected+"Text' class='revealText'>" + currentShowText + "</div>");
							$("#" + currentSelected + "Text").css({'position':'relative', 
															'width':$("#" + currentSelected).width() - $("#" + currentSelected + "Img").width() - ($("#" + currentSelected + "Img").position().left * 2) - 25, 
															'left': $("#" + currentSelected + "Img").width() + ($("#" + currentSelected + "Img").position().left * 2) + 10, 
															'top' :  -145,
															'height' : $("#" + currentSelected).height() - 10,
															'opacity':0
															});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}else if(type == "revealBottom"){
						TweenMax.to($(this), transitionLength, {css:{height:$("#contentHolder").height() - ($("#content").position().top + myTop + 20)}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).append("<div id='"+currentSelected+"Text' class='revealText'>" + $("#" + currentSelected).data("myText") + "</div>");
							$("#" + currentSelected + "Text").css({'position':'absolute', 
															'height':$("#" + currentSelected).height() - $("#" + currentSelected + "Img").height() - ($("#" + currentSelected + "Img").position().top * 2) - 25, 
															'top': $("#" + currentSelected + "Img").height() + ($("#" + currentSelected + "Img").position().top * 2) + 10, 
															'left' : 5,
															'width' : $("#" + currentSelected).width() - 10,
															'opacity':0
															});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}else if (type == "revealTop"){
						TweenMax.to($(this), transitionLength, {css:{height:$("#contentHolder").height() - ($("#content").position().top + myTop + 20)/*, bottom: $("#content").position().top - myTop - 20*/}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).append("<div id='"+currentSelected+"Text' class='revealText'>" + $("#" + currentSelected).data("myText") + "</div>");
							$("#" + currentSelected + "Text").css({'position':'absolute', 
															'height':$("#" + currentSelected).height() - $("#" + currentSelected + "Img").height() - 25, 
															'top': 10, 
															'left' : 5,
															'width' : $("#" + currentSelected).width() - 10,
															'opacity':0
															});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}else if (type == "revealLeft"){
						TweenMax.to($(this), transitionLength, {css:{width:$("#contentHolder").width() - ($("#content").position().left * 2 + 10), left: 0}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).append("<div id='"+currentSelected+"Text' class='revealText'>" + $("#" + currentSelected).data("myText") + "</div>");
							$("#" + currentSelected + "Text").css({'position':'absolute', 
															'width':$("#" + currentSelected).width() - $("#" + currentSelected + "Img").width() - 25, 
															'left': 10, 
															'top' : 5,
															'height' : $("#" + currentSelected).height() - 10,
															'opacity':0
															});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}
				});
			}else{
				$("#"+revID).hover(function(){
					$(this).unbind('mouseenter mouseleave');
					if(type == "revealRight"){
						TweenMax.to($(this), transitionLength, {css:{width:$("#contentHolder").width() - ($("#content").position().left * 2)}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							
							$("#" + currentSelected).append("<div id='"+currentSelected+"Text' class='revealText'>" + currentShowText + "</div>");
							$("#" + currentSelected + "Text").css({'position':'relative', 
															'width':$("#" + currentSelected).width() - $("#" + currentSelected + "Img").width() - ($("#" + currentSelected + "Img").position().left * 2) - 25, 
															'left': $("#" + currentSelected + "Img").width() + ($("#" + currentSelected + "Img").position().left * 2) + 10, 
															'top' :  -145,
															'height' : $("#" + currentSelected).height() - 10,
															'opacity':0
															});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}else if(type == "revealBottom"){
						TweenMax.to($(this), transitionLength, {css:{height:$("#contentHolder").height() - ($("#content").position().top + myTop + 20)}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).append("<div id='"+currentSelected+"Text' class='revealText'>" + $("#" + currentSelected).data("myText") + "</div>");
							$("#" + currentSelected + "Text").css({'position':'absolute', 
															'height':$("#" + currentSelected).height() - $("#" + currentSelected + "Img").height() - ($("#" + currentSelected + "Img").position().top * 2) - 25, 
															'top': $("#" + currentSelected + "Img").height() + ($("#" + currentSelected + "Img").position().top * 2) + 10, 
															'left' : 5,
															'width' : $("#" + currentSelected).width() - 10,
															'opacity':0
															});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}else if (type == "revealTop"){
						TweenMax.to($(this), transitionLength, {css:{height:$("#contentHolder").height() - ($("#content").position().top + myTop + 20)/*, bottom: $("#content").position().top - myTop - 20*/}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).append("<div id='"+currentSelected+"Text' class='revealText'>" + $("#" + currentSelected).data("myText") + "</div>");
							$("#" + currentSelected + "Text").css({'position':'absolute', 
															'height':$("#" + currentSelected).height() - $("#" + currentSelected + "Img").height() - 25, 
															'top': 10, 
															'left' : 5,
															'width' : $("#" + currentSelected).width() - 10,
															'opacity':0
															});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}else if (type == "revealLeft"){
						TweenMax.to($(this), transitionLength, {css:{width:$("#contentHolder").width() - ($("#content").position().left * 2 + 10), left: 0}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).append("<div id='"+currentSelected+"Text' class='revealText'>" + $("#" + currentSelected).data("myText") + "</div>");
							$("#" + currentSelected + "Text").css({'position':'absolute', 
															'width':$("#" + currentSelected).width() - $("#" + currentSelected + "Img").width() - 25, 
															'left': 10, 
															'top' : 5,
															'height' : $("#" + currentSelected).height() - 10,
															'opacity':0
															});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}
				});
			}
			horPos += $("#" + revID).width() + 40;
			verPos += $("#" + revID).height() + 20;
			rev_arr.push(revID);
		}
		
		if(type == "revealRight" || type == "revealLeft"){
			$("#content").height(verPos);
		}else{
			$("#content").height(myTop + ($("#contentHolder").height() - ($("#content").position().top + myTop)));
		}
				
		if(transition == true){
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
		}else{
			checkMode();
		}						
		
		//check the xml for audio / if so, kick off audio code.
        if(hasAudio == true){
            $('#stage').append('<div id="audioCon"></div>');
            loadAudio();
        }
	}
	
	/**********************************************************************
	**Load Audio Content from Link  -  creates audio player instance at bottom of stage.
	**********************************************************************/
	function loadAudio(){
		var contentH = $("#content").height();
		var contentW = $("#content").width();
		var contentX = $("#content").position().left;
		var contentY = $("#content").position().top;
		var titleY = $("#pageTitle").position().top;
		var titleH = $("#pageTitle").height();
		
		$("#audioCon").append("<audio id='audioPlayer' src='media/"+myAudio+ "' type='audio/mp3' controls='controls'></audio>");
		$('#audioPlayer').css({'width':$("#stage").width(), 'height': 20});
	    	
	    	
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
	PAGE EDIT FUNCTIONALITY
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	function checkMode(){
		$(".nano").nanoScroller({
        	flashDelay: 1000,
			flash: true
		});
		if(mode == "edit"){
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
	
								$("#stage").append("<div id='audioEditDialog' title='Input Audio Path'><input id='audioPath' type='text' value="+ audioText + " defaultValue="+ audioText + " style='width:100%;'/></div>");
	
								//Style it to jQuery UI dialog
								$("#audioEditDialog").dialog({
									autoOpen: true,
									modal: true,
									width: 500,
									height: 200,
									buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
									close: saveAudioEdit
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

				$("#stage").append("<div id='audioEditDialog' title='Input Audio Path'><input id='audioPath' type='text' value="+ audioText + " defaultValue="+ audioText + " style='width:100%;'/></div>");

				//Style it to jQuery UI dialog
				$("#audioEditDialog").dialog({
                    autoOpen: true,
					modal: true,
					width: 500,
					height: 200,
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: saveAudioEdit
				});
			}).tooltip();

			
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
			$('#contentHolder').append("<div id='conEdit' class='btn_edit_text' title='Edit Text Content'></div>");
			$("#conEdit").css({'position':'absolute', 'top':$("#content").position().top, 'left': $("#content").position().left + $("#content").width() - 18});
			
			$("#conEdit").click(function(){			
				revealEdit_arr.length = 0;
				//Create the Content Edit Dialog
				var msg = "<div id='contentEditDialog' title='Input Page Content'>";
				msg += "<label id='hover'>Hover: </label>";
				msg += "<input id='isHover' type='checkbox' name='hover' class='radio' value='true'/><br/>";
				msg += "<div id='contentEditText' type='text' style='width:" + $('#content').width() + "; height:85%'>" + myContent + "</div>";
				msg += "</div><br/>";
				$("#stage").append(msg);
				
				editStartLength = revealCount;	
				//Cycle through the tabs from the xml
				for(var i = 0; i < revealCount; i++){
					var revealID = "reveal" + i;
					var revealLabel = i + 1;
					
					//Get image info
					var bg = $("#"+rev_arr[i]+"Img").css('background-image')
					bg = bg.replace('url(','').replace(')','');
					var myImage = bg;
					var parts = myImage.split('/'), i, l;
					var last = parts.length;
			
					mediaString = (parts[last - 1]);
					var revealImgHeight = $("#"+rev_arr[i]+"Img").css('height');
					var revealImgWidth = $("#"+rev_arr[i]+"Img").css('width');
					
					revealImgHeight = revealImgHeight.replace('px','');
					revealImgWidth = revealImgWidth.replace('px','');
					
					var msg = "<div id='"+revealID+"Container' class='templateAddItem' value='"+i+"'>";
					msg += "<div id='"+revealID+"Remove' class='removeMedia' value='"+i+"' title='Click to remove this reveal'/>";
					msg += "<b>Reveal "+revealLabel+":</b>";
					msg += "<label id='"+revealID+"Image'><br/><b>Image:</b></label>";
					msg += "<input id='"+revealID+"ImageText' type='text' value='"+mediaString+"' defaultValue='"+mediaString+"' style='width:40%;'/>";
					msg += "<label> <b>Width: </b></label>";
					msg += "<input id='"+revealID+"Width'  type='text' value='" + revealImgWidth + "' defaultValue='" + revealImgWidth + "' style='width:10%;'/>";
					msg += "<label> <b>Height: </b></label>";
					msg += "<input id='"+revealID+"Height'  type='text' value='" + revealImgHeight + "' defaultValue='" + revealImgHeight + "' style='width:10%;'/>";
					var myRevealContent = $(data).find("page").eq(currentPage).find("reveal").eq(i).text();	
					msg += "<div><b>Content:</b></div>";
					msg += "<div id='"+revealID+"ContentText'>" + myRevealContent + "</div>";
					msg += "</div>";
					$("#contentEditDialog").append(msg);
					
					$("#" +revealID+"Remove").click(function(){
						removeReveal($(this).attr("value"));
					});//.tooltip();
					
					$("#"+revealID+"ContentText").redactor({
						buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'fontcolor', 'backcolor']
					});
						
					revealEdit_arr.push(revealID);
				}
					
				//Style it to jQuery UI dialog
				$("#contentEditDialog").dialog({ 	
					//autoOpen: true,
					modal: true,
					width: 875,
					height: 750,
					resizable: false,
					//show: 'fold',
					//hide: 'fold',
					close: function(){
						$("#contentEditText").destroyEditor();
						for(var i = 0; i < revealEdit_arr.length; i++){
							$("#"+revealEdit_arr[i]+"ContentText").destroyEditor();
						}
					},
					buttons: {
						Add: function(){
							editStartLength++;
							var revealCount = revealEdit_arr.length;
							var revealID = "reveal" + revealCount;
							var revealLabel = revealCount + 1;
							
							var msg = "<div id='"+revealID+"Container' class='templateAddItem' value='"+revealCount+"'>";
							msg += "<div id='"+revealID+"Remove' class='removeMedia' value='"+revealCount+"' title='Click to remove this reveal'/>";
							msg += "<b>Reveal "+revealLabel+":</b>";
							msg += "<label id='"+revealID+"Image'><br/><b>Image:</b></label> <input id='"+revealID+"ImageText' type='text' value='"+mediaString+"' defaultValue='"+mediaString+"' style='width:40%;'/>";
							if(type == "revealRight" || type == "revealLeft"){
								backgroundWidth = 160;
							}else{
								backgroundWidth = 280;
							}
							msg += "<label> <b>Width: </b></label><input id='"+revealID+"Width'  type='text' value='" + revealImgWidth + "' defaultValue='" + revealImgWidth + "' style='width:10%;'/>";
							msg += "<label> <b>Height: </b></label><input id='"+revealID+"Height'  type='text' value='" + revealImgHeight + "' defaultValue='" + revealImgHeight + "' style='width:10%;'/>";
							var myRevealContent = "New Reveal Content";
							msg += "<div id='"+revealID+"Content'><b>Content:</b></div> <div id='"+revealID+"ContentText'>" + myRevealContent + "</div>";
							msg += "</div>"
							$("#contentEditDialog").append(msg);
							
							$("#" +revealID+"Remove").on('click', function(){
								removeReveal($(this).attr("value"));
							});
							
							$("#"+revealID+"ContentText").redactor({
								buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'fontcolor', 'backcolor']
							});
							
							var boxWidth = $("#"+revealID+"Width").width() + 10;
							var boxHeight = $("#"+revealID+"Height").height() + 10;
							$(data).find("page").eq(currentPage).append($("<reveal>"));
							var newRevealContent1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
							var revealCDATA1 = newRevealContent1.createCDATASection("<p>New Reveal Content</p>");
							$(data).find("page").eq(currentPage).find("reveal").eq(revealCount).append(revealCDATA1);
							$(data).find("page").eq(currentPage).find("reveal").eq(revealCount).attr('style', 'width:'+backgroundWidth+'px; height:160px;');
							$(data).find("page").eq(currentPage).find("reveal").eq(revealCount).attr('imgStyle', 'position:relative; top:5px; left:5px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Image Picture"');
								
							revealEdit_arr.push(revealID);	
						},
						Save: function(){
							saveContentEdit();
						}
					}
				});
					
				$("#contentEditText").redactor({
					focus: true,
					buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'fontcolor', 'backcolor']
				});
			}).tooltip();
		}
		$(this).scrubContent();	
	}
	
	function removeReveal(_id){
		for(var i = 0; i < revealEdit_arr.length; i++){
			if(_id == $("#"+revealEdit_arr[i]+"Container").attr("value")){
				var arrIndex = i;
				break;
			}
		}
		$(data).find("pages").eq(currentPage).find("reveal").eq(arrIndex).remove();
		revealEdit_arr.splice(arrIndex, 1);
		$("#reveal"+_id+"ContentText").destroyEditor();
		$("#reveal" + _id +"Container").remove();
	}
	
	/**********************************************************************
	**Save Title Edit
	**********************************************************************/
	function saveTitleEdit(){
		var titleUpdate = $("#titleEditText").getCode().replace('<p>', '').replace('</p>', '');;
		var docu = new DOMParser().parseFromString('<title></title>',  "application/xml");
		var newCDATA=docu.createCDATASection(titleUpdate);
		$("#pageTitle").html(titleUpdate);
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
		if($("#isHover").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr('interact', "hover");
		}else{
			$(data).find("page").eq(currentPage).attr('interact', "click");
		}
		//Grab the updated text from redactor.
		var contentUpdate = $("#contentEditText").getCode();
		contentUpdate.replace('<p>','').replace('</p>','');
		//We create an xml doc - add the contentUpdate into a CDATA Section
		var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
		var newCDATA=docu.createCDATASection(contentUpdate);
		//Now, destroy redactor.
		$("#contentEditText").destroyEditor();
		//Update the local xml - first clearning the content node and then updating it with out newCDATA
		$(data).find("page").eq(currentPage).find("content").empty();
		$(data).find("page").eq(currentPage).find("content").append(newCDATA);
		for(var i = 0; i < revealEdit_arr.length; i++){
			var revealImg = $("#"+revealEdit_arr[i]+"ImageText").val();
			var imgW = $("#"+revealEdit_arr[i]+"Width").val();
			var imgH = $("#"+revealEdit_arr[i]+"Height").val();
			if(type == "revealRight" || type == "revealLeft"){
				var boxW = parseInt(imgW) + 10;
				var imgAttr = 'position:relative; top:5px; left:5px; width:' + imgW + 'px; height:' + imgH + 'px; background:url(media/'+ revealImg +') no-repeat; background-size: ' + imgW + 'px ' + imgH + 'px;" alt="Default Image"';
			}else{
				var boxW = 280;
				if(type == "revealBottom"){
					var imgAttr = 'position:relative; margin-left:auto; margin-right:auto; top:5px; left:5px; width:' + imgW + 'px; height:' + imgH + 'px; background:url(media/'+ revealImg +') no-repeat; background-size: ' + imgW + 'px ' + imgH + 'px;" alt="Default Image"';
				}else{
					var imgAttr = 'position:absolute; margin-left:auto; margin-right:auto; bottom:5px; right:65px; width:' + imgW + 'px; height:' + imgH + 'px; background:url(media/'+ revealImg +') no-repeat; background-size: ' + imgW + 'px ' + imgH + 'px;" alt="Default Image"';
				}
			}
			var boxH = parseInt(imgH) + 10;
			var revealText = $("#"+revealEdit_arr[i]+"ContentText").getCode();
			var newRevealContent = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA = newRevealContent.createCDATASection(revealText);
			$(data).find("page").eq(currentPage).find("reveal").eq(i).empty();
			$(data).find("page").eq(currentPage).find("reveal").eq(i).append(revealCDATA);
			$(data).find("page").eq(currentPage).find("reveal").eq(i).attr("title", imgAttr);
			$(data).find("page").eq(currentPage).find("reveal").eq(i).attr('style', 'width:'+boxW+'px; height:'+ boxH+'px;');
			$(data).find("page").eq(currentPage).find("reveal").eq(i).attr('imgStyle', imgAttr);
			$("#"+revealEdit_arr[i]+"ContentText").destroyEditor();
		}
		
		var extra = $(data).find("page").eq(currentPage).find("reveal").length;
		var active = revealEdit_arr.length;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("reveal").eq(i).remove();
		}

		$("#contentEditDialog").remove();
		sendUpdateWithRefresh();
		fadeComplete();
	};
	
	
	/**********************************************************************
	**Save Image Edit
	**********************************************************************/
	/**saveImageEdit
	* Sends the updated image to node.
	*/
	function saveImageEdit(){
		var imgPath = $("#imgPath").val();
		var startPath = $("#imgPath").attr("defaultValue");
		if(imgPath != startPath){
			var parts = imgPath.split('.'), i, l;
			var last = parts.length;
		
			mediaType = (parts[last - 1]);
			if(mediaType != "swf"){
				$(data).find("page").eq(currentPage).attr("img", imgPath);
				sendUpdate();
				fadeComplete();
			}else{
				//If its a swf we have to set it's width and height! - very imoprtant or shit get funky homey....
				$(data).find("page").eq(currentPage).attr("img", imgPath);
				$("#loader").append("<div id='swfDialog' title='Input SWF Stats'><div>SWF Width: <input id='swfWidth' type='text' value="+ 000 + " defaultValue="+ 000 + " style='width:100%;'/></div><div>SWF Height: <input id='swfHeight' type='text' value="+ 000 + " defaultValue="+ 000 + " style='width:100%;'/></div></div>");
				$("#swfDialog").dialog({ 	
					autoOpen: true,
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: function(){
						$(data).find("page").eq(currentPage).attr("w", $("#swfWidth").val()); 
						$(data).find("page").eq(currentPage).attr("h", $("#swfHeight").val());
						sendUpdate();
						fadeComplete();
					}
				});
			}
		}				
	};
	
	/**********************************************************************
	**Save Caption Edit
	**********************************************************************/
	function saveCaptionEdit(){
		var captionUpdate = $("#captionEditText").getCode();
		var docu = new DOMParser().parseFromString('<caption></caption>',  "application/xml");
		var newCDATA=docu.createCDATASection(captionUpdate);
		$("#caption").html($("#captionEditText").html());
		$("#captionEditText").destroyEditor();
		$(data).find("page").eq(currentPage).find("caption").empty();
		$(data).find("page").eq(currentPage).find("caption").append(newCDATA);
		sendUpdateWithRefresh();
	};
	
	
	/**********************************************************************
     **Save Audio Edit
     **********************************************************************/
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
			$("#audioEditDialog").remove();
			sendUpdateWithRefresh();
			fadeComplete();
		}else{
          	$("#audioEditDialog").append("<div id='addError' style='color:#FF0000'><br/><br/>* Only .mp3 audio files are supported at this time.</div>");
		}
	};
	//////////////////////////////////////////////////////////////////////////////////////////////////END EDIT MODE
	
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
	
	
	
	//Function called on video complete if autoNext == true
	function hasEnded(){
		$('#next').click();
	}
	
	
    
    this.destroySelf = function() {
	   if(transition == true){
	   		TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:transitionType, onComplete:fadeComplete});
	   	}else{
		   	fadeComplete();
	   	}
    }

	
	function setCaption(){
		if(hasCaption == true){
			$('#stage').append('<div id="caption"></div>');
			$('#caption').append(myCaption);
			$('#caption').css({'position':'absolute', 'top':$("#loader").position().top + $('#loader').height() + 5, 'left': $("#loader").position().left, 'width':$("#loader").width()});
			
			if(transition == true){
				$('#caption').css({'opacity': 0});
				TweenMax.to($('#caption'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:showCaptionEdit});
			}
		}
	}
	
	function showCaptionEdit(){
		if(mode == "edit"){
			$('#stage').append("<div id='captionEdit' class='btn_edit ui-icon ui-icon-pencil' title='Edit Caption'></div>");
			$("#captionEdit").css({'position':'absolute', 'top':$("#caption").position().top, 'left': $("#caption").position().left + $("#caption").width()});
			
			$("#captionEdit").click(function(){
				$("#caption").redactor({
					focus: true,
					buttons: ['html', '|', 'bold', 'italic', 'underline', '|', 'link', 'fontcolor', 'backcolor', '|', 'close'],
					buttonsCustom: {
						close: {
							title: 'Close',
							callback: saveCaptionEdit
						}
					}
				});
				$(this).css({'opacity': 0});
				$(".redactor_box").css({'position':'absolute', 'top':$("#caption").position().top, 'left':$("#caption").position().left, 'width': $("#caption").width()});
				$("#caption").css({'position':'absolute', 'top': 30, 'left': 0});
			});
		}
	}
	
		
	this.fadeComplete = function(){
		fadeComplete();
	}
    
    function fadeComplete() {
		$('#pageTitle').remove();
	    $('#content').remove();
	   
	    if(hasAudio == true){
	    	$('#player').remove();
	    	$('#audioCon').remove();
	    }
	    
	    $("#scrollableContent").remove();
	    
	    if(mode == "edit"){
		    $("#titleEdit").remove();
		    $("#conEdit").remove();
		    $("#imgEdit").remove();
		    $("#captionEdit").remove();
		    $("#titleDialog").remove();
		    $("#imgDialog").remove();
		    $("#swfDialog").remove();
		    $("#mediaLoader").remove();
	    }
	    
	    $("#audioDialog").remove();
		
		$("#audioEdit").remove();
		if(mode == "edit" && dragFile == true){
			siofu.destroy();
			$("#audioDrop").unbind();
			$("#audioDrop").remove();
		}
	    
	    if(type != "textOnly"){
	    	if(mediaType == 'swf'){
		    	$('#loader').flash().remove();
		    }
		    
		    if(hasCaption == true){
	    		$('#caption').remove();
	    	}
	    	
	    	$('#loader').remove();
	    }
	    loadPage();
    }
}