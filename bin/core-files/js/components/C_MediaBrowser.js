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
/**
* Variable to hold queued upload file list.
*
* @type {Array}
*/
var queue;
/**
* Variable to hold length of queue.
*
* @type {Number}
*/
var queueLength;
/**
* Variable to hold current queue member.
*
* @type {Number}
*/
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
		// fade stage in
		$('#mediaBrowserDisplay').velocity({
			width: displayWidth, 
			height: displayHeight
		}, {
			duration: transitionLength,
			complete: addDisplay
		});
	}else{
		//Tween transcript closed then remove text
		$("#mediaBrowserDisplay").empty();
		$('#mediaBrowserDisplay').velocity({
			width: 0, 
			height: 0
		}, {
			duration: transitionLength,
			complete: removeMediaBrowserDisplay
		});
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
			msg += "<div id='mediaBrowserListWrapper' class='box-wrap antiscroll-wrap'>";
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
	
	addCreateRoll($("#mediaBrowserDisplayPath"))

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

/**
* remove default drag over behaviors
*
* @method FileDragHover
* @param e event
*/
function FileDragHover(e){
	e.preventDefault();
    e.stopPropagation();
}

/**
* remove default drag out behaviors
*
* @method FileDragLeave
* @param e event
*/
function FileDragLeave(e){
	e.preventDefault();
    e.stopPropagation();
}

/**
* Get upload file info and add to queue
*
* @method FileSelectHandler
* @param e drop event
*/
function FileSelectHandler(e) {
	if(e.originalEvent.dataTransfer){
		if(e.originalEvent.dataTransfer.files.length) {
			$("#mediaBrowserDisplay").off("drop", FileSelectHandler);
			e.preventDefault();
			e.stopPropagation();
			/*UPLOAD FILES HERE*/
			queueFileUpload(e.originalEvent.dataTransfer.files);
		}
	}
}

/**
* Add files to queue
*
* @method queueFileUpload
* @param _fl FileList
*/
function queueFileUpload(_fl){
	queue = _fl;
	queueLength = _fl.length;
	queueCurrent = 0;
	if ((!queue[queueCurrent].type && queue[queueCurrent].size % 136 == 0) || (!queue[queueCurrent].type && queue[queueCurrent].size % 4096 == 0)) {
		$("#mediaBrowserDisplay").on("drop", FileSelectHandler);
		var msg = "<div id='uploadErrorDialog' title='Upload Error'>";
			msg += "You cannot currently upload a folder. If you'd like to upload a folder, zip the folder and upload the zip.";
			msg += "</div>";
		$("#stage").append(msg);
		//Theres an error
		//Style it to jQuery UI dialog
		$("#uploadErrorDialog").dialog({
	    	autoOpen: true,
			modal: true,
			width: 400,
			height: 200,
			buttons: [ { text: "Close", click: function() {$( this ).dialog( "close" ); $( this ).remove()} }]
		});
	}else{
		uploadFile(queue[queueCurrent]);
	}
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
	if(_data != null){
		for (var key in _data.dirs) {
			var obj = _data.dirs[key];
			var tempID = "folder"+key;
			var msg = "<div id='"+tempID+"' class='mediaBrowserFolder' data-type='folder' data='"+obj+"'>"+obj+"</div>";
			$("#mediaBrowserList").append(msg);
	
			$("#"+tempID).click(function(){
			   	if(!hoverSubNav){
					$("#mediaBrowserList").addClass('C_Loader');
					$("#mediaBrowserList").empty();
					dirDepth++;
					var addPath = $(this).attr('data') + "/";
					relPath += addPath;
					mediaBrowserDisplayPath += addPath;
					getMediaDir(relPath);
				}
			});
		   
			var untouchableFolders = ["jqueryui", "media", "ProgramCSS", "ModuleCSS"];
			if(untouchableFolders.indexOf(obj)  < 0){
				addFolderRoll($("#"+tempID));
			}
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
}

var hoverSubNav = false;

function addCreateRoll(myItem){
	myItem.hover(
    	function () {
            $(this).append("<div id='myCreate' class='dirCreate' title='Create a directory in this locaion.'></div>");
            $("#myCreate").click(function(){
            	createDirectory();
	        }).hover(
            	function () {
                	hoverSubNav = true;
                },
				function () {
                	hoverSubNav = false;
                }
            ).tooltip({
            	show: {
                	delay: 1500,
                    effect: "fadeIn",
                    duration: 200
                }
           });
        },
        function () {
			$("#myCreate").remove();
	});
}

function addFolderRoll(myItem){
	myItem.hover(
    	function () {
            $(this).append("<div id='myRemove' class='dirRemove' title='Remove this directory from your content.'></div>");
            $("#myRemove").click(function(){
            	var addPath = $(this).parent().attr('data') + "/";
				var tempPath = relPath + addPath;
				checkRemoveMediaDir(tempPath);
	        }).hover(
            	function () {
                	hoverSubNav = true;
                },
				function () {
                	hoverSubNav = false;
                }
            ).tooltip({
            	show: {
                	delay: 1500,
                    effect: "fadeIn",
                    duration: 200
                }
           });
        },
        function () {
			$("#myRemove").remove();
	});
}

/**
* Launch Dialog to confirm removal of directory.
*
* @method checkRemoveMediaDir
* @param {String} server path and name of directory to be removed.
*/
function checkRemoveMediaDir(_dir){
	//Create the Dialog
	$("#stage").append("<div id='dialog-removeDir' title='Remove Media Directory'><p>Are you sure that you want to remove the " + _dir + " directory from this project?</p></div>");
	//Style it to jQuery UI dialog
	$("#dialog-removeDir").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
			$("dialog-removeDir").remove();
		},
		buttons: {
			Yes: function(){
				removeMediaDirectory(_dir);
				$( this ).dialog( "close" );
			},
			No: function(){
				$( this ).dialog( "close" );
			}
		}
	});
}

/**
* Remove directory from server
*
* @method removeMediaDir
* @param {String} _dir server path and name of directory to be removed.
*/
function removeMediaDirectory(_dir){
	cognizenSocket.on('mediaBrowserRemoveDirectoryComplete', mediaBrowserRemoveDirectoryComplete);
	$("#mediaBrowserList").addClass('C_Loader');
	$("#mediaBrowserList").empty();
	$("#mediaBrowserPreviewMediaHolder").empty();
	cognizenSocket.emit('mediaBrowserRemoveDir',  {track: folderTrack, path: _dir, type: urlParams['type'], id: urlParams['id']});
}

/**
* Callback after removal of directory
*
* @method mediaBrowserRemoveDirectoryComplete
*/
function mediaBrowserRemoveDirectoryComplete(){
	$("#mediaBrowserList").removeClass('C_Loader');
	try { cognizenSocket.removeListener('mediaBrowserRemoveDirectoryComplete', mediaBrowserRemoveDirectoryComplete); } catch (e) {}
	//Commit GIT when complete.
	doGitCommit();
	
    getMediaDir(relPath);
}

/**
* Create Directory
*
* @method createDirectory
*/
function createDirectory(){
	//Create the Dialog
	var msg =  "<div id='dialog-createDir' title='Create new directory'>";
		msg += "<p>Create a new directory in the " + folderTrackPath + mediaBrowserDisplayPath +" directory.</p>";
		msg += '<label for="myName" class="regField">name: </label>';
		msg += '<input type="text" name="myName" id="myName" value="" class="regText text ui-widget-content ui-corner-all" />';
		msg += '</div>';
	
	$("#stage").append(msg);
	//Style it to jQuery UI dialog
	$("#dialog-createDir").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
			$("#myName").remove();
			$("dialog-createDir").remove();
		},
		buttons: {
			Apply: function(){
				cognizenSocket.on('mediaBrowserCreateDirectoryComplete', mediaBrowserCreateDirectoryComplete);
				$("#mediaBrowserList").addClass('C_Loader');
				$("#mediaBrowserList").empty();
				$("#mediaBrowserPreviewMediaHolder").empty();
				var myName = $("#myName").val();
				$( this ).dialog( "close" );
				cognizenSocket.emit('mediaBrowserCreateDir',  {track: folderTrack, path: relPath, name: myName, type: urlParams['type'], id: urlParams['id']});
			},
			Cancel: function(){
				$( this ).dialog( "close" );
			}
		}
	});
}

function mediaBrowserCreateDirectoryComplete(){
	$("#mediaBrowserList").removeClass('C_Loader');
	try { cognizenSocket.removeListener('mediaBrowserCreateDirectoryComplete', mediaBrowserCreateDirectoryComplete); } catch (e) {}
	//Commit GIT when complete.
	doGitCommit();
	
    getMediaDir(relPath);
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
	var untouchableFiles = ["defaultLeft.png", "defaultTop.png", "defaultReveal.png", "loadingIcon.gif", "defaultQuestion.png"];
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
		//downloadMedia(myItem);
	});

	$(".mediaSelect").click(function(){
		var myType = getFileType(obj).toLowerCase();
		var permitted = true;
		var failType = null;

		var myItem = relPath + obj;
		if(fileTarget != null){
			//Check if file is permitted in this input.
			if(fileTarget.attr("id") == "mediaLink" || fileTarget.attr("id").indexOf("imgPath") >= 0 || fileTarget.attr("id").indexOf("optionImg") >= 0){
				var acceptedTypes = ["png", "jpg", "gif", "mp4", "svg", "swf", "html", "htm"];
			}else if(fileTarget.attr("id") == "revealImageText" || fileTarget.attr("id") == "questionImageText"){
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
				fileTarget.attr('value', myItem).change();
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
				$('#mediaBrowserPreviewMediaHolder').velocity({
					opacity: 1
				}, {
					duration: 500
				});
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
					$("#mediaBrowserPreviewMediaHolder").append("<div class='mediaBrowserScaleWarning'>This media is being viewed at " + Math.floor(widthScale * 100) + "% to fit preview area.");
		        }
				//tween fade in after loaded and positioned.
				$("#mediaBrowserPreview").removeClass("C_Loader");
				$('#mediaBrowserPreviewMediaHolder').velocity({
					opacity: 1
				}, {
					duration: 500
				});
			}, false);
		}
	});
	$("#mb_videoplayer").css({'max-width': "100%", 'max-height': "100%"});
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
	$('#mediaBrowserPreviewMediaHolder').velocity({
		opacity: 1
	}, {
		duration: 500
	});
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
		$('#mediaBrowserPreviewMediaHolder').velocity({
			opacity: 1
		}, {
			duration: 500
		});
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
		$("#mediaBrowserDisplay").on("drop", FileSelectHandler);
		//queue complete
		if(data != "zip"){
			var splitPath = data.replace(/\\/g, '/').split("/");
			var last = splitPath.length;
			var mediaPath = splitPath[last-1];
			mediaBrowserPreviewFile(mediaPath);
		}
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
