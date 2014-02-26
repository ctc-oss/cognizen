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
	var pageTitle;
	var audioHolder;
	
	var revealCount//number of tabs.
	var myContent;//Body

	var rev_arr = [];
	var revealEdit_arr = [];
	var editStartLength;
	    
    //Defines a public method - notice the difference between the private definition below.
	this.initialize = function(){
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		revealCount = $(data).find("page").eq(currentPage).find("reveal").length;
		myContent = $(data).find("page").eq(currentPage).find("content").text();		

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

        $("#content").append($(data).find("page").eq(currentPage).find("content").text());

		var myTop = $("#content").height();
		
		var interact = $(data).find("page").eq(currentPage).attr("interact");
		var horPos = 0;		
			
		for(var i = 0; i < revealCount; i++){
			var currentImg = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("imgStyle");
			var currentAlt = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("alt");
			var currentStyle = $(data).find("page").eq(currentPage).find("reveal").eq(i).attr("style");
			var myContent = $(data).find("page").eq(currentPage).find("reveal").eq(i).text();
	
			//if mobile revealBottom type and revealTop type will be handled as revealRight for UI reasons
			if(windowWidth <= mobileWidth){
				if(type == "revealBottom" || type == "revealTop"){
					type = "revealRight";
				}  
				currentStyle = "width:160px; height:160px;"
			}			
			
			var revID = "revID" + i;
			
			if(type == "revealRight"){
				$("#contentHolder").append("<div id='"+revID+"' class='"+ type +"' style='"+ currentStyle+"'><div id='"+ revID + "Img' class='"+type+"Image' style='"+ currentImg+"'/></div><br/>");
			}else if (type == "revealBottom"){
				$("#contentHolder").append("<div id='"+revID+"' class='"+ type +"' style='"+ currentStyle+"'><div id='"+ revID + "Img' class='"+type+"Image' style='"+ currentImg+"'/></div>");
			}else if (type == "revealTop"){
				$("#contentHolder").append("<div id='"+revID+"' class='"+ type +"' style='"+ currentStyle+" bottom:30px; left:"+ horPos +"px; position:absolute;'><div id='"+ revID + "Img' class='"+type+"Image' style='"+ currentImg+"'/></div>");
			}else if (type == "revealLeft"){
				$("#contentHolder").append("<div id='"+revID+"' class='"+ type +"' style='"+ currentStyle+"'><div id='"+ revID + "Img' class='"+type+"Image' style='"+ currentImg+"'/></div><br/>");
			}
			
			$("#"+revID).data("myText", myContent);
			$("#"+revID).data("myWidth", $("#"+revID).width());
			$("#"+revID).data("myHeight", $("#"+revID).height());
			$("#"+revID).data("myLeft", $("#"+revID).position().left);
			if(type != "revealTop"){
				$("#"+revID).data("myTop", $("#"+revID).position().top);
			}else{
				$("#"+revID).data("myTop", $("#"+revID).position().bottom);
			}
			
			////////////////////////////////////////  PLACE THE INTERACTIONS  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
			if(interact == "click"){
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
				}).click(function(){
					$(this).unbind('mouseenter mouseleave click');
					if(type == "revealRight"){
						TweenMax.to($(this), transitionLength, {css:{width:"100%"}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).append("<div id='revealTextHolder' class='antiscroll-wrap revealTextRight'><div id='"+currentSelected+"Text' class='revealText antiscroll-inner'>" + currentShowText + "</div></div>");
							$("#" + currentSelected + "Text").css({'width':$("#" + currentSelected).width() - $("#" + currentSelected + "Img").width() - ($("#" + currentSelected + "Img").position().left * 2) - 25,
															'height':$('#'+revID).height()});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
							$('.antiscroll-wrap').antiscroll();
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}else if(type == "revealBottom"){
						TweenMax.to($(this), transitionLength, {css:{height:300}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).append("<div id='revealTextHolder' class='antiscroll-wrap revealTextBottom'><div id='"+currentSelected+"Text' class='revealText antiscroll-inner'>" + $("#" + currentSelected).data("myText") + "</div></div>");
							$("#" + currentSelected + "Text").css({//'position':'absolute', 
															'height': $("#" + revID).height() - $("#" + currentSelected + "Img").height(),
															'padding': 5,
															'left' : 5,
															'width' : $("#" + currentSelected).width() - 10,
															'opacity':0.1
															});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
							$('.antiscroll-wrap').antiscroll();
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}else if (type == "revealTop"){
						TweenMax.to($(this), transitionLength, {css:{height:$("#contentHolder").height() - ($("#content").position().top + myTop + 20)}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).prepend("<div id='revealTextHolder' class='antiscroll-wrap revealTextTop'><div id='"+currentSelected+"Text' class='revealText antiscroll-inner'>" + $("#" + currentSelected).data("myText") + "</div></div>");
							$("#" + currentSelected + "Text").css({
															'height':$("#" + currentSelected).height() - $("#" + currentSelected + "Img").height() - 15, 
															'top': 10, 
															'left' : 5,
															'width' : $("#" + currentSelected).width() - 25,
															'opacity':0
															});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
							$('.antiscroll-wrap').antiscroll();
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}else if (type == "revealLeft"){
						TweenMax.to($(this), transitionLength, {css:{width:"100%"}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).append("<div id='revealTextHolder' class='antiscroll-wrap'><div id='"+currentSelected+"Text' class='revealText revealTextLeft antiscroll-inner'>" + $("#" + currentSelected).data("myText") + "</div></div>");
							$("#" + currentSelected + "Text").css({'width':$("#" + currentSelected).width() - $("#" + currentSelected + "Img").width() - 25});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
							$('.antiscroll-wrap').antiscroll();
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}
				});
			}else{
				$("#"+revID).hover(function(){
					$(this).unbind('mouseenter mouseleave');
					if(type == "revealRight"){
						TweenMax.to($(this), transitionLength, {css:{width:"100%"}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).append("<div id='revealTextHolder' class='antiscroll-wrap revealTextRight'><div id='"+currentSelected+"Text' class='revealText antiscroll-inner'>" + currentShowText + "</div></div>");
							$("#" + currentSelected + "Text").css({'width':$("#" + currentSelected).width() - $("#" + currentSelected + "Img").width() - ($("#" + currentSelected + "Img").position().left * 2) - 25,
															'height':$('#'+revID).height()});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
							$('.antiscroll-wrap').antiscroll();
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}else if(type == "revealBottom"){
						TweenMax.to($(this), transitionLength, {css:{height:300}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).append("<div id='revealTextHolder' class='antiscroll-wrap revealTextBottom'><div id='"+currentSelected+"Text' class='revealText antiscroll-inner'>" + $("#" + currentSelected).data("myText") + "</div></div>");
							$("#" + currentSelected + "Text").css({//'position':'absolute', 
															'height': $("#" + revID).height() - $("#" + currentSelected + "Img").height(),
															'padding': 5,
															'left' : 5,
															'width' : $("#" + currentSelected).width() - 10,
															'opacity':0.1
															});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
							$('.antiscroll-wrap').antiscroll();
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}else if (type == "revealTop"){
						TweenMax.to($(this), transitionLength, {css:{height:$("#contentHolder").height() - ($("#content").position().top + myTop + 20)}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).prepend("<div id='revealTextHolder' class='antiscroll-wrap revealTextTop'><div id='"+currentSelected+"Text' class='revealText antiscroll-inner'>" + $("#" + currentSelected).data("myText") + "</div></div>");
							$("#" + currentSelected + "Text").css({
															'height':$("#" + currentSelected).height() - $("#" + currentSelected + "Img").height() - 15, 
															'top': 10, 
															'left' : 5,
															'width' : $("#" + currentSelected).width() - 25,
															'opacity':0
															});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
							$('.antiscroll-wrap').antiscroll();
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}else if (type == "revealLeft"){
						TweenMax.to($(this), transitionLength, {css:{width:"100%"}, ease:transitionType, onComplete:function(currentSelected, currentShowText){
							$("#" + currentSelected).append("<div id='revealTextHolder' class='antiscroll-wrap'><div id='"+currentSelected+"Text' class='revealText revealTextLeft antiscroll-inner'>" + $("#" + currentSelected).data("myText") + "</div></div>");
							$("#" + currentSelected + "Text").css({'width':$("#" + currentSelected).width() - $("#" + currentSelected + "Img").width() - 25});
							TweenMax.to($("#" + currentSelected + "Text"), transitionLength, {css:{opacity:1}, ease:transitionType});
							$('.antiscroll-wrap').antiscroll();
						}, onCompleteParams:[$(this).attr("id"), $(this).data("myText")]});
					}
				});
			}
			horPos += $("#" + revID).width() + 40;
			rev_arr.push(revID);
		}
						
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
					},
					focus: function (event){
						cachedTextPreEdit = event.editor.getData();
					}
				},
				toolbar: contentToolbar,
				toolbarGroups :contentToolgroup,
				extraPlugins: 'sourcedialog'
			});
			
			$("<div id='conEdit' class='btn_edit_text' title='Edit Text Content'></div>").insertAfter("#content");

			$("#conEdit").click(function(){			
				revealEdit_arr.length = 0;
				//Create the Content Edit Dialog
				var msg = "<div id='contentEditDialog' title='Input Page Content'>";
				msg += "<label id='hover'>Hover: </label>";
				msg += "<input id='isHover' type='checkbox' name='hover' class='radio' value='true'/><br/>";
				msg += "</div><br/>";
				$("#stage").append(msg);
				
				if($(data).find("page").eq(currentPage).attr("interact") == "hover"){
					$("#isHover").attr("checked", "checked");
				}
				
				editStartLength = revealCount;	
				//Cycle through the tabs from the xml
				for(var i = 0; i < revealCount; i++){
					var revealID = "reveal" + i;
					var revealLabel = i + 1;
					
					//Get image info
					var bg = $("#"+rev_arr[i]+"Img").css('background-image')
					bg = bg.replace('url(','').replace(')','');
					var myImage = bg;
					var parts = myImage.split('/'), i, l;
					var last = parts.length;
			
					mediaString = (parts[last - 1]);
					var revealImgHeight = $("#"+rev_arr[i]+"Img").css('height');
					var revealImgWidth = $("#"+rev_arr[i]+"Img").css('width');
					
					revealImgHeight = revealImgHeight.replace('px','');
					revealImgWidth = revealImgWidth.replace('px','');
					
					var msg = "<div id='"+revealID+"Container' class='templateAddItem' value='"+i+"'>";
					msg += "<div id='"+revealID+"Remove' class='removeMedia' value='"+i+"' title='Click to remove this reveal'/>";
					msg += "<b>Reveal "+revealLabel+":</b>";
					msg += "<label id='"+revealID+"Image'><br/><b>Image: </b></label>";
					msg += "<input id='"+revealID+"ImageText' class='dialogInput' type='text' value='"+mediaString+"' defaultValue='"+mediaString+"' style='width:40%;'/>";
					msg += "<label> <b>Width: </b></label>";
					msg += "<input id='"+revealID+"Width'  class='dialogInput' type='text' value='" + revealImgWidth + "' defaultValue='" + revealImgWidth + "' style='width:10%;'/>";
					msg += "<label> <b>Height: </b></label>";
					msg += "<input id='"+revealID+"Height'  class='dialogInput' type='text' value='" + revealImgHeight + "' defaultValue='" + revealImgHeight + "' style='width:10%;'/>";
					var myRevealContent = $(data).find("page").eq(currentPage).find("reveal").eq(i).text();	
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
						extraPlugins: 'sourcedialog'
					});
						
					revealEdit_arr.push(revealID);
				}
					
				//Style it to jQuery UI dialog
				$("#contentEditDialog").dialog({ 	
					modal: true,
					width: 875,
					height: 750,
					resizable: false,
					close: function(){
						$("#contentEditDialog").remove();
					},
					buttons: {
						Add: function(){
							editStartLength++;
							var revealCount = revealEdit_arr.length;
							var revealID = "reveal" + revealCount;
							var revealLabel = revealCount + 1;
							
							var msg = "<div id='"+revealID+"Container' class='templateAddItem' value='"+revealCount+"'>";
							msg += "<div id='"+revealID+"Remove' class='removeMedia' value='"+revealCount+"' title='Click to remove this reveal'/>";
							msg += "<b>Reveal "+revealLabel+":</b>";
							msg += "<label id='"+revealID+"Image'><br/><b>Image:</b></label> <input id='"+revealID+"ImageText' type='text' value='"+mediaString+"' defaultValue='"+mediaString+"' style='width:40%;'/>";
							if(type == "revealRight" || type == "revealLeft"){
								backgroundWidth = 160;
							}else{
								backgroundWidth = 280;
							}
							msg += "<label> <b>Width: </b></label><input id='"+revealID+"Width'  type='text' value='" + revealImgWidth + "' defaultValue='" + revealImgWidth + "' style='width:10%;'/>";
							msg += "<label> <b>Height: </b></label><input id='"+revealID+"Height'  type='text' value='" + revealImgHeight + "' defaultValue='" + revealImgHeight + "' style='width:10%;'/>";
							var myRevealContent = "New Reveal Content";
							msg += "<div id='"+revealID+"Content'><b>Content:</b></div> <div id='"+revealID+"ContentText'>" + myRevealContent + "</div>";
							msg += "</div>"
							$("#contentEditDialog").append(msg);
							
							$("#" +revealID+"Remove").on('click', function(){
								removeReveal($(this).attr("value"));
							});
							
							CKEDITOR.replace( revealID+"ContentText", {
								toolbar: contentToolbar,
								toolbarGroups :contentToolgroup,
								enterMode : CKEDITOR.ENTER_BR,
								shiftEnterMode: CKEDITOR.ENTER_P,
								extraPlugins: 'sourcedialog'
							});
							
							var boxWidth = $("#"+revealID+"Width").width() + 10;
							var boxHeight = $("#"+revealID+"Height").height() + 10;
							$(data).find("page").eq(currentPage).append($("<reveal>"));
							var newRevealContent1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
							var revealCDATA1 = newRevealContent1.createCDATASection("<p>New Reveal Content</p>");
							$(data).find("page").eq(currentPage).find("reveal").eq(revealCount).append(revealCDATA1);
							$(data).find("page").eq(currentPage).find("reveal").eq(revealCount).attr('style', 'width:'+backgroundWidth+'px; height:160px;');
							$(data).find("page").eq(currentPage).find("reveal").eq(revealCount).attr('imgStyle', 'position:relative; top:5px; left:5px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Image Picture"');
								
							revealEdit_arr.push(revealID);	
						},
						Save: function(){
							if($("#isHover").prop("checked") == true){
								$(data).find("page").eq(currentPage).attr('interact', "hover");
							}else{
								$(data).find("page").eq(currentPage).attr('interact', "click");
							}
							var tmpArray = new Array();
							for(var i = 0; i < revealEdit_arr.length; i++){
								var tmpObj = new Object();
								tmpObj.title = $("#" + revealEdit_arr[i] +"TitleText").val();
								tmpObj.img = $("#"+revealEdit_arr[i]+"ImageText").val();
								var imgW = $("#"+revealEdit_arr[i]+"Width").val();
								var imgH = $("#"+revealEdit_arr[i]+"Height").val();
								
								if(type == "revealRight"){
									tmpObj.boxW = parseInt(imgW) + 10;
									tmpObj.boxH = parseInt(imgH) + 10;
									tmpObj.imgAttr = 'position:relative; top:5px; left:5px; width:' + imgW + 'px; height:' + imgH + 'px; background:url(media/'+ tmpObj.img +') no-repeat; background-size: ' + imgW + 'px ' + imgH + 'px;" alt="Default Image"';
								}else if(type == "revealLeft"){
									tmpObj.boxW = parseInt(imgW) + 10;
									tmpObj.boxH = parseInt(imgH) + 10;
									tmpObj.imgAttr = 'position:relative; top:5px; right:5px; width:' + imgW + 'px; height:' + imgH + 'px; background:url(media/'+ tmpObj.img +') no-repeat; background-size: ' + imgW + 'px ' + imgH + 'px;" alt="Default Image"';
								}else{
									tmpObj.boxW = 280;
									tmpObj.boxH = parseInt(imgH) + 10;
									if(type == "revealBottom"){
										tmpObj.imgAttr = 'position:relative; margin-left:auto; margin-right:auto; top:5px; left:5px; width:' + imgW + 'px; height:' + imgH + 'px; background:url(media/'+ tmpObj.img +') no-repeat; background-size: ' + imgW + 'px ' + imgH + 'px;" alt="Default Image"';
									}else{
										tmpObj.imgAttr = 'position:relative; margin-left:auto; margin-right:auto; bottom:5px; right:65px; width:' + imgW + 'px; height:' + imgH + 'px; background:url(media/'+ tmpObj.img +') no-repeat; background-size: ' + imgW + 'px ' + imgH + 'px;" alt="Default Image"';
									}
								}
			
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
		//scroller.refresh();
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
			$(data).find("page").eq(currentPage).find("reveal").eq(i).empty();
			$(data).find("page").eq(currentPage).find("reveal").eq(i).append(revealCDATA);
			$(data).find("page").eq(currentPage).find("reveal").eq(i).attr("title", _data[i].img);
			$(data).find("page").eq(currentPage).find("reveal").eq(i).attr('style', 'width:'+_data[i].boxW+'px; height:'+ _data[i].boxH +'px;');
			$(data).find("page").eq(currentPage).find("reveal").eq(i).attr('imgStyle', _data[i].imgAttr);
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
    
    function fadeComplete() {
		try { pageTitle.destroy(); } catch (e) {}
        try { audioHolder.destroy(); } catch (e) {}
	    try { $("#scrollableContent").remove(); } catch (e) {}
	    try { $("#conEdit").remove(); } catch (e) {}
				
		for(name in CKEDITOR.instances){
			try { CKEDITOR.instances[name].destroy() } catch (e) {}
		}
		
	    loadPage();
    }
}