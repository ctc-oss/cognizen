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

function shuffleArray(a) { // Fisher-Yates shuffle, no side effects
    var i = a.length, t, j;
    a = a.slice();
    while (--i) t = a[i], a[i] = a[j = ~~(Math.random() * (i+1))], a[j] = t;
    return a;
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