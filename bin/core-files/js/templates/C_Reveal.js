/*!
 * C_Reveal
 * This class creates a template for placing clickable images - reaveals text.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2013-03-04
 *
 * Copyright (c) 2013, CTC. All rights reserved.
 *
 * @author: Philip Double, doublep@ctc.com
 */
function C_Reveal(_type) {
	var type = _type;
	var revealCount//number of reveals.
	var myContent;//Body Text
	var mediaWidth;//Width of image being loaded
	var mediaHeight;//Height of image being loaded
	var interact = "click"; //How users interact with the images
	var currentEditBankMember = 0; //Edit mode setting
	var revealMenu_arr = []; //Array of reveals
	var currentItem;
	var myObjective = "undefined";
    var myObjItemId = "undefined";

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
		pageTitle = new C_PageTitle();
		audioHolder = new C_AudioHolder();

		buildTemplate();
	}

	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		//resize images for mobile phone
		if(isMobilePhone){
			mediaWidth = mediaWidth * 0.6;
			mediaHeight = mediaHeight * 0.6;
		}

		$("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div class="box"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div></div></div></div>');
		$("#scrollableContent").addClass("top");

		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
			// WTF?  scrollableContent.position.top changes after contentHolder.height is set for the first time
			// So we do it twice to get the right value
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));

        $("#content").append(myContent);

        //$("#content").attr("aria-label", $("#content").text().replace(/'/g, ""));
        //pageAccess_arr.push($("#content"));

		$("<div id='imgPalette' class='revealPalette'></div>").insertAfter("#content");

		for(var i = 0; i < revealCount; i++){
			var currentImg = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("img");
			var currentAlt = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("alt");
			var tmpContent = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("content").text();
			var tmpCaption = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("caption").text();

			var revID = "revID" + i;
			var cont = tmpContent;
			var ariaText = tmpContent.replace(/\'/g, "").replace(/\"/g, "");
			$("#imgPalette").append("<div id='"+ revID +"' class='revealImg' myContent='"+ tmpContent +"' aria-label='Image description: "+currentAlt+" Click to learn more.'><img src='media/"+currentImg+"' alt='"+ currentAlt +" Click to learn more.' width='"+ mediaWidth +"' height='"+ mediaHeight +"'/></div>");

			if(type == "revealRight"){
				$("#"+revID).addClass("revealRight");
				$("#imgPalette").addClass("revealPaletteLandscape");
			}else if(type == "revealBottom"){
				$("#"+revID).addClass("revealBottom");
				$("#imgPalette").addClass("revealPalettePortrait");
			}else if(type == "revealLeft"){
				$("#"+revID).addClass("revealLeft");
				$("#imgPalette").addClass("revealPaletteLandscape");
			}else if(type == "revealTop"){
				$("#"+revID).addClass("revealTop");
				$("#imgPalette").addClass("revealPalettePortrait");
			}

			$("#"+revID).data("myText", tmpContent);
			$("#"+revID).data("myWidth", $("#"+revID).width());
			$("#"+revID).data("myHeight", $("#"+revID).height());

			if(interact == "click"){
				//HOVER FUNCITONALITY FOR CLICK INTERACT
				$("#"+revID).hover(function(){
					if(type == "revealRight"){
						TweenMax.to($(this), transitionLength, {css:{width:$(this).width() + 20}, ease:transitionType});
					}else if(type == "revealBottom"){
						TweenMax.to($(this), transitionLength, {css:{height:$(this).height() + 20}, ease:transitionType});
					}else if (type == "revealTop"){
						TweenMax.to($(this), transitionLength, {css:{height:$(this).height() + 20, top: $(this).position().bottom + 20}, ease:transitionType});
					}else if (type == "revealLeft"){
						TweenMax.to($(this), transitionLength, {css:{width:$(this).width() + 20}, ease:transitionType});
					}
				},function(){
					if(type == "revealRight"){
						TweenMax.to($(this), transitionLength, {css:{width:$(this).data("myWidth")}, ease:transitionType});
					}else if(type == "revealBottom"){
						TweenMax.to($(this), transitionLength, {css:{height:$(this).data("myHeight")}, ease:transitionType});
					}else if (type == "revealTop"){
						TweenMax.to($(this), transitionLength, {css:{height:$(this).data("myHeight"), bottom: $(this).data("myTop")}, ease:transitionType});
					}else if (type == "revealLeft"){
						TweenMax.to($(this), transitionLength, {css:{width:$(this).data("myWidth")}, ease:transitionType});
					}
				//CLICK FUNCTIONALITY FOR CLICK INTERACT ----- ANIMATE THE OPENING
				}).click(function(){
					$(this).unbind('mouseenter mouseleave click');
					//REVEAL RIGHT CLICK
					if(type == "revealRight" || type == "revealLeft"){
						TweenMax.to(
							$(this),
							transitionLength,
							{css:{width:"95%"},
							ease:transitionType,
							onComplete: showRevealText,
							onCompleteParams:[
								$(this).attr("id"),
								$(this).data("myText")
							]
						});
					}else if (type == "revealBottom" || "revealTop"){
						TweenMax.to(
							$(this),
							transitionLength,
							{css:{height:$("#stage").height() - $("#contentHolder").position().top - $("#imgPalette").position().top - 100},
							ease:transitionType,
							onComplete: showRevealText,
							onCompleteParams:[
								$(this).attr("id"),
								$(this).data("myText")
							]
						});
					}
				}).keypress(function(event) {
			        var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
			        if (chCode == 32 || chCode == 13){
				        $(this).click();
				    }
		        });
			//INTERACTION FOR HOVER INTERACT
			}else if(interact == "hover"){
				//REVEAL RIGHT HOVER
				$("#"+revID).hover(function(){
					$(this).unbind('mouseenter mouseleave');
					if(type == "revealRight" || type == "revealLeft"){
						TweenMax.to(
							$(this),
							transitionLength,
							{css:{width:"95%"},
							ease:transitionType,
							onComplete: showRevealText,
							onCompleteParams:[
								$(this).attr("id"),
								$(this).data("myText")
							]
						});
					}else if (type == "revealBottom" || "revealTop"){
						TweenMax.to(
							$(this),
							transitionLength,
							{css:{height:$("#stage").height() - $("#contentHolder").position().top - $("#imgPalette").position().top - 100},
							ease:transitionType,
							onComplete: showRevealText,
							onCompleteParams:[
								$(this).attr("id"),
								$(this).data("myText")
							]
						});
					}
				});
			}

			pageAccess_arr.push($("#" + revID));
		}
		if(type == "revealBottom" || type == "revealTop"){
			$("#imgPalette").width(revealCount * ($("#revID0").width() + 30 ));
		}

		checkMode();
		if(transition == true){
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
		}

		doAccess(pageAccess_arr);
	}


	var ieWidth = null;
	var ieHeight = null;

	function showRevealText(currentSelected, currentShowText){
		//Add the text field and attach needed sizes and classes....
		//Divided up by page types.

		if(type == "revealRight"){
			var msg = "<div id='revealTextHolder' class='revealTextRight antiscroll-wrap' style='height: " + mediaHeight + "px; overflow: hidden;'>";
			msg += "<div class='box'>";
			msg += "<div id='"+currentSelected+"Text' class='revealText antiscroll-inner' style='max-height: " + mediaHeight + "px;'>" + currentShowText + "</div></div></div>";
			$("#" + currentSelected).append(msg);
			var textWidth = $("#"+ currentSelected).width() - mediaWidth - 20;
			if(isIE || isFF){
				textWidth -= 20;
			}
			$(".revealText").css({'width': textWidth});

		}else if(type == "revealBottom"){
			var tmpWidth = $("#" + currentSelected).width() - 10;
			var msg = "<div id='revealTextHolder' class='revealTextBottom antiscroll-wrap' style='width: " + tmpWidth + "px; overflow: hidden;'>";
			msg += "<div class='box'>";
			msg += "<div id='"+currentSelected+"Text' class='revealText antiscroll-inner' style='max-width: " + tmpWidth + "px;'>" + currentShowText + "</div></div></div>";
			$("#" + currentSelected).append(msg);
			// set height of opened reveal
			$("#" + currentSelected + "Text").css({'height': $("#" + currentSelected).height() - mediaHeight - 10, 'padding-right': 30});

		}else if(type == "revealLeft"){
			var msg = "<div id='revealTextHolder' class='revealTextLeft antiscroll-wrap' style='height: " + mediaHeight + "px; overflow: hidden;'>";
			msg += "<div class='box'>";
			msg += "<div id='"+currentSelected+"Text' class='revealText antiscroll-inner' style='max-height: " + mediaHeight + "px;'>" + currentShowText + "</div></div></div>";
			$("#" + currentSelected).append(msg);
			var textWidth = $("#"+ currentSelected).width() - mediaWidth - 10;
			if(isIE || isFF){
				textWidth -= 30;
			}
			$(".revealText").css({'width': textWidth});

		}else if(type == "revealTop"){
			var msg = "<div id='revealTextHolder' class='revealTextTop antiscroll-wrap' style='width: " + mediaWidth + "px; overflow: hidden;'>";
			msg += "<div class='box'>";
			msg += "<div id='"+currentSelected+"Text' class='revealText antiscroll-inner' style='max-width: " + mediaWidth + "px;'>" + currentShowText + "</div></div></div>";
		}

		TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
		$(this).scrubContent();

		if(isIE){
			$("#contentHolder").width($("#contentHolder").width() - 17);
		}
		if(isFF){
			$("#contentHolder").width($("#contentHolder").width() - 15);
		}

		$('.antiscroll-wrap').antiscroll();
		$("#" + currentSelected + "Text").focus();
	}

	/*****************************************************************************************************************************************************************************************************************
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	PAGE EDIT FUNCTIONALITY
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	function checkMode(){
		$(this).scrubContent();
		$('.antiscroll-wrap').antiscroll();

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
		clearCKInstances();
		try { $("#contentEditDialog").remove(); } catch (e) {}
		//Create the Content Edit Dialog
		var msg = "<div id='contentEditDialog' title='Update Image Hotspots'>";
		//msg += "<label style='position: relative; float: left; vertical-align:middle; line-height:30px;'>page objective: </label>";
		//msg += "<input type='text' name='myName' id='inputObjective' value='"+ $(data).find('page').eq(currentPage).attr('objective') +"' class='dialogInput' style='width: 440px;'/><br/>";
		//msg += "<label style='position: relative; float: left; vertical-align:middle; line-height:30px;'>module or lesson mapped (highest level): </label>";
		//msg += "<input type='text' name='myName' id='inputObjItemId' value='"+ $(data).find('page').eq(currentPage).attr('objItemId') +"' class='dialogInput' style='width: 440px;'/><br/>";
		msg += "<label title='Set width for images.'> <b>Reveal Image Width: </b></label>";
		msg += "<input id='imageWidth'  class='dialogInput' type='text' value='" + $(data).find("page").eq(currentPage).attr('w') + "' defaultValue='" + $(data).find("page").eq(currentPage).attr('w') + "' style='width:10%;'/>";
		msg += "<label title='Set height for images.'> <b>Reveal Image Height: </b></label>";
		msg += "<input id='imageHeight'  class='dialogInput' type='text' value='" + $(data).find("page").eq(currentPage).attr('h') + "' defaultValue='" + $(data).find("page").eq(currentPage).attr('h') + "' style='width:10%;'/><br/>";
		msg += "<div id='revealTypeGroup'>";
		msg += "<label id='hover' title='Set whether users click or hover to reveal.'><b>Hover: </b></label>";
		msg += "<input id='isHover' type='checkbox' name='hover' class='radio' value='true' />";
		msg += "<label id='label'>           <b>Reveal Direction: </b></label>";
		msg += "<input id='revealRight' type='radio' name='manageRevealType' value='revealRight'><span title='Set reveals to open from left to right.'>open right</span>  </input>";
		msg += "<input id='revealLeft' type='radio' name='manageRevealType' value='revealLeft'><span  title='Set reveals to open from right to left.'>open left</span>  </input>";
		msg += "<input id='revealBottom' type='radio' name='manageRevealType' value='revealBottom'><span title='Set reveals to open from top to bottom.'>open down</span>  </input>";
		msg += "</div><br/>"
		msg += "<div id='questionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Reveal Item Menu: </b></label></div><br/><br/>";
		$("#stage").append(msg);

		$('#' + type).prop('checked', true);

		//Switch to show the correct layout
		$("#revealTypeGroup").change(function(){
			type = $('input[name=manageRevealType]:checked', '#revealTypeGroup').val();
			$(data).find("page").eq(currentPage).attr('layout', type);
		});
		updateRevealMenu();

		if(interact == "hover"){
			$("#isHover").attr("checked", "checked");
		}

		addReveal(currentEditBankMember, false);

		$("#contentEditDialog").dialog({
			modal: true,
			width: 875,
			height: 675,
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
					title: "Add a new option.",
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
					$("#contentEditDialog").remove();
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

		var newRevealContent = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
		var revealCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["revealContentText"].getData());
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).find("content").empty();
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).find("content").append(revealCDATA);
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).attr("img", $("#revealImageText").val());
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).attr("alt", $("#revealAltText").val());
	}

	function addReveal(_addID, _isNew){
		var revealLabel = parseInt(_addID) + 1;

		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Image Reveal Text</p>");
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("content").append(option1CDATA);
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).append($("<caption>"));
			var diffFeed1 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Caption Input");
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("caption").append(difFeed1CDATA);
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).attr("img", "defaultReveal.png");
			$(data).find("page").eq(currentPage).find("reveal").eq(_addID).attr("alt", "Default alt text");

			currentEditBankMember = _addID;
			revealCount++;
		}

		var mediaString = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).attr("img");

		var msg = "<div id='revealContainer' class='templateAddItem' value='"+_addID+"'>";
			msg += "<div id='revealRemove' class='removeMedia' value='"+_addID+"' title='Click to remove this reveal'/>";
			msg += "<b>Reveal "+revealLabel+":</b>";
			msg += "<label id='revealImage' title='Input the image name.'><br/><b>Image: </b></label>";
			msg += "<input id='revealImageText' class='dialogInput' type='text' value='"+mediaString+"' defaultValue='"+mediaString+"' style='width:40%;'/><br/>";
		var myAlt = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).attr("alt");
			msg += "<label id='label' title='Input a description of the image.'><b>ALT text:</b> </label>";
			msg += "<input id='revealAltText' class='dialogInput' type='text' value='"+myAlt+"' defaultValue='"+myAlt+"' style='width:70%'/>";
		var myRevealContent = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("content").text();
			msg += "<div title='Update the reveal content.'><b>Content:</b></div>";
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

	function clearCKInstances(){
		/*if (CKEDITOR.instances['revealContentText']) {
            CKEDITOR.instances.revealContentText.destroy();
        }*/
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
			$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).remove();
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
	   		TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:transitionType, onComplete:fadeComplete});
	   	}else{
		   	fadeComplete();
	   	}
    }
}