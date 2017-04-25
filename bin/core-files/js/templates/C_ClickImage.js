/*!
 * C_ClickImage
 * This class creates a template for placing clickable images - reaveals text in set box.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2014-09-01
 *
 * Copyright (c) 2014, CTC. All rights reserved.
 *
 * @author: Philip Double, doublep@ctc.com
 */
function C_ClickImage(_type) {
	var type = _type;
	var revealCount//number of tabs.
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
	var useKeyboard = false;
	var labeled = false;
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
		mediaWidth = $(data).find("page").eq(currentPage).attr('w');
		mediaHeight = $(data).find("page").eq(currentPage).attr('h');
		interact = $(data).find("page").eq(currentPage).attr("interact");
		if($(data).find("page").eq(currentPage).attr('objective')){
			myObjective = $(data).find("page").eq(currentPage).attr('objective');
		}

		if($(data).find("page").eq(currentPage).attr('objItemId')){
			myObjItemId = $(data).find("page").eq(currentPage).attr('objItemId');
		}

		if($(data).find("page").eq(currentPage).attr('labeled') == "true"){
			labeled = true;
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

	/*****************************************************************************************************************************************************************************************************************
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Build Template
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	//Defines a private method - notice the difference between the public definitions above.
	function buildTemplate() {
		$("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div class="box"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div></div></div></div>');
		$("#scrollableContent").addClass("top");
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
			// WTF?  scrollableContent.position.top changes after contentHolder.height is set for the first time
			// So we do it twice to get the right value
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));

		if(isMobilePhone){
			$("#contentHolder").prepend(myContent);
		}else{
			$("#content").append(myContent);
		}

		$("<div id='imgPalette' class='imgPalette'></div>").insertAfter("#content");

		for(var i = 0; i < revealCount; i++){
			var currentImg = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("img");
			var currentAlt = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("alt");
			var tmpContent = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("content").text();
			var tmpCaption = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("caption").text();

			var revID = "revID" + i;

			var ariaText = tmpContent.replace(/\'/g, "").replace(/\"/g, "");

			var msg = "<div id='"+ revID +"' class='clickImg' aria-label='"+currentAlt+"' role='button' myContent='"+ tmpContent +"' beenClicked='false'>";
				msg += "<img src='media/"+currentImg+"' alt='"+ currentAlt +"' width='"+ mediaWidth +"' height='"+ mediaHeight +"'/>";
				if(labeled){
					msg += "<div id='mediaLabel' class='mediaLabel'>"+$(data).find("page").eq(currentPage).find("reveal").eq(i).attr("label")+"</div>";
				}
				msg += "</div";

			$("#imgPalette").append(msg);

			if(labeled){
				$(".mediaLabel").css("width", mediaWidth);
			}

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
				        useKeyboard = true;
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

			pageAccess_arr.push($("#" + revID));
		}

		//Figure out columns and rows if not enough space to fit all images...
		//Need to find an exact width so that it centers properly...
		//This ugliness allows designers not to have to have exactly divisible width to media width and padding to center properly...
		$("#"+revID + " > img").on("load", function() { // wait for the image to load before grabbing sizes
			var heightSpacer = $("#"+revID).height() + parseInt($("#"+revID).css('margin-top')) + parseInt($("#"+revID).css('margin-bottom'));
			var totalWidth = revealCount * ($("#" + revID).width() + parseInt($("#"+revID).css('margin-right')) + parseInt($("#"+revID).css('margin-left')) + 10);
			var maxWidth = parseInt($("#imgPalette").css('max-width'));
			var rows = 1;

			if(totalWidth > maxWidth){
				rows = Math.ceil(totalWidth/maxWidth);
			}

			if(rows > 1){
				var itemsPerRow = 0;
				var itemSpace = ($("#" + revID).width() + parseInt($("#"+revID).css('margin-right')) + parseInt($("#"+revID).css('margin-left')) + 10);
				for(var j = 0; j < revealCount; j++){
					if(j * itemSpace <= maxWidth){
						itemsPerRow = j;
					}else{
						break;
					}
				}
				var rowWidth = itemsPerRow * itemSpace;
				$("#imgPalette").width(rowWidth);
			}else{
				$("#imgPalette").width(totalWidth);
			}

			$("#imgPalette").height(heightSpacer * rows);
		});

		//Insert the Text Display area.
		$("<div class='clickImgTextHolder'><div id='clickImgText' class='clickImgText' tabindex=-1></div></div><br/><br/>").insertAfter("#imgPalette");
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

		if(interact == "hover"){
			$("#revID0").mouseover();
		}else{
			$("#revID0").click();
		}
		doAccess(pageAccess_arr);
	}

	//Holders to set a static size for IE...
	var ieWidth = null;
	var ieHeight = null;

	function updateRevealContent(_myItem){
		try { $(currentItem).removeClass("clickImgSelected"); } catch (e) {}
		currentItem = _myItem;
		try { $(currentItem).addClass("clickImgSelected"); } catch (e) {}
		$("#clickImgText").empty();

		$("#clickImgText").append(_myItem.attr("myContent"));

		if(isFirst){
			isFirst = false;
		}else{
			if(useKeyboard){
				$("#clickImgText").focus();
				useKeyboard = false;
			}
		}
        scrollTimer = setInterval(function () {scrollRefresh()}, 500);
	}

    function scrollRefresh(){
        window.clearInterval(scrollTimer);
		scroller.refresh();
    }
	/*****************************************************************************************************************************************************************************************************************
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	PAGE EDIT FUNCTIONALITY
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	function checkMode(){
		$(this).scrubContent();
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

			//Edit media and reveal content.
			$("#imgPalette").prepend("<div id='conEdit' class='btn_edit_text' title='Edit Image Hotspots'></div>");

			$("#conEdit").click(function(){
				updateRevealDialog();
			}).tooltip();
		}
	}

	function updateRevealDialog(){
		try { $("#contentEditDialog").remove(); } catch (e) {}
		//Create the Content Edit Dialog
		var imageWidth = $(data).find("page").eq(currentPage).attr('w');
		var imageHeight = $(data).find("page").eq(currentPage).attr('h');

		var msg = "<div id='contentEditDialog' title='Update Image Hotspots'>";
		msg += "<label id='hover' title='Define whether users click or hover over images.'><b>Hover: </b></label>";
		msg += "<input id='isHover' type='checkbox' name='hover' class='radio' value='true'/>&nbsp;&nbsp;";
		msg += "<label id='clickalllabel'  title='Define whether users must select all items before advancing.'><b>Click all: </b></label>";
		msg += "<input id='isClickAll' type='checkbox' name='isClickAll' class='radio' value='true'/>&nbsp;&nbsp;";
		msg += "<label id='label'  title='Indicates if text labels should appear over the images.'><b>Labeled: </b></label>";
		msg += "<input id='isLabeled' type='checkbox' name='random' class='radio' value='true'/>&nbsp;&nbsp;";
		msg += "<br/><label title='Input width of images to be used.'> <b>Image Width: </b></label>";
		msg += "<input id='imageWidth'  class='dialogInput' type='text' value='" + imageWidth + "' defaultValue='" + imageWidth + "' style='width:10%;'/>";
		msg += '<span id="imageWidthError" class="error">The value must be a numeric value</span><br/>';
		msg += "<label title='Input height of images to be used.'> <b>Image Height: </b></label>";
		msg += "<input id='imageHeight'  class='dialogInput' type='text' value='" + imageHeight + "' defaultValue='" + imageHeight + "' style='width:10%;'/>  ";
		msg += '<span id="imageHeightError" class="error">The value must be a numeric value</span><br/>';


		msg += "<div id='questionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Item Menu: </b></label></div><br/><br/>";
		$("#stage").append(msg);

		updateRevealMenu();

		if(interact == "hover"){
			$("#isHover").attr("checked", "checked");
		}
		
		if(clickAll){
			$("#isClickAll").attr("checked", "checked");
		}

		if(labeled){
			$("#isLabeled").attr("checked", "checked");
		}

		$("#isLabeled").change(function(){
			makeRevealDataStore();
			//clearCKInstances();
			try { $("#revealContainer").remove(); } catch (e) {}
			addReveal(currentEditBankMember, false);
		});

		//#3230
		$('#imageWidth').on('change', function(){
			if(!$.isNumeric($('#imageWidth').val())){
				$('#imageWidthError').removeClass('error').addClass('error_show');
				$('#imageWidth').val(imageWidth);
			}
			else{
				if($('#imageWidthError').hasClass('error_show')){
					$('#imageWidthError').removeClass('error_show').addClass('error');
				}
			}
		});

		//#3230
		$('#imageHeight').on('change', function(){
			if(!$.isNumeric($('#imageHeight').val())){
				$('#imageHeightError').removeClass('error').addClass('error_show');
				$('#imageHeight').val(imageHeight);
			}
			else{
				if($('#imageHeightError').hasClass('error_show')){
					$('#imageHeightError').removeClass('error_show').addClass('error');
				}
			}
		});

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
					title: "Add a new clickable image.",
					click: function(){
						makeRevealDataStore();
						try { $("#revealContainer").remove(); } catch (e) {}
						addReveal(revealCount, true);
						updateRevealMenu();
					}
				},
				{
					text: "Done",
					title: "Saves and closes the edit dialog.",
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
			var cleanText = $(data).find("page").eq(currentPage).find("reveal").eq(h).find("content").text().replace(/<\/?[^>]+(>|$)/g, "");//////////////////////Need to clean out html tags.....
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
		$(data).find("page").eq(currentPage).attr('w', $("#imageWidth").val());
		$(data).find("page").eq(currentPage).attr('h', $("#imageHeight").val());

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

		if($("#isLabeled").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("labeled", "true");
			labeled = true;
		}else{
			$(data).find("page").eq(currentPage).attr("labeled", "false");
			labeled = false;
		}

		var newRevealContent = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
		var revealCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["revealContentText"].getData());
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).find("content").empty();
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).find("content").append(revealCDATA);
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).attr("img", $("#revealImageText").val());
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).attr("alt", $("#revealAltText").val());
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).attr("label", $("#revealLabelText").val());
	}

	function addReveal(_addID, _isNew){
		var revealID = "reveal" + _addID;
		var revealLabel = parseInt(_addID) + 1;

		if(_isNew == true){
		    var tmpLabel = parseInt(_addID) + 1;
			$(data).find("page").eq(currentPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Image ClickImage Text " + tmpLabel + "</p>");
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("content").append(option1CDATA);
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).append($("<caption>"));
			var diffFeed1 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Caption Input");
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("caption").append(difFeed1CDATA);
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).attr("img", "defaultReveal.png");
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).attr("alt", "Default alt text");
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).attr("label", "Label text");

			currentEditBankMember = _addID;
			revealCount++;
		}

		var mediaString = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).attr("img");

		var msg = "<div id='revealContainer' class='templateAddItem' value='"+_addID+"'>";
			msg += "<div id='revealRemove' class='removeMedia' value='"+_addID+"' title='Click to remove this reveal'/>";
			msg += "<b>ClickImage "+revealLabel+":</b>";
			msg += "<label id='revealImage' title='Input your image name.'><br/><b>Image: </b></label>";
			msg += "<input id='revealImageText' class='dialogInput' type='text' value='"+mediaString+"' defaultValue='"+mediaString+"' style='width:40%;'/>";
			msg += "<button id='dialogMediaBrowseButton'>browse</button><br/>";
			if(labeled){
				var myLabel = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).attr("label");
				msg += "<label id='revealLabel' title='Input the label text.'><br/><b>Label: </b></label>";
				msg += "<input id='revealLabelText' class='dialogInput' type='text' value='"+myLabel+"' defaultValue='"+myLabel+"' style='width:20%;'/>";
			}
			msg += "<br/>"
		var myAlt = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).attr("alt");
			msg += "<label id='label' title='Input descriptive text for your image.'><b>ALT text:</b> </label>";
			msg += "<input id='revealAltText' class='dialogInput' type='text' value='"+myAlt+"' defaultValue='"+myAlt+"' style='width:70%'/>";
		var myRevealContent = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("content").text();
			msg += "<div title='Input text to be revealed when image clicked.'><b>Content:</b></div>";
			msg += "<div id='revealContentText' class='dialogInput' >" + myRevealContent + "</div>";
			msg += "</div>";
		$("#contentEditDialog").append(msg);

		$("#revealRemove").click(function(){
			areYouSure();
		});

		$("#dialogMediaBrowseButton").click(function(){
			$(".ui-dialog").hide();
			$(".ui-widget-overlay").hide();
			dialogToggleMediaBrowser($("#revealImageText"));
		});

		CKEDITOR.replace( "revealContentText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
			/*on: {
            	instanceReady: function(event){
                	$(event.editor.element.$).attr("title", "Click here to edit the question.");
                }
            },*/
			allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
		});
	}

	/**********************************************************************
    ** areYouSure? - Make sure that the user wants to remove before removing
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
