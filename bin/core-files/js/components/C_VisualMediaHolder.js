function C_VisualMediaHolder(callback){
    //Define Variables
    var type = $(data).find("page").eq(currentPage).attr('layout'); 
    var myImage = "";
    var mediaLink = $(data).find("page").eq(currentPage).attr('img');
    var autoPlay = false;
    var autoNext = false;
    var hasCaption = false;
    var mediaWidth = 0;
    var mediaHeight = 0;
    
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
	
	var galleryEdit_arr = [];
	
	var myCaption = $(data).find("page").eq(currentPage).find('caption').first().text();
	
	var favoriteTypes = ["mp4", "swf", "jpg", "png", "html", "gif", "jpeg", "mp3", "svg"];
    var convertableVideoTypes = ["ogv", "avi", "mov", "wmv", "flv", "webm"];
    var convertableVectorTypes = ["eps"];
    var convertableAudioTypes = ["wav", "ogg", "m4a", "aiff", "flac", "wma"]; 
    
    //Populate Key Variables
    if($(data).find("page").eq(currentPage).attr('autonext') == "true"){
		autoNext = true;
	}
		
	if($(data).find("page").eq(currentPage).attr('autoplay') == "true"){
		autoPlay = true;
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
	
	altText = $(data).find("page").eq(currentPage).attr('alt');
	
	if(type == "top" || type == "tabsLeft"){
		$('<div id="mediaHolder"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div>').insertAfter($("#content"));
	}else if(type == "bottom"){
		$('<div id="mediaHolder"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div>').insertBefore($("#content"));
	}else if(type == "multipleChoiceMedia"){
		$('<div id="mediaHolder"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div>').insertAfter($("#question"));
	}else {
    	$('#stage').append('<div id="mediaHolder"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(currentPage).attr('alt') + '"></div></div>');
	}
        	
    if(mode == 'edit'){
    	$("#loader").attr("title", "click to browse or drag media to this location");
    }else{
		$("#loader").attr("title", $(data).find("page").eq(currentPage).attr('alt'));
    }
    var tempID = "#loader";
    
    //loadVisualMedia();

    this.loadVisualMedia = function() {
		
		if(type == "left"){
            $("#mediaHolder").addClass("right");
        }else if(type == "top"){
            $("#mediaHolder").addClass("bottom");
        }else if(type == "bottom"){
            $("#mediaHolder").addClass("top");
        }else if(type == "right"){
            $("#mediaHolder").addClass("left");
        }else if(type == "graphicOnly"){
            $("#mediaHolder").addClass("graphic");
        }else if(type == "multipleChoiceMedia" || type == "tabsLeft"){
	        $("#mediaHolder").addClass("tabsRight");
        }

        var mediaLinkType = $(data).find("page").eq(currentPage).attr('mediaLinkType');

        if($(data).find("page").eq(currentPage).attr('img') != "" && $(data).find("page").eq(currentPage).attr('img') != " "){
            myImage = "media/" + mediaLink;
        }else{
            //We will have default.png's for different layouts - just a series of if, else if below here.
            myImage = "media/default.png";
        }

        var parts = myImage.split('.'), i, l;
        var last = parts.length;
		var imageWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
        var imageHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
        mediaType = (parts[last - 1]);
		
        if(mediaType == "swf"){////////////////////////////////////////////////Flash
            $("#loader").flash({swf:myImage,width:imageWidth,height:imageHeight});
        }else if (mediaType == "html"){////////////////////////////////////////////////HTML for edge or js apps.
            console.log("oldIE = " + oldIE);
            if(oldIE == true){
	            $("#loader").append('<iframe seamless frameborder="0" src="'+ myImage +'" width="' + imageWidth + '" height="' + imageHeight + '"></iframe>');
            }else{
            	$("#loader").append('<object id="edgeContent" data='+myImage+' type="text/html" width="' + imageWidth + '" height="' + imageHeight + '" align="absmiddle"></object>');
            }
            $("#loader").removeClass('loading');
        }else if (mediaType == "mp4"  || mediaLinkType == "youtube"){////////////////////////////////////////////////VIDEO
            
            autoPlay = $(data).find("page").eq(currentPage).attr('autoplay');
            
            var vidHTMLString = "<video id='videoplayer' width=" + imageWidth + " height=" + imageHeight + " controls='controls'";
			if(mediaLinkType == "youtube"){
                vidHTMLString += " preload='none'";
            }

            if($(data).find("page").eq(currentPage).attr('poster') != undefined && $(data).find("page").eq(currentPage).attr('poster') != "null" && $(data).find("page").eq(currentPage).attr('poster').length != 0){
                hasPoster = true;
                posterLink = $(data).find("page").eq(currentPage).attr('poster');
            }else{
                hasPoster = false;
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
                vidHTMLString += "<track kind='subtitles' src='media/" + subLink + "' srclang='en'/>"
            }
			vidHTMLString += "</video>";

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
        }else{////////////////////////////////////////////////IMAGES
            var img = new Image();
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
        if(mediaType == "mp4" || mediaType == "html"  || mediaType == "swf" || mediaLinkType == "youtube"){
            $("#loader").removeClass('loading');
            $("#mediaHolder").css({'width': imageWidth});
            $("#loader").css({'width': imageWidth, 'height': imageHeight});
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
				
		var mediaPopString = "<div id='myImgList' class='imglist'><a id='mediaPop' rel='mediaPop' class='mediaPop'  href='"+tempItem+"'><img src='css/images/img-enlarge.gif' title='click to view enlarged media' alt='' /></a>";
					
		if(media_arr.length > 0){
			mediaPopString += "<span style='display:none;'>";
			var startPoint;
			if(largeImg == ""){
				startPoint = 1;
			}else{
				startPoint = 0;
			}
			for(var i = startPoint; i < media_arr.length; i++){
				mediaPopString += "<a rel='mediaPop' data-fancybox-group='gallery' href='media/"+ media_arr[i] + "' title='"+ caption_arr[i] + "'></a>";
			}
			mediaPopString += "</span>";
		}
				
		mediaPopString += "</div>";
				
		$(mediaPopString).insertAfter("#loader");				 
		$("[rel='mediaPop']").fancybox({
			caption : {
				type : 'inside'
			},
			openEffect  : 'elastic',
			closeEffect : 'elastic',
			nextEffect  : 'elastic',
			prevEffect  : 'elastic',
			maxHeight	: 1024,
			maxWidth	: 768,
			helpers : {
				title : tempCaption,
				thumbs: {
					width  : 50,
                  	height : 50
				}
			}
		});
				
		if(mediaType = "swf"){
			$("[rel='mediaPop']").fancybox({
				width	:  	parseInt($(data).find("page").eq(currentPage).attr('w')),
				height 	:	parseInt($(data).find("page").eq(currentPage).attr('h'))
			});
		}
		$("#myImgList").tooltip();
		$("#mediaPop").click(function(){
			try { $("#myImgList").tooltip("destroy"); } catch (e) {}
			$(this).attr("title", tempCaption);
		});
	}
	
	function setCaption(){
        var myCaption = $(data).find("page").eq(currentPage).find('caption').text();
		
        if(hasPop == true || largeImg != ""){
	    	$('<div id="centerMe" style="position: relative; float: left; height:'+ $("#mediaPop").height()+ 'px; width:'+ $("#mediaPop").width()+ 'px;">&nbsp;</div>').insertAfter("#myImgList");
	    	$('<div id="caption">'+myCaption+'</div>').insertAfter("#centerMe");
	    }else{
	    	$('<div id="caption">'+myCaption+'</div>').insertAfter("#loader");
	    }
       
		/***********************************************************
		CREATES A TOOLTIP on .tooltip class members.
		***********************************************************/
		$(".toolTip").each(function(){
			$(this).tooltip({
				content: $(this).attr("title")
			})
		})

		if(transition == true){
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
					},
					focus: function (event){
						cachedTextPreEdit = event.editor.getData();
					}
				},
				toolbar: captionToolbar,
				toolbarGroups :captionToolgroup,
				extraPlugins: 'sourcedialog',
				enterMode : CKEDITOR.ENTER_BR,
				shiftEnterMode: CKEDITOR.ENTER_P
			});
			
			$("<div id='imgEdit' class='btn_edit_media' title='Edit Media'></div>").insertBefore($("#loader"));
			
			//Establish it's functionality
			$("#imgEdit").click(function(){
				var msg = "<div id='imgDialog' title='Input Media Path'>";
				msg += "<label id='label'>file name: </label>";
				msg += "<input id='imgPath' class='dialogInput' type='text' value="+ mediaLink + " defaultValue="+ mediaLink + " style='width:70%;'/>";
				msg += "<br/>";
				msg += "<label id='label'>large version: </label>";
				msg += "<input id='isEnlargeable' type='checkbox' name='enableLargeIgm' class='radio' value='true'/>";
				msg += "<input id='lrgImgPath' class='dialogInput' type='text' value="+ mediaLink + " defaultValue="+ mediaLink + " style='width:70%;'/>";
            	msg += "<label id='label'>ALT text: </label>";
            	msg += "<input id='altTextEdit' class='dialogInput' type='text' value='"+altText+"' defaultValue='"+altText+"' style='width:70%'/>";
            	msg += "<br/><br/></div>";
            	$("#stage").append(msg);
                	
                if(largeImg == ""){
					$("#isEnlargeable").removeAttr('checked');
				}else{
					$("#isEnlargeable").attr('checked', 'checked');
				}
				
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
			    //var favoriteTypes = ["mp4", "swf", "jpg", "png", "html", "gif", "jpeg", "mp3"];
	            //if (favoriteTypes.indexOf(myExt.toLowerCase() >= 0)) {
				if(myExt == "mp4" || myExt == "jpg" || myExt == "gif" || myExt == "png" || myExt == "PNG" || myExt == "JPG" || myExt == "jpeg" || myExt == "mp3" || myExt == "MP3" || myExt == "swf" || myExt == "svg" || myExt == "SVG"){	
					if(event.success == true){
						if(myExt == "mp3" || myExt == "MP3"){
							launchAudioDialog(myFile, true)
						}else{
							saveImageEdit(myFile, true);
						}
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
					$("#mediaLoader").remove();
				}else if(myExt == "zip" || myExt == "ZIP"){
					$("#mediaLoaderText").empty();
					$("#mediaLoaderText").append("Your zip file is now being unzipped into your media folder.");
					cognizenSocket.on('unzipComplete', unzipComplete);			
				}else{
					$("#mediaLoaderText").empty();
					$("#mediaLoaderText").append("The file format that you upladed can't be played in most browsers. Not to fear though - we are converting it to a compatibile format for you!<br/><br/>Larger files may take a few moments.<br/><br/>");
					$("#mediaLoaderText").append("<div id='conversionProgress'><div class='progress-label'>Converting...</div></div>");
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
				}
			});
			
			siofu.addEventListener("start", function(event){
				var myFile = event.file.name;
				var myExt = getExtension(myFile);
				if(myExt.toLowerCase() == "mp3" || myExt.toLowerCase() == "wav" || myExt.toLowerCase() == "ogg" || myExt.toLowerCase() == "aiff" || myExt.toLowerCase() == "m4a" || myExt.toLowerCase() == "wma"){
					try { $("#audioDrop").tooltip("destroy"); } catch (e) {}
					if (type != "top" && type != "bottom"){
						$("#stage").append("<div id='mediaLoader' class='mediaLoader'></div>");
					}else{
						$("#contentHolder").append("<div id='mediaLoader' class='mediaLoader'></div>");
					}
				}else{
					$("#loader").append("<div id='mediaLoader' class='mediaLoader'></div>");
					$("#mediaLoader").css({'position':'absolute', 'margin-left': 'auto', 'margin-right':'auto', 'height': $("#loader").height(), 'width': $("#loader").width(), 'top': "0px"});
					$("#mediaLoader").append("<div id='mediaLoaderText'>Please Wait.<br/><br/>Your media is being uploaded to the server.<br/><br/>Larger files may take a few moments.</div>");
					$("#mediaLoaderText").css({'position':'absolute', 'height': $("#loader").height(), 'width': $("#loader").width()});
					
					try { $("#loader").tooltip("destroy"); } catch (e) {}
				}
			});
        }
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
		$("#mediaLoader").remove();
		cognizenSocket.removeListener("unzipComplete", unzipComplete);
		var msg = "<div id='zipUploadCompleteDialog' title='Input Audio Path'>";
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
		}else if(type == "mp3"){
			launchAudioDialog(mediaPath, true);
		}
		$("#mediaLoader").remove();
	}
	
	/**********************************************************************
     **Save Content Edit - save updated content text to content.xml
     **********************************************************************/
    function saveCaptionEdit(_data){
        var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
        var newCDATA=docu.createCDATASection(_data);
        $(data).find("page").eq(currentPage).find("caption").first().empty();
        $(data).find("page").eq(currentPage).find("caption").first().append(newCDATA);
        sendUpdate();
    };
    
	/**********************************************************************
     **Save Image Edit
     **********************************************************************/
	function saveImageEdit(_path, fromDrop){
		fromDrop = typeof fromDrop !== 'undefined' ? fromDrop : false;
		
		$(data).find("page").eq(currentPage).attr("alt", $("#altTextEdit").val());
		
		//Check if there is an enlarged image to link
		if($("#isEnlargeable").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("enlarge", $("#lrgImgPath").val());
		}else{
			$(data).find("page").eq(currentPage).attr("enlarge", "");
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
				captionString += CKEDITOR.instances[captionEditText_arr[i]].getData();
				altString += $("#altEditText"+$("#"+galleryEdit_arr[i]).attr('value')).val();
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

		mediaType = getExtension(imgPath);
		  
		if(mediaType == "mp4"){
			$(data).find("page").eq(currentPage).attr("img", imgPath);
			$("#loader").append("<div id='videoDialog' title='Input Video Stats'><div>Video Width: <input id='videoWidth' type='text' value="+ mediaWidth + " defaultValue="+ mediaWidth + " style='width:100%;'/></div><div>Video Height: <input id='videoHeight' type='text' value="+ mediaHeight + " defaultValue="+ mediaHeight + " style='width:100%;'/></div><input id='autoplay' type='checkbox' name='autoplay' class='radio' value='true'/><label id='label'>autoplay</label></input><input id='autonext' type='checkbox' name='autonext' class='radio' value='true'/><label id='label'>autonext</label></input><input id='poster' type='checkbox' name='hasPoster' class='radio' value='true'/><label id='label'>poster</label></input><input id='subs' type='checkbox' name='hasSubs' class='radio' value='true'/><label id='label'>subtitles</label></input></div>");
			 	
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
						$("#videoDialog").remove();
						sendUpdateWithRefresh();
						currentTemplate.fadeComplete();
					}
				});	
		}else if(mediaType == "swf"){
             //If its a swf we have to set it's width and height! - very imoprtant or shit get funky homey....
			 $(data).find("page").eq(currentPage).attr("img", imgPath);
			 $("#stage").append("<div id='swfDialog' title='Input SWF Stats'><div>SWF Width: <input id='swfWidth' type='text' value="+ 000 + " defaultValue="+ 000 + " style='width:100%;'/></div><div>SWF Height: <input id='swfHeight' type='text' value="+ 000 + " defaultValue="+ 000 + " style='width:100%;'/></div></div>");
			 $("#swfDialog").dialog({
                autoOpen: true,
				modal: true,
				buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
				close: function(){
					$(data).find("page").eq(currentPage).attr("w", $("#swfWidth").val());
					$(data).find("page").eq(currentPage).attr("h", $("#swfHeight").val());
					sendUpdateWithRefresh();
					currentTemplate.fadeComplete();
				}
			});
		}else if(mediaType == "jpg" || mediaType == "gif" || mediaType == "png" || mediaType == "jpeg" || mediaType == "JPG" || mediaType == "PNG" || mediaType == "GIF" || mediaType == "svg" || mediaType == "SVG"){
            $(data).find("page").eq(currentPage).attr("img", imgPath);
		}else if(mediaType == "html" || mediaType == "HTML" || mediatType == "htm" || mediaType == "HTM"){
			$(data).find("page").eq(currentPage).attr("img", imgPath);
			$("#stage").append("<div id='htmlDialog' title='Input Page Information'><div>HTML Width: <input id='htmlWidth' type='text' value="+ 000 + " defaultValue="+ 000 + " style='width:100%;'/></div><div>HTML Height: <input id='htmlHeight' type='text' value="+ 000 + " defaultValue="+ 000 + " style='width:100%;'/></div></div>");
			 $("#htmlDialog").dialog({
                autoOpen: true,
				modal: true,
				buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
				close: function(){
					$(data).find("page").eq(currentPage).attr("w", $("#htmlWidth").val());
					$(data).find("page").eq(currentPage).attr("h", $("#htmlHeight").val());
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
		msg += "<label id='label'>Media: </label><input id='imgPath" + _addID + "' class='dialogInput' type='text' value='"+media_arr[_addID]+"' defaultValue='"+media_arr[_addID]+"' style='width:80%;'/><br/>";
		msg += "<div>Caption:</div><div id='"+captionTextID+"' type='text' contenteditable='true' class='dialogInput'>"+caption_arr[_addID]+"</div>";
		msg += "<label id='label'>ALT text: </label>";
		msg += "<input id='"+altTextID+"' class='dialogInput' type='text' value='"+alt_arr[_addID]+"' defaultValue='"+alt_arr[_addID]+"' style='width:70%'/>";
		msg += "</div>"
		$("#imgDialog").append(msg);
								
		$("#" + removeID).click(function(){
			removeGalleryItem($(this).attr("value"));	
		});
		
		CKEDITOR.inline( captionTextID, {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog'
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
    
    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
    this.destroy = function (){
	    try { $("#loader").unbind(); } catch (e) {}
		try { cognizenSocket.removeListener('mediaConversionProgress', mediaConversionProgress); } catch (e) {}
		try { cognizenSocket.removeListener('mediaInfo', mediaInfo);} catch (e) {}
		try { cognizenSocket.removeListener('mediaConversionComplete', mediaConversionComplete); } catch (e) {}
		
		try { $("#swfDialog").remove(); } catch (e) {}

        try { $('#loader').flash().remove(); } catch (e) {}

		try { $("#mediaPop").remove(); } catch (e) {}
		try { $("#myImgList").remove(); } catch (e) {}
		try { $("#mediaLoader").remove(); } catch (e) {}
		
		try { $("#mediaHolder").remove(); } catch (e) {}
		try { $("#imgDialog").remove(); } catch (e) {}
		
		try { $("#myImgList").tooltip("destroy"); } catch (e) {}
		try { $("#loader").tooltip("destroy"); } catch (e) {}
    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}