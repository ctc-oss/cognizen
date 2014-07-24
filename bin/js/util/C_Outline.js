function C_Outline(_myItem, _proj) {
	var myItem = _myItem;
	var outlineCourseID = myItem.data('id');
    var outlineCourseType = myItem.data('type');
    var outlineCoursePermission = myItem.data('permission');
	var proj = _proj;
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
	var currentOutlineItem;	
    var outlineURL;
    var totalOutlineModules;
    var loadedOutlineModules;
    var outlineModule_arr;
    var indexItem_arr;
    var indexGroupID_arr;
    var currentCourseID = myItem.data('id');
    var courseData;
    var courseXMLPath;
    var module_arr = [];
    var idCounter = 0;
    var currentPageParentModule;
    var currentPage;
    var currentPageFamily;
    var familyType_arr = [];
    var currentMenuItem;
    
    var startParent;
    var startList;
    var startListJSON;
    //var staticFamily = new Object();
    var staticFamily = ["textOnly", "top", "left", "right", "bottom"];
    familyType_arr.push(staticFamily);
    //var revealFamily = new Object();
    var revealFamily = ["revealRight", "revealLeft", "revealBottom"];
    familyType_arr.push(revealFamily);
    
    for(var i = 0; i < myItem.find("ul").find("li").length; i++){
	    var moduleObj = new Object();
	    moduleObj.name = myItem.find("ul").find("li").eq(i).find("span").first().text();
	    moduleObj.id = myItem.find("ul").find("li").eq(i).attr("id");
	    module_arr.push(moduleObj);
    }
    
    $(document).ready(function(){
    	initOutline();
    });
    
    socket.on('receiveCoursePath', function (data){
		receiveCoursePath(data); 
    });
    	
	 /************************************************************************************
     Do Outline
     ************************************************************************************/
     function initOutline(){
     	loadedOutlineModules = 0;
     	outlineModule_arr = [];
     	currentOutlineItem = myItem;
		socket.emit("getCoursePath", {
        	content: {
            	id: outlineCourseID,
                type: outlineCourseType,
                permission: outlineCoursePermission
             }
		});
     }
     
     function receiveCoursePath(data){
	     outlineURL = [window.location.protocol, '//', window.location.host, '/programs/', data.path].join('');
	     var xmlPath = outlineURL + "/course.xml";
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
     
     
     function importOutlineItems(_data){
	     courseData = _data;
	     totalOutlineModules = $(courseData).find("item").length;
		 for(var i = 0; i < totalOutlineModules; i++){
			 importModuleXML($(courseData).find('item').eq(i).attr("name"));
		 }
     }
     
     var xml_arr = [];
     function importModuleXML(_module){
	     _module = encodeURIComponent(_module.trim());
	     var currentXML = [outlineURL, "/", _module, "/xml/content.xml"].join("");
	     xml_arr.push(["/", _module, "/xml/content.xml"].join(""));
	     $.ajax({
		    type: "GET",
		    url: currentXML,
		    dataType: "xml",
		    async: false,
		    success: importOutlineModuleItemComplete,
		    error: function(){
			    alert("unable to load module data");
		    }
		});
     }
     
     function importOutlineModuleItemComplete(_data){
	     outlineModule_arr.push(_data);
	     loadedOutlineModules++;
	     if(loadedOutlineModules === totalOutlineModules){
		     buildOutlineInterface();
	     }
     }
     
     var oldNodePos;
     
     function buildOutlineInterface(){
     	var thisID;
	 	var groupMode;
	 	indexGroupID_arr = [];
     	indexItem_arr = [];
	 	
     	msg = '<div id="dialog-outline" title="Outline '+ currentOutlineItem.find("span").first().text() + ':">';
	    msg += '<div id="outlinePane" class="pane">'
	    msg += '<div id="outlineIndexPane" class="paneContent">';
	    msg += '<div class="dd" id="C_Index">';
	    msg += '<ol class="dd-list">';
	    for(var i = 0; i < outlineModule_arr.length; i++){
	     	msg += buildOutlineModule(i);
     	}
     	msg += '</ol>';
     	msg += '</div>';
	    msg += '</div>';//close the outline index
	    msg += '<div id = "outlinePagePrefPane"></div>';
	    msg += '</div>';//close the outline pane
	    msg += '</div>';//close the dialog
        $("#stage").append(msg);
        
        $('#C_Index').nestable({maxDepth: 3})
        	.on('change', function(e, _item){
				console.log("onChange");
			})
			.on('start', function(e, _item){
				oldNodePos = _item.attr('data-id');
				for(var i = 0; i < startList.length; i++){
					if(oldNodePos == startList[i].id){
						startChild = false;
						startParent = "course";
						break;
					}
					if(startList[i].children){
						for(var j = 0; j < startList[i].children.length; j++){
							if(oldNodePos == startList[i].children[j].id){
								startChild = true;
								startParent = i;
								startChildrenLength = startList[i].children.length;
								break;
							}
						}
					}
				}
			})
			.on('stop', function(e, _item){
				updateOrder();
			})
     	
        $("#dialog-outline").dialog({
            //modal: true,
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
        
        $('#C_Index').nestable('collapseAll');
        
        var tmpStart = $('#C_Index').data('output', $('#nestable-output'));
		var tmpStartList   = tmpStart.length ? tmpStart : $(tmpStart.target);
		startList = tmpStartList.nestable('serialize');
        startListJSON = window.JSON.stringify(startList);
		
        //Add button listeners
        //Modules
        for(var j = 0; j < outlineModule_arr.length; j++){
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
		$("#module0IndexHotspot").click();
		//Pages
		addPageClicks();
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
			 //Check top level
			 var endParent;
			 for(var i = 0; i < list.length; i++){
			 	if (oldNodePos == startList[i].id){
				 	startPoint = i;
				 }
				 if(oldNodePos == list[i].id){
					 endPoint = i;
					 endParent = i;
				}
				//check children
			 	for(var j = 0; j < startList[i].children.length; j++){
					if(oldNodePos == startList[i].children[j].id){
				 		startPoint = j;
				 	}
				 	if(list[i].children[j]){
					 	if(oldNodePos == list[i].children[j].id){
							endPoint = j;
							endParent = i;
						}
					}
				 }
			 }
			 
			 //Define which xml to update and update them...
			 if(startParent == "course"){
			 	//Moving up or down - where to instert...
			 	if(startPoint > endPoint){
					$(courseData).find("item").eq(startPoint).insertBefore($(courseData).find("item").eq(endPoint));
				}else{
					$(courseData).find("item").eq(startPoint).insertAfter($(courseData).find("item").eq(endPoint));
				}
				updateCourseXML();	 
			 }else{
			 	if(startPoint > endPoint){
			 		$(outlineModule_arr[startParent]).find("page").eq(startPoint).insertBefore($(outlineModule_arr[endParent]).find("page").eq(endPoint));
			 	}else{
				 	$(outlineModule_arr[startParent]).find("page").eq(startPoint).insertAfter($(outlineModule_arr[endParent]).find("page").eq(endPoint));
			 	}
			 	if(startParent != endParent){
			 		updateModuleXML(startParent, false);
			 	}
			 	updateModuleXML(endParent, true);
			 }
			 
			 //Update start list in case more than one change is made... 
			 //Without this, you can only make one change and then stuff get's funky.
			 var tmpStart = $('#C_Index').data('output', $('#nestable-output'));
			 var tmpStartList   = tmpStart.length ? tmpStart : $(tmpStart.target);
			 startList = tmpStartList.nestable('serialize');
			 startListJSON = window.JSON.stringify(startList);
		}
     }
     
     /****************************************************************
     * Display editable Module Preferences.
     ****************************************************************/
     function displayModuleData(_id){
     	$("#outlinePagePrefPane").empty();
     	var msg = "<div class='outlineModuleEditHeader'><b>Module Preferences: " + $(outlineModule_arr[_id]).find('lessonTitle').attr("value") + "</b></div><br/>";
     	msg += "<div><b>Details:</b></div>";
     	msg += "<label for='lessonTitle'>lesson title: </label>";
        msg += '<input type="text" name="lessonTitle" id="lessonTitle" value="'+ $(outlineModule_arr[_id]).find('lessonTitle').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';
     	msg += "<div>"
     	msg += "<label for='lessonWidth'>width of lesson: </label>";
        msg += '<input type="text" name="lessonWidth" id="lessonWidth" value="'+ $(outlineModule_arr[_id]).find('lessonWidth').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';
        msg += "<label for='lessonHeight'>height of lesson: </label>";
        msg += '<input type="text" name="lessonHeight" id="lessonHeight" value="'+ $(outlineModule_arr[_id]).find('lessonHeight').attr("value") + '" class="text ui-widget-content ui-corner-all" /><br/>';
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
        msg += '<input type="text" name="transitionDuration" id="transitionDuration" value="'+ $(outlineModule_arr[_id]).find('transitionLength').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';
     	msg += "<br/><br/>";
     	msg += "<div><b>Lock:</b></div>";
     	msg += "<label for='lockDuration'>duration for lock request (s): </label>";
        msg += '<input type="text" name="lockDuration" id="lockDuration" value="'+ $(outlineModule_arr[_id]).find('lockRequestDuration').attr("value") + '" class="text ui-widget-content ui-corner-all" /><br/> ';
     	msg += "</div>";

	    $("#outlinePagePrefPane").append(msg);
	   
	    //Set module settings.
	    //Mode
		$("#mode option:contains(" + $(outlineModule_arr[_id]).find('mode').attr("value") + ")").attr('selected', 'selected');
		$("#transition").val($(outlineModule_arr[_id]).find('transitionType').attr("value"));
		
		if($(outlineModule_arr[_id]).find('glossary').attr("value") === "true"){
			$('#hasGlossary').prop('checked',true);
		}

	    //Listeners for Module Settings
	     $("#lessonTitle").on("change", function(){

			$(outlineModule_arr[_id]).find('lessonTitle').attr("value", $("#lessonTitle").val().trim());
			updateModuleXML(_id, false);
			
			for(var j = 0; j < $(courseData).find("item").length; j++){
				console.log($(courseData).find("item").eq(j).attr('name'));
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
		    $(outlineModule_arr[_id]).find('mode').attr("value", $("#mode").val());
		    updateModuleXML(_id);
	    });
	    
	    $("#transition").on("change", function(){
		    $(outlineModule_arr[_id]).find('transitionType').attr("value", $("#transition").val());
		    if($("#transition").val() == "none"){
				$(outlineModule_arr[_id]).find('transition').attr("value", false);
		    }else{
				$(outlineModule_arr[_id]).find('transition').attr("value", true);
				$(outlineModule_arr[_id]).find('transitionType').attr("value", $("#transition").val());
		    }
		    updateModuleXML(_id);
	    });
	    
	    $("#transitionDuration").on("change", function(){
			$(outlineModule_arr[_id]).find('transitionLength').attr("value", $("#transitionDuration").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});
	    
	    $("#lockDuration").on("change", function(){
			$(outlineModule_arr[_id]).find('lockRequestDuration').attr("value", $("#lockDuration").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});
	    
	    $("#lessonWidth").on("change", function(){
			$(outlineModule_arr[_id]).find('lessonWidth').attr("value", $("#lessonWidth").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});
	    
	    $("#lessonHeight").on("change", function(){
			$(outlineModule_arr[_id]).find('lessonHeight').attr("value", $("#lessonHeight").val());
			updateModuleXML(_id);
	    }).css({'width': '50px', 'color': '#3383bb;'});
	    
	    $("#hasGlossary").on("change", function(){
		   if($('#hasGlossary').prop('checked')){
			   $(outlineModule_arr[_id]).find('glossary').attr("value", "true");
		   } else{
			   $(outlineModule_arr[_id]).find('glossary').attr("value", "false");
		   }
		   updateModuleXML(_id);
	    });
     }
     
     
     function updateCourseXML(){
	    var myData = $(courseData);
		var xmlString;
		
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
		console.log("tmpPath = " + tmpPath);
		socket.emit('updateCourseXML', { myXML: xmlString, courseXMLPath: tmpPath, user: user ,content: {
        	id: outlineCourseID,
            type: outlineCourseType,
            permission: outlineCoursePermission
            } 
		});
     }
     /****************************************************************
     * Serialize XML and send it to the server.
     ****************************************************************/
     function updateModuleXML(_id, _commit){
	 	var myData = $(outlineModule_arr[_id]);
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

		var moduleXMLPath = xml_arr[_id].replace(new RegExp("%20", "g"), ' ');
		socket.emit('updateModuleXML', { myXML: xmlString, moduleXMLPath: moduleXMLPath, commit: commit, user: user ,content: {
        	id: outlineCourseID,
            type: outlineCourseType,
            permission: outlineCoursePermission
            } 
		});
     }
     
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
			}
	     }
     }
     
     
     
     function displayPageData(_id){
     	var matched = false;
     	for(var i = 0; i < outlineModule_arr.length; i++){
		    for(var j = 0; j < $(outlineModule_arr[i]).find("page").length; j++){
		    	if(_id == $(outlineModule_arr[i]).find("page").eq(j).attr("id")){
			    	matched = true;
			    	currentPageParentModule = i;
			    	currentPage = j;
			     	
			     	$("#outlinePagePrefPane").empty();
				 	var msg = "<div class='outlinePageEditHeader'><b>Page Preferences: " + $(outlineModule_arr[i]).find('page').eq(j).find("title").text().trim() + "</div>";
				 	msg += "<div><b>Details:</b></div>";
			     	msg += "<label for='out_pageTitle'>page title: </label>";
			        msg += '<input type="text" name="out_pageTitle" id="out_pageTitle" value="'+ $(outlineModule_arr[i]).find('page').eq(j).find("title").text().trim() + '" class="text ui-widget-content ui-corner-all" /> <br/>';
			     	msg += "<label for='out_pageObjective'>page objective: </label>";
			        msg += '<input type="text" name="out_pageObjective" id="out_pageObjective" value="'+ $(outlineModule_arr[i]).find('page').eq(j).attr("objective") + '" class="text ui-widget-content ui-corner-all" /> <br/>';
			     	
			     	/*msg += "<div>"
			     	msg += "<label for='lessonWidth'>width of lesson:</label>";
			        msg += '<input type="text" name="lessonWidth" id="lessonWidth" value="'+ $(outlineModule_arr[i]).find('lessonWidth').attr("value") + '" class="text ui-widget-content ui-corner-all" /> ';
			        msg += "<label for='lessonHeight'>height of lesson:</label>";
			        msg += '<input type="text" name="lessonHeight" id="lessonHeight" value="'+ $(outlineModule_arr[i]).find('lessonHeight').attr("value") + '" class="text ui-widget-content ui-corner-all" /><br/>';
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
					   	$(outlineModule_arr[i]).find('page').eq(j).find("title").first().empty();
					   	$(outlineModule_arr[i]).find('page').eq(j).find("title").first().append(newCDATA);
						updateModuleXML(currentPageParentModule);
				    }).css({'width': '500px', 'color': '#3383bb;'});
				    
				    $("#out_pageObjective").on("change", function(){
				     	//ADD CODE TO PROPERLY RENAME LESSON ---------------------------------------------------------------------------------------------------------------
				     	var titleUpdate = $("#out_pageObjective").val().trim();
					   	$(outlineModule_arr[i]).find('page').eq(j).attr('objective', titleUpdate);
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
     
     /*****************************************************************
     buildOutlineModule - builds the index for the module.
     *****************************************************************/
     function buildOutlineModule(_id){
	     var data = outlineModule_arr[_id];
	     var thisID;
		 var groupMode;
		 var moduleIndexItem_arr = [];
		 var totalPages = $(data).find('page').length;

		 var indexString = '<li id="module'+ _id + 'Index" class="dd-item dd3-item outlineModuleItem" data-id="'+ idCounter +'">';
		 idCounter++;
		 indexString += '<div class="dd-handle dd3-handle">Drag</div>';
		 indexString += '<div id="module'+ _id + 'IndexHotspot" class="dd3-content" data-id="'+_id +'">'+$(data).find("lessonTitle").attr("value") +'</div>';
		 indexString += '<ol class="dd-list">';
		 for(var i = 0; i < totalPages; i++){
		 	thisID = "module"+ _id + "indexMenuItem" + i;
		 	var pageID = $(data).find("page").eq(i).attr("id");
		 	if($(data).find("page").eq(i).attr("type") == "group"){
				//Resolves issue of group butting into group...
				if(groupMode == true){
					indexString += '</ol></li>';
				}
				groupMode = true;
				
				var isVirgin = checkForGroup(thisID);
				
				if(isVirgin){
					indexString += '<li id="'+pageID+'"class="dd-item dd3-item outlinePageItem" data-id="'+ idCounter + '">';
					indexString += '<div class="dd-handle dd3-handle">Drag</div>';
					indexString += '<div id="'+thisID+'" class="dd3-content" tag="'+idCounter+'" myID="'+$(data).find("page").eq(i).attr("id")+'">'+$(data).find("page").eq(i).find("title").first().text() +'<div id="commentSpot"></div></div><ol class="dd-list">';
					idCounter++;

				}			
			}else{
				if(groupMode && $(data).find("page").eq(i).parent().attr("type") != "group"){
					groupMode = false;
					indexString += '</ol></li>';
				}
			}
			indexString += '<li id="'+pageID+'" class="dd-item dd3-item" data-id="'+idCounter+'">';
			idCounter++;
			indexString += '<div class="dd-handle dd3-handle">Drag</div>';
			indexString += '<div id="'+thisID+'" class="dd3-content" tag="'+i+'" myID="'+$(data).find("page").eq(i).attr("id")+'">'+ $(data).find("page").eq(i).find('title').first().text() +'<div id="commentSpot"></div></div></li>';
			moduleIndexItem_arr.push("#" + thisID);
		}
		if(groupMode == true){
			indexString += '</ol></li>';
		}
		indexItem_arr.push(moduleIndexItem_arr)
		indexString += '</ol></li>';
		return indexString;
     }
     
     /*Quick function to check group association*/
     function checkForGroup(_id){
		var virgin = true;
		for(var i = 0; i < indexGroupID_arr.length; i++){
			if(indexGroupID_arr[i] == _id){
				virgin = false;
			}
		}
		if(virgin == true){
			indexGroupID_arr.push(_id);
		}
		return virgin;
	}
	
	var hoverSubNav = false;
	/************************************************************************************************
	Function: 		addOutlineRollovers
	Param: 			myItem = The term to attach the rollover functionality to.
	Description:	Called when a user rolls over an existing outline item.
	************************************************************************************************/
	function addOutlineRollovers(myItem, _level){
		//ADD Program Level Buttons
	    myItem.hover(
	    	function () {
	    		$(this).append("<div id='outlineModuleAdd' class='outlineModuleAdd' title='Add a new module to your course.'></div><div id='outlineModuleRemove' class='outlineModuleRemove' title='Remove this module from your course.'></div>");
	            $("#outlineModuleRemove").click(function(){
	            	if(_level == "module"){
	            		console.log("clicked remove module.");
	            	}else{
		            	console.log("clicked remove page");
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
	           
	           $("#outlineModuleAdd").click(function(){
	            	if(_level == "module"){
	            		console.log("clicked add module.");
	            	}else{
		            	console.log("clicked add page");
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
				$("#outlineModuleAdd").remove();
				$("#outlineModuleRemove").remove();
			});   
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