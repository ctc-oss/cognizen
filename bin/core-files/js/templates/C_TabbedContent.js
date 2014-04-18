/*!
 * C_TabbedContent
 * This class creates a template for a tabbed interface, allowing (text/images/swfs).
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2013-03-04
 * JavaScript utilizing jQuery UI Tabbed Component
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_TabbedContent(_type) {
	var type = _type;
	// var pageTitle;
	// var mediaHolder;
	// var audioHolder;
	var myContent
    var tabEdit_arr = [];
	    
    //Defines a public method - notice the difference between the private definition below.
	this.initialize = function(){
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		tabCount = $(data).find("page").eq(currentPage).find("tab").length;
		myContent = $(data).find("page").eq(currentPage).find("content").text();		
		
		buildTemplate();
	}
	
	
	/*****************************************
	**Build Template
	*****************************************/
	function buildTemplate() {
		//Add the divs for the page title and the content and divs.		
		pageTitle = new C_PageTitle();
		
		$("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content">' +myContent + '</div><div id="tabs"></div></div></div>');
		
		audioHolder = new C_AudioHolder();
		
		$("#scrollableContent").addClass("tabsLeft");
	    $("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		var tabString = '<ul>';
		
		for(var i = 0; i < tabCount; i++){
			var currentTab = $(data).find("page").eq(currentPage).find("tab").eq(i).attr("title");
			var tabID = "tab" + i;
			tabString += '<li><a href="#'+ tabID +'">'+ currentTab +'</a></li>';
		}
		tabString += '</ul>';
		
		for(var i = 0; i < tabCount; i++){
			var currentTab = $(data).find("page").eq(currentPage).find("tab").eq(i).attr("title");
			var tabID = "tab" + i;
			var currentTabContent = $(data).find("page").eq(currentPage).find("tab").eq(i).text();
			tabString += '<div id="'+ tabID +'" class="cognizenTabContent"><p>' + currentTabContent + '</p></div>';	
		}
		
		tabString += '</div>';
		
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
				
//				var myTabSpace = stageH - (contentTop + tabTop + tabHeight + audioHolder.getAudioShim() + 45);
//				$(".cognizenTabContent").css('max-height', myTabSpace+'px');
//				$(".cognizenTabContent").css('overflow', 'auto');
			}
		});	
		
		/*Attach Media*/
		if(type == "tabsOnly"){
			if(transition == true){
				TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
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
	}
		
	function addTab(_addID, _isNew){
		var tabID = "tab" + _addID;
		var contentLabel = _addID + 1;
		
		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<tab id='"+ _addID + "' title='tab"+ contentLabel + "'>"));
			var newTabContent1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA1 = newTabContent1.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(currentPage).find("tab").eq(_addID).append(tabCDATA1);
		}
		
		var myTabLabel = $(data).find("page").eq(currentPage).find("tab").eq(_addID).attr("title");
		var myTabContent = $(data).find("page").eq(currentPage).find("tab").eq(_addID).text();
			
		var msg = "<div id='"+tabID+"Container' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='"+tabID+"Remove' class='removeMedia' value='"+_addID+"' title='Click to remove this tab'/>";
		msg += "<label>Tab " + contentLabel + " Title: </label>";
		msg += "<input id='"+tabID+"TitleText' type='text' value='"+ myTabLabel + "' defaultValue='"+ myTabLabel + "' style='width:30%;'/>";
					
		msg += "<div>Tab " + contentLabel + " Content:</div> ";
		msg += "<div name='"+tabID+"ContentText' id='"+tabID+"ContentText'  contenteditable='true' class='dialogInput'>" + myTabContent + "</div>";	
		msg += "</div>";
		
		$("#contentEditDialog").append(msg);
		
		$("#" +tabID+"Remove").click(function(){
			removeTab($(this).attr("value"));
		});
	            
		CKEDITOR.inline( tabID+"ContentText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
			allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
		});				
		tabEdit_arr.push(tabID);
	}
	
	function removeTab(_id){
		for(var i = 0; i < tabEdit_arr.length; i++){
			if(_id == $("#"+tabEdit_arr[i]+"Container").attr("value")){
				var arrIndex = i;
				break;
			}
		}
		$(data).find("pages").eq(currentPage).find("tab").eq(arrIndex).remove();
		tabEdit_arr.splice(arrIndex, 1);
		var myField = "tab"+_id+"ContentText";
		//CKEDITOR.instances[myField].destroy();
		$("#tab" + _id +"Container").remove();
	}
	/*****************************************************************************************************************************************************************************************************************
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	PAGE EDIT FUNCTIONALITY
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	function checkMode(){
		
		$('.antiscroll-wrap').antiscroll();
		
		if(mode == "edit"){
			/***************************************************************************************************
			EDIT CONTENT
			***************************************************************************************************/
			$("#content").attr('contenteditable', true);
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
				//Create the Content Edit Dialog
				var msg = "<div id='contentEditDialog' title='Input Page Content'></div>";
				$("#stage").append(msg);	
				//Cycle through the tabs from the xml
				for(var i = 0; i < tabCount; i++){
					addTab(i, false);
				}
					
				//Style it to jQuery UI dialog
				$("#contentEditDialog").dialog({ 	
					autoOpen: true,
					modal: true,
					width: 875,
					height: 650,
					buttons: {
						Add: function(){	
							addTab(tabEdit_arr.length, true);	
						},
						Save: function(){
							var tmpArray = new Array();
							for(var i = 0; i < tabEdit_arr.length; i++){
								var tmpObj = new Object();
								tmpObj.title = $("#" + tabEdit_arr[i] +"TitleText").val();
								var myTabText = tabEdit_arr[i]+"ContentText";
								tmpObj.content = CKEDITOR.instances[myTabText].getData();
								tmpArray.push(tmpObj);
							}
							saveTabEdit(tmpArray);
							$( this ).dialog( "close" );
						}	
					},
					close: function(){
						$("#contentEditDialog").remove();
					}
				});
			}).tooltip();
		}
		$(this).scrubContent();	
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
	function saveTabEdit(_data){
		for(var i = 0; i < tabEdit_arr.length; i++){
			var tabLabel = _data[i].title;
			var tabUpdate = _data[i].content;
			var newTabContent = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA = newTabContent.createCDATASection(tabUpdate);
			$(data).find("page").eq(currentPage).find("tab").eq(i).empty();
			$(data).find("page").eq(currentPage).find("tab").eq(i).append(tabCDATA);
			$(data).find("page").eq(currentPage).find("tab").eq(i).attr("title", tabLabel);
		}
		
		var extra = $(data).find("page").eq(currentPage).find("tab").length;
		var active = tabEdit_arr.length;
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