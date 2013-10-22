/*
 *  	C_AddPage
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses create page functionality for cognizen
 *  	Version: 0.5
 *		Date Created: 10/19/13
 *		Created by: Philip Double
 *		Date Updated: 10/19/13
 *		Updated by: Philip Double
 *		History: Moved all glossary functionality into its own js file.
 *		Todo: 	- Turn this into a plugin.  This did reside in C_Engine which was becoming unruly.
 *				- Optimize code.
 */

var pageType_arr = ["textOnly", "graphicOnly", "top", "left", "right", "bottom", "sidebar", "tabsOnly", "revealRight", "revealBottom", "revealTop", "revealLeft", "flashcardText", "flashcardMedia", "multipleChoice", "matching"/*",multipleSelect", "multipleChoiceImageTop", "multipleChoiceImageLeft", "multipleChoiceImageRight", "multipleSelectImageTop",  "matchingDrag", "unity", "tabsLeft", "unityOnly", "tabbedContentMedia"*/];


/************************************************************************************
ADD NEW PAGE
************************************************************************************/
function addPage(){
	//Create the base message.
	var msg = '<div id="dialog-addPage" title="Add Page"><p class="validateTips">Complete the form to create your new page.</p>';

	//Add the page type dropdown
	msg += '<p><label for="pageTypeList">Select a page type:</label><select id="pageTypeList" name="pageTypeList">';
	for(var i=0; i < pageType_arr.length; i++){
		msg += '<option value="' + pageType_arr[i]+ '">' + pageType_arr[i] + '</option>';
	}
	msg += '</select></p>';

	$("#pageTypeList").spinner();

	msg += '</div>';

	//Add to stage.
	$("#stage").append(msg);

	//Make it a dialog
	$("#dialog-addPage").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
				
				//$("#userList").remove();
				$("#pageTypeList").remove();
				$("#dialog-addPage").remove();
			},
		buttons: {
			Cancel: function () {
                    $(this).dialog("close");
			},
			Add: function(){
				//Grab the updated text from redactor.
				var newPageType = $("#pageTypeList").val();
				createNewPageByType(newPageType);
				toggleIndex();
				$(this).dialog("close");

			}
		}
	});
}

function createNewPageByType(_myType){
	//Create a Unique ID for the page
	var myID = guid();
	//Place a page element
	$(data).find("page").eq(currentPage).after($('<page id="'+ myID +'" layout="'+_myType+'" audio="null" prevPage="null" nextPage="null"></page>'));

	//Place the page title element
	$(data).find("page").eq(currentPage + 1).append($("<title>"));
	var newPageTitle = new DOMParser().parseFromString('<title></title>',  "application/xml");
	var titleCDATA = newPageTitle.createCDATASection("New Page Title");
	$(data).find("page").eq(currentPage + 1).find("title").append(titleCDATA);
	
	if(isLinear == true){
		var page_obj = new Object();
		page_obj.id = myID;
		page_obj.complete = false;
		tracking_arr.push(page_obj);
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//ADD PAGE SPECIFIC ELEMENTS
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	switch (_myType) {
		//Satic Layouts
		case "group":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage + 1).attr("type", "group");
			break;
		case "textOnly":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			break;
		case "graphicOnly":
			$(data).find("page").eq(currentPage + 1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("<p></p>");
			$(data).find("page").eq(currentPage + 1).find("caption").append(captionCDATA);
			$(data).find("page").eq(currentPage + 1).attr("img", "defaultTop.png");
			$(data).find("page").eq(currentPage + 1).attr("popup", "");
			$(data).find("page").eq(currentPage + 1).attr("popcaps", "");
			$(data).find("page").eq(currentPage + 1).attr("enlarge", "");
			$(data).find("page").eq(currentPage + 1).attr("alt", "image description");
			break;
		case "top":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage + 1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("<p></p>");
			$(data).find("page").eq(currentPage + 1).find("caption").append(captionCDATA);
			$(data).find("page").eq(currentPage + 1).attr("img", "defaultTop.png");
			$(data).find("page").eq(currentPage + 1).attr("popup", "");
			$(data).find("page").eq(currentPage + 1).attr("popcaps", "");
			$(data).find("page").eq(currentPage + 1).attr("enlarge", "");
			$(data).find("page").eq(currentPage + 1).attr("alt", "image description");
			break;
		case "left":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage + 1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("<p></p>");
			$(data).find("page").eq(currentPage + 1).find("caption").append(captionCDATA);
			$(data).find("page").eq(currentPage + 1).attr("img", "defaultLeft.png");
			$(data).find("page").eq(currentPage + 1).attr("popup", "");
			$(data).find("page").eq(currentPage + 1).attr("popcaps", "");
			$(data).find("page").eq(currentPage + 1).attr("enlarge", "");
			$(data).find("page").eq(currentPage + 1).attr("alt", "image description");
			break;
		case "right":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage + 1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("<p></p>");
			$(data).find("page").eq(currentPage + 1).find("caption").append(captionCDATA);
			$(data).find("page").eq(currentPage + 1).attr("img", "defaultLeft.png");
			$(data).find("page").eq(currentPage + 1).attr("popup", "");
			$(data).find("page").eq(currentPage + 1).attr("popcaps", "");
			$(data).find("page").eq(currentPage + 1).attr("enlarge", "");
			$(data).find("page").eq(currentPage + 1).attr("alt", "image description");
			break;
		case "bottom":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage + 1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("<p></p>");
			$(data).find("page").eq(currentPage + 1).find("caption").append(captionCDATA);
			$(data).find("page").eq(currentPage + 1).attr("img", "defaultTop.png");
			$(data).find("page").eq(currentPage + 1).attr("popup", "");
			$(data).find("page").eq(currentPage + 1).attr("popcaps", "");
			$(data).find("page").eq(currentPage + 1).attr("enlarge", "");
			$(data).find("page").eq(currentPage + 1).attr("alt", "image description");
			break;
		case "sidebar":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			$(data).find("page").eq(currentPage + 1).append($("<sidebar>"));
			var newSidebarContent = new DOMParser().parseFromString('<sidebar></sidebar>',  "text/xml");
			var sidebarCDATA = newSidebarContent.createCDATASection("<p>New Page Sidebar</p>");
			$(data).find("page").eq(currentPage + 1).find("sidebar").append(sidebarCDATA);
			break;
		case "tabsOnly":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);

			$(data).find("page").eq(currentPage + 1).append($("<tab id='1' title='tab1'>"));
			var newTabContent1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA1 = newTabContent1.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(currentPage + 1).find("tab").eq(0).append(tabCDATA1);

			$(data).find("page").eq(currentPage + 1).append($("<tab id='2' title='tab2'>"));
			var newTabContent2 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA2 = newTabContent2.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(currentPage + 1).find("tab").eq(1).append(tabCDATA2);
			break;
		case "tabsLeft":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);

			$(data).find("page").eq(currentPage + 1).append($("<tab id='1' title='tab1'>"));
			var newTabContent1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA1 = newTabContent1.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(currentPage + 1).find("tab").eq(0).append(tabCDATA1);

			$(data).find("page").eq(currentPage + 1).append($("<tab id='2' title='tab2'>"));
			var newTabContent2 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA2 = newTabContent2.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(currentPage + 1).find("tab").eq(1).append(tabCDATA2);

			$(data).find("page").eq(currentPage + 1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("<p></p>");
			$(data).find("page").eq(currentPage + 1).find("caption").append(captionCDATA);

			$(data).find("page").eq(currentPage + 1).attr("img", "defaultLeft.png");
			$(data).find("page").eq(currentPage + 1).attr("alt", "image description");
			break;
		case "revealRight":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA1 = newRevealContent1.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).append(revealCDATA1);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('style', 'width:160px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('imgStyle', 'position:relative; top:5px; left:5px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Image Picture"');
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA2 = newRevealContent2.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).append(revealCDATA2);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('style', 'width:160px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('imgStyle', 'position:relative; top:5px; left:5px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Image Picture"');
			
			$(data).find("page").eq(currentPage + 1).attr("interact", "click");
			break;
		case "revealLeft":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA1 = newRevealContent1.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).append(revealCDATA1);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('style', 'width:160px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('imgStyle', 'position:absolute; top:5px; right:5px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Image Picture"');
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA2 = newRevealContent2.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).append(revealCDATA2);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('style', 'width:160px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('imgStyle', 'position:absolute; top:5px; right:5px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Image Picture"');
			
			$(data).find("page").eq(currentPage + 1).attr("interact", "click");
			break;
		case "revealTop":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA1 = newRevealContent1.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).append(revealCDATA1);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('style', 'width:280px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('imgStyle', 'position:absolute; bottom:5px; right:65px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Reveal Image"');
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA2 = newRevealContent2.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).append(revealCDATA2);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('style', 'width:280px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('imgStyle', 'position:absolute; bottom:5px; right:65px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;" alt="Default Reveal Image"');
			
			$(data).find("page").eq(currentPage + 1).attr("interact", "click");
			break;
		case "revealBottom":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA1 = newRevealContent1.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).append(revealCDATA1);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('style', 'width:280px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(0).attr('imgStyle', 'position:relative; top:5px; margin-left:auto; margin-right:auto; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px; alt="Default Reveal Image"');
			
			$(data).find("page").eq(currentPage + 1).append($("<reveal>"));
			var newRevealContent2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			var revealCDATA2 = newRevealContent2.createCDATASection("<p>New Reveal Content</p>");
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).append(revealCDATA2);
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('style', 'width:280px; height:160px;');
			$(data).find("page").eq(currentPage + 1).find("reveal").eq(1).attr('imgStyle', 'position:relative; top:5px; margin-left:auto; margin-right:auto; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px; alt="Default Reveal Image"');
			
			$(data).find("page").eq(currentPage + 1).attr("interact", "click");
			break;
		case "flashcardText":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<card><term/><definition/></card>"));
			var newFront1 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack1 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA1 = newFront1.createCDATASection("<p>New Card Term</p>");
			var backCDATA1 = newBack1.createCDATASection("<p>New Card Definition</p>");
			$(data).find("page").eq(currentPage + 1).find("card").eq(0).find("term").append(frontCDATA1);
			$(data).find("page").eq(currentPage + 1).find("card").eq(0).find("definition").append(backCDATA1);
			
			$(data).find("page").eq(currentPage + 1).append($("<card><term/><definition/></card>"));
			var newFront2 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack2 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA2 = newFront2.createCDATASection("<p>New Card Term</p>");
			var backCDATA2 = newBack2.createCDATASection("<p>New Card Definition</p>");
			$(data).find("page").eq(currentPage + 1).find("card").eq(1).find("term").append(frontCDATA2);
			$(data).find("page").eq(currentPage + 1).find("card").eq(1).find("definition").append(backCDATA2);
			
			break;
			
		case "flashcardMedia":
			$(data).find("page").eq(currentPage + 1).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(currentPage + 1).find("content").append(contentCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<card><term/><definition/></card>"));
			var newFront1 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack1 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA1 = newFront1.createCDATASection("position:absolute; bottom:5px; right:65px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;");
			var backCDATA1 = newBack1.createCDATASection("<p>New Card Definition</p>");
			$(data).find("page").eq(currentPage + 1).find("card").eq(0).find("term").append(frontCDATA1);
			$(data).find("page").eq(currentPage + 1).find("card").eq(0).find("definition").append(backCDATA1);
			
			$(data).find("page").eq(currentPage + 1).append($("<card><term/><definition/></card>"));
			var newFront2 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack2 = new DOMParser().parseFromString('<defintion></definition>',  "text/xml");
			var frontCDATA2 = newFront2.createCDATASection("position:absolute; bottom:5px; right:65px; width:150px; height:150px; background:url(media/defaultReveal.png) no-repeat; background-size: 150px 150px;");
			var backCDATA2 = newBack2.createCDATASection("<p>New Card Definition</p>");
			$(data).find("page").eq(currentPage + 1).find("card").eq(1).find("term").append(frontCDATA2);
			$(data).find("page").eq(currentPage + 1).find("card").eq(1).find("definition").append(backCDATA2);
			
			break;
			
		case "multipleChoice":
			$(data).find("page").eq(currentPage + 1).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("Input a question.");
			$(data).find("page").eq(currentPage + 1).find("question").append(myQuestionCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option1CDATA = option1.createCDATASection("True");
			$(data).find("page").eq(currentPage + 1).find("option").eq(0).append(option1CDATA);
			$(data).find("page").eq(currentPage + 1).find("option").eq(0).attr("correct", "true");
			
			$(data).find("page").eq(currentPage + 1).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option2CDATA = option2.createCDATASection("False");
			$(data).find("page").eq(currentPage + 1).find("option").eq(1).append(option2CDATA);
			$(data).find("page").eq(currentPage + 1).find("option").eq(1).attr("correct", "false");
			
			$(data).find("page").eq(currentPage + 1).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("That is not correct.  Please try again.");
			$(data).find("page").eq(currentPage + 1).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(currentPage + 1).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(data).find("page").eq(currentPage + 1).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(currentPage + 1).find("feedback").append(myFeedbackCDATA);
			
			$(data).find("page").eq(currentPage + 1).attr("feedbackType", "undifferentiated");
			$(data).find("page").eq(currentPage + 1).attr("feedbackDisplay", "pop");
			$(data).find("page").eq(currentPage + 1).attr("audio", "null");
			$(data).find("page").eq(currentPage + 1).attr("btnText", "Submit");
			
			if(scored == true){
				$(data).find("page").eq(currentPage + 1).attr("attempts", 1);
				$(data).find("page").eq(currentPage + 1).attr("graded", true);
			}else{
				$(data).find("page").eq(currentPage + 1).attr("attempts", 2);
				$(data).find("page").eq(currentPage + 1).attr("graded", false);
			}
			break;
			
		case "matching":
			$(data).find("page").eq(currentPage + 1).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("Match the items on the left to the items on the right:");
			$(data).find("page").eq(currentPage + 1).find("question").append(myQuestionCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option1CDATA = option1.createCDATASection("Option1");
			$(data).find("page").eq(currentPage + 1).find("option").eq(0).append(option1CDATA);
			$(data).find("page").eq(currentPage + 1).find("option").eq(0).attr("correct", "A");
			
			$(data).find("page").eq(currentPage + 1).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option2CDATA = option2.createCDATASection("Option2");
			$(data).find("page").eq(currentPage + 1).find("option").eq(1).append(option2CDATA);
			$(data).find("page").eq(currentPage + 1).find("option").eq(1).attr("correct", "B");
			
			$(data).find("page").eq(currentPage + 1).append($("<answer>"));
			var answer1 = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
			var answer1CDATA = answer1.createCDATASection("Answer 1");
			$(data).find("page").eq(currentPage + 1).find("answer").eq(0).append(answer1CDATA);
			$(data).find("page").eq(currentPage + 1).find("answer").eq(0).attr("correct", "A");
			
			$(data).find("page").eq(currentPage + 1).append($("<answer>"));
			var answer2 = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
			var answer2CDATA = answer2.createCDATASection("Answer 2");
			$(data).find("page").eq(currentPage + 1).find("answer").eq(1).append(answer2CDATA);
			$(data).find("page").eq(currentPage + 1).find("answer").eq(1).attr("correct", "B");
			
			$(data).find("page").eq(currentPage + 1).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("That is not correct.  Please try again.");
			$(data).find("page").eq(currentPage + 1).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(currentPage + 1).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(data).find("page").eq(currentPage + 1).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(data).find("page").eq(currentPage + 1).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(currentPage + 1).find("feedback").append(myFeedbackCDATA);
			
			//$(data).find("page").eq(currentPage + 1).attr("attempts", 2);
			$(data).find("page").eq(currentPage + 1).attr("feedbackType", "undifferentiated");
			$(data).find("page").eq(currentPage + 1).attr("feedbackDisplay", "pop");
			$(data).find("page").eq(currentPage + 1).attr("audio", "null");
			$(data).find("page").eq(currentPage + 1).attr("btnText", "Submit");
			if(scored == true){
				$(data).find("page").eq(currentPage + 1).attr("attempts", 1);
				$(data).find("page").eq(currentPage + 1).attr("graded", true);
			}else{
				$(data).find("page").eq(currentPage + 1).attr("attempts", 2);
				$(data).find("page").eq(currentPage + 1).attr("graded", false);
			}
			
			break;
	}
	newPageAdded = true;
	sendUpdateWithRefresh();
}
