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
    var allLessonsComplete = true;
    var allLessonsPassed = true;
    var allLessonsScore = 0.0;
    var lessonsScored = 0;
    var courseId;
    


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
        //socket.emit('configLrs');


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
	    $("#stage").empty();
	    $stage = $('#stage');

        $("#gotoLMS").click(function(){
            dashMode = 'lms'; 
            $("#stage").remove();
            socket.emit('checkLoginStatus');
        });
		
		//socket.emit('getHostedContent', {loc: "indahuas", path: "start"});
    }
    
    function updateTOC(_data){
	    //Clear the project list
        module_arr = [];
	    if (transition == true) {
			$('#stage').css({'opacity': 0});
     	}
        courseData = _data;

        var courseDisplayTitle = $(courseData).find("course").attr("coursedisplaytitle");
        if(courseDisplayTitle == undefined){
            courseDisplayTitle = $(courseData).find("course").attr("name");
        }
        courseId = $(courseData).find("course").attr("id");
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
                 moduleObj.excludeFromPublish = $(courseData).find("item").eq(y).attr("excludeFromPublish");
                 if ( moduleObj.excludeFromPublish != null && moduleObj.excludeFromPublish == 'false' )
                 {
                    module_arr.push(moduleObj);
                 }
            }
        }

	    var msg;
        msg = '<div class="C_CourseItem">';
        msg += '<img class="C_LMSCoursePoster" src="./css/images/placeholder.png"></img>';
        msg += '<div class="C_LMSCourseItemContent">';
        msg += '<div class="C_LMSCourseTitle">'+courseDisplayTitle+'<span class="C_CloseCourseButton">X</span></div>';
        msg += '<div class="C_LMSCourseDescription">';
        msg += '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vitae magna nulla. Integer fermentum velit ac felis blandit, at dapibus quam posuere. Nulla nisi mi, ornare id turpis ac, interdum cursus lorem. Cras in mi fermentum, vestibulum orci sit amet, accumsan ipsum. Sed venenatis id purus quis pretium. Pellentesque a quam ac ex efficitur finibus ac sit amet leo. Etiam neque tortor, accumsan id tortor non, porttitor luctus arcu. Nunc sit amet mauris lacinia, ultrices sapien vel, convallis diam. Donec nec eros ac ipsum mattis tempor nec id libero. Etiam quis auctor nibh.</p>';
        msg += '<p>Type:<br/>Reports Generation</p>';
        msg += '<p>Duration: 1.25 hours<br/>Assigned by: John Smith | Published: 21OCT2015 | Complete by: 01JAN2016</p>';
        msg += '</div>';
		msg += '<div id="C_LMSLessonListHolder" class="C_LMSLessonListHolder">';
	    allLessonsComplete = true;
	    for(var i = 0; i < module_arr.length; i++){	
			msg += '<div class="C_LMSLessonListItem">';
			msg += '<div class="C_LMSLessonName">' + module_arr[i].name + '</div>';
			var lessonStatus = getLessonStatus(module_arr[i].path);
            msg += '<img class="C_LMSLessonStatus" src="./css/images/lms_status_' + lessonStatus.completion + '.png" title="status: ' + lessonStatus.completion + '" alt="lesson status ' + lessonStatus.completion + '">';
			msg += '<div class="C_LMSLaunchButton" title="'+ module_arr[i].name +'" data-fancybox-type="iframe" href="' + module_arr[i].indexPath + '" data-path="'+ module_arr[i].path +'">launch</div>';
			msg += '</div>';
	    }

        msg += '</div></div>';
        msg += '<div class="clear-div"></div></div>';

        $stage.append(msg);
        
        $(".C_CloseCourseButton").click(function(){
            dashMode = 'lms';
            socket.emit('checkLoginStatus');
        });
	    
        $(".C_LMSLaunchButton").click(function(){
            for(var j = 0; j < module_arr.length; j++){
                // console.log(module_arr[j].name);
                // console.log($(this).attr('title'));
                if(module_arr[j].name === $(this).attr('title')){
                    currentLesson = module_arr[j];
                    break;
                }
            }
        });


	    $(".C_LMSLaunchButton").fancybox({
            maxWidth    : '100%',
            maxHeight   : '100%',
            fitToView   : false,
            width       : '100%',
            height      : '100%',
            autoSize    : false,
            closeClick  : false,
            openEffect  : 'fade',
            closeEffect : 'fade',
            live: false,
            beforeClose: function(){
                console.log("beforeClose Fancybox");
                API_1484_11.Terminate("");
                dashMode = 'player';
                socket.emit('checkLoginStatus');                
            } 
		});
		
        if(allLessonsComplete){
            alert("congrats you completed the course");
            //set course complete in LRS
            completeCourse(courseDisplayTitle);
            //unenroll student from the course
            var contentData = {
                content: {                    
                    id: courseId
                },
                user: user
            };
            dashMode = 'lms';
            socket.emit('removeUserFromCourse', contentData );            
        }
    
	    //Once everything is loaded - fade page in.
        if (transition == true) {
            TweenMax.to($stage, transitionLength, {css: {opacity: 1}, ease: transitionType});
        }
    }

    function getLessonStatus(name){
        var search = ADL.XAPIWrapper.searchParams();
        search['agent'] = JSON.stringify(agent);
        //console.log(agent);
        search['activity'] = name + "?attemptId=" + attemptId;
        console.log(name + "?attemptId=" + attemptId);
        search['related_activities'] = true;      
        res = ADL.XAPIWrapper.getStatements(search);
        console.log("all learner's statements for the lesson");
        console.log(res);
        var _completion = "unknown";
        var _success = "unknown";
        var _score = null;
        if(res.statements.length != 0){
            var lastLessonStatement = res.statements[0];

            if(lastLessonStatement.result != undefined && lastLessonStatement.result != "undefined"){
                _completion = lastLessonStatement.result.completion ? "completed" : "incomplete";
                if(lastLessonStatement.result.success != undefined && lastLessonStatement.result.success != "undefined"){
                    _success = lastLessonStatement.result.success ? "passed" : "failed";
                }
                if(lastLessonStatement.result.score != undefined && lastLessonStatement.result.score != "undefined"){
                    _score = lastLessonStatement.result.score.scaled;
                }
            }
        }

        if(allLessonsComplete){
            if(_completion != "completed"){
                allLessonsComplete = false;
            }
        }

        if(allLessonsPassed){
            if(_success == "failed"){
                allLessonsPassed = false;
            }
        }

        var result = { 
            completion: _completion,
            success: _success,
        };

        if(_score != null){
            result.scorescaled = _score;
            allLessonsScore = allLessonsScore + _score;
            lessonsScored++;
        }

        return result;

    }

    function completeCourse(_title){
        var stmt =  new ADL.XAPIStatement(
            new ADL.XAPIStatement.Agent(agent),
            ADL.verbs.completed,
            new ADL.XAPIStatement.Activity(coursePath, _title, _title + ' course')
        );  

        stmt.generateId();
        stmt.object.definition.type = 'http://adlnet.gov/expapi/activities/course';

        stmt.result = {
            "success": allLessonsPassed,
            "completion" : true
        };

        if(lessonsScored > 0){
            stmt.result.score= {
                "scaled" : parseFloat(allLessonsScore/lessonsScored)
            };
        }

        stmt.context = {
            "contextActivities": {
                "category": [
                   {
                      "id": "https://w3id.org/xapi/adl/profiles/scorm"
                   }
                ]
            }
        };   
        console.log("course completion");
        console.log(stmt);
        var response = ADL.XAPIWrapper.sendStatement(stmt);    
        console.log(response); 
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
