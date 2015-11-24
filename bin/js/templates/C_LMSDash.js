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
        if (transition == true) {
            $('#stage').css({'opacity': 0});
        }

		buildTemplate();
        /*****************************************************************************
        add socket listeners - for server connectivity.
        *****************************************************************************/
        socket.on('recieveHostedProjectsFromDB', function(data) {
	        updateMenu(data);
        });
        console.log("user = " + user);//Will be used to populate real content as a parameter in the below function
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
        
        var msg = '<div id="scrollableContent" class="box-wrap antiscroll-wrap">';
        	msg += '<div class="box">';
        	msg += '<div id="contentHolder" class="overthrow antiscroll-inner">';
        	msg += '<div id="projList">';
        	msg += '</div></div></div></div>';
        $stage.append(msg);
        
        $("#adminAddProgram").button({
            icons: {
                primary: "ui-icon-circle-plus"
            }
        }).click(function () {
            dashMode = 'author'; 
			socket.emit('checkLoginStatus');
        });
		
		socket.emit('getHostedContent', {loc: "indahuas", path: "start"});
    }
    
    function updateMenu(_data){
	    //Clear the project list
	    $("#projList").empty();
	    if (transition == true) {
            $('#stage').css({'opacity': 0});
        }
        
	    var $stage = $('#stage');
	    
	    for(var i = 0; i < _data.length; i++){
			if (_data[i].substring(0, 1) != "."){
				var msg = '<div class="C_LMSMenuItem" title="'+ _data[i] +'" data-fancybox-type="iframe" href="../hosted/' + _data[i] + '/index.html" data-path="'+ _data[i] +'">';
					msg += _data[i];
					msg += '</div>';
				$("#projList").append(msg);
			}
	    }
	    
	    $(".C_LMSMenuItem").fancybox({
			maxWidth	: 1024,
			maxHeight	: 1000,
			width		: 1024,
			height		: 768,
			openEffect	: 'fade',
			closeEffect	: 'fade'
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
