/*!
 * C_LessonTitle
 * This class creates a template for a all non-Interactive content (text/images/swfs).
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: Version 1.0
 * DATE: 2013-10-10
 * JavaScript
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_LessonTitle(_type) {

    this.myPageTitle;//Title of this page.
    this.myContent;//Body
    var stageW = $("#stage").width();
    var stageH = $("#stage").height();
    var myAudio;
	var autoPlay = false;//Boolean: true - attached media plays on load.  false - user interaction required to play media.  
	var autoNext = false;//Boolean: true - next page loads automatically upon media completion.  false - user interaction required to load the next page.
	var hasAudio = false;
	var audioShim = 0;
    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    INITIALIZE AND BUILD TEMPLATE
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.initialize = function(){
    	//transition variable in C_Engine - set in content.xml
        if(transition == true){
        	$('#stage').css({'opacity':0.1});
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

        /*****************************************
        **Set template variables.
        *****************************************/

        //Page title value from content.xml
        myPageTitle = $(data).find("page").eq(currentPage).find('title').first().text();

        //Position the page text
        myContent = $(data).find("page").eq(currentPage).find("content").first().text();
        
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
    function buildTemplate() {
	   
        //Add the divs for the page title adn the content divs.
        $('#stage').append('<div id="pageTitle" class="lesson"></div>');
        $("#pageTitle").append(myPageTitle);

        //Add classes for page layouts - updatable in css
        $('#stage').append('<div id="content" class="lessonCon"></div>');

        $("#content").append(myContent);
		
		 if(hasAudio == true){
            $('#stage').append('<div id="audioCon"></div>');
            loadAudio();
        }
        
        if(transition == true){
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
        }else{
        	checkMode();
        }
    }

    /*****************************************************************************************************************************************************************************************************************
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     PAGE EDIT FUNCTIONALITY
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     *****************************************************************************************************************************************************************************************************************/
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

			
            $('#stage').append("<div id='conEdit' class='btn_edit_text' title='Edit Text Content'></div>");
			$("#conEdit").css({'position':'absolute', 'top':$("#content").position().top - 18, 'left': $("#content").position().left + $("#content").width() - 18});

			$("#conEdit").click(function(){

                //Create the Content Edit Dialog
				$("#stage").append("<div id='contentEditDialog' title='Input Page Content'><div id='contentEditText' type='text' style='width:" + $('#content').width() + "; height:85%' >" + myContent + "</div>");

				var myHeight;

				if($("#content").height() < 300){
					myHeight = 350;
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
	     	
	     	siofu.addEventListener("complete", function(event){
				siofu.removeEventListener("complete");
				siofu.removeEventListener("load");
				//if successful upload, else....
									
				var myFile = event.file.name;
				var myExt = getExtension(myFile);
				if(myExt == "mp3" || myExt == "MP3"){	
					if(event.success == true){
						launchAudioDialog(myFile, true)
					}
				}else{										
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
					$("#stage").append("<div id='mediaLoader' class='mediaLoader'></div>");
					$("#mediaLoader").css({'position':'absolute', 'top': $("#audioDrop").position().top, 'left': $("#audioDrop").position().left, 'height': $("#audioDrop").height(), 'width': $("#audioDrop").width()});
				}
			}); 
		     	
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
				launchAudioDialog(audioText, false);
			}).tooltip();
		}
		$(this).scrubContent();	
	}
	
	function mediaConversionProgress(data){
		//$("#conversionProgress").progressbar("value", Math.floor(data.percent))
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
		if(type == "mp4"){
			saveImageEdit(mediaPath, true);
		}else if(type == "mp3"){
			launchAudioDialog(mediaPath, true);
		}
		$("#mediaLoader").remove();
		
	}
	
	function launchAudioDialog(audioText, dragged){
		var msg = "<div id='audioEditDialog' title='Input Audio Path'>";
		msg += "<div id='audioEditDialog' title='Input Audio Path'><input id='audioPath' type='text' value="+ audioText + " defaultValue="+ audioText + " style='width:100%;'/>";
		msg += "<input id='autoplay' type='checkbox' name='autoplay' class='radio' value='true'/><label id='label'>autoplay</label></input>";
		msg += "<input id='autonext' type='checkbox' name='autonext' class='radio' value='true'/><label id='label'>autonext</label></input>";
		msg += "<input id='subs' type='checkbox' name='hasSubs' class='radio' value='true'/><label id='label'>subtitles</label></input>";
		msg += "</div>";
								
		$("#stage").append(msg);
		if(dragged == false){		
			if(hasSubs == true){
				$("#subs").attr("checked", "checked");
			}
								
			if(autoPlay == true){
				$("#autoplay").prop("checked", "checked");
			}
								
			if(autoNext == true){
				$("#autonext").prop("checked", "checked");
			}
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
	   	$(data).find("page").eq(currentPage).find("title").first().empty();
	   	$(data).find("page").eq(currentPage).find("title").first().append(newCDATA);
	   	$("#titleDialog").remove();
	   	sendUpdateWithRefresh();
	};

    /**********************************************************************
     **Save Content Edit - save updated content text to content.xml
     **********************************************************************/
    function saveContentEdit(){
        //Grab the updated text from redactor.
        var contentUpdate = $("#contentEditText").getCode();
        //We create an xml doc - add the contentUpdate into a CDATA Section
        var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
        var newCDATA=docu.createCDATASection(contentUpdate);
        //Now, destroy redactor.
        $("#content").html(contentUpdate);
        myContent = contentUpdate;
        $("#contentEditText").destroyEditor();
        //Update the local xml - first clearning the content node and then updating it with out newCDATA
        $(data).find("page").eq(currentPage).find("content").first().empty();
        $(data).find("page").eq(currentPage).find("content").first().append(newCDATA);
        $("#contentEditDialog").remove();
        sendUpdate();
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
            if(audioPath == "yourFile.mp3" || audioPath == "" || audioPath == "null" || audioPath == " "){
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

	function fadeComplete() {	
        $('#pageTitle').remove();
	   	$('#content').remove();
		$("#titleEdit").remove();
		$("#titleDialog").remove();
		$("#conEdit").remove();
		$("#contentEditDialog").remove();
		
		if(hasAudio == true){
	    	$('#audioCon').remove();
	    	$('#player').remove();
	    }
	    $("#audioDialog").remove();
		
		$("#audioEdit").remove();
		if(mode == "edit" && dragFile == true){
		  	
			siofu.destroy();
			$("#audioDrop").unbind();
			cognizenSocket.removeListener('mediaConversionProgress', mediaConversionProgress);
			cognizenSocket.removeListener('mediaInfo', mediaInfo);
			cognizenSocket.removeListener('mediaConversionComplete', mediaConversionComplete);
			
		}
		$("#audioDrop").remove();
		
		$("#mediaLoader").remove();
		
		loadPage();
    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}
