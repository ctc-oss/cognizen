/*
 *  	C_MediaValidator
 *  	Requires jQuery v1.9 or later
 *
 *      Houses functionality to validate all referenced and unreferenced media
 *  	Version: 0.5
 *		Date Created: 07/11/16
 */
function C_MediaValidator(_myItem, _myParent) {

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
    var totalVMModules;									//Number of modules in course
    var loadedVMModules;									//Variable to track how many module xml files have been loaded.
	var mediaArr = [];
	var removedArr = [];

    $(document).ready(function(){
    	initMediaValidator();
    });

    socket.on('receiveCoursePath', function (data){
		receiveCoursePath(data);
    });

    this.refreshVMData = function(){
	   refreshVMData();
    }

    function refreshVMData(){
	    if(refreshExpected == true){
		   module_arr = [];
		   indexItem_arr = [];
		   loadedVMModules = 0;
		   refreshExpected = false;

		   $.ajax({
			   type: "GET",
			   url: courseXMLPath,
			   dataType: "xml",
			   async: false,
			   success: importVMItems,
			   error: function(){
				   alert("unable to load content data")
			   }
			});
		}
    }

	 /************************************************************************************
     initMediaValidator()
     -- reach out to the node server and get the path to the course.
     ************************************************************************************/
     function initMediaValidator(){
     	loadedVMModules = 0;
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
	     coursePath = [window.location.protocol, '//', window.location.host, '/programs/', decodeURIComponent(data.path)].join('').replace(/\\/g, "/");
	     var xmlPath = coursePath + "/course.xml";
	     courseXMLPath = xmlPath;
	     $.ajax({
		    type: "GET",
		    url: xmlPath,
		    dataType: "xml",
		    async: false,
		    success: importVMItems,
		    error: function(){
			    alert("unable to load content data")
		    }
		});
     }

     /************************************************************************************
     importVMItems(_data);
     -- store the course.xml in courseData variable to read and manipulate as needed.
     -- call functionimport each of the module content.xml files.
     ************************************************************************************/
     function importVMItems(_data){
	     courseData = _data;

	     //TODO: course level not yet implemented
		if(currentCourseType === 'course'){
		    totalVMModules = $(courseData).find("item").length;

			if(totalVMModules > 0){
				for(var y = 0; y < totalVMModules; y++){
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
				buildVMInterface();
			}

		}
		else{
			totalVMModules = 1;
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
		    success: importVMModuleItemComplete,
		    error: function(){
			    alert("unable to load module data for " + _path);
		    }
		});
     }


     /************************************************************************************
     importVMModuleItemComplete(_data);
     -- attach module content.xml to appropriate module_arr item
	 -- Check if all are downloaded then move on.
     ************************************************************************************/
     function importVMModuleItemComplete(_data){
	     for(var i = 0; i < module_arr.length; i++){
	     	//removes special characters from content.xml lessonTitle attr so it can be compared to the 
	     	//name attr from course.xml that is limited to alphanumberic
	     	var strippedContentLessonTitle = $(_data).find("lessonTitle").attr("value").replace(/[^\w\s]/gi, '');
		     if(strippedContentLessonTitle == module_arr[i].name){
			     module_arr[i].xml = _data;
		     }
	     }
	     loadedVMModules++;
	     if(loadedVMModules === totalVMModules){
		     buildVMInterface(module_arr[0]);
	     }
     }


     /************************************************************************************
	 buildVMInterface()
     -- build menuing system and add functionalities
     ************************************************************************************/
     function buildVMInterface(_mod){
     	try {$("#dialog-mv").dialog("close");} catch (e) {}
        socket.emit('readMediaDir', _mod, function(fdata){

            if(fdata == ''){
            	console.log("fdata is empty");
            }
            else{

	            for (var k = 0; k < fdata.length; k++) {
	            	if(fdata[k].parentDir !== "edge_includes" && fdata[k].path !== "loadingIcon.gif"){
	            		mediaArr.push(fdata[k].path);
	            	}
	            }

		     	var thisID;
		     	indexItem_arr = [];

		     	var searchTitle = $(courseData).find('course').first().attr("name");
		     	if(currentCourseType === 'lesson'){
		     		searchTitle = $(courseData).find("item[id='"+courseID+"']").attr("name");
		     	}

		     	var data = module_arr[0].xml;
		     	var totalPages = $(data).find('page').length;
		     	msg = '<div id="dialog-mv" title="Media Validator '+ searchTitle + ':">';
			    msg += '<div id="mvPane" class="pane">'
			    msg += '<div id="mediaValidatorPane" class="paneContent">';
			    msg += '<h3>Preferences</h3>';
			    var helpUrl = $(data).find('help').attr("url");
			    var icon = validateMedia(helpUrl) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
			    msg += 'help url : ' + helpUrl + " " + icon;
			    msg += '<hr/>';

				for(var i = 0; i < totalPages; i++){

				 	msg += '<h3>' + $(data).find("page").eq(i).find('title').first().text() + '</h3>';

				 	var poster = $(data).find("page").eq(i).attr('poster');
				 	if(typeof poster !== typeof undefined && poster !== 'null' && poster !== ''){
				 		icon = validateMedia(poster) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
				 		msg += 'poster : ' + poster + " " + icon + '<br/>';
				 	}

				 	var img = $(data).find("page").eq(i).attr('img');
				 	if(typeof img !== typeof undefined && img !== 'null' && img !== '' && img.indexOf('http') === -1){
				 		//var icon = validateMedia(img) !== true ? 'BLAH T' : 'BLAH F';
				 		icon = validateMedia(img) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
				 		msg += 'img : ' + img + " " + icon + '<br/>';

				 		//if mp4 check for .srt file
				 		var ext = img.split('.').pop();
				 		if(ext === 'mp4'){
				 			var srt = img.replace(/\.[^/.]+$/, ".srt");
				 			if($.inArray(srt, mediaArr) !== -1){
				 				icon = validateMedia(srt) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
								msg += 'srt : ' + srt + " " + icon + '<br/>';
				 			}
				 		}
				 	}

				 	var audio = $(data).find("page").eq(i).attr('audio');
				 	if(typeof audio !== typeof undefined && audio !== 'null' && audio !== ''){
				 		icon = validateMedia(audio) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
				 		msg += 'audio : ' + audio + " " + icon+ '<br/>';
				 	}

				 	var content = $(data).find("page").eq(i).find("content").first().text();
				 	var contentImgLength = $($.parseHTML(content)).find("img").length;
				 	if(contentImgLength != 0){
				 		for (var m = 0; m < contentImgLength; m++) {
						 	var contentImg = $($.parseHTML(content)).find("img").eq(m).attr("src");
						 	icon = validateMedia(contentImg) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
						 	msg += 'content img : ' + contentImg + " " + icon + '<br/>';
				 		}
				 	}

				 	msg += '<hr/>';
				}

				msg += '<h3>Dangling resources</h3>';
				if(mediaArr.length != 0){
					for (var i = 0; i < mediaArr.length; i++) {
						msg += mediaArr[i] + '<br/>';
					}
				}
				else{
					msg += 'All media is referenced.';
				}
			    msg += '</div>';//close the mediaValidatorPane

			    msg += '</div>';//close the mv pane
			    msg += '</div>';//close the dialog
		        //ADD menu to stage
		        $("#stage").append(msg);


		        $("#dialog-mv").dialog({
		            modal: true,
		            width: 1024,
		            height: 768,
		            resizable: false,
		            close: function (event, ui) {
		                socket.removeAllListeners('receiveCoursePath');
		                socket.emit("closeTool", {
		                	id : courseID,
		                	tool : 'media'
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
								$('#mediaValidatorPane').printThis({pageTitle:searchTitle});
							}
						}
					]	            
		        });
		    }


			try{$("#preloadholder").remove();} catch(e){};
        });
     }

     function validateMedia(_media){
     	_media = _media.replace('media/', '');
     	if($.inArray(_media, mediaArr) !== -1){
     		mediaArr = $.grep(mediaArr, function(value){
     			return value != _media;
     		});
     		removedArr.push(_media);
     		return true;
     	}
     	else{
     		//check if media is one that was already removed
	     	if($.inArray(_media, removedArr) !== -1){
	     		return true;
	     	}
	     	else{    		
     			return false;
     		}
     	}
     }

    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
    function destroy(){
	     try { $("#dialog-mv").remove(); } catch (e) {}

    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}