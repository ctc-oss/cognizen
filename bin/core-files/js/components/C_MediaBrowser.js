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
* Variable to hold socket stream.
* 
* @type {String}
* @default ""
*/
var ss;
/**
* Variable to hold current preview menu item.
* 
* @type {Object}
*/
var currentSelectedMediaPreview;
/**
* Variable to hold if removeMedia button was clicked.
* 
* @type {Boolean}
*/
var removeClicked = false;
/**
* Variable representing scroll bar for lists.
*/
var listScroller;
/**
* Variable to hold folder track. Options are "media", "core", "course" and "lesson".
* 
* @type {String}
*/
var folderTrack = "media";
/**
* Variable to hold folder track path.
* 
* @type {String}
*/
var folderTrackPath = "./";

var currentSelectedTrack;
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
* Method to open and close different folders in the structure.
*
* @method updateFolderTrack
* @param _track {String} variable stating which folder has been opened.
*/
function updateFolderTrack(_track){
	currentSelectedTrack.removeClass("mediaBrowserSelectedTrack");
	folderTrack = _track.attr("data");
	currentSelectedTrack = _track;
	currentSelectedTrack.addClass("mediaBrowserSelectedTrack");
	if(folderTrack == "core"){
		folderTrackPath = "../..";
		mediaBrowserDisplayPath = "core-prog/"
	}else if(folderTrack == "course"){
		folderTrackPath = "../";
		mediaBrowserDisplayPath = "css/CourseCSS/"
	}else if(folderTrack == "lesson"){
		folderTrackPath = "./";
		mediaBrowserDisplayPath = "css/"
	}else{
		folderTrackPath = "./";
		mediaBrowserDisplayPath = "media/"
	}
	
	dirDepth = 0;
	relPath = "";
	
	getMediaDir();
}

/**
* After the media browser has animated open - add the file display.  Fired at end of toggleMediaBrowser tween
*
* @method addDisplay
*/
function addDisplay(){
	var msg = "<div id='mediaBrowserHeader' class='mediaBrowserHeader'>Media Browser<input id='file' type='file' /></div>";
		msg += "<div id='mediaBrowserContent' class='mediaBrowserContent'>";
		msg += "<div id='mediaBrowserDirectorySelectPalette' class='mediaBrowserDirectorySelectPalette'>";
		msg += "<div id='mediaButton' class='mediaBrowserDirectorySelectButton mediaBrowserSelectedTrack' data='media'>media</div>";
		msg += "<div id='coreprogButton' class='mediaBrowserDirectorySelectButton' data='core'>core-prog</div>";
		msg += "<div id='coursecssButton' class='mediaBrowserDirectorySelectButton' data='course'>course css</div>";
		msg += "<div id='lessoncssButton' class='mediaBrowserDirectorySelectButton' data='lesson'>lesson css</div>";
		msg += "</div>";
		msg += "<div id='mediaBrowserDisplayPath' class='mediaBrowserDisplayPath'>"+mediaBrowserDisplayPath+"</div>";
		msg += " <div class='box-wrap antiscroll-wrap'><div class='list-box'><div class='antiscroll-inner'><div id='mediaBrowserList' class='mediaBrowserList C_Loader'></div></div></div></div>";
		msg += "<div id='mediaBrowserPreview' class='mediaBrowserPreview'><div id='mediaBrowserPreviewMediaHolder' class='mediaBrowserPreviewMediaHolder'></div></div>";
		msg += "</div>";
	$("#mediaBrowserDisplay").append(msg);
	
	
	$("#mediaButton").click(function(){
		updateFolderTrack($(this));
	});
	
	$("#coreprogButton").click(function(){
		updateFolderTrack($(this));
	});
	
	$("#coursecssButton").click(function(){
		updateFolderTrack($(this));
	});
	
	$("#lessoncssButton").click(function(){
		updateFolderTrack($(this));
	});
	
	currentSelectedTrack = $("#mediaButton");
	
	listScroller = $('.box-wrap').antiscroll().data('antiscroll');
	
	$('#file').change(function(e) {
		cognizenSocket.on('mediaBrowserConversionStart', mediaBrowserConversionStart);
		cognizenSocket.on('mediaBrowserUploadComplete', mediaBrowserUploadComplete);
    	$("#mediaBrowserDisplay").append("<div id='C_Loader' class='C_Loader'><div class='C_LoaderText'>Uploading content.</div></div>");
    	$(".C_LoaderText").append("<div id='uploadProgress'><div class='progress-label'>Uploading...</div></div>");
		$("#uploadProgress").progressbar({
			value: 0,
			change: function() {
				$(".progress-label").text($("#uploadProgress").progressbar("value") + "%");
			},
			complete: function() {
				$(".progress-label").text("Complete!");
			}
		});

		$("#uploadProgress > div").css({ 'background': '#3383bb'});
		
    	var file = e.target.files[0];
		var stream = ss.createStream();
		ss(cognizenSocket).emit('upload-media', stream, {size: file.size, name: file.name, id: urlParams['id'], type: urlParams['type'], path: relPath, track: folderTrack});
		var blobStream = ss.createBlobReadStream(file);
		var size = 0;
		blobStream.on('data', function(chunk) {
			size += chunk.length;
			$("#uploadProgress").progressbar("value", Math.floor(size / file.size * 100))
		});
		blobStream.pipe(stream);
	});
	
	getMediaDir();
}

/**
* Node call to hit server and get list of files in the current directory
*
* @method getMediaDir
* @param {String} _dir Directory path to be parsed.
*/
function getMediaDir(_dir){
	$("#mediaBrowserList").empty();
	console.log("_dir = " + _dir);
	if(_dir){
		//Get media directory sub folder.
		
		socket.emit('getMediaDir',  {loc: folderTrack, path: _dir});
	}else{
		//Just get media folder
		socket.emit('getMediaDir', {loc: folderTrack, path: ""});
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
	$("#mediaBrowserDisplayPath").text(mediaBrowserDisplayPath);
	var res = mediaBrowserDisplayPath.split("/");
	console.log(res);
	//Add "up a directory" (../media) button if needed.
	if(res[res.length-2] != "media" && res[res.length-2] != "core-prog" && res[res.length-2] != "CourseCSS" && res[res.length-2] != "ModuleCSS"){
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
	
	//Add files display
	for (var key in _data.files) {
	   var obj = _data.files[key];
	   var tempID = "file"+key;
	   var msg = "<div id='"+tempID+"' class='mediaBrowserFile' data-type='file' data='"+obj+"'>"+obj+"<a  target='_blank' href=./media/"+relPath+obj+ " download id='downloadMedia' class='mediaDownload' title='download this item'></a><div id='mediaRemove' class='mediaRemove' title='delete this item'></div></div>";
	   $("#mediaBrowserList").append(msg);
	   
	   $("#"+tempID).find(".mediaRemove").click(function(){
			removeClicked = true;
			var myItem = relPath + $(this).parent().attr('data');	
			checkRemoveMedia(myItem);	   
	   });
	   
	   $("#"+tempID).find(".mediaDownload").click(function(){
			removeClicked = true;
			var myItem = relPath + $(this).parent().attr('data');	
			//downloadMedia(myItem);	   
	   });
	   
	   $("#"+tempID).click(function(){
			if(removeClicked){
				removeClicked = false;
			}else{
		   		try { currentSelectedMediaPreview.removeClass("mediaBrowserFileSelected"); } catch (e) {}
		   		currentSelectedMediaPreview = $(this);
		   		currentSelectedMediaPreview.addClass("mediaBrowserFileSelected");
		   		//var transitionEnd = transitionEndEventName();
		   		//currentSelectedMediaPreview.addEventListener(transitionEnd, callfunction, false);
		   		currentSelectedMediaPreview.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', callfunction);
		   		mediaBrowserPreviewFile($(this).attr('data'));
			}
	   });
	}
	listScroller.refresh();
}

/**
* Function to disable currently selected media item preview.
* 
* @type {Event}
*/
function callfunction(event){
	currentSelectedMediaPreview.off(event);
	//alert("trans end");
}

/**
* Variable to hold if removeMedia button was clicked.
* 
* @param _file {String} - file name
*/
function downloadMedia(_file){
	cognizenSocket.emit('mediaBrowserDownloadMedia', {file: _file, type: urlParams['type'], id: urlParams['id']});
}

/**
* Launch Dialog to confirm removal of media.
*
* @method checkRemoveMedia
* @param {String} server path and name of file to be removed.
*/
function checkRemoveMedia(_file){
	//Create the Dialog
	$("#stage").append("<div id='dialog-removePage' title='Remove Media Object'><p>Are you sure that you want to remove " + _file + " from this project?</p></div>");
	//Style it to jQuery UI dialog
	$("#dialog-removePage").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
			$("dialog-removePage").remove();
		},
		buttons: {
			Yes: function(){
				removeMedia(_file);
				$( this ).dialog( "close" );
			},
			No: function(){
				$( this ).dialog( "close" );
			}
		}
	});
}

/**
* Function to remove selected media.
* 
* @method removeMedia
* @param _file {Boolean} path to file to remove
*/
function removeMedia(_file){
	cognizenSocket.on('mediaBrowserRemoveMediaComplete', mediaBrowserRemoveMediaComplete);
	$("#mediaBrowserList").addClass('C_Loader');
	$("#mediaBrowserList").empty();
	$("#mediaBrowserPreviewMediaHolder").empty();

	cognizenSocket.emit('mediaBrowserRemoveMedia', {file: _file, type: urlParams['type'], id: urlParams['id'], track: folderTrack});
}

/**
* Function to to update once removal of media is complete.
* 
* @method mediaBrowserRemoveMediaComplete
*/
function mediaBrowserRemoveMediaComplete(){
	$("#mediaBrowserList").removeClass('C_Loader');
	try { cognizenSocket.removeListener('mediaBrowserRemoveMediaComplete', mediaBrowserRemoveMediaComplete); } catch (e) {}
	//Commit GIT when complete.
	var urlParams = queryStringParameters();
	cognizenSocket.emit('contentSaved', {
        content: {type: urlParams['type'], id: urlParams['id']},
        user: {id: urlParams['u']}
    });
    getMediaDir(relPath);
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
	var fp = folderTrackPath + "/" + mediaBrowserDisplayPath + _file;
	$("#mediaBrowserPreviewMediaHolder").empty();
	$("#mediaBrowserPreviewMediaHolder").css({'opacity':0});
	var myType = getFileType(_file);
	if(myType == "mp3"){
		mediaBrowserLoadAudioPreview(fp);
	}else if(myType == "mp4"){
		mediaBrowserLoadVideoPreview(fp);
	}else if(myType == "swf"){
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
* Called when media upload is complete but a media conversion is required.
*
* @method mediaBrowserConversionStart
*/
function mediaBrowserConversionStart(data){
	//$("#C_Loader").remove();
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

	cognizenSocket.on('mediaBrowserConversionProgress', mediaBrowserConversionProgress);
	cognizenSocket.on('mediaInfo', mediaInfo);
}

/**
* Called when mediaConversion progress updates are recieved
*
* @method mediaBrowserConversionProgress
* @param {object} data regarding converted file.
*/
function mediaBrowserConversionProgress(data){
    $("#conversionProgress").progressbar("value", Math.floor(data.percent))
}

/**
* Called when mediaConversion is complete
*
* @method mediaBrowserUploadComplete
* @param {object} data regarding converted file.
*/
function mediaBrowserUploadComplete(data){
	$("#C_Loader").remove();
	try { cognizenSocket.removeListener('mediaBrowserConversionProgress', mediaBrowserConversionProgress); } catch (e) {}
	try { cognizenSocket.removeListener('mediaInfo', mediaInfo);} catch (e) {}
	try { cognizenSocket.removeListener('mediaBrowserUploadComplete', mediaBrowserUploadComplete); } catch (e) {}
	var splitPath = data.split("/");
	var last = splitPath.length;
	var mediaPath = splitPath[last-1];
	mediaBrowserPreviewFile(mediaPath);
	//Commit GIT when complete.
	var urlParams = queryStringParameters();
	cognizenSocket.emit('contentSaved', {
        content: {type: urlParams['type'], id: urlParams['id']},
        user: {id: urlParams['u']}
    });
    getMediaDir(relPath);
}

/**
* Called when mediaInfo object is recieved upon loading media item
*
* @method mediaInfo
* @param data {object} data regarding selected file.
*/
function mediaInfo(data){
	if(data.video != ""){
		var splitDim = data.video_details[2].split("x");
		var mediaWidth = splitDim[0];
		var mediaHeight = splitDim[1];
	}
}

/**
* Removes the mediaBrowser display from the screen after closing in toggle.
*
* @method removeMediaBrowserDisplay
*/
function removeMediaBrowserDisplay(){
	try { cognizenSocket.removeListener('mediaBrowserConversionProgress', mediaBrowserConversionProgress); } catch (e) {}
	try { cognizenSocket.removeListener('mediaInfo', mediaInfo);} catch (e) {}
	try { cognizenSocket.removeListener('mediaBrowserUploadComplete', mediaBrowserUploadComplete); } catch (e) {}
	$("#mediaBrowserDisplay").remove();
	relPath = "";
	mediaBrowserDisplayPath = "media/";
	folderTrack = "media";
}
