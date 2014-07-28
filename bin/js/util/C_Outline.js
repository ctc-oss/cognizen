function C_Outline(_myItem, _proj) {
	
	////////////////////////////////////////////////   COURSE LEVEL VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	var myItem = _myItem;										//The Button that was clicked in the dashboard.
	var courseID = myItem.data('id');					//Course to check for modules
    var currentCourseType = myItem.data('type');				//Type to be passed to node server
    var currentCoursePermission = myItem.data('permission');	//Permission to be passed to node server
	var proj = _proj;											//Data object holding course module data
																/* proj.directories holds directories for all course content
																id: "533edfe1cb89ab0000000001"
																name: "z9"
																parent: "531f3654c764a5609d000003"
																parentDir: "Course 1"
																path: "VA/Course 1/z9"
																permission: "admin"
																type: "lesson"
																__proto__: Object
																]*/		
    
    var coursePath;												//Path to the course
    var courseData;												//Variable to hold and manipulate course.xml - the xml is imported and held in courseData object.
    var courseXMLPath;											//Path to the course.xml
    
    
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
    var idCounter = 0;											//Give each menu item a unique numeric id 										----- MAY NOT NEED THIS NOW WITH FULL GUID SUPPORT

	
	////////////////////////////////////////////////   MOVING MENU ITEMS VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    var startParent;
    var startList;
    var startLesson = null;
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
	     //Construct Module Data Structure Model Array and store module_arr
	     for (var i = 0; i < totalOutlineModules; i++){
	     	for(var j = 0; j < proj.directories.length; j++){
			    if(proj.directories[j].parent == courseID && proj.directories[j].name == $(courseData).find('item').eq(i).attr("name")){
				    var moduleObj = new Object();
				    moduleObj.name = proj.directories[j].name;
				    moduleObj.id = proj.directories[j].id;
				    moduleObj.parent = proj.directories[j].parent;
				    moduleObj.parentDir = proj.directories[j].parentDir;
				    moduleObj.parh = proj.directories[j].path;
				    moduleObj.permission = proj.directories[j].permission;
				    moduleObj.type = proj.directories[j].type;
				    moduleObj.xml = null;
				    moduleObj.xmlPath = ["/", encodeURIComponent(proj.directories[j].name.trim()), "/xml/content.xml"].join("");
				    module_arr.push(moduleObj);
				    
					var currentXML = [coursePath, "/", encodeURIComponent(proj.directories[j].name.trim()), "/xml/content.xml"].join("");
				    importModuleXML(currentXML);
			    }
			}
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
     	var thisID;
	 	var groupMode;
     	indexItem_arr = [];
	 	
     	msg = '<div id="dialog-outline" title="Outline '+ myItem.find("span").first().text() + ':">';
	    msg += '<div id="outlinePane" class="pane">'
	    msg += '<div id="outlineIndexPane" class="paneContent">';
	    msg += '<div class="dd" id="C_Index">';
	    msg += '<ol class="dd-list">';
	    //COURSE LEVEL
	    msg += '<li id="courseIndex" class="dd-item dd3-item outlineCourseItem" data-id="idCounter">';
		//msg += '<div class="dd-handle dd3-handle">Drag</div>';
		msg += '<div id="courseIndexHotspot" class="dd3-content" data-id="'+ courseID+'">'+myItem.find("span").first().text() +'</div>';
		msg += '<ol class="dd-list">';
	    
	    //idCounter++;
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
				startDrag(_item);
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
        $('#C_Index').nestable('collapseAll');

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
        });
        
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
     *****************************************************************/
     function buildOutlineModule(_id){
	     var data = module_arr[_id].xml;
	     var thisID;
		 var groupMode;
		 var moduleIndexItem_arr = [];
		 var totalPages = $(data).find('page').length;
		 var indexString = '<li id="module'+ _id + 'Index" class="dd-item dd3-item outlineModuleItem" data-id="'+ module_arr[_id].id +'">';
		 idCounter++;
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
		 	idCounter++;
		 	if($(data).find("page").eq(i).find("page").length){
		 		indexString += '<ol class="dd-list">';

		 		for(var j = 0; j < $(data).find("page").eq(i).find("page").length; j++){
			 		thisID = "module"+ _id + "indexMenuItem" + i + "lessonItem" + j;
			 		pageID = $(data).find("page").eq(i).find("page").eq(j).attr("id");
			 		indexString += '<li id="'+pageID+'" class="dd-item dd3-item" data-id="'+pageID+'">';
			 		idCounter++;
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
		     for(var j = 0; j < tmp_arr[i].length; j++){
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

     
     /***************************************************************************************
     startDrag
     SET KEY VARIABLES FOR REPOSITIONING - SET START POINT VARIALBLES
     ***************************************************************************************/
     function startDrag(_item){
       	currentDragID = _item.attr('data-id');
		//check module level
		for(var i = 0; i < startList[0].children.length; i++){
			if(currentDragID == startList[0].children[i].id){
				startChild = false;
				startLesson = null;
				startParent = "course";
				startPoint = i;
				console.log("startPoint = " + startPoint);
				break;
			}
			//Check Page Level
			if(startList[0].children[i].children){
				var startIterator = 0;
				for(var j = 0; j < startList[0].children[i].children.length; j++){
					if(currentDragID == startList[0].children[i].children[j].id){
						startChild = true;
						startLesson = null;
						startParent = i;
						startPoint = startIterator;
						console.log("startPoint = " + startPoint);
						break;
					}
					startIterator++;
					//Check sub-page level (lessons)
					if(startList[0].children[i].children[j].children){
						for (var k = 0; k < startList[0].children[i].children[j].children.length; k++){
							if(currentDragID == startList[0].children[i].children[j].children[k].id){
								startChild = true;
								startLesson = j;
								startParent = i;
								startPoint = startIterator;
								console.log("startPoint = " + startPoint);
								break;
							}
							startIterator++;
						}
					}
				}
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
		 console.log(startList);
		 console.log(list);
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
			 
			 var moveTo = endNode.node;
			 var endModule = endNode.module;
			 var endModuleID = module_arr[endNode.module].id;
			 var endNodeLevel = endNode.level;			 
			 
			 //MOVE from original position to updated position.
			 if(myInsert == "before" || endNodeLevel == "module"){
				 moveFrom.insertBefore(moveTo);
			 }else{
				 moveFrom.insertAfter(moveTo);
			 }	
			 
			 console.log("startNodeLevel = " + startNodeLevel);
			 console.log("endNodeLevel = " + endNodeLevel);
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
	    var msg = "<div class='outlineCourseEditHeader'><b>Course Preferences: " + myItem.find("span").first().text() + "</b></div>";
		msg += "<div><b>Details:</b></div>";
		msg += "<label for='out_courseTitle'>course title: </label>";
		msg += '<input type="text" name="out_courseTitle" id="out_courseTitle" title="Update the course title." value="'+ myItem.find("span").first().text() + '" class="text ui-widget-content ui-corner-all" /> <br/>';
		msg += '<br/><div><b>Sequencing:</b></div>';
		msg += '<div id="objGlobalRadio" title="Enable shared global objective information for the lifetime of the learner in the system.">objectivesGlobalToSystem: ';
		msg += '<input type="radio" id="objGlobaltrue" name="objGlobalRadio" /><label for="objGlobaltrue" title="Shared global objective information will exist per learner for the lifetime of the learner in the system.">true </label>';
		msg += '<input type="radio" id="objGlobalfalse" name="objGlobalRadio" /><label for="objGlobalfalse" title="The LMS will maintain and resolve shared global objective IDs scoped to only one attempt on the activity tree. Shared global objective information will exist per learner per attempt on the activity tree.">false</label>';
		msg += '</div>';
		msg += '<div title="Determine what type of navigation is allowed by the user."><b>Control Modes:</b></div>';
		msg += '<div id="choiceRadio" title="Enable the table of contents for navigating among this activity’s children.">choice: ';
		msg += '<input type="radio" id="choicetrue" name="choiceRadio" /><label for="choicetrue" title="Set choice to true.">true </label>';
		msg += '<input type="radio" id="choicefalse" name="choiceRadio" /><label for="choicefalse" title="Set choice to false">false</label>';
		msg += '</div>';
		msg += '<div id="flowRadio" title="Enable previous and next buttons for navigating among this activity’s children.">flow: ';
		msg += '<input type="radio" id="flowtrue" name="flowRadio" /><label for="flowtrue" title="Set flow to true.">true </label>';
		msg += '<input type="radio" id="flowfalse" name="flowRadio" /><label for="flowfalse" title="Set flow to false">false</label>';
		msg += '</div>';	
		msg += '<div id="forwardOnlyRadio" title="Restricts the user to only moving forward through the children of this activity. Previous requests and using the table of contents go backwards is prohibited.">forwardOnly: ';
		msg += '<input type="radio" id="forwardOnlytrue" name="forwardOnlyRadio" /><label for="forwardOnlytrue" title="Set forwardOnly to true.">true </label>';
		msg += '<input type="radio" id="forwardOnlyfalse" name="forwardOnlyRadio" /><label for="forwardOnlyfalse" title="Set forwardOnly to false">false</label>';
		msg += '</div>';
		msg += 	'<br/><a href="http://scorm.com/scorm-explained/technical-scorm/sequencing/sequencing-definition-model/" target="_blank">Sequencing Definition Model</a>';					
		//alert($(courseData).find('sequencing').attr("choice"));
		//msg += "<label for='out_courseObjective'>course objective: </label>";
		//msg += '<input type="text" name="out_courseObjective" id="out_courseObjective" value="'+ $(module_arr[i].xml).find('page').eq(j).attr("objective") + '" class="text ui-widget-content ui-corner-all" /> <br/>';
			
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
		
		//set objectivesGlobalToSystem based off value in xml
		if($(courseData).find('sequencing').first().attr("objectivesGlobalToSystem") === "true"){
			$('#objGlobaltrue').prop('checked',true);
		}
		else{
			$('#objGlobalfalse').prop('checked',true);
		}

		//update the xml when objectivesGlobalToSystem toggle is changed
		$("#objGlobalRadio").on("change", function(){
		   if($('#objGlobaltrue').prop('checked')){
			   $(courseData).find('sequencing').first().attr("objectivesGlobalToSystem", "true");
		   } else{
			   $(courseData).find('sequencing').first().attr("objectivesGlobalToSystem", "false");
		   }
		   updateCourseXML(currentPageParentModule);
		});

		//set choice based off value in xml
		if($(courseData).find('sequencing').first().attr("choice") === "true"){
			$('#choicetrue').prop('checked',true);
		}
		else{
			$('#choicefalse').prop('checked',true);
		}

		//update the xml when choice toggle is changed
		$("#choiceRadio").on("change", function(){
		   if($('#choicetrue').prop('checked')){
			   $(courseData).find('sequencing').first().attr("choice", "true");
		   } else{
			   $(courseData).find('sequencing').first().attr("choice", "false");
		   }
		   updateCourseXML(currentPageParentModule);
		});

		//set flow based off value in xml
		if($(courseData).find('sequencing').first().attr("flow") === "true"){
			$('#flowtrue').prop('checked',true);
		}
		else{
			$('#flowfalse').prop('checked',true);
		}

		//update the xml when flow toggle is changed
		$("#flowRadio").on("change", function(){
		   if($('#flowtrue').prop('checked')){
			   $(courseData).find('sequencing').first().attr("flow", "true");
		   } else{
			   $(courseData).find('sequencing').first().attr("flow", "false");
		   }
		   updateCourseXML(currentPageParentModule);
		});

		//set forwardOnly based off value in xml
		if($(courseData).find('sequencing').first().attr("forwardOnly") === "true"){
			$('#forwardOnlytrue').prop('checked',true);
		}
		else{
			$('#forwardOnlyfalse').prop('checked',true);
		}

		//update the xml when forwardOnly toggle is changed
		$("#forwardOnlyRadio").on("change", function(){
		   if($('#forwardOnlytrue').prop('checked')){
			   $(courseData).find('sequencing').first().attr("forwardOnly", "true");
		   } else{
			   $(courseData).find('sequencing').first().attr("forwardOnly", "false");
		   }
		   updateCourseXML(currentPageParentModule);
		});		

		$("#out_courseTitle").on("change", function(){
			//ADD CODE TO PROPERLY RENAME LESSON ---------------------------------------------------------------------------------------------------------------
			var titleUpdate = $("#out_courseTitle").val().replace('<p>', '').replace('</p>', '').trim();
			currentMenuItem.text(titleUpdate);
			$(courseData).attr("name", titleUpdate);
			updateCourseXML(currentPageParentModule);
			
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
			$("div[id$='Radio']").buttonset();
			$( document ).tooltip();
		});	


     }
     
     /****************************************************************
     * Display editable Module Preferences.
     ****************************************************************/
     function displayModuleData(_id){
     	for(var i = 0; i < module_arr.length; i++){
			if(_id == module_arr[i].id){
				_id = i;
				break;
			}
		}
     	$("#outlinePagePrefPane").empty();
     	var msg = "<div class='outlineModuleEditHeader'><b>Module Preferences: " + $(module_arr[_id].xml).find('lessonTitle').attr("value") + "</b></div><br/>";
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
     	msg += "<option>edit</option>";
     	msg += "<option>review</option>";
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
		msg += '<br/><div><b>Sequencing:</b></div>';
		msg += '<div title="Determine what type of navigation is allowed by the user."><b>Control Modes:</b></div>';
		msg += '<div id="choiceRadio" title="Enable the table of contents for navigating among this activity’s children.">choice: ';
		msg += '<input type="radio" id="choicetrue" name="choiceRadio" /><label for="choicetrue" title="Set choice to true.">true </label>';
		msg += '<input type="radio" id="choicefalse" name="choiceRadio" /><label for="choicefalse" title="Set choice to false">false</label>';
		msg += '</div>';
		msg += '<div id="flowRadio" title="Enable previous and next buttons for navigating among this activity’s children.">flow: ';
		msg += '<input type="radio" id="flowtrue" name="flowRadio" /><label for="flowtrue" title="Set flow to true.">true </label>';
		msg += '<input type="radio" id="flowfalse" name="flowRadio" /><label for="flowfalse" title="Set flow to false">false</label>';
		msg += '</div>';	
		msg += '<div id="forwardOnlyRadio" title="Restricts the user to only moving forward through the children of this activity. Previous requests and using the table of contents go backwards is prohibited.">forwardOnly: ';
		msg += '<input type="radio" id="forwardOnlytrue" name="forwardOnlyRadio" /><label for="forwardOnlytrue" title="Set forwardOnly to true.">true </label>';
		msg += '<input type="radio" id="forwardOnlyfalse" name="forwardOnlyRadio" /><label for="forwardOnlyfalse" title="Set forwardOnly to false">false</label>';
		msg += '</div>';
		msg += '<div id="choiceExitRadio" title="Can the learner jump out of this activity using a choice request?">choiceExit: ';
		msg += '<input type="radio" id="choiceExittrue" name="choiceExitRadio" /><label for="choiceExittrue" title="Set choiceExit to true.">true </label>';
		msg += '<input type="radio" id="choiceExitfalse" name="choiceExitRadio" /><label for="choiceExitfalse" title="Set choiceExit to false">false</label>';
		msg += '</div>';
		msg += '<br/><div title="Indicates which navigational UI elements the LMS should hide when this activity is being delivered."><b>Hide LMS UI Values:</b></div>';		
		msg += '<div id="previousRadio" title="Remove the previous button from the LMS navigation.">previous: ';
		msg += '<input type="radio" id="previoustrue" name="previousRadio" /><label for="previoustrue" title="Set previous to true.">true </label>';
		msg += '<input type="radio" id="previousfalse" name="previousRadio" /><label for="previousfalse" title="Set previous to false">false</label>';
		msg += '</div>';	
		msg += '<div id="continueRadio" title="Remove the continue button from the LMS navigation.">continue: ';
		msg += '<input type="radio" id="continuetrue" name="continueRadio" /><label for="continuetrue" title="Set continue to true.">true </label>';
		msg += '<input type="radio" id="continuefalse" name="continueRadio" /><label for="continuefalse" title="Set continue to false">false</label>';
		msg += '</div>';	
		msg += '<div id="exitRadio" title="Remove the exit button from the LMS navigation.">exit: ';
		msg += '<input type="radio" id="exittrue" name="exitRadio" /><label for="exittrue" title="Set exit to true.">true </label>';
		msg += '<input type="radio" id="exitfalse" name="exitRadio" /><label for="exitfalse" title="Set exit to false">false</label>';
		msg += '</div>';					

		msg += 	'<br/><a href="http://scorm.com/scorm-explained/technical-scorm/sequencing/sequencing-definition-model/" target="_blank">Sequencing Definition Model</a>';	     	

	    $("#outlinePagePrefPane").append(msg);
	   
	    //Set module settings.
	    //Mode
		$("#mode option:contains(" + $(module_arr[_id].xml).find('mode').attr("value") + ")").attr('selected', 'selected');
		$("#transition").val($(module_arr[_id].xml).find('transitionType').attr("value"));
		
		if($(module_arr[_id].xml).find('glossary').attr("value") === "true"){
			$('#hasGlossary').prop('checked',true);
		}

	    //Listeners for Module Settings
	     $("#lessonTitle").on("change", function(){

			$(module_arr[_id].xml).find('lessonTitle').attr("value", $("#lessonTitle").val().trim());
			updateModuleXML(_id, false);
			
			for(var j = 0; j < $(courseData).find("item").length; j++){
				if($(courseData).find("item").eq(j).attr('name') == currentMenuItem.text()){
					$(courseData).find("item").eq(j).attr('name', $("#lessonTitle").val().trim());
					updateCourseXML();
					break;
				}
				
			}
			
			var lessonMatchID;
			for (var i=0; i < proj.directories.length; i++){
				if(myItem.attr('id') == proj.directories[i].parent && currentMenuItem.text() == proj.directories[i].name){
					lessonMatchID = proj.directories[i].id;
					break;
				}
			}
			currentMenuItem.text($("#lessonTitle").val());
			var data = {
	            content: {
	                id: lessonMatchID,
	                type: "lesson",
	                name: $("#lessonTitle").val()
	            },
	            user: {
	                id: user._id,
	                username: user.username
	            }
	        };
	
	        socket.emit('renameContent', data);
	    }).css({'width': '500px', 'color': '#3383bb;'});
	    
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

		//update the xml when toggles are changed
		toggleChange("choice", modIndex);
		toggleChange("flow", modIndex);
		toggleChange("forwardOnly", modIndex);
		toggleChange("choiceExit", modIndex);
		toggleChange("previous", modIndex);
		toggleChange("continue", modIndex);
		toggleChange("exit", modIndex);

		$(function () {
			$("div[id$='Radio']").buttonset();
		});					

     }

     function setToggle(_id, index){
		if($(courseData).find('sequencing').eq(index).attr(_id) === "true"){
			$('#'+_id+'true').prop('checked',true);
		}
		else{
			$('#'+_id+'false').prop('checked',true);
		}     	
     }

     function toggleChange(_id, index){
		$('#'+_id+'Radio').on("change", function(){
		   if($('#'+_id+'true').prop('checked')){
			   $(courseData).find('sequencing').eq(index).attr(_id, "true");
		   } else{
			   $(courseData).find('sequencing').eq(index).attr(_id, "false");
		   }
		   updateCourseXML();
		});	     	

     }
     
     
     function updateCourseXML(){
	    var myData = $(courseData);
		var xmlString;
		console.log(myData);
		//IE being a beatch, as always - have handle xml differently.
		if (window.ActiveXObject){
	        xmlString = myData[0].xml;
		}
		
		if(xmlString === undefined){
			var oSerializer = new XMLSerializer();
			xmlString = oSerializer.serializeToString(myData[0]);
		}
		
		var pd = new pp();
		var xmlString  = pd.xml(xmlString);
		var tmpPath = courseXMLPath.replace(new RegExp("%20", "g"), ' ');
		socket.emit('updateCourseXML', { myXML: xmlString, courseXMLPath: tmpPath, user: user ,content: {
        	id: courseID,
            type: currentCourseType,
            permission: currentCoursePermission
            } 
		});
     }
     
     /****************************************************************
     * Serialize XML and send it to the server.
     ****************************************************************/
     function updateModuleXML(_id, _commit){
	 	var myData = $(module_arr[_id].xml);
	 	console.log(myData);
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
		var pd = new pp();
		var xmlString  = pd.xml(xmlString);
				
		var moduleXMLPath = module_arr[_id].xmlPath.replace(new RegExp("%20", "g"), ' ');
		console.log("moduleXMLPath = " + moduleXMLPath);
		socket.emit('updateModuleXML', { myXML: xmlString, moduleXMLPath: moduleXMLPath, commit: commit, user: user ,content: {
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
	    		$(this).append("<div id='outlineAdd' class='outlineModuleAdd' title='Add a new module to your course.'></div><div id='outlineRemove' class='outlineModuleRemove' title='Remove this module from your course.'></div>");
	            //ADD REMOVE NAV
	            $("#outlineRemove").click(function(){
	            	if(_level == "module"){
	            		removeModuleFromCourse();
	            	}else{
		            	removePageFromModule();
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
	           
	           //ADD ADD NAV
	           $("#outlineAdd").click(function(){
	            	if(_level == "module"){
	            		addModuleToCourse();
	            	}else{
		            	addPageToModule();
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
	function addModuleToCourse(){
		console.log("addModuleToCourse.");
	}
	
	function removeModuleFromCourse(){
		console.log("removeModuleFromCourse.");
	}
	
	function addPageToModule(){
		console.log("addPageToModule.");
	}
	
	function removePageFromModule(){
		console.log("removePageFromModule");
	}

    
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