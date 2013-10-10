/*!
 * C_LessonTitle
 * This class creates a template for a all non-Interactive content (text/images/swfs).
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: Version 1.0
 * DATE: 2013-10-10
 * JavaScript
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_LessonTitle(_type) {

    this.myPageTitle;//Title of this page.
    this.myContent;//Body
    var stageW = $("#stage").width();
    var stageH = $("#stage").height();
    
    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    INITIALIZE AND BUILD TEMPLATE
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.initialize = function(){
    	//transition variable in C_Engine - set in content.xml
        if(transition == true){
        	$('#stage').css({'opacity':0.1});
        }

        /*****************************************
        **Set template variables.
        *****************************************/

        //Page title value from content.xml
        myPageTitle = $(data).find("page").eq(currentPage).find('title').first().text();

        //Position the page text
        myContent = $(data).find("page").eq(currentPage).find("content").first().text();
        
        buildTemplate();
    }

    //Defines a private method - notice the difference between the public definitions above.
    function buildTemplate() {
	   
        //Add the divs for the page title adn the content divs.
        $('#stage').append('<div id="pageTitle" class="lesson"></div>');
        $("#pageTitle").append(myPageTitle);

        //Add classes for page layouts - updatable in css
        $('#stage').append('<div id="content" class="lessonCon"></div>');

        $("#content").append(myContent);

        if(transition == true){
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
        }else{
        	checkMode();
        }
    }

    /*****************************************************************************************************************************************************************************************************************
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     PAGE EDIT FUNCTIONALITY
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     *****************************************************************************************************************************************************************************************************************/
     function checkMode(){
     	
     	if(mode == "edit"){
            	
            /*******************************************************
			* Edit Title
			********************************************************/
                //Add and style titleEdit button
			 $('#stage').append("<div id='titleEdit' class='btn_edit_text' title='Edit Title'></div>");
			 $("#titleEdit").css({'position':'absolute', 'top':$("#pageTitle").position().top - 18, 'left': $("#pageTitle").position().left + $("#pageTitle").width() - 18});
			 //Add title Edit functionality
			 $("#titleEdit").click(function(){
                //Create the Dialog
			 	$("#stage").append("<div id='titleDialog' title='Input Page Title'><div id='titleEditText' type='text'>" + myPageTitle + "</div></div>");
			 	//Style it to jQuery UI dialog
			 	$("#titleDialog").dialog({
                    autoOpen: true,
					modal: true,
					width: 550,
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: saveTitleEdit
				});

				$("#titleEditText").redactor({
                    focus: true,
					buttons: ['bold', 'italic', 'underline', 'deleted', '|', 'fontcolor', 'backcolor']
				});
			}).tooltip();

			
            $('#stage').append("<div id='conEdit' class='btn_edit_text' title='Edit Text Content'></div>");
			$("#conEdit").css({'position':'absolute', 'top':$("#content").position().top - 18, 'left': $("#content").position().left + $("#content").width() - 18});

			$("#conEdit").click(function(){

                //Create the Content Edit Dialog
				$("#stage").append("<div id='contentEditDialog' title='Input Page Content'><div id='contentEditText' type='text' style='width:" + $('#content').width() + "; height:85%' >" + myContent + "</div>");

				var myHeight;

				if($("#content").height() < 300){
					myHeight = 350;
				}else if($("#content").height() > (stageH - 80)){
					myHeight = stageH - 80;
				}else{
					myHeight = $("#content").height();
				}
				//Style it to jQuery UI dialog
				$("#contentEditDialog").dialog({
					autoOpen: true,
					modal: true,
					width: $("#content").width() + 100,
					height: myHeight + 150,
					buttons: [ { text: "Save", click: function() {$( this ).dialog( "close" ); } }],
					close: saveContentEdit
				});

				$("#contentEditText").redactor({
					focus: true,
					buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'unorderedlist', 'orderedlist', 'outdent', 'indent', '|', 'table', 'link', 'fontcolor', 'backcolor']
				});
			}).tooltip();
		}
	}

	/**********************************************************************
     **Save Title Edit - save updated page title text to content.xml
     **********************************************************************/
	function saveTitleEdit(){
        var titleUpdate = $("#titleEditText").getCode();
	   	var docu = new DOMParser().parseFromString('<title></title>',  "application/xml");
	   	var newCDATA=docu.createCDATASection(titleUpdate);
	   	$("#pageTitle").html($("#titleEditText").html());
	   	myPageTitle = titleUpdate;
	   	$("#titleEditText").destroyEditor();
	   	$(data).find("page").eq(currentPage).find("title").first().empty();
	   	$(data).find("page").eq(currentPage).find("title").first().append(newCDATA);
	   	$("#titleDialog").remove();
	   	sendUpdateWithRefresh();
	};

    /**********************************************************************
     **Save Content Edit - save updated content text to content.xml
     **********************************************************************/
    function saveContentEdit(){
        //Grab the updated text from redactor.
        var contentUpdate = $("#contentEditText").getCode();
        //We create an xml doc - add the contentUpdate into a CDATA Section
        var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
        var newCDATA=docu.createCDATASection(contentUpdate);
        //Now, destroy redactor.
        $("#content").html(contentUpdate);
        myContent = contentUpdate;
        $("#contentEditText").destroyEditor();
        //Update the local xml - first clearning the content node and then updating it with out newCDATA
        $(data).find("page").eq(currentPage).find("content").first().empty();
        $(data).find("page").eq(currentPage).find("content").first().append(newCDATA);
        $("#contentEditDialog").remove();
        sendUpdate();
    };

    //////////////////////////////////////////////////////////////////////////////////////////////////END EDIT MODE

    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    ACESSIBILITY/508 FUNCTIONALITY
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function doAccess(){
		var tabindex = 1;

	   	$("#pageTitle").attr("tabindex", tabindex);
	   	tabindex++;
	   	/*for(var i = 0; i < buttonArray.length; i++){
		   	$(buttonArray[i]).attr("tabindex", tabindex);
		   	tabindex++;
		}*/
		$("#contentHolder").attr("tabindex", tabindex);
		tabindex++;
		$("#loader").attr("tabindex", tabindex);
	}
	//////////////////////////////////////////////////////////////////////////////////////////////////END ACCESSIBILITY

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.destroySelf = function() {
    	if(transition == true){
            TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:transitionType, onComplete:fadeComplete});
		}else{
            fadeComplete();
		}
	}

	this.fadeComplete = function(){
        	fadeComplete();
	}

	function fadeComplete() {	
        $('#pageTitle').remove();
	   	$('#content').remove();
		$("#titleEdit").remove();
		$("#titleDialog").remove();
		$("#conEdit").remove();
		$("#contentEditDialog").remove();
		
		loadPage();
    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}
