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
    var cardClicks = 0;
    var isVirgin = true;

	//Defines a public method - notice the difference between the private definition below.
	this.initialize = function(){
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		//var body = document.getElementsByTagName("body")[0];
		//body.setAttribute('role', 'application');
		//Clear accessibility on page load.
        pageAccess_arr = [];
        audioAccess_arr = [];

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
		var msg = '<div id="scrollableContent" class="antiscroll-wrap">';
			msg += '<div class="box">';
			msg += '<div id="contentHolder" class="overthrow antiscroll-inner">';
			msg += '<div id="content"></div>';
			msg += '<div id="flashcardHolder"></div>';
			msg += '</div></div></div>';
		$("#stage").append(msg);

		$("#scrollableContent").addClass("top");

        $("#content").addClass("top");
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		// WTF?  scrollableContent.position.top changes after contentHolder.height is set for the first time
		// So we do it twice to get the right value  -- Dingman's famous quantum variable!
		$("#contentHolder").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
//        $("#scrollableContent").height(stageH - ($("#scrollableContent").position().top + audioHolder.getAudioShim()));
		if(isMobilePhone){
			$("#contentHolder").prepend(myContent);
		}else{
			$("#content").append(myContent);
		}
		//$("#content").attr("aria-label", $("#content").text().replace(/'/g, ""));
        //pageAccess_arr.push($("#content"));

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

		for(var i=revealCount -1; i>=0; i--){
			var myTerm = $(data).find("page").eq(currentPage).find("card").eq(order_arr[i]).find("term").text();
			var myDef = $(data).find("page").eq(currentPage).find("card").eq(order_arr[i]).find("definition").text();
			var tempID = "card" + i;
			var tempTextID = "cardText" + i;

			$("#flashcardHolder").append("<div id='"+tempID+"' class='flashcard' role='button'><div id='"+tempTextID +"' class='cardText'>" + myTerm + "</div></div>");

			//Position the card.
			var leftPos = 6.7;
			if(!oldIE){
				if(window.matchMedia("screen and (max-device-width: 736px)").matches){
					leftPos = 0;
				}
			}

			$("#" + tempID).css({'left': leftPos + i*0.4 + '%'});
			//Postion the text within the card.
			$("#" + tempTextID).css({'top': ($("#" + tempID).height() - $("#"+tempTextID).height())/2});

			$("#" + tempID).data("myTerm", myTerm);
			$("#" + tempID).data("myDef", myDef);
			$("#" + tempID).attr("disabled", "true");
			
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
			$("<div id='flashcardReshuffle' tabindex='5'>shuffle</div>").insertAfter("#flashcardHolder");
		}else{
			$("<div id='flashcardReshuffle' tabindex='5'>reset</div>").insertAfter("#flashcardHolder");
		}
		
		pageAccess_arr.push($("#flashcardReshuffle"));
		
		$("#flashcardReshuffle").button().click(function(){
			$("#flashcardHolder").empty();
			cardClicks = 0;
			pageAccess_arr = [];
			card_arr = [];
			myIndex = 1;
			shuffle();
			$(this).remove();
		}).keypress(function(event) {
			var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
	        if (chCode == 32 || chCode == 13){
		        $(this).click();
		    }
        });
		
		//doAccess(pageAccess_arr);
	}

	function enableNextCard(){
		$(card_arr[currentCard]).hover(function(){
				$(this).addClass("flashcardHover");
			},function(){
				$(this).removeClass("flashcardHover");
			}).click(function(){
				$(this).unbind('mouseenter mouseleave click');
				$(this).removeClass("flashcardHover");
				
				var cardHolderWidth = $("#flashcardHolder").width();
				// calculate new left position in percent
				var initialPos = $(this).position().left;
				var initialPosPercent = initialPos / cardHolderWidth * 100 + "%";

				TweenMax.to($(this), .2, {rotationY:90, left:'50%', zIndex: myIndex, onComplete:function(target){
					target.empty();
					target.removeAttr("role");
					tempID = "cardBackText" + myIndex;
					target.append("<div id='"+tempID+"' class='cardText'>"+target.data("myDef")+"</div>");
					$("#" + tempID).css({'top': (target.height() - $("#" + tempID).height())/2});
					target.addClass("flashcardBack");
					target.css('left', 'auto');
					if(isMobilePhone){
						target.click(function(){
							this.remove();
						});
					}
					TweenMax.to(target, .2, {rotationY:0, right: initialPosPercent});
					$("#" + tempID).focus();
					target.blur(function(){
						$(this).attr("tabindex", "-1");
					});
				}, onCompleteParams:[$(this)]});
				myIndex++;
				cardClicks++;
				if(currentCard == 0){

				}else{
					currentCard--;
					enableNextCard();
				}
				
			}).keypress(function(event) {
			    var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
			    if (chCode == 32 || chCode == 13){
				    $(this).click();
				}
		    }).attr("tabindex", "1");
		$(card_arr[currentCard]).removeAttr("disabled");
		pageAccess_arr.splice(cardClicks, 0, $(card_arr[currentCard]));
		if(isVirgin){
			doAccess(pageAccess_arr);
			isVirgin = false;
		}else{
			doAccess(pageAccess_arr, true);
		}
		
	}


	/*****************************************************************************************************************************************************************************************************************
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	PAGE EDIT FUNCTIONALITY
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	*****************************************************************************************************************************************************************************************************************/
	function checkMode(){
		$('.antiscroll-wrap').antiscroll();
		if(mode === "edit"){
			try{if (CKEDITOR.instances['content']) {
				CKEDITOR.remove(CKEDITOR.instances['content']);
			}}catch (e) {}
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
		clearCKInstances();
		try { $("#contentEditDialog").remove(); } catch (e) {}
		//Create the Content Edit Dialog
		var msg = "<div id='contentEditDialog' title='Input Card Content'>";

		msg += "<label id='label' title='Randomize card order.'><b>randomize cards: </b></label>";
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
			buttons: [
				{
					text: "Add",
					title: "Add a new card.",
					click: function(){
						try { $("#revealContainer").remove(); } catch (e) {}
						makeRevealDataStore();
						clearCKInstances();
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
			var cleanText = $(data).find("page").eq(currentPage).find("card").eq(h).find("term").text().replace(/<\/?[^>]+(>|$)/g, "");//////////////////////Need to clean out html tags.....
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
		msg += "<div id='cardFront' title='Input text for card front.'><b>Card " + revealLabel + " Front:</b></div>";
		msg += "<div id='cardFrontText' contenteditable='true' class='dialogInput'>" + myCardFront + "</div>";
		msg += "<div id='cardBack' title='Input text for card back.'><b>Card " + revealLabel + " Back:</b></div>";
		msg += "<div id='cardBackText' contenteditable='true' class='dialogInput'>" + myCardBack + "</div><br/>";
		msg += "</div>";

		$("#contentEditDialog").append(msg);

		$("#removeCard").click(function(){
			areYouSure();
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
	}

	function clearCKInstances(){
		if (CKEDITOR.instances['cardFrontText']) {
            CKEDITOR.instances.cardFrontText.destroy();
        }
        if (CKEDITOR.instances['cardBackText']) {
            CKEDITOR.instances.cardBackText.destroy();
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
			$(data).find("page").eq(currentPage).find("card").eq(currentEditBankMember).remove();
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

		if($("#isRandom").prop("checked") == true){
			$(data).find("page").eq(currentPage).attr("randomize", "true");
			randomize = true;
		}else{
			$(data).find("page").eq(currentPage).attr("randomize", "false");
			randomize = false;
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