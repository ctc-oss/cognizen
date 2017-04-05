/*!
 * C_TextLeft
 * This class creates a template for a text top / image bottom layout.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2012-12-16
 * JavaScript
 *
 * Copyright (c) 2012, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_Unity3D(_type) {

    this.o_otherobj;
    this.myImage;//image to be loaded.
    this.myPageTitle;//Title of this page.
    this.myContent;//Body
    this.myCaption;//Caption text if needed.
    this.myAudio;
    this.autoplay = false;//Boolean: true - attached media plays on load.  false - user interaction required to play media.  
    this.autoNext = false;//Boolean: true - next page loads automatically upon media completion.  false - user interaction required to load the next page.
    var privateVar = 'private';
    
    var hasCaption = false;
    var hasAudio = false;
    
    var imageWidth;
	var imageHeight;
	
	var stageW;
	var stageH;
	var stageX;
	var stageY;
	
	var titleX;
	var titleY;
	var titleW;
	
	var contX;
	var contY;
	var contW;
	
	var imgY;
    var imgX;
    var imgW;
    var imgH;
    
    var fileLink;
    
    var contentY;
	var contentH;
	
	var type = _type;
	
	var mediaType;

    this.doOtherObj = function() {

        this.o_otherobj = new otherObj();

    }
    
    //Defines a public method - notice the difference between the private definition below.
	this.initialize = function someMethod(){
		if(transition == true){
			$('#stage').css({'opacity':1});
		}
		
		fileLink = $(data).find("page").eq(currentPage).attr('img');
		
		/*****************************************
		**Set template variables.
		*****************************************/
		//Set the stage position and size.
		stageX = $("#stage").position().left;
		stageY = $("#stage").position().top;
		stageW = $("#stage").width();
		stageH = $("#stage").height();
		
		
		autoNext = $(data).find("page").eq(currentPage).attr('autoNext');
		autoPlay = $(data).find("page").eq(currentPage).attr('autoplay');
		
		//Dynamically populate positions from the content.xml
		//Position the page title
		myPageTitle = $(data).find("page").eq(currentPage).find('title').text();
		
		
		//Position the page text
		if(type == "unity"){
			myContent = $(data).find("page").eq(currentPage).find("content").text();
		}
				
		//Check if the page has captions
		if($(data).find("page").eq(currentPage).find('caption').text().length != 0){
			hasCaption = true;
			myCaption = $(data).find("page").eq(currentPage).find('caption').text();
		}
		
		//Check if hte page has an associated audio file.
		if($(data).find("page").eq(currentPage).attr('audio').length != 0){
			hasAudio = true;
			myAudio = $(data).find("page").eq(currentPage).attr('audio');
		}

		buildTemplate();
	}
	
	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		//Add the divs for the page title adn the content divs.		
		$('#stage').append('<div id="pageTitle"></div>');
		$("#pageTitle").append(myPageTitle);
		titleX = $("#pageTitle").position().left;
		titleY = $("#pageTitle").position().top;
		titleW = $("#pageTitle").width();
		
		if(type == "unity"){
			$('#stage').append('<div id="content"></div>');
			$("#content").addClass("top");
			$("#content").append(myContent);
		}
		
		
		$('#stage').append('<div id="loader"></div>');
		
		imageWidth = parseInt($(data).find("page").eq(currentPage).attr('w'));
		imageHeight = parseInt($(data).find("page").eq(currentPage).attr('h'));
		
		if(isMobile){
			if(imageWidth > windowWidth){
				imageHeight = (imageHeight / imageWidth) * windowWidth;
				imageWidth = windowWidth;
			}
		}

		if(type == "unity"){
			contentY = $("#content").position().top;
			contentH = $("#content").height();
		}else if(type == "unityOnly"){
			contentY = $("#pageTitle").position().top;
			contentH = $("#pageTitle").height();
		}
						
		imgY = contentY + contentH + 20;
		imgX = (stageW - imageWidth) / 2;	
		$('#loader').css({'position': 'absolute', 'top': imgY, 'left': imgX});
		
		$("#loader").append('<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"/><object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="' + imageWidth + '" height="' + imageHeight + '" id="unityPlayer"><param name="movie" value="'+fileLink+'" /><param name="scale" value="noscale" /><param name="wmode" value="direct" /><param name="bgcolor" value="#ffffff" /><param name="devicefont" value="false" /><param name="swliveconnect" value="false" /><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="allownetworking" value="all" /><param name="menu" value="false"/><param name="flashvars" value="unitydebug=false&amp;deeptrace=false" /><!--[if !IE]>--><object type="application/x-shockwave-flash" data="'+fileLink+'" width="' + imageWidth + '" height="' + imageHeight + '"><param name="scale" value="noscale" /><param name="wmode" value="direct" /><param name="bgcolor" value="#ffffff" /><param name="devicefont" value="false" /><param name="swliveconnect" value="false" /><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="allownetworking" value="all" /><param name="menu" value="false"/><param name="flashvars" value="unitydebug=false&amp;deeptrace=false" /><!--<![endif]--><a href="http://www.adobe.com/go/getflashplayer"><img src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" alt="Get Adobe Flash player" /></a><!--[if !IE]>--></object><!--<![endif]--></object>');
		}
		
			
		
	/*function saveTitleEdit(){
		var html = $("#pageTitle").getCode();
		$("#pageTitle").destroyEditor();
		$("#pageTitle").css({'position':'absolute', 'top':titleY, 'left': titleX, 'width': titleW});
		//$(data).find("page").eq(currentPage).attr("title").empty();
		$(data).find("page").eq(currentPage).attr('title', html);
		$("#titleEdit").css({'opacity': 1});
	};
	
	function saveContentEdit(){
		var html = $("#content").getCode();
		$("#content").destroyEditor();
		$("#content").css({'position':'absolute', 'top':contY, 'left': contX, 'width': contW});
		$(data).find("page").eq(currentPage).find("content").empty();
		$(data).find("page").eq(currentPage).find("content").text(html);
		$("#conEdit").css({'opacity': 1});
	};
	
	function saveImageEdit(){
		var html = $("#loader").getCode();
		$("#loader").destroyEditor();
		$("#loader").css({'position':'absolute', 'top':imgY, 'left': imgX});
		//$(data).find("page").eq(currentPage).attr('img', html.attr('src'));
		$("#imgEdit").css({'opacity': 1});
	};
	
	function saveCaptionEdit(){
		var html = $("#caption").getCode();
		$("#caption").destroyEditor();
		$('#caption').css({'position':'absolute', 'top':imgY + $('#loader').height() + 5, 'left': imgX, 'width':imageWidth});
		$(data).find("page").eq(currentPage).find("caption").empty();
		$(data).find("page").eq(currentPage).find("caption").text(html);
		$("#captionEdit").css({'opacity': 1});
	};
	
	//Function called on video complete if autoNext == true
	function hasEnded(){
		$('#next').click();
	}
	
	*/
    
    this.destroySelf = function() {
	   if(transition == true){
			// fade stage out
			$('#stage').velocity({
				opacity: 0
			}, {
				duration: transitionLength,
				complete: fadeComplete
			});
	   	}else{
		   	fadeComplete();
	   	}
    }

	/*
	function setCaption(){
		if(hasCaption == true){
			$('#stage').append('<div id="caption"></div>');
			$('#caption').append(myCaption);
			$('#caption').css({'position':'absolute', 'top':imgY + $('#loader').height() + 5, 'left': imgX, 'width':imageWidth});
			
			if(transition == true){
				$('#caption').css({'opacity': 0});
				$('#caption').velocity({
					opacity: 1
				}, {
					duration: transitionLength,
					complete: showCaptionEdit
				});
			}
		}
		setTips();
	}
	
	function showCaptionEdit(){
		if(mode == "edit"){
			$('#stage').append("<div id='captionEdit' class='btn_edit ui-icon ui-icon-pencil' title='Edit Caption'></div>");
			$("#captionEdit").css({'position':'absolute', 'top':$("#caption").position().top, 'left': $("#caption").position().left + $("#caption").width()});
			
			$("#captionEdit").click(function(){
				$("#caption").redactor({
					focus: true,
					buttons: ['html', '|', 'bold', 'italic', 'underline', '|', 'link', 'fontcolor', 'backcolor', '|', 'close'],
					buttonsCustom: {
						close: {
							title: 'Close',
							callback: saveCaptionEdit
						}
					}
				});
				$(this).css({'opacity': 0});
				$(".redactor_box").css({'position':'absolute', 'top':$("#caption").position().top, 'left':$("#caption").position().left, 'width': $("#caption").width()});
				$("#caption").css({'position':'absolute', 'top': 30, 'left': 0});
			});
		}
	}
	
	function setTips(){
		$("#footnote").tooltip({	
			show:{
				effect: "slideDown",
				delay: 500,
			},
			track: true,
			tooltipClass: "footnoteTip"
		});	
		
		$("#toolTip").tooltip();
		$("#editTip").tooltip();
	}*/
	
	
    
    function fadeComplete() {
		$('#pageTitle').remove();
	    $('#content').remove();
	   
	    if(hasAudio == true){
	    	$('#audioCon').remove();
	    	$('#player').remove();
	    }
	    
	    if(mode == "edit"){
		    $("#titleEdit").remove();
		    $("#conEdit").remove();
		    $("#imgEdit").remove();
		    $("#captionEdit").remove();
	    }
	    
	    if(type != "textOnly"){
	    	if(mediaType == 'swf'){
		    	$('#loader').flash().remove();
		    }
		    
		    if(hasCaption == true){
	    		$('#caption').remove();
	    	}
	    	
	    	$('#loader').remove();
	    	
	    	if(mode == "edit"){
		    	$("#imgEdit").remove();
	    	}
	    
	    }
	   
	    $("#loader").remove();
	    
	    loadPage();
    }

}