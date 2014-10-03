/*
 *  	C_UtilFunctions
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses index functionality for cognizen
 *  	Version: 0.5
 *		Date Created: 10/19/13
 *		Created by: Philip Double
 *		Date Updated: 10/19/13
 *		Updated by: Philip Double
 *		History: Moved all glossary functionality into its own js file.
 *		Todo: 	- Turn this into a plugin.  This did reside in C_Engine which was becoming unruly.
 *				- Optimize code.
 *		Function List:
 				//Gerate the urlParams Variable
 				@queryStringParameters()
 				
 				//Generate random guid
 				@s4()
 				@guid()
 */
 
// IE Fix for lack of console.log -- IE breaks down for console calls otherwise.
var alertFallback = true;

var secureSocket = window.location.protocol == 'https:';

if (typeof console === "undefined" || typeof console.log === "undefined") {
    console = {};
    if (alertFallback) {
        console.log = function(msg) {
            //alert(msg);
        };
    } else {
        console.log = function() {};
    }
}


function checkFileApi(){ 
    if(window.File && window.FileReader){
	    dragFile = true;
    }
}

function doError(title, msg) {
	$("#stage").append('<div id="dialog-error"><p>' + msg + '</p></div>');

    $("#dialog-error").dialog({
    	modal: true,
		width: 520,
        title: title,
        buttons: {
            Ok: function () {
                $(this).dialog("close");
                $("#dialog-error").remove();
            }
        }
    });
}

checkFileApi() 
 
var queryStringParameters = function() {
	var match,
     pl     = /\+/g,  // Regex for replacing addition symbol with a space
	search = /([^&=]+)=?([^&]*)/g,
	decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
	query  = window.location.search.substring(1);

	var urlParams = {};
	while (match = search.exec(query)) {
		urlParams[decode(match[1])] = decode(match[2]);
	}
	return urlParams;
}

/*****************************************************
shuffleArray
randomize the order of any array.  Just pass in array.
var my_arr = shuffleArray(anyArray);
OR
anyArray = shuffleArray(anyArray); 
to shuffle self.
*****************************************************/
// Fisher-Yates shuffle, no side effects
function shuffleArray(a) { 
    var i = a.length, t, j;
    a = a.slice();
    while (--i) t = a[i], a[i] = a[j = ~~(Math.random() * (i+1))], a[j] = t;
    return a;
}


/*****************************************************
randomIntFromRange
provide random int from a number range
*****************************************************/
function randomIntFromRange(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}
/*****************************************************************
Discover if we are dealing with IE....
*****************************************************************/
var oldIE = false;
var isIE = false;
function isOldIE() {
    "use strict";
    // Detecting IE
   
    if ($('html').is('.ie6, .ie7, .ie8', '.ie9')) {
        oldIE = true;
    }
    
    
    if ($('html').is('.ie6, .ie7, .ie8', '.ie9', '.ie10', '.ie11')) {
        isIE = true;
    }
    
    if (Function('/*@cc_on return document.documentMode===10@*/')()) {
	    isIE = true;
	}
    
}

isOldIE();


var isFF = false;

function checkFF(){
	isFF = typeof InstallTrigger !== 'undefined';
}

checkFF();

/*****************************************************************
MOBILE DETECTION
*****************************************************************/
// jquery.browser has been depricated.  Instead we will define mobile
// as any screen too small for our standard 1024x700 size.
//var isMobile = jQuery.browser.mobile;
var isMobile = false;

if( (window.innerWidth < 1024) || (window.innerHeight < 700) ){
	isMobile = true;
	console.log("mobile device detected");
}

// Detect touch device
// from http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
var hasTouch = false;
window.addEventListener('touchstart', function setHasTouch () {
    hasTouch = true;
    console.log("touch device detected");
    // Remove event listener once fired, otherwise it'll kill scrolling
    // performance
    window.removeEventListener('touchstart', setHasTouch);
}, false);
/**********************************************************END MOBILE DETECTION*/


/*****************************************************************
RANDOM GUID GENERATION
*****************************************************************/
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}
/**********************************************************END RANDOM GUID GENERATION*/

/*************************************************************
** Utility Funcitonality
*************************************************************/
function findNodeByID(myID){
	if(myID == undefined){
		myID = currentPageID;
	}
	for(var i = 0; i < totalPages; i++){
		if(myID == $(data).find("page").eq(i).attr("id")){
			return i;
			break;
		}
	}
}

function loadPageFromID(_id){
	for(var i = 0; i < totalPages; i++){
		if($(data).find("page").eq(i).attr("id") == _id){
			currentPage = i;
			if(currentTemplate !== undefined){
				currentTemplate.destroySelf();
			}
			break;
		}
	}
}


function getExtension(myFile){
	var parts = myFile.split('.'), i, l;
	var last = parts.length;

	mediaType = (parts[last - 1]);
	
	return mediaType;	  	
}

function parsePackageLocation(myPath){

    myPath = myPath.replace(/\\/g, '/');
	var splitPath = myPath.split("/");
	var notYet = true;
	var first = true;
	var dlPath = "";
	for(var i = 0; i < splitPath.length; i++){
		if(splitPath[i] == "programs"){
			notYet = false;
		}
		if(notYet == false){
			if(first == false){
				dlPath += "/";
			}else{
				first = false;
			}
			dlPath += splitPath[i];
		}
	}
	dlPath = dlPath.replace(/\s+/g, '%20'); 

	cognizenSocket.emit("sendPackageMail", {
		user: urlParams['u'],
		path: dlPath
	});
	
}

//cleans up all of the data between templates
function fadeComplete() {
	try { audioPlayer.pause(); } catch (e) {}	
    try { pageTitle.destroy(); } catch (e) {}
    try { audioHolder.destroy(); } catch (e) {}
    try { mediaHolder.destroy(); } catch (e) {}
    
    try { $("#sidebar").remove(); } catch (e) {}
    try { $("#sidebarHolder").remove(); } catch (e) {}
	try { $("#scrollableContent").remove(); } catch (e) {}
	try { $("#conEdit").remove(); } catch (e) {}
	try { $(".dialog").remove(); } catch (e){};
	try { $("#cardEditDialog").remove(); } catch (e) {}
	try { $("#cardEdit").remove(); } catch (e) {}
	try { $("#content").remove(); } catch (e) {}
    try { $("#dialog-attemptResponse").remove(); } catch (e) {}
    try { $("#questionEdit").remove(); } catch (e) {}
	try { $("#questionEditDialog").remove(); } catch (e) {}	
	try { $('#pageTitle').remove(); } catch (e) {}
	try { $('#question').remove(); } catch (e) {}
	try { $('#answerOptionsImage').remove(); } catch (e) {}
	try { $("#mcSubmit").remove(); } catch (e) {}	   
	try { $('#audioCon').remove(); } catch (e) {}
	try { $('#player').remove(); } catch (e) {}
	try { $("#titleEdit").remove(); } catch (e) {}
	try { $("#imgEdit").remove(); } catch (e) {}
	try { $("#captionEdit").remove(); } catch (e) {}
	try { $('#loader').flash().remove(); } catch (e) {}
	try { $('#caption').remove(); } catch (e) {}
	try { $('#loader').remove(); } catch (e) {}
	try { $("#imgEdit").remove(); } catch (e) {}
  	try { $("#textInputHolder").remove(); } catch (e) {}
  	try { $("#inputCorrectResponse").remove(); } catch (e) {}
  	try { $("#acceptedResponseEdit").remove(); } catch (e) {}
  	try { $("#diffeedEdit").remove(); } catch(e) {}
  	try { $("#essayCompareHolder").remove(); } catch (e) {}

	try{
		for(name in CKEDITOR.instances){
			try { CKEDITOR.instances[name].destroy(); } catch (e) {}
		}
	}
	catch(e){}

	loadPage();

}