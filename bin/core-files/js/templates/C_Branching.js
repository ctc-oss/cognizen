/*!
 * C_Branching
 * This class creates a template multi-page branching scenarios.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: Version 1.0
 * DATE: 2014-11-21
 * JavaScript
 *
 * Copyright (c) 2014, CTC. All rights reserved.
 *
 * @author: Philip Double, doublep@ctc.com
 */
function C_Branching(_type) {
	var type = _type;
	var myContent;//Body
	var branchCount = 0;
	var branchType = type;
	var branch_arr;
	var currentMedia;
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
		
		//Clear accessibility on page load.
        pageAccess_arr = [];
        audioAccess_arr = [];
		
        buildTemplate();
    }

     //Defines a private method - notice the difference between the public definitions above.
    function buildTemplate() {
		buildBranchArray();
		audioHolder = new C_AudioHolder();
		if(isMobile){
			titleBarHeight = $("#courseTitle").height();
			navBarHeight = $("#pageCount").height();
			stageH = window.innerHeight - titleBarHeight - navBarHeight;
			$("#stage").height(stageH);
		}
		loadBranch(0);
   	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    buildBranchArray - stores possible branches for page
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function buildBranchArray(){
		branchCount = $(data).find("page").eq(currentPage).find("branch").length;
		branch_arr = [];
		for(var i = 0; i < branchCount; i++){
			branch_arr.push($(data).find("page").eq(currentPage).find("branch").eq(i));
		}
	}
	
	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    loadBranch - refreshes the page with the appropriate branch
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function loadBranch(_id){
		pageAccess_arr = [];
        audioAccess_arr = [];
		try { $("#mediaHolder").remove(); } catch (e) {}
		try { $("#pageTitle").remove(); } catch (e) {}
		//remove existing scrollable content.
		$("#scrollableContent").remove();
		myContent = branch_arr[_id].find("content").text();
		branchType = $(data).find("page").eq(currentPage).find("branch").eq(_id).attr("layout");
		isComplete = $(data).find("page").eq(currentPage).find("branch").eq(_id).attr("pathcomplete");
		currentMedia = $(data).find("page").eq(currentPage).find("branch").eq(_id).attr("img");
		if(isComplete == "true"){
			mandatoryInteraction = false;
			checkNavButtons();
		}

		pageTitle = new C_PageTitle(_id);
		buildContentText();
		buildBranchOptions(_id);
		checkMode();
	}



	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    buildContentText - shows the text for the selected option
    				 - adds mediaholder if needed
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function buildContentText(){
		if(myContent != ""){
	        $('<div id="scrollableContent" class="antiscroll-wrap"><div class="box"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div></div></div></div>').insertAfter("#pageTitle");
		    addLayoutCSS(branchType);
		    $("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		    // WTF?  scrollableContent.position.top changes after contentHolder.height is set for the first time
		    // So we do it twice to get the right value  -- Dingman's famous quantum variable!
		    $("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		    $("#content").width($("#contentHolder").width()-15);
		    $("#content").append(myContent);
		    $("#content").attr("aria-label", $("#content").text());
		    pageAccess_arr.push($("#content"));
	    }
	    if(branchType != "textOnly" && branchType != "sidebar" && branchType != "branching"){
		    mediaHolder = new C_VisualMediaHolder(null, branchType, currentMedia);
	        mediaHolder.loadVisualMedia();
	    }else{
		    if(transition == true){
	            TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
			}
	    }
	    
	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    buildBranchOptions - places option buttons on the screen for where to branch to
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function buildBranchOptions(_id){
		var optionCount = branch_arr[_id].find("option").length;

		if(optionCount > 0){
			var paletteWidth = 0;
			if(branchType == "top" || branchType == "bottom"){
				$("<div id='imgPalette' class='imgPalette'></div>").insertAfter("#mediaHolder");
			}else{
				$("<div id='imgPalette' class='imgPalette'></div>").insertAfter("#content");
			}

			for (var i = 0; i < optionCount; i++){
				var buttonLabel = branch_arr[_id].find("option").eq(i).text();
				var buttonID = branch_arr[_id].find("option").eq(i).attr("id");
				var myOption = "option"+i;
				$("#imgPalette").append("<div id='"+myOption+"' class='btn_branch' mylink='"+buttonID+"' aria-label='"+buttonLabel+"'>"+buttonLabel+"</div>");
				$("#"+myOption).button().click(function(){
					loadBranchByID($(this).attr("mylink"));
				});
				paletteWidth += $("#"+myOption).width() + 5;
				pageAccess_arr.push($("#"+myOption));
			}
			$("#imgPalette").width(paletteWidth);
		}
	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    addLayoutCSS - puts appropriate styles on content text for layout
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function addLayoutCSS(_type){
		if(_type == "left"){
            $("#scrollableContent").addClass("left");
        }else if(_type == "sidebar"){
            $("#scrollableContent").addClass("sidebarContent");
        }else if(_type == "top"  || _type == "bottom"){
            $("#scrollableContent").addClass("top");
        }else if(_type == "right"){
            $("#scrollableContent").addClass("right");
        }else if(_type == "textOnly" || _type == "branching"){
            $("#scrollableContent").addClass("text");
            $("#contentHolder").addClass("text");
        }else if(_type == "graphicOnly"){
            $("#contentHolder").addClass("graphic");
        }
	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    loadBranchByID - takes ID of selected option and decides which branch to load
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function loadBranchByID(branchID){
		for(var i = 0; i < branchCount; i++){
			if(branchID == $(data).find("page").eq(currentPage).find("branch").eq(i).attr("id")){
				loadBranch(i);
				break;
			}
		}
	}
	
	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    checkMode - Check if authoring is needed
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
    function checkMode(){
	    $('.antiscroll-wrap').antiscroll();
	    $(this).scrubContent();
	    try { $("#sidebar").width($("#sidebar").width() + 10); } catch (e) {}
	    if(mode == "edit"){
		   /*******************************************************
			* Edit Sidebar
			********************************************************/
			//Add and style contentEdit button
			if(branchType == "sidebar"){
				$("#sidebar").attr('contenteditable', true);
                CKEDITOR.disableAutoInline = true;
				CKEDITOR.inline( 'sidebar', {
					on: {
						blur: function (event){
							if(cachedTextPreEdit != event.editor.getData()){
								saveSidebarEdit(event.editor.getData());
							}
							enableNext();
							enableBack();
						},
						focus: function (event){
							cachedTextPreEdit = event.editor.getData();
							disableNext();
							disableBack();
						}
					},
					toolbar: contentToolbar,
					toolbarGroups :contentToolgroup,
					extraPlugins: 'sourcedialog',
					allowedContent: true
				});
			}
			
			/*******************************************************
			* Edit Content
			********************************************************/
			//Add and style contentEdit button
			if(branchType != "graphicOnly"){
            	$("#content").attr('contenteditable', true);
                CKEDITOR.disableAutoInline = true;
				CKEDITOR.inline( 'content', {
					on: {
						blur: function (event){
							if(cachedTextPreEdit != event.editor.getData()){
								saveContentEdit(event.editor.getData());
							}
							enableNext();
							enableBack();
						},
						focus: function (event){
							cachedTextPreEdit = event.editor.getData();
							disableNext();
							disableBack();
						}
					},
					toolbar: contentToolbar,
					toolbarGroups :contentToolgroup,
					extraPlugins: 'sourcedialog',
					allowedContent: true
				});
			}
		}
    }
	
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

    // fadeComplete() moved to C_UtilFunctions.js
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}