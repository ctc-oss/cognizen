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
	var results = [];
	var currentResult = 0;
	var currentInstance = 0;
	var totalInstances = 0;
	var resultSubInstance = 1;
	var $element = null;
	var nodeName = null;
	var resultReplaced = false;
	var elementIndex = 0;
	var resultRemoved = false;
	var isCaseSensitive = false;
	var isWholeWord = false;

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
	     coursePath = [window.location.protocol, '//', window.location.host, '/programs/', decodeURI(data.path)].join('');
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
     	try {$("#dialog-search").dialog("close");} catch (e) {}
        socket.emit('readMediaDir', _mod, function(fdata){

            if(fdata == ''){
            	console.log("fdata is empty");
            }

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



			 	// if($(data).find("page").eq(i).find("page").length){

			 	// 	for(var j = 0; j < $(data).find("page").eq(i).find("page").length; j++){
			 	// 		msg += '<hr/>';
					// 	msg += '<h3>subpage - ' + $(data).find("page").eq(i).find("page").eq(j).find('title').first().text() + '</h3>';

					//  	var poster = $(data).find("page").eq(i).find("page").eq(j).attr('poster');
					//  	if(typeof poster !== typeof undefined && poster !== 'null' && poster !== ''){
					//  		msg += 'poster : ' + poster + " : " + validateMedia(poster) + '<br/>';
					//  	}		

					//  	var img = $(data).find("page").eq(i).find("page").eq(j).attr('img');
					//  	if(typeof img !== typeof undefined && img !== 'null' && img !== ''){
					//  		msg += 'img : ' + img + " : " + validateMedia(img) + '<br/>';
					//  	}						 					
						
					//  	var audio = $(data).find("page").eq(i).find("page").eq(j).attr('audio');
					//  	if(typeof audio !== typeof undefined && audio !== 'null' && audio !== ''){
					//  		msg += 'audio : ' + audio + " : " + validateMedia(audio) + '<br/>';
					//  	}						
			 	// 	}

			 	// }

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

	            }
	        });


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

	function decodeHtml(html) {
	    return $('<div>').html(html).text();
	}

     function searchCourse(){
     	results = [];
     	currentResult = 0;
     	totalInstances = 0;
     	currentInstance = 0;

     	if($('#searchTerm').val().trim().length > 0){
			for(var j = 0; j < module_arr.length; j++){
				var regex = null;
				if(isCaseSensitive && !isWholeWord){
					regex = new RegExp(containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val(),'g');
				}
				else if(!isCaseSensitive && isWholeWord){
					regex = new RegExp('\\b'+containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val()+'\\b','gi');
				}
				else if(isCaseSensitive && isWholeWord){
					regex = new RegExp('\\b'+containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val()+'\\b','g');
				}
				else{
					regex = new RegExp(containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val(),'gi');			
				}
		     	var page = $(module_arr[j].xml).find('page').filter(function(){
					if($(this).find('page').length > 0){
						var $tmpNode = $(this).clone();
						$tmpNode.find('page').remove();	
						var matchArr = decodeHtml($tmpNode.text()).match(regex); 						
						return matchArr != null;
					}
					else{
						var matchArr = decodeHtml($(this).text()).match(regex);
						return matchArr !=  null;
					}				     		
				});

				for (var i = 0; i < page.length; i++) {
					var lessonTitle;				
					if($(module_arr[j].xml).find("lessondisplaytitle").length != 0 ){
						if($(module_arr[j].xml).find("lessondisplaytitle").attr("value") != ""){
							lessonTitle = $(module_arr[j].xml).find("lessondisplaytitle").attr("value");
						}				
					}
					else{
						lessonTitle = $(module_arr[j].xml).find("lessonTitle").attr("value");
					}

					//determine number of instances on the page
					var $element = null;
					//var instances = 0;
					var trackIndex = []; //index of node on page

			      	$element = $(page.eq(i)).find('*:not(:has(*))').filter(function(index){

			      		var matchArr = decodeHtml($(this).text()).match(regex);
			      		if(matchArr != null){
			      			trackIndex.push(index);
			      			totalInstances = totalInstances + matchArr.length;
			      		}
						return matchArr !=  null;
					});
	

			      	for (var w = 0; w < $element.length; w++) {
			      		var elementInstance = 0;
			      		var matchArr = decodeHtml($element.eq(w).text()).match(regex);
			      		if(matchArr != null){
			      			elementInstance = matchArr.length;
			      		}

						var result = {
							lessontitle : lessonTitle,
							pagetitle : $(page.eq(i)).find("title").first().text(),
							pageid : $(page.eq(i)).attr('id'),
							element : $element.eq(w),
							instances: elementInstance,
							index: trackIndex[w]
						};
						results.push(result);		      		
			      	};		
				};
		    }
		}

	    displayNewSearchResults();

     }

     function displayNewSearchResults(){
     	if(results.length == 0){
     		if($('#searchTerm').val().length == 0){
				$('#searchCount').text('Search term must be specified!');
     		}
     		else{
     			$('#searchCount').text('No results were found!');
     		}
     		
     		$('#searchResults').empty();
     		$('#searchResultNode').empty();
     		$('#searchNextBtn').button('disable');
     		$("#searchPrevBtn").button('disable');
 			$('#replaceBtn').button('disable');
 			$('#replaceAllBtn').button('disable');
     	}
     	else{
     		resultSubInstance = 1;
     		currentInstance++;
     		$('#searchCount').text('Result '+currentInstance+' of ' + totalInstances + ' : ' 
     			+ results[0].lessontitle + ' : ' + results[0].pagetitle);
     		
     		if(currentInstance != totalInstances){
     			$('#searchNextBtn').button('enable');
     		}
     		else{
     			$('#searchNextBtn').button('disable');
     		}
     		

     		if($('#replaceTerm').val().length != 0){
     			$('#replaceBtn').button('enable');
     			$('#replaceAllBtn').button('enable');
     		}

     		$('#searchPrevBtn').button('disable');
     		
     		showResult();
     	}     	

     }

     function displayNextResult(){

     	if(resultRemoved){
     		resultRemoved = false;
     	}

     	var tmpInstanceCount = 0;
     	for (var i = -1; i < currentResult; i++) {
     		tmpInstanceCount = tmpInstanceCount + results[i+1].instances;
     	};

     	if(resultReplaced){
     		resultReplaced = false;
	     	if(currentInstance >= tmpInstanceCount){ 
	     		resultSubInstance = 1;
	     	}

     	}
     	else{

	     	if(currentInstance >= tmpInstanceCount){ 
	     		currentResult++;
	     		resultSubInstance = 1;
	     	}
	     	else{
	     		resultSubInstance++;
	     	}	     	

     		currentInstance++;

		}	

     	$('#searchCount').text('Result ' + currentInstance + ' of ' + totalInstances + ' : ' 
     		+ results[currentResult].lessontitle + ' : '+ results[currentResult].pagetitle);
     	if(currentInstance != 1){
     		$('#searchPrevBtn').button('enable');
     	}
     	if(currentInstance == totalInstances){
     		$('#searchNextBtn').button('disable');
     	}

		showResult(); 		
     }

     function displayPreviousResult(){

      	if(resultReplaced){
     		resultReplaced = false;
     	}

     	if(resultRemoved){
     		resultRemoved = false;
     		currentResult--;
     		resultSubInstance = results[currentResult].instances;
     		currentInstance--;
     	}
     	else{     	
	     	var tmpInstanceCount = 0;
	     	for (var i = -1; i < currentResult-1; i++) {
	     		tmpInstanceCount = tmpInstanceCount + results[i+1].instances;
	     	};

	     	if(currentInstance-1 == tmpInstanceCount){ 
	     		currentResult--;
	     		resultSubInstance = results[currentResult].instances;
	     	}
	     	else{
	     		resultSubInstance--;
	     	}    

	     	currentInstance--;

	    }

     	$('#searchCount').text('Result ' + currentInstance + ' of ' + totalInstances + ' : ' 
     		+ results[currentResult].lessontitle + ' : '+ results[currentResult].pagetitle);
     	if(currentInstance == 1){
     		$('#searchPrevBtn').button('disable');
     	}
     	if(currentInstance == totalInstances){
     		$('#searchNextBtn').button('disable');
     	}
     	else{
     		$('#searchNextBtn').button('enable');
     	}
     	showResult();

     }

	$.fn.textWalk = function (fn, str) {
		var func = jQuery.isFunction(fn);
	    var remove = [];

	    this.contents().each(jwalk);

	    // remove the replaced elements
	    remove.length && $(remove).remove();

	    function jwalk() {
	        var nn = this.nodeName.toLowerCase();
	        if (nn === '#text') {
	            var newValue;
	            if (func) {
	                fn.call(this);
	            	newValue = this.data;
	            } else {
	                newValue = this.data.replace(fn, str);
	            }

	            $(this).before(newValue);
	            remove.push(this)
	        } else if (this.nodeType === 1 && this.childNodes && this.childNodes[0] && nn !== 'script' && nn !== 'textarea') {
	            $(this).contents().each(jwalk);
	        }
	    }
	    return this;
	};

     function showResult(){
     	$('#searchResults').empty();
		$('#searchResults').html(results[currentResult].element.html().replace('<![CDATA[', '').replace(']]>',''));

		var regex = null;
		if(isCaseSensitive && !isWholeWord){
			regex = new RegExp(containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val(),'g');
		}
		else if(!isCaseSensitive && isWholeWord){
			regex = new RegExp('\\b'+containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val()+'\\b','gi');
		}
		else if(isCaseSensitive && isWholeWord){
			regex = new RegExp('\\b'+containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val()+'\\b','g');
		}
		else{
			regex = new RegExp(containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val(),'gi');			
		}
		var nth = 0;
		$('#searchResults').textWalk(function() {
		    this.data = this.data.replace(regex, function (match){
		        nth++;
		        return(nth === resultSubInstance) ? "<span class='highlight'><span class='highlightbox'>"+match+"</span></span>" : "<span class='highlightbox'>"+match+"</span>";
		    });
		});

        var nodeIndex = resultSubInstance;

     	if(nodeIndex > results[currentResult].element.length){
     		nodeIndex=  results[currentResult].element.length;
     	}	        

        nodeName = results[currentResult].element.eq(nodeIndex-1).prop('nodeName');
        var parentNode = results[currentResult].element.eq(nodeIndex-1).parent().prop('nodeName');
        $('#searchResultNode').text(parentNode + ': ' +nodeName);

     }

     function replaceInstance(){
     	var moduleIndex = 0;
     	var pageIndex = 0;
		for(var j = 0; j < module_arr.length; j++){
			var totalPages = $(module_arr[j].xml).find('page').length;
			for (var i = 0; i < totalPages; i++) {
				if(results[currentResult].pageid == $(module_arr[j].xml).find("page").eq(i).attr("id")){
					moduleIndex = j;
					pageIndex = i;
					break;
				}
			};
	    };

	    var highlightedWord = $('.highlight').text();
	    var replaceWord = $('#replaceTerm').val();

        var regex = null;
		if(isCaseSensitive && !isWholeWord){
			regex = new RegExp(containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val(),'g');
		}
		else if(!isCaseSensitive && isWholeWord){
			regex = new RegExp('\\b'+containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val()+'\\b','gi');
        	if(!containsSpecialChar($('#searchTerm').val()) && highlightedWord.toUpperCase() === highlightedWord){
        		replaceWord = replaceWord.toUpperCase();
        	}
	    	else if(/^[A-Z]/.test(highlightedWord)){
	    		var firstCharUpper = replaceWord[0].toUpperCase();
	    		var replaceRegex = new RegExp(replaceWord[0]);
	    		replaceWord = replaceWord.replace(replaceRegex, firstCharUpper);
	    	}   			
		}
		else if(isCaseSensitive && isWholeWord){
			regex = new RegExp('\\b'+containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val()+'\\b','g');
		}
        else{
        	regex = new RegExp(containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val(),'gi');
        	if(!containsSpecialChar($('#searchTerm').val()) && highlightedWord.toUpperCase() === highlightedWord){
        		replaceWord = replaceWord.toUpperCase();
        	}
	    	else if(/^[A-Z]/.test(highlightedWord)){
	    		var firstCharUpper = replaceWord[0].toUpperCase();
	    		var replaceRegex = new RegExp(replaceWord[0]);
	    		replaceWord = replaceWord.replace(replaceRegex, firstCharUpper);
	    	}   	
        }

        var nth = 0;
		$('#searchResults').textWalk(function() {
		    this.data = this.data.replace(regex, function (match){
		        nth++;
		        return(nth === resultSubInstance) ? replaceWord : match;
		    });
		});        

        $('#replaceResults').html($(module_arr[moduleIndex].xml).find("page").eq(pageIndex).find('*:not(:has(*))').eq(results[currentResult].index).html().replace('<![CDATA[', '').replace(']]>','').trim());
		nth = 0;
		$('#replaceResults').textWalk(function() {
		    this.data = this.data.replace(regex, function (match){
		        nth++;
		        return(nth === resultSubInstance) ? replaceWord : match;
		    });
		});

        var node = '';
        if(nodeName == 'title'){
        	node = new DOMParser().parseFromString('<'+nodeName+'></'+nodeName+'>',  "application/xml");
        }
        else{
        	node = new DOMParser().parseFromString('<'+nodeName+'></'+nodeName+'>', "text/xml");
        }

		var nodeCDATA = node.createCDATASection($('#replaceResults').html());
		$(module_arr[moduleIndex].xml).find("page").eq(pageIndex).find('*:not(:has(*))').eq(results[currentResult].index).empty();
		$(module_arr[moduleIndex].xml).find("page").eq(pageIndex).find('*:not(:has(*))').eq(results[currentResult].index).append(nodeCDATA);		
		updateModuleXML(moduleIndex);	

		$('#searchResultNode').text(nodeName + ' instance updated!');
		resultReplaced = true;

		if(results[currentResult].instances == 1){
			//splice result currentResult
			results.splice(currentResult, 1);
			resultRemoved = true;
		}
		else{
			results[currentResult].instances = results[currentResult].instances -1;			
		}
		totalInstances--;

    }

     function replaceAllInstances(){
     	var moduleIndex = 0;
     	var pageIndex = 0;
		for(var j = 0; j < module_arr.length; j++){
			var totalPages = $(module_arr[j].xml).find('page').length;
			for (var i = 0; i < totalPages; i++) {
				for (var w = 0; w < results.length; w++) {			
					if(results[w].pageid == $(module_arr[j].xml).find("page").eq(i).attr("id")){
						moduleIndex = j;
						pageIndex = i;

					    var replaceWord = $('#replaceTerm').val();

				        var regex = null;
				        $('#replaceResults').html(results[w].element.html().replace('<![CDATA[', '').replace(']]>','').trim());
						if(isCaseSensitive && !isWholeWord){
							regex = new RegExp(containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val(),'g');
							$('#replaceResults').textWalk(regex, replaceWord);
						}
						else if(!isCaseSensitive && isWholeWord){
							regex = new RegExp('\\b'+containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val()+'\\b','gi');
							$('#replaceResults').textWalk(function() {
							    this.data = this.data.replace(regex, function (match){
							    	var isUpper = false;
							    	if(!containsSpecialChar($('#searchTerm').val()) && match.toUpperCase() === match){
							    		replaceWord = replaceWord.toUpperCase();
							    		isUpper = true;
							    	}
							    	else if(/^[A-Z]/.test(match)){
							    		var firstCharUpper = replaceWord[0].toUpperCase();
							    		var replaceRegex = new RegExp(replaceWord[0]);
							    		replaceWord = replaceWord.replace(replaceRegex, firstCharUpper);
							    		isUpper = true;
							    	}

						        	return(isUpper) ? replaceWord : $('#replaceTerm').val();
							    });
							});							
						}
						else if(isCaseSensitive && isWholeWord){
							regex = new RegExp('\\b'+containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val()+'\\b','g');
							$('#replaceResults').textWalk(regex, replaceWord);
						}
				        else{
				        	regex = new RegExp(containsSpecialChar($('#searchTerm').val())+$('#searchTerm').val(),'gi');

							$('#replaceResults').textWalk(function() {
							    this.data = this.data.replace(regex, function (match){
							    	var isUpper = false;
							    	if(!containsSpecialChar($('#searchTerm').val()) && match.toUpperCase() === match){
							    		replaceWord = replaceWord.toUpperCase();
							    		isUpper = true;
							    	}
							    	else if(/^[A-Z]/.test(match)){
							    		var firstCharUpper = replaceWord[0].toUpperCase();
							    		var replaceRegex = new RegExp(replaceWord[0]);
							    		replaceWord = replaceWord.replace(replaceRegex, firstCharUpper);
							    		isUpper = true;
							    	}

						        	return(isUpper) ? replaceWord : $('#replaceTerm').val();
							    });
							});

				        }

						var localNodeName = results[w].element.eq(0).prop('nodeName');

				        var node = '';
				        if(localNodeName == 'title'){
				        	node = new DOMParser().parseFromString('<'+localNodeName+'></'+localNodeName+'>',  "application/xml");
				        }
				        else{
				        	node = new DOMParser().parseFromString('<'+localNodeName+'></'+localNodeName+'>', "text/xml");
				        }

				        var content = $('#replaceResults').html();
						var nodeCDATA = node.createCDATASection(content);
						$(module_arr[moduleIndex].xml).find("page").eq(pageIndex).find('*:not(:has(*))').eq(results[w].index).empty();
						$(module_arr[moduleIndex].xml).find("page").eq(pageIndex).find('*:not(:has(*))').eq(results[w].index).append(nodeCDATA);		
						

					}
				};
			};
			updateModuleXML(moduleIndex);	
	    };
	

 		$('#searchCount').text('All results were updated!');
 		$('#searchResults').empty();
 		$('#searchResultNode').empty();
 		$('#searchNextBtn').button('disable');
 		$("#searchPrevBtn").button('disable');
		$('#replaceBtn').button('disable');
		$('#replaceAllBtn').button('disable');
		results = [];

     }

     function containsSpecialChar(_term){
		var hasSpecialChar = false;
		if(/^[a-zA-Z0-9- ]*$/.test(_term) == false) {
		    hasSpecialChar = true;
		}

		var scEscape = '';
		if(hasSpecialChar){
			scEscape = "\\";
		}

		return scEscape;     	
     }

     /****************************************************************
     * Serialize XML and send it to the server.
     ****************************************************************/
     function updateModuleXML(_id, _commit, _refresh){
	 	var myData = $(module_arr[_id].xml);
		var xmlString;

		//IE being a beatch, as always - have handle xml differently.
		if (window.ActiveXObject){
	        xmlString = myData[0].xml;
		}

		if(xmlString === undefined){
			var oSerializer = new XMLSerializer();
			xmlString = oSerializer.serializeToString(myData[0]);
		}

		var commit = true;
		if(_commit == false){
			commit = false;
		}

		var refresh = false;
		if(_refresh == true){
			refresh = true;
		}
		var pd = new pp();
		xmlString  = pd.xml(xmlString);

		var moduleXMLPath = module_arr[_id].xmlPath.replace(new RegExp("%20", "g"), ' ');

     	var tmpCourseId = courseID;
     	if(currentCourseType === 'lesson'){
     		tmpCourseId = _myParent.id;
     	}

		socket.emit('updateModuleXML', { myXML: xmlString, moduleXMLPath: moduleXMLPath, commit: commit, refresh: refresh, user: user ,content: {
        	id: tmpCourseId,
            type: 'course',
            permission: currentCoursePermission
            }
		});
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