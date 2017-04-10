/*
 *  	C_Print
 *  	Requires jQuery v1.9 or later
 *
 *      Displays the lesson to be printed.
 *  	Version: 0.5
 *		Date Created: 07/11/16
 */
function C_Print(_myItem, _myParent) {

	////////////////////////////////////////////////   COURSE LEVEL VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	var myItem = _myItem;										//The Button that was clicked in the dashboard.
	var courseID = myItem.data('id');							//Course to check for modules
    var currentCourseType = myItem.data('type');				//Type to be passed to node server
    var currentCoursePermission = myItem.data('permission');	//Permission to be passed to node server

    var coursePath;												//Path to the course
    var courseData;												//Variable to hold and manipulate course.xml - the xml is imported and held in courseData object.
    var courseXMLPath;											//Path to the course.xml
    var refreshExpected = false;								//Toggle on refreshes coming in - true when needed.


    ////////////////////////////////////////////////   MODULE LEVEL VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    var totalPrintModules;									//Number of modules in course
    var loadedPrintModules;									//Variable to track how many module xml files have been loaded.
    var pageCount = 0;
 	var courseDisplayTitle;
 	var lessonDisplayTitle;
 	var resources_arr = [];
 	var audioFile;
 	var audioInuse = false;
 	var zipPath;

    $(document).ready(function(){
    	initPrint();
    });

    socket.on('receiveCoursePath', function (data){
		receiveCoursePath(data);
    });

    socket.on('receiveResourcePackage', function (data){
		zipPath = data.path;
		buildPrintInterface(data.mod);
    });   

    this.refreshPrintData = function(){
	   refreshPrintData();
    }

    function refreshPrintData(){
	    if(refreshExpected == true){
		   module_arr = [];
		   indexItem_arr = [];
		   loadedPrintModules = 0;
		   refreshExpected = false;

		   $.ajax({
			   type: "GET",
			   url: courseXMLPath,
			   dataType: "xml",
			   async: false,
			   success: importPrintItems,
			   error: function(){
				   alert("unable to load content data")
			   }
			});
		}
    }

	 /************************************************************************************
     initPrint()
     -- reach out to the node server and get the path to the course.
     ************************************************************************************/
     function initPrint(){
     	loadedPrintModules = 0;
     	var tmpCourseId = courseID;
     	if(currentCourseType === 'lesson'){
     		tmpCourseId = _myParent.id;
     	}
		socket.emit("getCoursePath", {
        	content: {
            	id: tmpCourseId,
                type: 'course',
                permission: currentCoursePermission
             }
		});
     }

     /************************************************************************************
     receiveCoursePath(data)
     -- recieve course path back from node in data object.
     -- use recieved path to load the course.xml file.
     ************************************************************************************/
     function receiveCoursePath(data){
	     coursePath = [window.location.protocol, '//', window.location.host, '/programs/', decodeURIComponent(data.path)].join('');
	     var xmlPath = coursePath + "/course.xml";
	     courseXMLPath = xmlPath;
	     $.ajax({
		    type: "GET",
		    url: xmlPath,
		    dataType: "xml",
		    async: false,
		    success: importPrintItems,
		    error: function(){
			    alert("unable to load content data")
		    }
		});
     }

     /************************************************************************************
     importPrintItems(_data);
     -- store the course.xml in courseData variable to read and manipulate as needed.
     -- call functionimport each of the module content.xml files.
     ************************************************************************************/
     function importPrintItems(_data){
	     courseData = _data;

	     //TODO: course level not yet implemented
		if(currentCourseType === 'course'){
		    totalPrintModules = $(courseData).find("item").length;

			if(totalPrintModules > 0){
				for(var y = 0; y < totalPrintModules; y++){
					 var moduleObj = new Object();

					 moduleObj.name = $(courseData).find("item").eq(y).attr("name");
					 moduleObj.id = $(courseData).find("item").eq(y).attr("id");
					 moduleObj.parent = courseID;
					 moduleObj.parentDir = coursePath;
					 moduleObj.path = coursePath + "/" +$(courseData).find("item").eq(y).attr("name");
					 moduleObj.xml = null;
					 moduleObj.xmlPath = ["/", encodeURIComponent($(courseData).find("item").eq(y).attr("name").trim()), "/xml/content.xml"].join("");
					 module_arr.push(moduleObj);

					 var currentXML = [coursePath, "/", encodeURIComponent($(courseData).find("item").eq(y).attr("name")), "/xml/content.xml"].join("");
					 importModuleXML(currentXML);
				}
			}
			else{
				buildPrintInterface();
			}

		}
		else{
			totalPrintModules = 1;
			 var moduleObj = new Object();

			 moduleObj.name = $(courseData).find("item[id='"+courseID+"']").attr("name");
			 moduleObj.id = $(courseData).find("item[id='"+courseID+"']").attr("id");
			 moduleObj.parent = _myParent.id;
			 moduleObj.parentDir = coursePath;
			 moduleObj.path = coursePath + "/" +$(courseData).find("item[id='"+courseID+"']").attr("name");
			 var pathSplit = moduleObj.path.split('/programs');
			 moduleObj.normPath = '../programs' + pathSplit[1];
			 moduleObj.xml = null;
			 moduleObj.xmlPath = ["/", encodeURIComponent($(courseData).find("item[id='"+courseID+"']").attr("name").trim()), "/xml/content.xml"].join("");
			 module_arr.push(moduleObj);

			 var currentXML = [coursePath, "/", encodeURIComponent($(courseData).find("item[id='"+courseID+"']").attr("name")), "/xml/content.xml"].join("");
			 importModuleXML(currentXML);			
		}
     }


     /************************************************************************************
     importModuleXML(_path)
     -- download content.xml for each module
	 -- call importOUtlineModuleComplete after each is pulled to see if all are pulled.
     ************************************************************************************/
     function importModuleXML(_path){
	     $.ajax({
		    type: "GET",
		    url: _path,
		    dataType: "xml",
		    async: false,
		    success: importPrintModuleItemComplete,
		    error: function(){
			    alert("unable to load module data for " + _path);
		    }
		});
     }


     /************************************************************************************
     importPrintModuleItemComplete(_data);
     -- attach module content.xml to appropriate module_arr item
	 -- Check if all are downloaded then move on.
     ************************************************************************************/
     function importPrintModuleItemComplete(_data){

	     loadedPrintModules++;
	     if(loadedPrintModules === totalPrintModules){
		     packageModuleResources(module_arr[0]);
	     }	     for(var i = 0; i < module_arr.length; i++){
	     	//#4929 updated to compare ids instead of names
		     if($(_data).find("id").attr("value") == module_arr[i].id){
			     module_arr[i].xml = _data;
		     }
	     }
     }


     function packageModuleResources(_mod){
     	console.log(_mod.xml);
		socket.emit("getResourcePackage", {_mod});     	
     }

     /************************************************************************************
	 buildPrintInterface()
     -- build menuing system and add functionalities
     ************************************************************************************/
     function buildPrintInterface(_mod){
     	try {$("#dialog-print").dialog("close");} catch (e) {}

     	var thisID;
     	indexItem_arr = [];

     	var data;
		for(var i = 0; i < module_arr.length; i++){
			//#4929 updated to compare ids instead of names
			if(_mod.id == module_arr[i].id){
				data = module_arr[i].xml;
			}
		}

     	var totalPages = $(data).find('page').length;

     	var lessonTitle = $(courseData).find('course').first().attr("name");
     	if(currentCourseType === 'lesson'){
     		lessonTitle = $(courseData).find("item[id='"+courseID+"']").attr("name");
     	}

     	courseDisplayTitle = $(courseData).find('course').attr('coursedisplaytitle');
     	lessonDisplayTitle = $(data).find("lessondisplaytitle").attr("value");

     	msg = '<div id="dialog-print" title="Print Lesson (Beta) : '+ lessonTitle + ':">';
	    msg += '<div id="ptPane" class="pane">'
	    msg += '<div id="printPane" class="paneContent">';
	    msg += '</div>';//close the printPane

	    msg += '</div>';//close the ptpane
	    msg += '</div>';//close the dialog
        //ADD menu to stage
        $("#stage").append(msg);

		for(var i = 0; i < totalPages; i++){
			msg = '';
			msg += '<div class="print-container">';
			msg += '<div id="print-header" class="print">';
			msg += '<div id="logo" class="print"></div>';
			msg += '<div id="title-block" class="print"><div id="header-space" class="print"></div>';
			msg += '<div id="courseTitle" class="print">' + courseDisplayTitle + '</div>';
			msg += '<div id="lessonTitle" class="print">' + lessonDisplayTitle + '</div>';
			msg += '</div>'; //end title-block
			msg += '</div>';//end print-header
	 		msg += '<div id="printPage"><div id="pageTitle" class="print" role="heading">' + $(data).find("page").eq(i).find('title').first().text() + '</div>';

	 		var myContent = $(data).find("page").eq(i).find("content").first().text();
	 		var layout = $(data).find("page").eq(i).attr('layout');

			if($(data).find("page").eq(i).attr('audio') != undefined && $(data).find("page").eq(i).attr('audio') != "null" 
				&& $(data).find("page").eq(i).attr('audio') != "" && $(data).find("page").eq(i).attr('audio') != " "){
				audioFile = $(data).find("page").eq(i).attr('audio');
				audioInuse = true;
			}	 		

	 		switch(layout){
	 			case 'multipleChoice':
	 			case 'multipleChoiceMedia':
	 				msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
	 				var optionCount = $(data).find("page").eq(i).find("option").length;
					for(var j = 0; j < optionCount; j++){
						var answerText = $(data).find("page").eq(i).find("option").eq(j).find("content").text();
						if(answerText.indexOf("src=") != -1){
							var mediaPathRes = "programs/"+currentProject+"/"+$(courseData).find('course').first().attr("name")+"/"+lessonTitle+"/media/";
							msg += answerText.replace("media/",	mediaPathRes);
						}
						else{
							msg += answerText;
						}
						msg += '<br/>';	
						// var icon = $(data).find("page").eq(i).find("option").eq(j).attr('correct') !== "true" ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
						// msg += icon + '<br/>';
					}		 				
	 				break;
	 			case "multipleChoiceFancy":	
	 				//TODO
		 			msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';	
		 			break;		 				
	 			case 'matching':
	 				msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
	 				var answersArr = [];
	 				var optionCount = $(data).find("page").eq(i).find("option").length;
					for(var j = 0; j < optionCount; j++){	
						var optionCorrect =  $(data).find("page").eq(i).find("option").eq(j).attr('correct');
						var answerText = $(data).find("page").eq(i).find("answer[correct="+optionCorrect+"]").find("content").text();
						if(answerText.indexOf("src=") != -1){
							var mediaPathRes = "programs/"+currentProject+"/"+$(courseData).find('course').first().attr("name")+"/"+lessonTitle+"/media/";
							answersArr.push(answerText.replace("media/",	mediaPathRes));
						}
						else{
							answersArr.push(answerText);
						}
					}	

					answersArr = shuffleArray(answersArr); 
					for(var j = 0; j < optionCount; j++){
						msg += '<div class="matchingHolder print">';	
						msg += '<div class="options print">' + $(data).find("page").eq(i).find("option").eq(j).text() + '</div>';
						msg += '<div class="answers print">' + answersArr[j] + '</div>';
						msg += '</div><br/>';

					}										
	 				break;
	 			case 'matchingDrag':
	 				msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
	 				var answersArr = [];
	 				var optionCount = $(data).find("page").eq(i).find("option").length;
					for(var j = 0; j < optionCount; j++){	
						answersArr.push($(data).find("page").eq(i).find("answer[correct="+optionCorrect+"]").attr('img'));
					}	

					answersArr = shuffleArray(answersArr); 
					for(var j = 0; j < optionCount; j++){
						msg += '<div class="matchingHolder print">';	
						msg += '<div class="options print">' + $(data).find("page").eq(i).find("option").eq(j).text() + '</div>';
						msg += '<div class="answers print"><img class="print" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +answersArr[j]+'" ></div>';
						msg += '</div><br/>';

					}								 			
	 				break;
	 			case 'questionBank':
	 				//TODO: how to handle question bank
					var showall = $(data).find("page").eq(i).attr('showall') !== "true" ? 'showall off' : 'showall on';
					var numToComplete = $(data).find("page").eq(i).attr('tocomplete');
					var bankCount = $(data).find("page").eq(i).find("bankitem").length;
					msg += showall + ' : Num of questions is ' + bankCount + ' : Number of questions to complete is ' + numToComplete; 

					for (var j = 0; j < bankCount; j++) {
						msg += '<hr style="border-top: dotted 2px;" />';
						// var bankAttempt =  $(data).find("page").eq(i).find("bankitem").eq(j).attr("attempts");
						// var bankRandomize = $(data).find("page").eq(i).find("bankitem").eq(j).attr("randomize") !== 'true' ? 'Not Randomized' : 'Randomized';
						// msg += 'Num Attempts - ' + bankAttempt + ' : Answers are ' +  bankRandomize + '<br/>';
						var qNum = j+1;
						msg += '<br/>' + qNum + '. ' + $(data).find("page").eq(i).find("bankitem").eq(j).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
		 				var bankOptionCount = $(data).find("page").eq(i).find("bankitem").eq(j).find("option").length;
						for(var k = 0; k < bankOptionCount; k++){
							var answerText = $(data).find("page").eq(i).find("bankitem").eq(j).find("option").eq(k).find("content").text();
							if(answerText.indexOf("src=") != -1){
								var mediaPathRes = "programs/"+currentProject+"/"+$(courseData).find('course').first().attr("name")+"/"+lessonTitle+"/media/";
								msg += answerText.replace("media/",	mediaPathRes);
							}
							else{
								msg += answerText;
							}
							msg += '<br/>';									
							// var icon = $(data).find("page").eq(i).find("bankitem").eq(j).find("option").eq(k).attr('correct') !== "true" ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
							// msg += icon + '<br/>';
						}								
					}
	 				break;	
 				case 'sequence':
 					var optionsArr = [];
	 				var optionCount = $(data).find("page").eq(i).find("option").length;
					for(var j = 0; j < optionCount; j++){	
						var optionOrder = j+1;
						optionsArr.push($(data).find("page").eq(i).find("option[correct="+optionOrder+"]").find("content").text());
					}	

					optionsArr = shuffleArray(optionsArr);
					for(var j = 0; j < optionCount; j++){	
						msg += optionsArr[j];
						msg += '<br/>';
					}						 					
 					break;
 				case 'textInput':
 					var questionCount = $(data).find("page").eq(i).find("question").length;
 					for (var j = 0; j < questionCount; j++) {
 						msg += '<hr style="border-top: dotted 2px;" />';
 						// msg += 'Num Attempts - ' + $(data).find("page").eq(i).find("question").eq(j).attr('attempts') + '<br/>';
 						msg += '<br/>' + $(data).find("page").eq(i).find("question").eq(j).find('content').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
 						// var acceptedResponseCount = $(data).find("page").eq(i).find("question").eq(j).find("acceptedresponse").length;
 						// msg += 'Accepted Responses : <br/>';
 						// for (var k = 0; k < acceptedResponseCount; k++) {
 						// 	msg += $(data).find("page").eq(i).find("question").eq(j).find('acceptedresponse').eq(k).text() + '<br/>';
 						// }
 					}
 					break;	
				case 'slider':
					msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
					msg += $(data).find("page").eq(i).find('slider').first().find('content').text()+ '<br/>';
					// msg += $(data).find("page").eq(i).find('slider').attr('correctanswer');
					break;
				case "essayCompare":	
					msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
					// msg += '<h3>Expert Response</h3>';
					// msg += $(data).find("page").eq(i).find('correctresponse').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
					break	 						
				case "textOnly":	
					var _myContent = myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
					msg += '<br/>' + _myContent + '<br/>';
				
					break;	
				case "completion":
				case "graphicOnly":
				case "bottom":
				    msg += '<div id="graphicHolder" class="antiscroll-wrap"><div class="box"><div id="mediaHolder" class="antiscroll-inner"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(i).attr('alt') + '"></div></div></div></div>';
					var mediaLink = $(data).find("page").eq(i).attr('img');	 	
					var myImage = coursePath + "/" + lessonTitle + "/media/" + mediaLink;
			        var parts = myImage.split('.'), i, l;
			        var last = parts.length; 
			        var mediaType = (parts[last - 1]);	
			        if(mediaType != 'swf' && mediaType != 'html' && mediaType != 'htm' && mediaType != 'mp4' && mediaType != 'youtube'){
			        	msg += '<img class="print" alt="" src="'+myImage+'" >';
			        	msg += '<br/><div id="caption" class="print"> ' + $(data).find("page").eq(i).find('caption').first().text() + '</div><br/>';
			        }
			        else{
			        	resources_arr.push(mediaLink);			        	
			        	msg += '<div class="resource-holder"></div><br/>';
			        	msg += '<div class="resource-name">['+ resources_arr.length + '] ' +  mediaLink + '</div>';
			        }	

					var _myContent = myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
					msg += '<br/>' + _myContent + '<br/>';

					if($(data).find("page").eq(i).attr('enlarge') != undefined && $(data).find("page").eq(i).attr('enlarge') != "" && $(data).find("page").eq(i).attr('enlarge') != " "){
				        var largeImg = $(data).find("page").eq(currentPage).attr('enlarge');
						msg += splitPage($(data).find("page").eq(i).find('title').first().text());
											
						msg += '<img class="print" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +largeImg+'" >';					        
				    }

				    if($(data).find("page").eq(i).attr('popup') != "" && $(data).find("page").eq(i).attr('popup') != undefined){
				        var media_arr = $(data).find("page").eq(i).attr('popup').split(",");
				        var caption_arr = $(data).find("page").eq(i).attr('popcaps').split("!!!");
						var alt_arr = $(data).find("page").eq(i).attr('popalt').split("!!!");
						for (var j = 0; j < media_arr.length; j++) {	
							//create a new page for every image in gallery
							msg += splitPage($(data).find("page").eq(i).find('title').first().text());
												
							msg += '<img class="print" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +media_arr[j]+'" >';
							msg += '<br/><div id="caption" class="print"> ' + caption_arr[j] + '</div><br/>';
						}
				    }				        			
					break;	
				case "top":	
					var _myContent = myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
					msg += '<br/>' + _myContent + '<br/>';
				    msg += '<div id="graphicHolder" class="antiscroll-wrap"><div class="box"><div id="mediaHolder" class="antiscroll-inner"> <div id="loader" class="loading" alt="' + $(data).find("page").eq(i).attr('alt') + '"></div></div></div></div>';
					var mediaLink = $(data).find("page").eq(i).attr('img');	 	
					var myImage = coursePath + "/" + lessonTitle + "/media/" + mediaLink;
			        var parts = myImage.split('.'), i, l;
			        var last = parts.length; 
			        var mediaType = (parts[last - 1]);	
			        if(mediaType != 'swf' && mediaType != 'html' && mediaType != 'htm' && mediaType != 'mp4' && mediaType != 'youtube'){
			        	msg += '<img class="print" alt="" src="'+myImage+'" >';
			        	msg += '<br/><div id="caption" class="print"> ' + $(data).find("page").eq(i).find('caption').first().text() + '</div><br/>';			        	        	
			        }	
			        else{
			        	resources_arr.push(mediaLink);			        	
			        	msg += '<div class="resource-holder"></div><br/>';
			        	msg += '<div class="resource-name">['+ resources_arr.length + '] ' +  mediaLink + '</div>';
			        }	

					if($(data).find("page").eq(i).attr('enlarge') != undefined && $(data).find("page").eq(i).attr('enlarge') != "" && $(data).find("page").eq(i).attr('enlarge') != " "){
				        var largeImg = $(data).find("page").eq(currentPage).attr('enlarge');
						msg += splitPage($(data).find("page").eq(i).find('title').first().text());
											
						msg += '<img class="print" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +largeImg+'" >';					        
				    }
				    if($(data).find("page").eq(i).attr('popup') != "" && $(data).find("page").eq(i).attr('popup') != undefined){
				        var media_arr = $(data).find("page").eq(i).attr('popup').split(",");
				        var caption_arr = $(data).find("page").eq(i).attr('popcaps').split("!!!");
						var alt_arr = $(data).find("page").eq(i).attr('popalt').split("!!!");
						for (var j = 0; j < media_arr.length; j++) {	
							//create a new page for every image in gallery
							msg += splitPage($(data).find("page").eq(i).find('title').first().text());	

							msg += '<img class="print" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +media_arr[j]+'" >';
							msg += '<br/><div id="caption" class="print"> ' + caption_arr[j] + '</div><br/>';
						}
				    }				        				        				
					break;	
				case "left":
					msg += '<div class="contentHolder print">';
					var _myContent = myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
					msg += '<div class="contentLeft print" >' + _myContent + '</div>' ;

					var mediaLink = $(data).find("page").eq(i).attr('img');
					var mediaCaption = $(data).find("page").eq(i).find('caption').first().text();
					msg += displayMedia(lessonTitle, i, mediaLink, mediaCaption);

			        msg += '</div>';//contentholder

					if($(data).find("page").eq(i).attr('enlarge') != undefined && $(data).find("page").eq(i).attr('enlarge') != "" && $(data).find("page").eq(i).attr('enlarge') != " "){
				        var largeImg = $(data).find("page").eq(currentPage).attr('enlarge');
						msg += splitPage($(data).find("page").eq(i).find('title').first().text());
											
						msg += '<img class="print" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +largeImg+'" >';					        
				    }

				    if($(data).find("page").eq(i).attr('popup') != "" && $(data).find("page").eq(i).attr('popup') != undefined){
				        var media_arr = $(data).find("page").eq(i).attr('popup').split(",");
				        var caption_arr = $(data).find("page").eq(i).attr('popcaps').split("!!!");
						var alt_arr = $(data).find("page").eq(i).attr('popalt').split("!!!");
						for (var j = 0; j < media_arr.length; j++) {
							//create a new page for every image in gallery
							msg += splitPage($(data).find("page").eq(i).find('title').first().text());

							msg += '<img class="print part" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +media_arr[j]+'" >';
							if(caption_arr[j] != "" && caption_arr[j] != " "){
								msg += '<br/><div id="caption" class="print"> ' + caption_arr[j] + '</div>';
							}
							msg += '<br/>';
						}
				    }			        			        				
					break;	
				case "right":
					msg += '<br/><div class="contentHolder print">';
					//msg += displayMedia(lessonTitle, i);
					var mediaLink = $(data).find("page").eq(i).attr('img');
					var mediaCaption = $(data).find("page").eq(i).find('caption').first().text();
					msg += displayMedia(lessonTitle, i, mediaLink, mediaCaption);

					var _myContent = myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
					msg += '<div class="contentRight print" >' + _myContent + '</div>' ;				        
			        msg += '</div>';//contentholder

					if($(data).find("page").eq(i).attr('enlarge') != undefined && $(data).find("page").eq(i).attr('enlarge') != "" && $(data).find("page").eq(i).attr('enlarge') != " "){
				        var largeImg = $(data).find("page").eq(currentPage).attr('enlarge');
						msg += splitPage($(data).find("page").eq(i).find('title').first().text());
											
						msg += '<img class="print" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +largeImg+'" >';					        
				    }			        
				    if($(data).find("page").eq(i).attr('popup') != "" && $(data).find("page").eq(i).attr('popup') != undefined){
				        var media_arr = $(data).find("page").eq(i).attr('popup').split(",");
				        var caption_arr = $(data).find("page").eq(i).attr('popcaps').split("!!!");
						var alt_arr = $(data).find("page").eq(i).attr('popalt').split("!!!");
						for (var j = 0; j < media_arr.length; j++) {
							//create a new page for every image in gallery
							msg += splitPage($(data).find("page").eq(i).find('title').first().text());

							msg += '<img class="print part" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +media_arr[j]+'" >';
							msg += '<br/><div id="caption" class="print"> ' + caption_arr[j] + '</div><br/>';
						}
				    }			        	 
			        break;					
				case "sidebar":	
					msg += '<br/><div class="contentHolder print">';
					var _myContent = myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
					msg += '<br/>' + '<div class="contentLeft print" >' + _myContent + '</div>';
					var sidebarContent = $(data).find("page").eq(i).find("sidebar").first().text();
					msg += '<div id="sidebarHolder"><div id="sidebar" class="sidebar">'+ sidebarContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/") +'</div></div></div>';
					break;
				case "clickImage":	
				case "revealRight":
					msg += myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
					var revealCount = $(data).find("page").eq(i).find("reveal").length;
					var mediaWidth = $(data).find("page").eq(i).attr('w');
					var mediaHeight = $(data).find("page").eq(i).attr('h');
					var labeled = false;
					if($(data).find("page").eq(i).attr('labeled') == "true"){
						labeled = true;
					}
					
					for(var j = 0; j < revealCount; j++){
						var currentImg = $(data).find("page").eq(i).find("reveal").eq(j).attr("img");
						var tmpContent = $(data).find("page").eq(i).find("reveal").eq(j).find("content").text();
						var tmpCaption = $(data).find("page").eq(i).find("reveal").eq(j).find("caption").text();
						msg += '<div class="contentHolder print reveal">';
						msg += '<div class="mediaHolder print">'; 	
						msg += "<img class=\"print part\" src='"+coursePath + "/" + lessonTitle + "/media/"+currentImg+"' width='"+ mediaWidth +"' height='"+ mediaHeight +"'/>";	
						if(labeled){
							msg += "<div id='mediaLabel' class='mediaLabel'>"+$(data).find("page").eq(i).find("reveal").eq(j).attr("label")+"</div>";
						}
						msg += '</div>';
						msg += '<div class="contentRight print" >' + tmpContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/") + '</div>' ;	
						msg += '</div>';					
						msg += '<br/>';										
					}

			        
					break;
				case "tabsOnly":
					msg += '<br/>' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
					var tabCount = $(data).find("page").eq(i).find("tab").length;
					for(var j = 0; j < tabCount; j++){
						//create a new page for every tab.
						msg += splitPage($(data).find("page").eq(i).find('title').first().text());

						var currentTitle = $(data).find("page").eq(i).find("tab").eq(j).attr("title");				        			
						msg += '<h3>' + currentTitle + '</h3>';	
						var tmpContent = $(data).find("page").eq(i).find("tab").eq(j).text();											
						msg += 	tmpContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");				
									
					}
					break;		
				case "tabsLeft":
					var _myContent = myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
					msg += '<br/>' + _myContent;
					var tabCount = $(data).find("page").eq(i).find("tab").length;
					for(var j = 0; j < tabCount; j++){
						msg += splitPage($(data).find("page").eq(i).find('title').first().text()); 
						msg += '<div class="contentLeft print" >';
						var currentTitle = $(data).find("page").eq(i).find("tab").eq(j).attr("title");
						msg += '<h3>' + currentTitle + '</h3>';
						var tmpContent = $(data).find("page").eq(i).find("tab").eq(j).text();
						msg += 	tmpContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
						msg += '<br/>';	
						msg += '</div>';//contentLeft print
						var mediaLink = $(data).find("page").eq(i).attr('img');
						var mediaCaption = $(data).find("page").eq(i).find('caption').first().text();
						msg += displayMedia(lessonTitle, i, mediaLink, mediaCaption);
				        															
					}
					
					if($(data).find("page").eq(i).attr('enlarge') != undefined && $(data).find("page").eq(i).attr('enlarge') != "" && $(data).find("page").eq(i).attr('enlarge') != " "){
				        var largeImg = $(data).find("page").eq(currentPage).attr('enlarge');
						msg += splitPage($(data).find("page").eq(i).find('title').first().text());
											
						msg += '<img class="print" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +largeImg+'" >';					        
				    }			        
				    if($(data).find("page").eq(i).attr('popup') != "" && $(data).find("page").eq(i).attr('popup') != undefined){
				        var media_arr = $(data).find("page").eq(i).attr('popup').split(",");
				        var caption_arr = $(data).find("page").eq(i).attr('popcaps').split("!!!");
						var alt_arr = $(data).find("page").eq(i).attr('popalt').split("!!!");
						for (var j = 0; j < media_arr.length; j++) {
							//create a new page for every image in gallery
							msg += splitPage($(data).find("page").eq(i).find('title').first().text());

							msg += '<img class="print part" alt="" src="'+coursePath + "/" + lessonTitle + "/media/" +media_arr[j]+'" >';
							msg += '<br/><div id="caption" class="print"> ' + caption_arr[j] + '</div><br/>';
						}
				    }			        						
					break;	 
				case "clickListRevealText":	
					msg += '<br/>' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
					var revealCount = $(data).find("page").eq(i).find("reveal").length;
					for(var j = 0; j < revealCount; j++){
						var tmpContent = $(data).find("page").eq(i).find("reveal").eq(j).find("content").text();
						var tmpTitle = $(data).find("page").eq(i).find("reveal").eq(j).find("title").text(); 
						msg += '<h3>' + tmpTitle + '</h3>';	
						msg += 	tmpContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
						//msg += '<br/>';										
					}
					break;
				case "flashcard":
					msg += '<br/>' + myContent.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
					var cardCount = $(data).find("page").eq(i).find("card").length;
					for(var j = 0; j < cardCount; j++){
						var tmpTerm = $(data).find("page").eq(i).find("card").eq(j).find("term").text();
						var tmpDefinition = $(data).find("page").eq(i).find("card").eq(j).find("definition").text(); 
						msg += '<h3>' + tmpTerm.replace(/media/g, coursePath + "/" + lessonTitle + "/media/") + '</h3>';	
						msg += 	tmpDefinition.replace(/media/g, coursePath + "/" + lessonTitle + "/media/");
						//msg += '<br/>';										
					}
					break; 						 																
				case "branching":
				case "pathing":	 
				case "chaining":
					//TODO
					break;		 					 						 						 						 								 							 							 						 							 													 					
	 		}

			if(audioInuse){
				msg += addAudio(audioFile);
			}	 		

			msg += '</div>';//printPage div
			msg += '</div>'; //container div
			$("#printPane").append(msg);

		}

		$('div[id="printPage"]').each(function() {
		    var len = 0;

		    $(this).children().each(function (){
		    	if($(this).attr('id') != 'footer'){
		    		len = len + $(this).height();
		    	}

		    });

		    if (len >= 600) {	        			    	
		        var splitElements = getElementsAfterSplit($(this), 600);

		        $(this).append(getFooter());

		        var pageTitle = $(this).find('#pageTitle').html();

		        var joinedElements = [];
		        for (var i = 0; i < splitElements.length; i++) {
		        	joinedElements.push($(splitElements[i]).prop('outerHTML'));
		        	$(splitElements[i]).remove();
		        }
		        joinedElements.push(getFooter());

		        $(this).parent().after($('<div class="print-container">'
		        	+'<div id="print-header" class="print">'
		        	+'<div id="logo" class="print"></div>'
		        	+'<div id="title-block" class="print"><div id="header-space" class="print"></div>'
		        	+'<div id="courseTitle" class="print">' + courseDisplayTitle + '</div>'
		        	+'<div id="lessonTitle" class="print">' + lessonDisplayTitle + '</div>'
		        	+'</div></div>'
		        	+'<div id="printPage"><div id="pageTitle" class="print" role="heading">'+pageTitle+'</div>'
		        	+joinedElements.join()
		        	+'</div></div>'));

		    }
		    else{
		    	//if footer already exists don't add one
		    	if($(this).find('div[id="footer"]').length == 0){
		    		$(this).append(getFooter());
		    	}
		    }
		});			

		// Resources page
		if(resources_arr.length != 0){
			msg = '<div class="print-container">';
			msg += '<div id="print-header" class="print">';
			msg += '<div id="logo" class="print"></div>';
			msg += '<div id="title-block" class="print"><div id="header-space" class="print"></div>';
			msg += '<div id="courseTitle" class="print">' + courseDisplayTitle + '</div>';
			msg += '<div id="lessonTitle" class="print">' + lessonDisplayTitle + '</div>';
			msg += '</div>'; //end title-block
			msg += '</div>';//end print-header
	 		msg += '<div id="printPage"><div id="pageTitle" class="print" role="heading">Resources</div>';
	 		msg += '<ol>';
	 		for (var i = 0; i < resources_arr.length; i++) {
	 			msg += '<li>' + resources_arr[i] + '</li>';
	 		}
	 		msg += '</ol>';
	 		msg += getFooter();
	 		msg += '</div>';//printPage div
			msg += '</div>'; //container div
			$("#printPane").append(msg);
		}

        $("#dialog-print").dialog({
            modal: true,
            width: 1075,
            height: 768,
            resizable: false,
            close: function (event, ui) {
                socket.removeAllListeners('receiveCoursePath');
                socket.removeAllListeners('receiveResourcePackage');
                socket.emit("closeTool", {
                	id : courseID,
                	tool : 'print'
                });
                module_arr = [];
                $(this).dialog('destroy').remove();
            },
            open: function (event, ui) {
               $('#resources-d-btn')
                .wrap('<a href="'+zipPath+'" ></a>');	                        	
            },
            buttons: [
				{
					text: "Print",
					title: "Prints the lesson.",
					click: function(){
						$('#printPane').printThis({
							//pageTitle:lessonTitle,
							importStyle: true,
							loadCSS: 'css/C_Print.css',
							printDelay: 667,
						});
					}

				},
				{
					text: "Resources",
					title: "Download lesson resources.",
					id: "resources-d-btn"				
				}
			]
        });			

		//TODO: add "../css/ProgramCSS/ProgramOverride.css";
		loadCSS(coursePath + "/css/CourseCSS/CourseOverride.css");
        loadCSS(coursePath + "/" + lessonTitle +'/css/ModuleCSS/ModuleOverride.css');

		try{$("#preloadholder").remove();} catch(e){};

     }

    function getElementsAfterSplit(item, h) {
	    var st = 0; //st = space total
	    var set = [];
	    //$(item).find('*').each(function(i, l) {
	    $(item).children().each(function(i, l) {
	       	if (st + $(this).height() <= h) {
	            st = st + $(this).height();
	        } 
	        else {
	            set.push($(this));
	        }
	    });
	    return set;
	}

	function getFooter(){
		//pageCount is impossible
		//pageCount = pageCount + 1;
    	var footer = '<br clear="all"/>';//<hr/>';
		footer += '<div id="footer" class="print"></div>';
		footer += '<hr/><div class="page-break"></div>';		
		return footer;
	}

	function splitPage(_pageTitle){
		var msg = '';
		//end the previous print-container
		msg += getFooter();			        
        msg +='</div></div>';//end printPage end print-container	

        msg += '<div class="print-container">';
        msg +='<div id="print-header" class="print">';
        msg +='<div id="logo" class="print"></div>';
        msg +='<div id="title-block" class="print"><div id="header-space" class="print"></div>';
        msg +='<div id="courseTitle" class="print">' + courseDisplayTitle + '</div>';
        msg +='<div id="lessonTitle" class="print">' + lessonDisplayTitle + '</div>';
        msg +='</div></div>';//end title-block //end print-header
        msg +='<div id="printPage"><div id="pageTitle" class="print" role="heading">'+_pageTitle+'</div>';	
        return msg;		
	}

	function displayMedia(_lessonTitle, i, _mediaLink, _mediaCaption){
		var msg = '';	
		var myImage = coursePath + "/" + _lessonTitle + "/media/" + _mediaLink;
		var parts = myImage.split('.'), i, l;
		var last = parts.length; 
		var mediaType = (parts[last - 1]);	
		msg += '<div class="mediaHolder print">';		
		if(mediaType != 'swf' && mediaType != 'html' && mediaType != 'htm' && mediaType != 'mp4' && mediaType != 'youtube'){
			msg += '<img class="print part"  alt="" src="'+myImage+'" >';
			msg += '<br/><div id="caption" class="print"> ' + _mediaCaption + '</div><br/>';	        	        	
		} 	 
        else{
        	resources_arr.push(_mediaLink);			        	
        	msg += '<div class="resource-holder"></div><br/>';
        	msg += '<div class="resource-name">['+ resources_arr.length + '] ' +  _mediaLink + '</div>';
        }	
		msg += '</div>';
		
		return msg;  	
	}

	function addAudio(_audioFile){

	    resources_arr.push(_audioFile );			        	
    	var msg = '<div class="resource-holder audio"></div>';
    	msg += '<div class="resource-name audio">['+ resources_arr.length + '] ' +  _audioFile  + '</div>';
    	return msg;
	}

	//TODO: not working
	function findPDFLinks(_content){
		//var msg = '';
		if($(_content).children().length != 0){
		    $(_content).contents().each(function(i, l) {
		    	if($(this).prop('tagName') == 'A'){
		        	// resources_arr.push($(this).prop('href'));	
		        	var href = 	$(this).prop('href');
					var parts = href.split('.'), i, l;
					var last = parts.length; 
					var mediaType = (parts[last - 1]);	
		        	console.log(href + ' : ' + mediaType);	
		        	if(mediaType == 'pdf'){
						var parts = href.split('//'), i, l;
						var last = parts.length; 
						var fileName = (parts[last - 1]);
						console.log(fileName)
		        		$(this).prop('href', './'+fileName);
		        	}        	
		        	// $(this).append('[' + resources_arr.length + ']');
		        	// msg += $(this)[0].outerHTML;//+ '[' + resources_arr.length + ']';    		
		    	}
		    	// else{
		    	// 	console.log($(this).html());
		    	// 	console.log(this.nodeType);
		    	// 	if(this.nodeType == 3){
		    	// 		msg += $(this).text();
		    	// 	}
		    	// 	else{
		    	// 		msg += $(this)[0].outerHTML;
		    	// 	}
		    	// }
		    });	
		}
		// else{
		// 	msg += _content;
		// }
	    // return msg;
		return _content;
	}

	function loadCSS(href) {
		var cssLink = $("<link rel='stylesheet' type='text/css' href='"+href+"'>");
		$("head").append(cssLink); 
	};

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

    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
    function destroy(){
	     try { $("#dialog-print").remove(); } catch (e) {}
	     try { $('link[href="'+coursePath + '/' + lessonTitle +'/css/ModuleCSS/ModuleOverride.css'+'"]').remove(); } catch (e) {}
	     try { $('link[href="'+coursePath + '/css/CourseCSS/CourseOverride.css'+'"]').remove(); } catch (e) {}

    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}