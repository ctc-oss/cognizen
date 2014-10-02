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
function C_ClickListRevealText(_type) {
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
	
	function buildTemplate() {
		$("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div></div></div>');
		$("#scrollableContent").addClass("top");
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
			// WTF?  scrollableContent.position.top changes after contentHolder.height is set for the first time
			// So we do it twice to get the right value
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		
		if(isIE || isFF){
			$("#contentHolder").height($("#contentHolder").height() - 22);
		}

        $("#content").append(myContent);
        
        $("<div id='listPalette' class='listPalette'></div>").insertAfter("#content");
		
		for(var i = 0; i < revealCount; i++){
			var currentItem = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("title").text();
			var tmpContent = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("content").text();
			var tmpCaption = $(data).find("page").eq(currentPage).find("reveal").eq(i).find("caption").text();
			
			var revID = "revID" + i;
			
			$("#listPalette").append("<div id='"+ revID +"' class='listItem' myContent='"+ tmpContent +"'>"+currentItem+"</div>");
			
			if(interact == "click"){
				$("#" + revID).click(function(){
					updateRevealContent($(this));
				});
			}else if(interact == "hover"){
				$("#" + revID).hover(function(){
					updateRevealContent($(this));
				});
			}
		}
		
		$("<div id='clickListTextHolder' class='clickListTextHolder antiscroll-wrap'><div id='clickListText' class='clickListText antiscroll-inner'></div></div><br/><br/>").insertAfter("#listPalette");
		if(isIE || isFF){
			ieWidth = $("#clickListTextHolder").width();
			$("<br/><br/>").insertAfter(".clickListTextHolder");
		}
		
		$(".listPalette").height($("#stage").height() - ($("#scrollableContent").position().top + $("#listPalette").position().top+ audioHolder.getAudioShim() + 15));
		$("#clickListTextHolder").height($("#stage").height() - ($("#scrollableContent").position().top + $("#listPalette").position().top+ audioHolder.getAudioShim() + 15));
				
		checkMode();
		if(transition == true){
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
		}
		//Select the first one...
		$("#revID0").click();
	}
	
	function updateRevealContent(_myItem){
		console.log(_myItem);
		try { $(currentItem).removeClass("clickListSelected"); } catch (e) {}
		currentItem = _myItem;
		try { $(currentItem).addClass("clickListSelected"); } catch (e) {}
		$("#clickListText").empty();
		
		$("#clickListText").append(_myItem.attr("myContent"));
		//BECAUSE IE FUCKING SUCKS!!!!
		if(isIE || isFF){
			if(ieHeight == null){
				ieHeight = $("#clickListText").height();// - 30;
				ieWidth = $("#clickListText").width() - 17;
			}
			$("#clickListText").css({'height': ieHeight, 'max-height': ieHeight, 'width':ieWidth, 'max-width': ieWidth, 'margin-right': '-17px', 'padding-right': '17px'});
			$("#contentHolder").height($("#contentHolder").height() - 17);
			$("#contentHolder").width($("#contentHolder").width() - 17);
		}
		
		$('.antiscroll-wrap').antiscroll();
	}
	
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
			$("#clickListTextHolder").prepend("<div id='conEdit' class='btn_edit_text' title='Edit click list reveals'></div>");
			
			$("#conEdit").click(function(){
				updateRevealDialog();
			}).tooltip();
		}
	}
	
	function updateRevealDialog(){
		clearCKInstances();
		try { $("#contentEditDialog").remove(); } catch (e) {}
		//Create the Content Edit Dialog
		var msg = "<div id='contentEditDialog' title='Update click list contents'>";
		msg += "<label id='hover'><b>Hover: </b></label>";
		msg += "<input id='isHover' type='checkbox' name='hover' class='radio' value='true' title='Define whether users click or hover over the items.'/><br/><br/>";
		msg += "<div id='questionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Reveal Item Menu: </b></label></div><br/><br/>";
		$("#stage").append(msg);
		
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
						clearCKInstances();
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
			msg += "<label id='revealTerm'><br/><b>Term: </b></label>";
			msg += "<input id='revealTermText' class='dialogInput' type='text' value='"+termString+"' defaultValue='"+termString+"' style='width:40%;' title='Input reveal term.'/>";
					
		var myRevealContent = $(data).find("page").eq(currentPage).find("reveal").eq(_addID).find("content").text();	
			msg += "<div><b>Content:</b></div>";
			msg += "<div id='revealContentText' class='dialogInput' title='Input reveal item definition.'>" + myRevealContent + "</div>";
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
	
	function clearCKInstances(){
		if (CKEDITOR.instances['revealContentText']) {
            CKEDITOR.instances.revealContentText.destroy();            
        }
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