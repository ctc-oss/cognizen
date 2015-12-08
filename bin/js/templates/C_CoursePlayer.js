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
    var module_arr = [];
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
	    $("body").append("<div id='stage2' class='C_LMSStage'></div>");
	    $stage = $('#stage2');
        $stage.append("<div id='gotoLMS' style='position:relative;left:80%;'>close course</div>");
        $('#myCanvas').css('opacity', '0');
        $("#gotoLMS").button({
            icons: {
                primary: "ui-icon-circle-plus"
            }
        });        

        $("#gotoLMS").click(function(){
            dashMode = 'lms'; 
            $('#myCanvas').removeClass('noBackground').css('opacity', '1');
            $("#stage2").remove();
            socket.emit('checkLoginStatus');
        });

        $('#myCanvas').addClass('noBackground');
        //$stage.load(_path);
		
		socket.emit('getHostedContent', {loc: "indahuas", path: "start"});
    }
    
    function updateTOC(_data){
	    //Clear the project list
	    //$("#projList").empty();
	    if (transition == true) {
			$('#stage2').css({'opacity': 0});
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
				moduleObj.parent = null;
				moduleObj.parentDir = coursePath;
				moduleObj.path = coursePath + "/" +$(courseData).find("item").eq(y).attr("name");
				moduleObj.xml = null;
				moduleObj.xmlPath = ["/", encodeURIComponent($(courseData).find("item").eq(y).attr("name").trim()), "/xml/content.xml"].join("");
				moduleObj.indexPath = ["../hosted/"+course+"/", encodeURIComponent($(courseData).find("item").eq(y).attr("name").trim()), "/index.html"].join("");
				module_arr.push(moduleObj);
				
				//var currentXML = [coursePath, "/", encodeURIComponent($(courseData).find("item").eq(y).attr("name")), "/xml/content.xml"].join("");
				//importModuleXML(currentXML);
            }
        }

	    var msg;
        msg = '<h2 class="C_LMSCourseTitle">'+courseDisplayTitle+'</h2>';
		msg += '<div id="C_LMSLessonListHolder" class="C_LMSLessonListHolder">';
	    
	    for(var i = 0; i < module_arr.length; i++){
				
				msg += '<div class="C_LMSMenuItem" title="'+ module_arr[i].name +'" data-fancybox-type="iframe" href="' + module_arr[i].indexPath + '" data-path="'+ _data[i] +'">';
				
				msg += module_arr[i].name;
				msg += '</div>';
				
	    }

        msg += '</div>';

        $stage.append(msg);
	    
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
            TweenMax.to($('#stage2'), transitionLength, {css: {opacity: 0}, ease: transitionType, onComplete: fadeComplete});
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
