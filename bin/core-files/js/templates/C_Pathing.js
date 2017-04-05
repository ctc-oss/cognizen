/*!
 * C_Pathing
 * This class creates a template pathing scenarios.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: Version 1.0
 * DATE: 2015-04-02
 * JavaScript
 *
 * Copyright (c) 2015, CTC. All rights reserved.
 *
 * @author: Tyler Shumaker, shumaket@ctc.com
 */
function C_Pathing(_type) {
	var type = _type;
	var myContent;//Body
	var branchCount = 0;
	var branchType = type;
	var currentMedia;
	//var currentBranch = 0;
	var mandatory = true;
	var currentEditBankMember = 0;
	var layoutType_arr = ["textOnly", "graphicOnly", "top", "right", "bottom", "left", "sidebar"];
	var transcriptText;
	var homePage_arr = [];
	var pageId;
	var pathCompletion_arr = [];
	var revealPageMenu_arr = [];
	var pathPageTracker = 1;
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
		if($(data).find("page").eq(currentPage).attr('mandatory') == "false"){
			mandatory = false;
		}

		pageId = $(data).find('page').eq(currentPage).attr('id');
		//add to pathingTracking array
		addPathingTracking(pageId);

        buildTemplate();
    }

     //Defines a private method - notice the difference between the public definitions above.
    function buildTemplate() {
		audioHolder = new C_AudioHolder();
		if(isMobile){
			titleBarHeight = $("#courseTitle").height();
			navBarHeight = $("#pageCount").height();
			stageH = window.innerHeight - titleBarHeight - navBarHeight;
			$("#stage").height(stageH);
		}
		loadBranch(currentBranch);
   	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    loadBranch - refreshes the page with the appropriate branch
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function loadBranch(_id){

		branchCount = $(data).find("page").eq(currentPage).children("branch").length;

		pageAccess_arr = [];
        audioAccess_arr = [];
		try { $("#mediaHolder").remove(); } catch (e) {}
		try { $("#graphicHolder").remove(); } catch (e) {}
		try { $("#pageTitle").remove(); } catch (e) {}
		try { $("#sidebarHolder").remove(); } catch (e) {}
		try { $("#buttonPalette").remove(); } catch (e) {}
		try { $("#transcriptPane").remove(); } catch (e) {}

		clearMainCKEInstances();

		//remove existing scrollable content.
		$("#scrollableContent").remove();
		currentBranch = _id;
		myContent = $(data).find("page").eq(currentPage).children("branch").eq(_id).find("content").text();
		branchType = $(data).find("page").eq(currentPage).children("branch").eq(_id).attr("layout");
		currentMedia = $(data).find("page").eq(currentPage).children("branch").eq(_id).attr("img");

		pageTitle = new C_PageTitle(_id);

		buildContentText(_id);

		buildBranchOptions(_id);
		checkMode();

		if($(courseData).find("course").attr("redmine") && $(courseData).find("course").attr("redmine") == "true"  && mode == 'edit' && mode=='edit'){
			updateRedmineCommentIcon();
		}

		doAccess(pageAccess_arr);
	}



	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    buildContentText - shows the text for the selected option
    				 - adds mediaholder if needed
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function buildContentText(_id){
		if(branchType != "graphicOnly"){
	        $('<div id="scrollableContent" class="antiscroll-wrap"><div class="box"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div></div></div></div>').insertAfter("#pageTitle");
		    addLayoutCSS(branchType);
		    $("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		    // scrollableContent.position.top changes after contentHolder.height is set for the first time
		    // So we do it twice to get the right value  -- Dingman's famous quantum variable!
		    $("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));

		    if(isMobilePhone){
				$("#contentHolder").prepend(myContent);
			}else{
				$("#content").width($("#contentHolder").width()-15);
				$("#content").append(myContent);
				$("#content").attr("aria-label", $("#content").text());
				//pageAccess_arr.push($("#content"));
		    }
	    }
	    if(branchType != "textOnly" && branchType != "sidebar" && branchType != "branching" && branchType != "pathing"){
		    mediaHolder = new C_VisualMediaHolder(null, branchType, currentMedia, _id);
	        mediaHolder.loadVisualMedia();
	    }else if(branchType == "sidebar"){
		    var mySidebar = $(data).find("page").eq(currentPage).children("branch").eq(currentBranch).find("sidebar").first().text();
		    $('#stage').append('<div id="sidebarHolder" class="antiscroll-wrap"><div class="box"><div id="sidebar" class="sidebar antiscroll-inner"></div></div></div>');
			$('#sidebar').append(mySidebar);

			if($('#sidebar').height() > stageH - ($('#sidebarHolder').position().top + audioHolder.getAudioShim() + 40)){
				$(".sidebar").height(stageH - ($('#sidebarHolder').position().top + audioHolder.getAudioShim() + 40));
			}else{
				$(".sidebar").height($('#sidebar').height());
			}

			$('#sidebar').height($('#sidebarHolder').height());
			$('#sidebar').attr('aria-label', $('#sidebar').text());
			if(transition == true){
				// fade stage in
				$('#stage').velocity({
					opacity: 1
				}, {
					duration: transitionLength
				});
			}
		}else{
		    if(transition == true){
				// fade stage in
				$('#stage').velocity({
					opacity: 1
				}, {
					duration: transitionLength
				});
			}
	    }

	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    buildBranchOptions - places option buttons on the screen for where to branch to
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function buildBranchOptions(_id){

		var pathId = $(data).find("page").eq(currentPage).children("branch").eq(_id).attr("pathid");
		var pathType = $(data).find("page").eq(currentPage).children("branch").eq(_id).attr("pathtype");

		//var paletteWidth = 0;
		if(branchType == "top" || branchType == "graphicOnly"){
			$("<div id='buttonPalette' class='buttonPalette'></div><br/><br/>").insertAfter("#mediaHolder");
		}else{
			$("<div id='buttonPalette' class='buttonPalette'></div><br/><br/>").insertAfter("#content");
		}

		if(pathType === "home"){
			homePage_arr = [];
			pathPageTracker = 1;
			createHomePageArray(1);

			var allCompleted = true;
			for (var i = 0; i < homePage_arr.length; i++) {
				var _btnId = homePage_arr[i].index;
				var altBtnTitle = $(data).find("page").eq(currentPage).children("branch").eq(0).find('option').eq(i).attr("altbtntitle");
				var buttonLabel = '';
				if($(data).find("page").eq(currentPage).children("branch").eq(0).find('option').eq(i).attr("active") == "true"){
					buttonLabel = '<img src="media/'+$(data).find("page").eq(currentPage).children("branch").eq(0).find('option').eq(i).attr("img")+'" ';
					buttonLabel += 'alt ="' +$(data).find("page").eq(currentPage).children("branch").eq(_btnId).find("title").text() +'">';
				}
				else if(altBtnTitle != undefined && altBtnTitle != ''){
					buttonLabel = altBtnTitle;
				}
				else{
					buttonLabel = $(data).find("page").eq(currentPage).children("branch").eq(_btnId).find("title").text();
				}

				var buttonID = $(data).find("page").eq(currentPage).children("branch").eq(_btnId).attr("id");
				var myOption = "option"+i;

				var pathBtnComplete = checkPathComplete(pageId, homePage_arr[i].pathid.toString());
				var widthAdjust = 35;

				//check object for when running in SCORM
				var scormObjSuccess = getObjectiveSuccess(pageId + "_" + homePage_arr[i].pathid.toString())
				if(scormObjSuccess == "passed"){
					pathBtnComplete = true;
					pathCompletion_arr.push({pathid: pathId, completion: pathComplete});
					updatePathingTracking(pageId, pathCompletion_arr);
				}

				if(pathBtnComplete){
					widthAdjust = 50;
					$("#buttonPalette").append("<div id='"+myOption+"' class='btn_branch btn_branchComplete " + pathType + "_" + branchType + "' mylink='"+buttonID+"' role='button'>"+buttonLabel+"</div>");
				}
				else{
					allCompleted = false;
					$("#buttonPalette").append("<div id='"+myOption+"' class='btn_branch " + pathType + "_" + branchType + "' mylink='"+buttonID+"' role='button'>"+buttonLabel+"</div>");
				}

				$("#"+myOption).button().click(function(){
					loadBranchByID($(this).attr("mylink"));
				}).keyup(function (event) {
			        var key = event.keyCode || event.which;

			        if (key === 32 || key === 13) {
			            $(this).click();
			        }
			        return false;
			    });
				//paletteWidth += $("#"+myOption).width() + widthAdjust;
				pageAccess_arr.push($("#"+myOption));
			};

			if(mandatory && allCompleted){
				mandatoryInteraction = false;
				checkNavButtons();
			}

		}
		else{
			if(homePage_arr.length == 0){
				createHomePageArray(1);
			}

			var buttonLabel = "Previous";
			var buttonID = "";
			var pathComplete = false;

			//back button
			var back = _id - 1;

			for(var w = back; w > 0; w--){
				if($(data).find("page").eq(currentPage).children("branch").eq(w).attr('pathid') == pathId){
					break;
				}
			}

			if(w == 0){
				//buttonLabel = 'Home';//$(data).find("page").eq(currentPage).children("branch").eq(0).find("title").text();
				buttonID = $(data).find("page").eq(currentPage).children("branch").eq(0).attr("id");
			}
			else{
				//buttonLabel = 'Back';//$(data).find("page").eq(currentPage).children("branch").eq(h).find("title").text();
				buttonID = $(data).find("page").eq(currentPage).children("branch").eq(w).attr("id");
			}

			var myOption = "option0";
			$("#buttonPalette").append("<div id='"+myOption+"' class='btn_branch " + pathType + "_" + branchType + "' mylink='"+buttonID+"' role='button'>"+buttonLabel+"</div>");
			$("#"+myOption).button().click(function(){
				pathPageTracker--;
				loadBranchByID($(this).attr("mylink"));
			}).keyup(function (event) {
			        var key = event.keyCode || event.which;

			        if (key === 32 || key === 13) {
			            $(this).click();
			        }
			        return false;
			    });
			//paletteWidth += $("#"+myOption).width() + 5;
			pageAccess_arr.push($("#"+myOption));

			//next button

			var next = _id + 1;

			for(var h = next; h < branchCount; h++){
				if($(data).find("page").eq(currentPage).children("branch").eq(h).attr('pathid') == pathId){
					break;
				}
			}

			buttonLabel = 'Continue';

			if(h == branchCount){
				//buttonLabel = 'Home';//$(data).find("page").eq(currentPage).children("branch").eq(0).find("title").text();
				buttonID = $(data).find("page").eq(currentPage).children("branch").eq(0).attr("id");
				pathComplete = true;
			}
			else{
				//buttonLabel = 'Next';//$(data).find("page").eq(currentPage).children("branch").eq(h).find("title").text();
				buttonID = $(data).find("page").eq(currentPage).children("branch").eq(h).attr("id");
			}

			myOption = "option1";
			$("#buttonPalette").append("<div id='"+myOption+"' class='btn_branch " + pathType + "_" + branchType + "' mylink='"+buttonID+"' role='button'>"+buttonLabel+"</div>");
			$("#"+myOption).button().click(function(){
				if(pathComplete && !checkPathComplete(pageId, pathId)){
					pathCompletion_arr.push({pathid: pathId, completion: pathComplete});
					updatePathingTracking(pageId, pathCompletion_arr);
					//set SCORM Objective
					setObjectiveSuccess(pageId + "_" + pathId, pathComplete, pageId + " path " + pathId);
				}
				pathPageTracker++;
				loadBranchByID($(this).attr("mylink"));
			}).keyup(function (event) {
			        var key = event.keyCode || event.which;

			        if (key === 32 || key === 13) {
			            $(this).click();
			        }
			        return false;
			    });
			//paletteWidth += $("#"+myOption).width() + 5;
			pageAccess_arr.push($("#"+myOption));

			$("#pageTitle").text($("#pageTitle").text() + " (" + pathPageTracker  + " of " + $(data).find("page").eq(currentPage).children('branch[pathid="'+pathId+'"]').length+ ")");
		}
		//$("#buttonPalette").width(paletteWidth);

	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    createHomePageArray - creates an array of branches to place buttons on the home page
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function createHomePageArray(_id){
		if(_id < branchCount){
			var pathId = parseInt($(data).find("page").eq(currentPage).children("branch").eq(_id).attr("pathid"));
			if(homePage_arr.length == 0){
				homePage_arr.push({index: _id, pathid: pathId});
				createHomePageArray(_id+1);
			}
			else{
				var exists = false;
				for (var i = 0; i < homePage_arr.length; i++) {
					if(homePage_arr[i].pathid == pathId){
						exists = true;
					}
				};
				if(!exists){
					homePage_arr.push({index: _id, pathid: pathId});
				}

				createHomePageArray(_id+1);
			}
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
			if(branchID == $(data).find("page").eq(currentPage).children("branch").eq(i).attr("id")){
				loadBranch(i);
				break;
			}
		}
	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    checkMode - Check if authoring is needed and enable it...
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
							$('.btn_branch').attr('aria-disabled', 'false');
							$('.btn_branch').button('option', 'disabled', false);
						},
						focus: function (event){
							cachedTextPreEdit = event.editor.getData();
							disableNext();
							disableBack();
							$('.btn_branch').attr('aria-disabled', 'true');
							$('.btn_branch').button('option', 'disabled', true);
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
							$('.btn_branch').attr('aria-disabled', 'false');
							$('.btn_branch').button('option', 'disabled', false);

						},
						focus: function (event){
							cachedTextPreEdit = event.editor.getData();
							disableNext();
							disableBack();
							$('.btn_branch').attr('aria-disabled', 'true');
							$('.btn_branch').button('option', 'disabled', true);
						}
					},
					toolbar: contentToolbar,
					toolbarGroups :contentToolgroup,
					extraPlugins: 'sourcedialog',
					allowedContent: true
				});
			}

			/*******************************************************
			* Edit Question
			********************************************************/
            //Add and style titleEdit button
			if(branchType != "graphicOnly"){
				$('#scrollableContent').prepend("<div id='branchEdit' class='btn_edit_text' title='Edit this exercise'></div>");
			}else{
				$('#mediaHolder').prepend("<div id='branchEdit' class='btn_edit_text' title='Edit this exercise'></div>");
			}

			$("#branchEdit").click(function(){
				updateBranchDialog();
			}).tooltip();
		}
    }

    function updateBranchDialog(){
	    var msg = "<div id='branchEditDialog' title='Create Pathing Exercise'>";
		msg += "<label id='label' title='Indicates if this page is must be completed before going to the next page.'><b>mandatory: </b></label>";
		msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";

		msg += "<div id='branchMenu' class='dialogOptionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Path Menu: </b></label></div><br/><br/>";
		msg += "</div>";
		$("#stage").append(msg);

		if(!mandatory){
			$("#isMandatory").removeAttr('checked');
		}else{
			$("#isMandatory").attr('checked', 'checked');
		}

		updateRevealMenu();

		addOption(currentEditBankMember, false);

		//#3321 fixes dialog jumping issue
		$.ui.dialog.prototype._focusTabbable = function(){};

		//Style it to jQuery UI dialog
		$("#branchEditDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 800,
			height: 650,
			dialogClass: "no-close",
			buttons: [
				{
					text: "Done",
					title: "Saves and closes the edit dialog.",
					click: function(){
						pathCompletion_arr = [];
						updatePathingTracking(pageId, pathCompletion_arr);
				        makeRevealDataStore();
						saveBranchingEdit();
						clearCKInstances();
						try { $("#optionContainer").remove(); } catch (e) {}
						$("#branchEditDialog").dialog("close");
						$("#branchEditDialog").remove();
					}
				}
			]

		});

		//adds tooltips to the edit dialog buttons
	    $(function () {
	        $(document).tooltip();
	    });
    }

    function updateRevealMenu(){
		revealMenu_arr = [];
		$(".questionBankItem").remove();
		var msg = "";
		var label = "home";
		var tmpID = "revealItem0";
		msg += "<div id='"+tmpID+"' class='questionBankItem";
		if(currentEditBankMember == 0){
			msg += " selectedEditBankMember";
		}else{
			msg += " unselectedEditBankMember";
		}
		msg += "' style='";

		msg += "width:45px;";

		var cleanText = $(data).find("page").eq(currentPage).children("branch").eq(0).find("title").text().replace(/<\/?[^>]+(>|$)/g, "");//////////////////////Need to clean out html tags.....
		msg += "' data-myID='0' title='" + cleanText + "'>" + label + "</div>";

		revealMenu_arr.push(tmpID);

		for(var h = 0; h < homePage_arr.length; h++){
			var label = "path" + homePage_arr[h].pathid;
			var pageIndex = homePage_arr[h].index;
			var tmpID = "revealItem"+(h+1);
			msg += "<div id='"+tmpID+"' class='questionBankItem";
			if(currentEditBankMember == pageIndex ||
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("pathid") ==  homePage_arr[h].pathid){
				msg += " selectedEditBankMember";
			}else{
				msg += " unselectedEditBankMember";
			}
			msg += "' style='";

			// if(h < 100){
			// 	msg += "width:30px;";
			// }else if(h > 99){
				msg += "width:45px;";
			// }
			var cleanText = $(data).find("page").eq(currentPage).children("branch").eq(pageIndex).find("title").text().replace(/<\/?[^>]+(>|$)/g, "");//////////////////////Need to clean out html tags.....
			msg += "' data-myID='" + pageIndex + "' title='" + cleanText + "'>" + label + "</div>";

			revealMenu_arr.push(tmpID);
		}

		$("#branchMenu").append(msg);

		for(var j = 0; j < revealMenu_arr.length; j++){
			var tmpID = "#" + revealMenu_arr[j];
			$(tmpID).click(function(){
				makeRevealDataStore();
				clearCKInstances();
				$('#bankItem'+ currentEditBankMember).removeClass("selectedEditBankMember").addClass("unselectedEditBankMember");
				$(this).removeClass("unselectedEditBankMember").addClass("selectedEditBankMember");
				$("#branchEditDialog").remove();
				currentEditBankMember = parseInt($(this).attr("data-myID"));
				updateBranchDialog();
			}).tooltip();
		}
	}

	function makeRevealDataStore(){
		if($("#isMandatory").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("mandatory", "true");
			mandatory = true;
		}else{
			$(data).find("page").eq(currentPage).attr("mandatory", "false");
			mandatory = false;
		}

		var newRevealContent = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
		var titleCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["optionTitleText"].getData());
		$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("title").empty();
		$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("title").append(titleCDATA);
		if($("#layoutDrop option:selected").val() != "graphicOnly"){
			var revealCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["optionText"].getData());
			$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("content").empty();
			$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("content").append(revealCDATA);
		}

		if($("#layoutDrop option:selected").val() != "textOnly" && $("#layoutDrop option:selected").val() != "sidebar"){
			$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("w", $("#mediaWidth").val());
			$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("h", $("#mediaHeight").val());
			if($("#posterFile").val() == "input poster path"){
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("poster", "null");
			}else{
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("poster", $("#posterFile").val());
			}
			if($('#isTranscript').is(':checked')){
				var transcriptUpdate = CKEDITOR.instances["inputTranscript"].getData();
				try { CKEDITOR.instances["inputTranscript"].destroy() } catch (e) {}
				var transcriptDoc = new DOMParser().parseFromString('<visualtranscript></visualtranscript>', 'application/xml');
				var transcriptCDATA = transcriptDoc.createCDATASection(transcriptUpdate);
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("visualtranscript").empty();
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("visualtranscript").append(transcriptCDATA);
			}
		}

		$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("layout", $("#layoutDrop option:selected").val());
		$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("img", $("#mediaLink").val());

		for(var i = 0; i < $(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("option").length; i++){
			if($('#optionActive' + i).prop('checked')){
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("option").eq(i).attr("active", "true");
			}
			else{
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("option").eq(i).attr("active", "false");
			}
			$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("option").eq(i).attr("img", $("#optionImg" + i).val());
			$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("option").eq(i).attr("altbtntitle", $("#optionAlt" + i).val());
		}
	}

	/**********************************************************************
    ** areYouSure?  Make sure that user actually intended to remove content.
    **********************************************************************/
	function areYouSure(){
		$("#stage").append('<div id="dialog-removeContent" title="Remove this item from the page."><p class="validateTips">Are you sure that you want to remove this item from your page? Selecting "Remove" will also remove all button links to this branch.<br/><br/>This cannot be undone!</div>');

	    $("#dialog-removeContent").dialog({
            modal: true,
            width: 550,
            close: function (event, ui) {
                $("#dialog-removeContent").remove();
            },
            buttons: {
                Cancel: function () {
                    $(this).dialog("close");
                },
                Remove: function(){
	                removeOption();
	                $(this).dialog("close");
                }
            }
        });
	}

	function removeOption(){
		if(branchCount > 1){
			clearCKInstances();
			var tempID = $(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("id");
			var optionLength = $(data).find("page").eq(currentPage).find("option").length;

			//CLEAR OUT ALL LINKS TO THIS BRANCH IN THE XML...
			for(var i = optionLength - 1; i >= 0; i--){
				if($(data).find("page").eq(currentPage).find("option").eq(i).attr("id") == tempID){
					$(data).find("page").eq(currentPage).find("option").eq(i).remove();
				}
			}
			$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).remove();
			$("#optionContainer").remove();
			branchCount--;
			currentBranch--;
			currentEditBankMember--;// = 0;

			$("#branchEditDialog").remove();
			homePage_arr = [];
			createHomePageArray(1);
			updateBranchDialog();
		}else{
			alert("you must have at least one bank item.");
		}
	}

	function addOption(_addID, _isNew){
		var optionLabel = parseInt(_addID) + 1;
		var currentPageType = $(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("pathtype");
		var currentPathId = $(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("pathid");

		if(_isNew == true){

			_addID = branchCount;
			$(data).find("page").eq(currentPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Path "+currentPathId+" Page Title");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).find("title").append(titleCDATA);
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("Path "+currentPathId+" page Content");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).find("sidebar").append(sidebarCDATA);

			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("id", guid());
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("layout", "textOnly");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("img", "defaultLeft.png");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("pathid", currentPathId);
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("pathtype", "branch");
			currentEditBankMember = parseInt(_addID);
			branchCount++;
		}

		if($(data).find("page").eq(currentPage).children("branch").eq(_addID).find('visualtranscript').text() != undefined && $(data).find("page").eq(currentPage).children("branch").eq(_addID).find('visualtranscript').text() != ""){
			transcriptText = $(data).find("page").eq(currentPage).children("branch").eq(_addID).find('visualtranscript').text();
		}else{
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).append($("<visualtranscript>"));
			var newVisualTranscript = new DOMParser().parseFromString('<visualtranscript></visualtranscript>',  "application/xml");
			var vTransCDATA = newVisualTranscript.createCDATASection("Visual transcript content");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).find("visualtranscript").append(vTransCDATA);
		}

		var branchTitle = $(data).find("page").eq(currentPage).children("branch").eq(_addID).find("title").text();
		var branchContent = $(data).find("page").eq(currentPage).children("branch").eq(_addID).find("content").text();
		var branchSidebar = $(data).find("page").eq(currentPage).children("branch").eq(_addID).find("sidebar").text();
		var currentLayout = $(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("layout");

		var transcriptText = $(data).find("page").eq(currentPage).children("branch").eq(_addID).find("visualtranscript").text();
		//alert("coming in " + transcriptText);

		var autoNext = false;
		if($(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("autonext") == "true"){
			autoNext = true;
		}

		var autoPlay = false;
		if($(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("autoplay") == "true"){
			autoPlay = true;
		}

		var hasPoster = false;
		var posterLink = "input poster path";
		if($(data).find("page").eq(currentPage).children("branch").eq(_addID).attr('poster') != undefined && $(data).find("page").eq(currentPage).children("branch").eq(_addID).attr('poster') != "null" && $(data).find("page").eq(currentPage).children("branch").eq(_addID).attr('poster').length != 0 && $(data).find("page").eq(currentPage).children("branch").eq(_addID).attr('poster') != "input poster path"){
	    	hasPoster = true;
	        posterLink = $(data).find("page").eq(currentPage).children("branch").eq(_addID).attr('poster');
	    }

		var msg = "<div id='optionContainer' class='templateAddItem' value='"+_addID+"'>";

		if(currentPageType != "home"){
			msg += "<div id='pageBranchMenu' class='dialogOptionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Page Branch Menu: </b></label></div><br/><hr/>";
			msg += "<div id='optionRemove' class='removeMedia' value='"+_addID+"' title='Click to remove this branch page'/>";
		}

		msg += "<label for='layoutDrop'  title='Set the page layout.'><b>set layout:</b> </label>";
     	msg += "<select name='layoutDrop' id='layoutDrop'>";
     	for(var j = 0; j < layoutType_arr.length; j++){
     		if(layoutType_arr[j] == $(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("layout")){
     			msg += "<option value='"+layoutType_arr[j]+"' selected='selected'>"+layoutType_arr[j]+"</option>";
     		}else{
	     		msg += "<option value='"+layoutType_arr[j]+"'>"+layoutType_arr[j]+"</option>";
     		}
	 	}
     	msg += "</select><br/>";
     	if(currentLayout != "sidebar" && currentLayout != "textOnly"){
			if($(data).find("page").eq(currentPage).children("branch").eq(_addID).attr('w') != undefined && $(data).find("page").eq(currentPage).children("branch").eq(_addID).attr('w') != null){
				var mediaWidth = parseInt($(data).find("page").eq(currentPage).children("branch").eq(_addID).attr('w'));
				var mediaHeight = parseInt($(data).find("page").eq(currentPage).children("branch").eq(_addID).attr('h'));
			}else{
				var mediaWidth = 0;
				var mediaHeight = 0;
			}

			/*if(posterLink == null){
				posterLink = "null";
			}*/

			var hasTranscript = false;
			if($(data).find("page").eq(currentPage).children("branch").eq(_addID).attr('visualtranscript') == "true"){
				hasTranscript = true;
			}

			var subsLink = $(data).find("page").eq(currentPage).children("branch").eq(_addID).attr('subs');

	     	msg += "<label for='mediaLink'><b>media: </b></label>";
			msg += "<input type='text' name='mediaLink' id='mediaLink' title='Media for this page.' value='"+$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr('img')+"' class='dialogInput'/>";
			msg += "<button id='dialogMediaBrowseButton'>browse</button><br/>";
			msg += '<div id="mediaSize">';
			msg += "<label id='mediaWidthLabel'>Media Width:</label>";
			msg += "<input id='mediaWidth' class='dialogInput' type='text' value="+ mediaWidth + " defaultValue="+ mediaWidth + " style='width:35px;'/>";
			msg += '<span id="widthError" class="error">The value must be a numeric value</span><br/>';
			msg += "<label id='mediaHeightLabel'>Media Height:</label>";
			msg += "<input id='mediaHeight' class='dialogInput' type='text' value="+ mediaHeight + " defaultValue="+ mediaHeight + " style='width:35px;'/>";
			msg += '<span id="heightError" class="error">The value must be a numeric value</span>';
			msg += '</div>';//end mediaSize
			msg += '<div id="mediaCheckboxs">';
			msg += "<label id='autoplayLabel'>autoplay: </label>";
			msg += "<input id='autoplay' type='checkbox' name='autoplay' class='radio' value='true'/></input>&nbsp;&nbsp;";
			msg += "<label id='autonextLabel'>autonext: </label>";
			msg += "<input id='autonext' type='checkbox' name='autonext' class='radio' value='true'/></input>&nbsp;&nbsp;";
			msg += "<label id='posterLabel'>poster: </label>";
			msg += "<input id='poster' type='checkbox' name='hasPoster' class='radio' value='true'/></input>&nbsp;&nbsp;";
			msg += "<input id='posterFile' class='dialogInput' type='text' value='"+ posterLink + "' defaultValue='"+ posterLink + "' style='width:40%;'/>";
			msg += '</div>';//end mediaCheckboxs
			msg += "<label id='label' title='Selecting adds a transcript button to page which reveals the transcript text below.'><b>Transcript:</b> </label>";
			msg += "<input id='isTranscript' type='checkbox' name='enableTranscript' class='radio' value='true'/>";
			msg += "<label id='inputTranscriptLabel' title='Input text to appear in transcript.'><b>Input your transcript:</b></label>";
			msg += "<div id='inputTranscript' type='text' contenteditable='true' class='dialogInput' style='width:40%;'>" + transcriptText + "</div>";
		}
		msg += "<br/>";
		msg += "<label id='optionTitleInput' style='padding-bottom:5px;'><b>edit branch title: </b></label>";
		msg += "<div id='optionTitleText' contenteditable='true' class='dialogInput' style='padding-bottom:5px; width:60%'>" + branchTitle + "</div>";
		if(currentLayout != "graphicOnly"){
			msg += "<div id='optionInput' style='padding-bottom:5px;'><b>edit branch content: </b></div>";
			msg += "<div id='optionText' contenteditable='true' class='dialogInput'>" + branchContent + "</div>";
		}

		if(currentLayout == "sidebar"){
			msg += "<div id='sidebarInput' style='padding-bottom:5px;'><b>edit branch sidebar: </b></div>";
			msg += "<div id='sidebarText' contenteditable='true' class='dialogInput'>" + branchSidebar + "</div>";
		}
		msg += "</div>";
		$("#branchEditDialog").append(msg);

		if(currentLayout != "sidebar" && currentLayout != "textOnly"){
			$("#dialogMediaBrowseButton").click(function(){
				$(".ui-dialog").hide();
				$(".ui-widget-overlay").hide();
				dialogToggleMediaBrowser($("#mediaLink"));
			});
		}
		//#3230
		$('#mediaWidth').on('change', function(){
			if(!$.isNumeric($('#mediaWidth').val())){
				$('#widthError').removeClass('error').addClass('error_show');
				$('#mediaWidth').val(mediaWidth);
			}
			else{
				if($('#widthError').hasClass('error_show')){
					$('#widthError').removeClass('error_show').addClass('error');
				}
			}
		});

		//#3230
		$('#mediaHeight').on('change', function(){
			if(!$.isNumeric($('#mediaHeight').val())){
				$('#heightError').removeClass('error').addClass('error_show');
				$('#mediaHeight').val(mediaHeight);
			}
			else{
				if($('#heightError').hasClass('error_show')){
					$('#heightError').removeClass('error_show').addClass('error');
				}
			}
		});

		$('#poster').on('change', function(){
			if($('#poster').prop("checked") == true){
				$('#posterFile').show();
			}
			else{
				$('#posterFile').hide();
			}
		});

		var tempType = getFileType($(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr('img'));
		if(tempType == "mp4" || tempType == "swf"){
			$("#mediaSize").show();
		}else{
			$("#mediaSize").hide();
		}

		if(tempType == "mp4"){
			$("#mediaCheckboxs").show();
		}else{
			$("#mediaCheckboxs").hide();
		}

		$("#layoutDrop").change(function() {
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("layout", $("#layoutDrop option:selected").val());
			clearCKInstances();
			try { $("#optionContainer").remove(); } catch (e) {}
			$("#branchEditDialog").dialog("close");
			$("#branchEditDialog").remove();
			updateBranchDialog();
		});

		if(currentPageType != "home"){
			$('#pageBranchMenu').append(createPathBank(currentPathId));

			for(var j = 0; j < revealPageMenu_arr.length; j++){
				var tmpID = "#" + revealPageMenu_arr[j];
				$(tmpID).click(function(){
					makeRevealDataStore();
					clearCKInstances();
					$('#bankItem'+ currentEditBankMember).removeClass("selectedEditBankMember").addClass("unselectedEditBankMember");
					$(this).removeClass("unselectedEditBankMember").addClass("selectedEditBankMember");
					$("#branchEditDialog").remove();
					currentEditBankMember = parseInt($(this).attr("data-myID"));
					updateBranchDialog();
				}).tooltip();
			}

			$("#optionContainer").append("<br/><div id='addPathPage' value='"+_addID+"'>add page</div><br/><br/>");

			$("#addPathPage").button().click(function(){
				makeRevealDataStore();
				clearCKInstances();
				try { $("#optionContainer").remove(); } catch (e) {}
				addOption(currentEditBankMember, true);
			});
		}
		else{

			var branchOptionLength = $(data).find("page").eq(currentPage).children("branch").eq(_addID).find("option").length;
			$("#optionContainer").append("<div id='editBranchOptionHolder'><b>path buttons (optional) :</b><br/></div>");
			for(var i = 0; i < branchOptionLength; i++){
				var optionText = $.trim($(data).find("page").eq(currentPage).children("branch").eq(_addID).find("option").eq(i).text());
				var optionID = $(data).find("page").eq(currentPage).children("branch").eq(_addID).find("option").eq(i).attr("id");
				var optionImage = $(data).find("page").eq(currentPage).children("branch").eq(_addID).find("option").eq(i).attr("img");
				var optionAlt = $(data).find("page").eq(currentPage).children("branch").eq(_addID).find("option").eq(i).attr("altbtntitle");
				if(optionAlt == undefined){ optionAlt = '';}
				var msg = "<div id='myBranchOption"+ i +"' style='width:90%; margin-bottom:5px;'>";
					msg += "<label><b>path "+$(data).find("page").eq(currentPage).children("branch").eq(_addID).find("option").eq(i).attr("path")+" : </b></label>";
					msg += "<label for='optionLabel' id='optionAltLabel"+ i + "'><b>Alt Title: </b></label>";
					msg += "<input type='text' name='optionAlt' id='optionAlt"+ i + "' title='Alternative page title to be used for the button. Leave blank to not use.' value='"+ optionAlt + "' class='dialogInput' style='width:250px;'/>";
					msg += "<label for='optionActive'><b>Activate image: </b></label>";
					msg += "<input id='optionActive"+i+"' type='checkbox' name='optionActive"+i+"' class='radio' title='Activate image button.'/>";
					msg += "<label for='optionImg' id='optionImgLabel"+ i + "' style='display:none' data='"+i+"'><b>Image: </b></label>";
					msg += "<input type='text' name='optionImg' id='optionImg"+ i + "' title='Image to be used for button.' value='"+ optionImage + "' data='"+i+"' class='dialogInput' style='width:250px;display:none'/>";
					msg += "<button id='browseMB" + i + "' style='display:none;'>browse</button>";
					msg += "</div>";
				$("#editBranchOptionHolder").append(msg);
				console.log("#browseMB" + i);
				var tmpID = "#browseMB" + i;
				var tmpIMG = "#optionImg" + i;
				if($(data).find("page").eq(currentPage).children("branch").eq(_addID).find("option").eq(i).attr("active") === "true"){
					$('#optionActive'+i).prop('checked', true);
					$('#optionImg'+i).toggle();
					$('#optionImgLabel'+i).toggle();
					$('#optionAlt'+i).toggle();
					$('#optionAltLabel'+i).toggle();
					$(tmpID).toggle();
					$(tmpID).click(function(){
						$(".ui-dialog").hide();
						$(".ui-widget-overlay").hide();
						dialogToggleMediaBrowser($(tmpIMG));
					});
				}
				var activeString = 'optionActive'+i;
				$('#'+activeString).change(toggle_handler(i));
			}

			//add path button
			$("#optionContainer").append("<br/><div id='addPath' value='"+_addID+"'>add path</div><br/><br/>");

			$("#addPath").button().click(function(){
				makeRevealDataStore();
				clearCKInstances();
				try { $("#optionContainer").remove(); } catch (e) {}
				$("#branchEditDialog").remove();
				addPath(revealMenu_arr.length);
				homePage_arr = [];
				createHomePageArray(1);
				updateBranchDialog();
			});
		}

		if(!autoNext){
			$("#autonext").removeAttr('checked');
		}else{
			$("#autonext").attr('checked', 'checked');
		}

		if(!hasTranscript){
			$("#isTranscript").removeAttr('checked');
		}else{
			$("#isTranscript").attr('checked', 'checked');
		}

		$("#inputTranscript").css("max-height", 150).css("overflow", "scroll");

		if(!hasPoster){
			$("#poster").removeAttr('checked');
			$('#posterFile').hide();
		}else{
			$("#poster").attr('checked', 'checked');
			$('#posterFile').show();
		}

		if(!autoPlay){
			$("#autoplay").removeAttr('checked');
		}else{
			$("#autoplay").attr('checked', 'checked');
		}

		if(!hasTranscript){
			$('#inputTranscriptLabel').hide();
			$('#inputTranscript').hide();
		}else{
			CKEDITOR.inline( "inputTranscript", {
				toolbar: contentToolbar,
				toolbarGroups :contentToolgroup,
				enterMode : CKEDITOR.ENTER_BR,
				shiftEnterMode: CKEDITOR.ENTER_P,
				extraPlugins: 'sourcedialog',
				on: {
			    	instanceReady: function(event){
			        	$(event.editor.element.$).attr("title", "Click here to edit this transcript.");
			    	}
			    }
			});
		}

		$("#mediaLink").change(function(){
			var myType = getFileType($(this).val());

			if(myType == "mp4" || myType == "swf"){
				$("#mediaSize").show();
			}else{
				$("#mediaSize").hide();
			}

			if(myType == "mp4"){
				$("#mediaCheckboxs").show();
			}else{
				$("#mediaCheckboxs").hide();
			}
		});

		$('#isTranscript').change(function(){
			if($("#isTranscript").prop("checked") == true){
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("visualtranscript", "true");
				$('#inputTranscriptLabel').show();
				$('#inputTranscript').show();
				CKEDITOR.inline( "inputTranscript", {
					toolbar: contentToolbar,
					toolbarGroups :contentToolgroup,
					enterMode : CKEDITOR.ENTER_BR,
					shiftEnterMode: CKEDITOR.ENTER_P,
					extraPlugins: 'sourcedialog',
				   	on: {
				      instanceReady: function(event){
				         $(event.editor.element.$).attr("title", "Click here to edit this transcript.");
				    	}
				    }
				});
			}
			else{
				try { CKEDITOR.instances["inputTranscript"].destroy() } catch (e) {}
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("visualtranscript", "false");
				$('#inputTranscriptLabel').hide();
				$('#inputTranscript').hide();
			}
		});

		$("#autonext").change(function(){
			if($(this).prop("checked") == true){
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("autonext", "true");
			}else{
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("autonext", "false");
			}
		});

		$("#autoplay").change(function(){
			if($(this).prop("checked") == true){
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("autoplay", "true");
			}else{
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("autoplay", "false");
			}
		});

		$("#optionRemove").on('click', function(){
			areYouSure();
		});

		if(currentLayout != "graphicOnly"){
			CKEDITOR.inline( "optionText", {
				toolbar: contentToolbar,
				toolbarGroups :contentToolgroup,
				enterMode : CKEDITOR.ENTER_BR,
				shiftEnterMode: CKEDITOR.ENTER_P,
				extraPlugins: 'sourcedialog',
			   	on: {
			      instanceReady: function(event){
			         $(event.editor.element.$).attr("title", "Click here to edit this option text.");
			    	}
			    }
			});
		}

		CKEDITOR.inline( "optionTitleText", {
			toolbar: pageTitleToolbar,
			toolbarGroups : pageTitleToolgroup,
			extraPlugins: 'sourcedialog',
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			allowedContent: true
		});

		if(currentLayout == "sidebar"){
			CKEDITOR.inline( "sidebarText", {
				toolbar: contentToolbar,
				toolbarGroups :contentToolgroup,
				enterMode : CKEDITOR.ENTER_BR,
				shiftEnterMode: CKEDITOR.ENTER_P,
				extraPlugins: 'sourcedialog',
			   	on: {
			      instanceReady: function(event){
			         $(event.editor.element.$).attr("title", "Click here to edit sidebar content.");
			    	}
			    }
			});
		}

		//CKEDITOR.instances.editor1.on('blur', function() {
         //alert('onblur fired');
      //});
		//$("#optionTitleText").focusout(function(){
		CKEDITOR.instances.optionTitleText.on('blur', function(){
			var newRevealContent = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			var titleCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["optionTitleText"].getData());
			$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("title").empty();
			$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("title").append(titleCDATA);
			clearCKInstances();
			try { $("#optionContainer").remove(); } catch (e) {}
			$("#branchEditDialog").dialog("close");
			$("#branchEditDialog").remove();
			updateBranchDialog();
		});
		if(currentLayout == "sidebar"){
			//$("#sidebarText").focusout(function(){
			CKEDITOR.instances.sidebarText.on('blur', function(){
				console.log("sidebar changed");
				console.log(CKEDITOR.instances["sidebarText"].getData());
				var newRevealContent = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
				var sidebarCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["sidebarText"].getData());
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("sidebar").empty();
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("sidebar").append(sidebarCDATA);
				clearCKInstances();
				try { $("#optionContainer").remove(); } catch (e) {}
				$("#branchEditDialog").dialog("close");
				$("#branchEditDialog").remove();
				updateBranchDialog();
			});
		}

		if(currentLayout != "graphicOnly"){
			CKEDITOR.instances.optionText.on('blur', function(){
				var newRevealContent = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
				var contentCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["optionText"].getData());
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("content").empty();
				$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).find("content").append(contentCDATA);
				clearCKInstances();
				try { $("#optionContainer").remove(); } catch (e) {}
				$("#branchEditDialog").dialog("close");
				$("#branchEditDialog").remove();
				updateBranchDialog();
			});
		}
	}

	function toggle_handler( j ) {
	    return function(event) {
	        $('#optionImg'+j).toggle();
	        $('#optionImgLabel'+j).toggle();
	        $('#optionAlt'+j).toggle();
	        $('#optionAltLabel'+j).toggle();
	        $("#browseMB" + j).toggle();
			$("#browseMB" + j).click(function(){
				$(".ui-dialog").hide();
				$(".ui-widget-overlay").hide();
				dialogToggleMediaBrowser($("#optionImg" + j));
			});
	    };
	}

	function createPathBank(_id){
		revealPageMenu_arr = [];
		var msg = '';
		var counter = 1;
		for(var h = 0; h < branchCount; h++){
			if($(data).find("page").eq(currentPage).children("branch").eq(h).attr('pathid') == _id){
				var label = counter;
				var tmpID = "revealItemPage"+h;
				msg += "<div id='"+tmpID+"' class='questionBankItem";
				if(currentEditBankMember == h){
					msg += " selectedEditBankMember";
				}else{
					msg += " unselectedEditBankMember";
				}
				msg += "' style='";

				// if(h < 100){
				 	msg += "width:30px;";
				// }else if(h > 99){
				//	msg += "width:45px;";
				// }
				var cleanText = $(data).find("page").eq(currentPage).children("branch").eq(h).find("title").text().replace(/<\/?[^>]+(>|$)/g, "");//////////////////////Need to clean out html tags.....
				msg += "' data-myID='" + h + "' title='" + cleanText + "'>" + label + "</div>";

				revealPageMenu_arr.push(tmpID);
				counter++;
			}
		}



		return msg;
	}

	function addPath(_id){
		var newPathId = _id;
		var _addID = branchCount;
		$(data).find("page").eq(currentPage).append($("<branch>"));
		var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
		$(data).find("page").eq(currentPage).children("branch").eq(_addID).append($("<title>"));
		var title = new DOMParser().parseFromString('<title></title>', "text/xml");
		var titleCDATA = title.createCDATASection("Path "+ newPathId +" Title");
		$(data).find("page").eq(currentPage).children("branch").eq(_addID).find("title").append(titleCDATA);
		$(data).find("page").eq(currentPage).children("branch").eq(_addID).append($("<content>"));
		var content = new DOMParser().parseFromString('<content></content>', "text/xml");
		var contentCDATA = content.createCDATASection("Path "+ newPathId +" Content");
		$(data).find("page").eq(currentPage).children("branch").eq(_addID).find("content").append(contentCDATA);
		$(data).find("page").eq(currentPage).children("branch").eq(_addID).append($("<sidebar>"));
		var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
		var sidebarCDATA = content.createCDATASection("New sidebar Content");
		$(data).find("page").eq(currentPage).children("branch").eq(_addID).find("sidebar").append(sidebarCDATA);
		//add button image to home branch
		$(data).find("page").eq(currentPage).children("branch").eq(0).append($("<option>"));
		var pathGuid = guid();
		$(data).find("page").eq(currentPage).children("branch").eq(0).find("option").last().attr("id", pathGuid);
		$(data).find("page").eq(currentPage).children("branch").eq(0).find("option").last().attr("path", newPathId);
		$(data).find("page").eq(currentPage).children("branch").eq(0).find("option").last().attr("img", "");
		$(data).find("page").eq(currentPage).children("branch").eq(0).find("option").last().attr("active", "false");
		$(data).find("page").eq(currentPage).children("branch").eq(0).find("option").attr("altbtntitle", "");

		$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("id", pathGuid);
		$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("layout", "textOnly");
		$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("img", "defaultLeft.png");
		$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("pathid", newPathId);
		$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("pathtype", "branch");
		//currentEditBankMember = _addID;
		branchCount++;
	}

    function clearCKInstances(){

		if (CKEDITOR.instances['sidebarText']) {
            CKEDITOR.instances.sidebarText.destroy();
        }
	}

	function clearMainCKEInstances(){
		try { CKEDITOR.instances.pageTitle.destroy(); } catch (e) {}
		try { CKEDITOR.instances.content.destroy(); } catch (e) {}
		try { CKEDITOR.instances.sidebar.destroy(); } catch (e) {}
	}

     /**********************************************************************
     **Save Content Edit - save updated content text to content.xml
     **********************************************************************/
    function saveContentEdit(_data){
        var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
        var newCDATA=docu.createCDATASection(_data);
        $(data).find("page").eq(currentPage).children("branch").eq(currentBranch).find("content").first().empty();
        $(data).find("page").eq(currentPage).children("branch").eq(currentBranch).find("content").first().append(newCDATA);
        sendUpdate();
    };

    /**********************************************************************
     **Save Sidebar Edit
     **********************************************************************/
	function saveSidebarEdit(_data){
	   	var docu = new DOMParser().parseFromString('<content></content>',  "application/xml")
	   	var newCDATA=docu.createCDATASection(_data);
	   	$(data).find("page").eq(currentPage).children("branch").eq(currentBranch).find("sidebar").empty();
	   	$(data).find("page").eq(currentPage).children("branch").eq(currentBranch).find("sidebar").append(newCDATA);
	   	sendUpdate();
	};

	/**********************************************************************
    **Save Question Edit - save updated question preferences to content.xml
    **********************************************************************/
	function saveBranchingEdit(_data){
		var extra = $(data).find("page").eq(currentPage).children("branch").length;
		var active = branchCount;
		//var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).children("branch").eq(i).remove();
		}

		markIncomplete();
		sendUpdateWithRefresh();
		fadeComplete();
	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
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

	//Allow fadeComplete to be called from external...
	this.fadeComplete = function(){
        	fadeComplete();
	}

    // fadeComplete() moved to C_UtilFunctions.js
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}
