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


    //Defines a public method - notice the difference between the private definition below.
    this.initialize = function () {
        //if (transition == true) {
            $('#stage').css({'opacity': 1});
        //}
		buildTemplate();
        /*****************************************************************************
         add socket listeners - for server connectivity.
         *****************************************************************************/
        /*socket.on('receiveProjectsFromDB', function (data) {
            $("#preloadholder").remove();
            proj = data;
            try{co.refreshOutlineData();} catch(e){};
            buildTemplate();
        });*/

        //Call the Server (C_Server.js) to get list of projects associated to the user.
        //socket.emit('getProjects', user);
        
        console.log("user = " + user);
        
    }


    function idIfyPath(path) {
        return path.replace('/', '_');
    }


    /*****************************************************************************
     buildTemplate()
     *****************************************************************************/
    function buildTemplate(){
	    var $stage = $('#stage');
        $stage.html('');

        $stage.append("<div id='projListHeader'>my courses:</div>");

        $stage.append("<div id='logout'><a href='/logout'>logout</a></div>");
        
        $stage.append("<div id='adminAddProgram'>view authoring page</div>");
        $("#adminAddProgram").button({
            icons: {
                primary: "ui-icon-circle-plus"
            }
        });

        $("#adminAddProgram").click(function () {
            dashMode = 'author'; 
			socket.emit('checkLoginStatus');
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
