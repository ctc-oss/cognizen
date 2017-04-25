/*!
 * C_Chaining
 * This class creates a template multi-page chaining scenarios.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: Version 1.0
 * DATE: 2015-1-15
 * JavaScript
 *
 * Copyright (c) 2014, CTC. All rights reserved.
 *
 * @author: Philip Double, doublep@ctc.com
 */
function C_Chaining(_type) {
	var type = _type;
	var myContent;//Body
	var branchCount = 0;
	var branchType = type;
	var currentMedia;
	//var currentBranch = 0;
	var mandatory = true;
	var currentEditBankMember = 0;
	var currentStep = 0;
	var pageOrder_arr = [];
	var pageTracker = 0;
	var layoutType_arr = ["textOnly", "graphicOnly", "top", "right", "bottom", "left", "sidebar"];
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
		pageOrder_arr.push(0);
		createPageArray(currentBranch);
		//used for debugging, commentted out when not in use
		// for (var i = 0; i < pageOrder_arr.length; i++) {

		// 	console.log($(data).find("page").eq(currentPage).children("branch").eq(pageOrder_arr[i]).attr("stepnumber") + ' : ' +
		// 		$(data).find("page").eq(currentPage).children("branch").eq(pageOrder_arr[i]).attr("steptype"));
		// };
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
		isComplete = $(data).find("page").eq(currentPage).children("branch").eq(_id).attr("pathcomplete");
		currentMedia = $(data).find("page").eq(currentPage).children("branch").eq(_id).attr("img");
		if(isComplete == "true"){
			mandatoryInteraction = false;
			checkNavButtons();
		}

		pageTitle = new C_PageTitle(_id);

		buildContentText();

		buildBranchOptions(_id);
		checkMode();

		if($(courseData).find("course").attr("redmine") && $(courseData).find("course").attr("redmine") == "true" && mode=='edit'){
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
	function buildContentText(){
		if(branchType != "graphicOnly"){
	        $('<div id="scrollableContent" class="antiscroll-wrap"><div class="box"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div></div></div></div>').insertAfter("#pageTitle");
		    addLayoutCSS(branchType);
		    $("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		    // WTF?  scrollableContent.position.top changes after contentHolder.height is set for the first time
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
	    if(branchType != "textOnly" && branchType != "sidebar" && branchType != "branching"){
		    mediaHolder = new C_VisualMediaHolder(null, branchType, currentMedia);
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
		var branchStepNum = $(data).find("page").eq(currentPage).children("branch").eq(_id).attr("stepnumber");
		var branchStepType = $(data).find("page").eq(currentPage).children("branch").eq(_id).attr("steptype");

		//var paletteWidth = 0;
		if(branchType == "top" || branchType == "bottom" || branchType == "graphicOnly"){
			$("<div id='buttonPalette' class='buttonPalette'></div><br/><br/>").insertAfter("#mediaHolder");
		}else{
			$("<div id='buttonPalette' class='buttonPalette'></div><br/><br/>").insertAfter("#content");
		}


		if(branchStepType != "intro"){
			var _backId = pageOrder_arr[pageTracker-1];
			var buttonLabel = 'Back';//$(data).find("page").eq(currentPage).children("branch").eq(_id).find("option").eq(i).text();
			var buttonID = $(data).find("page").eq(currentPage).children("branch").eq(_backId).attr("id");
			var myOption = "option0";
			$("#buttonPalette").append("<div id='"+myOption+"' class='btn_branch' mylink='"+buttonID+"' aria-label='"+buttonLabel+"'>"+buttonLabel+"</div>");
			$("#"+myOption).button().click({type : branchStepType} , function(event){
				pageTracker--;
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
		}

		if(branchStepType != "summary"){
			var _nextId = pageOrder_arr[pageTracker+1];
			var buttonLabel = 'Next';//$(data).find("page").eq(currentPage).children("branch").eq(_id).find("option").eq(i).text();
			var buttonID = $(data).find("page").eq(currentPage).children("branch").eq(_nextId).attr("id");
			var myOption = "option1";
			$("#buttonPalette").append("<div id='"+myOption+"' class='btn_branch' mylink='"+buttonID+"' aria-label='"+buttonLabel+"'>"+buttonLabel+"</div>");
			$("#"+myOption).button().click({type : branchStepType} , function(event){
				pageTracker++;
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
		}
		//$("#buttonPalette").width(paletteWidth);
	}

	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    createPageArray - builds the order the pages will be displayed in based on the chaining idea
    ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function createPageArray(_id){
		var _stepNum = parseInt($(data).find("page").eq(currentPage).children("branch").eq(_id).attr("stepnumber"));
		var _stepType = $(data).find("page").eq(currentPage).children("branch").eq(_id).attr("steptype");

		if(_stepNum == 0){
			if(_stepType === "intro"){
				var id = findNextBranch('0', 'overview');
				pageOrder_arr.push(id);
				createPageArray(id);
			}
			else{
				//increment current step
				var nextStep = currentStep + 1;
				var _next = findNextBranch(nextStep.toString(), 'teach');
				if(_next != -1){
					currentStep++;
					var id = _next;
					pageOrder_arr.push(id);
					createPageArray(id);
				}
				else{
					var id =findNextBranch('0', 'summary');
					pageOrder_arr.push(id);
				}

			}
		}
		else if(_stepType === 'teach'){
			//always pract step 1 first after you teach a new step
			var id = findNextBranch('1', 'practice');
			pageOrder_arr.push(id);
			createPageArray(id);
		}
		else if(_stepType === 'practice'){
			//increment through the step practice until you reach the currentstep
			if(_stepNum == currentStep){
				var id = findNextBranch('0', 'overview');
				pageOrder_arr.push(id);
				createPageArray(id);
			}
			else{
				var incrStep = _stepNum + 1;
				var id = findNextBranch(incrStep.toString(), 'practice');
				pageOrder_arr.push(id);
				createPageArray(id);
			}
		}

	}




	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    findNextBranch - identifies branch by stepnumber and steptype
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	function findNextBranch(_stepNum, _stepType){
		branchCount = $(data).find("page").eq(currentPage).children("branch").length;
		for (var i = 0; i < branchCount; i++) {
			var _branchStepNum = $(data).find("page").eq(currentPage).children("branch").eq(i).attr("stepnumber");
			var _branchStepType = $(data).find("page").eq(currentPage).children("branch").eq(i).attr("steptype");
			if( (_branchStepNum === _stepNum) && (_branchStepType === _stepType) ){
				return i;//$(data).find("page").eq(currentPage).children("branch").eq(i).attr("id");
			}
		}

		return -1;
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

			/*******************************************************
			* Edit Question
			********************************************************/
            //Add and style titleEdit button
			if(branchType != "graphicOnly"){
				$('#scrollableContent').prepend("<div id='branchEdit' class='btn_edit_text' title='Edit this exercise'></div>");
			}
			else{
				$('#mediaHolder').prepend("<div id='branchEdit' class='btn_edit_text' title='Edit this exercise'></div>");
			}

			$("#branchEdit").click(function(){
				updateBranchDialog();
			}).tooltip();
		}
    }

    function updateBranchDialog(){
	    var msg = "<div id='branchEditDialog' title='Create Branching Exercise'>";
		msg += "<label id='label' title='Indicates if this page is must be completed before going to the next page.'><b>mandatory: </b></label>";
		msg += "<input id='isMandatory' type='checkbox' name='mandatory' class='radio' value='true'/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";

		msg += "<div id='branchMenu' class='dialogOptionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Branch Menu: </b></label></div><br/><br/>";
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
					text: "Add",
					title: "Add a step.",
					click: function(){
						makeRevealDataStore();
						clearCKInstances();
						try { $("#optionContainer").remove(); } catch (e) {}
						addOption(branchCount, true);
						updateRevealMenu();
					}
				},
				{
					text: "Done",
					title: "Saves and closes the edit dialog.",
					click: function(){
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
		for(var h = 0; h < branchCount; h++){
			var label = parseInt(h + 1);
			var tmpID = "revealItem"+h;
			msg += "<div id='"+tmpID+"' class='questionBankItem";
			if(currentEditBankMember == h){
				msg += " selectedEditBankMember";
			}else{
				msg += " unselectedEditBankMember";
			}
			msg += "' style='";

			if(h < 100){
				msg += "width:30px;";
			}else if(h > 99){
				msg += "width:45px;";
			}
			var cleanText = $(data).find("page").eq(currentPage).children("branch").eq(h).find("title").text().replace(/<\/?[^>]+(>|$)/g, "");//////////////////////Need to clean out html tags.....
			msg += "' data-myID='" + h + "' title='" + cleanText + "'>" + label + "</div>";

			revealMenu_arr.push(tmpID);
		}

		$("#branchMenu").append(msg);

		for(var j = 0; j < revealMenu_arr.length; j++){
			if(currentEditBankMember != j){
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
		$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("layout", $("#layoutDrop option:selected").val());
		$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("img", $("#mediaLink").val());

	}

	/**********************************************************************
    ** areYouSure?  Make sure that user actually intended to remove content.
    **********************************************************************/
	function areYouSure(){
		$("#stage").append('<div id="dialog-removeContent" title="Remove this step from the page.">'+
			'<p class="validateTips">Are you sure that you want to remove this step from your page?'+
			' Selecting "Remove" will remove both the "teach" and "practice" items for the step.'+
			'<br/><br/>This cannot be undone!</div>');

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
			var stepNumber = parseInt($(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("stepnumber"));
			if(stepNumber != 0){
				clearCKInstances();

				var _stepType = $(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr("steptype")

				if(_stepType === "teach"){
					$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).remove();
					$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).remove();
					currentEditBankMember--;
				}
				else{
					$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).remove();
					$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember-1).remove();
					currentEditBankMember = currentEditBankMember - 2;
				}

				branchCount = branchCount-2;
				$("#branchEditDialog").dialog("close");
				$("#branchEditDialog").remove();
				updateBranchDialog();
			}
			else{
				alert("You cannot delete the introduction, overview or summary.");
			}
		}else{
			alert("you must have at least one bank item.");
		}
	}

	function findHighestStep(){
		var highStep = 0;
		for (var i = 0; i < branchCount; i++) {
			var stepNumber = parseInt($(data).find("page").eq(currentPage).children("branch").eq(i).attr("stepnumber"));
			if(stepNumber > highStep){
				highStep = stepNumber;
			}
		}
		return highStep;
	}

	function addOption(_addID, _isNew){
		var optionLabel = parseInt(_addID) + 1;

		if(_isNew == true){
			var newStepCount = findHighestStep() + 1;
			//step teach
			$(data).find("page").eq(currentPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Chaining Step "+ newStepCount + " teach");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).find("title").append(titleCDATA);
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).find("sidebar").append(sidebarCDATA);

			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("id", guid());
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("success", "false");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("pathcomplete", "false");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("layout", "textOnly");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("img", "defaultLeft.png");
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("stepnumber", newStepCount.toString());
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("steptype", "teach");
			branchCount++;

			//step practice
			var oneMore = _addID + 1;
			$(data).find("page").eq(currentPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Chaining Step "+ newStepCount + " practice");
			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).find("title").append(titleCDATA);
			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).find("sidebar").append(sidebarCDATA);

			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).attr("id", guid());
			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).attr("success", "false");
			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).attr("pathcomplete", "false");
			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).attr("layout", "textOnly");
			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).attr("img", "defaultLeft.png");
			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).attr("stepnumber", newStepCount.toString());
			$(data).find("page").eq(currentPage).children("branch").eq(oneMore).attr("steptype", "practice");
			currentEditBankMember = _addID;
			branchCount++;
		}

		var branchTitle = $(data).find("page").eq(currentPage).children("branch").eq(_addID).find("title").text();
		var branchContent = $(data).find("page").eq(currentPage).children("branch").eq(_addID).find("content").text();
		var branchSidebar = $(data).find("page").eq(currentPage).children("branch").eq(_addID).find("sidebar").text();
		var currentLayout = $(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("layout");

		var msg = "<div id='optionContainer' class='templateAddItem' value='"+_addID+"'>";
		if(parseInt($(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("stepnumber")) != 0){
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
     	msg += "</select>&nbsp;&nbsp;";
     	if(currentLayout != "sidebar" && currentLayout != "textOnly"){
	     	msg += "<label for='mediaLink'><b>media: </b></label>";
			msg += "<input type='text' name='mediaLink' id='mediaLink' title='Media for this page.' value='"+$(data).find("page").eq(currentPage).children("branch").eq(currentEditBankMember).attr('img')+"' class='dialogInput'/>";
		}
		msg += "<button id='dialogMediaBrowseButton'>browse</button><br/>";
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

		$("#layoutDrop").change(function() {
			$(data).find("page").eq(currentPage).children("branch").eq(_addID).attr("layout", $("#layoutDrop option:selected").val());
			clearCKInstances();
			try { $("#optionContainer").remove(); } catch (e) {}
			$("#branchEditDialog").dialog("close");
			$("#branchEditDialog").remove();
			updateBranchDialog();
		});

		$("#addBranchOption").button().click(function(){
			addNewBranchOption($(this).attr("value"));
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

		//$("#optionText").focusout(function(){
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

    function clearCKInstances(){
		if (CKEDITOR.instances['optionText']) {
            CKEDITOR.instances.optionText.destroy();
        }
        if (CKEDITOR.instances['optionTitleText']) {
            CKEDITOR.instances.optionTitleText.destroy();
        }
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