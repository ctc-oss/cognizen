/*
 *  	C_Search
 *  	Requires jQuery v1.9 or later
 *
 *      Houses functionality to search course and lessons
 *  	Version: 0.5
 *		Date Created: 09/11/15
 */
function C_Search(_myItem) {

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
    var totalSearchModules;									//Number of modules in course
    var loadedSearchModules;									//Variable to track how many module xml files have been loaded.
	var module_arr = [];										//Array holding all module data
																/*id: "533edfe1cb89ab0000000001"
																name: "z9"
																parent: "531f3654c764a5609d000003"
																parentDir: "Course 1"
																path: "VA/Course 1/z9"
																permission: "admin"
																type: "lesson"*/
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

    $(document).ready(function(){
    	initSearch();
    });

    socket.on('receiveCoursePath', function (data){
		receiveCoursePath(data);
    });

    this.refreshSearchData = function(){
	   refreshSearchData();
    }

    function refreshSearchData(){
	    if(refreshExpected == true){
		   module_arr = [];
		   indexItem_arr = [];
		   loadedSearchModules = 0;
		   refreshExpected = false;

		   $.ajax({
			   type: "GET",
			   url: courseXMLPath,
			   dataType: "xml",
			   async: false,
			   success: importSearchItems,
			   error: function(){
				   alert("unable to load content data")
			   }
			});
		}
    }

	 /************************************************************************************
     initSearch()
     -- reach out to the node server and get the path to the course.
     ************************************************************************************/
     function initSearch(){
     	loadedSearchModules = 0;
		socket.emit("getCoursePath", {
        	content: {
            	id: courseID,
                type: currentCourseType,
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
	     coursePath = [window.location.protocol, '//', window.location.host, '/programs/', data.path].join('');
	     var xmlPath = coursePath + "/course.xml";
	     courseXMLPath = xmlPath;
	     $.ajax({
		    type: "GET",
		    url: xmlPath,
		    dataType: "xml",
		    async: false,
		    success: importSearchItems,
		    error: function(){
			    alert("unable to load content data")
		    }
		});
     }

     /************************************************************************************
     importModuleItems(_data);
     -- store the course.xml in courseData variable to read and manipulate as needed.
     -- call functionimport each of the module content.xml files.
     ************************************************************************************/
     function importSearchItems(_data){
	     courseData = _data;
	     totalSearchModules = $(courseData).find("item").length;

	     if(totalSearchModules > 0){
	     	for(var y = 0; y < totalSearchModules; y++){
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
		 }else{
			 buildSearchInterface();
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
		    success: importSearchModuleItemComplete,
		    error: function(){
			    alert("unable to load module data for " + _path);
		    }
		});
     }


     /************************************************************************************
     importSearchModuleItemComplete(_data);
     -- attach module content.xml to appropriate module_arr item
	 -- Check if all are downloaded then move on.
     ************************************************************************************/
     function importSearchModuleItemComplete(_data){
	     for(var i = 0; i < module_arr.length; i++){
	     	//removes special characters from content.xml lessonTitle attr so it can be compared to the 
	     	//name attr from course.xml that is limited to alphanumberic
	     	var strippedContentLessonTitle = $(_data).find("lessonTitle").attr("value").replace(/[^\w\s]/gi, '');
		     if(strippedContentLessonTitle == module_arr[i].name){
			     module_arr[i].xml = _data;
		     }
	     }
	     loadedSearchModules++;
	     if(loadedSearchModules === totalSearchModules){
		     buildSearchInterface();
	     }
     }


     /************************************************************************************
	 buildSearchInterface()
     -- build menuing system and add functionalities
     ************************************************************************************/
     function buildSearchInterface(){
     	try {$("#dialog-search").dialog("close");} catch (e) {}

     	var thisID;
     	indexItem_arr = [];

     	msg = '<div id="dialog-search" title="Search '+ $(courseData).find('course').first().attr("name") + ':">';
	    msg += '<div id="searchPane" class="pane">'
	    msg += '<div id="searchFilterPane" class="paneContent">';
	    msg += '<div id="searchFilterContainer">';
		msg += "<div id='caseSensitiveBtn' title='Toggle case sensitive'>";
		msg += "<input type='checkbox' id='caseCheckBox'>";
		msg += "<label for='caseCheckBox'>Aa</label>";
		msg += "</div>"//end caseSensitivebtn	    
	    msg += '<div class="searchRow">';
		msg += "<div id='searchTermLabel'>find what:</div>";
		msg += "<input id='searchTerm' class='dialogInput' type='text' value='' defaultValue=''/>";
		msg += "<div id='searchBtn' title='Click to search'>Find</div>";
		msg += "<div id='searchPrevBtn' title='Click to go to the previous result'></div>";
		msg += "<div id='searchNextBtn' title='Click to go to the next result'></div>";
		msg += '</div>';//searchRow	   
		msg += '<div class="searchRow">';
		msg += "<div for='replaceTerm' id='replaceTermLabel'>replace with:</div>";
		msg += "<input id='replaceTerm' class='dialogInput' type='text' value='' defaultValue=''/>";
		msg += "<div id='replaceBtn' title='Click to replace this instance'>Replace</div>";
		msg += "<div id='replaceAllBtn' title='Click to replace all instances'>Replace All</div>";
		msg += '</div>';//searchRow	  
		msg += "</div>";//searchFilterContainer	  		
		msg += "<div id='searchCount'/>";
	    msg += '</div>';//close the search filter pane
	    msg += '<div id="searchResultsPane">';
	    msg += '<div id="searchResultNode" style="text-align: center;"></div>';
	    msg += '<div id="searchResults"></div>';
	    msg += '</div>';//searchResultsPane
	    msg += '</div>';//close the search pane
	    msg += '</div>';//close the dialog
        //ADD menu to stage
        $("#stage").append(msg);

        $('#searchTerm').keypress(function (e){
        	var key = e.which;
        	if(key == 13){
        		resultSubInstance = 1;
        		$('#searchBtn').click();
        	}
        });

        $('#replaceTerm').keypress(function (e){
        	var key = e.which;
        	if(key == 13){
        		$('#searchBtn').click();
        	}
        });

		$("#searchBtn").button({
			icons:{primary: 'ui-icon-search'}
			}).click(function(){
				searchCourse();
		}).tooltip();

		$("#searchPrevBtn").button({
			icons:{primary: 'ui-icon-arrowthick-1-w'},
			text: false,
			disabled: true
			}).click(function(){
				displayPreviousResult();
		}).tooltip();

		$("#searchNextBtn").button({
			icons:{primary: 'ui-icon-arrowthick-1-e'},
			text: false,
			disabled: true
			}).click(function(){
				displayNextResult();
		}).tooltip();			

		$("#replaceBtn").button({
			disabled: true
			}).click(function(){
				replaceInstance();
		}).tooltip();

		$("#replaceAllBtn").button({
			disabled: true
			}).click(function(){
				replaceAllInstances();
		}).tooltip();

		$("#caseCheckBox").button().click(function(){
			if(isCaseSensitive){
				isCaseSensitive = false;
			}
			else{
				isCaseSensitive = true;
			}
			console.log(isCaseSensitive);
		});
		$('#caseSensitiveBtn').tooltip().off("focusin focusout");					

     	msg = '<div id="dialog-search" title="Search '+ myItem.find("span").first().text() + ':">';
        $("#dialog-search").dialog({
            modal: true,
            width: 1024,
            height: 768,
            resizable: false,
            close: function (event, ui) {
                socket.removeAllListeners('receiveCoursePath');
                socket.emit("closeTool", {
                	id : courseID,
                	tool : 'search'
                });
                $(this).dialog('destroy').remove();
            },
            open: function (event, ui) {

            }
        });


		try{$("#preloadholder").remove();} catch(e){};
     }

     function searchCourse(){
     	results = [];
     	currentResult = 0;
     	totalInstances = 0;
     	currentInstance = 0;

		for(var j = 0; j < module_arr.length; j++){
			if(isCaseSensitive){
		     	var page = $(module_arr[j].xml).find('page').filter(function(){
					return $(this).text().indexOf($('#searchTerm').val()) >= 0;
				});
			}
			else{
		     	var page = $(module_arr[j].xml).find('page').filter(function(){
					return $(this).text().toLowerCase().indexOf($('#searchTerm').val().toLowerCase()) >= 0;
				});				
			}


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
				var instances = 0;
				if(isCaseSensitive){
			      	$element = $(page.eq(i)).find('*').filter(function(){
						return $(this).text().indexOf($('#searchTerm').val()) >= 0;
					});	
					instances = $element.text().split($('#searchTerm').val());	
				}
				else{
			      	$element = $(page.eq(i)).find('*').filter(function(){
						return $(this).text().toLowerCase().indexOf($('#searchTerm').val().toLowerCase()) >= 0;
					});		
					instances = $element.text().toLowerCase().split($('#searchTerm').val().toLowerCase());			
				}

				totalInstances = totalInstances + (instances.length - 1);

		      	for (var w = 0; w < $element.length; w++) {
		      		var elementInstance = 0;
		      		if(isCaseSensitive){
		      			elementInstance = $element.eq(w).text().split($('#searchTerm').val()).length - 1
		      		}
		      		else{
		      			elementInstance = $element.eq(w).text().toLowerCase().split($('#searchTerm').val().toLowerCase()).length - 1;
		      		}
					var result = {
						lessontitle : lessonTitle,
						pagetitle : $(page.eq(i)).find("title").first().text(),
						pageid : $(page.eq(i)).attr('id'),
						element : $element.eq(w),
						instances: elementInstance
					};
					results.push(result);		      		
		      	};		
			};
	    }

	    displayNewSearchResults();

     }

     function displayNewSearchResults(){
     	if(results.length == 0){
     		$('#searchCount').text('No results were found!');
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

     function showResult(){
     	$('#searchResults').empty();
		$('#searchResults').text(results[currentResult].element.text());

		var regex = null;
		if(isCaseSensitive){
			regex = new RegExp($('#searchTerm').val(),'g');
		}
		else{
			regex = new RegExp($('#searchTerm').val(),'gi');
		}
        
        var content = $('#searchResults').text().replace(regex, function myReplace(x){
        	return "<span class='highlightbox'>"+x+"</span>"});
        var nth = 0;
        content = content.replace(regex, function (match, i, original){
        	nth++;
        	return(nth === resultSubInstance) ? "<span class='highlight'>"+match+"</span>" : match;
        });

        $('#searchResults').html(content);

        var nodeIndex = resultSubInstance;

     	if(nodeIndex > results[currentResult].element.length){
     		nodeIndex=  results[currentResult].element.length;
     	}	        

        nodeName = results[currentResult].element.eq(nodeIndex-1).prop('nodeName');
        $('#searchResultNode').text(nodeName);

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
        if(isCaseSensitive){
        	regex = new RegExp($('#searchTerm').val(),'g');
        }
        else{
        	regex = new RegExp($('#searchTerm').val(),'gi');
	    	if(/^[A-Z]/.test(highlightedWord)){
	    		var firstCharUpper = replaceWord[0].toUpperCase();
	    		var replaceRegex = new RegExp(replaceWord[0]);
	    		replaceWord = replaceWord.replace(replaceRegex, firstCharUpper);
	    	}        	
        }

        var nth = 0;
        var content = $('#searchResults').text().trim().replace(regex, function (match){
        	nth++;
        	return(nth === resultSubInstance) ? replaceWord : match;
        });

        var node = '';
        if(nodeName == 'title'){
        	node = new DOMParser().parseFromString('<'+nodeName+'></'+nodeName+'>',  "application/xml");
        }
        else{
        	node = new DOMParser().parseFromString('<'+nodeName+'></'+nodeName+'>', "text/xml");
        }

		var nodeCDATA = node.createCDATASection(content);
		$(module_arr[moduleIndex].xml).find("page").eq(pageIndex).find(nodeName).empty();
		$(module_arr[moduleIndex].xml).find("page").eq(pageIndex).find(nodeName).append(nodeCDATA);		
		updateModuleXML(moduleIndex);	

		$('#searchResultNode').text(nodeName + ' instance updated!');
		$('#searchResults').html(content);
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
				        var content = null;
				        if(isCaseSensitive){
				        	regex = new RegExp($('#searchTerm').val(),'g');
				        	content = results[w].element.text().trim().replace(regex, replaceWord);
				        }
				        else{
				        	regex = new RegExp($('#searchTerm').val(),'gi');

					        content = results[w].element.text().trim().replace(regex, function (match){
						    	var isFirstUpper = false;
						    	if(/^[A-Z]/.test(match)){
						    		var firstCharUpper = replaceWord[0].toUpperCase();
						    		var replaceRegex = new RegExp(replaceWord[0]);
						    		replaceWord = replaceWord.replace(replaceRegex, firstCharUpper);
						    		isFirstUpper = true;
						    	}				        	
					        	return(isFirstUpper) ? replaceWord : $('#replaceTerm').val();
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
						var nodeCDATA = node.createCDATASection(content);
						$(module_arr[moduleIndex].xml).find("page").eq(pageIndex).find(localNodeName).empty();
						$(module_arr[moduleIndex].xml).find("page").eq(pageIndex).find(localNodeName).append(nodeCDATA);		
						updateModuleXML(moduleIndex);	

					}
				};
			};
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
		var xmlString  = pd.xml(xmlString);

		var moduleXMLPath = module_arr[_id].xmlPath.replace(new RegExp("%20", "g"), ' ');
		socket.emit('updateModuleXML', { myXML: xmlString, moduleXMLPath: moduleXMLPath, commit: commit, refresh: refresh, user: user ,content: {
        	id: courseID,
            type: currentCourseType,
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
	     try { $("#dialog-search").remove(); } catch (e) {}

    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}