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
function C_ClickImage(_type) {
	var type = _type;
	// var pageTitle;
	// var audioHolder;
	
	var revealCount//number of tabs.
	var myContent;//Body

	var rev_arr = [];
	var revealEdit_arr = [];
	var editStartLength;
	var mediaWidth;
	var mediaHeight;
	var interact = "click";
	    
    //Defines a public method - notice the difference between the private definition below.
	this.initialize = function(){
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		revealCount = $(data).find("page").eq(currentPage).find("reveal").length;
		myContent = $(data).find("page").eq(currentPage).find("content").first().text();
		mediaWidth = $(data).find("page").eq(currentPage).attr('w');		
		mediaHeight = $(data).find("page").eq(currentPage).attr('h');
		
		buildTemplate();
	}
	
	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		pageTitle = new C_PageTitle();
		
		$("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div></div></div>');
		$("#scrollableContent").addClass("top");
		
		audioHolder = new C_AudioHolder();
		
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
			// WTF?  scrollableContent.position.top changes after contentHolder.height is set for the first time
			// So we do it twice to get the right value
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));

        $("#content").append(myContent);
		
		interact = $(data).find("page").eq(currentPage).attr("interact");
		
		$("<div id='imgPalette' class='imgPalette'></div>").insertAfter("#content");
		
		for(var i = 0; i < revealCount; i++){
			var currentImg = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("img");
			var currentAlt = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("alt");
			var tmpContent = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("content").text();
			var tmpCaption = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("caption").text();
			
			var revID = "revID" + i;
			
			$("#imgPalette").append("<div id='"+ revID +"' class='clickImg' myContent='"+ tmpContent +"'><img src='media/"+currentImg+"' alt='"+ currentAlt +"' width='"+ mediaWidth +"' height='"+ mediaHeight +"'/></div>");
			
			if(interact == "click"){
				$("#" + revID).click(function(){
					try { $(currentItem).removeClass("clickImgSelected"); } catch (e) {}
					currentItem = $(this);
					try { $(currentItem).addClass("clickImgSelected"); } catch (e) {}
					$("#clickImgText").html($(this).attr("myContent"));
					$('.antiscroll-wrap').antiscroll();
				});
			}else if(interact == "hover"){
				$("#" + revID).hover(function(){
					try { $(currentItem).removeClass("clickImgSelected"); } catch (e) {}
					currentItem = $(this);
					try { $(currentItem).addClass("clickImgSelected"); } catch (e) {}
					$("#clickImgText").html($(this).attr("myContent"));
					$('.antiscroll-wrap').antiscroll();
				});
			}
		}	

		var heightSpacer = $("#"+revID).height() + parseInt($("#"+revID).css('margin-top')) + parseInt($("#"+revID).css('margin-bottom'));
		var totalWidth = revealCount * ($("#" + revID).width() + parseInt($("#"+revID).css('margin-right')) + parseInt($("#"+revID).css('margin-left')) + 10);
		var maxWidth = parseInt($("#imgPalette").css('max-width'));
		var rows = 1;
		if(totalWidth > maxWidth){
			rows = Math.ceil(totalWidth/maxWidth);
		}
		
		$("#imgPalette").width(totalWidth);
		$("#imgPalette").height(heightSpacer * rows);
		
		$("<div class='clickImgTextHolder antiscroll-wrap'><div id='clickImgText' class='clickImgText antiscroll-inner'></div></div>").insertAfter("#imgPalette");
		//$("#clickImgTextHolder").width(parseInt($("#imgPalette").css('max-width')));				
		checkMode();
		if(transition == true){
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
		}
		
		$("#revID0").click();						
	}
	
	var currentItem;
	
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
				revealEdit_arr.length = 0;
				
				//Create the Content Edit Dialog
				var msg = "<div id='contentEditDialog' title='Update Image Hotspots'>";
				msg += "<label id='hover'>Hover: </label>";
				msg += "<input id='isHover' type='checkbox' name='hover' class='radio' value='true'/><br/>";
				msg += "<label> <b>Reveal Image Width: </b></label>";
				msg += "<input id='imageWidth'  class='dialogInput' type='text' value='" + mediaWidth + "' defaultValue='" + mediaWidth + "' style='width:10%;'/>";
				msg += "<label> <b>Reveal Image Height: </b></label>";
				msg += "<input id='imageHeight'  class='dialogInput' type='text' value='" + mediaHeight + "' defaultValue='" + mediaHeight + "' style='width:10%;'/>";
				msg += "</div><br/>";
				$("#stage").append(msg);
				
				if(interact == "hover"){
					$("#isHover").attr("checked", "checked");
				}
				
				revealEdit_arr.length = 0;
				
				for(var i = 0; i < revealCount; i++){
					addReveal(i, false);
				}
				
				$("#contentEditDialog").dialog({ 	
					modal: true,
					width: 875,
					height: 750,
					resizable: false,
					close: function(){
						$("#contentEditDialog").remove();
					},
					buttons: {
						Cancel: function(){
							$(this).dialog('close');
						},
						Add: function(){
							addReveal(revealEdit_arr.length, true);
						},
						Save: function(){
							if($("#isHover").prop("checked") == true){
								$(data).find("page").eq(currentPage).attr('interact', "hover");
								interact = "hover";
							}else{
								$(data).find("page").eq(currentPage).attr('interact', "click");
								interact = "click";
							}
							
							$(data).find("page").eq(currentPage).attr('w', $("#imageWidth").val());
							$(data).find("page").eq(currentPage).attr('h', $("#imageHeight").val());
							
							var tmpArray = new Array();
							for(var i = 0; i < revealEdit_arr.length; i++){
								var tmpObj = new Object();
								tmpObj.title = $("#" + revealEdit_arr[i] +"TitleText").val();
								tmpObj.img = $("#"+revealEdit_arr[i]+"ImageText").val();
								console.log(tmpObj.img);
								var myRevealText = revealEdit_arr[i]+"ContentText";
								tmpObj.content = CKEDITOR.instances[myRevealText].getData();
								tmpArray.push(tmpObj);
							}
							
							saveRevealEdit(tmpArray);
							$( this ).dialog( "close" );
						}
					}
				});
			}).tooltip();
		}
	}
	
	function addReveal(_addID, _isNew){
		var revealID = "reveal" + _addID;
		var revealLabel = _addID + 1;
		
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
			
		}
		
		var mediaString = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).attr("img");
		
		var msg = "<div id='"+revealID+"Container' class='templateAddItem' value='"+_addID+"'>";
			msg += "<div id='"+revealID+"Remove' class='removeMedia' value='"+_addID+"' title='Click to remove this reveal'/>";
			msg += "<b>Reveal "+revealLabel+":</b>";
			msg += "<label id='"+revealID+"Image'><br/><b>Image: </b></label>";
			msg += "<input id='"+revealID+"ImageText' class='dialogInput' type='text' value='"+mediaString+"' defaultValue='"+mediaString+"' style='width:40%;'/>";
					
		var myRevealContent = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("content").text();	
			msg += "<div><b>Content:</b></div>";
			msg += "<div id='"+revealID+"ContentText' class='dialogInput'>" + myRevealContent + "</div>";
			msg += "</div>";
		$("#contentEditDialog").append(msg);
					
		$("#" +revealID+"Remove").click(function(){
			removeReveal($(this).attr("value"));
		});
					
		CKEDITOR.replace( revealID+"ContentText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
			allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
		});
						
		revealEdit_arr.push(revealID);
	}
			
		
	function removeReveal(_id){
		for(var i = 0; i < revealEdit_arr.length; i++){
			if(_id == $("#"+revealEdit_arr[i]+"Container").attr("value")){
				var arrIndex = i;
				break;
			}
		}
		$(data).find("pages").eq(currentPage).find("reveal").eq(arrIndex).remove();
		revealEdit_arr.splice(arrIndex, 1);
		$("#reveal" + _id +"Container").remove();
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
	function saveRevealEdit(_data){
		for(var i = 0; i < revealEdit_arr.length; i++){
			var revealText = _data[i].content;
			var newRevealContent = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA = newRevealContent.createCDATASection(revealText);
			$(data).find("page").eq(currentPage).find("reveal").eq(i).find("content").empty();
			$(data).find("page").eq(currentPage).find("reveal").eq(i).find("content").append(revealCDATA);
			$(data).find("page").eq(currentPage).find("reveal").eq(i).attr("img", _data[i].img);
		}
		
		//If the list is now shorter than before remove any extras from the xml...
		var extra = $(data).find("page").eq(currentPage).find("reveal").length;
		var active = revealEdit_arr.length;
		var removed = extra - active;
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
		
	this.fadeComplete = function(){
		fadeComplete();
	}
    // fadeComplete() moved to C_UtilFunctions.js
}