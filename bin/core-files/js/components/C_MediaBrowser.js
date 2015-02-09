/*********************************************************************************
Media Browser - pull to it's own class
*********************************************************************************/
var mediaBrowserState = false;
var mediaBrowserRoot = true;
var mediaBrowserDisplayPath = "media/";
var dirDepth = 0;
var relPath = "";

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

function addDisplay(){
	var msg = "<div id='mediaBrowserHeader' class='mediaBrowserHeader'>Media Browser</div>";
		msg += "<div id='mediaBrowserContent' class='mediaBrowserContent'>"
		msg += "<div id='mediaBrowserList' class='mediaBrowserList C_Loader'></div>";
		msg += "<div id='mediaBrowserPreview' class='mediaBrowserPreview'></div>";
		msg += "</div>";
	$("#mediaBrowserDisplay").append(msg);
	getMediaDir();
}

function getMediaDir(_dir){
	if(_dir){
		//Get media directory sub folder.
		socket.emit('getMediaDir', _dir);
	}else{
		//Just get media folder
		socket.emit('getMediaDir', "");
	}
}

function updateMediaBrowserDir(_data){
	//$("#mediaBrowserDisplay").append('<div id="scrollableTranscript" class="antiscroll-wrap"><div class="box"><div id="transcriptHolder" class="overthrow antiscroll-inner"><div id="transcript">'+transcriptText+'</div></div></div></div>');
	//$("#scrollableTranscript").height($(".transcriptDisplay").css("max-height"));
	//$("#scrollableTranscript").width($(".transcriptDisplay").css("max-width"));
	//$("#transcriptHolder").height($(".transcriptDisplay").css("max-height"));
	//$("#transcriptHolder").width($(".transcriptDisplay").css("max-width"));
	//$('#scrollableTranscript').antiscroll();
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

function mediaBrowserPreviewFile(_file){
	var fp = mediaBrowserDisplayPath + _file;
	alert(fp);
}

function removeMediaBrowserDisplay(){
	$("#mediaBrowserDisplay").remove();
	relPath = "";
	mediaBrowserDisplayPath = "media/";
}
