/*!
 * C_TabbedContent
 * This class creates a template for a tabbed interface, allowing (text/images/swfs).
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 *
 * ©Concurrent Technologies Corporation 2018
 */
function C_TabbedContent(_type) {
	var type = _type;
	var revealCount//number of tabs.
	var myContent;
	var interact;
	var currentEditBankMember = 0;
	var revealMenu_arr = [];
	var currentItem;
	var myObjective = "undefined";
    var myObjItemId = "undefined";
    var currentSelected;
    var scroller;
    var clickAll = false;
    var clickCount = 1;

    //Defines a public method - notice the difference between the private definition below.
	this.initialize = function(){
		if(transition == true){
			$('#stage').css({'opacity':0});
		}

		//Clear accessibility on page load.
        pageAccess_arr = [];
        audioAccess_arr = [];

		revealCount = $(data).find("page").eq(currentPage).find("tab").length;
		myContent = $(data).find("page").eq(currentPage).find("content").text();
		
		if($(data).find("page").eq(currentPage).attr("interact") != undefined){
			interact = $(data).find("page").eq(currentPage).attr("interact");
		}else{
			interact = "click";
		}
		
		if($(data).find("page").eq(currentPage).attr("clickall") == undefined){
			$(data).find("page").eq(currentPage).attr("clickall", "false");
		}else if ($(data).find("page").eq(currentPage).attr("clickall") == "true"){
			clickAll = true;
		}
		
		console.log("clickAll = " + clickAll);
		
		if(clickAll == true && mode != "edit"){
			disableNext();
		}
		
		pageTitle = new C_PageTitle();
		audioHolder = new C_AudioHolder();

		buildTemplate();
	}


	/*****************************************
	**Build Template
	*****************************************/
	function buildTemplate() {
		//Add the divs for the page title and the content and divs.

		$("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div class="box"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div><div id="tabs"></div></div></div></div>');
		if(isMobilePhone){
			$("#contentHolder").prepend(myContent);
		}else{
			$("#content").prepend(myContent);
		}

		//pageAccess_arr.push($("#content"));

		$("#scrollableContent").addClass("tabsLeft");
	    $("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));

		var tabString = '<ul>';

		for(var i = 0; i < revealCount; i++){
			var currentTab = $(data).find("page").eq(currentPage).find("tab").eq(i).attr("title");
			var tabID = "tab" + i;
			tabString += '<li id="acc'+tabID+'"><a href="#'+ tabID +'">'+ currentTab +'</a></li>';
		}
		tabString += '</ul>';

		for(var i = 0; i < revealCount; i++){
			var currentTab = $(data).find("page").eq(currentPage).find("tab").eq(i).attr("title");
			var tabID = "tab" + i;
			var currentTabContent = $(data).find("page").eq(currentPage).find("tab").eq(i).text();
			tabString += '<div id="'+ tabID +'" class="cognizenTabContent"><p>' + currentTabContent + '</p></div>';
		}

		$("#tabs").append(tabString);

		if(type == "tabsLeft"){
			$("#tabs").addClass("left");
		}else if(type == "tabsOnly"){
			$("#tabs").addClass("tabTop");
		}

		var tabs = $("#tabs").tabs({
			'create' : function() {
				var contentTop = $("#content").position().top;
				var tabTop = $(".ui-tabs-nav").position().top;
				var tabHeight = $(".ui-tabs-nav").height();
				var audioHeight = 0;
			}
		});
		
		$("#tabs").find('ul').removeAttr("role");

		$tabis = $('#tabs ul li');

		for(var i = 0; i < revealCount; i++){
			
			var currentTab = $(data).find("page").eq(currentPage).find("tab").eq(i).attr("title");
			var currentTabContent = $("#tab"+i).text();
			$tabis.eq(i).removeAttr("role");
			if(i == 0){
				$tabis.eq(i).find('a').attr("beenClicked", "true");
			}else{
				$tabis.eq(i).find('a').attr("beenClicked", "false");
			}
			$tabis.eq(i).find('a').attr("aria-expanded", "false");
			$tabis.eq(i).find('a').removeAttr("role");
			$tabis.eq(i).find('a').click(function(){
				currentSelected.attr("aria-expanded", "false");
				currentSelected.attr("aria-selected", "false");
				currentSelected = $(this);
				currentSelected.attr("aria-expanded", "true");
				currentSelected.attr("aria-selected", "true");
				console.log(currentSelected.attr("beenClicked"));
				if(currentSelected.attr("beenClicked") == "false"){
					currentSelected.attr("beenClicked", "true");
					clickCount++;
					if(clickCount == revealCount && clickAll == true){
						enableNext();
					}
				}
				var temp = $(this).parent().attr("aria-controls");
				if(!$(courseData).find('course').attr('section508')){
					$("#"+temp).focus();
				}
				else if($(courseData).find('course').attr('section508') === 'true'){
					$("#"+temp).focus();
				}
				scrollTimer = setInterval(function () {scrollRefresh()}, 500);
			}).keypress(function(event) {
				var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
			    if (chCode == 32 || chCode == 13){
				    $(this).click();
				}
		    });
			pageAccess_arr.push($tabis.eq(i).find('a'));
		}
		
		currentSelected = pageAccess_arr[0];
		currentSelected.attr("aria-expanded", "true")
		currentSelected.attr("aria-selected", "true");
		/*Attach Media*/
		if(type == "tabsOnly"){

			if(transition == true){
				// fade stage in
				$('#stage').velocity({
					opacity: 1
				}, {
					duration: transitionLength,
					complete: checkMode
				});
			}else{
				checkMode();
			}
		}else if(type == "tabsLeft"){
			mediaHolder = new C_VisualMediaHolder();
        	mediaHolder.loadVisualMedia(checkMode());
		}else{
			mediaHolder = new C_VisualMediaHolder();
        	mediaHolder.loadVisualMedia(checkMode());
		}

		doAccess(pageAccess_arr);
	}
	
	 function scrollRefresh(){
        window.clearInterval(scrollTimer);
		scroller.refresh();
    }
	
	var scrollTimer;
	
	
	/*****************************************************************************************************************************************************************************************************************
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	PAGE EDIT FUNCTIONALITY
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	function checkMode(){

		scroller = $('.antiscroll-wrap').antiscroll().data('antiscroll');

		if(mode == "edit"){
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
				allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
			});


			/***************************************************************************************************
			EDIT TABS
			***************************************************************************************************/
			//Add and place contentEdit button
			$('#tabs').prepend("<div id='conEdit' class='btn_edit_text' title='Edit Text Content'></div>");

			$("#conEdit").click(function(){
				updateRevealDialog();
			}).tooltip();
		}
		$(this).scrubContent();
	}

	function updateRevealDialog(){
		if (CKEDITOR.instances['revealContentText']) {
			CKEDITOR.remove(CKEDITOR.instances['revealContentText']);
		}
		try { $("#contentEditDialog").remove(); } catch (e) {}
		//Create the Content Edit Dialog
		var msg = "<div id='contentEditDialog' title='Update Tabs'>";
		msg += "<label id='hover'  title='Define whether users click or hover over tabs.'><b>Hover: </b></label>";
		msg += "<input id='isHover' type='checkbox' name='hover' class='radio' value='true'/>";
		msg += "<br/>"
		msg += "<label id='clickalllabel'  title='Define whether users must select all items before advancing.'><b>Click all: </b></label>";
		msg += "<input id='isClickAll' type='checkbox' name='isClickAll' class='radio' value='true'/>";
		msg += "<br/>"
		msg += "<div id='questionMenu'><label style='position: relative; float: left; margin-right:20px; line-height:30px;'><b>Reveal Item Menu: </b></label></div><br/><br/>";
		$("#stage").append(msg);

		updateRevealMenu();

		if(interact == "hover"){
			$("#isHover").attr("checked", "checked");
		}
		
		if(clickAll){
			$("#isClickAll").attr("checked", "checked");
		}

		addReveal(currentEditBankMember, false);

		$("#contentEditDialog").dialog({
			modal: true,
			width: 875,
			height: 655,
			resizable: false,
			dialogClass: "no-close",
			close: function(){
				$("#contentEditDialog").remove();
				if (CKEDITOR.instances['revealContentText']) {
					CKEDITOR.remove(CKEDITOR.instances['revealContentText']);
				}
			},
			buttons: [
				{
					text: "Add",
					title: "Add a new reveal.",
					click: function(){
						makeRevealDataStore();
						clearCKInstances();
						try { $("#revealContainer").remove(); } catch (e) {}
						addReveal(revealCount, true);
						updateRevealMenu();
					}
				},
				{
					text: "Done",
					title: "Close this dialog.",
					click: function(){
						makeRevealDataStore();
						clearCKInstances();
						saveRevealEdit();
						$( this ).dialog( "close" );
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
		for(var h = 0; h < revealCount; h++){
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
			var cleanText = $(data).find("page").eq(currentPage).find("tab").eq(h).text().replace(/<\/?[^>]+(>|$)/g, "");//////////////////////Need to clean out html tags.....
			msg += "' data-myID='" + h + "' title='" + cleanText + "'>" + label + "</div>";

			revealMenu_arr.push(tmpID);
		}

		$("#questionMenu").append(msg);

		for(var j = 0; j < revealMenu_arr.length; j++){
			if(currentEditBankMember != j){
				var tmpID = "#" + revealMenu_arr[j];
				$(tmpID).click(function(){
					makeRevealDataStore();
					$('#bankItem'+ currentEditBankMember).removeClass("selectedEditBankMember").addClass("unselectedEditBankMember");
					$(this).removeClass("unselectedEditBankMember").addClass("selectedEditBankMember");
					$("#contentEditDialog").remove();
					currentEditBankMember = $(this).attr("data-myID");
					updateRevealDialog();
				}).tooltip();
			}
		}
	}

	function makeRevealDataStore(){
		if($("#isHover").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("interact", "hover");
			interact = "hover";
		}else{
			$(data).find("page").eq(currentPage).attr("interact", "click");
			interact = "click";
		}
		
		if($("#isClickAll").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("clickall", "true");
			clickAll = true;
		}else{
			$(data).find("page").eq(currentPage).attr("clickall", "false");
			clickAll = false;
		}

		var newRevealContent = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
		var revealCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["revealContentText"].getData());
		$(data).find("page").eq(currentPage).find("tab").eq(currentEditBankMember).empty();
		$(data).find("page").eq(currentPage).find("tab").eq(currentEditBankMember).append(revealCDATA);
		$(data).find("page").eq(currentPage).find("tab").eq(currentEditBankMember).attr("title", $("#revealTitleText").val());
	}

	function addReveal(_addID, _isNew){
		var revealLabel = parseInt(_addID) + 1;

		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<tab>"));
			var option1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			//$(data).find("page").eq(currentPage).find("tab").eq(_addID).append($("<content>"));
			//var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = option1.createCDATASection("<p>New Tab Text</p>");
			$(data).find("page").eq(currentPage).find("tab").eq(_addID).append(option1CDATA);
			$(data).find("page").eq(currentPage).find("tab").eq(_addID).attr("title", "new tab");

			currentEditBankMember = _addID;
			revealCount++;
		}

		var myTabLabel = $(data).find("page").eq(currentPage).find("tab").eq(_addID).attr("title");
		var myTabContent = $(data).find("page").eq(currentPage).find("tab").eq(_addID).text();

		var msg = "<div id='revealContainer' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='revealRemove' class='removeMedia' value='"+_addID+"' title='Click to remove this tab'/>";
		msg += "<label title='Input tab title text.'>Tab Title: </label>";
		msg += "<input id='revealTitleText' class='dialogInput' type='text' value='"+ myTabLabel + "' defaultValue='"+ myTabLabel + "' style='width:30%;'/>";

		msg += "<div title='Input tab content.'>Tab Content:</div> ";
		msg += "<div id='revealContentText' class='dialogInput'>" + myTabContent + "</div>";
		msg += "</div>";

		$("#contentEditDialog").append(msg);

		$("#revealRemove").click(function(){
			areYouSure();
		});


	    CKEDITOR.replace( "revealContentText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
			allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
		});

	}

	function clearCKInstances(){
		if (CKEDITOR.instances['revealContentText']) {
            CKEDITOR.instances.revealContentText.destroy();
        }
	}

	/**********************************************************************
    ** areYouSure?  Make sure that user actually intended to remove content.
    **********************************************************************/
	function areYouSure(){
		$("#stage").append('<div id="dialog-removeContent" title="Remove this item from the page."><p class="validateTips">Are you sure that you want to remove this item from your page? <br/><br/>This cannot be undone!</div>');

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
	                removeReveal();
	                $(this).dialog("close");
                }
            }
        });
	}

	function removeReveal(){
		if(revealCount > 1){
			$(data).find("page").eq(currentPage).find("tab").eq(currentEditBankMember).remove();
			$("#revealContainer").remove();
			revealCount--;
			currentEditBankMember = 0;
			updateRevealDialog();
		}else{
			alert("you must have at least one bank item.");
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
        sendUpdateWithRefresh();
    };

	/**********************************************************************
	**Save Tab Edit
	**********************************************************************/
	function saveRevealEdit(_data){
		var extra = $(data).find("page").eq(currentPage).find("tab").length;
		var active = revealCount;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("tab").eq(i).remove();
		}

		sendUpdateWithRefresh();
		fadeComplete();
	};

	//////////////////////////////////////////////////////////////////////////////////////////////////END EDIT MODE


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

	this.fadeComplete = function(){
		fadeComplete();
	}
    // fadeComplete() moved to C_UtilFunctions.js
}