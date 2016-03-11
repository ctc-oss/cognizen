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
        console.log(_data);
	    var $stage = $('#stage');

        if(_data.length == 0){
            $("#projList").append('<div class="emptyList"> You are not enrolled in any courses! View the course catalog to enroll. </div>');
        }
        else{
            for(var i = 0; i < _data.length; i++){
                var msg = '<div class="C_LMSMenuItem" title="'+ _data[i].name +'" data-path="'+ _data[i].path +'">';    
                msg += _data[i].name;
                msg += '</div>';
                $("#projList").append(msg);
            }
            

            $(".C_LMSMenuItem").click(function(){
                dashMode = "player";
                currentCourse = $(this).attr('data-path');
                socket.emit('checkLoginStatus');
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
