/*!
 * C_CourseCatalog
 * Dashboard for the cognizen tool
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 0.1
 * DATE: 2013-04-26
 * JavaScript
 *
 * Copyright (c) 2013, CTC. All rights reserved.
 *
 */

function C_Transcript(_course) {
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
        // ****************************************************************************
        // add socket listeners - for server connectivity.
        // ****************************************************************************
        // socket.on('recieveCourseCatalogFromDB', function(data) {
	       //  updateMenu(data);
        // });

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
        
        $stage.html('');
        $stage.append("<div id='logout'><a href='/logout'>logout</a></div>");
        
        $stage.append('<div id="transcriptHeader" > transcript:<span class="C_CloseCourseButton"><</span></div>');
        
        var msg =  '<div id="contentHolder" class="overthrow antiscroll-inner">';
            msg += '<div id="transcript"></div>';
            msg += '</div>';            
        $stage.append(msg);
        
        var search = ADL.XAPIWrapper.searchParams();
        search['agent'] = JSON.stringify(agent);
        search['verb'] = ADL.verbs.completed.id;
        search['related_activities'] = true;      
        res = ADL.XAPIWrapper.getStatements(search);
        console.log("all learner's completed courses");
        console.log(res);        

        updateMenu(res);
        // socket.emit('getHostedContent', {loc: "indahuas", path: "start"});
    }
    
    function updateMenu(_data){
        //Clear the project list
        $("#transcript").empty();
        if (transition == true) {
            $('#stage').css({'opacity': 0});
        }
        console.log(_data);
        var $stage = $('#stage');
        
        for(var i = 0; i < _data.statements.length; i++){
            var currStatement = _data.statements[i];
            var msg = '<div class="C_CCMenuItem" title="'+ currStatement.object.definition.name["en-US"] +'">';    
            msg += currStatement.object.definition.name["en-US"] +" " + currStatement.result.completion 
            + " " + currStatement.result.success + " " + currStatement.result.score.scaled + " " + currStatement.timestamp;
            msg += '</div>';
            $("#transcript").append(msg);
        }

        $(".C_CloseCourseButton").click(function(){
            dashMode = 'lms';
            socket.emit('checkLoginStatus');
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
