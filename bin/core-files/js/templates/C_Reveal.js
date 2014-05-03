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
	    
    //Defines a public method - notice the difference between the private definition below.
	this.initialize = function(){
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
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
	    
    //Defines a public method - notice the difference between the private definition below.
	this.initialize = function(){
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		revealCount = $(data).find("page").eq(currentPage).find("reveal").length;
		myContent = $(data).find("page").eq(currentPage).find("content").first().text();
		mediaWidth = $(data).find("page").eq(currentPage).attr('w');		
		mediaHeight = $(data).find("page").eq(currentPage).attr('h');
		interact = $(data).find("page").eq(currentPage).attr('interact');
		pageTitle = new C_PageTitle();
		audioHolder = new C_AudioHolder();
		
		buildTemplate();
	}
	
	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		$("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div></div></div>');
		$("#scrollableContent").addClass("top");
		
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
			// WTF?  scrollableContent.position.top changes after contentHolder.height is set for the first time
			// So we do it twice to get the right value
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		
		if(isIE){
			$("#contentHolder").height($("#contentHolder").height() - 22);
		}
		
        $("#content").append(myContent);
		
		$("<div id='imgPalette' class='revealPalette'></div>").insertAfter("#content");
		
		for(var i = 0; i < revealCount; i++){
			var currentImg = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("img");
			var currentAlt = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("alt");
			var tmpContent = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("content").text();
			var tmpCaption = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("caption").text();
			
			var revID = "revID" + i;
			
			$("#imgPalette").append("<div id='"+ revID +"' class='revealImg' myContent='"+ tmpContent +"'><img src='media/"+currentImg+"' alt='"+ currentAlt +"' width='"+ mediaWidth +"' height='"+ mediaHeight +"'/></div>");
			
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
				});
			//INTERACTION FOR HOVER INTERACT	
			}else if(interact == "hover"){
				//REVEAL RIGHT HOVER
				$("#"+revID).hover(function(){
					$(this).unbind('mouseenter mouseleave');
					if(type == "revealRight" || "revealLeft"){
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
					}
				});
			}
		}	
		if(type == "revealBottom" || type == "revealTop"){
			$("#imgPalette").width(revealCount * ($("#revID0").width() + 30 ));
		}
		
		checkMode();
		if(transition == true){
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
		}				
	}
	
	
	var ieWidth = null;

	function showRevealText(currentSelected, currentShowText){
		//Add the text field and attach needed sizes and classes....
		//Divided up by page types.
		
		if(type == "revealRight"){
			var msg = "<div id='revealTextHolder' class='revealTextRight antiscroll-wrap' style='height: " + mediaHeight + "px; overflow: hidden;'>";
			msg += "<div id='"+currentSelected+"Text' class='revealText antiscroll-inner' style='max-height: " + mediaHeight + "px;'>" + currentShowText + "</div></div>";
			$("#" + currentSelected).append(msg);
			//BECAUSE IE FUCKING SUCKS!!!!
			if(isIE){
				if(ieWidth == null){
					ieWidth = $("#"+ currentSelected).width() - mediaWidth - 30;
				}
				$("#" + currentSelected + "Text").css({'width': ieWidth, 'max-width': ieWidth});
			}else{
				$("#" + currentSelected + "Text").css({'width': $("#"+ currentSelected).width() - mediaWidth - 10});
			}
		}else if(type == "revealBottom"){
			var tmpWidth = $("#" + currentSelected).width() - 10;
			var msg = "<div id='revealTextHolder' class='revealTextBottom antiscroll-wrap' style='width: " + tmpWidth + "px; overflow: hidden;'>";
			msg += "<div id='"+currentSelected+"Text' class='revealText antiscroll-inner' style='max-width: " + tmpWidth + "px;'>" + currentShowText + "</div></div>";
			$("#" + currentSelected).append(msg);
			$("#" + currentSelected + "Text").css({'height': $("#" + currentSelected).height() - mediaHeight - 10});
		}else if(type == "revealLeft"){
			var msg = "<div id='revealTextHolder' class='revealTextLeft antiscroll-wrap' style='height: " + mediaHeight + "px; overflow: hidden;'>";
			msg += "<div id='"+currentSelected+"Text' class='revealText antiscroll-inner' style='max-height: " + mediaHeight + "px;'>" + currentShowText + "</div></div>";
			$("#" + currentSelected).append(msg);
			//BECAUSE IE FUCKING SUCKS!!!!
			if(isIE){
				if(ieWidth == null){
					ieWidth = $("#"+ currentSelected).width() - mediaWidth - 30;
				}
				$("#" + currentSelected + "Text").css({'width': ieWidth, 'max-width': ieWidth});
			}else{
				$("#" + currentSelected + "Text").css({'width': $("#"+ currentSelected).width() - mediaWidth - 10});
			}
		}else if(type == "revealTop"){
			var msg = "<div id='revealTextHolder' class='revealTextTop antiscroll-wrap' style='width: " + mediaWidth + "px; overflow: hidden;'>";
			msg += "<div id='"+currentSelected+"Text' class='revealText antiscroll-inner' style='max-width: " + mediaWidth + "px;'>" + currentShowText + "</div></div>";
		}
		
		if(isIE){
			if(type == "revealRight" || type == "revealLeft"){
				$("#contentHolder").height($("#contentHolder").height() - 22);
			}else{
				$("#contentHolder").height($("#contentHolder").height() - 25);
				$("#contentHolder").width($("#contentHolder").width() - 17);
			}
		}

		TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
		$(this).scrubContent();
		$('.antiscroll-wrap').antiscroll();
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
		try { $("#contentEditDialog").remove(); } catch (e) {}
		//Create the Content Edit Dialog
		var msg = "<div id='contentEditDialog' title='Update Image Hotspots'>";
		//msg += "<label style='position: relative; float: left; vertical-align:middle; line-height:30px;'>page objective: </label>";
		//msg += "<input type='text' name='myName' id='inputObjective' value='"+ $(data).find('page').eq(currentPage).attr('objective') +"' class='dialogInput' style='width: 440px;'/><br/>";
		//msg += "<label style='position: relative; float: left; vertical-align:middle; line-height:30px;'>module or lesson mapped (highest level): </label>";
		//msg += "<input type='text' name='myName' id='inputObjItemId' value='"+ $(data).find('page').eq(currentPage).attr('objItemId') +"' class='dialogInput' style='width: 440px;'/><br/>";
		msg += "<label> <b>Reveal Image Width: </b></label>";
		msg += "<input id='imageWidth'  class='dialogInput' type='text' value='" + $(data).find("page").eq(currentPage).attr('w') + "' defaultValue='" + $(data).find("page").eq(currentPage).attr('w') + "' style='width:10%;'/>";
		msg += "<label> <b>Reveal Image Height: </b></label>";
		msg += "<input id='imageHeight'  class='dialogInput' type='text' value='" + $(data).find("page").eq(currentPage).attr('h') + "' defaultValue='" + $(data).find("page").eq(currentPage).attr('h') + "' style='width:10%;'/><br/>";
		msg += "<div id='revealTypeGroup'>";
		msg += "<label id='hover'><b>Hover: </b></label>";
		msg += "<input id='isHover' type='checkbox' name='hover' class='radio' value='true'/>";
		msg += "<label id='label'>           <b>Reveal Direction: </b></label>";
		msg += "<input id='revealRight' type='radio' name='manageRevealType' value='revealRight'>open right  </input>";
		msg += "<input id='revealLeft' type='radio' name='manageRevealType' value='revealLeft'>open left  </input>";
		msg += "<input id='revealBottom' type='radio' name='manageRevealType' value='revealBottom'>open down  </input>";
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
			height: 655,
			resizable: false,
			close: function(){
				$("#contentEditDialog").remove();
			},
			buttons: {
				Add: function(){
					try { $("#revealContainer").remove(); } catch (e) {}
					addReveal(revealCount, true);
					updateRevealMenu();
				},
				Done: function(){
					makeRevealDataStore();
					saveRevealEdit();
					$( this ).dialog( "close" );
				}
			}
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
			var cleanText = $(data).find("page").eq(currentPage).find("reveal").eq(h).find("content").text();//////////////////////Need to clean out html tags.....
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
					console.log("currentEditBankMember = " + currentEditBankMember);
					updateRevealDialog();
				}).tooltip();
			}
		}
	}
	
	function makeRevealDataStore(){
		//myObjective = $("#inputObjective").val();
		//myObjItemId = $("#inputObjItemId").val();
		
		//$(data).find("page").eq(currentPage).attr('objective', myObjective);
		//$(data).find("page").eq(currentPage).attr('objItemId', myObjItemId);
		
		$(data).find("page").eq(currentPage).attr('w', $("#imageWidth").val());
		$(data).find("page").eq(currentPage).attr('h', $("#imageHeight").val());
		
		if($("#isHover").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("interact", "hover");
			interact = "hover";
		}else{
			$(data).find("page").eq(currentPage).attr("interact", "click");
			interact = "click";
		}
		/*if($("#isMandatory").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("mandatory", "true");
			tmpObj.mandatory = true;
		}else{
			$(data).find("page").eq(currentPage).attr("mandatory", "false");
			tmpObj.mandatory = false;
		}*/
		
		/*if($("#isRandom").prop("checked") == true){
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr("randomize", "true");
		}else{
			$(data).find("page").eq(currentPage).find("bankitem").eq(currentEditBankMember).attr("randomize", "false");
		}*/
		
		var newRevealContent = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
		var revealCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["revealContentText"].getData());
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).find("content").empty();
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).find("content").append(revealCDATA);
		$(data).find("page").eq(currentPage).find("reveal").eq(currentEditBankMember).attr("img", $("#revealImageText").val());
	}
	
	function addReveal(_addID, _isNew){
		var revealID = "reveal" + _addID;
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
			msg += "<label id='revealImage'><br/><b>Image: </b></label>";
			msg += "<input id='revealImageText' class='dialogInput' type='text' value='"+mediaString+"' defaultValue='"+mediaString+"' style='width:40%;'/>";
					
		var myRevealContent = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("content").text();	
			msg += "<div><b>Content:</b></div>";
			msg += "<div id='revealContentText' class='dialogInput'>" + myRevealContent + "</div>";
			msg += "</div>";
		$("#contentEditDialog").append(msg);
					
		$("#revealRemove").click(function(){
			removeReveal();
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
			
		
	function removeReveal(){
		if(revealCount > 1){
			console.log("currentEditBankMember = " + currentEditBankMember);
			$(data).find("pages").eq(currentPage).find("reveal").eq(currentEditBankMember).remove();
			console.log($(data).find("page").eq(currentPage).find("reveal").length);
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
		$("#content").attr("tabindex", tabindex);
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
}