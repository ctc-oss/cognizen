/*!
 * C_Completion
 * VERSION: Version 1.0
 * DATE: 2014-01-10
 * JavaScript
 *
 * Copyright (c) 2014, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_Completion(_type) {
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
        buildTemplate();
    }

    //Defines a private method - notice the difference between the public definitions above.
    function buildTemplate() {
		pageTitle = new C_PageTitle();

        //Add classes for page layouts - updatable in css
	    $("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div></div></div>');
		$("#scrollableContent").addClass("top");
		$("#content").append(myContent);
		
		$('<div id="completionButton">Continue</div>').insertAfter("#content");
		$("#completionButton").css({"postion": "relative", "width": "200px", "margin-left": "auto", "margin-right": "auto"});
		$("#completionButton").button().click(function(){
			completeLesson();
		});
        
        audioHolder = new C_AudioHolder();
        checkMode();
        
        if(transition == true){
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
        }
    }

    /*****************************************************************************************************************************************************************************************************************
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     PAGE EDIT FUNCTIONALITY
     ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     *****************************************************************************************************************************************************************************************************************/
     function checkMode(){
     	$(this).scrubContent();
     	$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
     	console.log("OK - hit checkMode");
		$('.antiscroll-wrap').antiscroll();

     	if(mode == "edit"){
           /*******************************************************
			* Edit Content
			********************************************************/
			//Add and style contentEdit button
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
				allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
			});
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
        try { pageTitle.destroy(); } catch (e) {}
        try { audioHolder.destroy(); } catch (e) {}
		try { $("#scrollableContent").remove(); } catch (e) {}
		for(name in CKEDITOR.instances){
			try { CKEDITOR.instances[name].destroy(); } catch (e) {}
		}
		
		loadPage();
    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}

