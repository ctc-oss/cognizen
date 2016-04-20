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
function C_LMSDash(_type) {
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
    var scrollTimer;
    var launchItemParent;
    var $stage;


    //Defines a public method - notice the difference between the private definition below.
    this.initialize = function () {
        if (transition == true) {
            $('#stage').css({'opacity': 0});
        }

        ADL.XAPIWrapper.changeConfig({
            'endpoint': 'http://cde-cognizen-vm-2.ctc.com/xapi/',
            "auth" : "Basic " + toBase64('cognizen:cognizen')
        });
        agent = getAgent();

		buildTemplate();
        /*****************************************************************************
        add socket listeners - for server connectivity.
        *****************************************************************************/
        socket.on('receiveEnrolledCoursesFromDB', function(data) {
	        updateMenu(data);
        });
    }


    function idIfyPath(path) {
        return path.replace('/', '_');
    }


    /*****************************************************************************
     buildTemplate()
     *****************************************************************************/
    function buildTemplate(){
       	$("#gotoAuthoring").removeClass('navbar-active').addClass('navbar-item');
		$("#gotoLMS").addClass('navbar-active').removeClass('navbar-item'); 
	    $stage = $('#stage');
        
        $stage.html('');
        $stage.append("<div id='logout'><a href='/logout'>logout</a></div>");
        
        $stage.append("<div id='projListHeader'>my courses:</div>");
        
        var msg =  '<div id="contentHolder" class="overthrow antiscroll-inner">';
        	msg += '<div id="projList"></div>';
        	msg += '</div>';          
        $stage.append(msg);
		
		socket.emit('getEnrolledCourses', user);
    }
    
    function updateMenu(_data){
	    //Clear the project list
	    $("#projList").empty();
	    if (transition == true) {
            $('#stage').css({'opacity': 0});
        }

	    var $stage = $('#stage');

        if(_data.length == 0){
            $("#projList").append('<div class="emptyList"> You are not enrolled in any courses! View the course catalog to enroll. </div>');
        }
        else{
            for(var i = 0; i < _data.length; i++){
                var msg = '<div class="C_LMSMenuItem"><span class="C_LMSCourseItem"  title="'+ _data[i].name 
                +'" data-path="'+ _data[i].path 
                +'" data-attemptId="'+ _data[i].attemptId+'">';    
                msg += _data[i].name;
                msg += '</span><div class="C_LMSUnregister" data-id="'+ _data[i].contentId +'">withdraw</div>';   
                msg += '<div class="C_LMSLaunchButton" title="'+ _data[i].name +'" data-attemptId="'+ _data[i].attemptId+'" data-path="' + _data[i].path +'">launch</div>';
                             
                msg += '</div>';
                $("#projList").append(msg);
            }
            

            $(".C_LMSLaunchButton").click(function(){
                dashMode = "player";
                currentCourse = $(this).attr('data-path');
                attemptId = $(this).attr('data-attemptId');
                socket.emit('checkLoginStatus');
            }); 

            $(".C_LMSUnregister").click(function(){
                var contentData = {
                    content: {                    
                        id: $(this).attr('data-id')
                    },
                    user: user
                };
             
                socket.emit('removeUserFromCourse', contentData );
            });                         


        }
  	    
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
