/*!
 * C_CoursePlayer
 * Dashboard for the cognizen tool
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 0.1
 * DATE: 2013-04-26
 * JavaScript
 *
 * Copyright (c) 2013, CTC. All rights reserved.
 *
 */
var API_1484_11 = {
            Initialize : function(){

                // var state = {'myactid' : currentLesson.path,
                //     'agent' : {'mbox' : user.username},
                //     'stateid' : 'http://adlnet.gov/xapi/profile/scorm/activity-state'
                // };
                // socket.emit('getXapiState', state, function(data){

                     attemptId = ADL.ruuid();
                    //initialize xapi statement
                    var stmt = new ADL.XAPIStatement(
                        new ADL.XAPIStatement.Agent(ADL.XAPIWrapper.hash(user.username), user.firstName+" "+user.lastName),
                        ADL.verbs.initialized,
                        new ADL.XAPIStatement.Activity(currentLesson.path, currentLesson.name, currentLesson.name + ' lesson')
                    );
                    stmt.generateId();
                    //stmt.generateRegistration(); 
                    stmt.object.definition.type = 'http://adlnet.gov/expapi/activities/lesson';
                    stmt.context = {
                          "contextActivities":{
                             "grouping":[
                                {
                                   "id": currentLesson.parentDir,
                                   "definition":{
                                      "name":{
                                         "en-US": currentLesson.parent.name
                                      },
                                      "description":{
                                         "en-US":"The activity representing the course " + currentLesson.parent.name
                                      },
                                      "type": "http://adlnet.gov/expapi/activities/course"
                                   }
                                },
                                {
                                   "id": currentLesson.path + "?attemptId="+ attemptId,
                                   "definition":{
                                      "name":{
                                         "en-US":"Attempt of " + currentLesson.name
                                      },
                                      "description":{
                                         "en-US":"The activity representing an attempt of "+currentLesson.name+" in the course " + currentLesson.parent.name
                                      },
                                      "type": "http://adlnet.gov/expapi/activities/attempt"
                                   }
                                }
                             ],
                             "category": [
                                {
                                   "id": "https://w3id.org/xapi/adl/profiles/scorm"
                                }
                             ]
                          }
                      };                    
                 
                    socket.emit('sendXapiStatement',stmt);
                    return "true";

                // });


            },
            Terminate : function(){

                //terminate xapi statement
                var stmt = new ADL.XAPIStatement(
                    new ADL.XAPIStatement.Agent(ADL.XAPIWrapper.hash(user.username), user.firstName+" "+user.lastName),
                    ADL.verbs.terminated,
                    new ADL.XAPIStatement.Activity(currentLesson.path, currentLesson.name, currentLesson.name + ' lesson')
                );
                stmt.generateId();
                stmt.object.definition.type = 'http://adlnet.gov/expapi/activities/lesson';

                stmt.context = {
                      "contextActivities":{
                         "grouping":[
                            {
                               "id": currentLesson.parentDir,
                               "definition":{
                                  "name":{
                                     "en-US": currentLesson.parent.name
                                  },
                                  "description":{
                                     "en-US":"The activity representing the course " + currentLesson.parent.name
                                  },
                                  "type": "http://adlnet.gov/expapi/activities/course"
                               }
                            },
                            {
                               "id": currentLesson.path + "?attemptId="+ attemptId,
                               "definition":{
                                  "name":{
                                     "en-US":"Attempt of " + currentLesson.name
                                  },
                                  "description":{
                                     "en-US":"The activity representing an attempt of "+currentLesson.name+" in the course " + currentLesson.parent.name
                                  },
                                  "type": "http://adlnet.gov/expapi/activities/attempt"
                               }
                            }
                         ],
                         "category": [
                            {
                               "id": "https://w3id.org/xapi/adl/profiles/scorm"
                            }
                         ]
                      }
                  };                    
                
                stmt.result = {
                    "success": true,
                    "completion": true,
                    "score": {
                        "scaled": 0.95
                    }
                };
                socket.emit('sendXapiStatement',stmt);                

                return "true";
            },
            GetValue: function(_cmiElement){ 
                var returnValue = "testGet";
                if(_cmiElement == "cmi.objectives._count"){
                    returnValue = "0";
                }
                return returnValue;
            }, 
            SetValue: function(_cmiElement, _value){ 

                return "true";
            },
            Commit: function(){return "true"},
            GetLastError: function(){return 0},
            GetErrorString: function(_cmiErrorCode){return "errorString"},
            GetDiagnostic: function(_cmiErrorCode){return "errorString"}
        };

function C_CoursePlayer(_course) {
	var co;
    var course = _course;
    var coursePath;
    var courseData;
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
    var scrollTimer;
    var launchItemParent;
    var $stage;
    


    //Defines a public method - notice the difference between the private definition below.
    this.initialize = function () {
        if (transition == true) {
            $('#stage').css({'opacity': 0});
        }

		buildTemplate();
        /*****************************************************************************
        add socket listeners - for server connectivity.
        *****************************************************************************/
        // socket.on('recieveHostedProjectsFromDB', function(data) {
	       //  updateMenu(data);
        // });
        socket.emit('configLrs');
        receiveCoursePath();

        console.log("user = " + user);//Will be used to populate real content as a parameter in the below function
    }

    function receiveCoursePath(){
         coursePath = [window.location.protocol, '//', window.location.host, '/hosted/', course].join('');
         var xmlPath = coursePath + "/course.xml";
         console.log(xmlPath);
         courseXMLPath = xmlPath;
         $.ajax({
            type: "GET",
            url: xmlPath,
            dataType: "xml",
            async: false,
            success: updateTOC,
            error: function(){
                alert("unable to load content data")
            }
        });       
    }


    function idIfyPath(path) {
        return path.replace('/', '_');
    }


    /*****************************************************************************
     buildTemplate()
     *****************************************************************************/
    function buildTemplate(){
	    $stage = $('#stage');
        $stage.empty();
        $('#myCanvas').append("<div id='gotoLMS' style='position:relative;left:80%;'>close course</div>");
        $("#gotoLMS").button({
            icons: {
                primary: "ui-icon-circle-plus"
            }
        });        

        $("#gotoLMS").click(function(){
            dashMode = 'lms'; 
            $('#myCanvas').removeClass('noBackground');
            socket.emit('checkLoginStatus');
        });

        $('#myCanvas').addClass('noBackground');
        //$stage.load(_path);
		
		socket.emit('getHostedContent', {loc: "indahuas", path: "start"});
    }
    
    function updateTOC(_data){
	    //Clear the project list
	    //$("#projList").empty();
        module_arr = [];
	    if (transition == true) {
			$('#stage').css({'opacity': 0});
     	}
        
        courseData = _data;

        var courseDisplayTitle = $(courseData).find("course").attr("coursedisplaytitle");
        if(courseDisplayTitle == undefined){
            courseDisplayTitle = $(courseData).find("course").attr("name");
        }

        var totalModules = $(courseData).find("item").length;

        if(totalModules > 0){
            for(var y = 0; y < totalModules; y++){
                 var moduleObj = new Object();

                 moduleObj.name = $(courseData).find("item").eq(y).attr("name");
                 moduleObj.id = $(courseData).find("item").eq(y).attr("id");
                 moduleObj.parent = {"name" : courseDisplayTitle};
                 moduleObj.parentDir = coursePath;
                 moduleObj.path = coursePath + "/" + encodeURIComponent($(courseData).find("item").eq(y).attr("name").trim());
                 moduleObj.xml = null;
                 moduleObj.xmlPath = ["/", encodeURIComponent($(courseData).find("item").eq(y).attr("name").trim()), "/xml/content.xml"].join("");
                 moduleObj.indexPath = [coursePath +"/", encodeURIComponent($(courseData).find("item").eq(y).attr("name").trim()), "/index.html"].join("");
                 module_arr.push(moduleObj);

                 //var currentXML = [coursePath, "/", encodeURIComponent($(courseData).find("item").eq(y).attr("name")), "/xml/content.xml"].join("");
                 //importModuleXML(currentXML);
            }
        }

	    var msg;
        msg = '<h2>'+courseDisplayTitle+'</h2><ul>';
		msg += '<div id="C_LMSLessonListHolder" class="C_LMSLessonListHolder">';
	    
	    for(var i = 0; i < module_arr.length; i++){
				
				msg += '<div class="C_LMSMenuItem" title="'+ module_arr[i].name +'" data-fancybox-type="iframe" href="' + module_arr[i].indexPath + '" data-path="'+ _data[i] +'">';
				
				msg += module_arr[i].name;
				msg += '</div>';
				
	    }

        msg += '</ul></div>';

        $stage.append(msg);
	    
        $(".C_LMSMenuItem").click(function(){
            for(var j = 0; j < module_arr.length; j++){
                if(module_arr[j].name === $(this).attr('title')){
                    currentLesson = module_arr[j];
                    break;
                }
            }
        });

	    $(".C_LMSMenuItem").fancybox({
            maxWidth    : 1054,
            maxHeight   : 768,
            fitToView   : false,
            width       : '100%',
            height      : '100%',
            autoSize    : false,
            closeClick  : false,
            openEffect  : 'fade',
            closeEffect : 'fade' 
		});
		
    
	    //Once everything is loaded - fade page in.
        if (transition == true) {
            TweenMax.to($stage, transitionLength, {css: {opacity: 1}, ease: transitionType});
        }
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
