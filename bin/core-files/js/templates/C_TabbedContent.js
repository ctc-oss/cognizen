/*!
 * C_TabbedContent
 * This class creates a template for a tabbed interface, allowing (text/images/swfs).
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2013-03-04
 * JavaScript utilizing jQuery UI Tabbed Component
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_TabbedContent(_type) {
	
	this.tabCount//number of tabs.
	this.myImage;//image to be loaded.
	this.myPageTitle;//Title of this page.
	this.myContent;//Body
	this.myCaption;//Caption text if needed.
	this.myAudio;
	this.autoplay = false;//Boolean: true - attached media plays on load.  false - user interaction required to play media.  
	this.autoNext = false;//Boolean: true - next page loads automatically upon media completion.  false - user interaction required to load the next page.
	var myContent
    
	var hasCaption = false;
	var hasAudio = false;
	var hasPDFLink = false;
	var pdfLink;
    
	var imageWidth;
	var imageHeight;
	
	var tabEdit_arr = [];
	
	var mediaLink;
	
	var titleY;
	var audioShim = 0;
	
	var imgY;
	var imgX;
	var imgW;
	var imgH;
    
	var contentY;
	var contentH;
	
	var stageW = $("#stage").width();
	var stageH = $("#stage").height();
	
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
				
		tabCount = $(data).find("page").eq(currentPage).find("tab").length;
		
		myContent = $(data).find("page").eq(currentPage).find("content").text();		
		
		//Check if the page has captions
		if($(data).find("page").eq(currentPage).find('caption').text().length != 0){
			hasCaption = true;
			myCaption = $(data).find("page").eq(currentPage).find('caption').text();
		}
		
		if(type == 'tabsLeft'){
			mediaLink = $(data).find("page").eq(currentPage).attr('img');
		}
		
		//Check if the page has an associated audio file.
		if($(data).find("page").eq(currentPage).attr('audio') != undefined && $(data).find("page").eq(currentPage).attr('audio') != "null"){
			if($(data).find("page").eq(currentPage).attr('audio').length != 0){
				hasAudio = true;
				myAudio = $(data).find("page").eq(currentPage).attr('audio');
			}else{
				myAudio = "null";
			}
		}

		buildTemplate();
	}
	
	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
				
		//Add the divs for the page title and the tabs divs.		
		$('#stage').append('<div id="pageTitle"></div>');
		$("#pageTitle").append(myPageTitle);
		
		var tabString = '<div id="content">' + myContent + '<br/><br/><ul>';
		
		for(var i = 0; i < tabCount; i++){
			var currentTab = $(data).find("page").eq(currentPage).find("tab").eq(i).attr("title");
			var tabID = "tab" + i;
			tabString += '<li><a href="#'+ tabID +'">'+ currentTab +'</a></li>';
		}
		tabString += '</ul>';
		for(var i = 0; i < tabCount; i++){
			var currentTab = $(data).find("page").eq(currentPage).find("tab").eq(i).attr("title");
			var tabID = "tab" + i;
			var currentTabContent = $(data).find("page").eq(currentPage).find("tab").eq(i).text();
			tabString += '<div id="'+ tabID +'" class="cognizenTabContent"><p>' + currentTabContent + '</p></div>';	
		}
		
		tabString += '</div>';
		
		$("#stage").append(tabString);
		
		if(type == "tabsLeft"){
			$("#content").addClass("left");
		}else if(type == "tabsOnly"){
			$("#content").addClass("tabTop");
		}
		
		var tabs = $("#content").tabs({
			'create' : function() {	
				var contentTop = $("#content").position().top;
				var tabTop = $(".ui-tabs-nav").position().top;
				var tabHeight = $(".ui-tabs-nav").height();
				var audioHeight = 0;
				if(hasAudio == true){
					audioHeight = 30;
				}
				var myTabSpace = stageH - (contentTop + tabTop + tabHeight + audioHeight + 45);
				$(".cognizenTabContent").css('max-height', myTabSpace+'px');
				$(".cognizenTabContent").css('overflow', 'auto');
			}
		});	
		
		/*Attach Media*/
		if(type == "tabsOnly"){
			if(transition == true){
				TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
			}else{
				checkMode();
			}		
		}else if(type == "tabsLeft"){
			$('#stage').append('<div id="loader" class="loading" title="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div>');
			var tempID = "#loader";
			loadVisualMedia();			
		}else{
			$('#stage').append('<div id="loader" class="loading" title="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div>');
			var tempID = "#loader";
			loadVisualMedia();	
		}
				
		if(hasAudio == true){
			$('#stage').append('<div id="audioCon"></div>');
			loadAudio();
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
	
	function loadVisualMedia(){
		var contentH = $("#content").height();
		var contentW = $("#content").width();
		var contentX = $("#content").position().left;
		var contentY = $("#content").position().top;
		var titleY = $("#pageTitle").position().top;
		var titleH = $("#pageTitle").height();
		
		if(type == "tabsLeft"){
			$("#loader").addClass("rightTabs");
		}else if(type == "top"){
			$("#loader").addClass("bottom");
		}else if(type == "right"){
			$("#loader").addClass("leftTabs");
		}else if(type == "graphicOnly"){
			$("#loader").addClass("graphic");
		}
		
		var mediaLinkType = $(data).find("page").eq(currentPage).attr('mediaLinkType');
				
		if($(data).find("page").eq(currentPage).attr('img') != "" && $(data).find("page").eq(currentPage).attr('img') != " "){
			myImage = mediaLink;
		}else{
			//We will have default.png's for different layouts - just a series of if, else if below here.
			myImage = "media/default.png";
		}

		var parts = myImage.split('.'), i, l;
		var last = parts.length;
			
		mediaType = (parts[last - 1]);
			
		if(mediaType == "swf"){
			imageWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
			imageHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
			
			$("#loader").removeClass('loading');
			$("#loader").flash({swf:myImage,width:imageWidth,height:imageHeight});
					
			
			if(type == "top"){
				imgY = contentY + contentH + 20;
				imgX = (stageW - imageWidth) / 2;
				$("#loader").css({'top': imgY, 'left': imgX});
			}else if (type == "bottom"){
				imgX = (stageW - imageWidth) / 2;
				$("#loader").css({'left': imgX});
			}else if (type == "graphicOnly"){
				var startY = titleY + titleH + 20;
				var space = (stageH - startY);
				imgY =  startY + (space / 2);
				imgX = (stageW - imageWidth) / 2;
				$("#loader").css({'top': imgY, 'left': imgX})
			}
		////////////////////////////////////////////////HTML for edge or js apps.	
		}else if (mediaType == "html"){
			imageWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
			imageHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
			if(windowWidth <= mobileWidth){
				if(imageWidth > windowWidth){
					imageHeight = (imageHeight / imageWidth) * windowWidth;
					imageWidth = windowWidth;
				}
			}
			$("#loader").append('<object id="edgeContent" data='+myImage+' type="text/html" width="' + imageWidth + '" height="' + imageHeight + '" align="absmiddle"></object>');
			$("#loader").removeClass('loading');
			if(type == "top"){		
				imgY = contentY + contentH + 20;
				imgX = (stageW - imageWidth) / 2;
				$("#loader").css({'top': imgY, 'left': imgX});
			}else if (type == "bottom"){
				imgX = (stageW - imageWidth) / 2;
				$("#loader").css({'left': imgX});
			}else if (type == "graphicOnly"){
				var startY = titleY + titleH + 20;
				var space = (stageH - startY);
				//imgY =  startY + (space / 2);
				imgX = (stageW - imageWidth) / 2;
				$("#loader").css({'top': startY, 'left': imgX})
			}
		////////////////////////////////////////////////HTML for edge or js apps.	
		}else if (mediaType == "mp4"  || mediaLinkType == "youtube"){
			
			autoNext = $(data).find("page").eq(currentPage).attr('autoNext');
			imageWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
			imageHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
			autoPlay = $(data).find("page").eq(currentPage).attr('autoplay');

			if(windowWidth <= mobileWidth){
				if(imageWidth > windowWidth){
					imageHeight = (imageHeight / imageWidth) * windowWidth;
					imageWidth = windowWidth;
				}
			}
			/*var vidHTMLString = "<video id='videoplayer' width=" + imageWidth + " height=" + imageHeight + " controls='controls'><source type='video/mp4' src='" + myImage + "'/></video>";*/
			
			
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
					if(autoNext == true){
						player.addEventListener('ended', function(e) {
							hasEnded();
						}, false);
					}
						  
					//If autoplay - cick off the vid  
					if(autoPlay == true){
						$('.mejs-overlay-button').trigger('click');
					}
				}
			});
			if(type == "top"){
				imgY = contentY + contentH + 20;
				imgX = (stageW - imageWidth) / 2;
				$("#loader").css({'top': imgY, 'left': imgX});
			}else if (type == "bottom"){
				imgX = (stageW - imageWidth) / 2;
				$("#loader").css({'left': imgX});
			}else if (type == "graphicOnly"){
				var startY = titleY + titleH;
				var space = (stageH - startY);
				imgY =  (startY + (stageH - imageHeight))/2;
				imgX = (stageW - imageWidth) / 2;
				$("#loader").css({'top': imgY, 'left': imgX})
			}
		}else{
			var img = new Image();
			$(img).load(function(){
				$("#loader").removeClass('loading').append(img);
				imageWidth = $(img).width();
				imageHeight = $(img).height();
				if(type == "top"){
					imgY = contentY + contentH + 20;
					imgX = (stageW - imageWidth) / 2;
					$("#loader").css({'top': imgY, 'left': imgX});
				}else if (type == "bottom"){
					imgX = (stageW - imageWidth) / 2;
					$("#loader").css({'left': imgX});
				}else if (type == "graphicOnly"){
					var startY = titleY + titleH;
					var space = (stageH - startY);
					imgY = (space / 2);
					imgX = (stageW - imageWidth) / 2;
					$("#loader").css({'top': startY, 'left': imgX})
				}
				if(hasCaption == true){
					if(transition == true){
						TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:setCaption});
					}else{
						setCaption();
					}
				}else{
					if(transition == true){
						TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
					}else{
						checkMode();
					}
				}
			}).attr('src', myImage).attr('alt', $(data).find("page").eq(currentPage).attr('alt')).attr('id', 'myImg');
		}
		
		//Other media types include their size so we don't need to wait for them to load to place the caption - images (png, gif, jpg) don't so we have to do caption inside of the load event.
		if(mediaType == "mp4" || mediaType == "html"  || mediaType == "swf" || mediaLinkType == "youtube"){
			if(hasCaption == true){
				if(transition == true){
					TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:setCaption});
				}else{
					setCaption();
				}
			}else{
				if(transition == true){
					TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
				}else{
					checkMode();
				}
			}
		}
		
		$("#loader").removeClass('loading');
	}
	/////////////END of loadVisualMedia
	
	
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
	
	function addTab(_addID, _isNew){
		var tabID = "tab" + _addID;
		var contentLabel = _addID + 1;
		
		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<tab id='"+ _addID + "' title='tab"+ contentLabel + "'>"));
			var newTabContent1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA1 = newTabContent1.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(currentPage).find("tab").eq(_addID).append(tabCDATA1);
		}
		
		var myTabLabel = $(data).find("page").eq(currentPage).find("tab").eq(_addID).attr("title");
		var myTabContent = $(data).find("page").eq(currentPage).find("tab").eq(_addID).text();
					
		var msg = "<div id='"+tabID+"Container' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='"+tabID+"Remove' class='removeMedia' value='"+_addID+"' title='Click to remove this tab'/>";
		msg += "<label>Tab " + contentLabel + " Title: </label>";
		msg += "<input id='"+tabID+"TitleText' type='text' value='"+ myTabLabel + "' defaultValue='"+ myTabLabel + "' style='width:30%;'/>";
					
		msg += "<div>Tab " + contentLabel + " Content:</div> ";
		msg += "<div id='"+tabID+"ContentText'  style='width:80%;'>" + myTabContent + "</div>";	
		msg += "</div>";
		
		$("#contentEditDialog").append(msg);
		
		$("#" +tabID+"Remove").click(function(){
			removeTab($(this).attr("value"));
		});//.tooltip();
				 
		$("#"+tabID+"ContentText").redactor({
			buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|','fontcolor', 'backcolor']
		});
						
		tabEdit_arr.push(tabID);
	}
	
	function removeTab(_id){
		for(var i = 0; i < tabEdit_arr.length; i++){
			if(_id == $("#"+tabEdit_arr[i]+"Container").attr("value")){
				var arrIndex = i;
				break;
			}
		}
		$(data).find("pages").eq(currentPage).find("tab").eq(arrIndex).remove();
		tabEdit_arr.splice(arrIndex, 1);
		$("#tab"+_id+"ContentText").destroyEditor();
		$("#tab" + _id +"Container").remove();
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
			$("#titleEdit").css({'position':'absolute', 'top':$("#pageTitle").position().top - 20, 'left': $("#pageTitle").position().left + $("#pageTitle").width() - 20});
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
			$("#conEdit").css({'position':'absolute', 'top':$("#content").position().top - 20, 'left': $("#content").position().left + $("#content").width() - 20});
				
			$("#conEdit").click(function(){					
				//Create the Content Edit Dialog
				var msg = "<div id='contentEditDialog' title='Input Page Content'>";
				msg += "<div id='contentEditText' type='text' style='width:" + $('#content').width() + "; height:85%' >" + $(data).find("page").eq(currentPage).find("content").text() + "</div>";
				msg += "</div>";
				$("#stage").append(msg);	
				
				//Cycle through the tabs from the xml
				for(var i = 0; i < tabCount; i++){
					addTab(i, false);
				}
				
					
				//Style it to jQuery UI dialog
				$("#contentEditDialog").dialog({ 	
					autoOpen: true,
					modal: true,
					width: 875,
					height: 650,
					buttons: {
						Add: function(){	
							addTab(tabEdit_arr.length, true);	
						},
						Save: function(){
							$( this ).dialog( "close" );
						}	
					},
					close: saveContentEdit
				});
					
				$("#contentEditText").redactor({
					focus: true,
					buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'fontcolor', 'backcolor']
				});
			}).tooltip();
			
			
			/**
			* Edit Image
			*/
			if(type != "tabsOnly"){
				$('#stage').append("<div id='imgEdit' class='btn_edit_media' title='Edit Image'></div>");
				$("#imgEdit").css({'position':'absolute', 'top':$("#loader").position().top - 20, 'left': $("#loader").position().left + $("#loader").width() -20});
						
				$("#imgEdit").click(function(){
					//Establish it's functionality
					$("#imgEdit").click(function(){
						$("#stage").append("<div id='imgDialog' title='Input Media Path'><input id='imgPath' type='text' value="+ myImage + " defaultValue="+ myImage + " style='width:100%;'/></div>");
								
						$("#imgDialog").dialog({ 	
							autoOpen: true,
							modal: true,
							width: 550,
							buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
							close: saveImageEdit
						});
					});					
				}).tooltip();
					
				/*Caption Edit*/
				$('#stage').append("<div id='captionEdit' class='btn_edit_text' title='Edit Caption'></div>");
				$("#captionEdit").css({'position':'absolute', 'top':$("#caption").position().top, 'left': $("#caption").position().left + $("#caption").width()});
					
				//Add Caption Edit
				$("#captionEdit").click(function(){
					//Create the Content Edit Dialog
					$("#stage").append("<div id='captionEditDialog' title='Input Media Caption'><div id='captionEditText' type='text' style='width:" + $('#caption').width() + "; height:85%' >" + myCaption + "</div>");
										
					//Style it to jQuery UI dialog
					$("#captionEditDialog").dialog({ 	
						autoOpen: true,
						modal: true,
						width: $("#caption").width() + 100,
						height: 300,
						buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
						close: saveCaptionEdit
					});
						
					$("#captionEditText").redactor({
						focus: true,
						buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'link', 'fontcolor', 'backcolor']
					});
				}).tooltip();
			}
			
			/*Audio Edit*/
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
	
	/**********************************************************************
	**Save Title Edit
	**********************************************************************/
	function saveTitleEdit(){
		var titleUpdate = $("#titleEditText").getCode().replace('<p>', '').replace('</p>', '');;
		//console.log(titleUpdate);
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
	
	/**********************************************************************
	**Save Content Edit
	**********************************************************************/
	/**saveContentEdit
	* Sends the updated content to node.
	*/
	function saveContentEdit(){
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
		
		for(var i = 0; i < tabEdit_arr.length; i++){
			var tabLabel = $("#"+tabEdit_arr[i]+"TitleText").val();
			var tabUpdate = $("#"+tabEdit_arr[i]+"ContentText").getCode();
			var newTabContent = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA = newTabContent.createCDATASection(tabUpdate);
			$(data).find("page").eq(currentPage).find("tab").eq(i).empty();
			$(data).find("page").eq(currentPage).find("tab").eq(i).append(tabCDATA);
			$(data).find("page").eq(currentPage).find("tab").eq(i).attr("title", tabLabel);
			$("#"+tabEdit_arr[i]+"ContentText").destroyEditor();
		}
		
		var extra = $(data).find("page").eq(currentPage).find("tab").length;
		var active = tabEdit_arr.length;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("tab").eq(i).remove();
		}
		
		$("#contentEditDialog").remove();
		sendUpdate();
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
			if(mediaType == "mp4"){
				$(data).find("page").eq(currentPage).attr("img", imgPath);
				$("#loader").append("<div id='videoDialog' title='Input Video Stats'><div>Video Width: <input id='videoWidth' type='text' value="+ 000 + " defaultValue="+ 000 + " style='width:100%;'/></div><div>Video Height: <input id='videoHeight' type='text' value="+ 000 + " defaultValue="+ 000 + " style='width:100%;'/></div><input id='autoplay' type='checkbox' name='autoplay' class='radio' value='true'/><label id='label'>autoplay</label></input><input id='autonext' type='checkbox' name='autonext' class='radio' value='true'/><label id='label'>autonext</label></input><input id='poster' type='checkbox' name='hasPoster' class='radio' value='true'/><label id='label'>poster</label></input><input id='subs' type='checkbox' name='hasSubs' class='radio' value='true'/><label id='label'>subtitles</label></input></div>");

				$("#videoDialog").dialog({ 	
					autoOpen: true,
					modal: true,
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: function(){
						
						var strippedPath = "";
						$(data).find("page").eq(currentPage).attr("w", $("#videoWidth").val()); 
						$(data).find("page").eq(currentPage).attr("h", $("#videoHeight").val());
						for(var i = 0; i < last-1; i++){
							strippedPath += parts[i];
						}
						if($("#subs").prop("checked") == true){
							$(data).find("page").eq(currentPage).attr("subs", strippedPath + ".srt");
						}else{
							$(data).find("page").eq(currentPage).attr("subs", "null");
						}
						
						if($("#poster").prop("checked") == true){
							$(data).find("page").eq(currentPage).attr("poster", strippedPath + ".png");
						}else{
							$(data).find("page").eq(currentPage).attr("poster", "null");
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
						
						$(data).find("page").eq(currentPage).attr("controlType", "bar");
						sendUpdate();
						fadeComplete();
					}
				});
			}else if(mediaType == "swf"){
				//If its a swf we have to set it's width and height! - very imoprtant or shit get funky homey....
				$(data).find("page").eq(currentPage).attr("img", imgPath);
				$("#loader").append("<div id='swfDialog' title='Input SWF Stats'><div>SWF Width: <input id='swfWidth' type='text' value="+ 000 + " defaultValue="+ 000 + " style='width:100%;'/></div><div>SWF Height: <input id='swfHeight' type='text' value="+ 000 + " defaultValue="+ 000 + " style='width:100%;'/></div></div>");
				$("#swfDialog").dialog({ 	
					autoOpen: true,
					modal: true,
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: function(){
						$(data).find("page").eq(currentPage).attr("w", $("#swfWidth").val()); 
						$(data).find("page").eq(currentPage).attr("h", $("#swfHeight").val());
						sendUpdate();
						fadeComplete();
					}
				});
			}else if(mediaType == "jpg" || mediaType == "gif" || mediaType == "png" || mediaType == "jpeg"){
				$(data).find("page").eq(currentPage).attr("img", imgPath);
				sendUpdate();
				fadeComplete();
			}else{
				
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
		myCaption = captionUpdate;
		$("#captionEditText").destroyEditor();
		$(data).find("page").eq(currentPage).find("caption").empty();
		$(data).find("page").eq(currentPage).find("caption").append(newCDATA);
		$("#captionEditDialog").remove();
		sendUpdateWithRefresh();
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

	
	function setCaption(){
		if(hasCaption == true){
			$('#stage').append('<div id="caption"></div>');
			$('#caption').append(myCaption);
			$('#caption').css({'position':'absolute', 'top':$("#loader").position().top + $('#loader').height() + 5, 'left': $("#loader").position().left, 'width':$("#loader").width()});
			
			if(transition == true){
				$('#caption').css({'opacity': 0});
				TweenMax.to($('#caption'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
			}
		}
	}
	
		
	this.fadeComplete = function(){
		fadeComplete();
	}
    
    function fadeComplete() {
		$('#pageTitle').remove();
		$('#content').remove();
	   
	    if(hasPDFLink == true){
	    	$("#pdfLink").remove();
		    $("#pdfDialog").remove();
	    }
	    if(hasAudio == true){
	    	$('#audioCon').remove();
	    	$('#player').remove();
	    }
	    
	    if(mode == "edit"){
		    $("#titleEdit").remove();
		    $("#conEdit").remove();
		    $("#imgEdit").remove();
		    $("#audioEdit").remove();
		    $("#captionEdit").remove();
		    $("#titleDialog").remove();
		    $("#imgDialog").remove();
		    $("#audioEditDialog").remove();
		    $("#swfDialog").remove();
	    }
	    
	    if(mode == "edit" && dragFile == true){
		  	if(type != "textOnly" && type !=  "sidebar"){
			  	$("#loader").unbind();
			}
			siofu.destroy();
			$("#audioDrop").unbind();
			$("#mediaLoader").remove();
		}
		$("#audioDrop").remove();
	    
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