/*!
 * C_ClickListRevealText
 * This class creates a template for placing a list of terms that reveals  text in set box.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2014-09-01
 *
 * Copyright (c) 2014, CTC. All rights reserved.
 *
 * @author: Philip Double, doublep@ctc.com
 */
function C_ClickListRevealText(_type) {
	var type = _type;
	var revealCount;//number of tabs.
	var myContent;//Body
	var mediaWidth;
	var mediaHeight;
	var interact = "click";
	var currentEditBankMember = 0;
	var revealMenu_arr = [];
	var currentItem;
	var myObjective = "undefined";
    var myObjItemId = "undefined";
    var isFirst = true;
	var scroller;
    var scrollTimer;
    var clickAll = false;
    var clickCount = 0;

     //Defines a public method - notice the difference between the private definition below.
	this.initialize = function(){
		if(transition == true){
			$('#stage').css({'opacity':0});
		}

		//Clear accessibility on page load.
        pageAccess_arr = [];
        audioAccess_arr = [];

		//Set template variable values.
		revealCount = $(data).find("page").eq(currentPage).find("reveal").length;
		myContent = $(data).find("page").eq(currentPage).find("content").first().text();
		interact = $(data).find("page").eq(currentPage).attr("interact");
		if($(data).find("page").eq(currentPage).attr('objective')){
			myObjective = $(data).find("page").eq(currentPage).attr('objective');
		}

		if($(data).find("page").eq(currentPage).attr('objItemId')){
			myObjItemId = $(data).find("page").eq(currentPage).attr('objItemId');
		}
		
		if($(data).find("page").eq(currentPage).attr("clickall") == undefined){
			$(data).find("page").eq(currentPage).attr("clickall", "false");
		}else if ($(data).find("page").eq(currentPage).attr("clickall") == "true"){
			clickAll = true;
		}
		
		if(clickAll == true && mode != "edit"){
			disableNext();
		}

		pageTitle = new C_PageTitle();
		audioHolder = new C_AudioHolder();

		buildTemplate();
	}

	function buildTemplate() {
		$("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div class="box"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div></div></div></div>');
		$("#scrollableContent").addClass("top");
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
			// WTF?  scrollableContent.position.top changes after contentHolder.height is set for the first time
			// So we do it twice to get the right value
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));

		if(isMobilePhone){
			$("#contentHolder").prepend(myContent);
			$("<form action='#'><select name='listPaletteMenu' id='listPaletteMenu'></select></form>").insertAfter("#content");
		}else{
			$("#content").append(myContent);
			$("<div id='scrollableListPalette' class='antiscroll-wrap'><div class='box'><div id='listPalette' class='listPalette overthrow antiscroll-inner'></div></div></div>").insertAfter("#content");
        }

		for(var i = 0; i < revealCount; i++){
			var currentItem = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("title").text();
			var tmpContent = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("content").text();
			var tmpCaption = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("caption").text();

			var revID = "revID" + i;

			var ariaText = tmpContent.replace(/\'/g, "").replace(/\"/g, "");

			if(isMobilePhone){
				$("#listPaletteMenu").append("<option id='"+ revID +"' myContent='"+ tmpContent +"' role='button'>"+currentItem+"</option>");
			}else{
				$("#listPalette").append("<div id='"+ revID +"' class='listItem' beenClicked='false' myContent='"+ tmpContent +"' role='button'>"+currentItem+"</div>");

				if(interact == "click"){
					$("#" + revID).click(function(){
						if(clickAll == true){
							if($(this).attr("beenClicked") == "false"){
								$(this).attr("beenClicked", "true");
								clickCount++;
								
								if(clickCount == revealCount){
									enableNext();
								}
							}
						}
						updateRevealContent($(this));
					}).keypress(function(event) {
						var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
						if (chCode == 32 || chCode == 13){
							$(this).click();
						}
					});
				}else if(interact == "hover"){
					$("#" + revID).hover(function(){
						if(clickAll == true){
							clickCount++;
							
							if(clickCount == revealCount){
								enableNext();
							}
						}
						updateRevealContent($(this));
					});
				}
			}
			pageAccess_arr.push($("#" + revID));
		}

		if(isMobilePhone){
			document.getElementById("listPaletteMenu").onchange=function(){
				updateRevealContent($('#listPaletteMenu option:selected'));
			};
			$("<div id='clickListTextHolder' class='clickListTextHolder antiscroll-wrap'><div class='box'><div id='clickListText' class='clickListText antiscroll-inner' tabindex='0'></div></div></div><br/><br/>").insertAfter("#listPaletteMenu");
		}else{
			$("<div id='clickListTextHolder' class='clickListTextHolder antiscroll-wrap'><div class='box'><div id='clickListText' class='clickListText antiscroll-inner' tabindex='0'></div></div></div><br/><br/>").insertAfter("#scrollableListPalette");

			$(".listPalette").height($("#stage").height() - ($("#scrollableContent").position().top + $("#content").height() + $("#scrollableListPalette").position().top + audioHolder.getAudioShim() ));
			$("#clickListTextHolder").height($(".listPalette").height());
		}
		
		checkMode();
		if(transition == true){
			// fade stage in
			$('#stage').velocity({
				opacity: 1
			}, {
				duration: transitionLength
			});
		}
		//Select the first one...
		doAccess(pageAccess_arr);
		if(isMobilePhone){
			updateRevealContent($('#listPaletteMenu option:selected'));			
		}else{
			$("#revID0").click();
		}

	}

	function updateRevealContent(_myItem){
		try { $(currentItem).removeClass("clickListSelected"); } catch (e) {}
		currentItem = _myItem;
		try { $(currentItem).addClass("clickListSelected"); } catch (e) {}
		$("#clickListText").empty();

		$("#clickListText").append(_myItem.attr("myContent"));
		$("#clickListText").height($("#clickListTextHolder").height() - 10);
		if(isFirst){
			isFirst = false;
		}else{
			$("#clickListText").focus();
		}
        scrollTimer = setInterval(function () {scrollRefresh()}, 500);
	}

    function scrollRefresh(){
        window.clearInterval(scrollTimer);
		scroller.refresh();
		listContentScroller.refresh();
    }

	function checkMode(){
		$(this).scrubContent();
		scroller = $('#scrollableContent').antiscroll().data('antiscroll');
		listContentScroller = $('.clickListTextHolder').antiscroll().data('antiscroll');
		
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

			//Edit media and reveal content.
			$("#clickListTextHolder").prepend("<div id='conEdit' class='btn_edit_text' title='Edit click list reveals'></div>");

			$("#conEdit").click(function(){
				updateRevealDialog();
			}).tooltip();
		}
	}

	function updateRevealDialog(){
		try { $("#contentEditDialog").remove(); } catch (e) {}
		//Create the Content Edit Dialog
		var msg = "<div id='contentEditDialog' title='Update click list contents'>";
		msg += "<label id='clickalllabel'  title='Define whether users must select all items before advancing.'><b>Click all: </b></label>";
		msg += "<input id='isClickAll' type='checkbox' name='isClickAll' class='radio' value='true'/>&nbsp;&nbsp;";
		msg += "<label id='hover' title='Define whether users click or hover over the items.'><b>Hover: </b></label>";
		msg += "<input id='isHover' type='checkbox' name='hover' class='radio' value='true'/><br/><br/>";
		msg += "<div id='questionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Reveal Item Menu: </b></label></div><br/><br/>";
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
			},
			buttons: [
				{
					text: "Add",
					title: "Click to add a new reveal option.",
					click: function(){
						makeRevealDataStore();
						try { $("#revealContainer").remove(); } catch (e) {}
						addReveal(revealCount, true);
						updateRevealMenu();
					}
				},
				{
					text: "Done",
					title: "Click to close this dialog.",
					click: function(){
						makeRevealDataStore();
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
			var label = parseInt(h) + 1;
			var tmpID = "revealItem"+h;
			msg += "<div id='"+tmpID+"' class='questionBankItem";
			if(currentEditBankMember == h){
				msg += " selectedEditBankMember";
			}else{
				msg += " unselectedEditBankMember";
			}
			msg += "' style='";

			//size boxes depending upon number of characters.
			if(h < 100){
				msg += "width:30px;";
			}else if(h > 99){
				msg += "width:45px;";
			}
			var cleanText = $(data).find("page").eq(currentPage).find("reveal").eq(h).find("content").text().replace(/<\/?[^>]+(>|$)/g, "");//clean out html tags.....
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

		var newRevealContent = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
		var revealItemCDATA = newRevealContent.createCDATASection($("#revealTermText").val());
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).find("title").empty();
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).find("title").append(revealItemCDATA);
		var revealCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["revealContentText"].getData());
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).find("content").empty();
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).find("content").append(revealCDATA);
	}

	function addReveal(_addID, _isNew){
		var revealID = "reveal" + _addID;
		var revealLabel = parseInt(_addID) + 1;

		if(_isNew == true){
		    var tmpLabel = parseInt(_addID) + 1;
			$(data).find("page").eq(currentPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("New Term Item " + tmpLabel);
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("title").append(titleCDATA);
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Reveal Text " + tmpLabel + "</p>");
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("content").append(option1CDATA);
			currentEditBankMember = _addID;
			revealCount++;
		}

		var termString = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("title").text();

		var msg = "<div id='revealContainer' class='templateAddItem' value='"+_addID+"'>";
			msg += "<div id='revealRemove' class='removeMedia' value='"+_addID+"' title='Click to remove this reveal'/>";
			msg += "<b>Reveal "+revealLabel+":</b>";
			msg += "<label id='revealTerm' title='Input reveal term.'><br/><b>Term: </b></label>";
			msg += "<input id='revealTermText' class='dialogInput' type='text' value='"+termString+"' defaultValue='"+termString+"' style='width:40%;' />";

		var myRevealContent = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("content").text();
			msg += "<div title='Input reveal item definition.'><b>Content:</b></div>";
			msg += "<div id='revealContentText' class='dialogInput'>" + myRevealContent + "</div>";
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
			$(data).find("pages").eq(currentPage).find("reveal").eq(currentEditBankMember).remove();
			$("#revealContainer").remove();
			revealCount--;
			var extra = $(data).find("page").eq(currentPage).find("reveal").length;
			var active = revealCount;
			//var removed = extra - active;
			for(var i = extra + 1; i >= active; i--){
				$(data).find("page").eq(currentPage).find("reveal").eq(i).remove();
			}

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
        sendUpdate();
    };

	/**********************************************************************
	**Save Reveal Edit
	**********************************************************************/
	/**saveRevealEdit
	* Sends the updated content to node.
	*/
	function saveRevealEdit(){
		var extra = $(data).find("page").eq(currentPage).find("reveal").length;
		var active = revealCount;
		//var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("reveal").eq(i).remove();
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
}