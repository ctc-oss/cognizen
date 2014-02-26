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

    var type = _type;
    var proj;
    var hoverSubNav = false; //Boolean toggle to not launch project/lesson when adding a user.
    var userRoster;
    var currentParent;
    var currentLevel;
    var parentString = "";
    var assignParent;


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
        
        socket.on('contentPermissions', function(data){
	        assignUser(data);
        });

        socket.on('receiveProjectsFromDB', function (data) {
            //console.log(data);
            $("#preloadholder").remove();
            proj = data;
            buildTemplate();
        });

        //Message sent from the server when they try to register an already registered e-mail account.
        socket.on('registrationFailed', function () {
            var myTitle = "Registration Failed";
            var myMessage = "<p>Your registration attempt to register this user failed!</p><p>The e-mail address that you provided has already been registered.</p>";
            doError(myTitle, myMessage);
        });

        //Message sent from the server letting the user know that their registration attempt was successful.
        socket.on('registrationSuccess', function () {
            socket.emit('getUserList');
            var myTitle = "Registration Success";
            var myMessage = "<p>You have successfully registered the user to the system!</p><p>A confirmation e-mail has been sent to their e-mail account. The user must click on the conformation link in that mail to enable their credentials before before logging into the cognizen content creation tool.</p>";
            doError(myTitle, myMessage);
        });

        socket.on('contentAdded', function (content) {
            // Find the list item, and attach the id to the data.
            $('#' + idIfyPath(content.path)).data('id', content._id);
        });

        socket.on('contentServerStarted', function (details) {
            var url = [window.location.protocol, '//', window.location.host, '/programs/', details.path, '/index.html?id=', details.id, '&type=', details.type, '&u=', user._id].join('');
            openProject(url);
        });

        socket.on('contentServerDidNotStart', function (details) {
            doError('Error Loading Content', details.message);
        });

        socket.on('generalError', function(details) {
            $("#preloadholder").remove();
            doError(details.title, details.message);
        });

        socket.on('refreshDashboard', function() {
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
        var admin = user.admin;

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

        $stage.append("<div id='projListHeader'>projects:</div>");
        
        $stage.append("<div id='logout'><a href='/logout'>logout</a></div>");

        /*****************************************************************************
         BUILD Program Tree - It is a <UL> which is handled by the tree class in libs/jqTree - Styled in the CSS
         *****************************************************************************/
        $stage.append("<ul id='projList' class='filetree'></ul>");
		
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
	                    if (proj.directories[j].name == parentName) {
	                        var parent = proj.directories[j].id;
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
	                    $(parentID).append("<ul id='" + newULID + "'><li id='" + idIfiedPath + "' class='closed'><span class='folder'>" + unescape(proj.directories[i].name) + "</span></li></ul>");
	                }
	            }
	            tree_arr.push(project);
	        }
        }

        $("#projList").append("</ul>");

        $("#projList").listorder();//Alphabetize root.

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

        var programAdmin = false;
        
        if (!admin) {
            // Check if user is a program admin
            for (var i = 0; i < user.permissions.length; i++) {
                var permission = user.permissions[i];
                if (permission.permission == 'admin') {
                    programAdmin = true;
                    break;
                }
            }
        }

            //ADDING PROGRAMS IS ROOT ONLY
        if (admin) {
            $stage.append("<div id='adminAddProgram'>add program</div>");
            $("#adminAddProgram").button({
                icons: {
                    primary: "ui-icon-circle-plus"
                }
            });

            $("#adminAddProgram").click(function () {
                registerContent("root", "root");
            });
        }
        if (admin || programAdmin) {

            //ROOT and admin can add users to the system.
            $stage.append("<div id='adminAddUser'>add user</div>");
            $("#adminAddUser").button({
                icons: {
                    primary: "ui-icon-circle-plus"
                }
            });

            $("#adminAddUser").click(registerUser);
        }

        ///////////////////////////////////////////////////////////////END ROOT ONLY ----------------------------STILL NEEDS TO BE SET UP ONCE USER TYPES ARE BEING RETURNED.  SIMPLE IF STATEMENT WILL SUFFICE

        //Once everything is loaded - fade page in.
        if (transition == true) {
            TweenMax.to($stage, transitionLength, {css: {opacity: 1}, ease: transitionType/*, onComplete: getUserList*/});
        }
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
	                    $(this).append("<div id='myRemove' class='programRemove' title='remove the " + $(this).parent().find("span").first().text() + " program.'></div>");
	                    $(this).append("<div id='myAdd' class='programAdd' title='add a project to " + $(this).parent().find("span").first().text() + "'></div>");
	                    $(this).append("<div id='myUserAdd' class='programUserAdd' title='manage users for " + $(this).parent().find("span").first().text() + "'></div>");
					}
                } else if (myItem.data('type') == "course") {
                    $(this).addClass("courseHover");
                    if(myItem.data('permission') == "admin"){
	                    $(this).append("<div id='myPref' class='coursePref' title='adjust preferences for the " + $(this).parent().find("span").first().text() + " course.'></div>");
	                    $(this).append("<div id='myRemove' class='courseRemove' title='remove the " + $(this).parent().find("span").first().text() + " course.'></div>");
	                    $(this).append("<div id='myAdd' class='courseAdd' title='add a lesson to " + $(this).parent().find("span").first().text() + "'></div>");
	                    $(this).append("<div id='myUserAdd' class='courseUserAdd' title='manage users for " + $(this).parent().find("span").first().text() + "'></div>");
					}
                } else {
                    $(this).addClass("projectHover");
                    if(myItem.data('permission') == "admin"){
	                    $(this).append("<div id='myPref' class='projectPref' title='adjust preferences for the " + $(this).parent().find("span").first().text() + " project.'></div>");
	                    $(this).append("<div id='myRemove' class='projectRemove' title='remove the " + $(this).parent().find("span").first().text() + " project.'></div>");
	                    $(this).append("<div id='myUserAdd' class='projectUserAdd' title='manage users for " + $(this).parent().find("span").first().text() + "'></div>");
	                }
                }
			 
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
                    }
                }
            }
        );
    }
	
	var moduleLessonWindow;
    /****************************************************************************************************************************END OF ROLLOVERS FOR TREE ITEMS*/
    //////OPEN A PROJECT\\\\\\
    function openProject(projectPath) {
        var myPath = projectPath.replace(/\s/g, "%20");
        windowWidth = screen.width; //window.innerWidth; -------- Currently not used - locking to 1024
        windowHeight = screen.height //window.innerHeight; -------- Currently not used - locking to 768
        moduleLessonWindow = window.open(myPath, "AlertLesson", "toolbar=0, location=0, directories=0, status=0, menubar=0, resizable=0, scrollbars=1, width=1024, height=768");
        //moduleLessonWindow = window.open(myPath, '_blank');//, "AlertLesson", "toolbar=0, location=0, directories=0, status=0, menubar=0, resizable=0, scrollbars=1, width=1024, height=768");
        moduleLessonWindow.focus();
    }
    
	//If closing the dashboard, close the lesson....
    function myUnloadHandler(evt)
    {
        if (evt.persisted) {
            // This is actually a pagehide event and the page is going into the Page Cache.
            // Make sure that we don't do any destructive work, or work that shouldn't be duplicated.
            console.log("persisted close");

            return;
        }

        // This is either an unload event for older browsers,
        // or a pagehide event for page tear-down in supported browsers.
        // It's safe to do everything my old unload event handler did here.
        //console.log("close");
        if(moduleLessonWindow){
        	//var r = confirm("Closing the dashboard will also close all open lesson windows.")
			//if (r){
				//alert("closing")
				moduleLessonWindow.close();
			//}
        }
    }

    if ("onpagehide" in window) {
        window.addEventListener("pagehide", myUnloadHandler, false);
    } else {
        window.addEventListener("unload", myUnloadHandler, false);
    }

    function getUserList(_id) {
        socket.emit('getPermissions', {content: {id: _id}});
    }

    /************************************************************************************
     ASSIGN USER TO CONTENT
     ************************************************************************************/
    function assignUser(data) {
    	
    	var userData = data;
    	var msg = '<div id="dialog-assignUser" title="Assign User Rights"><p class="validateTips">Assign user roles to '+ assignParent.find("span").first().text() +':</p>';   // for ' + $parent.find("span").first().text() + ':</p>';
    	msg += '<table class="userSelectTable" border="1" align="center"><tr><th>Name</th><th>admin</th><th>editor</th><th>review</th><th>none</th></tr>';
    	for (var i = 0; i < data.length; i++){
	    	var adminChecked = data[i].permission == 'admin' ? ' checked' : '';
	    	var editorChecked = data[i].permission == 'editor' ? ' checked' : '';
	    	var reviewerChecked = data[i].permission == 'reviewer' ? ' checked' : '';
	    	var noneChecked = data[i].permission == null ? ' checked' : '';
			
		    msg += '<tr><td id="user'+ i+ '" class="assignUserName" title="'+data[i].username +'">' + data[i].firstName + ' ' + data[i].lastName + '</td>';
		    msg += '<td align="center"><input type="radio" name="rightsLevel'+i+'" value="admin" ' + adminChecked + '></td>';
		    msg += '<td align="center"><input type="radio" name="rightsLevel'+i+'" value="editor" ' + editorChecked + '></td>';
		    msg += '<td align="center"><input type="radio" name="rightsLevel'+i+'" value="reviewer" ' + reviewerChecked + '></td>';
		    msg += '<td align="center"><input type="radio" name="rightsLevel'+i+'" value="null" ' + noneChecked + '></td></tr>';
    	}
    	
    	msg += '</table></div>';
    	$("#stage").append(msg);
    	
    	for(var i = 0; i < data.length; i++){
	    	$("#user"+i).tooltip();
    	}
    	//Make it a dialog
        $("#dialog-assignUser").dialog({
            modal: true,
            width: 550,
            close: function (event, ui) {
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
                    	var tmpObj = {id: data[i].id, permission: myPermission};
	                    user_arr.push(tmpObj)
	                    //console.log(tmpObj);
                    }
                    
                    
                    socket.emit('assignContentToUsers', {
                        content: {
                            type: assignParent.data('type'),
                            id: assignParent.data('id')
                        },
                        users: user_arr
                    });

                    $(this).dialog("close");
                    $("#dialog-assignUser").remove();
                }
            }
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
        var nameString = $("#myName").val();

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

        $("#dialog-registerContent").dialog("close");
        $("#myName").remove();
        $("#myType").remove();
        $("#dialog-registerContent").remove();
    }
    
    function submitRemoveContent() {
        var content = {
            id: currentParent.attr('id'),
            type: currentLevel,
            user: user
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

    function submitRegisterUser() {
        if (checkRegister() == true) {
            socket.emit("registerUser", { firstName: $("#firstName").val(), lastName: $("#lastName").val(), user: $("#regEmail").val(), pass: $("#regPassword").val()});
            $("#firstName").remove();
            $("#lastName").remove();
            $("#regEmail").remove();
            $("#regPassword").remove();
            $("#regPasswordVer").remove();
            $("#dialog-registerUser").dialog("close");
            $("#dialog-registerUser").remove();
        }
    }
	
	
	 /************************************************************************************
     REGISTER NEW CONTENT
     ************************************************************************************/
    function doPrefs(myParent){
	    currentParent = myParent;
	    currentLevel = myParent.data('type');
	    
	    var msg;
	    if (currentLevel == "program") {
        	msg = '<div id="dialog-updatePrefs" title="Update Program Prefs">';
            msg += '<p class="validateTips">Customize your program preferences below:</p>';
            msg += '<p>Functionalities to be added shortly.</p>';
            msg += '</div>';
	    } else if (currentLevel == "course") {
            msg = '<div id="dialog-updatePrefs" title="Update Course Prefs">';
            msg += '<p class="validateTips">Customize your preferences for the '+ myParent.find("span").first().text() + ' course below:</p>';
            msg += '<p>';
            msg += '<label for="myName" class="regField">name: </label>';
            msg += '<input type="text" name="myName" id="myName" value="'+ myParent.find("span").first().text() + '" class="regText text ui-widget-content ui-corner-all" />';
            msg += '</p>';
            msg += "<br/><p>";
            msg += "<form id='scormform' title='Set SCORM Version'>";
            msg += "<label id='label'>SCORM Version: </label>";
            msg += "<select id='scormVersion'>";
            msg += "<option>2004_4th</option>";
            msg += "<option>2004_3rd</option>";
            msg += "<option>2004_USSOCOM</option>";
            msg += "<option>none</option>";
            msg += "</select></form>";
            msg += "</p>";              
            msg += '</div>';
            enableRenameContentKeyEvents()
	    } else if (currentLevel == "lesson") {
            msg = '<div id="dialog-updatePrefs" title="Update Lesson Prefs">';
            msg += '<p class="validateTips">Customize your preferences for the '+ myParent.find("span").first().text() + ' lesson below:</p>';
            msg += '<p>';
            msg += '<label for="myName" class="regField">name: </label>';
            msg += '<input type="text" name="myName" id="myName" value="'+ myParent.find("span").first().text() + '" class="regText text ui-widget-content ui-corner-all" />';
            msg += '</p>';
            msg += "<br/><p>";
            msg += "<form id='scormform' title='Set SCORM Version'>";
            msg += "<label id='label'>SCORM Version: </label>";
            msg += "<select id='scormVersion'>";
            msg += "<option>2004_4th</option>";
            msg += "<option>2004_3rd</option>";
            msg += "<option>1.2</option>";
            msg += "<option>2004_SGST</option>";
            msg += "<option>none</option>";
            msg += "</select></form>";
            msg += "</p>";         
            msg += '</div>';
            enableRenameContentKeyEvents()
        }
        
         //Append the string to the stage
        $("#stage").append(msg);
        
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
                    $("#myName").remove();
                    $("#myType").remove();
                    $("#dialog-updatePrefs").remove();
                },
                Submit: function(){
                	submitPrefUpdate(myParent, currentLevel);
                },
                Publish: function(){
                    var selectedScorm = $('#scormVersion').find(':selected').text();
                    clickPublish(myParent, currentLevel, selectedScorm);
                    $(this).dialog("close");
                    $("#myName").remove();
                    $("#myType").remove();
                                       
                }
            }
        });

        $("#scormform").tooltip();
        //$("#scormVersion").val($(data).find('scormVersion').attr('value'));        
        
    }

    function clickPublish(parent, level, selectedScorm){

        
        if(level === 'course'){
            // var msg;
            // msg = '<div id="dialog-clickPublish" title="Publish a SCORM ' + selectedScorm + ' '+ level +'.">';
            // msg += '<p class="validateTips">Under construction. </p>';
            // msg += '<p>Functionalities to be added shortly.</p>';
            // msg += '</div>';

            // $("#stage").append(msg);

            // $("#dialog-clickPublish").dialog({
            //     modal: true,
            //     width: 550,
            //     close: function (event, ui) {
            //         enableMainKeyEvents();
            //         disableRenameContentKeyEvents();
            //     },
            //     open: function (event, ui) {
            //         disableMainKeyEvents();
            //        enableRenameContentKeyEvents()
            //    },
            //    buttons: {
            //         Close: function () {
            //             $(this).dialog("close");
            //             $("#dialog-clickPublish").remove();
            //         }
            //     }
            // });
            $('#myCanvas').append('<div id="publishLoader"><div id="publishLoaderText">Please Wait.<br/><br/>The little gnomes at our server facility are casting all kinds of spells to ensure that your content will work perfectly in any SCORM ' + $(data).find('scormVersion').attr('value') + ' conformant LMS as well as run nicely on your android or iOS mobile device.<br/><br/>These guys are artisans, this may take a couple of minutes.</div></div>');
            disableRenameContentKeyEvents()
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
                }
            };

            // socket.emit('publishContent', data, function(fdata){
            //     $("#dialog-updatePrefs").remove(); 
            //     $('#publishLoader').remove();
            // });
        }

        else{
            $('#myCanvas').append('<div id="publishLoader"><div id="publishLoaderText">Please Wait.<br/><br/>The little gnomes at our server facility are casting all kinds of spells to ensure that your content will work perfectly in any SCORM ' + $(data).find('scormVersion').attr('value') + ' conformant LMS as well as run nicely on your android or iOS mobile device.<br/><br/>These guys are artisans, this may take a couple of minutes.</div></div>');
            disableRenameContentKeyEvents()
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
                }
            };

        }

        socket.emit('publishContent', data, function(fdata){
            fdata = fdata.replace(/\\/g, '/');
            var splitPath = fdata.split("/");
			var first = true;
            var notYet = true;
            var dlPath = "";
            for(var i = 0; i < splitPath.length; i++){
                if(splitPath[i] == "programs"){
                    notYet = false;
                }
                /*if(notYet == false){
                    dlPath += "/";
                    dlPath += splitPath[i];
                }*/
                
                if(notYet == false){
					if(first == false){
						dlPath += "/";
					}else{
						first = false;
					}
					dlPath += splitPath[i];
				}
            }            
            
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

    
    function submitPrefUpdate(_myParent, _myLevel){
		disableRenameContentKeyEvents()
        var data = {
            content: {
                id: currentParent.attr('id'),
                type: currentLevel,
                name: $("#myName").val() // TODO: Need to prompt for this, in the meantime, this is a random string
            },
            user: {
                id: user._id,
                username: user.username
            }
        };

        socket.emit('renameContent', data);

	    $("#dialog-updatePrefs").remove();
    }
    
    /************************************************************************************END PREFS*/
    /************************************************************************************
     REGISTER NEW CONTENT
     ************************************************************************************/
        //Launch Register CONTENT Dialog
    function registerContent(myParent, myLevel) {
        currentParent = myParent;
        currentLevel = myLevel;
        var msg;
        //Create html strings for the dialog popups, depending upon menu level.
        if (myParent == "root") {
            msg = '<div id="dialog-registerContent" title="Add New Program"><p class="validateTips">Add the new program details below.</p><label for="myName" class="regField">name: </label><input type="text" name="myName" id="myName" value="" class="regText text ui-widget-content ui-corner-all" /></div>';
        } else if (myLevel == "project") {
            //msg = '<div id="dialog-registerContent" title="Add New Project"><p class="validateTips">You are adding a new project to the ' + myParent.find("span").first().text() + ' program. Fill in the details below for your new project.</p><label for="myName" class="regField">name: </label><input type="text" name="myName" id="myName" value="" class="regText text ui-widget-content ui-corner-all" /><br/><br/>select a project type:<br/><div id="myType" class="radioSelector"><input type="radio" name="myType" value="course" checked>course<br><input type="radio" name="myType" value="application">application</div></div>';
            //WHEN WE WANT TO TURN APPLICATIONS BACK ON COMMENT OUT THE LINE BELOW AND UNCOMMENT THE LINE ABOVE.
            msg = '<div id="dialog-registerContent" title="Add New Project"><p class="validateTips">You are adding a new course to the ' + myParent.find("span").first().text() + ' program. Fill in the name for your new course.</p><label for="myName" class="regField">name: </label><input type="text" name="myName" id="myName" value="" class="regText text ui-widget-content ui-corner-all" /></div>';
        } else if (myLevel == "lesson") {
            msg = '<div id="dialog-registerContent" title="Add New Lesson"><p class="validateTips">You are adding a new lesson to the ' + myParent.find("span").first().text() + ' course.</p> <p>Fill in the details below for your new lesson.</p><label for="myName" class="regField">name: </label><input type="text" name="myName" id="myName" value="" class="regText text ui-widget-content ui-corner-all" /></div>';
        }
	   if(myParent != "root"){
	  	 parentString = myParent.find("span").first().text();
	   }
        //Append the string to the stage
        $("#stage").append(msg);
        //Convert string to dialog
        $("#dialog-registerContent").dialog({
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
                id:"registerContent-cancel",
                text: "Cancel",
                click: function() {
                    $(this).dialog("close");
                    $("#myName").remove();
                    $("#myType").remove();
                    $("#dialog-registerContent").remove();
                }
            },{
                id:"registerContent-submit",
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
    /************************************************************************************
    REGISTER NEW USERS
    ************************************************************************************/
    //Launch Register USER Dialog
    function registerUser() {
        $("#stage").append('<div id="dialog-registerUser" title="Add New User"><p class="validateTips">Add the new users details below.</p><label for="firstName" class="regField">first name: </label><input type="text" name="firstName" id="firstName" value="" class="regText text ui-widget-content ui-corner-all" /><br/><label for="lastName" class="regField">last name: </label><input type="text" name="lastName" id="lastName" value="" class="regText text ui-widget-content ui-corner-all" /><br/><label for="regEmail" class="regField">email: </label><input type="text" name="regEmail" id="regEmail" value="" class="regText text ui-widget-content ui-corner-all" /><br/><label for="regPassword" class="regField">password: </label><input type="password" name="regPassword" id="regPassword" value="" class="regText text ui-widget-content ui-corner-all" /><br/><label for="regPasswordVer" class="regField">verify password: </label><input type="password" name="regPasswordVer" id="regPasswordVer" value="" class="regText text ui-widget-content ui-corner-all" /></div>');
        $("#dialog-registerUser").dialog({
            modal: true,
            width: 550,
            close: function () {
                enableMainKeyEvents();
                disableRegisterUserKeyEvents();
            },
            open: function () {
                disableMainKeyEvents();
                enableRegisterUserKeyEvents();
            },
            buttons: {
                Cancel: function () {
                    $("#firstName").remove();
                    $("#lastName").remove();
                    $("#regEmail").remove();
                    $("#regPassword").remove();
                    $("#regPasswordVer").remove();
                    $(this).dialog("close");
                    $("#dialog-registerUser").remove();
                },
                Submit: submitRegisterUser
            }
        });
    }

    /********************************************************************************************************************END REGISTER NEW USER*/


    /************************************************************************************
     CHECK THAT EMAIL IS VALID FORMAT
     ************************************************************************************/
    function isValidEmailAddress(emailAddress) {
        var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
        return pattern.test(emailAddress);
    };

    /************************************************************************************
     checkRegister - Check that requirements for registration are met before sending to the server.
     ************************************************************************************/
        //Check that requirements for registration are met before sending to the server.
    function checkRegister() {
        $("#regError").remove();
        if ($("#regPassword").val() == $("#regPasswordVer").val()) {
            var myDomain = $("#regEmail").val().slice(-3);
            if ($("#firstName").val() != "" && $("#lastName").val() != "") {
                if (isValidEmailAddress($("#regEmail").val())) {
                    return true;
                } else {
                    $("#dialog-registerUser").append("<div id='regError' style='color:#FF0000'><br/><br/><br/><br/>* You must register with a valid e-mail account.</div>");
                }
            } else {
                $("#dialog-registerUser").append("<div id='regError' style='color:#FF0000'><br/><br/><br/><br/>* The name fields are mandatory.</div>");
            }
        } else {
            $("#dialog-registerUser").append("<div id='regError' style='color:#FF0000'><br/><br/><br/><br/>* Your password entries must match.</div>");
        }
    }


    /************************************************************************************
     CHECK THAT EMAIL IS VALID FORMAT - Pop-up Box for issues from the server.
     ************************************************************************************/
    function doError(title, msg) {
        $("#stage").append('<div id="dialog-error"><p>' + msg + '</p></div>');

        $("#dialog-error").dialog({
            modal: true,
            width: 520,
            title: title,
            buttons: {
                Ok: function () {
                    $(this).dialog("close");
                    $("#dialog-error").remove();
                }
            }
        });
    }

    /************************************************************************************************* END OF REGISTRATION CODE*/

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