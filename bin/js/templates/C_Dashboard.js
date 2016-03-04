/*!
 * C_Dashboard
 * Dashboard for the cognizen tool
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 0.1
 * DATE: 2013-04-26
 * JavaScript
 *
 * Copyright (c) 2013, CTC. All rights reserved.
 *
 * @author: Philip Double, doublep@ctc.com
 */
function C_Dashboard(_type) {
	var co;
    var type = _type;
    var proj;
    var hoverSubNav = false; //Boolean toggle to not launch project/lesson when adding a user.
    var userRoster;
    var currentParent;
    var currentLevel;
    var parentString = "";
    var assignParent;
    var myTimer;
    var launchItem;
    var scroller;
    //var scrollTimer;
    var launchItemParent;


    //Defines a public method - notice the difference between the private definition below.
    this.initialize = function () {
        if (transition == true) {
            $('#stage').css({'opacity': 0});
        }

        /*****************************************************************************
         add socket listeners - for server connectivity.
         *****************************************************************************/
        socket.on('receiveUserList', function (data) {
            userRoster = data;
        });

        socket.on('allowToolLaunch', function(data){
            window.clearInterval(myTimer);
            if(data == 'outline'){
	           co = new C_Outline(launchItem);
            }
            else if (data == 'search'){
                co = new C_Search(launchItem, launchItemParent);
            }
        });

        /*socket.on('receiveCoursePath', function (data){
	    	receiveCoursePath(data);
        });*/

        socket.on('contentPermissions', function(data){
	        assignUser(data);
        });

        socket.on('receiveProjectsFromDB', function (data) {
            $("#preloadholder").remove();
            proj = data;
            try{co.refreshOutlineData();} catch(e){};
            buildTemplate();
        });

        socket.on('receiveClonableFromDB', function (data){
            console.log(data);
            cloneContent(data);
        });

        socket.on('updateActiveEditor', function(data){
	        if(data.newEditor != null){
		        //$("#"+data.courseID).find('span').first().append("nono");
	        }
        });

        socket.on('contentAdded', function (content) {
            // Find the list item, and attach the id to the data.
            $('#' + idIfyPath(content.path)).data('id', content._id);
        });

        socket.on('contentServerStarted', function (details) {
            $("#preloadholder").remove();
            window.clearInterval(myTimer);
            var url = [window.location.protocol, '//', window.location.host, '/programs/', details.path, '/index.html?id=', details.id, '&type=', details.type, '&u=', user._id].join('');
            openProject(url, details.myWidth, details.myHeight);
        });

        socket.on('contentServerDidNotStart', function (details) {
            $("#preloadholder").remove();
            window.clearInterval(myTimer);
            doError('Error Loading Content', details.message);
        });

        socket.on('generalError', function(details) {
            $("#preloadholder").remove();
            window.clearInterval(myTimer);
            doError(details.title, details.message);
        });

        socket.on('refreshDashboard', function() {
            //$("#preloadholder").remove();
            try{co.refreshOutlineData();} catch(e){};
            socket.emit('getProjects', user);
        });

        //Call the Server (C_Server.js) to get list of projects associated to the user.
        socket.emit('getProjects', user);
    }


    function idIfyPath(path) {
        return path.replace('/', '_');
    }


    /*****************************************************************************
     buildTemplate()
     *****************************************************************************/
    function buildTemplate() {
		$("#gotoLMS").removeClass('navbar-active').addClass('navbar-item');
		$("#gotoAuthoring").addClass('navbar-active').removeClass('navbar-item'); 
        // Ensure that items are sorted as program, application, course, lesson
        proj.directories = proj.directories.sort(function (a, b) {
            var order = function(value) {
                if (value === 'program') {
                    return 0;
                }
                else if (value === 'application') {
                    return 1;
                }
                else if (value === 'course') {
                    return 2;
                }
                else if (value === 'lesson') {
                    return 3;
                }
                else {
                    return -1;
                }
            };
            return (order(a.type) > order(b.type) ? 1 : -1);
        });

        var $stage = $('#stage');
        $stage.html('');

        $stage.append("<div id='logout'><a href='/logout'>logout</a></div>");
        
        $stage.append("<div id='projListHeader'>my projects:</div>");

        /*****************************************************************************
         BUILD Program Tree - It is a <UL> which is handled by the tree class in libs/jqTree - Styled in the CSS
         *****************************************************************************/
        $stage.append('<div id="contentHolder" class="overthrow antiscroll-inner"><ul id="projList" class="filetree"></ul></div>');
		//console.log(proj.directories);
        var tree_arr = [];
        //Cycle through the proj object
        for (var i = 0; i < proj.directories.length; i++) {

            var project = proj.directories[i];
            var $project = $("#" + project.id);
            var idIfiedPath = idIfyPath(proj.directories[i].id);

			project.permission = proj.directories[i].permission;

            //MAKE SURE THE USER'S SUPPOSED TO SEE IT - IF SO - ADD IT
            if(project.permission != 'undefined'){
            	//Check if partent or child.
	            if (proj.directories[i].parentDir == "") {
	                //If no parent then it is top layer - add root class - used to check below for hover states.
	                $("#projList").append("<li id='" + idIfiedPath + "' class='closed root'><span class='folder'>" + unescape(proj.directories[i].name) + "</span></li>");
	            } else {
	                //If a child - has a parent - cycle through and add to parent item as an .
	                var string = proj.directories[i].parentDir;
	                //Name if a path - we need to split which creates an array.
	                var result = string.split('/');
	                //Take the last item of the array - that is the title of the folder to put in the tree.
	                var parentName = result.pop();
	                for (var j = 0; j < proj.directories.length; j++) {

	                    if (proj.directories[j].name == parentName && proj.directories[j].id == proj.directories[i].parent) {
	                        var parent = proj.directories[j].id;
	                        break;
	                    }
	                }
	                //What folder do I belong to - create a faux ID to be able to refer to it.
	                var parentID = "#" + parent;
	                //Create a unique ID to add child list to.
	                var newULID = parent + "List";
	                //If a UL doesn't exist for the item create it and add this item - otherwise just add this item.
	                if (project.type != 'course' && $(parentID).has("ul").length) {
	                    $(parentID + ' ul').append("<li id='" + idIfiedPath + "' class='closed'><span class='folder'>" + unescape(proj.directories[i].name) + "</span></li>");
	                } else {
	                    $(parentID).append("<ul id='" + newULID + "' class='C_MenuFolder'><li id='" + idIfiedPath + "' class='closed'><span class='folder'>" + unescape(proj.directories[i].name) + "</span></li></ul>");
	                }
	            }
	            tree_arr.push(project);
	        }
        }

        $("#projList").append("</ul>");

        //$("#projList").listorder();//Alphabetize root.
		$("ul").listorder();


        //ONCE the UL is created add specific funcitionalities related to whether Program, Course, Project or Lesson.
        for (var i = 0; i < tree_arr.length; i++) {
            var content = tree_arr[i];
            var $content = $('#' + content.id);
            $content.data('id', content.id);
            $content.data('type', content.type);
            $content.data('path', content.path);
            $content.data('permission', content.permission);

	        addRollovers($content);
        };

        $('#projList').treeview({
            collapsed: true,
            animated: "fast",
            unique: true,
            persist: "cookie"
        });

        /*****************************************************************************
         ROOT User only button -- ONLY ROOT can add a new Program - ROOT and Program Admin can add new users to the system.
         *****************************************************************************/

        

        ///////////////////////////////////////////////////////////////END ROOT ONLY ----------------------------STILL NEEDS TO BE SET UP ONCE USER TYPES ARE BEING RETURNED.  SIMPLE IF STATEMENT WILL SUFFICE

        //Once everything is loaded - fade page in.
        if (transition == true) {
            TweenMax.to($stage, transitionLength, {css: {opacity: 1}, ease: transitionType/*, onComplete: getUserList*/});
        }
        //scroller = $('.box-wrap').antiscroll().data('antiscroll');
   }

    /************************************************************************************************* END OF buildTemplate*/

	
    /*****************************************************************************
     ADD ROLOVERS TO THE TREE MENU ITEMS
     *****************************************************************************/
    function addRollovers(myItem) {
        //ADD Program Level Buttons
        myItem.find("span").first().hover(
            function () {
                if (myItem.data('type') == "program") {
                    $(this).addClass("programHover");
                    if(myItem.data('permission') == "admin"){
	                    //$(this).append("<div id='myPref' class='programPref' title='adjust preferences for the " + $(this).parent().find("span").first().text() + " program.'></div>");
	                    
	                    $(this).append("<div id='myUserAdd' class='programUserAdd' title='manage users for " + $(this).parent().find("span").first().text() + "'></div>");
	                    $(this).append("<div id='myAdd' class='programAdd' title='add a course to " + $(this).parent().find("span").first().text() + "'></div>");
	                    $(this).append("<div id='myRemove' class='programRemove' title='remove the " + $(this).parent().find("span").first().text() + " project.'></div>");
					}
                } else if (myItem.data('type') == "course") {
                    $(this).addClass("courseHover");
                    if(myItem.data('permission') == "admin"){
                    	$(this).append("<div id='myUserAdd' class='courseUserAdd' title='manage users for " + $(this).parent().find("span").first().text() + "'></div>");
	                    $(this).append("<div id='myAdd' class='courseAdd' title='add a lesson to " + $(this).parent().find("span").first().text() + "'></div>");
	                    $(this).append("<div id='myRemove' class='courseRemove' title='remove the " + $(this).parent().find("span").first().text() + " course.'></div>");
	                    $(this).append("<div id='myPref' class='coursePref' title='adjust preferences for the " + $(this).parent().find("span").first().text() + " course.'></div>");
	                    $(this).append("<div id='mySearch' class='courseSearch' title='search the " + $(this).parent().find("span").first().text() + " course.'></div>");
	                    $(this).append("<div id='myOutline' class='courseOutline' title='outline the " + $(this).parent().find("span").first().text() + " course.'></div>");
					}
                } else {
                    $(this).addClass("projectHover");
                    if(myItem.data('permission') == "admin"){
                        $(this).append("<div id='myUserAdd' class='projectUserAdd' title='manage users for " + $(this).parent().find("span").first().text() + "'></div>");
	                    $(this).append("<div id='myRemove' class='projectRemove' title='remove the " + $(this).parent().find("span").first().text() + " lesson.'></div>");
	                    $(this).append("<div id='myPref' class='projectPref' title='adjust preferences for the " + $(this).parent().find("span").first().text() + " project.'></div>");
	                    $(this).append("<div id='mySearch' class='projectSearch' title='search the " + $(this).parent().find("span").first().text() + " lesson.'></div>");
	                }
                }

			 $("#myOutline").click(function () {
				 	//Add preloader
				 	myTimer = setInterval(function () {startlaunchtimer()}, 14000);
                    $("#stage").append('<div id="preloadholder"></div>');
					$("#preloadholder").addClass("C_Modal C_ModalPreloadGraphic");
				 	launchItem = myItem;
				 	//Check if outline is available...
				 	socket.emit('allowTool', {
                        id : myItem.data('id'),
                        tool : 'outline'
                    });
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

             $("#mySearch").click(function () {
                    //Add preloader
                    myTimer = setInterval(function () {startlaunchtimer()}, 14000);
                    $("#stage").append('<div id="preloadholder"></div>');
                    $("#preloadholder").addClass("C_Modal C_ModalPreloadGraphic");
                    launchItem = myItem;
                    var myLevel = $(this).attr("class");
                    //used to send course name in for module search
                    launchItemParent = { id: myItem.parent().parent().attr('id'),
                                        name: myItem.parent().parent().find("span").first().text() };
                    //Check if outline is available...
                    socket.emit('allowTool', {
                        id : myItem.data('id'),
                        tool : 'search',
                        level : myLevel
                    });
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

			 $("#myPref").click(function () {
                    doPrefs(myItem);
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

                $("#myAdd").click(function () {
                    if (myItem.data('type') == "program") {
                        registerContent($(this).parent().parent(), "project");
                    } else if (myItem.data('type') == "course") {
                        registerContent($(this).parent().parent(), "lesson");
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

                $("#myRemove").click(function(){
		            removeContent(myItem);
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

                $("#myUserAdd").click(function () {
                	assignParent = myItem;
                    getUserList(myItem.data('id'));
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
			 	$("#myPref").remove();
            	$("#myRemove").remove();
                $("#myAdd").remove();
                $("#myUserAdd").remove();
                $("#myOutline").remove();
                $("#mySearch").remove();
                if (myItem.data('type') == "program") {
                    $(this).removeClass("programHover");
                } else if (myItem.data('type') == "course") {
                    $(this).removeClass("courseHover");
                } else {
                    $(this).removeClass("projectHover");
                }
            }
        ).click(
            function () {
                if (myItem.data('type') == "lesson") {
                    //If NOT over a sub nav - add/remove/prefs - and clicking - launch lesson...
                    if (hoverSubNav == false) {
                        //Start the server for this project to enable editing, review and multiplayer mode
                        socket.emit("startContentServer", {
                            content: {
                                id: myItem.data('id'),
                                type: myItem.data('type'),
                                permission: myItem.data('permission')
                            }
                        });
                        myTimer = setInterval(function () {startlaunchtimer()}, 14000);
                        $("#contentHolder").append('<div id="preloadholder"></div>');
						$("#preloadholder").addClass("C_Modal C_ModalPreloadGraphic");
                    }
                }
                //scrollTimer = setInterval(function () {scrollRefresh()}, 500);
            }
        );
    }

    function startlaunchtimer(){
        $("#preloadholder").remove();
        alert("Your request timed out.");
        window.clearInterval(myTimer);
    }

    /*function scrollRefresh(){
		scroller.refresh();
        window.clearInterval(scrollTimer);
    }*/

	var moduleLessonWindow;
    /****************************************************************************************************************************END OF ROLLOVERS FOR TREE ITEMS*/
    //////OPEN A PROJECT\\\\\\
    function openProject(projectPath, w, h) {
        var myPath = projectPath.replace(/\s/g, "%20");
        windowWidth = screen.width; //window.innerWidth; -------- Currently not used - locking to 1024
        windowHeight = screen.height //window.innerHeight; -------- Currently not used - locking to 768
        moduleLessonWindow = window.open(myPath, "AlertLesson", "toolbar=0, location=0, directories=0, status=0, menubar=0, resizable=0, scrollbars=1, width=" + w + ", height=" + h);
		try{moduleLessonWindow.focus();} catch(e){};        
    }

	//If closing the dashboard, close the lesson....
    function myUnloadHandler(evt)
    {
        if (evt.persisted) {
            // This is actually a pagehide event and the page is going into the Page Cache.
            // Make sure that we don't do any destructive work, or work that shouldn't be duplicated.
            return;
        }

        // This is either an unload event for older browsers,
        // or a pagehide event for page tear-down in supported browsers.
        // It's safe to do everything my old unload event handler did here.
        if(moduleLessonWindow){
			moduleLessonWindow.close();
        }
    }

    if ("onpagehide" in window) {
        window.addEventListener("pagehide", myUnloadHandler, false);
    } else {
        window.addEventListener("unload", myUnloadHandler, false);
    }

    function getUserList(_id) {
	    $("#stage").append('<div id="preloadholder"></div>');
        $("#preloadholder").addClass("C_Modal C_ModalPreloadGraphic");
        socket.emit('getPermissions', {content: {id: _id}});
    }

    /************************************************************************************
     CLONE CONTENT
     ************************************************************************************/
    function cloneContent(data)
    {
        if(data.directories.length == 0){
            alert("You do not have permission to clone any content, please contact a system admin.");
        }
        else{
            var type = data.directories[0].type;
            var msg = '<div id="dialog-cloneContent" title="Clone "'+type+'" content"><p class="validateTips">Choose '+type+' content to copy :</p><ul id="listRoot" class="filetree"></ul></div>';
			$("#stage").append(msg);
				
			for (var i = 0; i < data.directories.length; i++){
				var id = data.directories[i].id;
				var name = data.directories[i].name;
				var parentID = data.directories[i].parent;
				var parent = "clone-" + data.directories[i].parent;
				var parentDir = data.directories[i].parentDir;
				var path = data.directories[i].path;
				var $insertPoint = $("#listRoot");
				
				// lesson has 2 levels above it, course only has 1
				if(type == "lesson") {					
					// find the parent so you can get the ID of its parent
					var j = 0;
					while(parentID != proj.directories[j].id){
						j++;
					}
					var grandparent = "clone-" + proj.directories[j].parent;
					var grandparentDir = proj.directories[j].parentDir;
					// if grandparent node does not exist, create it
					if(!$("#" + grandparent).length){
						$insertPoint.append('<li id="' + grandparent + '"><span class="folder">' + grandparentDir + '</span><ul></ul></li>');
					}
					$insertPoint = $("#" + grandparent + " > ul");
				}

				if( (type == "lesson") || (type == "course") ){
					// if parent node does not exist, create it
					if(!$("#" + parent).length){
						$insertPoint.append('<li id="' + parent + '"><span class="folder">' + parentDir + '</span><ul></ul></li>');
					}
					$insertPoint = $("#" + parent + " > ul");
				}

				// add radio button
				$insertPoint.append('<li id="clone-' + id + '"><input data-class_id="' + i + '" id="cloneRadioButton" type="radio" name="cloneRadioGroup" >' + name + '</li>');
			}

            if( type === 'program'){
                var inputMsg = '<br/><div id="programName" >'
                inputMsg += '<label for="myName" class="regField">new name : </label>';
                inputMsg += '<input type="text" name="myName" id="myName" value="" class="regText text ui-widget-content ui-corner-all" />';
                inputMsg += '</div>';  
                $("#dialog-cloneContent").append(inputMsg);      
                $('#programName').hide();        
            }
			
			// sort the list
			$("#dialog-cloneContent ul").listorder();

			// convert list to tree
			$('#listRoot').treeview({
				collapsed: true,
				animated: "fast",
				unique: true
			});

            //Make it a dialog
            $("#dialog-cloneContent").dialog({
                modal: true,
                width: 700,
                height: 710,
                close: function (event, ui) {
                    $(this).dialog("close");
                    $("#dialog-cloneContent").remove();                
                    enableMainKeyEvents();
                },
                open: function (event, ui) {
                    disableMainKeyEvents();
                },
                buttons: [
                    {
                        id:"cloneContent-cancel",
                        text: "Cancel",
                        title:"Cancel.",
                        click: function(){
                            $(this).dialog("close");
                            $("#dialog-cloneContent").remove();
                            enableMainKeyEvents();
                        }
                    },            
                    {
                        id:"cloneContent-submit",
                        text: "Submit",
                        title:"Submit.",
                        disabled: true,
                        click: function() {
                            var $selectedRow = $("input[name=cloneRadioGroup]:checked");
							var contentToClone = data.directories[$selectedRow.data('class_id')];
							contentToClone.name = contentToClone.name + "copy";
							contentToClone.user = user;
                            
							if(type === "lesson"){

								contentToClone.course = {
									id: currentParent.attr('id')
								};

								socket.emit("cloneLesson", contentToClone);                            
							}
							else if(type === "course"){
								contentToClone.program = {
									id: currentParent.attr('id')
								};

								socket.emit("cloneCourse", contentToClone);                                

							}
							else if(type === 'program'){
                                var newProgName = $('#myName').val();
                                if(newProgName.length == 0 ){
                                    alert("A new name for the program must be provided!");
                                }
                                else{
                                    contentToClone.name = newProgName;
								    socket.emit("cloneProgram", contentToClone);
                                }
							}

							$("#stage").append('<div id="preloadholder"></div>');
							$("#preloadholder").addClass("C_Modal C_ModalPreloadGraphic");
							$(this).dialog("close");
							$("#dialog-cloneContent").remove();                            
                            

                        }
                    }                

                ]            

            });

            $('#listRoot').on('change', ':radio', function(){
                if(type == 'program'){
                    $('#programName').show(); 
                }
                else{
                    $('#cloneContent-submit').removeAttr('disabled').removeClass( 'ui-state-disabled' );
                }
                
            });

            $('#myName').on('input', function(e){
                $('#cloneContent-submit').removeAttr('disabled').removeClass( 'ui-state-disabled' );
            });
        }      

    }

    /************************************************************************************
     ASSIGN USER TO CONTENT
     ************************************************************************************/
    function assignUser(data) {
		$("#preloadholder").remove();
    	var userData = data;
    	var msg = '<div id="dialog-assignUser" title="Assign User Rights"><p class="validateTips">Assign user roles to '+ assignParent.find("span").first().text() +':</p>';
    	msg += '<table class="userSelectTable" border="1" align="center">';
    	msg += '<thead><tr>';
    	msg += '<th class="USTName">Name</th>';
    	msg += '<th>admin</th>';
    	msg += '<th>editor</th>';
    	msg += '<th>review</th>';
    	msg += '<th>client</th>';
    	msg += '<th>none</th>';
    	msg += '</tr></thead>';
    	msg += '<tbody>';
    	for (var i = 0; i < data.length; i++){
	    	var adminChecked = data[i].permission == 'admin' ? ' checked' : '';
	    	var editorChecked = data[i].permission == 'editor' ? ' checked' : '';
	    	var reviewerChecked = data[i].permission == 'reviewer' ? ' checked' : '';
            var clientChecked = data[i].permission == 'client' ? ' checked' : '';
	    	var noneChecked = data[i].permission == null ? ' checked' : '';

		    msg += '<tr><td id="user'+ i+ '" class="assignUserName USTName" title="'+data[i].username +'">' + data[i].firstName + ' ' + data[i].lastName + '</td>';
		    msg += '<td align="center"><input type="radio" name="rightsLevel'+i+'" value="admin" ' + adminChecked + '></td>';
		    msg += '<td align="center"><input type="radio" name="rightsLevel'+i+'" value="editor" ' + editorChecked + '></td>';
		    msg += '<td align="center"><input type="radio" name="rightsLevel'+i+'" value="reviewer" ' + reviewerChecked + '></td>';
            msg += '<td align="center"><input type="radio" name="rightsLevel'+i+'" value="client" ' + clientChecked + '></td>';
		    msg += '<td align="center"><input type="radio" name="rightsLevel'+i+'" value="null" ' + noneChecked + '></td></tr>';
    	}

    	msg += '</tbody></table></div>';
    	$("#stage").append(msg);
		
		//Added 9/28/15 PD to 
		var $table = $('table.userSelectTable');
		var $bodyCells = $table.find('tbody tr:first').children(), colWidth; 
	      
		// Adjust the width of thead cells when window resizes
		$(window).resize(function() {
		    // Get the tbody columns width array
		    colWidth = $bodyCells.map(function() {
		        return $(this).width();
		    }).get();
		    
		    // Set the width of thead columns
		    $table.find('thead tr').children().each(function(i, v) {
		        $(v).width(colWidth[i]);
		    });    
		}).resize(); // Trigger resize handler
    	
    	for(var i = 0; i < data.length; i++){
	    	$("#user"+i).tooltip();
    	}
    	//Make it a dialog
        $("#dialog-assignUser").dialog({
            modal: true,
            width: 700,
            height: 710,
            close: function (event, ui) {
                $(this).dialog("close");
                $("#dialog-assignUser").remove();
                enableMainKeyEvents();
            },
            open: function (event, ui) {
                disableMainKeyEvents();
            },
            buttons: {
                Cancel: function () {
                    $(this).dialog("close");
                    $("#dialog-assignUser").remove();
                },

                Assign: function () {
                    var user_arr = [];
                    var rightsPropogation_arr = [];
                    for(var i = 0; i < data.length; i++){
                    	var myPermission = $('input:radio[name=rightsLevel'+ i + ']:checked').val();
	                    if (myPermission == "null"){
		                    myPermission = null;
	                    }
                    	var tmpObj = {id: data[i].id, username: data[i].username, first: data[i].firstName, last: data[i].lastName, permission: myPermission};
	                    user_arr.push(tmpObj)
                    }

                    var parentName = '';
                    if(assignParent.data('type') != 'program'){
                        parentName = assignParent.parent().parent().find("span").first().text();
                    }

                    socket.emit('assignContentToUsers', {
                        content: {
                            type: assignParent.data('type'),
                            id: assignParent.data('id'),
                            name: assignParent.find("span").first().text(),
                            parent: parentName
                        },
                        users: user_arr
                    });
					$("#stage").append('<div id="preloadholder"></div>');
					$("#preloadholder").addClass("C_Modal C_ModalPreloadGraphic");
                    $(this).dialog("close");
                    $("#dialog-assignUser").remove();
                }
            }
        });
        
        colWidth = $bodyCells.map(function() {
	        return $(this).width();
	    }).get();
	    
	    // Set the width of thead columns
	    $table.find('thead tr').children().each(function(i, v) {
	        $(v).width(colWidth[i]);
	    }); 
    }

    /***********************************************************************************************
     KEYBOARD EVENTS
     ***********************************************************************************************/
	 
    function enableMainKeyEvents() {
        $("#adminAddProgram").bind("keyup", keyUpRegisterProgram);
        $("#adminAddUser").bind("keyup", keyUpRegisterUser);
    }

    function disableMainKeyEvents() {
        $("#adminAddProgram").unbind("keyup", keyUpRegisterProgram);
        $("#adminAddUser").unbind("keyup", keyUpRegisterUser);
    }

    function enableRegisterUserKeyEvents() {
        $("#registerSubmit").blur();
        $("#firstName").bind("keyup", keyUpSubmitRegisterUser);
        $("#lastName").bind("keyup", keyUpSubmitRegisterUser);
        $("#regEmail").bind("keyup", keyUpSubmitRegisterUser);
        $("#regPassword").bind("keyup", keyUpSubmitRegisterUser);
        $("#regPasswordVer").bind("keyup", keyUpSubmitRegisterUser);
    }

    function disableRegisterUserKeyEvents() {
        $("#registerSubmit").blur();
        $("#firstName").unbind("keyup", keyUpSubmitRegisterUser);
        $("#lastName").unbind("keyup", keyUpSubmitRegisterUser);
        $("#regEmail").unbind("keyup", keyUpSubmitRegisterUser);
        $("#regPassword").unbind("keyup", keyUpSubmitRegisterUser);
        $("#regPasswordVer").unbind("keyup", keyUpSubmitRegisterUser);
    }

    function enableRegisterContentKeyEvents() {
        $("#myName").bind("keyup", keyUpSubmitRegisterNewContent);
    }

    function disableRegisterContentKeyEvents() {
        $("#myName").unbind("keyup", keyUpSubmitRegisterNewContent);
    }

    function keyUpSubmitRegisterNewContent(event) {
        if (event.which == 13 || event.keyCode == 13) {
            submitRegisterNewContent(currentParent, currentLevel);
        }
    }
	
    function submitRegisterNewContent() {
        var myType = "course";
        var nameString = $("#myName").val().trim();

        //for root

        $("#stage").append('<div id="preloadholder"></div>');
        $("#preloadholder").addClass("C_Modal C_ModalPreloadGraphic");

        var content = {
            name: nameString,
            user: user
        };

        if (currentParent == "root") { // TODO Should this be currentLevel?
            socket.emit("registerProgram", content);
        } else if (currentLevel == "project") {
            /*var selected = $("#myType input[type='radio']:checked");
            if (selected.length > 0) {
                myType = selected.val();
            }*/
			myType = "course"; //////// When we want to turn applications back on - comment this and uncomment the block above.
            content.program = {
                id: currentParent.attr('id')
            };

            if (myType == "course") {
                socket.emit("registerCourse", content);
            } else {
                socket.emit("registerApplication", content);
            }
        } else if (currentLevel == "lesson") {
            content.course = {
                id: currentParent.attr('id')
            };
            content.parentName = parentString;
            socket.emit("registerLesson", content);
        }

        $("#dialog-registerNewContent").dialog("close");
        $("#myName").remove();
        $("#myType").remove();
        $("#dialog-registerNewContent").remove();
    }

    function submitRemoveContent() {
        var content = {
            id: currentParent.attr('id'),
            name: currentParent.find("span").first().text(),
            type: currentLevel,
            user: user,
            loc: 'dashboard'
        };

        socket.emit('removeContent', content);

        $("#dialog-removeContent").dialog("close");
        $("#dialog-removeContent").remove();
    }

    function keyUpSubmitRegisterUser(event) {
        if (event.which == 13 || event.keyCode == 13) {
            submitRegisterUser();
        }
    }

    function keyUpRegisterProgram(event) {
        if (event.which == 13 || event.keyCode == 13) {
            registerContent("root", "root");
        }
    };

    function keyUpRegisterUser(event) {
        if (event.which == 13 || event.keyCode == 13) {
            registerUser();
        }
    };

/*
    function submitRegisterUser() {
        if (checkRegister() == true) {
            socket.emit("registerUser", { firstName: $("#firstName").val(), lastName: $("#lastName").val(), user: $("#regEmail").val().toLowerCase(), pass: $("#regPassword").val()});
            $("#firstName").remove();
            $("#lastName").remove();
            $("#regEmail").remove();
            $("#regPassword").remove();
            $("#regPasswordVer").remove();
            $("#dialog-registerUser").dialog("close");
            $("#dialog-registerUser").remove();
        }
    }
*/


	 /************************************************************************************
     REGISTER NEW CONTENT
     ************************************************************************************/
    function doPrefs(myParent){
	    currentParent = myParent;
	    currentLevel = myParent.data('type');

	    var msg;
	    if (currentLevel == "program") {
        	msg = '<div id="dialog-updatePrefs" title="Update Program Prefs">';
            msg += '<p class="validateTips">Customize your publish preferences below:</p>';
            msg += '<p>Functionalities to be added shortly.</p>';
            msg += '</div>';
	    }
        else{
            if (currentLevel == "course") {
                msg = '<div id="dialog-updatePrefs" title="Update Publish Prefs">';
                msg += '<p class="validateTips">Customize your publish preferences for the '+ myParent.find("span").first().text() + ' course below:</p>';
                msg += "<br/><p>";
                msg += "<form id='scormform' >";
                msg += "<label id='label' title='Set SCORM Version'>SCORM Version: </label>";
                msg += "<select id='scormVersion'>";
                msg += "<option>2004_4th</option>";
                msg += "<option>2004_3rd</option>";
                msg += "<option>Hosting</option>";
                // msg += "<option>2004_4th_USSOCOM</option>";
                // msg += "<option>2004_3rd_USSOCOM</option>";
                msg += "<option>none</option>";
                msg += "</select></form>";

            } 
            else if (currentLevel == "lesson") {
                msg = '<div id="dialog-updatePrefs" title="Publish Settings">';
                msg += '<p class="validateTips">Customize your publish preferences for the '+ myParent.find("span").first().text() + ' lesson below:</p>';
                msg += "<br/><p>";
                msg += "<form id='scormform' >";
                msg += "<label id='label' title='Set SCORM Version'>SCORM Version: </label>";
                msg += "<select id='scormVersion'>";
                msg += "<option>2004_4th</option>";
                msg += "<option>2004_3rd</option>";
                msg += "<option>1.2</option>";                
                //msg += "<option>1.2_CTCU</option>";
                msg += "<option>none</option>";

            }

            //common dialog options for courses and lessons
            msg += "</select></form>";
            msg += '<div id="manonlyHolder">';
            msg += "<label id='label' for='manifestOnly' title='Only publish the imsmanifest.xml file'>imsmanifest.xml only : </label>";
            msg += "<input id='manifestOnly' type='checkbox' name='manifestOnly' class='radio'/>"; 
            msg += '</div>';
            msg += '<div id="deliverableHolder">';
            msg += "<label id='label' for='deliverableActive' title='Save the publish output as a deliverable'>deliverable: </label>";
            msg += "<input id='deliverableActive' type='checkbox' name='deliverableActive' class='radio'/>";
            msg += "<label for='deliverableVersion' id='deliverableVersionLabel' style='display:none' title='Label to indicate version (ex. v1.0)'> version : </label>";
            msg += "<input type='text' name='deliverableVersion' id='deliverableVersion'  value='' class='dialogInput' style='width:70px;display:none'/>";             
            msg += '</div>';                           
            msg += "</p>";
            msg += '</div>';//end dialog-updatePrefs
            enableRenameContentKeyEvents();           
        } 

         //Append the string to the stage
        $("#stage").append(msg);

        $('#scormVersion').on("change", function(){
            if($('#scormVersion').find(':selected').text() == 'none'){
                $('#manifestOnly').prop('checked', false);
                $('#manonlyHolder').hide();
                $('#deliverableHolder').show();
            }
            else if($('#scormVersion').find(':selected').text() == 'Hosting'){
                $('#manifestOnly').prop('checked', false);
                $('#manonlyHolder').hide();
                $('#deliverableHolder').prop('checked', false);
                $('#deliverableHolder').hide();
            }
            else{
                if(!$('#deliverableActive').is(':checked')){
                    $('#manonlyHolder').show();
                    $('#deliverableHolder').show();
                }                    
            }
        });  

        $('#deliverableActive').on('change', function(){
            $('#deliverableVersionLabel').toggle();
            $('#deliverableVersion').toggle();
            if($('#scormVersion').find(':selected').text() == 'none'){
                $('#manonlyHolder').hide();
            }
            else{
                $('#manonlyHolder').toggle();
            }
        });

        $('#manifestOnly').on('change', function(){
            if($('#manifestOnly').prop('checked')){
                $('#deliverableActive').prop('checked', false);
                $('#deliverableHolder').hide();
            }
            else{
                $('#deliverableHolder').show();
            }
        });

        $("#dialog-updatePrefs").dialog({
            modal: true,
            width: 550,
            close: function (event, ui) {
                enableMainKeyEvents();
                disableRenameContentKeyEvents();
            },
            open: function (event, ui) {
                disableMainKeyEvents();
                enableRenameContentKeyEvents()
            },
            buttons: {
                Cancel: function () {
                    $(this).dialog("close");
                    /*$("#myName").remove();*/
                    $("#myType").remove();
                    $("#dialog-updatePrefs").remove();
                },
                /*Submit: function(){
                	submitPrefUpdate(myParent, currentLevel);
                },*/
                Publish: function(){
                    var publish = true;
                    //if deliverableActive is checked then deliverableVersion must have a value
                    if($('#deliverableActive').prop('checked') && $('#deliverableVersion').val().length == 0){
                        publish = false;
                    }

                    if(publish){
                        var selectedScorm = $('#scormVersion').find(':selected').text();
                        var manifestOnly = $('#manifestOnly').is(':checked');
                        var deliverable = {
                            isDeliverable : $('#deliverableActive').is(':checked'),
                            version : $('#deliverableVersion').val()
                        };
                        clickPublish(myParent, currentLevel, selectedScorm, manifestOnly, deliverable);
                        $(this).dialog("close");
                        /*$("#myName").remove();*/
                        $("#myType").remove();                        
                    }
                    else{
                        alert('Please indicate a deliverable version value.');
                    }
                }
            }
        });

        $("#dialog-updatePrefs").tooltip();
    }

    function clickPublish(parent, level, selectedScorm, manifestOnly, deliverable){


        $('body').prepend('<div id="publishLoader"><div id="publishLoaderText">Please Wait.<br/><br/>The content is being packaged, this may take a couple of minutes</div></div>');
        disableRenameContentKeyEvents();

        var data = {
            content: {
                id: currentParent.attr('id'),
                type: currentLevel
            },
            user: {
                id: user._id,
                username: user.username
            },
            scorm: {
                version: selectedScorm,
                manifestonly: manifestOnly 
            },
            deliverable: deliverable
        };

        socket.emit('publishContent', data, function(fdata){
            if(fdata == ''){
                $("#dialog-updatePrefs").remove();

                $('#publishLoader').remove();
            }
            else{
                fdata = fdata.replace(/\\/g, '/');
                var splitPath = fdata.split("/");
    			var first = true;
                var notYet = true;
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

                socket.emit('sendPackageMail', {
                    user: user._id,
                    path: dlPath
                });
				
                $("#dialog-updatePrefs").remove();

                $('#publishLoader').remove();

                var msg = '<div id="dialog-dlPackage" title="Retrieve your package"><p class="validateTips">A mail has been sent to you with a link for your package.</p><p>You can also download your content package by clicking the link below:<br/><br><a href='+dlPath+' target="_blank">GET PACKAGE</a></p></div>';

                //Add to stage.
                $("#stage").append(msg);

                //Make it a dialog
                $("#dialog-dlPackage").dialog({
                    modal: true,
                    width: 550,
                    close: function(event, ui){
                            $("#dialog-dlPackage").remove();
                        },
                    buttons: {
                        Close: function () {
                                $(this).dialog("close");
                        }
                    }
                });
            }
            socket.emit('refreshDashboard');
        });
    }

    function enableRenameContentKeyEvents() {
        $("#myName").bind("keyup", keyUpSubmitRenameContent);
    }

    function disableRenameContentKeyEvents() {
        $("#myName").unbind("keyup", keyUpSubmitRenameContent);
    }

    function keyUpSubmitRenameContent(event) {
        if (event.which == 13 || event.keyCode == 13) {
            submitPrefUpdate(currentParent, currentLevel);
        }
    }
	
	//Pass through from the nav bar class for when creating a program. 
	//Left it in here because the dash menu using it...
	//There will also be a registerContent in the LMSDash...
	this.registerContent = function(_parent, _level){
		registerContent(_parent, _level);
	}
    /************************************************************************************END PREFS*/
    /************************************************************************************
     REGISTER CONTENT SPLASH
     Clone or new
     ************************************************************************************/
        //Launch Register CONTENT Dialog
    function registerContent(myParent, myLevel) {
        currentParent = myParent;
        currentLevel = myLevel;
        var msg;
        //Create html strings for the dialog popups, depending upon menu level.
        if (myParent == "root") {
            msg = '<div id="dialog-registerContent" title="Add New Program">';
            msg += '<p class="validateTips">Choose to clone an existing program or create a new program.</p>';
            msg += '</div>';
        } else if (myLevel == "project") {
            //WHEN WE WANT TO TURN APPLICATIONS BACK ON COMMENT OUT THE LINE BELOW AND UNCOMMENT THE LINE ABOVE.
            msg = '<div id="dialog-registerContent" title="Add New Course">';
            msg += '<p class="validateTips">Choose to clone an existing course or create a new course to the ' +
                myParent.find("span").first().text() + ' program.</p>';
            msg += '</div>';
        } else if (myLevel == "lesson") {
            msg = '<div id="dialog-registerContent" title="Add New Lesson">';
            msg += '<p class="validateTips">Choose to clone an existing lesson or create a new lesson to the ' + 
                myParent.find("span").first().text() + ' course.</p>';
            msg += '</div>';
        }
	   if(myParent != "root"){
	  	 parentString = myParent.find("span").first().text();
	   }

        //Append the string to the stage
        $("#stage").append(msg);
        // $("#myName").alphanum();
        //Convert string to dialog
        $("#dialog-registerContent").dialog({
            modal: true,
            width: 350,
            close: function (event, ui) {
                enableMainKeyEvents();
                disableRegisterContentKeyEvents();
            },
            open: function (event, ui) {
                disableMainKeyEvents();
                enableRegisterContentKeyEvents()
            },
            buttons: [
                {
                    id:"registerContent-new",
                    text: "New",
                    title:"Create a new instance.",
                    click: function(){
                        $(this).dialog("close");
                        $("#dialog-registerContent").remove();
                        registerNewContent(currentParent, currentLevel);
                    }
                },            
                {
                    id:"registerContent-clone",
                    text: "Clone",
                    title:"Clone an existing instance.",
                    click: function() {
                        $(this).dialog("close");
                        $("#dialog-registerContent").remove();
                        var cloneData = {
                            parent: currentParent,
                            level: currentLevel,
                            user : user
                        };
                        socket.emit('getClonables', cloneData);
                    }
                }                

            ]
        });

        $(function () {
            $(document).tooltip();
        });
    }

    /************************************************************************************END PREFS*/
    /************************************************************************************
     REGISTER NEW CONTENT
     ************************************************************************************/
        //Launch Register CONTENT Dialog
    function registerNewContent(myParent, myLevel) {
        currentParent = myParent;
        currentLevel = myLevel;
        var msg;
        //Create html strings for the dialog popups, depending upon menu level.
        if (myParent == "root") {
            msg = '<div id="dialog-registerNewContent" title="Add New Program">';
            msg += '<p class="validateTips">Add the new program details below.</p>';
            msg += '<label for="myName" class="regField">name: </label>';
            msg += '<input type="text" name="myName" id="myName" value="" class="regText text ui-widget-content ui-corner-all" />';
            msg += '</div>';
        } else if (myLevel == "project") {
            //WHEN WE WANT TO TURN APPLICATIONS BACK ON COMMENT OUT THE LINE BELOW AND UNCOMMENT THE LINE ABOVE.
            msg = '<div id="dialog-registerNewContent" title="Add New Course">';
            msg += '<p class="validateTips">You are adding a new course to the ' + myParent.find("span").first().text() + ' program. Fill in the name for your new course.</p>';
            msg += '<label for="myName" class="regField">name: </label>';
            msg += '<input type="text" name="myName" id="myName" value="" class="regText text ui-widget-content ui-corner-all" />';
            msg += '</div>';
        } else if (myLevel == "lesson") {
            msg = '<div id="dialog-registerNewContent" title="Add New Lesson">';
            msg += '<p class="validateTips">You are adding a new lesson to the ' + myParent.find("span").first().text() + ' course.</p>';
            msg += '<p>Fill in the details below for your new lesson.</p>';
            msg += '<label for="myName" class="regField">name: </label>';
            msg += '<input type="text" name="myName" id="myName" value="" class="regText text ui-widget-content ui-corner-all" />';
            msg += '</div>';
        }
       if(myParent != "root"){
         parentString = myParent.find("span").first().text();
       }

        //Append the string to the stage
        $("#stage").append(msg);
        $("#myName").alphanum();
        //Convert string to dialog
        $("#dialog-registerNewContent").dialog({
            modal: true,
            width: 550,
            close: function (event, ui) {
                enableMainKeyEvents();
                disableRegisterContentKeyEvents();
            },
            open: function (event, ui) {
                disableMainKeyEvents();
                enableRegisterContentKeyEvents()
            },
            buttons: [{
                id:"registerNewContent-cancel",
                text: "Cancel",
                click: function() {
                    $(this).dialog("close");
                    $("#myName").remove();
                    $("#myType").remove();
                    $("#dialog-registerNewContent").remove();
                }
            },{
                id:"registerNewContent-submit",
                text: "Submit",
                click: submitRegisterNewContent
            }]
        });
    }

    /************************************************************************************
    REMOVE CONTENT
    ************************************************************************************/
    function removeContent(myParent){
        currentParent = myParent;
        currentLevel = myParent.data('type');
	    $("#stage").append('<div id="dialog-removeContent" title="Remove this '+currentLevel+'"><p class="validateTips">Are you sure that you want to remove '+myParent.find("span").first().text()+'?</div>');

	    $("#dialog-removeContent").dialog({
            modal: true,
            width: 550,
            close: function (event, ui) {
                enableMainKeyEvents();
                disableRegisterContentKeyEvents();
            },
            open: function (event, ui) {
                disableMainKeyEvents();
                enableRegisterContentKeyEvents()
            },
            buttons: {
                Cancel: function () {
                    $(this).dialog("close");
                    $("#dialog-removeContent").remove();
                },
                Remove: submitRemoveContent
            }
        });
    }
   

    /*************************************************************************************************
     LEVAE PAGE CODE
     *************************************************************************************************/
        //Called from C_Engine.js - allows for transitions - fade the page first then load the new.
    this.destroySelf = function () {
        if (transition == true) {
            TweenMax.to($('#stage'), transitionLength, {css: {opacity: 0}, ease: transitionType, onComplete: fadeComplete});
        } else {
            fadeComplete();
        }
    }

    //After transitions are completed, load the next page.
    function fadeComplete() {
        //Calls loadPage in C_Engine.js
        loadPage();
    }

    /************************************************************************************************* END OF DASHBOARD CLASS*/
}
