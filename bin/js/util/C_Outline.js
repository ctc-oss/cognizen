/*
 *  	C_Outline
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses functionality to create course structure and sequencing
 *  	Version: 0.5
 *		Date Created: 07/12/14
 *		Created by: Philip Double
 *		Date Updated: 07/28/14
 *		Updated by: Philip Double
 */
function C_Outline(_myItem) {
	
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
    var totalOutlineModules;									//Number of modules in course
    var loadedOutlineModules;									//Variable to track how many module xml files have been loaded.
	var module_arr = [];										//Array holding all module data
																/*id: "533edfe1cb89ab0000000001"
																name: "z9"
																parent: "531f3654c764a5609d000003"
																parentDir: "Course 1"
																path: "VA/Course 1/z9"
																permission: "admin"
																type: "lesson"*/
       
    ////////////////////////////////////////////////   PAGE LEVEL VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    
    ////////////////////////////////////////////////   MENU ITEMS VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    var currentPageParentModule;
    var currentPage;
    var currentPageFamily;
    var currentMenuItem;
    var indexItem_arr;											//Array of moduleIndexItem_arr arrays which hold each button
	
	////////////////////////////////////////////////   MOVING MENU ITEMS VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    var startList;
    var hoverSubNav = false;
    var startListJSON;
    var currentDragID;
    var currentDragItem;

    
    $(document).ready(function(){
    	initOutline();
    });
    
    socket.on('receiveCoursePath', function (data){
		receiveCoursePath(data); 
    });
    
    this.refreshOutlineData = function(){
	   if(refreshExpected == true){
		   module_arr = [];
		   indexItem_arr = [];
		   loadedOutlineModules = 0;
		   refreshExpected = false; 
		   		
		   $.ajax({
			   type: "GET",
			   url: courseXMLPath,
			   dataType: "xml",
			   async: false,
			   success: importOutlineItems,
			   error: function(){
				   alert("unable to load content data")
			   }
			});
		}
    }
    	
	 /************************************************************************************
     initOutline()
     -- reach out to the node server and get the path to the course.
     ************************************************************************************/
     function initOutline(){
     	loadedOutlineModules = 0;
		socket.emit("getCoursePath", {
        	content: {
            	id: courseID,
                type: currentCourseType,
                permission: currentCoursePermission
             }
		});
     }
     
     /************************************************************************************
     recieveCoursePath(data)
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
		    success: importOutlineItems,
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
     function importOutlineItems(_data){
	     courseData = _data;
	     totalOutlineModules = $(courseData).find("item").length;

	     if(totalOutlineModules > 0){
	     	for(var y = 0; y < totalOutlineModules; y++){
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
			 buildOutlineInterface();
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
		    success: importOutlineModuleItemComplete,
		    error: function(){
			    alert("unable to load module data");
		    }
		});
     }
     
     
     /************************************************************************************
     importOutlineModuleItemComplete(_data);
     -- attach module content.xml to appropriate module_arr item
	 -- Check if all are downloaded then move on.
     ************************************************************************************/
     function importOutlineModuleItemComplete(_data){
	     for(var i = 0; i < module_arr.length; i++){
		     if($(_data).find("lessonTitle").attr("value") == module_arr[i].name){
			     module_arr[i].xml = _data;
		     }
	     }
	     loadedOutlineModules++;
	     if(loadedOutlineModules === totalOutlineModules){
		     buildOutlineInterface();
	     }
     }
     
     
     /************************************************************************************
	 buildOutlineInterface()
     -- build menuing system and add functionalities
     ************************************************************************************/     
     function buildOutlineInterface(){
     	try {$("#dialog-outline").dialog("close");} catch (e) {}
     	var thisID;
     	indexItem_arr = [];
	 	
     	msg = '<div id="dialog-outline" title="Outline '+ myItem.find("span").first().text() + ':">';
	    msg += '<div id="outlinePane" class="pane">'
	    msg += '<div id="outlineIndexPane" class="paneContent">';
	    msg += '<div class="dd" id="C_Index">';
	    msg += '<ol class="dd-list">';
	    //COURSE LEVEL
	    msg += '<li id="courseIndex" class="dd-item dd3-item outlineCourseItem" data-id="course">';
		//msg += '<div class="dd-handle dd3-handle">Drag</div>';
		msg += '<div id="courseIndexHotspot" class="dd3-content" data-id="'+ courseID+'">'+myItem.find("span").first().text() +'</div>';
		msg += '<ol class="dd-list">';
	    
	    //ADD MODULE and PAGES LEVEL  ----- Calls a separate function for cleanliness
	    for(var i = 0; i < module_arr.length; i++){
	     	msg += buildOutlineModule(i);
     	}

     	msg += '</ol></li></ol>';
     	msg += '</div>';
	    msg += '</div>';//close the outline index
	    msg += '<div id = "outlinePagePrefPane"></div>';
	    msg += '</div>';//close the outline pane
	    msg += '</div>';//close the dialog
        //ADD menu to stage
        $("#stage").append(msg);
        
        
        //Apply nestable capabilities
        $('#C_Index').nestable({maxDepth: 4})
        	.on('change', function(e, _item){
				console.log("onChange");
			})
			.on('start', function(e, _item){
				currentDragID = _item.attr('data-id');
			})
			.on('stop', function(e, _item){
				updateOrder();
			})
     	msg = '<div id="dialog-outline" title="Outline '+ myItem.find("span").first().text() + ':">';
        $("#dialog-outline").dialog({
            modal: true,
            width: 1024,
            height: 768,
            resizable: false,
            close: function (event, ui) {
                socket.emit("closeOutline");
                destroy();
            },
            open: function (event, ui) {
               
            }
        });
        
        //OPEN WITH ALL MENU ITEMS COLLAPSED
        //$('#C_Index').nestable('collapseAll');

        //CREATE A SNAPSHOT OF THE MENU TO COMPARE AGAINST
        var tmpStart = $('#C_Index').data('output', $('#nestable-output'));
		var tmpStartList   = tmpStart.length ? tmpStart : $(tmpStart.target);
		startList = tmpStartList.nestable('serialize');
        startListJSON = window.JSON.stringify(startList);
		
        //Add button listeners
        //COURSE BUTTON LISTENER
        $("#courseIndexHotspot").click(function(){
	        if(hoverSubNav == false){
		        try { currentMenuItem.addClass("dd3-visited"); } catch (e) {}
		        currentMenuItem = $(this);
				currentMenuItem.addClass("dd3-selected");
				displayCourseData($(this).attr("data-id"));
	        }
        }).hover(
	    	function () {
	    		$(this).append("<div id='outlineAdd' class='outlineModuleAdd'></div>");
	            
	            //ADD apropriate title attributes for the toolitp hints on rollovers...
	            $("#outlineAdd").attr("title", "Add a new module to your course.");
	            
	            //ADD ADD NAV
	            $("#outlineAdd").click(function(){
	            	addModuleToCourse(myItem.attr("data-id"));
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
				$("#outlineAdd").remove();
			}   
		);
        
        //START WITH COURSE SELECTED
        $("#courseIndexHotspot").click();
        
        //MODULE BUTTON LISTENERS
        addModuleClicks();
        		
		//Pages
		addPageClicks();
     }
     
     /*****************************************************************
     buildOutlineModule - builds the index for the module.
     Retruns a string representing the module and it's pages.
     Called for each module in buildOutlineInterface()
     *****************************************************************/
     function buildOutlineModule(_id){
	     var data = module_arr[_id].xml;
	     var thisID;
		 var moduleIndexItem_arr = [];
		 var totalPages = $(data).find('page').length;
		 var indexString = '<li id="'+module_arr[_id].id+'" class="dd-item dd3-item outlineModuleItem" data-id="'+ module_arr[_id].id +'">';
		 indexString += '<div class="dd-handle dd3-handle">Drag</div>';
		 indexString += '<div id="module'+ _id + 'IndexHotspot" class="dd3-content" data-id="'+ module_arr[_id].id +'">'+$(data).find("lessonTitle").attr("value") +'</div>';
		 indexString += '<ol class="dd-list">';
		 for(var i = 0; i < totalPages; i++){
		 	thisID = "module"+ _id + "indexMenuItem" + i;
		 	var pageID = $(data).find("page").eq(i).attr("id");
		 	indexString += '<li id="'+pageID+'" class="dd-item dd3-item" data-id="'+pageID+'">';
			indexString += '<div class="dd-handle dd3-handle">Drag</div>';
			indexString += '<div id="'+thisID+'" class="dd3-content" myID="'+pageID+'">'+ $(data).find("page").eq(i).find('title').first().text() +/*'<div id="commentSpot"></div>*/'</div>';
			moduleIndexItem_arr.push("#" + thisID);
		 	if($(data).find("page").eq(i).find("page").length){
		 		indexString += '<ol class="dd-list">';

		 		for(var j = 0; j < $(data).find("page").eq(i).find("page").length; j++){
			 		thisID = "module"+ _id + "indexMenuItem" + i + "lessonItem" + j;
			 		pageID = $(data).find("page").eq(i).find("page").eq(j).attr("id");
			 		indexString += '<li id="'+pageID+'" class="dd-item dd3-item" data-id="'+pageID+'">';
			 		indexString += '<div class="dd-handle dd3-handle">Drag</div>';
			 		indexString += '<div id="'+thisID+'" class="dd3-content" myID="'+pageID+'">'+ $(data).find("page").eq(i).find("page").eq(j).find('title').first().text() +/*'<div id="commentSpot"></div>*/'</div></li>';
					moduleIndexItem_arr.push("#" + thisID);
		 		}
		 		i = i + j;
		 		indexString += "</ol>"
		 	}
		 	
		 	indexString += "</li>";
		}
		indexItem_arr.push(moduleIndexItem_arr)
		indexString += '</ol></li>';
		return indexString;
     }
     
     /************************************************************************************
     addModuleClicks()
     -- Add listeners to the menu times for the course module buttons
     ************************************************************************************/
     function addModuleClicks(){
	      for(var j = 0; j < module_arr.length; j++){
	        $("#module"+j+"IndexHotspot").click(function(){
				if(hoverSubNav == false){
					//Call for when a module is clicked.
					try { currentMenuItem.addClass("dd3-visited"); } catch (e) {}
					currentMenuItem = $(this);
					currentMenuItem.addClass("dd3-selected");
					displayModuleData($(this).attr("data-id"));
				}
			});
			addOutlineRollovers($("#module"+j+"IndexHotspot"), "module");
		}
     }
     
     /************************************************************************************
     addPageClicks()
     -- Add listeners to the menu times for the course page buttons
     ************************************************************************************/
     function addPageClicks(){
	     for(var i = 0; i < indexItem_arr.length; i++){
		     var tmp_arr = [];
		     tmp_arr = indexItem_arr[i];
		     for(var j = 0; j < tmp_arr.length; j++){
			     $(tmp_arr[j]).click(function(){
					//don't fire if click subNavButtons like add or remove.
					if(hoverSubNav == false){
						//Call for when a page is clicked.
						try { currentMenuItem.addClass("dd3-visited"); } catch (e) {}
						currentMenuItem = $(this);
						currentMenuItem.addClass("dd3-selected");
						displayPageData($(this).attr("myID"));
					}
				});
				addOutlineRollovers($(tmp_arr[j]), "page");
			}
	     }
     }
     
     /******************************************************************
     Update module and page order and call appropriate XML SAVE Funcion
     Called on drop of menu item - does nothing if there is no change.
     ******************************************************************/
     function updateOrder(){
   	     //Gather the current state of the list and assign to list...
   	     var tmp = $('#C_Index').data('output', $('#nestable-output'));
		 var tmpList   = tmp.length ? tmp : $(tmp.target);
		 var list = tmpList.nestable('serialize');
		 var listJSON = window.JSON.stringify(list);
		 //If the list has changed, record that change.
		 if(listJSON != startListJSON){
			 var startNode = getNode(currentDragID);
			 var moveFrom = startNode.node;
			 var startModule = startNode.module;
			 var startModuleID = module_arr[startNode.module].id;
			 var startNodeLevel = startNode.level;
			 
			 var endNode;
			 var myInsert;
			 if($('#' + currentDragID).next().attr("id")){
			 	endNode = getNode($('#' + currentDragID).next().attr("id"));
			 	myInsert = "before";
			 }else{
				 endNode = getNode($('#' + currentDragID).prev().attr("id"));
				 myInsert = "after";
			 }
			 
			 if(endNode == undefined){
			 	endNode = getNode($('#' + currentDragID).parent().parent().attr("id"));
			 	myInsert = "into";
			 }
			 
			 var moveTo = endNode.node;
			 var endModule = endNode.module;
			 var endModuleID = module_arr[endNode.module].id;
			 var endNodeLevel = endNode.level;			 
			 
			 //MOVE from original position to updated position.
			 if(myInsert == "before" || endNodeLevel == "module"){
				 moveFrom.insertBefore(moveTo);
			 }else if (myInsert == "after"){
				 moveFrom.insertAfter(moveTo);
			 }else{
				 moveTo.append(moveFrom);
			 }	
			 
			 //REORDERING MODULES			 	 
			 if(endNodeLevel == "module" && startNodeLevel == "module"){
				 updateCourseXML();
			 }
			 //MOVING A MODULE INTO ANOTHER MODULE
			 	else if(startNodeLevel == "module" && endNodeLevel == "page"){
				 var msg = '<div id="import-moduleDialog" title="Import alert!"></div>';
				 $("#stage").append(msg);
		         $("#dialog-outline").dialog({
		            modal: true,
		            width: 400,
		            height: 300,
		            resizable: false,
		            close: function (event, ui) {
		                //socket.emit("closeOutline");
		                destroy();
		            },
		            open: function (event, ui) {
		               
		            }
		         });
				 
			 }
			 //REORDERING PAGES WITHIN MODULES
			 	else if (startNodeLevel == "page" && endNodeLevel == "page"){ 
			 	if(endModule != startModule){
				 	updateModuleXML(startModule, false);
				 }
			 	 updateModuleXML(endModule, true);
			 }
			 
			 //Update start list in case more than one change is made... 
			 //Without this, you can only make one change and then stuff get's funky.
			 var tmpStart = $('#C_Index').data('output', $('#nestable-output'));
			 var tmpStartList   = tmpStart.length ? tmpStart : $(tmpStart.target);
			 startList = tmpStartList.nestable('serialize');
			 startListJSON = window.JSON.stringify(startList);

		}
     }
     
     function getNode(_nodeID){
         var nodeData = new Object();
	     for(var i = 0; i < module_arr.length; i++){
		     if(module_arr[i].id == _nodeID){
			     nodeData.node = $(courseData).find('item[name="' +module_arr[i].name+ '"]');
			     nodeData.module = i;
			     nodeData.level = "module";
			     return nodeData; 
			     break;
		     }else{
			     var $xml = $(module_arr[i].xml)
			     
			     if($xml.find('page[id="'+_nodeID+'"]').length > 0){
			     	 nodeData.node = $xml.find('page[id="'+_nodeID+'"]');
			     	 nodeData.module = i;
			     	 nodeData.level = "page";
				     return nodeData;
				     break;
			     }
			 }
	     }
     }
     
     /****************************************************************
     * Display editable Course Preferences.
     ****************************************************************/
     function displayCourseData(_id){
     	$("#outlinePagePrefPane").empty();
	    var msg = "<div class='outlineCourseEditHeader'><b>Course Preferences: " + myItem.find("span").first().text() + "</b></div><br/>";
	    msg += "<div id='accordion'>";
     	msg += "<h3 style='padding: .2em .2em .2em 2.2em'>General</h3>";
     	msg += '<div id="general" style="font-size:100%; padding: 1em 1em; color:#666666">';	    
		msg += "<div><b>Details:</b></div>";
		msg += "<label for='out_courseTitle'>course title: </label>";
		msg += '<input type="text" name="out_courseTitle" id="out_courseTitle" title="Update the course title." value="'+ myItem.find("span").first().text() + '" class="text ui-widget-content ui-corner-all" /> <br/>';
		//end div for general
		msg += '</div>';
     	msg += '<h3 style="padding: .2em .2em .2em 2.2em">SCORM 2004 Sequencing</h3>';
		msg += '<div id="sequencing" style="font-size:100%; padding: 1em 1em; color:#666666">';		
		msg += addToggle("objectivesGlobalToSystem", "Enable shared global objective information for the lifetime of the learner in the system.");
		msg += '<br/><div id="controlModes" title="Determine what type of navigation is allowed by the user." style="float:left"><b>Determine what type of navigation is allowed by the user:</b></div>';
		msg += addToggle("choice", "Enable the table of contents for navigating among this activity’s children.");
		msg += addToggle("flow", "Enable previous and next buttons for navigating among this activity’s children.");
		msg += addToggle("forwardOnly", "Restricts the user to only moving forward through the children of this activity. Previous requests and using the table of contents go backwards is prohibited.");	
		msg += 	'<br/><br/><a href="http://scorm.com/scorm-explained/technical-scorm/sequencing/sequencing-definition-model/" target="_blank" style="float:left">Sequencing Definition Model</a>';	
		//end div for sequencing
		msg += '</div>';
		//end div for accordion
		msg += '</div>';				
		
		$("#outlinePagePrefPane").append(msg);
		
		//set objectivesGlobalToSystem based off value in xml
		if($(courseData).find('sequencing').first().attr("objectivesGlobalToSystem") === "true"){
			$('#objectivesGlobalToSystem').prop('checked',true);
		}
		else{
			$('#objectivesGlobalToSystem').prop('checked',false);
		}

		//update the xml when objectivesGlobalToSystem toggle is changed
		$("#objectivesGlobalToSystemRadio").on("change", function(){
		   if($('#objectivesGlobalToSystem').prop('checked')){
			   $(courseData).find('sequencing').first().attr("objectivesGlobalToSystem", "true");
		   } else{
			   $(courseData).find('sequencing').first().attr("objectivesGlobalToSystem", "false");
		   }
		   updateCourseXML();
		});

		//set choice based off value in xml
		if($(courseData).find('sequencing').first().attr("choice") === "true"){
			$('#choice').prop('checked',true);
		}
		else{
			$('#choice').prop('checked',false);
		}

		//update the xml when choice toggle is changed
		$("#choiceRadio").on("change", function(){
		   if($('#choice').prop('checked')){
			   $(courseData).find('sequencing').first().attr("choice", "true");
		   } else{
			   $(courseData).find('sequencing').first().attr("choice", "false");
		   }
		   updateCourseXML();
		});

		//set flow based off value in xml
		if($(courseData).find('sequencing').first().attr("flow") === "true"){
			$('#flow').prop('checked',true);
		}
		else{
			$('#flow').prop('checked',false);
		}

		//update the xml when flow toggle is changed
		$("#flowRadio").on("change", function(){
		   if($('#flow').prop('checked')){
			   $(courseData).find('sequencing').first().attr("flow", "true");
		   } else{
			   $(courseData).find('sequencing').first().attr("flow", "false");
		   }
		   updateCourseXML();
		});

		//set forwardOnly based off value in xml
		if($(courseData).find('sequencing').first().attr("forwardOnly") === "true"){
			$('#forwardOnly').prop('checked',true);
		}
		else{
			$('#forwardOnly').prop('checked',false);
		}

		//update the xml when forwardOnly toggle is changed
		$("#forwardOnlyRadio").on("change", function(){
		   if($('#forwardOnly').prop('checked')){
			   $(courseData).find('sequencing').first().attr("forwardOnly", "true");
		   } else{
			   $(courseData).find('sequencing').first().attr("forwardOnly", "false");
		   }
		   updateCourseXML();
		});		

		$("#out_courseTitle").on("change", function(){
			//ADD CODE TO PROPERLY RENAME LESSON ---------------------------------------------------------------------------------------------------------------
			var titleUpdate = $("#out_courseTitle").val().replace('<p>', '').replace('</p>', '').trim();
			currentMenuItem.text(titleUpdate);
			$(courseData).attr("name", titleUpdate);
			updateCourseXML();
			
			var data = {
	            content: {
	                id: courseID,
	                type: currentCourseType,
	                name: titleUpdate
	            },
	            user: {
	                id: user._id,
	                username: user.username
	            }
	        };
	
	        socket.emit('renameContent', data);
		}).css({'width': '500px', 'color': '#3383bb;'});
		
		/*$("#out_courseObjective").on("change", function(){
		 	//ADD CODE TO PROPERLY RENAME LESSON ---------------------------------------------------------------------------------------------------------------
		 	var titleUpdate = $("#out_pageObjective").val().trim();
		   	$(module_arr[i].xml).find('page').eq(j).attr('objective', titleUpdate);
			updateModuleXML(currentPageParentModule);
		}).css({'width': '500px', 'color': '#3383bb;'});*/

		$(function () {
			//$("div[id$='Radio']").buttonset();
			$( document ).tooltip();
			//set up jquerui accordion
			$("#accordion").accordion({
				collapsible: true,
				heightStyle: "content"
			});			
		});	


     }
     
     /****************************************************************
     * Display editable Module Preferences.
     ****************************************************************/
     function displayModuleData(_id){
     	//Find which array item to push to....
     	for(var i = 0; i < module_arr.length; i++){
			if(_id == module_arr[i].id){
				_id = i;
				break;
			}
		}
     	$("#outlinePagePrefPane").empty();
     	var msg = "<div id='header' class='outlineModuleEditHeader'><b>Module Preferences: " + $(module_arr[_id].xml).find('lessonTitle').attr("value") + "</b></div><br/>";
     	msg += "<div id='accordion'>";
     	msg += "<h3 style='padding: .2em .2em .2em 2.2em'>General</h3>";
     	msg += '<div id="general" style="font-size:100%; padding: 1em 1em; color:#666666">';
     	msg += "<div><b>Details:</b></div>";
     	msg += "<label for='lessonTitle'>lesson title: </label>";
        msg += '<input type="text" name="lessonTitle" id="lessonTitle" value="'+ $(module_arr[_id].xml).find('lessonTitle').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';
     	msg += "<div>"
     	msg += "<label for='lessonWidth'>width of lesson: </label>";
        msg += '<input type="text" name="lessonWidth" id="lessonWidth" value="'+ $(module_arr[_id].xml).find('lessonWidth').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';
        msg += "<label for='lessonHeight'>height of lesson: </label>";
        msg += '<input type="text" name="lessonHeight" id="lessonHeight" value="'+ $(module_arr[_id].xml).find('lessonHeight').attr("value") + '" class="text ui-widget-content ui-corner-all" /><br/>';
        msg += "<label for='mode'>set mode: </label>";
     	msg += "<select name='mode' id='mode'>";
     	msg += "<option>production</option>";
     	msg += "<option>review</option>";
     	msg += "<option>edit</option>";
     	msg += "</select><br/>"
		msg += "<label id='label' for='hasGlossary'>Glossary: </label>";
		msg += "<input id='hasGlossary' type='checkbox' name='hasGlossary' class='radio'/><br/><br/>";
		msg += "<div><b>Transitions:</b></div>";
     	msg += "<label for='transition'>set tranition type: </label>";
     	msg += "<select name='transition' id='transition'>";
     	msg += "<option>none</option>";
     	msg += "<option>Back.easeIn</option>";
     	msg += "<option>Back.easeInOut</option>";
     	msg += "<option>Back.easeOut</option>";
     	msg += "<option>Bounce.easeIn</option>";
     	msg += "<option>Bounce.easeInOut</option>";
     	msg += "<option>Bounce.easeOut</option>";
     	msg += "<option>Circ.easeIn</option>";
     	msg += "<option>Circ.easeInOut</option>";
     	msg += "<option>Circ.easeOut</option>";
     	msg += "<option>Ease.easeIn</option>";
     	msg += "<option>Ease.easeInOut</option>";
     	msg += "<option>Ease.easeOut</option>";
     	msg += "<option>Elastic.easeIn</option>";
     	msg += "<option>Elastic.easeInOut</option>";
     	msg += "<option>Elastic.easeOut</option>";
     	msg += "<option>Expo.easeIn</option>";
     	msg += "<option>Expo.easeInOut</option>";
     	msg += "<option>Expo.easeOut</option>";
     	msg += "<option>Linear.easeIn</option>";
     	msg += "<option>Linear.easeInOut</option>";
     	msg += "<option>Linear.easeOut</option>";
     	msg += "<option>Quad.easeIn</option>";
     	msg += "<option>Quad.easeInOut</option>";
     	msg += "<option>Quad.easeOut</option>";
     	msg += "<option>Quart.easeIn</option>";
     	msg += "<option>Quart.easeInOut</option>";
     	msg += "<option>Quart.easeOut</option>";
     	msg += "<option>Quint.easeIn</option>";
     	msg += "<option>Quint.easeInOut</option>";
     	msg += "<option>Quint.easeOut</option>";
     	msg += "<option>Sine.easeIn</option>";
     	msg += "<option>Sine.easeInOut</option>";
     	msg += "<option>Sine.easeOut</option>";
     	msg += "<option>Strong.easeIn</option>";
     	msg += "<option>Strong.easeInOut</option>";
     	msg += "<option>Strong.easeOut</option>";
     	msg += "</select> ";
     	msg += "<label for='transitionDuration'>transition duration (s): </label>";
        msg += '<input type="text" name="transitionDuration" id="transitionDuration" value="'+ $(module_arr[_id].xml).find('transitionLength').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';
     	msg += "<br/><br/>";
     	msg += "<div><b>Lock:</b></div>";
     	msg += "<label for='lockDuration'>duration for lock request (s): </label>";
        msg += '<input type="text" name="lockDuration" id="lockDuration" value="'+ $(module_arr[_id].xml).find('lockRequestDuration').attr("value") + '" class="text ui-widget-content ui-corner-all" /><br/> ';
     	msg += "</div>";
     	//end general div
     	msg += '</div>';
     	msg += '<h3 style="padding: .2em .2em .2em 2.2em">SCORM 2004 Sequencing</h3>';
		msg += '<div id="sequencing" style="font-size:100%; padding: 1em 1em; color:#666666">';
		msg += '<br/><div id="hideLMSUIValues" title="" style="float:left;"><b>Indicates which navigational UI elements the LMS should hide when this activity is being delivered:</b></div>';		
		msg += addToggle("previous", "Remove the previous button:");
		msg += addToggle("continue", "Remove the continue button:" );	
		msg += addToggle("exit", "Remove the exit button (if present):");	
		msg += addToggle("exitAll", "Remove the exitAll button (if present):");	
		msg += addToggle("abandon", "Remove the abandon button (if present):");	
		msg += addToggle("abandonAll", "Remove the abandonAll button (if present):");	
		msg += addToggle("suspendAll", "Remove the suspendAll button (if present):");
		msg += '<br/><br/><div id="controlModes" title="" style="float:left;"><b>Determine what type of navigation is allowed by the user:</b></div>';
		msg += addToggle("choice", "Enable the table of contents for navigating among this activity’s children:");
		msg += addToggle("flow", "Enable previous and next LMS navigation buttons for navigating among this activity’s children:");
		msg += addToggle("forwardOnly", "Restricts the user to only moving forward through the children of this activity: (Previous requests and using the table of contents go backwards is prohibited.)");	
		msg += addToggle("choiceExit", "Can the learner jump out of this activity using a choice request?");
		msg += '<br/><div id="sequencingRules" title="" style="float:left;"><b>Specify if-then conditions that determine which activities are available for delivery and which activity should be delivered next.: </b></div>';
		msg += addToggle("notAttemptHidden", "Hide the item in the TOC until it has been attempted:");
     	//msg += '<label title="Hide the item in the TOC until it has been attempted." style="width:350px; float:left;" >Hide in table of contents until attempted : </label>';
		//msg += '<input type="checkbox" id="notAttemptHiddenCheckbox" style="float:left;"/><label for="notAttemptHiddenCheckbox" title="Add/Remove rule.">toggle</label>';		
		msg += '<br/><br/><div id="rollupControls" title="" style="float:left;"><b>Determine which activities participate in status rollup and how their status is weighted in relation to other activities: </b></div>';
		msg += addToggle("rollupObjectiveStatisfied", "Specifies whether this activity should count towards satisfaction rollup:");
		msg += '<label for="rolluOobjectiveMeasureWeight" title="" style="float:left">Assign a weight to the score for this activity to be used in rollup.:  </label>';
		msg += '<input id="rollupObjectiveMeasureWeight" name="rollupObjectiveMeasureWeight" style="width:350px; float:left;"/>';
		msg += addToggle("rollupProgressCompletion", "Specifies whether this activity should count towards completion rollup:");		
		msg += '<br/><div id="deliveryControls" title="" style="float:left;"><b>Allow for non-communicative content to be delivered and sequenced:</b></div>';
		msg += addToggle("tracked", "Is data tracked for this activity:");
		msg += addToggle("completionSetByContent", "If false, the sequencer will automatically mark the activity as completed if it does not report any completion status.");
		msg += addToggle("objectiveSetByContent", "If false, the sequencer will automatically mark the activity as satisfied if it does not report any satisfaction status.");							     	
//type="number" min="0" max="1" step="0.01"
		msg += 	'<br/><a href="http://scorm.com/scorm-explained/technical-scorm/sequencing/sequencing-definition-model/" target="_blank" style="float:left;">Sequencing Definition Model</a>';
		//end sequencing div
		msg += '</div>';
		//end accordion div
		msg += '</div>';			
	    $("#outlinePagePrefPane").append(msg);
	   
	    //Set module settings.
	    //Mode
		$("#mode option:contains(" + $(module_arr[_id].xml).find('mode').attr("value") + ")").attr('selected', 'selected');
		$("#transition").val($(module_arr[_id].xml).find('transitionType').attr("value"));
		
		if($(module_arr[_id].xml).find('glossary').attr("value") === "true"){
			$('#hasGlossary').prop('checked',true);
		}

	    //Listeners for Module Settings
	     //MODULE TITLE CHANGE
	     $("#lessonTitle").on("change", function(){
			//Updated module title in edit pane header
			$("#header").html("<b>Module Preferences: " + $("#lessonTitle").val().trim() + "</b>");
			//Update module name in module.xml
			$(module_arr[_id].xml).find('lessonTitle').attr("value", $("#lessonTitle").val().trim());
			updateModuleXML(_id, false);
			
			//find and update module title in course.xml
			for(var j = 0; j < $(courseData).find("item").length; j++){
				if($(courseData).find("item").eq(j).attr('name') == currentMenuItem.text()){
					$(courseData).find("item").eq(j).attr('name', $("#lessonTitle").val().trim());
					updateCourseXML(false);
					break;
				}
				
			}
			
			var lessonMatchID;
			for (var i=0; i < totalOutlineModules; i++){
				if(currentMenuItem.attr("data-id") == $(courseData).find("item").eq(i).attr("id")){
					lessonMatchID = $(courseData).find("item").eq(i).attr("id");
					break;
				}
			}
			//Update title in menu
			currentMenuItem.text($("#lessonTitle").val().trim());
			
			//Send to server for rename
			var data = {
	            content: {
	                id: lessonMatchID,
	                type: "lesson",
	                name: $("#lessonTitle").val().trim()
	            },
	            user: {
	                id: user._id,
	                username: user.username
	            }
	        };
	
	        socket.emit('renameContent', data);
	    }).css({'width': '500px', 'color': '#3383bb;'});
	    //END MODULE TITLE CHANGE
	    
	    $("#mode").on("change", function(){
		    $(module_arr[_id].xml).find('mode').attr("value", $("#mode").val());
		    updateModuleXML(_id);
	    });
	    
	    $("#transition").on("change", function(){
		    $(module_arr[_id].xml).find('transitionType').attr("value", $("#transition").val());
		    if($("#transition").val() == "none"){
				$(module_arr[_id].xml).find('transition').attr("value", false);
		    }else{
				$(module_arr[_id].xml).find('transition').attr("value", true);
				$(module_arr[_id].xml).find('transitionType').attr("value", $("#transition").val());
		    }
		    updateModuleXML(_id);
	    });
	    
	    $("#transitionDuration").on("change", function(){
			$(module_arr[_id].xml).find('transitionLength').attr("value", $("#transitionDuration").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});
	    
	    $("#lockDuration").on("change", function(){
			$(module_arr[_id].xml).find('lockRequestDuration').attr("value", $("#lockDuration").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});
	    
	    $("#lessonWidth").on("change", function(){
			$(module_arr[_id].xml).find('lessonWidth').attr("value", $("#lessonWidth").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});
	    
	    $("#lessonHeight").on("change", function(){
			$(module_arr[_id].xml).find('lessonHeight').attr("value", $("#lessonHeight").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});
	    
	    $("#hasGlossary").on("change", function(){
		   if($('#hasGlossary').prop('checked')){
			   $(module_arr[_id].xml).find('glossary').attr("value", "true");
		   } else{
			   $(module_arr[_id].xml).find('glossary').attr("value", "false");
		   }
		   updateModuleXML(_id);
	    });

	    //find the index number for the item
	    var modIndex = 0;
		for(var j = 0; j < $(courseData).find("item").length; j++){
			if($(courseData).find("item").eq(j).attr('name') == currentMenuItem.text()){
				modIndex = j+1;
			}
		}

		//set sequencing toggles based off of xml
		setToggle("choice", modIndex);
		setToggle("flow", modIndex);
		setToggle("forwardOnly", modIndex);
		setToggle("choiceExit", modIndex);
		setToggle("previous", modIndex);
		setToggle("continue", modIndex);
		setToggle("exit", modIndex);
		setToggle("exitAll", modIndex);
		setToggle("abandon", modIndex);
		setToggle("abandonAll", modIndex);
		setToggle("suspendAll", modIndex);
		setToggle("tracked", modIndex);
		setToggle("completionSetByContent", modIndex);
		setToggle("objectiveSetByContent", modIndex);
		setToggle("rollupObjectiveStatisfied", modIndex);
		setToggle("rollupProgressCompletion", modIndex);

		if($(courseData).find('sequencing').eq(modIndex).find('sequencingRules').find('notattempthidden').attr('value') === "true"){
			$('#notAttemptHidden').prop('checked',true);
		}
		else{
			$('#notAttemptHidden').prop('checked',false);
		}  

		//update the xml when toggles are changed
		toggleChange("choice", modIndex);
		toggleChange("flow", modIndex);
		toggleChange("forwardOnly", modIndex);
		toggleChange("choiceExit", modIndex);
		toggleChange("previous", modIndex);
		toggleChange("continue", modIndex);
		toggleChange("exit", modIndex);
		toggleChange("exitAll", modIndex);
		toggleChange("abandon", modIndex);
		toggleChange("abandonAll", modIndex);
		toggleChange("suspendAll", modIndex);
		toggleChange("tracked", modIndex);
		toggleChange("completionSetByContent", modIndex);
		toggleChange("objectiveSetByContent", modIndex);
		toggleChange("rollupObjectiveStatisfied", modIndex);
		toggleChange("rollupProgressCompletion", modIndex);

		$('#notAttemptHidden').on("change", function(){
			if($(courseData).find('sequencing').eq(modIndex).find('sequencingRules').find('notattempthidden').length == 0){
				$(courseData).find('sequencing').eq(modIndex).find('sequencingRules').append($('<notattempthidden/>', courseData));
			}

			if($('#notAttemptHidden').prop('checked')){
			   $(courseData).find('sequencing').eq(modIndex).find('sequencingRules').find('notattempthidden').attr('value', "true");
			} else{
			   $(courseData).find('sequencing').eq(modIndex).find('sequencingRules').find('notattempthidden').attr('value', "false");
			}
			updateCourseXML();
		});	

		var currentROMWeight = $("#rollupObjectiveMeasureWeight").val();
		$(function () {
			//$("div[id$='Radio']").buttonset();
			$("input[id$='Checkbox']").button();

			//setup for rollupObjectiveMeasureWeight spinner
			$("#rollupObjectiveMeasureWeight").spinner({
				step: 0.01,
				numberFormat: "n",
				max: 1,
				min: 0,
				stop: function(event, ui){
					if(currentROMWeight != $("#rollupObjectiveMeasureWeight").val()){
						currentROMWeight = $("#rollupObjectiveMeasureWeight").val();
						$(courseData).find('sequencing').eq(modIndex).attr("rollupObjectiveMeasureWeight", $("#rollupObjectiveMeasureWeight").val());
						updateCourseXML();
					}
				}
			}).val($(courseData).find('sequencing').eq(modIndex).attr("rollupObjectiveMeasureWeight"));

			//prevent user manual input in spinner
			$("#rollupObjectiveMeasureWeight").bind("keydown", function (event){
				event.preventDefault();
			});

			//set up jquerui accordion
			$("#accordion").accordion({
				collapsible: true,
				heightStyle: "content"
			});
		});					

     }

     function addToggle(_id, title){
     	var msg = '<div id="toggleWrapper" style="float: left;"><div id="' + _id + 'Text" style="width:400px; float: left; margin: 8px">' + title + '</div>'; 
     	msg += '<div id="' + _id + 'Radio" title="'+title+'" style="float: left;">';
		// msg += '<input type="radio" id="' + _id + 'true" name="' + _id + 'Radio" /><label for="' + _id + 'true" title="Set ' + _id + ' to true.">true </label>';
		// msg += '<input type="radio" id="' + _id + 'false" name="' + _id + 'Radio" /><label for="' + _id + 'false" title="Set ' + _id + ' to false">false</label>';
		//msg += '</div></div>';
     	msg += '<div class="onoffswitch">';
		msg += '	<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="' + _id + '" >';
		msg += '	<label class="onoffswitch-label" for="' + _id + '">';
		msg += '	    <span class="onoffswitch-inner"></span>';
		msg += '	    <span class="onoffswitch-switch"></span>';
		msg += '	</label>';
		msg += '</div>';
		msg += '</div></div>';		
		return msg;     	
     }

     function setToggle(_id, index){
		if($(courseData).find('sequencing').eq(index).attr(_id) === "true"){
			$('#'+_id).prop('checked',true);
		}
		else{
			$('#'+_id).prop('checked',false);
		}     	
     }

     function toggleChange(_id, index){
		$('#'+_id+'Radio').on("change", function(){
		   if($('#'+_id).prop('checked')){
			   $(courseData).find('sequencing').eq(index).attr(_id, "true");
		   } else{
			   $(courseData).find('sequencing').eq(index).attr(_id, "false");
		   }
		   updateCourseXML();
		});	     	

     }
     
     
     function updateCourseXML(_commit){
	    var myData = $(courseData);
		var xmlString;
		//IE being a beatch, as always - have handle xml differently.
		if (window.ActiveXObject){
	        xmlString = myData[0].xml;
		}
		
		var commit = true;
		if(_commit == false){
			commit = false;
		}
		
		if(xmlString === undefined){
			var oSerializer = new XMLSerializer();
			xmlString = oSerializer.serializeToString(myData[0]);
		}
		
		var pd = new pp();
		var xmlString  = pd.xml(xmlString);
		var tmpPath = courseXMLPath.replace(new RegExp("%20", "g"), ' ');
		socket.emit('updateCourseXML', { myXML: xmlString, courseXMLPath: tmpPath, commit: commit, user: user ,content: {
        	id: courseID,
            type: currentCourseType,
            permission: currentCoursePermission
            } 
		});
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
     
          
     
     
     function displayPageData(_id){
     	var matched = false;
     	for(var i = 0; i < module_arr.length; i++){
		    for(var j = 0; j < $(module_arr[i].xml).find("page").length; j++){
		    	if(_id == $(module_arr[i].xml).find("page").eq(j).attr("id")){
			    	matched = true;
			    	currentPageParentModule = i;
			    	currentPage = j;
			     	
			     	$("#outlinePagePrefPane").empty();
				 	var msg = "<div class='outlinePageEditHeader'><b>Page Preferences: " + $(module_arr[i].xml).find('page').eq(j).find("title").first().text().trim() + "</div>";
				 	msg += "<div><b>Details:</b></div>";
				 	msg += "<b>page type: </b>" + $(module_arr[i].xml).find('page').eq(j).attr("layout") + "<br/>";
			     	msg += "<label for='out_pageTitle'>page title: </label>";
			        msg += '<input type="text" name="out_pageTitle" id="out_pageTitle" value="'+$(module_arr[i].xml).find('page').eq(j).find("title").first().text().trim()+'" class="text ui-widget-content ui-corner-all" /> <br/>';
			     	msg += "<label for='out_pageObjective'>page objective: </label>";
			        msg += '<input type="text" name="out_pageObjective" id="out_pageObjective" value="'+ $(module_arr[i].xml).find('page').eq(j).attr("objective") + '" class="text ui-widget-content ui-corner-all" /> <br/>';
			     	
			     	/*msg += "<div>"
			     	msg += "<label for='lessonWidth'>width of lesson:</label>";
			        msg += '<input type="text" name="lessonWidth" id="lessonWidth" value="'+ $(module_arr[i].xml).find('lessonWidth').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';
			        msg += "<label for='lessonHeight'>height of lesson:</label>";
			        msg += '<input type="text" name="lessonHeight" id="lessonHeight" value="'+ $(module_arr[i].xml).find('lessonHeight').attr("value") + '" class="text ui-widget-content ui-corner-all" /><br/>';
			        msg += "<label for='mode'>set mode:</label>";
			     	msg += "<select name='mode' id='mode'>";
			     	msg += "<option>production</option>";
			     	msg += "<option>edit</option>";
			     	msg += "<option>review</option>";
			     	msg += "</select><br/>"*/
			     	
			     	
     	
				 	$("#outlinePagePrefPane").append(msg);
				 	
				 	$("#out_pageTitle").on("change", function(){
				     	//ADD CODE TO PROPERLY RENAME LESSON ---------------------------------------------------------------------------------------------------------------
				     	var titleUpdate = $("#out_pageTitle").val().replace('<p>', '').replace('</p>', '').trim();
				     	currentMenuItem.text(titleUpdate);
					   	var docu = new DOMParser().parseFromString('<title></title>',  "application/xml");
					   	var newCDATA=docu.createCDATASection(titleUpdate);
					   	$(module_arr[i].xml).find('page').eq(j).find("title").first().empty();
					   	$(module_arr[i].xml).find('page').eq(j).find("title").first().append(newCDATA);
						updateModuleXML(currentPageParentModule);
				    }).css({'width': '500px', 'color': '#3383bb;'});
				    
				    $("#out_pageObjective").on("change", function(){
				     	//ADD CODE TO PROPERLY RENAME LESSON ---------------------------------------------------------------------------------------------------------------
				     	var titleUpdate = $("#out_pageObjective").val().trim();
					   	$(module_arr[i].xml).find('page').eq(j).attr('objective', titleUpdate);
						updateModuleXML(currentPageParentModule);
				    }).css({'width': '500px', 'color': '#3383bb;'});
			     	break;
		     	}
		     }
		     if(matched){
			     break;
		     }
		 }
     }
	
	/************************************************************************************************
	Function: 		addOutlineRollovers
	Param: 			myItem = The term to attach the rollover functionality to.
					level = Whether it is a module or a page.
	Description:	Called when a user rolls over an existing outline item.
	The buttons listeners attach click actions for adding and removing content on the sub buttons.
	************************************************************************************************/
	function addOutlineRollovers(myItem, _level){
		//ADD Program Level Buttons
	    myItem.hover(
	    	function () {
	    		//$(this).append("<div id='outlineAdd' class='outlineModuleAdd'></div><div id='outlineRemove' class='outlineModuleRemove'></div>");
	            
	            //ADD apropriate title attributes for the toolitp hints on rollovers...
	            if(_level == "module"){
		            $(this).append("<div id='outlineRemove' class='outlineModuleRemove'></div>");
		            //$("#outlineAdd").attr("title", "Add a new lesson to your module.");
		            $("#outlineRemove").attr("title", "Remove this module from your course.");
	            }else if (_level == "page"){
		            $(this).append("<div id='outlineAdd' class='outlineModuleAdd'></div><div id='outlineRemove' class='outlineModuleRemove'></div>");
		            $("#outlineRemove").attr("title", "Remove this page from your module.");
		            $("#outlineAdd").attr("title", "Add a new page to your module.");
	            }
	            
	            //ADD ADD NAV
	            $("#outlineAdd").click(function(){
	            	if(_level == "module"){
	            		addLessonToModule(myItem.attr("data-id"));
	            	}else{
		            	addPageToModule(myItem.attr("myID"));
	            	}
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
	            
	            //ADD REMOVE NAV
	            $("#outlineRemove").click(function(){
	            	if(_level == "module"){
	            		removeModuleFromCourse(myItem.attr("data-id"));
	            	}else{
		            	removePageFromModule(myItem.attr("myID"), myItem);
	            	}
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
				$("#outlineAdd").remove();
				$("#outlineRemove").remove();
			});   
	}
	
	/*******************************************************************************
	ADD and REMOVE FUNCTIONS
	*******************************************************************************/
	
	/************************************************************************************************
	Function: 		addModuleToCourse
	Param: 			_id = ID of the course to be added to.
	Description:	Creates a new module in the identified course.
	************************************************************************************************/
	function addModuleToCourse(_id){
		var  msg = '<div id="dialog-registerContent" title="Add New Lesson"><p class="validateTips">You are adding a new module to the ' + myItem.find("span").first().text() + ' course.</p> <p>Fill in the details below for your new module.</p><label for="myName" class="regField">name: </label><input type="text" name="myName" id="myName" value="" class="regText text ui-widget-content ui-corner-all" /></div>';
		$("#stage").append(msg);
		
		$("#dialog-registerContent").dialog({
        	modal: true,
            width: 550,
            close: function (event, ui) {
                $("#dialog-registerContent").remove();
            },
            buttons: {
                Submit: function(){
                	//Build the module data object to submit to the server.
                	refreshExpected = true;
                	var nameString = $("#myName").val();
                	var content = {
			            name: nameString,
			            user: user,
			            course: {
			                id: courseID
			            },
			            parentName: myItem.find("span").first().text()
			        };
			        socket.emit("registerLesson", content);
			        $(this).dialog("close");								    //Close dialog.
                },
                Cancel: function () {
                	$(this).dialog("close");
                }
            }
        });
	}
	
	/************************************************************************************************
	Function: 		addLessonToModule
	Param: 			_id = ID of the module to be added to.
	Description:	Creates a new lesson in the identified module and a page inside the lesson.
					Adds lesson to the end of the module.  Can then be dragged.
	************************************************************************************************/
	function addLessonToModule(_id){
		console.log("_id = " + _id);
	}
	
	/************************************************************************************************
	Function: 		addPageToModule
	Param: 			_id = ID of the module to be added to.
	Description:	Creates a new page in the identified module. 
					Creates the page after the page being added from.
	************************************************************************************************/	
	function addPageToModule(_id){
		var opt_arr = ["analyze", "apply", "calculate", "classify", "evaluate", "remember", "solve", "synthesis", "understand"];
		var content_arr = ["concepts", "equation", "facts", "principles", "procedures", "processes"];

		var msg = '<div id="dialog-addPage" title="Add Page"><p class="validateTips">Complete this form to create your new page.</p>';
		msg += '<label for="myName" class="regField">name: </label><input type="text" name="myName" id="myName" value="new page" class="regText text ui-widget-content ui-corner-all" /><br/><br/>'
		var pages= [
			{
				"capability" : "textOnly", 
				"opt" : ["understand","remember"], 
				"content" : ["facts","concepts"]
			},
			{
				"capability" : "graphicOnly", 
				"opt" : ["understand","remember"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},
			{
				"capability" : "top", 
				"opt" : ["understand","remember", "analyze"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},			
			{
				"capability" : "left", 
				"opt" : ["understand","remember", "analyze"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},
			{
				"capability" : "right", 
				"opt" : ["understand","remember", "analyze"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},
			{
				"capability" : "bottom", 
				"opt" : ["understand","remember", "analyze"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},
			{
				"capability" : "sidebar", 
				"opt" : ["understand","remember"], 
				"content" : ["facts","concepts"]
			},										
			{
				"capability" : "clickImage", 
				"opt" : ["understand","remember", "analyze", "classify", "apply"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},
			{
				"capability" : "tabsOnly", 
				"opt" : ["understand","remember", "analyze"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},
			{
				"capability" : "tabsLeft", 
				"opt" : ["understand","remember", "analyze"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},				
			{
				"capability" : "revealRight", 
				"opt" : ["understand","remember", "analyze"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},
			{
				"capability" : "revealBottom", 
				"opt" : ["understand","remember", "classify"], 
				"content" : ["facts","concepts"]
			},
			{
				"capability" : "revealLeft", 
				"opt" : ["understand","remember", "analyze"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},
			{
				"capability" : "flashcard", 
				"opt" : ["understand","remember", "classify"], 
				"content" : ["facts","concepts"]
			},	
			{
				"capability" : "sequence", 
				"opt" : ["understand","remember", "analyze"], 
				"content" : ["procedures", "processes"]
			},
			{
				"capability" : "multipleChoice", 
				"opt" : ["understand","remember", "analyze", "apply", "synthesis", "evaluate"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},
			{
				"capability" : "multipleChoiceMedia", 
				"opt" : ["understand","remember", "analyze", "apply", "synthesis", "evaluate"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},	
			{
				"capability" : "matching", 
				"opt" : ["understand","remember", "analyze", "apply"], 
				"content" : ["facts","concepts", "procedures", "processes"]
			},
			{
				"capability" : "questionBank", 
				"opt" : ["understand","remember", "analyze", "apply", "synthesis", "evaluate"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},	
			{
				"capability" : "completion", 
				"opt" : [], 
				"content" : []
			},
			{
				"capability" : "textInput", 
				"opt" : ["understand","remember", "analyze", "apply", "synthesis", "evaluate"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			},
			{
				"capability" : "essayCompare", 
				"opt" : ["understand","remember", "analyze", "apply", "synthesis", "evaluate"], 
				"content" : ["facts","concepts", "procedures", "processes", "principles"]
			}																																			
		];

		//Add the objective performance type dropdown
		msg += '<div><label for="opTypeList">Select a objective performance type:</label><select id="opTypeList" name="opTypeList">';
		msg += '<option value=""></option>';
		for(var i=0; i < opt_arr.length; i++){
			msg += '<option value="' + opt_arr[i]+ '">' + opt_arr[i] + '</option>';
		}
		msg += '</select></div>';

		//Add the content type dropdown
		msg += '<div><label for="contentTypeList">Select a content type:</label><select id="contentTypeList" name="contentTypeList">';
		msg += '<option value=""></option>';
		for(var i=0; i < content_arr.length; i++){
			msg += '<option value="' + content_arr[i]+ '">' + content_arr[i] + '</option>';
		}
		msg += '</select></div>';

		//Add the page type dropdown
		msg += '<div><label for="pageTypeList">Select a page type:</label><select id="pageTypeList" name="pageTypeList">';
		for(var i=0; i < pages.length; i++){
			msg += '<option value="' + pages[i].capability + '">' + pages[i].capability + '</option>';
		}
		msg += '</select></div>';



		msg += '</div>';
		$("#stage").append(msg);

		
		
		$("#dialog-addPage").dialog({
        	modal: true,
            width: 550,
            close: function (event, ui) {
                $("#dialog-addPage").remove();
            },
            buttons: {
                Submit: function(){
                	//TODO: add code that adds the page selected
                	//alert($("#pageTypeList").val());
                	var newPageType = $("#pageTypeList").val();
                	var newPageTitle = $("#myName").val();
					createNewPageByType(newPageType, newPageTitle, _id);
                	$(this).dialog("close");
                },
                Cancel: function () {
                	$(this).dialog("close");
                }
            }
        });		
		$(function() {
			$("#opTypeList").on("change", function() {
				filterPageList(pages);
			});
			$("#contentTypeList").on("change", function() {
				filterPageList(pages);
			});		
		});
	}
	
	/************************************************************************************************
	Function: 		createNewPageByType
	Param: 			_myType = Identifier of page type - String.
	Description:	Creates node and page data in the xml object.
	************************************************************************************************/
	function createNewPageByType(_myType, _myTitle, _id){
		//Create a Unique ID for the page
		var myID = guid();
		var myNode = getNode(_id);
		var myTitle;
		if (/\S/.test(_myTitle)) { 
			myTitle = _myTitle;
		}else{
			myTitle = "new page";
		}
		//Place a page element
		var myAddAfter = myNode.node;							//Variable for the node id
		var myModule = myNode.module;						//Parent module.
		var myModuleID = module_arr[myNode.module].id;		//module ID in case needed ----- probably can remove - leaving for now...
		var myNodeLevel = myNode.level;						//Level that the button resides on ("module", "page" so far)...
		var myXML = module_arr[myNode.module].xml;
		
		//Find insert location
		for (var i = 0; i < $(myXML).find("page").length; i++){
			if(_id == $(myXML).find("page").eq(i).attr("id")){
				var insertPoint = i;
			}
		}
		
		$(myXML).find("page").eq(insertPoint).after($('<page id="'+ myID +'" layout="'+_myType+'" audio="null" prevPage="null" nextPage="null"></page>'));
		
		var currentChildrenLength = $(myXML).find("page").eq(insertPoint).children("page").length;
		var newPage = insertPoint + currentChildrenLength + 1;
		$(myXML).find("page").eq(newPage).append($("<title>"));
		var newPageTitle = new DOMParser().parseFromString('<title></title>',  "application/xml");
		var titleCDATA = newPageTitle.createCDATASection(myTitle);
		$(myXML).find("page").eq(newPage).find("title").append(titleCDATA);
		
		
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//ADD PAGE SPECIFIC ELEMENTS
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		switch (_myType) {
			//Satic Layouts
		case "group":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).attr("type", "group");
			break;
		case "completion":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).attr("graded", "true");
			$(myXML).find("page").eq(newPage).attr("mandatory", "true");
			$(myXML).find("page").eq(newPage).attr("type", "completion");
			break;
		case "textOnly":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "graphicOnly":
			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).attr("img", "defaultTop.png");
			$(myXML).find("page").eq(newPage).attr("popup", "");
			$(myXML).find("page").eq(newPage).attr("popcaps", "");
			$(myXML).find("page").eq(newPage).attr("enlarge", "");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "top":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).attr("img", "defaultTop.png");
			$(myXML).find("page").eq(newPage).attr("popup", "");
			$(myXML).find("page").eq(newPage).attr("popcaps", "");
			$(myXML).find("page").eq(newPage).attr("enlarge", "");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "left":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).attr("popup", "");
			$(myXML).find("page").eq(newPage).attr("popcaps", "");
			$(myXML).find("page").eq(newPage).attr("enlarge", "");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "right":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).attr("popup", "");
			$(myXML).find("page").eq(newPage).attr("popcaps", "");
			$(myXML).find("page").eq(newPage).attr("enlarge", "");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "bottom":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(myXML).find("page").eq(newPage).attr("img", "defaultTop.png");
			$(myXML).find("page").eq(newPage).attr("popup", "");
			$(myXML).find("page").eq(newPage).attr("popcaps", "");
			$(myXML).find("page").eq(newPage).attr("enlarge", "");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "sidebar":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			$(myXML).find("page").eq(newPage).append($("<sidebar>"));
			var newSidebarContent = new DOMParser().parseFromString('<sidebar></sidebar>',  "text/xml");
			var sidebarCDATA = newSidebarContent.createCDATASection("<p>New Page Sidebar</p>");
			$(myXML).find("page").eq(newPage).find("sidebar").append(sidebarCDATA);
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "tabsOnly":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);

			$(myXML).find("page").eq(newPage).append($("<tab id='1' title='tab1'>"));
			var newTabContent1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA1 = newTabContent1.createCDATASection("New Tab Content");
			$(myXML).find("page").eq(newPage).find("tab").eq(0).append(tabCDATA1);

			$(myXML).find("page").eq(newPage).append($("<tab id='2' title='tab2'>"));
			var newTabContent2 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA2 = newTabContent2.createCDATASection("New Tab Content");
			$(myXML).find("page").eq(newPage).find("tab").eq(1).append(tabCDATA2);
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "tabsLeft":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);

			$(myXML).find("page").eq(newPage).append($("<tab id='1' title='tab1'>"));
			var newTabContent1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA1 = newTabContent1.createCDATASection("New Tab Content");
			$(myXML).find("page").eq(newPage).find("tab").eq(0).append(tabCDATA1);

			$(myXML).find("page").eq(newPage).append($("<tab id='2' title='tab2'>"));
			var newTabContent2 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA2 = newTabContent2.createCDATASection("<p>New Tab Content</p>");
			$(myXML).find("page").eq(newPage).find("tab").eq(1).append(tabCDATA2);

			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("default caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			$(myXML).find("page").eq(newPage).attr("type", "static");
			break;
		case "revealRight":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Image Reveal Text Content 1</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<caption>"));
			var diffFeed1 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("caption").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("title", "default title");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("alt", "Default alt text");
			
			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("<p>New Image Reveal Text Content 2</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<caption>"));
			var diffFeed2 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("caption").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("title", "default title");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("alt", "Default alt text");
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("interact", "click");
			$(myXML).find("page").eq(newPage).attr("w", "150");
			$(myXML).find("page").eq(newPage).attr("h", "150");
			$(myXML).find("page").eq(newPage).attr("type", "static");

			break;
		case "revealLeft":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Image Reveal Text Content 1</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<caption>"));
			var diffFeed1 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("caption").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("title", "default title");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("alt", "Default alt text");
			
			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("<p>New Image Reveal Text Content 2</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<caption>"));
			var diffFeed2 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("caption").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("title", "default title");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("alt", "Default alt text");
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("interact", "click");
			$(myXML).find("page").eq(newPage).attr("w", "150");
			$(myXML).find("page").eq(newPage).attr("h", "150");
			$(myXML).find("page").eq(newPage).attr("type", "static");

			break;
		case "revealTop":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Image Reveal Text Content 1</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<caption>"));
			var diffFeed1 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("caption").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("title", "default title");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("alt", "Default alt text");
			
			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("<p>New Image Reveal Text Content 2</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<caption>"));
			var diffFeed2 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("caption").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("title", "default title");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("alt", "Default alt text");
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("interact", "click");
			$(myXML).find("page").eq(newPage).attr("w", "150");
			$(myXML).find("page").eq(newPage).attr("h", "150");
			$(myXML).find("page").eq(newPage).attr("type", "static");

			break;
		case "revealBottom":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Image Reveal Text Content 1</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<caption>"));
			var diffFeed1 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("caption").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("title", "default title");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("alt", "Default alt text");
			
			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("<p>New Image Reveal Text Content 2</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<caption>"));
			var diffFeed2 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("caption").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("title", "default title");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("alt", "Default alt text");
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("interact", "click");
			$(myXML).find("page").eq(newPage).attr("w", "150");
			$(myXML).find("page").eq(newPage).attr("h", "150");
			$(myXML).find("page").eq(newPage).attr("type", "static");

			break;
		case "flashcard":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<card><term/><definition/></card>"));
			var newFront1 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack1 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA1 = newFront1.createCDATASection("New Card Term");
			var backCDATA1 = newBack1.createCDATASection("New Card Definition");
			$(myXML).find("page").eq(newPage).find("card").eq(0).find("term").append(frontCDATA1);
			$(myXML).find("page").eq(newPage).find("card").eq(0).find("definition").append(backCDATA1);
			
			$(myXML).find("page").eq(newPage).append($("<card><term/><definition/></card>"));
			var newFront2 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack2 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA2 = newFront2.createCDATASection("New Card Term");
			var backCDATA2 = newBack2.createCDATASection("New Card Definition");
			$(myXML).find("page").eq(newPage).find("card").eq(1).find("term").append(frontCDATA2);
			$(myXML).find("page").eq(newPage).find("card").eq(1).find("definition").append(backCDATA2);
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("mandatory", false);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "static");
			
			break;
			
		case "clickImage":
			$(myXML).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(myXML).find("page").eq(newPage).find("content").append(contentCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Image Reveal Text Content 1</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).append($("<caption>"));
			var diffFeed1 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).find("caption").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(0).attr("alt", "Default alt text");
			
			$(myXML).find("page").eq(newPage).append($("<reveal>"));
			var option2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("<p>New Image Reveal Text Content 2</p>");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).append($("<caption>"));
			var diffFeed2 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).find("caption").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("img", "defaultReveal.png");
			$(myXML).find("page").eq(newPage).find("reveal").eq(1).attr("alt", "Default alt text");
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("interact", "click");
			$(myXML).find("page").eq(newPage).attr("w", "150");
			$(myXML).find("page").eq(newPage).attr("h", "150");
			$(myXML).find("page").eq(newPage).attr("type", "static");

			break;
			
		case "questionBank":
			//PREPOPULATE A QUESTION BANK WITH TWO QUESTIONS
			//QUESTION 1
			$(myXML).find("page").eq(newPage).append($("<bankitem>"));
			var bankitem1 = new DOMParser().parseFromString('<bankitem></bankitem>',  "text/xml");
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input question 1.</p>");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("question").append(myQuestionCDATA);
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).attr("correct", "true");
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("False");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).attr("correct", "false");
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("That is not correct.  Please try again.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).find("feedback").append(myFeedbackCDATA);
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).attr("audio", "null");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).attr("btnText", "Submit");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(0).attr("randomize", false);
			
			//QUESTION 2
			$(myXML).find("page").eq(newPage).append($("<bankitem>"));
			var bankitem2 = new DOMParser().parseFromString('<bankitem></bankitem>',  "text/xml");
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input question 2.</p>");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("question").append(myQuestionCDATA);
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).attr("correct", "true");
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("False");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).attr("correct", "false");
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("That is not correct.  Please try again.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).find("feedback").append(myFeedbackCDATA);
			
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).attr("audio", "null");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).attr("btnText", "Submit");
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).find("bankitem").eq(1).attr("randomize", false);
			
			//PAGE LEVEL VARS
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("type", "kc");
						
			break;
		
		case "multipleChoice":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input a question.</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).attr("correct", "true");
			
			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("False");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).attr("correct", "false");
			
			$(myXML).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("That is not correct.  Please try again.");
			$(myXML).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(myXML).find("page").eq(newPage).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "kc");
			
			
			break;
			
		case "multipleChoiceMedia":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input a question.</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).attr("correct", "true");
			
			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("False");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).attr("correct", "false");
			
			$(myXML).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("That is not correct.  Please try again.");
			$(myXML).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("default caption");
			$(myXML).find("page").eq(newPage).find("caption").append(captionCDATA);

			$(myXML).find("page").eq(newPage).attr("img", "defaultLeft.png");
			$(myXML).find("page").eq(newPage).attr("alt", "image description");
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(myXML).find("page").eq(newPage).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "kc");
			
			break;
			
		case "textInput":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("question").eq(0).attr("attempts", 1);
			$(data).find("page").eq(currentPage).find("question").eq(0).attr("autocomplete", false);
			//content
			$(myXML).find("page").eq(newPage).find("question").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var question1CDATA = content1.createCDATASection("<p>Input a question.</p>");
			$(myXML).find("page").eq(newPage).find("question").eq(0).find("content").append(question1CDATA);
			//acceptedresponse
			$(myXML).find("page").eq(newPage).find("question").eq(0).append($("<acceptedresponse>"));
			var acceptedResponse1 = new DOMParser().parseFromString('<acceptedresponse></acceptedresponse>', "text/xml");
			var acceptedResponse1CDATA = acceptedResponse1.createCDATASection("Yes");
			$(myXML).find("page").eq(newPage).find("question").eq(0).find("acceptedresponse").append(acceptedResponse1CDATA);
			//diffeed
			$(myXML).find("page").eq(newPage).find("question").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("question").eq(0).find("diffeed").append(difFeed1CDATA);
			//correctresponse
			$(myXML).find("page").eq(newPage).find("question").eq(0).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("question").eq(0).find("correctresponse").append(myCorrectResponseCDATA);
			
			// $(myXML).find("page").eq(newPage).append($("<incorrectresponse>"));
			// var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			// var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			// $(myXML).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			// $(myXML).find("page").eq(newPage).append($("<feedback>"));
			// var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			// var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			// $(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "differentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");
			
			//$(myXML).find("page").eq(newPage).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "kc");
			
			break;	

		case "matching":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Match the items on the left to the items on the right:</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option1CDATA = option1.createCDATASection("Option1");
			$(myXML).find("page").eq(newPage).find("option").eq(0).append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).attr("correct", "A");
			
			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option2CDATA = option2.createCDATASection("Option2");
			$(myXML).find("page").eq(newPage).find("option").eq(1).append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).attr("correct", "B");
			
			$(myXML).find("page").eq(newPage).append($("<answer>"));
			var answer1 = new DOMParser().parseFromString('<answer></answer>', "text/xml");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var answer1CDATA = content1.createCDATASection("Answer 1");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).find("content").append(answer1CDATA);
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("answer").eq(0).attr("correct", "A");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).attr("img", "defaultReveal.png");
			
			$(myXML).find("page").eq(newPage).append($("<answer>"));
			var answer2 = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var answer2CDATA = content2.createCDATASection("Answer 2");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).find("content").append(answer2CDATA);
			var difFeed2CDATA = diffFeed2.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("answer").eq(1).attr("correct", "B");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).attr("img", "defaultReveal.png");
			
			$(myXML).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("That is not correct.  Please try again.");
			$(myXML).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(myXML).find("page").eq(newPage).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "kc");
			
			break;
			
		case "categories":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Match the items on the left to the items on the right:</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("Category question 1");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).attr("correct", "A");
			
			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("Option2");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).attr("correct", "B");
			
			$(myXML).find("page").eq(newPage).append($("<answer>"));
			var answer1 = new DOMParser().parseFromString('<answer></answer>', "text/xml");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var answer1CDATA = content1.createCDATASection("Answer 1");
			$(myXML).find("page").eq(newPage).find("answer").eq(0).find("content").append(answer1CDATA);
			$(myXML).find("page").eq(newPage).find("answer").eq(0).attr("correct", "A");
			
			$(myXML).find("page").eq(newPage).append($("<answer>"));
			var answer2 = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var answer2CDATA = content2.createCDATASection("Answer 2");
			$(myXML).find("page").eq(newPage).find("answer").eq(1).find("content").append(answer2CDATA);
			$(myXML).find("page").eq(newPage).find("answer").eq(1).attr("correct", "B");
			
			$(myXML).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("That is not correct.  Please try again.");
			$(myXML).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(myXML).find("page").eq(newPage).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).attr("cycle", false);
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "kc");
			
			break;
			
		case "sequence":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Place the items below, into the proper order:</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("Sequence Item 1");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(0).attr("correct", "1");
			
			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("Sequence Item 2");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(1).attr("correct", "2");
			
			$(myXML).find("page").eq(newPage).append($("<option>"));
			var option3 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(myXML).find("page").eq(newPage).find("option").eq(2).append($("<content>"));
			var content3 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option3CDATA = content3.createCDATASection("Sequence Item 3");
			$(myXML).find("page").eq(newPage).find("option").eq(2).find("content").append(option3CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(2).append($("<diffeed>"));
			var diffFeed3 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed3CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(myXML).find("page").eq(newPage).find("option").eq(2).find("diffeed").append(difFeed3CDATA);
			$(myXML).find("page").eq(newPage).find("option").eq(2).attr("correct", "3");
			
			$(myXML).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(myXML).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(myXML).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(myXML).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(myXML).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); $(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(myXML).find("page").eq(newPage).attr("attempts", 2);
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("randomize", false);
			$(myXML).find("page").eq(newPage).attr("type", "kc");
			
			break;

		case "essayCompare":
			$(myXML).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input a question.</p>");
			$(myXML).find("page").eq(newPage).find("question").append(myQuestionCDATA);
							
			$(myXML).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("Expert response goes here...");
			$(myXML).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
					
			$(myXML).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(myXML).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(myXML).find("page").eq(newPage).attr("objective", "undefined"); 
			$(myXML).find("page").eq(newPage).attr("objItemId", "undefined");
			$(myXML).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(myXML).find("page").eq(newPage).attr("audio", "null");
			$(myXML).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(myXML).find("page").eq(newPage).attr("graded", false);
			$(myXML).find("page").eq(newPage).attr("mandatory", true);
			$(myXML).find("page").eq(newPage).attr("type", "kc");
			
			break;
		}
		
		refreshExpected = true;
		updateModuleXML(myModule, true, true);
	}
	
	/************************************************************************************************
	Function: 		filterPageList
	Param: 			_pages = pages to filter
	Description:	Create suggestions for page types based on Objectives.
	************************************************************************************************/
	function filterPageList(_pages){
		var optPage_arr = [];
		var contentPage_arr = [];
		$("select#pageTypeList option").remove();
		
		for(var j=0; j < _pages.length; j++){

			if($.inArray($("#opTypeList").val(), _pages[j].opt) != -1 || $("#opTypeList").val() == ""){
				optPage_arr.push(_pages[j].capability);
			}

			if($.inArray($("#contentTypeList").val(), _pages[j].content) != -1 || $("#contentTypeList").val() == ""){
				contentPage_arr.push(_pages[j].capability);
			}

		}

		var finalPage_arr = [];		
		for(var w=0; w < optPage_arr.length; w++){
			if($.inArray(optPage_arr[w], contentPage_arr) != -1){
				finalPage_arr.push(optPage_arr[w]);
			}
		}	

		for(var t=0; t <finalPage_arr.length; t++){
			$("#pageTypeList").append($("<option></option>").attr("value", finalPage_arr[t]).text(finalPage_arr[t]));
		}	
					
	}	
	
	/************************************************************************************
     removeModuleFromCourse(_id);
     params: _id - id of the item to be removed.
     -- Build a dialog to warn about the removal.
     -- on Yes, find id in xml and then remove from xml and menu, then push update to server.
     -- update the course xml
     -- update the module_arr - remove module and children.
     -- Check that there is at least one page left or disallow the removal.
     ************************************************************************************/
	function removeModuleFromCourse(_id){
		var myID = _id;
		$("#stage").append('<div id="dialog-removeContent" title="Remove this lesson?"><p class="validateTips">Are you sure that you want to remove this module?</div>');
	    
	    $("#dialog-removeContent").dialog({
            modal: true,
            width: 550,
            close: function (event, ui) {
			   	 $("#dialog-removeContent").remove();
            },
            buttons: {
                Yes: function(){
	               
	               $("#"+myID).remove();									//Remove the item from the menu
	               $("#"+myID).remove();									//Have to call twice - not sure why...
	               var myNode = getNode(myID);								//Find node in course.xml as object
	               var myRemove = myNode.node;								//Define the actual node in course.xml
	               myRemove.remove();										//Remove from xml
	               updateCourseXML(false);									//Push xml without commit
				   for(var i = 0; i < module_arr.length; i++){				//Find by id in module_arr
					   if (module_arr[i].id == myID){						
						   module_arr.splice(i, 1);							//remove from module_arr	
					   }
				   }
	               var content = {											//Create data to send to node server
			            id: myID,
			            type: "lesson",
			            user: user
			        };
					
			        socket.emit('removeContent', content);					//Call to server to remove content ------ must add to function to remove module from course.xml...
			        $(this).dialog("close");								//Close dialog.
                },
                 No: function () {
                    $(this).dialog("close");
                }
            }
        });
	}
	
	
	/************************************************************************************
     removePageFromModule(_id);
     params: _id - id of the item to be removed.
     -- Build a dialog to warn about the removal.
     -- on Yes, find id in xml and then remove from xml and menu, then push update to server.
     -- Check that there is at least one page left or disallow the removal.
     ************************************************************************************/
	function removePageFromModule(_id){
		var myID = _id;
		//Attach dialog ensureing that user wants to remove the page.
		$("#stage").append("<div id='dialog-removePage' title='Remove Current Page'><p>Are you sure that you want to remove this page from your content?</p></div>");
		//Build the dialog - utilzing jqueryui
		$("#dialog-removePage").dialog({
			modal: true,
			width: 550,
			close: function(event, ui){
				$("dialog-removePage").remove();
			},
			buttons: {
				Yes: function(){
					var myNode = getNode(myID);							//Return object representing this item.
					var myRemove = myNode.node;							//Variable for the node id
					var myModule = myNode.module;						//Parent module.
					var myModuleID = module_arr[myNode.module].id;		//module ID in case needed ----- probably can remove - leaving for now...
					var myNodeLevel = myNode.level;						//Level that the button resides on ("module", "page" so far)...
					
					//modules have to have at least 1 page... Ensure that you aren't deleting the last....
					if($(module_arr[myModule].xml).find("page").length > 1){
						myRemove.remove();									//remove the node from the xml
						$("#"+myID).remove();								//Remove the item from the menu
						updateModuleXML(myModule, true);					//update the xml
						$(this).dialog("close");							//close the dialog
					}else{
						$(this).dialog("close");
						//Launch a dialog warning that this page can't be removed because it is the last page left in content.xml
						$("#stage").append("<div id='dialog-removePageError' title='Error Removing Page'><p>Your module must have at least one page.</p><p>If you would like to remove this page you must first add another page to this module and then you can remove it.</p></div>");
						$("#dialog-removePageError").dialog({
							modal: true,
							width: 550,
							close: function(event, ui){
								$("dialog-removePageError").remove();
							},
							buttons: {
								cancel: function(){
									$(this).dialog("close");
								}
							}
						});
					}
				},
				No: function(){
					$( this ).dialog( "close" );
				}
			}
		});
	}
	
	/************************************************************************************************
	Function: 		s4
	Description:	Create 4 random characters.
					Used by guid()
	************************************************************************************************/
	function s4() {
	  return Math.floor((1 + Math.random()) * 0x10000)
	             .toString(16)
	             .substring(1);
	};
	
	/************************************************************************************************
	Function: 		guid
	Description:	Creates a random guid.
	************************************************************************************************/
	function guid() {
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	         s4() + '-' + s4() + s4() + s4();
	}
	/**********************************************************END RANDOM GUID GENERATION*/
    
    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
    function destroy(){
	     try { $("#dialog-outline").remove(); } catch (e) {}
	     
    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}