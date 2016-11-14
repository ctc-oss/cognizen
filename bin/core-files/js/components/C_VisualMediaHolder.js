function C_VisualMediaHolder(callback, _type, _mediaLink, _id){
    //Define Variables
    var type;
    if(_type){
	    type = _type;
	}else{
		type = $(data).find("page").eq(currentPage).attr('layout');
	}
	var rootType = $(data).find("page").eq(currentPage).attr('layout');
    var myImage = "";
    var mediaLink;
    if(_mediaLink){
	    mediaLink = _mediaLink;
    }else{
	    mediaLink = $(data).find("page").eq(currentPage).attr('img');
    }

    var autoPlay = false;
    var autoNext = false;
    var hasCaption = false;
    var mediaWidth = 0;
    var mediaHeight = 0;
    var mediaLinkType;
    var popLoop = true;
    var hideVideoPlayPauseControls = false;
	var hideVideoCurrentControls = false;
	var hideVideoProgressControls = false;
	var hideVideoDurationControls =  false;
	var hideVideoVolumeControls = false;
	var hideVideoFullscreenControls = false;

    var mediaType = "";
	var hasPop = false;
    var altText;
    var media_arr = [];
    var caption_arr = [];
    var alt_arr = [];
    var captionEditText_arr = [];
    var altEditText_arr = [];
	var largeImg = "";
	var audioUploader;

	var hasPoster;
    var posterLink;
    var hasSubs;
    var subsLink;
    var hasTranscript = false;
    var transcriptText = "Visual transcript content.";
    var transcriptState = false;

	var galleryEdit_arr = [];
	var galleryTransitionType = "elastic";
	var myCaption = $(data).find("page").eq(currentPage).find('caption').first().text();

	var favoriteTypes = ["mp4", "swf", "jpg", "png", "html", "htm", "gif", "jpeg", "mp3", "svg"];
    var convertableVideoTypes = ["ogv", "avi", "mov", "wmv", "flv", "webm"];
    var convertableVectorTypes = ["eps"];
    var convertableAudioTypes = ["wav", "ogg", "m4a", "aiff", "flac", "wma"];

	var oldIE = false;

    //Populate Key Variables




    if($(data).find("page").eq(currentPage).attr("hideVideoPlayPauseControls") == "true"){
		hideVideoPlayPauseControls = true;
	}    

    if($(data).find("page").eq(currentPage).attr("hideVideoCurrentControls") == "true"){
		hideVideoCurrentControls= true;
	} 

    if($(data).find("page").eq(currentPage).attr("hideVideoProgressControls") == "true"){
		hideVideoProgressControls = true;
	} 	  
  
    if($(data).find("page").eq(currentPage).attr("hideVideoDurationControls") == "true"){
		hideVideoDurationControls = true;
	} 	

    if($(data).find("page").eq(currentPage).attr('hideVideoVolumeControls') == "true"){
		hideVideoVolumeControls = true;
	}    

    if($(data).find("page").eq(currentPage).attr("hideVideoFullscreenControls" ) == "true"){
		hideVideoFullscreenControls = true;
	} 

    if($(data).find("page").eq(currentPage).attr('autonext') == "true"){
		autoNext = true;
	}

	if($(data).find("page").eq(currentPage).attr('autoplay') == "true"){
		autoPlay = true;
	}
	if($(data).find("page").eq(currentPage).attr("galTransType")){
		galleryTransitionType = $(data).find("page").eq(currentPage).attr("galTransType");
	}else{
		$(data).find("page").eq(currentPage).attr("galTransType", galleryTransitionType);
	}
	
	if($(data).find("page").eq(currentPage).find('visualtranscript').text() != undefined && $(data).find("page").eq(currentPage).find('visualtranscript').text() != ""){
		transcriptText = $(data).find("page").eq(currentPage).find('visualtranscript').eq(0).text();
	}else{
		$(data).find("page").eq(currentPage).append($("<visualtranscript>"));
		var newVisualTranscript = new DOMParser().parseFromString('<visualtranscript></visualtranscript>',  "application/xml");
		var vTransCDATA = newVisualTranscript.createCDATASection("Visual transcript content");
		$(data).find("page").eq(currentPage).find("visualtranscript").append(vTransCDATA);
	}
	
	if($(data).find("page").eq(currentPage).attr('visualtranscript') == "true"){
		hasTranscript = true;
		$("#stage").append("<div id='transcriptPane' class='transcriptPane'><div id='transcriptButton' class='C_Transcript' role='button' aria-lable='open media transcript' title='view transcript'></div></div>");
		$("#transcriptButton").click(function(){
			if(transcriptState){
				$(this).removeClass('C_TranscriptActive');
				transcriptState = false;
			}else{
				$(this).addClass('C_TranscriptActive');
				transcriptState = true;
			}
			toggleTranscript();
		}).keypress(function(event) {
	        var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
	        if (chCode == 32 || chCode == 13){
		        $(this).click();
		    }
        });
        pageAccess_arr.push($("#transcriptButton"));
		//doAccess(pageAccess_arr);
	}
	
	if(rootType == "branching" || rootType == "pathing" || rootType == "chaining"){
		if($(data).find("page").eq(currentPage).find("branch").eq(_id).find('visualtranscript').text() != undefined && $(data).find("page").eq(currentPage).find("branch").eq(_id).find('visualtranscript').text() != ""){
			transcriptText = $(data).find("page").eq(currentPage).find("branch").eq(_id).find('visualtranscript').text();
		}else{
			$(data).find("page").eq(currentPage).find("branch").eq(_id).append($("<visualtranscript>"));
			var newVisualTranscript = new DOMParser().parseFromString('<visualtranscript></visualtranscript>',  "application/xml");
			var vTransCDATA = newVisualTranscript.createCDATASection("Visual transcript content");
			$(data).find("page").eq(currentPage).find("visualtranscript").append(vTransCDATA);
		}
		
		if($(data).find("page").eq(currentPage).find("branch").eq(_id).attr('visualtranscript') == "true"){
			hasTranscript = true;
			$("#stage").append("<div id='transcriptPane' class='transcriptPane'><div id='transcriptButton' class='C_Transcript' role='button' aria-lable='open media transcript' title='view transcript'></div></div>");
			$("#transcriptButton").click(function(){
				if(transcriptState){
					$(this).removeClass('C_TranscriptActive');
					transcriptState = false;
				}else{
					$(this).addClass('C_TranscriptActive');
					transcriptState = true;
				}
				toggleTranscript();
			}).keypress(function(event) {
		        var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
		        if (chCode == 32 || chCode == 13){
			        $(this).click();
			    }
	        });
			pageAccess_arr.push($("#transcriptButton"));
			//doAccess(pageAccess_arr);
		}
	}
	
	function toggleTranscript(){
		if(transcriptState){
			//Tween transcript open then add text TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
			$("#transcriptPane").append("<div id='transcriptDisplay' class='transcriptDisplay'></div>");
			var displayWidth = $(".transcriptDisplay").css("max-width");
			var displayHeight = $(".transcriptDisplay").css("max-height");
			TweenMax.to($('#transcriptDisplay'), transitionLength, {css:{width: displayWidth, height: displayHeight}, ease:transitionType, onComplete: displayTranscriptText});
		}else{
			//Tween transcript closed then remove text
			$("#transcriptDisplay").empty();
			TweenMax.to($('#transcriptDisplay'), transitionLength, {css:{width: 0, height: 0}, ease:transitionType, onComplete: removeTranscriptDisplay});
		}
	}
	
	function displayTranscriptText(){
		$("#transcriptDisplay").append('<div id="scrollableTranscript" class="antiscroll-wrap"><div class="transcriptbox"><div id="transcriptHolder" class="overthrow antiscroll-inner">'+transcriptText+'</div></div></div>');
		$('#scrollableTranscript').antiscroll();
	}
	
	function removeTranscriptDisplay(){
		$("#transcriptDisplay").remove();
	}
	
	if($(data).find("page").eq(currentPage).attr('enlarge') != undefined && $(data).find("page").eq(currentPage).attr('enlarge') != "" && $(data).find("page").eq(currentPage).attr('enlarge') != " "){
        largeImg = $(data).find("page").eq(currentPage).attr('enlarge');
    }
        //Check for popups...
    if($(data).find("page").eq(currentPage).attr('popup') != "" && $(data).find("page").eq(currentPage).attr('popup') != undefined){
        hasPop = true;
        media_arr = $(data).find("page").eq(currentPage).attr('popup').split(",");
        caption_arr = $(data).find("page").eq(currentPage).attr('popcaps').split("!!!");
		alt_arr = $(data).find("page").eq(currentPage).attr('popalt').split("!!!");
    }

    if($(data).find("page").eq(currentPage).attr('poploop') == "false"){
		popLoop = false;
	}

	altText = $(data).find("page").eq(currentPage).attr('alt');

	if(type == "top" || type == "tabsLeft"){
		$('<div id="mediaHolder"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div>').insertAfter($("#content"));
	}else if(type == "bottom"){
		if(isMobile){
			$("#contentHolder").prepend('<div id="mediaHolder"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div>');
		}else{
			$('<div id="mediaHolder"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div>').insertBefore($("#content"));
		}
	}else if(type == "multipleChoiceMedia"){
		$('<div id="mediaHolder"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div>').insertAfter($("#question"));
	// inline images and text on mobile
	}else if(isMobile && (type == "left" || type == "right")){
		var myContent = '<div id="mediaHolder"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div>';
		if(isMobilePhone && (type == "left")){
			$("#contentHolder").append(myContent);
		}else{
			$("#contentHolder").prepend(myContent);
		}

	} else if (type == "graphicOnly"){
    	$('#stage').append('<div id="graphicHolder" class="antiscroll-wrap"><div class="box"><div id="mediaHolder" class="antiscroll-inner"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div></div></div>');
    	$("#graphicHolder").height(stageH - ($("#graphicHolder").position().top + audioHolder.getAudioShim()));
    	//$('#stage').append('<div id="mediaHolder"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div>');
	}
	else if(type == "completion"){
		$('<div id="mediaHolder"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div>').insertBefore($("#content"));
	}
	else {
    	$('#stage').append('<div id="mediaHolder"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div>');
	}

    if(mode == 'edit' && rootType != 'branching' && rootType != "pathing" && rootType != "chaining"){
    	$("#loader").attr("title", "click to browse or drag media to this location");
    }else{
		$("#loader").attr("title", $(data).find("page").eq(currentPage).attr('alt'));
    }
    var tempID = "#loader";


    this.loadVisualMedia = function() {

		if(type == "left"){
            $("#mediaHolder").addClass("right");
        }else if(type == "top"){
            $("#mediaHolder").addClass("bottom");
        }else if(type == "bottom" || type == "completion"){
            $("#mediaHolder").addClass("top");
        }else if(type == "right"){
            $("#mediaHolder").addClass("left");
        }else if(type == "graphicOnly"){
            $("#mediaHolder").addClass("graphic");
        }else if(type == "multipleChoiceMedia" || type == "tabsLeft"){
	        $("#mediaHolder").addClass("tabsRight");
        }

        mediaLinkType = $(data).find("page").eq(currentPage).attr('mediaLinkType');

        myImage = "media/" + mediaLink;

        var parts = myImage.split('.'), i, l;
        var last = parts.length;
		if(rootType == "branching"  || rootType == "pathing" || rootType == "chaining"){
			var imageWidth = parseInt($(data).find("page").eq(currentPage).find("branch").eq(_id).attr('w'));
			var imageHeight = parseInt($(data).find("page").eq(currentPage).find("branch").eq(_id).attr('h'));
		}else{
			var imageWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
			var imageHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
		}
        mediaType = (parts[last - 1]);

        if(mediaType == "swf"){////////////////////////////////////////////////Flash
            $("#loader").flash({swf:myImage,width:imageWidth,height:imageHeight});
        }else if (mediaType == "html" || mediaType == "htm"){////////////////////////////////////////////////HTML for edge or js apps.
            if(oldIE == true){
	            $("#loader").append('<iframe seamless frameborder="0" src="'+ myImage +'" width="' + imageWidth + '" height="' + imageHeight + '"></iframe>');
            }else{
            	$("#loader").append('<object id="edgeContent" data='+myImage+' type="text/html" width="' + imageWidth + '" height="' + imageHeight + '" align="absmiddle"></object>');
            }
            $("#loader").removeClass('loading');
        }else if (mediaType == "mp4"  || mediaLinkType == "youtube"){////////////////////////////////////////////////VIDEO

            if($(data).find("page").eq(currentPage).attr('autoplay') == "true"){
				autoPlay = true;
			}
			if(rootType == "branching"  || rootType == "pathing" || rootType == "chaining"){
				if($(data).find("page").eq(currentPage).find("branch").eq(_id).attr('autoplay') == "true"){
					autoPlay = true;
				}
			}
            var vidHTMLString = "<video id='videoplayer' width=" + imageWidth + " height=" + imageHeight + " controls='controls'";
			if(mediaLinkType == "youtube"){
                vidHTMLString += " preload='none'";
            }else{
	            vidHTMLString += " preload='true'";
            }

            if($(data).find("page").eq(currentPage).attr('poster') != undefined && $(data).find("page").eq(currentPage).attr('poster') != "null" && $(data).find("page").eq(currentPage).attr('poster').length != 0){
                hasPoster = true;
                posterLink = $(data).find("page").eq(currentPage).attr('poster');
            }else{
                hasPoster = false;
                posterLink = "Input poster link here.";
            }
            
            if(rootType == "branching"  || rootType == "pathing" || rootType == "chaining"){
	            if($(data).find("page").eq(currentPage).find("branch").eq(_id).attr('poster') != undefined && $(data).find("page").eq(currentPage).find("branch").eq(_id).attr('poster') != "null" && $(data).find("page").eq(currentPage).find("branch").eq(_id).attr('poster').length != 0){
	                hasPoster = true;
	                posterLink = $(data).find("page").eq(currentPage).find("branch").eq(_id).attr('poster');
	            }else{
	                hasPoster = false;
	                posterLink = "Input poster link here.";
	            }
            }

            //Check Poster
            if(hasPoster == true){
                vidHTMLString += "poster='media/"+posterLink+"'>";
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

			vidHTMLString += "src='" + myImage + "'/>";

            //Check for subs - defaults to false.
            if($(data).find("page").eq(currentPage).attr('subs') != undefined && $(data).find("page").eq(currentPage).attr('subs') != "null" && $(data).find("page").eq(currentPage).attr('subs').length != 0 && $(data).find("page").eq(currentPage).attr('subs') != "undefined"){
                hasSubs = true;
                subsLink = $(data).find("page").eq(currentPage).attr('subs');
            }else{
                hasSubs = false;
                subsLink = null;
            }
            
            if(rootType == "branching"  || rootType == "pathing" || rootType == "chaining"){
	            if($(data).find("page").eq(currentPage).find("branch").eq(_id).attr('subs') != undefined && $(data).find("page").eq(currentPage).find("branch").eq(_id).attr('subs') != "null" && $(data).find("page").eq(currentPage).find("branch").eq(_id).attr('subs').length != 0 && $(data).find("page").eq(currentPage).find("branch").eq(_id).attr('subs') != "undefined"){
	                hasSubs = true;
	                subsLink = $(data).find("page").eq(currentPage).find("branch").eq(_id).attr('subs');
	            }else{
	                hasSubs = false;
	                subsLink = null;
	            }
            }

            //Check subs - if subs at track node.
            if(hasSubs == true){
                vidHTMLString += "<track kind='subtitles' src='media/" + subsLink + "' srclang='en'/>"
            }
			vidHTMLString += "</video>";

            $("#loader").append(vidHTMLString);

            //pageAccess_arr.push($("#videoplayer"));
			// Prefer Flash or Silverlight on IE 8, 9, 10 to enable true fullscreen
			(function ($) {
				"use strict";
				// Detecting IE
				if ($('html').is('.ie8, .ie9, .ie10')) {
					oldIE = true;
				}
			}(jQuery));
			
			var featuresArr = ['playpause','current','progress','duration','volume','fullscreen'];

			if(hideVideoPlayPauseControls){
				var index = featuresArr.indexOf('playpause');
				if(index > -1){ 
					featuresArr.splice(index, 1);
				}
			}

			if(hideVideoCurrentControls){
				var index = featuresArr.indexOf('current');
				if(index > -1){ 
					featuresArr.splice(index, 1);
				}
			}							

			if(hideVideoProgressControls){
				var index = featuresArr.indexOf('progress');
				if(index > -1){ 
					featuresArr.splice(index, 1);
				}
			}	

			if(hideVideoDurationControls){
				var index = featuresArr.indexOf('duration');
				if(index > -1){ 
					featuresArr.splice(index, 1);
				}
			}	

			if(hideVideoVolumeControls){
				var index = featuresArr.indexOf('volume');
				if(index > -1){ 
					featuresArr.splice(index, 1);
				}
			}
	
			if(hideVideoFullscreenControls){
				var index = featuresArr.indexOf('fullscreen');
				if(index > -1){ 
					featuresArr.splice(index, 1);
				}
			}

			if (oldIE) {
				// IE 8, 9 or 10 - prefer Flash or Silverlight
				$('#videoplayer').mediaelementplayer({
					//mode: 'auto_plugin', // tries Flash/Silverlight first before trying HTML5
					enablePluginSmoothing: true,
					enableKeyboard: true,
					features: featuresArr,
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
			}else{
				
				// decent browser - prefer HTML5 video
				$('#videoplayer').mediaelementplayer({
					//mode: 'auto_plugin',
					enablePluginSmoothing: true,
					enableKeyboard: true,
					features: featuresArr,
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
			}

			doAccess(pageAccess_arr);
        }else{////////////////////////////////////////////////IMAGES
            var img = new Image();

            $(img).bind('error', function() {
				alert("Your media was not found and is being replaced by a default image.")

				if(type == "top" || type == "bottom" || type == "graphicOnly" || type == "completion"){
	            	myImage = "media/defaultTop.png";
	            }else if(type == "left" || type == "right" || type == "multipleChoiceMedia" || type == "tabsLeft"){
		            myImage = "media/defaultLeft.png";
	            }

				$(img).load(function(){
	                $("#loader").removeClass('loading').append(img);
	                imageWidth = $(img).width();
	                imageHeight = $(img).height();

	                $("#mediaHolder").css({'width': imageWidth});
	                $("#loader").css({'width': imageWidth, 'height': imageHeight});
	                if(type == "graphicOnly"){
	                	$('.antiscroll-wrap').antiscroll();
	                }
					setCaption();
	            }).attr('src', myImage).attr('alt', $(data).find("page").eq(currentPage).attr('alt')).attr('id', 'myImg');
			});

            $(img).load(function(){
                $("#loader").removeClass('loading').append(img);
                imageWidth = $(img).width();
                imageHeight = $(img).height();

	            $("#mediaHolder").css({'width': imageWidth});
                $("#loader").css({'width': imageWidth, 'height': imageHeight});

				if(hasPop == true || largeImg != ""){
					setupGallery(mediaType);
				}

                setCaption();
            }).attr('src', myImage).attr('alt', $(data).find("page").eq(currentPage).attr('alt')).attr('id', 'myImg');
        }

        //Other media types include their size so we don't need to wait for them to load to place the caption - images (png, gif, jpg) don't so we have to do caption inside of the load event.
        if(mediaType == "mp4" || mediaType == "html"  || mediaType == "htm" || mediaType == "swf" || mediaLinkType == "youtube"){
            $("#loader").removeClass('loading');
            $("#mediaHolder").css({'width': imageWidth});
            if(!isMobile){
            	$("#loader").css({'width': imageWidth, 'height': imageHeight});
            }

            if(hasPop == true || largeImg != ""){
				setupGallery(mediaType);
			}
            setCaption();
        }

    }

    function setupGallery(mediaType){
		var tempItem;
		var tempCaption;
		if(largeImg != ""){
			tempItem = "media/" + largeImg;
			tempCaption = myCaption;
		}else{
			tempItem = "media/" + media_arr[0];
			tempCaption = caption_arr[0];
		}
		var hasSWF = false;
		var hasHTML = false;

		var checkFile = tempItem.split('.'), i, l;
        var last = checkFile.length;
        var thisType = (checkFile[last - 1]);
		if(thisType == "swf"){
			hasSWF = true;
		}
		
		if(thisType == "html"){
			hasHTML = true;
		}

		var mediaPopString = "<div id='myImgList' class='imglist'><a id='mediaPop' rel='mediaPop' class='mediaPop'  tabindex='1' href='"+tempItem+"' title='click to view enlarged media'><img src='"+tempItem+"' style='opacity: 0; width: 10px; height: 10px;' title='click to view enlarged media' alt='Click to view gallery.' /></a>";

		if(media_arr.length > 0){
			mediaPopString += "<span style='display:none;'>";
			var startPoint;
			if(largeImg == ""){
				startPoint = 1;
			}else{
				startPoint = 0;
			}
			
			//$("#stage").append( "<div id='acc_gallery' class='acc-skipIndex'></div>");
			for(var i = startPoint; i < media_arr.length; i++){
				//var accID = "acc" + i;
				//$("#acc_gallery").append("<div id='"+accID+"' aria-label='Picture Alt Text: "+alt_arr[i]+" With a Caption reading:"+caption_arr[i]+"'></div>");
				//pageAccess_arr.push($("#"+accID));
				if(hasHTML){
					mediaPopString += "<a rel='mediaPop' class='iframe' data-fancybox-group='gallery' href='media/"+ media_arr[i] + "' title='"+ caption_arr[i] + "'></a>";
				}else{
					mediaPopString += "<a rel='mediaPop' data-fancybox-group='gallery' href='media/"+ media_arr[i] + "' title='"+ caption_arr[i] + "'></a>";
				}
				var checkFile = media_arr[i].split('.'), i, l;
		        var last = checkFile.length;
		        var thisType = (checkFile[last - 1]);
				if(thisType == "swf"){
					hasSWF = true;
				}
				
				if(thisType == "html"){
					hasHTML = true;
				}
			}
			mediaPopString += "</span>";
		}

		mediaPopString += "</div>";
		$(mediaPopString).insertAfter("#loader");
		pageAccess_arr.push($("#mediaPop"));
		if(!hasSWF && !hasHTML){
			$("[rel='mediaPop']").fancybox({
				caption : {
					type : 'inside'
				},
				openEffect  : 'elastic',
				closeEffect : 'elastic',
				nextEffect  : galleryTransitionType,
				prevEffect  : galleryTransitionType,
				loop		: popLoop,
				maxHeight	: 768,
				maxWidth	: 1024,
				helpers : {
					title : tempCaption,
					thumbs: {
						width  : 50,
	                  	height : 50,
	                  	source  : function(current) {
		                    return $(current.element).data('thumbnail');
		                }
					}
				}
			});
		}

		if(hasSWF){

			$("[rel='mediaPop']").fancybox({
				caption : {
				type : 'inside'
				},
				openEffect  : 'elastic',
				closeEffect : 'elastic',
				nextEffect  : galleryTransitionType,
				prevEffect  : galleryTransitionType,
				loop		: popLoop,
				maxHeight	: 768,
				maxWidth	: 1024,
				helpers : {
					title : tempCaption,
					thumbs: {
						width  : 50,
	                  	height : 50,
	                  	source  : function(current) {
		                    return $(current.element).data('thumbnail');
		                }
					}
				},
				width	:  	parseInt($(data).find("page").eq(currentPage).attr('w')),
				height 	:	parseInt($(data).find("page").eq(currentPage).attr('h'))
			});
		}
		
		if(hasHTML){
			console.log("hasHTML")
			$("[rel='mediaPop']").fancybox({
				'width'         : '75%',
			    'height'        : '75%',
			    'autoScale'     : false,
			    'transitionIn'  : 'none',
			    'transitionOut' : 'none',
			    'type'          : 'iframe'
			});
		}
		
		if(!hasTouch){
			$("#myImgList").tooltip();
		}

		$("#mediaPop").click(function(){
			try { $("#myImgList").tooltip("destroy"); } catch (e) {}
			$(this).attr("title", tempCaption);
		}).keypress(function(event) {
	        var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
	        if (chCode == 32 || chCode == 13){
		        $(this).click();
		    }
        });
	}

	function setCaption(){
        if(rootType != 'branching'  && rootType != "pathing" && rootType != "chaining"){
	        var myCaption = $(data).find("page").eq(currentPage).find('caption').first().text();
        }else{
	        var myCaption = $(data).find("page").eq(currentPage).find("branch").eq(_id).find('caption').first().text();
	        if(myCaption == "" && mode == "edit"){
		        myCaption = "add caption here";
	        }
        }
        
        if(hasPop == true || largeImg != ""){
	    	$('<div id="centerMe" style="position: relative; float: left; height:'+ $("#mediaPop").height()+ 'px; width:'+ $("#mediaPop").width()+ 'px;">&nbsp;</div>').insertAfter("#myImgList");
	    	$('<div id="caption">'+myCaption+'</div>').insertAfter("#centerMe");
	    }else{
	    	$('<div id="caption">'+myCaption+'</div>').insertAfter("#loader");
	    }
		
		if((type == "graphicOnly") || (type == "left") || (type == "right")){
			$("#mediaHolder").css({'height': $("#loader").height() + $("#caption").height()});
		}
		
		/***********************************************************
		CREATES A TOOLTIP on .tooltip class members.
		***********************************************************/
		$(".toolTip").each(function(){
			$(this).tooltip({
				content: $(this).attr("title")
			})
		})

		if(transition == true && type != "completion"){
        	TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
        }

        if(type == "top" || type == "bottom"){
			$('.antiscroll-wrap').antiscroll();
        }

        if(mode == "edit"){
	        $("#caption").attr('contenteditable', true);
            CKEDITOR.disableAutoInline = true;
			CKEDITOR.inline( 'caption', {
				on: {
					blur: function (event){
						if(cachedTextPreEdit != event.editor.getData()){
							saveCaptionEdit(event.editor.getData());
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
				toolbar: captionToolbar,
				toolbarGroups :captionToolgroup,
				extraPlugins: 'sourcedialog',
				enterMode : CKEDITOR.ENTER_BR,
				shiftEnterMode: CKEDITOR.ENTER_P,
				allowedContent: true//'p b i span div img; p b i div span img [*](*){*}'
			});
			//config.protectedSource.push(/<i[^>]*><\/i>/g);
			if(rootType != 'branching'  && rootType != "pathing" && rootType != "chaining"){
				$("<div id='imgEdit' class='btn_edit_media' title='Edit Media'></div>").insertBefore($("#loader"));
	
				//Establish it's functionality
				$("#imgEdit").click(function(){
					var msg = "<div id='imgDialog' title='Input Media Path'>";
					msg += "<label id='label' title='input file name - must include file extension.'>file name: </label>";
					msg += "<input id='imgPath' class='dialogInput' type='text' value="+ mediaLink + " defaultValue="+ mediaLink + " style='width:70%;'/>";
					msg += "<button id='dialogMediaBrowseButton'>browse</button><br/>";
					msg += "<label id='label' title='Input a description of the media for visually impaired users.'>ALT text: </label>";
	            	msg += "<input id='altTextEdit' class='dialogInput' type='text' value='"+altText+"' defaultValue='"+altText+"' style='width:70%'/>";
					msg += "<br/>";
					msg += "<label id='label' title='Include a large version.  Will place an enlarge icon below your media which when clicked will expand the window.'>large version: </label>";
					msg += "<input id='isEnlargeable' type='checkbox' name='enableLargeIgm' class='radio' value='true'/>";
					msg += "<input id='lrgImgPath' class='dialogInput' type='text' value='"+ largeImg + "' defaultValue='"+ largeImg +"' style='width:70%;'/><br/>";
					msg += "<label id='label' title='Selecting adds a transcript button to page which reveals the transcript text below.'>transcript: </label>";
					msg += "<input id='isTranscript' type='checkbox' name='enableTranscript' class='radio' value='true'/><br/>";
					msg += "<label id='inputTranscriptLabel' title='Input text to appear in transcript.'><b>Input your transcript:</b></label>";
					msg += "<div id='inputTranscript' type='text' contenteditable='true' class='dialogInput'>" + transcriptText + "</div>";
					msg += "<label id='label' title='Selecting sets gallerys to loop (when reaching end and hitting next, go to first).'>loop gallery: </label>";
					msg += "<input id='isLoop' type='checkbox' name='enableGalleryLoop' class='radio' value='true'/>";
					msg += "<label id='label' title='Select the gallery transition type.' for='galTranType'>gallery transition type: </label>";
					msg += "<select id='galTranType' name='galTranType'>";
					msg += "<option>elastic</option>";
					msg += "<option>fade</option>";
					msg += "<option>none</option>";
					msg += "</select>";
	            	msg += "<br/><br/></div>";
	            	$("#stage").append(msg);
	            	
	            	$("#galTranType").val(galleryTransitionType);
					
	                if(largeImg == ""){
						$("#isEnlargeable").removeAttr('checked');
					}else{
						$("#isEnlargeable").attr('checked', 'checked');
					}
	
					if(popLoop){
						$("#isLoop").attr('checked', 'checked');
					}else{
						$("#isLoop").removeAttr('checked');
					}
					
					if(hasTranscript){
						$("#isTranscript").attr('checked', 'checked');
					}else{
						$("#isTranscript").removeAttr('checked');
					}
					$("#inputTranscript").css("max-height", 150).css("overflow", "scroll");
					
					$("#dialogMediaBrowseButton").click(function(){
						$(".ui-dialog").hide();
						$(".ui-widget-overlay").hide();
						dialogToggleMediaBrowser($("#imgPath"));					
					});
					
					if(!hasTranscript){
						$('#inputTranscriptLabel').hide();
						$('#inputTranscript').hide();
					}else{
						CKEDITOR.inline( "inputTranscript", {
							toolbar: contentToolbar,
							toolbarGroups :contentToolgroup,
							enterMode : CKEDITOR.ENTER_BR,
							shiftEnterMode: CKEDITOR.ENTER_P,
							extraPlugins: 'sourcedialog',
							on: {
						    	instanceReady: function(event){
						        	$(event.editor.element.$).attr("title", "Click here to edit this transcript.");
						    	}
						    }
						});
					}
					
					$('#isTranscript').change(function(){
						if($("#isTranscript").prop("checked") == true){
							$('#inputTranscriptLabel').show();
							$('#inputTranscript').show();
							CKEDITOR.inline( "inputTranscript", {
								toolbar: contentToolbar,
								toolbarGroups :contentToolgroup,
								enterMode : CKEDITOR.ENTER_BR,
								shiftEnterMode: CKEDITOR.ENTER_P,
								extraPlugins: 'sourcedialog',
							   	on: {
							      instanceReady: function(event){
							         $(event.editor.element.$).attr("title", "Click here to edit this transcript.");
							    	}
							    }
							});
						}
						else{
							try { CKEDITOR.instances["inputTranscript"].destroy() } catch (e) {}
							$('#inputTranscriptLabel').hide();
							$('#inputTranscript').hide();
						}
					});
	
					for(var i = 0; i < media_arr.length; i++){
						addGalleryItem(i, false);
					}
	
					$("#imgDialog").dialog({
	                    autoOpen: true,
					   	modal: true,
					   	width: 550,
					   	height: 680,
					   	resizable: false,
					   	buttons: {
							Cancel: function(){
								$("#imgDialog").dialog( "close" );
							},
							Add: function(){
								addGalleryItem(media_arr.length, true);
							},
							Save: function(){
								saveImageEdit($("#imgPath").val());
							}
						},
						close: function(){
							$("#imgDialog").remove();
							try { CKEDITOR.instances["inputTranscript"].destroy() } catch (e) {}
						}
					});
	
				}).tooltip();
	
				/*******************************************************
				* Drag and Drop Upload &&& Click Image for browse to image to upload
				********************************************************/
				if(dragFile == true){
					var $loader = $('#loader');
					var contentId = urlParams['type'] + '_' + urlParams['id'];
					$loader.attr('data-content', contentId);
					$loader.find('*').attr('data-content', contentId);
	
					$loader.click(function(){
						try { $("#loader").tooltip("destroy"); } catch (e) {}
						//$loader.unbind();
						siofu.prompt($loader.attr('data-content'));
					});
	
					siofu.listenOnDrop(document.getElementById("loader"));
	
					$("#loader").tooltip();
				}
	
				siofu.addEventListener("complete", function(event){
					siofu.removeEventListener("complete");
					siofu.removeEventListener("load");
					//if successful upload, else....
					var myFile = event.file.name;
					var myExt = getExtension(myFile);
	
					if(myExt == "mp4" || myExt == "jpg" || myExt == "gif" || myExt == "png" || myExt == "PNG" || myExt == "JPG" || myExt == "jpeg" || myExt == "mp3" || myExt == "MP3" || myExt == "swf" || myExt == "svg" || myExt == "SVG" || myExt == "html" || myExt == "htm" || myExt == "HTML" || myExt == "HTM"){
						if(event.success == true){
							saveImageEdit(myFile, true);
						}else{
							$("#stage").append("<div id='uploadErrorDialog' title='Upload Error'>There was an error uploading your content. Please try again, if the problem persists, please contact your program administrator.</div>");
							//Theres an error
							//Style it to jQuery UI dialog
							$("#uploadErrorDialog").dialog({
						    	autoOpen: true,
								modal: true,
								width: 400,
								height: 200,
								buttons: [ { text: "Close", click: function() {$( this ).dialog( "close" ); $( this ).remove()} }]
							});
						}
						$(".C_Loader").remove();
	
					}else if(myExt == "zip" || myExt == "ZIP"){
						$(".C_LoaderText").empty();
						$(".C_LoaderText").append("Your zip file is now being unzipped into your media folder.");
						cognizenSocket.on('unzipComplete', unzipComplete);
	
					}else if(myExt.toLowerCase() == "avi" || myExt.toLowerCase() == "mpg" || myExt.toLowerCase() == "wmv" || myExt.toLowerCase() == "webm" || myExt.toLowerCase() == "mov" || myExt.toLowerCase() == "ogv" || myExt.toLowerCase() == "flv" || myExt.toLowerCase() == "m4v" || myExt.toLowerCase() == "mpeg" || myExt.toLowerCase() == "f4v" || myExt.toLowerCase() == "mkv" || myExt.toLowerCase() == "m1v" || myExt.toLowerCase() == "mpv" || myExt.toLowerCase() == "m2v" || myExt.toLowerCase() == "ts" || myExt.toLowerCase() == "m2p" || myExt.toLowerCase() == "3gp"){
						$(".C_LoaderText").empty();
						$(".C_LoaderText").append("The file format that you uploaded can't be played in most browsers. Not to fear though - we are converting it to a compatibile format for you!<br/><br/>Larger files may take a few moments.<br/><br/>");
						$(".C_LoaderText").append("<div id='conversionProgress'><div class='progress-label'>Converting...</div></div>");
						$("#conversionProgress").progressbar({
							value: 0,
							change: function() {
								$(".progress-label").text($("#conversionProgress").progressbar("value") + "%");
							},
							complete: function() {
								$(".progress-label").text("Complete!");
							}
						});
	
						$("#conversionProgress > div").css({ 'background': '#3383bb'});
	
						cognizenSocket.on('mediaConversionProgress', mediaConversionProgress);
						cognizenSocket.on('mediaInfo', mediaInfo);
						cognizenSocket.on('mediaConversionComplete', mediaConversionComplete);
	
					}else{
						$("#stage").append("<div id='uploadErrorDialog' title='Upload Link Type Warning'>You uploaded a file type that can not be displayed in the content.  The file has been uploaded to the media directory so a link can be created in the content. Use 'media/filename.ext' to create the link.</div>");
						//Theres an error
						//Style it to jQuery UI dialog
						$("#uploadErrorDialog").dialog({
					    	autoOpen: true,
							modal: true,
							width: 400,
							height: 300,
							buttons: [ { text: "Close", click: function() {$( this ).dialog( "close" ); $( this ).remove()} }]
						});
						doGitCommit();
						$(".C_Loader").remove();
					}
				});
	
				siofu.addEventListener("start", function(event){
					try { $("#loader").tooltip("destroy"); } catch (e) {}
					var myFile = event.file.name;
					var myExt = getExtension(myFile);
					if(myExt.toLowerCase() == "mp3" || myExt.toLowerCase() == "wav" || myExt.toLowerCase() == "ogg" || myExt.toLowerCase() == "aiff" || myExt.toLowerCase() == "m4a" || myExt.toLowerCase() == "wma"){
						try { $("#audioDrop").tooltip("destroy"); } catch (e) {}
						if (type != "top" && type != "bottom"){
							$("#stage").append("<div id='C_Loader' class='C_Loader'></div>");
						}else{
							$("#contentHolder").append("<div id='C_Loader' class='C_Loader'></div>");
						}
					}else{
						$("#loader").append("<div class='C_Loader'><div class='C_LoaderText'> Uploading "+ myFile +" to the media directory. Larger files may take a few moments.</div></div>");
					}
				});
			}
        }
        doAccess(pageAccess_arr);
        callback;
    }

    function mediaConversionProgress(data){
	    $("#conversionProgress").progressbar("value", Math.floor(data.percent))
	}

	function mediaInfo(data){
		if(data.video != ""){
			var splitDim = data.video_details[2].split("x");
			mediaWidth = splitDim[0];
			mediaHeight = splitDim[1];
		}
	}

	function unzipComplete(){
		$(".C_Loader").remove();
		cognizenSocket.removeListener("unzipComplete", unzipComplete);
		var msg = "<div id='zipUploadCompleteDialog' title='Unzipping Complete'>";
		msg += "<p>Your zip file has been uploaded and it's contents placed in your media folder.</p>";
		msg += "<p><b>IF</b> your zip is a zip of a folder, you will have to add that folder to your path when accessing the media. For instance, if you zipped a folder called myFolder with a video named myMedia.mp4 in it, when you access the media in the system, the path would be myFolder/myMedia.mp4.</p>";
		msg += "<p>If you simply zipped a group of files, they can be accessed as you usually would.  For instance, if you zipped myImage.png, myImage2.png and myImage3.png, you access the media through the system, you would just input myImage.png.</p>"
		msg += "</div>";

		$("#stage").append(msg);

		//Style it to jQuery UI dialog
		$("#zipUploadCompleteDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 500,
			height: 200,
			buttons:{
				OK: function(){
					$(this).dialog("close");
					sendUpdateWithRefresh();
				},
			},
			close: function(){
				$("#zipUploadCompleteDialog").remove();
			}
		});
	}

	function mediaConversionComplete(data){
		var splitPath = data.split("/");
		var last = splitPath.length;
		var mediaPath = splitPath[last-1];
		var splitType = splitPath[last-1].split(".");
		var type = splitType[splitType.length-1];
		if(type == "mp4"){
			saveImageEdit(mediaPath, true);
		}
		$(".C_Loader").remove();
	}

	/**********************************************************************
     **Save Content Edit - save updated content text to content.xml
     **********************************************************************/
    function saveCaptionEdit(_data){
        if(_data != "add caption here"){
	        var docu = new DOMParser().parseFromString('<caption></caption>',  "application/xml")
	        var newCDATA=docu.createCDATASection(_data);
	        console.log(_data);
	        if(rootType != 'branching'  && rootType != "pathing" && rootType != "chaining"){
		        $(data).find("page").eq(currentPage).find("caption").first().empty();
		        $(data).find("page").eq(currentPage).find("caption").first().append(newCDATA);
		    }else{
			    $(data).find("page").eq(currentPage).find("branch").eq(_id).append($("<caption>"));
			    var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			    $(data).find("page").eq(currentPage).find("branch").eq(_id).find("caption").first().empty();
		        $(data).find("page").eq(currentPage).find("branch").eq(_id).find("caption").first().append(newCDATA);
			}
	        sendUpdate();
	    }
    };

	/**********************************************************************
     **Save Image Edit
     **********************************************************************/
	function saveImageEdit(_path, fromDrop){
		fromDrop = typeof fromDrop !== 'undefined' ? fromDrop : false;
		
		if(!fromDrop){
			$(data).find("page").eq(currentPage).attr("alt", $("#altTextEdit").val());
			
			$(data).find("page").eq(currentPage).attr("galTransType", $("#galTranType").val());
			
			//Check if there is an enlarged image to link
			if($("#isEnlargeable").prop("checked") == true){
				$(data).find("page").eq(currentPage).attr("enlarge", $("#lrgImgPath").val());
			}else{
				$(data).find("page").eq(currentPage).attr("enlarge", "");
			}
	
			if($("#isLoop").prop("checked") == true){
				$(data).find("page").eq(currentPage).attr("poploop", "true");
			}else{
				$(data).find("page").eq(currentPage).attr("poploop", "false");
			}
			
			if($("#isTranscript").prop("checked") == true){
				if(rootType == "branching"  || rootType == "pathing" || rootType == "chaining"){
					$(data).find("page").eq(currentPage).find("branch").eq(_id).attr("visualtranscript", "true");
				}else{
					$(data).find("page").eq(currentPage).attr("visualtranscript", "true");
				}
				var transcriptUpdate = CKEDITOR.instances["inputTranscript"].getData();
				try { CKEDITOR.instances["inputTranscript"].destroy() } catch (e) {}
				var transcriptDoc = new DOMParser().parseFromString('<visualtranscript></visualtranscript>', 'application/xml');
				var transcriptCDATA = transcriptDoc.createCDATASection(transcriptUpdate);
				if(rootType == "branching"  || rootType == "pathing" || rootType == "chaining"){
					$(data).find("page").eq(currentPage).find("branch").eq(_id).find("visualtranscript").empty();
					$(data).find("page").eq(currentPage).find("branch").eq(_id).find("visualtranscript").append(transcriptCDATA);
					transcriptText = $(data).find("page").eq(currentPage).find("branch").eq(_id).find("visualtranscript").text();
				}else{
					$(data).find("page").eq(currentPage).find("visualtranscript").empty();
					$(data).find("page").eq(currentPage).find("visualtranscript").append(transcriptCDATA);
					transcriptText = $(data).find("page").eq(currentPage).find("visualtranscript").text();
				}		
			}else{
				if(rootType == "branching"  || rootType == "pathing" || rootType == "chaining"){
					$(data).find("page").eq(currentPage).find("branch").eq(_id).attr("visualtranscript", "false");
				}else{
					$(data).find("page").eq(currentPage).attr("visualtranscript", "false");
				}
			}
		}
		
		
		//Check if there is a gallery attached AND that the media wasn't dropped.
		if(media_arr.length > 0 && fromDrop == false){
			var mediaString = "";
			var captionString = "";
			var altString = "";
			var virgin = true;

			for(var i = 0; i < media_arr.length; i++){
				if(virgin == false){
					mediaString +=",";
					captionString += "!!!";
					altString += "!!!";
				}

				mediaString += $("#imgPath"+$("#"+galleryEdit_arr[i]).attr('value')).val();
				captionString += $("#"+captionEditText_arr[i]).val().replace(/\'/g, "&#39;");
				altString += $("#altEditText"+$("#"+galleryEdit_arr[i]).attr('value')).val().replace(/\'/g, "&#39;");
				virgin = false;
			}
			$(data).find("page").eq(currentPage).attr("popup", mediaString);
			$(data).find("page").eq(currentPage).attr("popcaps", captionString);
			$(data).find("page").eq(currentPage).attr("popalt", altString);
			captionEditText_arr.length = 0;
			altEditText_arr.length = 0;
		}else if(media_arr.length == 0){
			$(data).find("page").eq(currentPage).attr("popup", "");
			$(data).find("page").eq(currentPage).attr("popcaps", "");
			$(data).find("page").eq(currentPage).attr("popalt", "");
		}

		var imgPath = _path;
        var parts = imgPath.split('.'), i, l;
		var last = parts.length;
		if(_path.indexOf("youtube.com") > -1 || _path.indexOf("youtu.be") > -1){
			mediaLinkType = "youtube";
		}
		mediaType = getExtension(imgPath);

		if(mediaType == "mp4" || mediaLinkType == "youtube"){
			$(data).find("page").eq(currentPage).attr("img", imgPath);
			if(mediaWidth == 0){
				if($(data).find("page").eq(currentPage).attr('w') != undefined && $(data).find("page").eq(currentPage).attr('w') != null){
					mediaWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
					mediaHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
				}
			}
			var tmpPath = "";
			for(var i = 0; i < last-1; i++){
				tmpPath += String(parts[i]);
			}
			tmpPath.replace("undefined", "");

			var tmpPoster;
			if(posterLink != null){
				tmpPoster = posterLink;
			}else{
				tmpPoster = tmpPath+ ".png";
			}
			
			var tmpSubs;
			if(subsLink != null){
				tmpSubs = subsLink;
			}else{
				tmpSubs = tmpPath+ ".srt";
			}
			//TODO add tooltips
			var msg = "<div id='videoDialog' title='Input Video Stats'>";
			msg += "<div id='videoDialog' title='Input Video Stats'>";
			msg += "<div>Video Width: <input id='videoWidth' class='dialogInput' type='text' title='Add the video width by px' value="+ mediaWidth + " defaultValue="+ mediaWidth + " style='width:15%;'/></div>";
			msg += '<span id="videoWidthError" class="error">The value must be a numeric value</span><br/>';
			msg += "<div>Video Height: <input id='videoHeight' class='dialogInput' type='text' title='Add the video height by px' value="+ mediaHeight + " defaultValue="+ mediaHeight + " style='width:15%;'/></div>";
			msg += '<span id="videoHeightError" class="error">The value must be a numeric value</span><br/>';
			msg += "<input id='autoplay' type='checkbox' name='autoplay' class='radio' value='true' title='The video will begin once the page is loaded'/></input>";
			msg += "<label id='label'> autoplay</label><br/>";			
			msg += "<input id='autonext' type='checkbox' name='autonext' class='radio' value='true' title='The next page to be loaded once the video is complete'/></input>";
			msg += "<label id='label'> autonext</label><br/>";			
			msg += "<input id='poster' type='checkbox' name='hasPoster' class='radio' value='true' title='Adds poster to be displayed while the video loads'/></input>";
			msg += "<label id='label'> poster</label>";			
			msg += "<input id='posterFile' class='dialogInput' type='text' title='Enter the name of the poster file' value='"+ tmpPoster + "' defaultValue='"+ tmpPoster + "' style='width:40%;'/>";
			msg += "<br/>";
			msg += "<input id='subs' type='checkbox' name='hasSubs' class='radio' value='true' title='Enables CC functionality with .srt files'/></input>";
			msg += "<label id='label'> subtitles: </label>";			
			msg += "<input id='subFile' class='dialogInput' type='text' title='Enter the name of the srt file' value='"+ tmpSubs + "' defaultValue='"+ tmpSubs + "' style='width:40%;'/>";
			msg += '<h4>Hide Video Controls</h4>';
			msg += '<table><tr><th style="text-align:center">Select All</th>';
			msg += '<th style="text-align:center">Play/Pause</th>';
			msg += '<th style="text-align:center">Current</th>';
			msg += '<th style="text-align:center">Progress</th>';
			msg += '<th style="text-align:center">Duration</th>';
			msg += '<th style="text-align:center">Volume </th>';
			msg += '<th style="text-align:center">Fullscreen</th>';
			msg += '</tr>';
			msg += '<tr><td style="text-align:center"><input id="hideAllVideoControls" type="checkbox" name="hideAllVideoControls" class="radio" value="true" title="Hides all the video player controls if selected"></td>';
			msg += '<td style="text-align:center"><input id="hideVideoPlayPauseControls" type="checkbox" name="hideVideoPlayPauseControls" class="radio" value="true" title="Hides the play/pause video player control if selected"></td>';
			msg += '<td style="text-align:center"><input id="hideVideoCurrentControls" type="checkbox" name="hideVideoCurrentControls" class="radio" value="true" title="Hides the current video time indicator if selected"></td>';
			msg += '<td style="text-align:center"><input id="hideVideoProgressControls" type="checkbox" name="hideVideoProgressControls" class="radio" value="true" title="Hides the progress bar if selected"></td>';
			msg += '<td style="text-align:center"><input id="hideVideoDurationControls" type="checkbox" name="hideVideoDurationControls" class="radio" value="true" title="Hides the duration video time indicator if selected"></td>';
			msg += '<td style="text-align:center"><input id="hideVideoVolumeControls" type="checkbox" name="hideVideoVolumeControls" class="radio" value="true" title="Hides the video volume control if selected"></td>';
			msg += '<td style="text-align:center"><input id="hideVideoFullscreenControls" type="checkbox" name="hideVideoFullscreenControls" class="radio" value="true" title="Hides the fullscreen player control if selected"></td>';
			msg += '</tr></table>';
			msg += "</div>";
			$("#loader").append(msg);

			if(hasSubs == true){
				$("#subs").attr("checked", "checked");
			}else{
				$("#subFile").hide();
			}

			if(autoPlay == true){
				$("#autoplay").attr("checked", "checked");
			}

			if(autoNext == true){
				$("#autonext").attr("checked", "checked");
			}

			if(hideVideoPlayPauseControls == true){		
				$("#hideVideoPlayPauseControls").attr("checked", "checked");
			}

			if(hideVideoCurrentControls == true){		
				$("#hideVideoCurrentControls").attr("checked", "checked");
			}

			if(hideVideoProgressControls == true){		
				$("#hideVideoProgressControls").attr("checked", "checked");
			}

			if(hideVideoDurationControls == true){		
				$("#hideVideoDurationControls").attr("checked", "checked");
			}

			if(hideVideoVolumeControls == true){		
				$("#hideVideoVolumeControls").attr("checked", "checked");
			}

			if(hideVideoFullscreenControls == true){		
				$("#hideVideoFullscreenControls").attr("checked", "checked");
			}

			if(hideVideoPlayPauseControls == true && hideVideoCurrentControls == true && 
				hideVideoProgressControls == true && hideVideoDurationControls == true && 
				hideVideoVolumeControls == true && hideVideoFullscreenControls == true){		
				$("#hideAllVideoControls").attr("checked", "checked");
			}

			$("#hideAllVideoControls").change(function(){
				if($("#hideAllVideoControls").prop("checked") == true){
					$("#hideAllVideoControls").prop("checked", true);
					$("#hideVideoPlayPauseControls").prop("checked", true);
					$("#hideVideoCurrentControls").prop("checked", true);
					$("#hideVideoProgressControls").prop("checked", true);
					$("#hideVideoDurationControls").prop("checked", true);
					$("#hideVideoVolumeControls").prop("checked", true);
					$("#hideVideoFullscreenControls").prop("checked", true);
				}
				else{
					$("#hideAllVideoControls").attr("checked", false);
					$("#hideVideoPlayPauseControls").attr("checked", false);
					$("#hideVideoCurrentControls").attr("checked", false);
					$("#hideVideoProgressControls").attr("checked", false);
					$("#hideVideoDurationControls").attr("checked", false);
					$("#hideVideoVolumeControls").attr("checked", false);
					$("#hideVideoFullscreenControls").attr("checked", false);
				}
			});		

			$("#hideVideoPlayPauseControls, #hideVideoCurrentControls, #hideVideoProgressControls,"+
			  "#hideVideoDurationControls, #hideVideoVolumeControls, #hideVideoFullscreenControls").change(function(){
			  	if($("#hideAllVideoControls").prop("checked") == true){
			  		if( $("#hideVideoPlayPauseControls").prop("checked") == false ||
						$("#hideVideoCurrentControls").prop("checked") == false ||
						$("#hideVideoProgressControls").prop("checked") == false ||
						$("#hideVideoDurationControls").prop("checked") == false ||
						$("#hideVideoVolumeControls").prop("checked") == false ||
						$("#hideVideoFullscreenControls").prop("checked") == false)
			  		{
			  			$("#hideAllVideoControls").attr("checked", false);
			  		}

			  	}
			});					
			
			if(hasPoster == true){
				$("#poster").attr("checked", "checked");
			}else{
				$("#posterFile").hide();
			}
			
			$('#subs').change(function(){
				if($("#subs").prop("checked") == true){
					$('#subFile').show();
				}
				else{
					$('#subFile').hide();
				}
			});
			
			$('#poster').change(function(){
				if($("#poster").prop("checked") == true){
					$('#posterFile').show();
				}
				else{
					$('#posterFile').hide();
				}
			});

			//#3230
			$('#videoWidth').on('change', function(){
				if(!$.isNumeric($('#videoWidth').val())){
					$('#videoWidthError').removeClass('error').addClass('error_show');
					$('#videoWidth').val(mediaWidth);		
				}
				else{
					if($('#videoWidthError').hasClass('error_show')){
						$('#videoWidthError').removeClass('error_show').addClass('error');
					}
				}						
			});

			//#3230
			$('#videoHeight').on('change', function(){
				if(!$.isNumeric($('#videoHeight').val())){
					$('#videoHeightError').removeClass('error').addClass('error_show');
					$('#videoHeight').val(mediaHeight);		
				}
				else{
					if($('#videoHeightError').hasClass('error_show')){
						$('#videoHeightError').removeClass('error_show').addClass('error');
					}
				}						
			});	

			$("#videoDialog").dialog({
            	autoOpen: true,
            	dialogClass: "no-close",
				modal: true,
				width: 600,
				buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: function(){
						var strippedPath = "";
						$(data).find("page").eq(currentPage).attr("w", $("#videoWidth").val());
						$(data).find("page").eq(currentPage).attr("h", $("#videoHeight").val());

						//Check if youtube - add attribute if needed...
						if(mediaLinkType == "youtube"){
							$(data).find("page").eq(currentPage).attr("mediaLinkType", "youtube");
						}else{
							$(data).find("page").eq(currentPage).attr("mediaLinkType", "");
						}

						for(var i = 0; i < last-1; i++){
							strippedPath += parts[i];
						}
						if($("#subs").prop("checked") == true){
							$(data).find("page").eq(currentPage).attr("subs", $("#subFile").val());
						}else{
							$(data).find("page").eq(currentPage).attr("subs", "null");
						}

						if($("#poster").prop("checked") == true){
							$(data).find("page").eq(currentPage).attr("poster", $("#posterFile").val());
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

						if($("#hideAllVideoControls").prop("checked") == true){
							$(data).find("page").eq(currentPage).attr("hideVideoPlayPauseControls", "true");
							$(data).find("page").eq(currentPage).attr("hideVideoCurrentControls", "true");
							$(data).find("page").eq(currentPage).attr("hideVideoProgressControls", "true");
							$(data).find("page").eq(currentPage).attr("hideVideoDurationControls", "true");
							$(data).find("page").eq(currentPage).attr("hideVideoVolumeControls", "true");
							$(data).find("page").eq(currentPage).attr("hideVideoFullscreenControls", "true");
						}else{
							if($("#hideVideoPlayPauseControls").prop("checked") == true){
								$(data).find("page").eq(currentPage).attr("hideVideoPlayPauseControls", "true");
							}else{
								$(data).find("page").eq(currentPage).attr("hideVideoPlayPauseControls", "false");
							}

							if($("#hideVideoCurrentControls").prop("checked") == true){
								$(data).find("page").eq(currentPage).attr("hideVideoCurrentControls", "true");
							}else{
								$(data).find("page").eq(currentPage).attr("hideVideoCurrentControls", "false");
							}

							if($("#hideVideoProgressControls").prop("checked") == true){
								$(data).find("page").eq(currentPage).attr("hideVideoProgressControls", "true");
							}else{
								$(data).find("page").eq(currentPage).attr("hideVideoProgressControls", "false");
							}														

							if($("#hideVideoDurationControls").prop("checked") == true){
								$(data).find("page").eq(currentPage).attr("hideVideoDurationControls", "true");
							}else{
								$(data).find("page").eq(currentPage).attr("hideVideoDurationControls", "false");
							}

							if($("#hideVideoVolumeControls").prop("checked") == true){
								$(data).find("page").eq(currentPage).attr("hideVideoVolumeControls", "true");
							}else{
								$(data).find("page").eq(currentPage).attr("hideVideoVolumeControls", "false");
							}

							if($("#hideVideoFullscreenControls").prop("checked") == true){
								$(data).find("page").eq(currentPage).attr("hideVideoFullscreenControls", "true");
							}else{
								$(data).find("page").eq(currentPage).attr("hideVideoFullscreenControls", "false");
							}														
						}

						$(data).find("page").eq(currentPage).attr("controlType", "bar");
						$("#videoDialog").remove();
						sendUpdateWithRefresh();
						currentTemplate.fadeComplete();
					}
				}).tooltip();
		}else if(mediaType == "swf"){
             //If its a swf we have to set it's width and height! - very imoprtant or shit get funky homey....
			 $(data).find("page").eq(currentPage).attr("img", imgPath);

			 if(mediaWidth == 0){
				if($(data).find("page").eq(currentPage).attr('w') != undefined && $(data).find("page").eq(currentPage).attr('w') != null){
					mediaWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
					mediaHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
				}
			}

			//#4971 reset poster attr when not a video
			$(data).find("page").eq(currentPage).attr("poster", "null");

			 $("#stage").append("<div id='swfDialog' title='Input SWF Stats'><div>SWF Width: <input id='swfWidth' class='dialogInput' type='text' value="+ mediaWidth + " defaultValue="+ mediaWidth + " style='width:15%;'/></div><div>SWF Height: <input id='swfHeight' class='dialogInput' type='text' value="+ mediaHeight + " defaultValue="+ mediaHeight+ " style='width:15%;'/></div></div>");
			 $("#swfDialog").dialog({
                autoOpen: true,
                dialogClass: "no-close",
				modal: true,
				buttons: [ { text: "Save", click: function() {
					$(data).find("page").eq(currentPage).attr("w", $("#swfWidth").val());
					$(data).find("page").eq(currentPage).attr("h", $("#swfHeight").val());
					$( this ).dialog( "close" ); 
				} }],
				close: function(){
					sendUpdateWithRefresh();
					currentTemplate.fadeComplete();
				}
			});
		}else if(mediaType == "jpg" || mediaType == "gif" || mediaType == "png" || mediaType == "jpeg" || mediaType == "JPG" || mediaType == "PNG" || mediaType == "GIF" || mediaType == "svg" || mediaType == "SVG"){
            $(data).find("page").eq(currentPage).attr("img", imgPath);
            //#4971 reset poster attr when not a video
			$(data).find("page").eq(currentPage).attr("poster", "null");
		}else if(mediaType == "html" || mediaType == "HTML" || mediatType == "htm" || mediaType == "HTM"){
			$(data).find("page").eq(currentPage).attr("img", imgPath);

			if(mediaWidth == 0){
				if($(data).find("page").eq(currentPage).attr('w') != undefined && $(data).find("page").eq(currentPage).attr('w') != null){
					mediaWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
					mediaHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
				}
			}

			//#4971 reset poster attr when not a video
			$(data).find("page").eq(currentPage).attr("poster", "null");			

			$("#stage").append("<div id='htmlDialog' title='Input Page Information'><div>HTML Width: <input id='htmlWidth' class='dialogInput' type='text' value="+ mediaWidth + " defaultValue="+ mediaWidth + " style='width:15%;'/></div><div>HTML Height: <input id='htmlHeight' class='dialogInput' type='text' value="+ mediaHeight + " defaultValue="+ mediaHeight + " style='width:15%;'/></div></div>");
			 $("#htmlDialog").dialog({
                autoOpen: true,
				modal: true,
				buttons: [ { text: "Save", click: function() {
					$(data).find("page").eq(currentPage).attr("w", $("#htmlWidth").val());
					$(data).find("page").eq(currentPage).attr("h", $("#htmlHeight").val());
					$( this ).dialog( "close" ); 
				} }],
				close: function(){
					
					sendUpdateWithRefresh();
					currentTemplate.fadeComplete();
				}
			});
		}

		if(mediaType != "mp4"  && mediaType != "swf"){
			sendUpdateWithRefresh();
			currentTemplate.fadeComplete();
		}
		$("#imgDialog").remove();
	};

	function removeGalleryItem(_removeID){
		//Find correct location in arrays - to remove - other items by ID are removed by that...
		//Needed because if you remove more than one the below arr index would be out of step....
		for(var i = 0; i < galleryEdit_arr.length; i++){
			if(_removeID == $("#"+galleryEdit_arr[i]).attr("value")){
				var arrIndex = i;
				break;
			}
		}

		galleryEdit_arr.splice(arrIndex, 1);
		media_arr.splice(arrIndex,1);
		caption_arr.splice(arrIndex, 1);
		alt_arr.splice(arrIndex, 1);
		captionEditText_arr.splice(arrIndex, 1);
		altEditText_arr.splice(arrIndex, 1);
		var myItem = "#galleryItem" + _removeID;
		$(myItem).remove();
	}

	function addGalleryItem(_addID, _isNew){
		if(_isNew == true){
			//If no entries - just add the next one.
			if(media_arr.length == 0){
				$(data).find("page").eq(currentPage).attr('popup', "defaultTop.png");
				$(data).find("page").eq(currentPage).attr('popcaps', " ");
				$(data).find("page").eq(currentPage).attr('popalt', " ");
			}else{
				var popString = $(data).find("page").eq(currentPage).attr('popup');
				popString += ",defaultTop.png";
				$(data).find("page").eq(currentPage).attr('popup', popString);
				var captionString = $(data).find("page").eq(currentPage).attr('popcaps');
				captionString += "!!! ";
				$(data).find("page").eq(currentPage).attr('popcaps', captionString);
				var altString = $(data).find("page").eq(currentPage).attr('popalt');
				altString += "!!! ";
				$(data).find("page").eq(currentPage).attr('popalt', altString);
			}

			media_arr.push("defaultTop.png");
			caption_arr.push(" ");
			alt_arr.push(" ");
		}

		var imgID = "imgPath" + _addID;
		var captionTextID = "captionEditText" + _addID;
		var altTextID = "altEditText" + _addID;
		var removeID = "removeMedia" + _addID;
		var galleryItemID = "galleryItem" + _addID;
		captionEditText_arr.push(captionTextID);

		var msg = "<div id='"+galleryItemID+"' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='"+removeID+"' value='"+_addID+"' class='removeMedia' title='Remove this image'/>";
		msg += "<label id='label'><b>Gallery Item: </b><br/></label>";
		msg += "<label id='label'>Media: </label><input id='imgPath" + _addID + "' class='dialogInput' type='text' value='"+media_arr[_addID]+"' defaultValue='"+media_arr[_addID]+"' style='width:60%;'/>";
		msg += "<button id='browseMB" + _addID + "'>browse</button><br/>";
		msg += "<label id='label'>Caption:</label><input id='"+captionTextID+"' type='text' class='dialogInput' value='"+caption_arr[_addID]+"' defaultValue='"+caption_arr[_addID]+"'  style='width:80%;'/><br/>";
		msg += "<label id='label'>ALT text: </label>";
		msg += "<input id='"+altTextID+"' class='dialogInput' type='text' value='"+alt_arr[_addID]+"' defaultValue='"+alt_arr[_addID]+"' style='width:70%'/>";
		msg += "</div>"
		$("#imgDialog").append(msg);
		
		$("#browseMB" + _addID).click(function(){
			$(".ui-dialog").hide();
			$(".ui-widget-overlay").hide();
			dialogToggleMediaBrowser($("#imgPath" + _addID));					
		});
		
		$("#" + removeID).click(function(){
			removeGalleryItem($(this).attr("value"));
		});

		galleryEdit_arr.push(galleryItemID);
	}

	//Function called on video complete if autoNext == true
    function hasEnded(){
        $('#next').click();
    }


	this.getCaption = function(){

	}

    this.setCaption = function(){
        //otherFighter.energy -= 10;
        //otherFighter.health -= 10;

    }

    this.setupGallery = function(){
        //otherFighter.energy -= item.damage;
        //otherFighter.health -= item.damage;
    }

    this.updateMediaCSS = function(){

    }

    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
    this.destroy = function (){

	    try { $("#loader").unbind(); } catch (e) {}
	    try { $("#videoplayer").unbind(); } catch (e) {}
	    try { $("#videoplayer").player.remove(); } catch (e) {}
	    try { $("#videoplayer").player.setSource("");} catch (e) {}
	    try { $("#videoplayer").player.load();} catch (e) {}
	    try { $("#videoplayer").remove(); } catch (e) {}
	    
	    if (mejs) {
		    var players = _.keys(mejs.players);
		    _.each(players, function(player) {
		        mejs.players[player].remove();
		    });
		}
	    for (var key in mejs.players){
		    
		    var obj = mejs.players[key].player;
		    obj.stop();
		    obj.setSource("");
		    obj.load();
		    obj.remove();
		    delete obj;
	    }
	    
		try { cognizenSocket.removeListener('mediaConversionProgress', mediaConversionProgress); } catch (e) {}
		try { cognizenSocket.removeListener('mediaInfo', mediaInfo);} catch (e) {}
		try { cognizenSocket.removeListener('mediaConversionComplete', mediaConversionComplete); } catch (e) {}
		try { $("#swfDialog").remove(); } catch (e) {}
		try { $('#loader').flash().remove(); } catch (e) {}
		try { $("#acc_gallery").remove(); } catch (e) {}
		try { $("#mediaPop").remove(); } catch (e) {}
		try { $("#myImgList").remove(); } catch (e) {}
		try { $(".transcriptPane").remove(); } catch (e) {}
		
		try { $("#mediaHolder").remove(); } catch (e) {}
		try { $("#imgDialog").remove(); } catch (e) {}

		try { $("#myImgList").tooltip("destroy"); } catch (e) {}
		try { $("#loader").tooltip("destroy"); } catch (e) {}

		try { $(".toolTip").each(function(){
				$(this).tooltip("destroy");
			})
		}catch (e) {}
    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}