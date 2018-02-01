/*
 *  	C_AnswerKey
 *  	Requires jQuery v1.9 or later
 *
 *      Pulls out all question data from the lesson and displays answer key.
 *
 *      ©Concurrent Technologies Corporation 2018
 */
function C_AnswerKey(_myItem, _myParent) {

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
    var totalAKModules;									//Number of modules in course
    var loadedAKModules;									//Variable to track how many module xml files have been loaded.

    $(document).ready(function(){
    	initAnswerKey();
    });

    socket.on('receiveCoursePath', function (data){
		receiveCoursePath(data);
    });

    this.refreshAKData = function(){
	   refreshAKData();
    }

    function refreshAKData(){
	    if(refreshExpected == true){
		   module_arr = [];
		   indexItem_arr = [];
		   loadedAKModules = 0;
		   refreshExpected = false;

		   $.ajax({
			   type: "GET",
			   url: courseXMLPath,
			   dataType: "xml",
			   async: false,
			   success: importAKItems,
			   error: function(){
				   alert("unable to load content data")
			   }
			});
		}
    }

	 /************************************************************************************
     initAnswerKey()
     -- reach out to the node server and get the path to the course.
     ************************************************************************************/
     function initAnswerKey(){
     	loadedAKModules = 0;
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
		    success: importAKItems,
		    error: function(){
			    alert("unable to load content data")
		    }
		});
     }

     /************************************************************************************
     importAKItems(_data);
     -- store the course.xml in courseData variable to read and manipulate as needed.
     -- call functionimport each of the module content.xml files.
     ************************************************************************************/
     function importAKItems(_data){
	     courseData = _data;

	     //TODO: course level not yet implemented
		if(currentCourseType === 'course'){
		    totalAKModules = $(courseData).find("item").length;

			if(totalAKModules > 0){
				for(var y = 0; y < totalAKModules; y++){
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
				buildAKInterface();
			}

		}
		else{
			totalAKModules = 1;
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
		    success: importAKModuleItemComplete,
		    error: function(){
			    alert("unable to load module data for " + _path);
		    }
		});
     }


     /************************************************************************************
     importAKModuleItemComplete(_data);
     -- attach module content.xml to appropriate module_arr item
	 -- Check if all are downloaded then move on.
     ************************************************************************************/
     function importAKModuleItemComplete(_data){
	     for(var i = 0; i < module_arr.length; i++){
	     	//#4929 updated to compare ids instead of names
		     if($(_data).find("id").attr("value") == module_arr[i].id){
			     module_arr[i].xml = _data;
		     }
	     }
	     loadedAKModules++;
	     if(loadedAKModules === totalAKModules){
		     buildAKInterface(module_arr[0]);
	     }
     }


     /************************************************************************************
	 buildAKInterface()
     -- build menuing system and add functionalities
     ************************************************************************************/
     function buildAKInterface(_mod){
     	try {$("#dialog-answerkey").dialog("close");} catch (e) {}

     	var thisID;
     	indexItem_arr = [];

     	var data = module_arr[0].xml;
     	var totalPages = $(data).find('page[type="kc"]').length;

	    if(totalPages == 0){
	    	alert('No pages contain assessment based pages in this lesson.');
		    socket.removeAllListeners('receiveCoursePath');
            socket.emit("closeTool", {
            	id : courseID,
            	tool : 'answerkey'
            });
            module_arr = [];
	    }
	    else{
	     	var searchTitle = $(courseData).find('course').first().attr("name");
	     	if(currentCourseType === 'lesson'){
	     		searchTitle = $(courseData).find("item[id='"+courseID+"']").attr("name");
	     	}

	     	msg = '<div id="dialog-answerkey" title="Answer Key (Beta) : '+ searchTitle + ':">';
		    msg += '<div id="akPane" class="pane">'
		    msg += '<div id="answerKeyPane" class="paneContent">';

			for(var i = 0; i < totalPages; i++){
				totalPages = $(data).find('page').length;
				if($(data).find("page").eq(i).attr('type') === 'kc'){
			 		msg += '<h3>' + $(data).find("page").eq(i).find('title').first().text() + '</h3>';
			 		var layout = $(data).find("page").eq(i).attr('layout');
					var attempts = $(data).find("page").eq(i).attr('attempts');
					if(typeof attempts === typeof undefined){ attempts = 'N/A'}
			 		var graded = $(data).find("page").eq(i).attr('graded') !== "true" ? 'Not Graded' : 'Graded';
			 		var mandatory = $(data).find("page").eq(i).attr('mandatory') !== "true" ? 'Not Mandatory' : 'Mandatory';
			 		var randomize = $(data).find("page").eq(i).attr('randomize') !== "true" ? 'Not Randomized' : 'Randomized';

			 		msg += layout + " : Num Attempts - " + attempts + " : " + graded + " : " + mandatory + ' : Answers are ' + randomize +'<br/>'; 
			 		console.log(layout);
			 		switch(layout){
			 			case 'multipleChoice':
			 			case 'multipleChoiceMedia':
			 				msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
			 				var optionCount = $(data).find("page").eq(i).find("option").length;
							for(var j = 0; j < optionCount; j++){
								var answerText = $(data).find("page").eq(i).find("option").eq(j).find("content").text();
								if(answerText.indexOf("src=") != -1){
									var mediaPathRes = "programs/"+currentProject+"/"+$(courseData).find('course').first().attr("name")+"/"+searchTitle+"/media/";
									msg += answerText.replace("media/",	mediaPathRes);
								}
								else{
									msg += answerText;
								}
								var icon = $(data).find("page").eq(i).find("option").eq(j).attr('correct') !== "true" ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
								msg += icon + '<br/>';
							}		 				
			 				break;			 				
			 			case 'matching':
			 				msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
			 				var optionCount = $(data).find("page").eq(i).find("option").length;
							for(var j = 0; j < optionCount; j++){	
								msg += $(data).find("page").eq(i).find("option").eq(j).text();
								var optionCorrect =  $(data).find("page").eq(i).find("option").eq(j).attr('correct');
								var answerText = $(data).find("page").eq(i).find("answer[correct="+optionCorrect+"]").find("content").text();
								if(answerText.indexOf("src=") != -1){
									var mediaPathRes = "programs/"+currentProject+"/"+$(courseData).find('course').first().attr("name")+"/"+searchTitle+"/media/";
									msg += ' = ' + answerText.replace("media/",	mediaPathRes);
								}
								else{
									msg += ' = ' + answerText;
								}
								msg += '<br/>';
							}	 				
			 				break;
			 			case 'matchingDrag':
			 				msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
			 				var optionCount = $(data).find("page").eq(i).find("option").length;
							for(var j = 0; j < optionCount; j++){	
								msg += $(data).find("page").eq(i).find("option").eq(j).text();
								var optionCorrect =  $(data).find("page").eq(i).find("option").eq(j).attr('correct');
								msg += ' = ' + $(data).find("page").eq(i).find("answer[correct="+optionCorrect+"]").attr('img');
								msg += '<br/>';
							}			 			
			 				break;
			 			case 'questionBank':
							var showall = $(data).find("page").eq(i).attr('showall') !== "true" ? 'showall off' : 'showall on';
							var numToComplete = $(data).find("page").eq(i).attr('tocomplete');
							var bankCount = $(data).find("page").eq(i).find("bankitem").length;
							msg += showall + ' : Num of questions is ' + bankCount + ' : Number of questions to complete is ' + numToComplete; 

							for (var j = 0; j < bankCount; j++) {
								msg += '<hr style="border-top: dotted 2px;" />';
								var bankAttempt =  $(data).find("page").eq(i).find("bankitem").eq(j).attr("attempts");
								var bankRandomize = $(data).find("page").eq(i).find("bankitem").eq(j).attr("randomize") !== 'true' ? 'Not Randomized' : 'Randomized';
								msg += 'Num Attempts - ' + bankAttempt + ' : Answers are ' +  bankRandomize + '<br/>';
								var qNum = j+1;
								msg += '<br/>' + qNum + '. ' + $(data).find("page").eq(i).find("bankitem").eq(j).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
				 				var bankOptionCount = $(data).find("page").eq(i).find("bankitem").eq(j).find("option").length;
								for(var k = 0; k < bankOptionCount; k++){
									var answerText = $(data).find("page").eq(i).find("bankitem").eq(j).find("option").eq(k).find("content").text();
									if(answerText.indexOf("src=") != -1){
										var mediaPathRes = "programs/"+currentProject+"/"+$(courseData).find('course').first().attr("name")+"/"+searchTitle+"/media/";
										msg += answerText.replace("media/",	mediaPathRes);
									}
									else{
										msg += answerText;
									}									
									var icon = $(data).find("page").eq(i).find("bankitem").eq(j).find("option").eq(k).attr('correct') !== "true" ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
									msg += icon + '<br/>';
								}								
							}
			 				break;	
		 				case 'sequence':
			 				var optionCount = $(data).find("page").eq(i).find("option").length;
							for(var j = 0; j < optionCount; j++){	
								var optionOrder = j+1;
								optionOrder = optionOrder.toString();
								msg += $(data).find("page").eq(i).find("option[correct="+optionOrder+"]").find("content").text();
								msg += '<br/>';
							}		 					
		 					break;
		 				case 'textInput':
		 					var questionCount = $(data).find("page").eq(i).find("question").length;
		 					for (var j = 0; j < questionCount; j++) {
		 						msg += '<hr style="border-top: dotted 2px;" />';
		 						msg += 'Num Attempts - ' + $(data).find("page").eq(i).find("question").eq(j).attr('attempts') + '<br/>';
		 						msg += '<br/>' + $(data).find("page").eq(i).find("question").eq(j).find('content').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
		 						var acceptedResponseCount = $(data).find("page").eq(i).find("question").eq(j).find("acceptedresponse").length;
		 						msg += 'Accepted Responses : <br/>';
		 						for (var k = 0; k < acceptedResponseCount; k++) {
		 							msg += $(data).find("page").eq(i).find("question").eq(j).find('acceptedresponse').eq(k).text() + '<br/>';
		 						}
		 					}
		 					break;	
	 					case 'slider':
	 						msg += '<br/>' + $(data).find("page").eq(i).find('question').text().trim().replace(/<[\/]{0,1}(p)[^><]*>/ig,"") + '<br/>';
	 						msg += $(data).find("page").eq(i).find('slider').first().find('content').text()+ '<br/>';
	 						msg += $(data).find("page").eq(i).find('slider').attr('correctanswer');
			 		}

			 		msg += '<hr/>';
			 	}
			}
		    msg += '</div>';//close the answerKeyPane

		    msg += '</div>';//close the mv pane
		    msg += '</div>';//close the dialog
	        //ADD menu to stage
	        $("#stage").append(msg);


	        $("#dialog-answerkey").dialog({
	            modal: true,
	            width: 1024,
	            height: 768,
	            resizable: false,
	            close: function (event, ui) {
	                socket.removeAllListeners('receiveCoursePath');
	                socket.emit("closeTool", {
	                	id : courseID,
	                	tool : 'answerkey'
	                });
	                module_arr = [];
	                $(this).dialog('destroy').remove();
	            },
	            open: function (event, ui) {

	            },
	            buttons: [
					{
						text: "Print",
						title: "Prints the answer key .",
						click: function(){
							$('#answerKeyPane').printThis({pageTitle:searchTitle});
						}
					}
				]
	        });			
		}

		try{$("#preloadholder").remove();} catch(e){};

     }

    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
    function destroy(){
	     try { $("#dialog-answerkey").remove(); } catch (e) {}

    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}