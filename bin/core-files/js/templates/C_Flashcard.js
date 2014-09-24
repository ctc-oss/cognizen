/*!
 * C_Flashcard
 * This class creates a template for a creating basic flashcard exercises
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2013-06-03
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_Flashcard(_type) {
	var type = _type;
	// var pageTitle;
	// var audioHolder;
	var myContent;//Body
	
	var revealCount//number of tabs.
	var currentCard;
	var card_arr = [];
    
	var imageWidth;
	var imageHeight;
	var virgin = true;
	var myIndex = 1;
	var randomize = false;
	
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
		
		if($(data).find("page").eq(currentPage).attr('randomize') == "true"){
			randomize = true;
		}
		
		//Position the page text		
		revealCount = $(data).find("page").eq(currentPage).find("card").length;
		myContent = $(data).find("page").eq(currentPage).find("content").text();		
		pageTitle = new C_PageTitle();
		audioHolder = new C_AudioHolder();
		
		buildTemplate();
	}
	
	//Defines a private method - notice the difference between the public definitions above.
	var buildTemplate = function() {
		$("#stage").append('<div id="scrollableContent" class="antiscroll-wrap"><div id="contentHolder" class="overthrow antiscroll-inner"><div id="content"></div><div id="flashcardHolder"></div></div></div>');
		$("#scrollableContent").addClass("top");
		
        $("#content").addClass("top");
        $("#scrollableContent").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		$("#content").append(myContent);
		
		shuffle();		
   	}
	
	function shuffle(){
		card_arr.length = 0;
		
		//FLASHCARDS
		currentCard = revealCount - 1;
		
		var order_arr = [];
		for (var j = 0; j < revealCount; j++){
			order_arr.push(j);
		}
		
		if(randomize){
			var order_arr = shuffleArray(order_arr);
		}
		
		for(var i=0; i<revealCount; i++){
			var myTerm = $(data).find("page").eq(currentPage).find("card").eq(order_arr[i]).find("term").text();
			var myDef = $(data).find("page").eq(currentPage).find("card").eq(order_arr[i]).find("definition").text();
			var tempID = "card" + i;
			var tempTextID = "cardText" + i;
			
			$("#flashcardHolder").append("<div id='"+tempID+"' class='flashcard'><div id='"+tempTextID +"' class='cardText'>" + myTerm + "</div></div>");
			
			//Position the card.
			$("#" + tempID).css({'left': 69 + i*4});
			//Postion the text within the card.
			$("#" + tempTextID).css({'top': ($("#" + tempID).height() - $("#"+tempTextID).height())/2});
			
			$("#" + tempID).data("myTerm", myTerm);
			$("#" + tempID).data("myDef", myDef);
			
			card_arr.push("#" + tempID);
		}
		
		//Set height of holder, for styling
		$("#flashcardHolder").height($("#card0").height());
		
		if(transition == true){
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType, onComplete:checkMode});
		}else{
			checkMode();
		}		
		enableNextCard();
		if(randomize == true){
			$("<div id='flashcardReshuffle'>shuffle</div>").insertAfter("#flashcardHolder");
		}else{
			$("<div id='flashcardReshuffle'>reset</div>").insertAfter("#flashcardHolder");
		}
		$("#flashcardReshuffle").button().click(function(){
			$("#flashcardHolder").empty();
			card_arr = [];
			myIndex = 1;
			shuffle();
			$(this).remove();
		});
	}
	
	function enableNextCard(){
		$(card_arr[currentCard]).hover(function(){
				$(this).addClass("flashcardHover");
			},function(){
				$(this).removeClass("flashcardHover");
			}).click(function(){
				$(this).unbind('mouseenter mouseleave click');
				$(this).removeClass("flashcardHover");
				TweenMax.to($(this), .2, {rotationY:90, left: $(this).position().left + $(this).width() + 25, zIndex: myIndex, onComplete:function(target){
					target.empty();
					tempID = "cardBackText" + myIndex;
					target.append("<div id='"+tempID+"' class='cardText'>"+target.data("myDef")+"</dev>");
					$("#" + tempID).css({'top': (target.height() - $("#" + tempID).height())/2});
					target.addClass("flashcardBack");
					TweenMax.to(target, .2, {rotationY:0, left: target.position().left});
					
				}, onCompleteParams:[$(this)]});
				myIndex++;
				
				if(currentCard == 0){
					if(mandatory == true){
						
					}
				}else{
					currentCard--;
					enableNextCard();
				}
			});
	}
	
	
	/*****************************************************************************************************************************************************************************************************************
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	PAGE EDIT FUNCTIONALITY
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	function checkMode(){
		$('.antiscroll-wrap').antiscroll();
		if(mode === "edit"){
			$('#flashcardHolder').append("<div id='cardEdit' class='btn_edit_text' title='Edit Cards'></div>");
			
			$("#cardEdit").click(function(){
				updateRevealDialog();
			}).tooltip();
			
			/**
			* Edit Content
			*/
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
		}
		$(this).scrubContent();	
	}
	
	function updateRevealDialog(){
		try { $("#contentEditDialog").remove(); } catch (e) {}
		//Create the Content Edit Dialog
		var msg = "<div id='contentEditDialog' title='Input Card Content'>";

		msg += "<label id='label'><b>randomize options: </b></label>";
		msg += "<input id='isRandom' type='checkbox' name='random' class='radio' value='true'/><br/><br/>";
		msg += "<div id='questionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Reveal Item Menu: </b></label></div><br/><br/>";
		msg += "</div>"
		
		$("#stage").append(msg);
		
		updateRevealMenu();
		
		if(!randomize){
			$("#isRandom").removeAttr('checked');
		}else{
			$("#isRandom").attr('checked', 'checked');
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
			var cleanText = $(data).find("page").eq(currentPage).find("card").eq(h).text().replace(/<\/?[^>]+(>|$)/g, "");//////////////////////Need to clean out html tags.....
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
	
	function addReveal(_addID, _isNew){
		//ADD to XML if new....
		if(_isNew == true){
			$(data).find("page").eq(currentPage).append($("<card><term/><definition/></card>"));
			var newFront1 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack1 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA1 = newFront1.createCDATASection("New Card Term");
			var backCDATA1 = newBack1.createCDATASection("New Card Definition");
			$(data).find("page").eq(currentPage).find("card").eq(_addID).find("term").append(frontCDATA1);
			$(data).find("page").eq(currentPage).find("card").eq(_addID).find("definition").append(backCDATA1);
			currentEditBankMember = _addID;
			revealCount++;
		}
		
		var revealLabel = parseInt(_addID) + 1;
		var myCardFront = $(data).find("page").eq(currentPage).find("card").eq(_addID).find("term").text();	
		var myCardBack = $(data).find("page").eq(currentPage).find("card").eq(_addID).find("definition").text();
		
		var msg = "<div id='revealContainer' class='templateAddItem' value='"+_addID+"'>";
		msg += "<div id='removeCard' value='"+_addID+"' class='removeMedia' title='Remove this image'/>";
		msg += "<div id='cardFront'><b>Card " + revealLabel + " Front:</b></div>";
		msg += "<div id='cardFrontText' contenteditable='true' class='dialogInput'>" + myCardFront + "</div>";
		msg += "<div id='cardBack'><b>Card " + revealLabel + " Back:</b></div>";
		msg += "<div id='cardBackText' contenteditable='true' class='dialogInput'>" + myCardBack + "</div><br/>";
		msg += "</div>";
		
		$("#contentEditDialog").append(msg);
		
		$("#removeCard").click(function(){
			removeReveal($(this).attr("value"));	
		});
		
		CKEDITOR.inline( "cardFrontText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
			allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
		});	
		
		CKEDITOR.inline( "cardBackText", {
			toolbar: contentToolbar,
			toolbarGroups :contentToolgroup,
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			extraPlugins: 'sourcedialog',
			allowedContent: true//'p b i li ol ul table tr td th tbody thead span div img; p b i li ol ul table tr td th tbody thead div span img [*](*){*}'
		});	
		
		//cardEdit_arr.push(cardID);
	}
	
	function removeReveal(){
		if(revealCount > 1){
			$(data).find("pages").eq(currentPage).find("card").eq(currentEditBankMember).remove();
			$("#revealContainer").remove();
			revealCount--;
			currentEditBankMember = 0;
			updateRevealDialog();
		}else{
			alert("you must have at least one bank item.");
		}
	}	
	
	function makeRevealDataStore(){
		//myObjective = $("#inputObjective").val();
		//myObjItemId = $("#inputObjItemId").val();
		
		//$(data).find("page").eq(currentPage).attr('objective', myObjective);
		//$(data).find("page").eq(currentPage).attr('objItemId', myObjItemId);
		
		//$(data).find("page").eq(currentPage).attr('w', $("#imageWidth").val());
		//$(data).find("page").eq(currentPage).attr('h', $("#imageHeight").val());
		
		if($("#isHover").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("interact", "hover");
			interact = "hover";
		}else{
			$(data).find("page").eq(currentPage).attr("interact", "click");
			interact = "click";
		}
		
		var newRevealContent = new DOMParser().parseFromString('<card></card>',  "text/xml");
		var revealFrontCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["cardFrontText"].getData());
		$(data).find("page").eq(currentPage).find("card").eq(currentEditBankMember).find("term").empty();
		$(data).find("page").eq(currentPage).find("card").eq(currentEditBankMember).find("term").append(revealFrontCDATA);
		var revealBackCDATA = newRevealContent.createCDATASection(CKEDITOR.instances["cardBackText"].getData());
		$(data).find("page").eq(currentPage).find("card").eq(currentEditBankMember).find("definition").empty();
		$(data).find("page").eq(currentPage).find("card").eq(currentEditBankMember).find("definition").append(revealBackCDATA);
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
	**Save Tab Edit
	**********************************************************************/
	function saveRevealEdit(_data){
		var extra = $(data).find("page").eq(currentPage).find("card").length;
		var active = revealCount;
		var removed = extra - active;
		for(var i = extra + 1; i >= active; i--){
			$(data).find("page").eq(currentPage).find("card").eq(i).remove();
		}
		
		sendUpdateWithRefresh();
		fadeComplete();
	};

		
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