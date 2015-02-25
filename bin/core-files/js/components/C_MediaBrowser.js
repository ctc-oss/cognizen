/**
* Creates a media browser allowing users to view, preview and select content in the media folder as well as uploading to the server.
*
* @class MediaBrowser
* @constructor addMediaBrowser
*/

/**
* Defines whether the media browser is open or closed.
* 
* @property browserState
* @type {Boolean}
* @default "false"
*/
var mediaBrowserState = false;
/**
* Defines whether the media browser is displaying the root level.
* 
* @property browserRoot
* @type {Boolean}
* @default "true"
*/
var mediaBrowserRoot = true;
/**
* Defines the base media path.
* 
* @property mediaBrowserDisplayPath
* @type {String}
* @default "media/"
*/
var mediaBrowserDisplayPath = "media/";
/**
* Defines folder level depth.
* 
* @property dirDepth
* @type {Integer}
* @default "0"
*/
var dirDepth = 0;
/**
* Defines the relative path being displayed to users for the current folder.
* 
* @property relPath
* @type {String}
* @default ""
*/
var relPath = "";


/**
* Adds the MediaBrowser icon to the stage at the position assigned in the css.
*
* @method addMediaBrowser
*/
function addMediaBrowser(){
	$("#myCanvas").append("<div id='mediaBrowserPane' class='mediaBrowserPane'><div id='mediaBrowserButton' class='C_MediaBrowserButton' role='button' title='view media browser'></div></div>");
									
	$("#mediaBrowserButton").click(function(){							
		if(mediaBrowserState){
			$(this).removeClass('C_MediaBrowserButtonActive');
			mediaBrowserState = false;
		}else{
			$(this).addClass('C_MediaBrowserButtonActive');
			mediaBrowserState = true;
		}
		toggleMediaBrowser();
	}).keypress(function(event) {
        var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
        if (chCode == 32 || chCode == 13){
	        $(this).click();
	    }
    });															
}

/**
* Method to open and close the mediaBrowser depending upon it's current state.
*
* @method toggleMediaBrowser
*/
function toggleMediaBrowser(){
	if(mediaBrowserState){
		//Tween transcript open then add text TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
		$("#mediaBrowserPane").append("<div id='mediaBrowserDisplay' class='mediaBrowserDisplay'></div>");
		var displayWidth = $(".mediaBrowserDisplay").css("max-width");
		var displayHeight = $(".mediaBrowserDisplay").css("max-height");
		TweenMax.to($('#mediaBrowserDisplay'), transitionLength, {css:{width: displayWidth, height: displayHeight}, ease:transitionType, onComplete: addDisplay});
	}else{
		//Tween transcript closed then remove text
		$("#mediaBrowserDisplay").empty();
		TweenMax.to($('#mediaBrowserDisplay'), transitionLength, {css:{width: 0, height: 0}, ease:transitionType, onComplete: removeMediaBrowserDisplay});
	}
}

/**
* After the media browser has animated open - add the file display.  Fired at end of toggleMediaBrowser tween
*
* @method addDisplay
*/
function addDisplay(){
	var msg = "<div id='mediaBrowserHeader' class='mediaBrowserHeader'>Media Browser</div>";
		msg += "<div id='mediaBrowserContent' class='mediaBrowserContent'>"
		msg += "<div id='mediaBrowserList' class='mediaBrowserList C_Loader'></div>";
		msg += "<div id='mediaBrowserPreview' class='mediaBrowserPreview'><div id='mediaBrowserPreviewMediaHolder' class='mediaBrowserPreviewMediaHolder'></div></div>";
		msg += "</div>";
	$("#mediaBrowserDisplay").append(msg);
	getMediaDir();
}

/**
* Node call to hit server and get list of files in the current directory
*
* @method getMediaDir
* @param {String} _dir Directory path to be parsed.
*/
function getMediaDir(_dir){
	if(_dir){
		//Get media directory sub folder.
		socket.emit('getMediaDir', _dir);
	}else{
		//Just get media folder
		socket.emit('getMediaDir', "");
	}
}

/**
* Return call from node.  Provides a list of files in the current directory and displays them on the screen.
*
* @method updateMediaBrowserDir
* @param {Object} _data List of files retruned from the server.
*/
function updateMediaBrowserDir(_data){
	$("#mediaBrowserList").removeClass('C_Loader');
	$("#mediaBrowserList").append("<div id='mediaBrowserDisplayPath' class='mediaBrowserDisplayPath'>"+mediaBrowserDisplayPath+"</div>");
	
	var res = mediaBrowserDisplayPath.split("/");
	
	//Add up a directory button if needed.
	if(res[res.length-2] != "media"){
		$("#mediaBrowserList").append("<div id='mediaBrowserUpDirectory' class='mediaBrowserUpDirectory' data='"+res[res.length-3]+"'>../"+res[res.length-3]+"</div>");
		$("#mediaBrowserUpDirectory").click(function(){
		   $("#mediaBrowserList").empty();
		   //update the path display string
		   var tempString_arr = mediaBrowserDisplayPath.split("/");
		   tempString_arr.pop();
		   tempString_arr.pop();
		   mediaBrowserDisplayPath = "";
		   for(var i = 0; i < tempString_arr.length; i++){
			   mediaBrowserDisplayPath += tempString_arr[i] + "/";
		   }
		   //rewrite the relative path
		   var tempRel = relPath.split("/");
		   tempRel.pop();
		   tempRel.pop();
		   relPath = "";
		   for(var j = 0; j < tempRel.length; j++){
			   relPath += tempRel[j] + "/";
		   }
		   //Load the new path
		   getMediaDir(relPath);
	   });
	}
	
	//Add directories
	for (var key in _data.dirs) {
	   var obj = _data.dirs[key];
	   var tempID = "folder"+key;
	   var msg = "<div id='"+tempID+"' class='mediaBrowserFolder' data-type='folder' data='"+obj+"'>"+obj+"</div>";
	   $("#mediaBrowserList").append(msg);
	   $("#"+tempID).click(function(){
		   $("#mediaBrowserList").addClass('C_Loader');
		   $("#mediaBrowserList").empty();
		   dirDepth++;
		   var addPath = $(this).attr('data') + "/";
		   relPath += addPath;
		   mediaBrowserDisplayPath += addPath;
		   getMediaDir(relPath);
	   });
	}
	
	//Add files
	for (var key in _data.files) {
	   var obj = _data.files[key];
	   var tempID = "file"+key;
	   var msg = "<div id='"+tempID+"' class='mediaBrowserFile' data-type='file' data='"+obj+"'>"+obj+"</div>";
	   $("#mediaBrowserList").append(msg);
	   $("#"+tempID).click(function(){
		   mediaBrowserPreviewFile($(this).attr('data'));
	   });
	}
}

/**
* Display the selected item in the preview pane when selected.
*
* @method mediaBrowserPreviewFile
* @param {String} _file File to be loaded and displayed.
*/
function mediaBrowserPreviewFile(_file){
	$("#mediaBrowserPreview").addClass("C_Loader");
	var imageTypes = ["png", "jpg", "gif"];
	var fp = mediaBrowserDisplayPath + _file;
	$("#mediaBrowserPreviewMediaHolder").empty();
	$("#mediaBrowserPreviewMediaHolder").css({'opacity':0});
	var myType = getFileType(_file);
	if(myType == "mp3"){
		mediaBrowserLoadAudioPreview(fp);
	}else if(myType == "mp4"){
		mediaBrowserLoadVideoPreview(fp);
	}else if(myType == "swf"){
		alert("I'm a swf")
		mediaBrowserLoadSWFPreview(fp);
	}else if(imageTypes.indexOf(myType) > -1) {
		mediaBrowserLoadImagePreview(fp);
	}else{
		alert("You can't preview this file type.");
	}
}

/**
* Finds the file type of an inputted file.
*
* @method getFileType
* @param {string} _file File to find the type of....
* @return {string} Returns a string in reference to the file type.
*/
function getFileType(_file){
	var fileSplit = _file.split(".");
    var mediaType = fileSplit[fileSplit.length - 1].toLowerCase();
	return mediaType;
}

/**
* Loads an audio preview.
*
* @method mediaBrowserLoadAudioPreview
* @param {string} _fp Path to the audio file to load.
*/
function mediaBrowserLoadAudioPreview(_fp){
	$("#mediaBrowserPreviewMediaHolder").append("<audio id='mb_audioplayer' src='"+_fp+ "' type='audio/mp3' controls='controls'></audio>");
	$('#mb_audioplayer').css({'width': 350, 'height': 20});

	$('#mb_audioplayer').mediaelementplayer({
        success: function(player, node) {
			
			// set volume and mute from persistant variable
			player.setVolume(audioVolume);
			player.setMuted(audioMute);

			// update variables when the volume or mute changes
            player.addEventListener('volumechange', function(e) {
            	audioVolume = player.volume;
            	audioMute = player.muted;
            }, false);
            
            player.addEventListener('loadeddata', function(e){
	            $("#mediaBrowserPreview").removeClass("C_Loader");
				TweenMax.to($('#mediaBrowserPreviewMediaHolder'), .5, {css:{opacity:1}, ease:transitionType});
            }, false);
            
            player.addEventListener('loadedmetadata', function(e){

            }, false);
        }
    });
}

/**
* Loads a video preview.
*
* @method mediaBrowserLoadVideoPreview
* @param {string} _fp Path to the video file to load.
*/
function mediaBrowserLoadVideoPreview(_fp){
    var vidHTMLString = "<video id='mb_videoplayer' controls='controls' preload='true'>";
    	vidHTMLString += "<source type='video/mp4' src='" + _fp + "'/>";
		vidHTMLString += "</video>";

    $("#mediaBrowserPreviewMediaHolder").append(vidHTMLString);
		
	// decent browser - prefer HTML5 video
	$('#mb_videoplayer').mediaelementplayer({
		enablePluginSmoothing: true,
		enableKeyboard: true,
		success: function(player, node){
			player.addEventListener('loadeddata', function(e) {
				//tween after loaded and positioned.
				$("#mediaBrowserPreview").removeClass("C_Loader");
				TweenMax.to($('#mediaBrowserPreviewMediaHolder'), .5, {css:{opacity:1}, ease:transitionType});
			}, false);
		}
	});
}

/**
* Loads a SWF preview.
*
* @method mediaBrowserLoadSWFPreview
* @param {string} _fp Path to the video file to load.
*/
function mediaBrowserLoadSWFPreview(_fp){
    $("#mediaBrowserPreviewMediaHolder").flash({swf:_fp,width:300,height:200});
    $("#mediaBrowserPreview").removeClass("C_Loader");
    TweenMax.to($('#mediaBrowserPreviewMediaHolder'), .5, {css:{opacity:1}, ease:transitionType});
}


/**
* Loads an image preview.
*
* @method mediaBrowserLoadImagePreview
* @param {string} _fp Path to the image file to load.
*/
function mediaBrowserLoadImagePreview(_fp){
	var img = new Image();

    $(img).bind('error', function() {
		alert("There was an error and your preview was unable to be loaded.")
	});

    $(img).load(function(){
	    $("#mediaBrowserPreview").removeClass("C_Loader");
        $("#mediaBrowserPreviewMediaHolder").append(img);
        var imageWidth = $(img).width();
        var imageHeight = $(img).height();
        TweenMax.to($('#mediaBrowserPreviewMediaHolder'), .5, {css:{opacity:1}, ease:transitionType});
    }).attr('src', _fp);
}

/**
* Removes the mediaBrowser display from the screen after closing in toggle.
*
* @method removeMediaBrowserDisplay
*/
function removeMediaBrowserDisplay(){
	$("#mediaBrowserDisplay").remove();
	relPath = "";
	mediaBrowserDisplayPath = "media/";
}
