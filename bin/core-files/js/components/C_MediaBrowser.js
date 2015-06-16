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
/**
* Variable to hold folder track label.
* 
* @type {String}
*/
var currentSelectedTrack;
var queue;
var queueLength;
var queueCurrent = 0;
/**
* Adds the MediaBrowser icon to the stage at the position assigned in the css.
*
* @method addMediaBrowser
*/
function addMediaBrowser(){
	$("#myCanvas").append("<div id='mediaBrowserPane' class='mediaBrowserPane'><div id='mediaBrowserButton' class='C_MediaBrowserButton' role='button' title='view media browser'></div></div>").tooltip();
									
	$("#mediaBrowserButton").click(function(){							
		
		toggleMediaBrowser();
	}).keypress(function(event) {
        var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
        if (chCode == 32 || chCode == 13){
	        $(this).click();
	    }
    });															
}

var fromDialog = false;
var fileTarget = null;

//function dialogToggleMediaBrowser(){
this.dialogToggleMediaBrowser = function(_target){
	fromDialog = true;
	fileTarget = _target;
	toggleMediaBrowser();
}

/**
* Method to open and close the mediaBrowser depending upon it's current state.
*
* @method toggleMediaBrowser
*/
function toggleMediaBrowser(){
	if(mediaBrowserState){
		$("#mediaBrowserButton").removeClass('C_MediaBrowserButtonActive');
		mediaBrowserState = false;
	}else{
		$("#mediaBrowserButton").addClass('C_MediaBrowserButtonActive');
		mediaBrowserState = true;
	}
	
	if(mediaBrowserState){
		$("#mediaBrowserPane").append("<div id='mediaBrowserDisplay' class='mediaBrowserDisplay'></div>");
		var displayWidth = $(".mediaBrowserDisplay").css("max-width");
		var displayHeight = $(".mediaBrowserDisplay").css("max-height");
		TweenMax.to($('#mediaBrowserDisplay'), transitionLength, {css:{width: displayWidth, height: displayHeight}, ease:transitionType, onComplete: addDisplay});
	}else{
		//Tween transcript closed then remove text
		$("#mediaBrowserDisplay").empty();
		TweenMax.to($('#mediaBrowserDisplay'), transitionLength, {css:{width: 0, height: 0}, ease:transitionType, onComplete: removeMediaBrowserDisplay});
		if(fromDialog){
			fromDialog = false;
			$(".ui-dialog").show();
			$(".ui-widget-overlay").show();
		}
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
		folderTrackPath = "../../";
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
	var msg = "<div id='mediaBrowserHeader' class='mediaBrowserHeader'>Media Browser";
			msg += "<div id='mediaBrowserClose' class='mediaBrowserClose'></div>";
		msg += "</div>";
		msg += "<div id='mediaBrowserContent' class='mediaBrowserContent'>";
			msg += "<div id='mediaBrowserDirectorySelectPalette' class='mediaBrowserDirectorySelectPalette'>";
				msg += "<div id='mediaButton' class='mediaBrowserDirectorySelectButton mediaBrowserSelectedTrack' data='media'>media</div>";
				msg += "<div id='coreprogButton' class='mediaBrowserDirectorySelectButton' data='core'>core-prog</div>";
				msg += "<div id='coursecssButton' class='mediaBrowserDirectorySelectButton' data='course'>course css</div>";
				msg += "<div id='lessoncssButton' class='mediaBrowserDirectorySelectButton' data='lesson'>lesson css</div>";
			msg += "</div>";
			msg += "<div id='mediaBrowserDisplayPath' class='mediaBrowserDisplayPath'>"+mediaBrowserDisplayPath+"</div>";
			msg += "<div class='box-wrap antiscroll-wrap'>";
				msg += "<div class='list-box'>";
					msg += "<div class='antiscroll-inner'>";
						msg += "<div id='mediaBrowserList' class='mediaBrowserList C_Loader'></div>";
					msg += "</div>";
				msg += "</div>";
			msg += "</div>";
			msg += "<div id='mediaBrowserPreview' class='mediaBrowserPreview'>";
				msg += "<div id='mediaBrowserUploadWidget' class='mediaBrowserUploadWidget'>";
					msg += "<strong>UPLOAD WIDGET:</strong>";
					msg += "<input id='file' type='file' multiple='multiple'/>";
					if (window.File && window.FileList && window.FileReader) {
						msg += "or drag (multiple) files to this window.";
					}
				msg += "</div>";
				msg += "<div id='mediaBrowserPreviewMediaHolder' class='mediaBrowserPreviewMediaHolder'></div>";
			msg += "</div>";
		msg += "</div>";
	$("#mediaBrowserDisplay").append(msg);
	
	$("#mediaBrowserClose").click(function(){
		toggleMediaBrowser();
	});
	
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
	
	if (window.File && window.FileList && window.FileReader) {
		// file drop
		$("#mediaBrowserDisplay").on("dragover", FileDragHover);
		$("#mediaBrowserDisplay").on("dragleave", FileDragLeave);
		$("#mediaBrowserDisplay").on("drop", FileSelectHandler);
	}
	
	currentSelectedTrack = $("#mediaButton");
	
	listScroller = $('.box-wrap').antiscroll().data('antiscroll');
	
	$('#file').change(function(e) {
		try { cognizenSocket.removeListener('mediaBrowserConversionProgress', mediaBrowserConversionProgress); } catch (e) {}
		try { cognizenSocket.removeListener('mediaInfo', mediaInfo);} catch (e) {}

    	queueFileUpload(e.target.files);
	});
	
	getMediaDir();
}

function FileDragHover(e){
	e.preventDefault();
    e.stopPropagation();
}

function FileDragLeave(e){
	e.preventDefault();
    e.stopPropagation();
}

// file selection
function FileSelectHandler(e) {
	if(e.originalEvent.dataTransfer){
		if(e.originalEvent.dataTransfer.files.length) {
			e.preventDefault();
			e.stopPropagation();
			/*UPLOAD FILES HERE*/
			queueFileUpload(e.originalEvent.dataTransfer.files);
		}
	}
}

function queueFileUpload(_fl){
	queue = _fl;
	queueLength = _fl.length;
	queueCurrent = 0;
	uploadFile(queue[queueCurrent]);
}

/**
* Node call to hit server and get list of files in the current directory
*
* @method uploadFile
* @param _files File to be uploaded.
*/
function uploadFile(_file){
	cognizenSocket.on('mediaBrowserConversionStart', mediaBrowserConversionStart);
	cognizenSocket.on('mediaBrowserUploadComplete', mediaBrowserUploadComplete);
	$("#mediaBrowserDisplay").append("<div id='C_Loader' class='C_Loader'><div class='C_LoaderText'>Uploading content:<br/><strong>name: </strong>" + _file.name+ "<br/><strong>size:</strong> "+ _file.size + "<br/><strong>type:</strong> "+_file.type+"</div></div>");
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
	
	var file = _file;
	var stream = ss.createStream(/* {hightWaterMark: 16 * 1024} */);
	ss(cognizenSocket).emit('upload-media', stream, {size: file.size, name: file.name, id: urlParams['id'], type: urlParams['type'], path: relPath, track: folderTrack});
	var blobStream = ss.createBlobReadStream(file/* , {hightWaterMark: 16 * 1024} */);
	var size = 0;
	blobStream.on('data', function(chunk) {
		size += chunk.length;
		$("#uploadProgress").progressbar("value", Math.floor(size / file.size * 100))
	});
	blobStream.pipe(stream);
}

/**
* Node call to hit server and get list of files in the current directory
*
* @method getMediaDir
* @param {String} _dir Directory path to be parsed.
*/
function getMediaDir(_dir){
	$("#mediaBrowserList").empty();
	
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
	//Add "up a directory" (../media) button if needed.
	var directoryUp = true;
	
	//Define when NOT to show ../folder
	if(res[res.length-2] == "media" && folderTrack == "media"){
		directoryUp = false;
	}else if(res[res.length-2] == "core-prog"){
		directoryUp = false;
	}else if(res[res.length-2] == "CourseCSS"){
		directoryUp = false;
	}else if(res[res.length-3] == undefined){
		directoryUp = false;
	}
	
	if(directoryUp){
		var myLabel = res[res.length-3];
		$("#mediaBrowserList").append("<div id='mediaBrowserUpDirectory' class='mediaBrowserUpDirectory' data='"+myLabel+"'>../"+myLabel+"</div>");
		
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
	   var msg = "<div id='"+tempID+"' class='mediaBrowserFile' data-type='file' data='"+obj+"'>"+obj+"</div>";
	   $("#mediaBrowserList").append(msg);
	   
	   $("#"+tempID).click(function(){
			loadMedia($(this));
	   });
	}
	listScroller.refresh();
}

/**
* Function to animate button and call function to load selected button's media.
* @method loadMedia
* @type {Event}
* @param _me the button that has been selected.
*/
function loadMedia(_me){
	if(removeClicked){
		removeClicked = false;
	}else{
		try { $("#mbItemControlHolder").remove();} catch (e) {}
		try { currentSelectedMediaPreview.removeClass("mediaBrowserFileSelected"); } catch (e) {}
		//turn last item back on...
		try { currentSelectedMediaPreview.on("click", function(){
			loadMedia($(this));
		}); } catch (e) {}
		currentSelectedMediaPreview = _me;
		currentSelectedMediaPreview.addClass("mediaBrowserFileSelected");
		showItemStats();
		mediaBrowserPreviewFile(_me.attr('data'));
	}
}

/**
* Function to disable currently selected media item button and display stats and options for that media item.
* @method showItemStats
* @type {Event}
*/
function showItemStats(){
	var obj = currentSelectedMediaPreview.attr("data");
	//Disable button action for selected media
	currentSelectedMediaPreview.off('click');

	var msg = "<div id='mbItemControlHolder' class='mbItemControlHolder'>";
		msg += "<a  target='_blank' href=" + folderTrackPath + mediaBrowserDisplayPath +obj+ " download id='downloadMedia' class='mediaDownload' title='download this item'></a>";
		msg += "<div id='mediaRemove' class='mediaRemove' title='delete this item'></div>";
		if(fromDialog){
			msg += "<div id='mediaSelect' class='mediaSelect' title='select this media object'></div>";
		}
		msg += "</div>"
	currentSelectedMediaPreview.append(msg);
	
	//Button Actions for interactives
	//console.log(obj);
	var untouchableFiles = ["defaultLeft.png", "defaultTop.png", "defaultReveal.png", "loadingIcon.gif"];
    if (untouchableFiles.indexOf(obj) >= 0 ){
	//if(obj == "defaultLeft.png"){
		$(".mediaRemove").css({'opacity': .5});
	}else{
		$(".mediaRemove").click(function(){
			var myItem = relPath + obj;	
			checkRemoveMedia(myItem);	   
		});
	}
	   
	$(".mediaDownload").click(function(){
		var myItem = folderTrackPath + mediaBrowserDisplayPath +obj;
		//console.log(myItem)	
		//downloadMedia(myItem);	   
	});
	
	$(".mediaSelect").click(function(){
		var myType = getFileType(obj).toLowerCase();
		var permitted = true;
		var failType = null;
		var myItem = relPath + obj;	
		if(fileTarget != null){
			var chromeString = fileTarget.selector.toString();
			console.log(chromeString);
			console.log(typeof chromeString);
			//Check if file is permitted in this input.
			if(fileTarget.attr("id") == "mediaLink"
			|| chromeString.indexOf("optionImg") >= 0 
			|| fileTarget.attr("id").indexOf("imgPath") >= 0 
			|| fileTarget.attr("id").indexOf("optionImg") >= 0
			){
				var acceptedTypes = ["png", "jpg", "gif", "mp4", "svg", "swf", "html", "htm"];
			}else if(fileTarget.attr("id") == "revealImageText"){
				var acceptedTypes = ["png", "jpg", "gif"];
			}else if(fileTarget.attr("id") == "audioPath"){
				var acceptedTypes = ["mp3"];
			}
			
			if(acceptedTypes.indexOf(myType) > -1){
				permitted = true;
			}else{
				permitted = false;
			}
			
			if(permitted){
				$(chromeString).attr('value', myItem);
				$(".ui-dialog").show();
				$(".ui-widget-overlay").show();
				toggleMediaBrowser();
			}else{
				alert("This media input does not support the " + myType + " file format. Please make another selection.");
			}
		}else{
			$(".ui-dialog").show();
			$(".ui-widget-overlay").show();
			toggleMediaBrowser();
		}
	});
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
	doGitCommit();
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
	var fp = folderTrackPath + mediaBrowserDisplayPath + _file;
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
		$("#mediaBrowserPreview").removeClass("C_Loader");
		//alert("You can't preview this file type.");
		$("#mediaBrowserPreviewMediaHolder").append("<p><b>You can't preview this file type from within the system.</b></p><p>It has been opened in a new window. Check how your browser handles different file types to see if it has been downloaded.</p>");
		$("#mediaBrowserPreviewMediaHolder").css({'opacity': 1, 'text-align': 'center'});
		window.open(fp, "_blank");
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
	//$('#mediaBrowserPreviewMediaHolder').css({'opacity': .1})	
	// decent browser - prefer HTML5 video
	$('#mb_videoplayer').mediaelementplayer({
		enablePluginSmoothing: true,
		enableKeyboard: true,
		success: function(player, node){
			player.addEventListener('loadeddata', function(e) {
				var imageWidth = e.target.videoWidth;
        
		        if(imageWidth > $("#mediaBrowserPreview").width()){
			        var widthScale = $("#mediaBrowserPreview").width()/imageWidth;
			        e.target.videoWidth = e.target.videoWidth * widthScale;
					$("#mediaBrowserPreviewMediaHolder").append("<div class='mediaBrowserScaleWarning'>This media is being viewed at " + Math.floor(widthScale * 100) + "% to fit preview area.");
		        }
		        var imageHeight = e.target.videoHeight;
		        /*if(imageHeight > $("#mediaBrowserPreview").height()){
			        var heightScale = $("#mediaBrowserPreview").height()/imageHeight;
					//e.target.videoHeight = e.target.videoHeight * heightScale;
			        $("#mediaBrowserPreviewMediaHolder").append("<div class='mediaBrowserScaleWarning'>This media is being viewed at " + Math.floor(heightScale * 100) + "% to fit preview area.");
		        }*/
				
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
        
        if(imageWidth > $("#mediaBrowserPreview").width()){
	        var widthScale = $("#mediaBrowserPreview").width()/imageWidth;
	        $(img).width($(img).width() * widthScale);
			$("#mediaBrowserPreviewMediaHolder").append("<div class='mediaBrowserScaleWarning'>This media is being viewed at " + Math.floor(widthScale * 100) + "% to fit preview area.");
        }
        var imageHeight = $(img).height();
        if(imageHeight > $("#mediaBrowserPreview").height()){
	        var heightScale = $("#mediaBrowserPreview").height()/imageHeight;
			$(img).height($(img).height() * heightScale);
	        $("#mediaBrowserPreviewMediaHolder").append("<div class='mediaBrowserScaleWarning'>This media is being viewed at " + Math.floor(heightScale * 100) + "% to fit preview area.");
        }
        TweenMax.to($('#mediaBrowserPreviewMediaHolder'), .5, {css:{opacity:1}, ease:transitionType});
    }).attr('src', _fp).attr('id', 'myImage');
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
	$(".C_LoaderText").append("<div id='conversionProgress'><div id='progress-label' class='progress-label'>Converting...</div></div>");
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
	doGitCommit();
	queueCurrent++;
	try { cognizenSocket.removeListener('mediaBrowserUploadComplete', mediaBrowserUploadComplete); } catch (e) {}
	if(queueLength == queueCurrent){
		//queue complete
		var splitPath = data.replace(/\\/g, '/').split("/");
		var last = splitPath.length;
		var mediaPath = splitPath[last-1];
		mediaBrowserPreviewFile(mediaPath);
		//Commit GIT when complete.
		//doGitCommit();
	    getMediaDir(relPath);
	}else{
		//Load next item
		uploadFile(queue[queueCurrent]);
	}
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
