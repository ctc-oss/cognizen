/*!
 * C_StaticContent
 * This class creates a template for a all non-Interactive content (text/images/swfs).
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: Version 1.0
 * DATE: 2013-05-10
 * JavaScript
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_StaticContent(_type) {
	var type = _type;
    var pageTitle;
    var mediaHolder;
    var mySidebar;
    var myContent;//Body
    var audioHolder;
   
    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    INITIALIZE AND BUILD TEMPLATE
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.initialize = function(){
    	//transition variable in C_Engine - set in content.xml
        if(transition == true){
        	$('#stage').css({'opacity':0});
        }
		
        //Position the page text
        myContent = $(data).find("page").eq(currentPage).find("content").first().text();

        if(type == "sidebar"){
            mySidebar = $(data).find("page").eq(currentPage).find("sidebar").first().text();
        }
        
        buildTemplate();
    }

    //Defines a private method - notice the difference between the public definitions above.
    function buildTemplate() {
        pageTitle = new C_PageTitle();
		
        //Add classes for page layouts - updatable in css
		if(type != "graphicOnly"){
			$('<div id="scrollableContent" class="antiscroll-wrap"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div></div></div>').insertAfter("#pageTitle");
		}
		
		audioHolder = new C_AudioHolder();
				
        if(type == "left"){
            $("#scrollableContent").addClass("left");
        }else if(type == "sidebar"){
            $("#scrollableContent").addClass("sidebarContent");
        }else if(type == "top"  || type == "bottom"){
            $("#scrollableContent").addClass("top");
        }else if(type == "right"){
            $("#scrollableContent").addClass("right");
        }else if(type == "textOnly"){
            $("#scrollableContent").addClass("text");
            $("#contentHolder").addClass("text");
        }else if(type == "graphicOnly"){
            $("#contentHolder").addClass("graphic");
        }
        
        if(type != "graphicOnly"){
		   	$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
			// WTF?  scrollableContent.position.top changes after contentHolder.height is set for the first time
			// So we do it twice to get the right value  -- Dingman's famous quantum variable!
		   	$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
			$("#content").width($("#contentHolder").width()-15);
		   	$("#content").append(myContent); 
	    }
        
        /*Attach Media*/
        if(type == "textOnly"){
            checkMode();
            if(transition == true){
                TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
            }
        }else if(type == "sidebar"){
            $('#stage').append('<div id="sidebarHolder" class="antiscroll-wrap"><div id="sidebar" class="sidebar antiscroll-inner"></div></div>');
            $('#sidebar').append(mySidebar);
            
            if($('#sidebar').height() > stageH - ($('#sidebarHolder').position().top + audioHolder.getAudioShim() + 40)){
	            $(".sidebar").height(stageH - ($('#sidebarHolder').position().top + audioHolder.getAudioShim() + 40));
            }else{
	            $(".sidebar").height($('#sidebar').height());
            }
            
            $('#sidebar').height($('#sidebarHolder').height());
            checkMode();
            if(transition == true){
                TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
            }        
        }else{
        	mediaHolder = new C_VisualMediaHolder();
        	mediaHolder.loadVisualMedia(checkMode());
        }
    }

    /**********************************************************************
     **Adjust objects width and height when on a mobile device
     **windowWidth = $('body').width(); - set in C_Engine.js
     **mobileWidth is set in C_Engine.js
     **********************************************************************/
    function resizeForMobile(){
        if(windowWidth <= mobileWidth){
            if(imageWidth > windowWidth){
                imageHeight = (imageHeight / imageWidth) * windowWidth;
                imageWidth = windowWidth-1;
            }
        }
    }
        
    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    PAGE EDIT FUNCTIONALITY
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
    function checkMode(){
    	$(this).scrubContent();

     	if(type != "graphicOnly"){
			$('.antiscroll-wrap').antiscroll();
		}
		
		try { $("#sidebar").width($("#sidebar").width() + 10); } catch (e) {}
		
     	if(mode == "edit"){	
            /*******************************************************
			* Edit Sidebar
			********************************************************/
			//Add and style contentEdit button
			if(type == "sidebar"){
				$("#sidebar").attr('contenteditable', true);
                CKEDITOR.disableAutoInline = true;
				CKEDITOR.inline( 'sidebar', {
					on: {
						blur: function (event){
							if(cachedTextPreEdit != event.editor.getData()){
								saveSidebarEdit(event.editor.getData());
							}
						},
						focus: function (event){
							cachedTextPreEdit = event.editor.getData();
						}
					},
					toolbar: contentToolbar,
					toolbarGroups :contentToolgroup,
					extraPlugins: 'sourcedialog',
					allowedContent: 'p b i span div; p b i div span[*](*)'
				}); 
			}

			/*******************************************************
			* Edit Content
			********************************************************/
			//Add and style contentEdit button
			if(type != "graphicOnly"){
            	$("#content").attr('contenteditable', true);
                CKEDITOR.disableAutoInline = true;
				CKEDITOR.inline( 'content', {
					on: {
						blur: function (event){
							if(cachedTextPreEdit != event.editor.getData()){
								saveContentEdit(event.editor.getData());
							}
						},
						focus: function (event){
							cachedTextPreEdit = event.editor.getData();
						}
					},
					toolbar: contentToolbar,
					toolbarGroups :contentToolgroup,
					extraPlugins: 'sourcedialog',
					allowedContent: 'p b i span div img; p b i div span img[*](*)'
				}); 
			}
		}
	}
	
    /**********************************************************************
     **Save Content Edit - save updated content text to content.xml
     **********************************************************************/
    function saveContentEdit(_data){
        var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
        var newCDATA=docu.createCDATASection(_data);
        $(data).find("page").eq(currentPage).find("content").first().empty();
        $(data).find("page").eq(currentPage).find("content").first().append(newCDATA);
        sendUpdate();
    };

    /**********************************************************************
     **Save Sidebar Edit
     **********************************************************************/
	function saveSidebarEdit(_data){
	   	var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
	   	var newCDATA=docu.createCDATASection(_data);
	   	$(data).find("page").eq(currentPage).find("sidebar").empty();
	   	$(data).find("page").eq(currentPage).find("sidebar").append(newCDATA);
	   	sendUpdate();
	};

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
	
	//Allow fadeComplete to be called from external...
	this.fadeComplete = function(){
        	fadeComplete();
	}

	function fadeComplete() {
			
        try { pageTitle.destroy(); } catch (e) {}
        try { audioHolder.destroy(); } catch (e) {}
        try { mediaHolder.destroy(); } catch (e) {}
        try { $("#sidebar").remove(); } catch (e) {}
        try { $("#sidebarHolder").remove(); } catch (e) {}
		try { $("#scrollableContent").remove(); } catch (e) {}
		try { $(".dialog").remove(); } catch (e){};
		for(name in CKEDITOR.instances){
			try { CKEDITOR.instances[name].destroy(); } catch (e) {}
		}
		loadPage();
    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}