function C_AudioHolder(){
	var type = $(data).find("page").eq(currentPage).attr('layout');
	var autoPlay = false;//Boolean: true - attached media plays on load.  false - user interaction required to play media.
    var autoNext = false;//Boolean: true - next page loads automatically upon media completion.  false - user interaction required to load the next page.
	var hasSubs = false;
	var subLinks = "";
	var myAudio = "null";
	var hasAudio = false;
	var audioShim = 0;
	
	//Check if the page has an associated audio file.
    if($(data).find("page").eq(currentPage).attr('audio') != undefined && $(data).find("page").eq(currentPage).attr('audio') != "null"){
        if($(data).find("page").eq(currentPage).attr('audio').length != 0){
            hasAudio = true;
            audioShim = 30;
            myAudio = $(data).find("page").eq(currentPage).attr('audio');
        }
    }else{
    	myAudio = "null";
    }

     //Populate Key Variables
    if($(data).find("page").eq(currentPage).attr('autonext') == "true"){
		autoNext = true;
	}

	if($(data).find("page").eq(currentPage).attr('autoplay') == "true"){
		autoPlay = true;
	}

    //check the xml for audio / if so, kick off audio code.
	if(hasAudio == true){
		$('#stage').append('<div id="audioCon"></div>');
        loadAudio();
	}

	if(mode == "edit"){
        /*******************************************************
		* Edit Audio
		********************************************************/
		if(dragFile == true && mode == 'edit'){
     		var contentId = urlParams['type'] + '_' + urlParams['id'];
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
     		$("#audioEdit").css({'position':'absolute', 'z-index': 9, 'bottom':30, 'right': 0});
		}else{
      		$("#audioEdit").css({'position':'absolute', 'z-index': 9, 'bottom':0, 'right': 0});
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
			launchAudioDialog(audioText, false);
		}).tooltip();

		siofu.addEventListener("complete", function(event){
			//checks to make sure the lessons prefs dialog or mediaDrop dialog are not open.
			//help files are uploaded through the lessons prefs dialog
			if($('#dialog-lessonPrefs').length == 0 && $('#dialog-mediaDrop').length == 0){
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
						}/*
	else{
							saveImageEdit(myFile, true);
						}
	*/
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

				}else{
					$(".C_LoaderText").empty();
					$(".C_LoaderText").append("The file format that you uploaded is not supported in most browsers. Not to fear though - we are converting it to a compatibile format for you!<br/><br/>Larger files may take a few moments.<br/><br/>");
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
				}
			}
		});

		siofu.addEventListener("start", function(event){
			var myFile = event.file.name;
			var myExt = getExtension(myFile);
			if(myExt.toLowerCase() == "mp3" || myExt.toLowerCase() == "wav" || myExt.toLowerCase() == "ogg" || myExt.toLowerCase() == "aiff" || myExt.toLowerCase() == "m4a" || myExt.toLowerCase() == "wma"){
				try { $("#audioDrop").tooltip("destroy"); } catch (e) {}
				$("#audioDrop").append("<div id='C_Loader' class='C_Loader'></div>");
			}
		});
    }

	/**********************************************************************
     **Load Audio Content from Link  -  creates audio player instance at bottom of stage.
     **********************************************************************/
    function loadAudio(){
        var audioString = "<audio id='audioPlayer' src='media/"+myAudio+ "' type='audio/mp3' controls='controls'>";

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

        if(isMobile){
            $('#audioPlayer').css({'width':stageW-1, 'height': 20});
        }
        else{
            $('#audioPlayer').css({'width':stageW, 'height': 20});
        }


        $('#audioPlayer').mediaelementplayer({
            success: function(player, node) {
            	// set global var audioPlayer (C_Engine.js) so it can be referenced in other files
            	audioPlayer = player;
				// set volume and mute from persistant variable
				player.setVolume(audioVolume);
				player.setMuted(audioMute);

				// update variables when the volume or mute changes
                player.addEventListener('volumechange', function(e) {
                	audioVolume = player.volume;
                	audioMute = player.muted;
                }, false);


                if(autoNext == true){
                    player.addEventListener('ended', function(e) {
                        hasEnded();
                    }, false);
                }
                if(autoPlay && !audioMute && (audioVolume > 0)){
                    player.play();
                }
            }
        });

		doAccess(pageAccess_arr);
    }
    ////////////END of loadAudio

    function launchAudioDialog(audioText, dragged){
		var msg = "<div id='audioEditDialog' title='Input Audio Path'>";
		msg += "<label id='label'>file name: </label>";
		msg += "<input id='audioPath' class='dialogInput' type='text' title='Name of the audio file.' value="+ audioText + " defaultValue="+ audioText + " style='width:70%;'/>";
		msg += "<button id='dialogMediaBrowseButton'>browse</button><br/>";
		msg += "<label id='label'>autoplay:</label>";
		msg += "<input id='autoplay' type='checkbox' name='autoplay' class='radio' value='true' title='Add/Remove Autoplay Functionality.'/></input><br/>";
		msg += "<label id='label'>autonext:</label>";
		msg += "<input id='autonext' type='checkbox' name='autonext' class='radio' value='true' title='Add/Remove Autonext Functionality.'/></input><br/>";
		msg += "<label id='label'>subtitle:</label>";
		msg += "<input id='subs' type='checkbox' name='hasSubs' class='radio' value='true' title='Add/Remove Subtitle Functionality.'/></input>";
		msg += "</div>";

		$("#stage").append(msg);

		if(hasSubs == true){
			$("#subs").attr("checked", "checked");
		}

		if(autoPlay == true){
			$("#autoplay").attr("checked", "checked");
		}

		if(autoNext == true){
			$("#autonext").attr("checked", "checked");
		}
		
		$("#dialogMediaBrowseButton").click(function(){
			$(".ui-dialog").hide();
			$(".ui-widget-overlay").hide();
			dialogToggleMediaBrowser($("#audioPath"));					
		});

		//Style it to jQuery UI dialog
		$("#audioEditDialog").dialog({
			autoOpen: true,
			dialogClass: "no-close",
			modal: true,
			width: 450,
			height: 400,
			buttons:[
				{
					text: "Cancel",
					title: "Cancel any changes.",
					click: function(){
						$(this).dialog("close");
					}
				},
				{
					text: "Done",
					title: "Saves and closes the edit dialog.",
					click: function(){
						saveAudioEdit();
					}
				}
			],
			close: function(){
				$(this).remove();
			}
		});
		//adds tooltips to the edit dialog buttons
	    $(function () {
	        $(document).tooltip();
	    });
	}

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
	   	if(fileType.toLowerCase() == "mp3" || audioPath == "" || audioPath == "null" || audioPath == " "){
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
	};    //////////////////////////////////////////////////////////////////////////////////////////////////END EDIT MODE

    //Function called on video complete if autoNext == true
    function hasEnded(){
        $('#next').click();
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

    function mediaConversionComplete(data){
		var splitPath = data.split("/");
		var last = splitPath.length;
		var mediaPath = splitPath[last-1];
		var splitType = splitPath[last-1].split(".");
		var type = splitType[splitType.length-1];
		if(type == "mp3"){
			launchAudioDialog(mediaPath, true);
		}
		$(".C_Loader").remove();
	}


	this.getHasAudio = function(){
		return hasAudio;
	}

	this.getAudioShim = function(){
		return audioShim;
	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.destroy = function(){
		try { siofu.destroy(); } catch (e) {}
		try { cognizenSocket.removeListener('mediaConversionProgress', mediaConversionProgress); } catch (e) {}
		try { cognizenSocket.removeListener('mediaInfo', mediaInfo);} catch (e) {}
		try { cognizenSocket.removeListener('mediaConversionComplete', mediaConversionComplete); } catch (e) {}

		try { $("#audioDrop").unbind(); } catch (e) {}
		try { $("#loader").unbind(); } catch (e) {}

		try { $("#audioEdit").remove(); } catch (e) {}
		try { $("#audioDialog").remove(); } catch (e) {}
		try { $("#audioDrop").remove(); } catch (e) {}

		try { $('#audioCon').remove(); } catch (e) {}
		try { $('#player').remove();} catch (e) {}
	}
	///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}