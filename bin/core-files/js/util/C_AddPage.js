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

var pageType_arr = ["textOnly", "mediaOnly", "textAboveMedia", "textLeftofMedia", "textRightofMedia", "textBelowMedia", "sidebar", "clickImageFullText",
 "textAboveTabs", "tabsLeftMediaRight", "clickImageRevealText", "flashcard", "dragOrdering", "multipleChoice", "multipleChoiceMedia", "matching",
 "questionBank", "completion", "branchingDecisions", "branchingLinearPaths", "branchingPractice", "inputAnswer", "inputExpertCompare",
 "clickListFullText", "dragSlider", "multipleChoiceFancy"];
var templateNameMap = {};
//#3600 Updated template names
//format templateNameMap[Name User Sees] = Name of template file
templateNameMap[pageType_arr[0]] = 'textOnly';
templateNameMap[pageType_arr[1]] = 'graphicOnly';
templateNameMap[pageType_arr[2]] = 'top';
templateNameMap[pageType_arr[3]] = 'left';
templateNameMap[pageType_arr[4]] = 'right';
templateNameMap[pageType_arr[5]] = 'bottom';
templateNameMap[pageType_arr[6]] = 'sidebar';
templateNameMap[pageType_arr[7]] = 'clickImage';
templateNameMap[pageType_arr[8]] = 'tabsOnly';
templateNameMap[pageType_arr[9]] = 'tabsLeft';
templateNameMap[pageType_arr[10]] = 'revealRight';
templateNameMap[pageType_arr[11]] = 'flashcard';
templateNameMap[pageType_arr[12]] = 'sequence';
templateNameMap[pageType_arr[13]] = 'multipleChoice';
templateNameMap[pageType_arr[14]] = 'multipleChoiceMedia';
templateNameMap[pageType_arr[15]] = 'matching';
templateNameMap[pageType_arr[16]] = 'questionBank';
templateNameMap[pageType_arr[17]] = 'completion';
templateNameMap[pageType_arr[18]] = 'branching';
templateNameMap[pageType_arr[19]] = 'pathing';
templateNameMap[pageType_arr[20]] = 'chaining';
templateNameMap[pageType_arr[21]] = 'textInput';
templateNameMap[pageType_arr[22]] = 'essayCompare';
templateNameMap[pageType_arr[23]] = 'clickListRevealText';
templateNameMap[pageType_arr[24]] = 'slider';
templateNameMap[pageType_arr[25]] = 'multipleChoiceFancy';

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
				var newPageType = $("#pageTypeList").val();

				createNewPageByType(getTemplate(newPageType));
				if(indexState == true){
					toggleIndex();
				}
				$(this).dialog("close");

			}
		}
	});
}

/**
* #3600 Util function to get template file name from key
**/
function getTemplate(key){
	return templateNameMap[key];
}

function createNewPageByType(_myType){
	//Create a Unique ID for the page
	var myID = guid();
	//Place a page element
	$(data).find("page").eq(currentPage).after($('<page id="'+ myID +'" layout="'+_myType+'" audio="null" prevPage="null" nextPage="null" visualtranscript="false" audiotranscript="false"></page>'));
	
	var currentChildrenLength = $(data).find("page").eq(currentPage).children("page").length;
	var newPage = currentPage + currentChildrenLength + 1;
	if(_myType != "branching" && _myType != "chaining" && _myType != "pathing"){
		//Place the page title element and transcript elements
		$(data).find("page").eq(newPage).append($("<title>"));
		var newPageTitle = new DOMParser().parseFromString('<title></title>',  "application/xml");
		var titleCDATA = newPageTitle.createCDATASection("New Page Title");
		$(data).find("page").eq(newPage).find("title").append(titleCDATA);
		$(data).find("page").eq(newPage).append($("<visualtranscript>"));
		var newVisualTranscript = new DOMParser().parseFromString('<visualtranscript></visualtranscript>',  "application/xml");
		var vTransCDATA = newVisualTranscript.createCDATASection("Visual transcript content");
		$(data).find("page").eq(newPage).find("visualtranscript").append(vTransCDATA);
		$(data).find("page").eq(newPage).append($("<audiotranscript>"));
		var newAudioTranscript = new DOMParser().parseFromString('<audiotranscript></audiotranscript>',  "application/xml");
		var aTransCDATA = newAudioTranscript.createCDATASection("Audio transcript content");
		$(data).find("page").eq(newPage).find("audiotranscript").append(aTransCDATA);
	}
	
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
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).attr("type", "group");
			break;
		case "completion":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);

			$(data).find("page").eq(newPage).append($("<passedresponse>"));
			var myPassedResponse = new DOMParser().parseFromString('<passedresponse></passedresponse>',  "text/xml");
			var myPassedResponseCDATA = myPassedResponse.createCDATASection("You received a passing score for this lesson.");
			$(data).find("page").eq(newPage).find("passedresponse").append(myPassedResponseCDATA);

			$(data).find("page").eq(newPage).append($("<failedresponse>"));
			var myFailedResponse = new DOMParser().parseFromString('<failedresponse></failedresponse>',  "text/xml");
			var myFailedResponseCDATA = myFailedResponse.createCDATASection("You did not receive a passing score for this lesson.");
			$(data).find("page").eq(newPage).find("failedresponse").append(myFailedResponseCDATA);			

			$(data).find("page").eq(newPage).attr("graded", "true");
			$(data).find("page").eq(newPage).attr("mandatory", "true");
			$(data).find("page").eq(newPage).attr("type", "completion");
			$(data).find("page").eq(newPage).attr("indexhide", "false");
			$(data).find("page").eq(newPage).attr("retainscore", "false");
			$(data).find("page").eq(newPage).attr("subs", "null");
			$(data).find("page").eq(newPage).attr("poster", "null");
			$(data).find("page").eq(newPage).attr("popup", "");
			$(data).find("page").eq(newPage).attr("popcaps", " ");
			$(data).find("page").eq(newPage).attr("popalt", " ");
			$(data).find("page").eq(newPage).attr("img", "defaultTop.png");
			$(data).find("page").eq(newPage).attr("w", "350");
			$(data).find("page").eq(newPage).attr("h", "260");
			$(data).find("page").eq(newPage).attr("enlarge", "");
			$(data).find("page").eq(newPage).attr("controlType", "bar");
			$(data).find("page").eq(newPage).attr("autoplay", "false");
			$(data).find("page").eq(newPage).attr("autonext", "false");
			$(data).find("page").eq(newPage).attr("alt", "image description");
			$(data).find("page").eq(newPage).attr("mediaLinkType", "");
			$(data).find("page").eq(newPage).attr("objectItemId", "undefined");
			$(data).find("page").eq(newPage).attr("objective", "undefined");
			$(data).find("page").eq(newPage).attr("poploop", "true");
			$(data).find("page").eq(newPage).attr("withmedia", "false");
			break;
		case "textOnly":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("type", "static");
			break;
		case "graphicOnly":
			$(data).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).attr("img", "defaultTop.png");
			$(data).find("page").eq(newPage).attr("popup", "");
			$(data).find("page").eq(newPage).attr("popcaps", "");
			$(data).find("page").eq(newPage).attr("enlarge", "");
			$(data).find("page").eq(newPage).attr("alt", "image description");
			$(data).find("page").eq(newPage).attr("poploop", "true");
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("galTransType", "elastic");
			break;
		case "top":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).attr("img", "defaultTop.png");
			$(data).find("page").eq(newPage).attr("popup", "");
			$(data).find("page").eq(newPage).attr("popcaps", "");
			$(data).find("page").eq(newPage).attr("enlarge", "");
			$(data).find("page").eq(newPage).attr("alt", "image description");
			$(data).find("page").eq(newPage).attr("poploop", "true");
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("galTransType", "elastic");
			break;
		case "left":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).attr("img", "defaultLeft.png");
			$(data).find("page").eq(newPage).attr("popup", "");
			$(data).find("page").eq(newPage).attr("popcaps", "");
			$(data).find("page").eq(newPage).attr("enlarge", "");
			$(data).find("page").eq(newPage).attr("alt", "image description");
			$(data).find("page").eq(newPage).attr("poploop", "true");
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("galTransType", "elastic");
			break;
		case "right":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).attr("img", "defaultLeft.png");
			$(data).find("page").eq(newPage).attr("popup", "");
			$(data).find("page").eq(newPage).attr("popcaps", "");
			$(data).find("page").eq(newPage).attr("enlarge", "");
			$(data).find("page").eq(newPage).attr("alt", "image description");
			$(data).find("page").eq(newPage).attr("poploop", "true");
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("galTransType", "elastic");
			break;
		case "bottom":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).attr("img", "defaultTop.png");
			$(data).find("page").eq(newPage).attr("popup", "");
			$(data).find("page").eq(newPage).attr("popcaps", "");
			$(data).find("page").eq(newPage).attr("enlarge", "");
			$(data).find("page").eq(newPage).attr("alt", "image description");
			$(data).find("page").eq(newPage).attr("poploop", "true");
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("galTransType", "elastic");
			break;
		case "sidebar":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).append($("<sidebar>"));
			var newSidebarContent = new DOMParser().parseFromString('<sidebar></sidebar>',  "text/xml");
			var sidebarCDATA = newSidebarContent.createCDATASection("<p>New Page Sidebar</p>");
			$(data).find("page").eq(newPage).find("sidebar").append(sidebarCDATA);
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("type", "static");
			break;
		case "branching":
			var tempID = guid();
			$(data).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Branch Page Introduction");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("title").append(titleCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("sidebar").append(sidebarCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<option>"));
			var option = new DOMParser().parseFromString('<option></option>', "text/xml");
			var optionCDATA = option.createCDATASection("This Page");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("option").append(optionCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(0).find("option").first().attr("id", tempID);
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("id", guid());
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("success", "false");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("pathcomplete", "false");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("layout", "textOnly");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("img", "defaultLeft.png");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("galTransType", "elastic");
			
			$(data).find("page").eq(newPage).find("branch").eq(0).find("option").attr("id", tempID);
			$(data).find("page").eq(newPage).attr("graded", "false");
			$(data).find("page").eq(newPage).attr("mandatory", "false");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("type", "static");
			break;
		case "pathing":
			$(data).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Pathing Home");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("title").append(titleCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Path Content");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("sidebar").append(sidebarCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<option>"));
			var path1Guid = guid();
			$(data).find("page").eq(newPage).find("branch").eq(0).find("option").attr("id", path1Guid);
			$(data).find("page").eq(newPage).find("branch").eq(0).find("option").attr("path", "1");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("option").attr("img", "");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("galTransType", "elastic");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("option").attr("active", "false");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("option").attr("altbtntitle", "");

			$(data).find("page").eq(newPage).find("branch").eq(0).attr("id", guid());
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("layout", "textOnly");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("img", "defaultLeft.png");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("pathid", "0");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("pathtype", "home");

			//path 1
			$(data).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(data).find("page").eq(newPage).find("branch").eq(1).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Path Page 1");
			$(data).find("page").eq(newPage).find("branch").eq(1).find("title").append(titleCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(1).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Path Content");
			$(data).find("page").eq(newPage).find("branch").eq(1).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("branch").eq(1).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(1).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(data).find("page").eq(newPage).find("branch").eq(1).find("sidebar").append(sidebarCDATA);

			$(data).find("page").eq(newPage).find("branch").eq(1).attr("id", path1Guid);
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("layout", "textOnly");
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("img", "defaultLeft.png");
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("galTransType", "elastic");
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("pathid", "1");
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("pathtype", "branch");
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("pathtimg", "");

			$(data).find("page").eq(newPage).attr("graded", "false");
			$(data).find("page").eq(newPage).attr("mandatory", "false");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("type", "static");
			break;			
		case "chaining":
			//intro
			$(data).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Chaining Introduction");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("title").append(titleCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(0).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(data).find("page").eq(newPage).find("branch").eq(0).find("sidebar").append(sidebarCDATA);

			$(data).find("page").eq(newPage).find("branch").eq(0).attr("id", guid());
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("success", "false");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("pathcomplete", "false");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("layout", "textOnly");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("img", "defaultLeft.png");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("galTransType", "elastic");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("stepnumber", "0");
			$(data).find("page").eq(newPage).find("branch").eq(0).attr("steptype", "intro");
			
			//overview
			$(data).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(data).find("page").eq(newPage).find("branch").eq(1).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Chaining Overview");
			$(data).find("page").eq(newPage).find("branch").eq(1).find("title").append(titleCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(1).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(data).find("page").eq(newPage).find("branch").eq(1).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(1).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("branch").eq(1).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(1).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(data).find("page").eq(newPage).find("branch").eq(1).find("sidebar").append(sidebarCDATA);

			$(data).find("page").eq(newPage).find("branch").eq(1).attr("id", guid());
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("success", "false");
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("pathcomplete", "false");
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("layout", "textOnly");
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("img", "defaultLeft.png");
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("galTransType", "elastic");
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("stepnumber", "0");
			$(data).find("page").eq(newPage).find("branch").eq(1).attr("steptype", "overview");	

			//summary - success and pathcomplete are always true for summary
			$(data).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(data).find("page").eq(newPage).find("branch").eq(2).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Chaining Summary");
			$(data).find("page").eq(newPage).find("branch").eq(2).find("title").append(titleCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(2).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(data).find("page").eq(newPage).find("branch").eq(2).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(2).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("branch").eq(2).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(2).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(data).find("page").eq(newPage).find("branch").eq(2).find("sidebar").append(sidebarCDATA);

			$(data).find("page").eq(newPage).find("branch").eq(2).attr("id", guid());
			$(data).find("page").eq(newPage).find("branch").eq(2).attr("success", "true");
			$(data).find("page").eq(newPage).find("branch").eq(2).attr("pathcomplete", "true");
			$(data).find("page").eq(newPage).find("branch").eq(2).attr("layout", "textOnly");
			$(data).find("page").eq(newPage).find("branch").eq(2).attr("img", "defaultLeft.png");
			$(data).find("page").eq(newPage).find("branch").eq(2).attr("galTransType", "elastic");
			$(data).find("page").eq(newPage).find("branch").eq(2).attr("stepnumber", "0");
			$(data).find("page").eq(newPage).find("branch").eq(2).attr("steptype", "summary");

			//step1 teach
			$(data).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(data).find("page").eq(newPage).find("branch").eq(3).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Chaining Step 1 teach");
			$(data).find("page").eq(newPage).find("branch").eq(3).find("title").append(titleCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(3).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(data).find("page").eq(newPage).find("branch").eq(3).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(3).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("branch").eq(3).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(3).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(data).find("page").eq(newPage).find("branch").eq(3).find("sidebar").append(sidebarCDATA);

			$(data).find("page").eq(newPage).find("branch").eq(3).attr("id", guid());
			$(data).find("page").eq(newPage).find("branch").eq(3).attr("success", "false");
			$(data).find("page").eq(newPage).find("branch").eq(3).attr("pathcomplete", "false");
			$(data).find("page").eq(newPage).find("branch").eq(3).attr("layout", "textOnly");
			$(data).find("page").eq(newPage).find("branch").eq(3).attr("img", "defaultLeft.png");
			$(data).find("page").eq(newPage).find("branch").eq(3).attr("galTransType", "elastic");
			$(data).find("page").eq(newPage).find("branch").eq(3).attr("stepnumber", "1");
			$(data).find("page").eq(newPage).find("branch").eq(3).attr("steptype", "teach");

			//step1 practice
			$(data).find("page").eq(newPage).append($("<branch>"));
			var branch = new DOMParser().parseFromString('<branch></branch>',  "text/xml");
			$(data).find("page").eq(newPage).find("branch").eq(4).append($("<title>"));
			var title = new DOMParser().parseFromString('<title></title>', "text/xml");
			var titleCDATA = title.createCDATASection("Chaining Step 1 practice");
			$(data).find("page").eq(newPage).find("branch").eq(4).find("title").append(titleCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(4).append($("<content>"));
			var content = new DOMParser().parseFromString('<content></content>', "text/xml");
			var contentCDATA = content.createCDATASection("New Branch Content");
			$(data).find("page").eq(newPage).find("branch").eq(4).find("content").append(contentCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(4).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("My Caption");
			$(data).find("page").eq(newPage).find("branch").eq(4).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).find("branch").eq(4).append($("<sidebar>"));
			var sidebar = new DOMParser().parseFromString('<sidebar></sidebar>', "text/xml");
			var sidebarCDATA = content.createCDATASection("New sidebar Content");
			$(data).find("page").eq(newPage).find("branch").eq(4).find("sidebar").append(sidebarCDATA);

			$(data).find("page").eq(newPage).find("branch").eq(4).attr("id", guid());
			$(data).find("page").eq(newPage).find("branch").eq(4).attr("success", "false");
			$(data).find("page").eq(newPage).find("branch").eq(4).attr("pathcomplete", "false");
			$(data).find("page").eq(newPage).find("branch").eq(4).attr("layout", "textOnly");
			$(data).find("page").eq(newPage).find("branch").eq(4).attr("img", "defaultLeft.png");
			$(data).find("page").eq(newPage).find("branch").eq(4).attr("galTransType", "elastic");
			$(data).find("page").eq(newPage).find("branch").eq(4).attr("stepnumber", "1");
			$(data).find("page").eq(newPage).find("branch").eq(4).attr("steptype", "practice");													

			$(data).find("page").eq(newPage).attr("graded", "false");
			$(data).find("page").eq(newPage).attr("mandatory", "false");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("type", "static");
			break;			
		case "tabsOnly":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);

			$(data).find("page").eq(newPage).append($("<tab>"));
			var newTabContent1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA1 = newTabContent1.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(newPage).find("tab").eq(0).append(tabCDATA1);
			$(data).find("page").eq(newPage).find("tab").eq(0).attr("title", "tab1");
			$(data).find("page").eq(newPage).find("tab").eq(0).attr("id", "1");			

			$(data).find("page").eq(newPage).append($("<tab>"));
			var newTabContent2 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA2 = newTabContent2.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(newPage).find("tab").eq(1).append(tabCDATA2);
			$(data).find("page").eq(newPage).find("tab").eq(1).attr("title", "tab2");
			$(data).find("page").eq(newPage).find("tab").eq(1).attr("id", "2");					
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("clickall", "false");
			break;
		case "tabsLeft":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);

			$(data).find("page").eq(newPage).append($("<tab>"));
			var newTabContent1 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA1 = newTabContent1.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(newPage).find("tab").eq(0).append(tabCDATA1);
			$(data).find("page").eq(newPage).find("tab").eq(0).attr("title", "tab1");
			$(data).find("page").eq(newPage).find("tab").eq(0).attr("id", "1");				

			$(data).find("page").eq(newPage).append($("<tab>"));
			var newTabContent2 = new DOMParser().parseFromString('<tab></tab>',  "text/xml");
			var tabCDATA2 = newTabContent2.createCDATASection("<p>New Tab Content</p>");
			$(data).find("page").eq(newPage).find("tab").eq(1).append(tabCDATA2);
			$(data).find("page").eq(newPage).find("tab").eq(1).attr("title", "tab2");
			$(data).find("page").eq(newPage).find("tab").eq(1).attr("id", "2");				

			$(data).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("default caption");
			$(data).find("page").eq(newPage).find("caption").append(captionCDATA);
			$(data).find("page").eq(newPage).attr("poploop", "true");
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("img", "defaultLeft.png");
			$(data).find("page").eq(newPage).attr("alt", "image description");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("clickall", "false");
			break;
		case "revealRight":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);
			
			$(data).find("page").eq(newPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(data).find("page").eq(newPage).find("reveal").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Image Reveal Text Content 1</p>");
			$(data).find("page").eq(newPage).find("reveal").eq(0).find("content").append(option1CDATA);
			$(data).find("page").eq(newPage).find("reveal").eq(0).append($("<caption>"));
			var diffFeed1 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("reveal").eq(0).find("caption").append(difFeed1CDATA);
			$(data).find("page").eq(newPage).find("reveal").eq(0).attr("title", "default title");
			$(data).find("page").eq(newPage).find("reveal").eq(0).attr("img", "defaultReveal.png");
			$(data).find("page").eq(newPage).find("reveal").eq(0).attr("alt", "Default alt text");
			$(data).find("page").eq(newPage).find("reveal").eq(0).attr("label", "label text");
			
			$(data).find("page").eq(newPage).append($("<reveal>"));
			var option2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(data).find("page").eq(newPage).find("reveal").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("<p>New Image Reveal Text Content 2</p>");
			$(data).find("page").eq(newPage).find("reveal").eq(1).find("content").append(option2CDATA);
			$(data).find("page").eq(newPage).find("reveal").eq(1).append($("<caption>"));
			var diffFeed2 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("reveal").eq(1).find("caption").append(difFeed2CDATA);
			$(data).find("page").eq(newPage).find("reveal").eq(1).attr("img", "defaultReveal.png");
			$(data).find("page").eq(newPage).find("reveal").eq(1).attr("title", "default title");
			$(data).find("page").eq(newPage).find("reveal").eq(1).attr("alt", "Default alt text");
			$(data).find("page").eq(newPage).find("reveal").eq(1).attr("label", "label text");
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("interact", "click");
			$(data).find("page").eq(newPage).attr("w", "150");
			$(data).find("page").eq(newPage).attr("h", "150");
			$(data).find("page").eq(newPage).attr("labeled", "false");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("clickall", "false");

			break;

		case "flashcard":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click on each of the images below to discover more information:</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);
			
			$(data).find("page").eq(newPage).append($("<card><term/><definition/></card>"));
			var newFront1 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack1 = new DOMParser().parseFromString('<definition></definition>',  "text/xml");
			var frontCDATA1 = newFront1.createCDATASection("New Card Term");
			var backCDATA1 = newBack1.createCDATASection("New Card Definition");
			$(data).find("page").eq(newPage).find("card").eq(0).find("term").append(frontCDATA1);
			$(data).find("page").eq(newPage).find("card").eq(0).find("definition").append(backCDATA1);
			
			$(data).find("page").eq(newPage).append($("<card><term/><definition/></card>"));
			var newFront2 = new DOMParser().parseFromString('<term></term>',  "text/xml");
			var newBack2 = new DOMParser().parseFromString('<definition></definition>',  "text/xml");
			var frontCDATA2 = newFront2.createCDATASection("New Card Term");
			var backCDATA2 = newBack2.createCDATASection("New Card Definition");
			$(data).find("page").eq(newPage).find("card").eq(1).find("term").append(frontCDATA2);
			$(data).find("page").eq(newPage).find("card").eq(1).find("definition").append(backCDATA2);
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("mandatory", false);
			$(data).find("page").eq(newPage).attr("randomize", false);
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("clickall", "false");
			break;
			
		case "clickImage":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>New Page Content</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);
			
			$(data).find("page").eq(newPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(data).find("page").eq(newPage).find("reveal").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Image ClickImage Text Content 1</p>");
			$(data).find("page").eq(newPage).find("reveal").eq(0).find("content").append(option1CDATA);
			$(data).find("page").eq(newPage).find("reveal").eq(0).append($("<caption>"));
			var diffFeed1 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("reveal").eq(0).find("caption").append(difFeed1CDATA);
			$(data).find("page").eq(newPage).find("reveal").eq(0).attr("img", "defaultReveal.png");
			$(data).find("page").eq(newPage).find("reveal").eq(0).attr("alt", "Default alt text");
			$(data).find("page").eq(newPage).find("reveal").eq(0).attr("label", "label text");
			
			$(data).find("page").eq(newPage).append($("<reveal>"));
			var option2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(data).find("page").eq(newPage).find("reveal").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("<p>New Image ClickImage Text Content 2</p>");
			$(data).find("page").eq(newPage).find("reveal").eq(1).find("content").append(option2CDATA);
			$(data).find("page").eq(newPage).find("reveal").eq(1).append($("<caption>"));
			var diffFeed2 = new DOMParser().parseFromString('<caption></caption>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("reveal").eq(1).find("caption").append(difFeed2CDATA);
			$(data).find("page").eq(newPage).find("reveal").eq(1).attr("img", "defaultReveal.png");
			$(data).find("page").eq(newPage).find("reveal").eq(1).attr("alt", "Default alt text");
			$(data).find("page").eq(newPage).find("reveal").eq(1).attr("label", "label text");
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("interact", "click");
			$(data).find("page").eq(newPage).attr("w", "150");
			$(data).find("page").eq(newPage).attr("h", "150");
			$(data).find("page").eq(newPage).attr("labeled", "false");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("clickall", "false");
			break;
			
		case "clickListRevealText":
			$(data).find("page").eq(newPage).append($("<content>"));
			var newPageContent = new DOMParser().parseFromString('<content></content>',  "text/xml");
			var contentCDATA = newPageContent.createCDATASection("<p>Click each item in the list below to reveal information about each item.</p>");
			$(data).find("page").eq(newPage).find("content").append(contentCDATA);
			
			$(data).find("page").eq(newPage).append($("<reveal>"));
			var option1 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(data).find("page").eq(newPage).find("reveal").eq(0).append($("<title>"));
			var title1 = new DOMParser().parseFromString('<title></title>', "text/xml");
			var title1CDATA = title1.createCDATASection("Item 1");
			$(data).find("page").eq(newPage).find("reveal").eq(0).find("title").append(title1CDATA);
			
			$(data).find("page").eq(newPage).find("reveal").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("<p>New Reveal Text Content 1</p>");
			$(data).find("page").eq(newPage).find("reveal").eq(0).find("content").append(option1CDATA);
			
			$(data).find("page").eq(newPage).append($("<reveal>"));
			var option2 = new DOMParser().parseFromString('<reveal></reveal>',  "text/xml");
			$(data).find("page").eq(newPage).find("reveal").eq(1).append($("<title>"));
			var title2 = new DOMParser().parseFromString('<title></title>', "text/xml");
			var title2CDATA = title1.createCDATASection("Item 2");
			$(data).find("page").eq(newPage).find("reveal").eq(1).find("title").append(title2CDATA);
			
			$(data).find("page").eq(newPage).find("reveal").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content1.createCDATASection("<p>New Reveal Text Content 2</p>");
			$(data).find("page").eq(newPage).find("reveal").eq(1).find("content").append(option2CDATA);
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("interact", "click");
			$(data).find("page").eq(newPage).attr("type", "static");
			$(data).find("page").eq(newPage).attr("clickall", "false");
			break;
			
		case "questionBank":
			//PREPOPULATE A QUESTION BANK WITH TWO QUESTIONS
			//QUESTION 1
			$(data).find("page").eq(newPage).append($("<bankitem>"));
			var bankitem1 = new DOMParser().parseFromString('<bankitem></bankitem>',  "text/xml");
			
			$(data).find("page").eq(newPage).find("bankitem").eq(0).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input question 1.</p>");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("question").append(myQuestionCDATA);
			
			$(data).find("page").eq(newPage).find("bankitem").eq(0).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).find("content").append(option1CDATA);
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(0).attr("correct", "true");
			
			$(data).find("page").eq(newPage).find("bankitem").eq(0).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("False");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).find("content").append(option2CDATA);
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("option").eq(1).attr("correct", "false");
			
			$(data).find("page").eq(newPage).find("bankitem").eq(0).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(data).find("page").eq(newPage).find("bankitem").eq(0).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).find("bankitem").eq(0).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).find("bankitem").eq(0).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).find("feedback").append(myFeedbackCDATA);
			
			$(data).find("page").eq(newPage).find("bankitem").eq(0).attr("feedbacktype", "undifferentiated");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).attr("feedbackdisplay", "pop");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).attr("audio", "null");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).attr("btnText", "Submit");
			$(data).find("page").eq(newPage).find("bankitem").eq(0).attr("attempts", 1);
			$(data).find("page").eq(newPage).find("bankitem").eq(0).attr("randomize", false);
			$(data).find("page").eq(newPage).find("bankitem").eq(0).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).find("bankitem").eq(0).attr("objItemId", "undefined");
			
			//QUESTION 2
			$(data).find("page").eq(newPage).append($("<bankitem>"));
			var bankitem2 = new DOMParser().parseFromString('<bankitem></bankitem>',  "text/xml");
			
			$(data).find("page").eq(newPage).find("bankitem").eq(1).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input question 2.</p>");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("question").append(myQuestionCDATA);
			
			$(data).find("page").eq(newPage).find("bankitem").eq(1).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).find("content").append(option1CDATA);
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(0).attr("correct", "true");
			
			$(data).find("page").eq(newPage).find("bankitem").eq(1).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("False");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).find("content").append(option2CDATA);
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("option").eq(1).attr("correct", "false");
			
			$(data).find("page").eq(newPage).find("bankitem").eq(1).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(data).find("page").eq(newPage).find("bankitem").eq(1).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).find("bankitem").eq(1).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).find("bankitem").eq(1).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).find("feedback").append(myFeedbackCDATA);
			
			$(data).find("page").eq(newPage).find("bankitem").eq(1).attr("feedbacktype", "undifferentiated");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).attr("feedbackdisplay", "pop");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).attr("audio", "null");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).attr("btnText", "Submit");
			$(data).find("page").eq(newPage).find("bankitem").eq(1).attr("attempts", 1);
			$(data).find("page").eq(newPage).find("bankitem").eq(1).attr("randomize", false);
			$(data).find("page").eq(newPage).find("bankitem").eq(1).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).find("bankitem").eq(1).attr("objItemId", "undefined");
			
			//PAGE LEVEL VARS
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("graded", false);
			$(data).find("page").eq(newPage).attr("mandatory", true);
			$(data).find("page").eq(newPage).attr("type", "kc");
			$(data).find("page").eq(newPage).attr("showall", false);
			$(data).find("page").eq(newPage).attr("tocomplete", 1);
			
			//CURRENT VARS IN ACTIVE SESSION
			var userSelection_arr = [];
			var question_obj = new Object();
			question_obj.complete = false;
			question_obj.correct = null;
			question_obj.graded = false;
			question_obj.id = myID;
			question_obj.userAnswer = userSelection_arr;
			questionResponse_arr.push(question_obj);
			
			break;
		
		case "multipleChoice":
			$(data).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input a question.</p>");
			$(data).find("page").eq(newPage).find("question").append(myQuestionCDATA);
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(data).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(data).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(newPage).find("option").eq(0).attr("correct", "true");
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("False");
			$(data).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(data).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(data).find("page").eq(newPage).find("option").eq(1).attr("correct", "false");
			
			$(data).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(data).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(data).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(data).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(data).find("page").eq(newPage).attr("audio", "null");
			$(data).find("page").eq(newPage).attr("btnText", "Submit");
			$(data).find("page").eq(newPage).attr("poploop", "true");
			$(data).find("page").eq(newPage).attr("attempts", 2);
			$(data).find("page").eq(newPage).attr("graded", false);
			$(data).find("page").eq(newPage).attr("mandatory", true);
			$(data).find("page").eq(newPage).attr("randomize", false);
			$(data).find("page").eq(newPage).attr("timed", false);
			$(data).find("page").eq(newPage).attr("timerlength", "10"); 
			$(data).find("page").eq(newPage).attr("type", "kc");
			
			var userSelection_arr = [];
			var question_obj = new Object();
			question_obj.complete = false;
			question_obj.correct = null;
			question_obj.graded = false;
			question_obj.id = myID;
			question_obj.userAnswer = userSelection_arr;
			questionResponse_arr.push(question_obj);
			
			break;
		
		case "multipleChoiceFancy":
			$(data).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input a question.</p>");
			$(data).find("page").eq(newPage).find("question").append(myQuestionCDATA);
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("Answer Option 1");
			$(data).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(data).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(newPage).find("option").eq(0).attr("correct", "true");
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("Answer Option 2");
			$(data).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(data).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed2.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(data).find("page").eq(newPage).find("option").eq(1).attr("correct", "false");
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option3 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("option").eq(2).append($("<content>"));
			var content3 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option3CDATA = content3.createCDATASection("Answer Option 3");
			$(data).find("page").eq(newPage).find("option").eq(2).find("content").append(option3CDATA);
			$(data).find("page").eq(newPage).find("option").eq(2).append($("<diffeed>"));
			var diffFeed3 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed3CDATA = diffFeed3.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("option").eq(2).find("diffeed").append(difFeed3CDATA);
			$(data).find("page").eq(newPage).find("option").eq(2).attr("correct", "false");
			
			$(data).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(data).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(data).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(data).find("page").eq(newPage).attr("img", "defaultQuestion.png");
			$(data).find("page").eq(newPage).attr("alt", "input image description");
			$(data).find("page").eq(newPage).attr("visualtranscript", "false");
			$(data).find("page").eq(newPage).attr("audiotranscript", "false");
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(data).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(data).find("page").eq(newPage).attr("audio", "null");
			$(data).find("page").eq(newPage).attr("btnText", "Submit");
			$(data).find("page").eq(newPage).attr("poploop", "true");
			$(data).find("page").eq(newPage).attr("attempts", 2);
			$(data).find("page").eq(newPage).attr("graded", false);
			$(data).find("page").eq(newPage).attr("mandatory", true);
			$(data).find("page").eq(newPage).attr("randomize", false);
			$(data).find("page").eq(newPage).attr("timed", false);
			$(data).find("page").eq(newPage).attr("timerlength", "10"); 
			$(data).find("page").eq(newPage).attr("type", "kc");
			
			var userSelection_arr = [];
			var question_obj = new Object();
			question_obj.complete = false;
			question_obj.correct = null;
			question_obj.graded = false;
			question_obj.id = myID;
			question_obj.userAnswer = userSelection_arr;
			questionResponse_arr.push(question_obj);
			
			break;
			
		case "multipleChoiceMedia":
			$(data).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input a question.</p>");
			$(data).find("page").eq(newPage).find("question").append(myQuestionCDATA);
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("True");
			$(data).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(data).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(newPage).find("option").eq(0).attr("correct", "true");
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("False");
			$(data).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(data).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(data).find("page").eq(newPage).find("option").eq(1).attr("correct", "false");
			
			$(data).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(data).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(data).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(data).find("page").eq(newPage).append($("<caption>"));
			var newPageCaption = new DOMParser().parseFromString('<caption></caption>',  "text/xml");
			var captionCDATA = newPageCaption.createCDATASection("default caption");
			$(data).find("page").eq(newPage).find("caption").append(captionCDATA);

			$(data).find("page").eq(newPage).attr("img", "defaultLeft.png");
			$(data).find("page").eq(newPage).attr("galTransType", "elastic");
			$(data).find("page").eq(newPage).attr("alt", "image description");
			$(data).find("page").eq(newPage).attr("poploop", "true");
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(data).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(data).find("page").eq(newPage).attr("audio", "null");
			$(data).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(data).find("page").eq(newPage).attr("attempts", 2);
			$(data).find("page").eq(newPage).attr("graded", false);
			$(data).find("page").eq(newPage).attr("mandatory", true);
			$(data).find("page").eq(newPage).attr("randomize", false);
			$(data).find("page").eq(newPage).attr("type", "kc");
			
			var userSelection_arr = [];
			var question_obj = new Object();
			question_obj.complete = false;
			question_obj.correct = null;
			question_obj.graded = false;
			question_obj.id = myID;
			question_obj.userAnswer = userSelection_arr;
			questionResponse_arr.push(question_obj);
			
			break;
			
		case "textInput":
			$(data).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			$(data).find("page").eq(newPage).find("question").eq(0).attr("attempts", 1);
			$(data).find("page").eq(currentPage).find("question").eq(0).attr("autocomplete", false);
			//content
			$(data).find("page").eq(newPage).find("question").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var question1CDATA = content1.createCDATASection("<p>Input a question.</p>");
			$(data).find("page").eq(newPage).find("question").eq(0).find("content").append(question1CDATA);
			//acceptedresponse
			$(data).find("page").eq(newPage).find("question").eq(0).append($("<acceptedresponse>"));
			var acceptedResponse1 = new DOMParser().parseFromString('<acceptedresponse></acceptedresponse>', "text/xml");
			var acceptedResponse1CDATA = acceptedResponse1.createCDATASection("Yes");
			$(data).find("page").eq(newPage).find("question").eq(0).find("acceptedresponse").append(acceptedResponse1CDATA);
			//diffeed
			$(data).find("page").eq(newPage).find("question").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("question").eq(0).find("diffeed").append(difFeed1CDATA);
			//correctresponse
			$(data).find("page").eq(newPage).find("question").eq(0).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(newPage).find("question").eq(0).find("correctresponse").append(myCorrectResponseCDATA);
			
			// $(data).find("page").eq(newPage).append($("<incorrectresponse>"));
			// var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			// var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			// $(data).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			// $(data).find("page").eq(newPage).append($("<feedback>"));
			// var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			// var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			// $(data).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("feedbacktype", "differentiated");
			$(data).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(data).find("page").eq(newPage).attr("audio", "null");
			$(data).find("page").eq(newPage).attr("btnText", "Submit");
			
			//$(data).find("page").eq(newPage).attr("attempts", 2);
			$(data).find("page").eq(newPage).attr("graded", false);
			$(data).find("page").eq(newPage).attr("mandatory", true);
			$(data).find("page").eq(newPage).attr("randomize", false);
			$(data).find("page").eq(newPage).attr("type", "kc");
			
			var userSelection_arr = [];
			var question_obj = new Object();
			question_obj.complete = false;
			question_obj.correct = null;
			question_obj.graded = false;
			question_obj.id = myID;
			question_obj.userAnswer = userSelection_arr;
			question_obj.textInputQuestions = [];
			questionResponse_arr.push(question_obj);
			
			break;	

		case "matching":
			$(data).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Match the items on the left to the items on the right:</p>");
			$(data).find("page").eq(newPage).find("question").append(myQuestionCDATA);
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option1CDATA = option1.createCDATASection("Option1");
			$(data).find("page").eq(newPage).find("option").eq(0).append(option1CDATA);
			$(data).find("page").eq(newPage).find("option").eq(0).attr("correct", "A");
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			var option2CDATA = option2.createCDATASection("Option2");
			$(data).find("page").eq(newPage).find("option").eq(1).append(option2CDATA);
			$(data).find("page").eq(newPage).find("option").eq(1).attr("correct", "B");
			
			$(data).find("page").eq(newPage).append($("<answer>"));
			var answer1 = new DOMParser().parseFromString('<answer></answer>', "text/xml");
			$(data).find("page").eq(newPage).find("answer").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			$(data).find("page").eq(newPage).find("answer").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var answer1CDATA = content1.createCDATASection("Answer 1");
			$(data).find("page").eq(newPage).find("answer").eq(0).find("content").append(answer1CDATA);
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("answer").eq(0).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(newPage).find("answer").eq(0).attr("correct", "A");
			$(data).find("page").eq(newPage).find("answer").eq(0).attr("img", "defaultReveal.png");
			
			$(data).find("page").eq(newPage).append($("<answer>"));
			var answer2 = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
			$(data).find("page").eq(newPage).find("answer").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			$(data).find("page").eq(newPage).find("answer").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var answer2CDATA = content2.createCDATASection("Answer 2");
			$(data).find("page").eq(newPage).find("answer").eq(1).find("content").append(answer2CDATA);
			var difFeed2CDATA = diffFeed2.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("answer").eq(1).find("diffeed").append(difFeed2CDATA);
			$(data).find("page").eq(newPage).find("answer").eq(1).attr("correct", "B");
			$(data).find("page").eq(newPage).find("answer").eq(1).attr("img", "defaultReveal.png");
			
			$(data).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(data).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(data).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(data).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(data).find("page").eq(newPage).attr("audio", "null");
			$(data).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(data).find("page").eq(newPage).attr("attempts", 2);
			$(data).find("page").eq(newPage).attr("graded", false);
			$(data).find("page").eq(newPage).attr("mandatory", true);
			$(data).find("page").eq(newPage).attr("randomize", false);
			$(data).find("page").eq(newPage).attr("type", "kc");
			
			var userSelection_arr = [];
			
			var question_obj = new Object();
			question_obj.complete = false;
			question_obj.correct = null;
			question_obj.graded = false;
			question_obj.id = $(data).find('page').eq(newPage).attr('id');
			question_obj.userAnswer = userSelection_arr;
			questionResponse_arr.push(question_obj);
			
			break;
			
		case "categories":
			$(data).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Match the items on the left to the items on the right:</p>");
			$(data).find("page").eq(newPage).find("question").append(myQuestionCDATA);
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("Category question 1");
			$(data).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(data).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(newPage).find("option").eq(0).attr("correct", "A");
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("Option2");
			$(data).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(data).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(data).find("page").eq(newPage).find("option").eq(1).attr("correct", "B");
			
			$(data).find("page").eq(newPage).append($("<answer>"));
			var answer1 = new DOMParser().parseFromString('<answer></answer>', "text/xml");
			$(data).find("page").eq(newPage).find("answer").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var answer1CDATA = content1.createCDATASection("Answer 1");
			$(data).find("page").eq(newPage).find("answer").eq(0).find("content").append(answer1CDATA);
			$(data).find("page").eq(newPage).find("answer").eq(0).attr("correct", "A");
			
			$(data).find("page").eq(newPage).append($("<answer>"));
			var answer2 = new DOMParser().parseFromString('<answer></answer>',  "text/xml");
			$(data).find("page").eq(newPage).find("answer").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var answer2CDATA = content2.createCDATASection("Answer 2");
			$(data).find("page").eq(newPage).find("answer").eq(1).find("content").append(answer2CDATA);
			$(data).find("page").eq(newPage).find("answer").eq(1).attr("correct", "B");
			
			$(data).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(data).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(data).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(data).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(data).find("page").eq(newPage).attr("audio", "null");
			$(data).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(data).find("page").eq(newPage).attr("attempts", 2);
			$(data).find("page").eq(newPage).attr("cycle", false);
			$(data).find("page").eq(newPage).attr("graded", false);
			$(data).find("page").eq(newPage).attr("mandatory", true);
			$(data).find("page").eq(newPage).attr("randomize", false);
			$(data).find("page").eq(newPage).attr("type", "kc");
			
			var userSelection_arr = [];
			var question_obj = new Object();
			question_obj.complete = false;
			question_obj.correct = null;
			question_obj.graded = false;
			question_obj.id = $(data).find('page').eq(newPage).attr('id');
			question_obj.userAnswer = userSelection_arr;
			questionResponse_arr.push(question_obj);
			
			break;
			
		case "sequence":
			$(data).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Place the items below, into the proper order:</p>");
			$(data).find("page").eq(newPage).find("question").append(myQuestionCDATA);
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option1 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("option").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option1CDATA = content1.createCDATASection("Sequence Item 1");
			$(data).find("page").eq(newPage).find("option").eq(0).find("content").append(option1CDATA);
			$(data).find("page").eq(newPage).find("option").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("option").eq(0).find("diffeed").append(difFeed1CDATA);
			$(data).find("page").eq(newPage).find("option").eq(0).attr("correct", "1");
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option2 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("option").eq(1).append($("<content>"));
			var content2 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option2CDATA = content2.createCDATASection("Sequence Item 2");
			$(data).find("page").eq(newPage).find("option").eq(1).find("content").append(option2CDATA);
			$(data).find("page").eq(newPage).find("option").eq(1).append($("<diffeed>"));
			var diffFeed2 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed2CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("option").eq(1).find("diffeed").append(difFeed2CDATA);
			$(data).find("page").eq(newPage).find("option").eq(1).attr("correct", "2");
			
			$(data).find("page").eq(newPage).append($("<option>"));
			var option3 = new DOMParser().parseFromString('<option></option>',  "text/xml");
			$(data).find("page").eq(newPage).find("option").eq(2).append($("<content>"));
			var content3 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var option3CDATA = content3.createCDATASection("Sequence Item 3");
			$(data).find("page").eq(newPage).find("option").eq(2).find("content").append(option3CDATA);
			$(data).find("page").eq(newPage).find("option").eq(2).append($("<diffeed>"));
			var diffFeed3 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed3CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("option").eq(2).find("diffeed").append(difFeed3CDATA);
			$(data).find("page").eq(newPage).find("option").eq(2).attr("correct", "3");
			
			$(data).find("page").eq(newPage).append($("<attemptresponse>"));
			var myAttemptResponse = new DOMParser().parseFromString('<attemptresponse></attemptresponse>',  "text/xml");
			var myAttemptResponseCDATA = myAttemptResponse.createCDATASection("Please try again.");
			$(data).find("page").eq(newPage).find("attemptresponse").append(myAttemptResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<incorrectresponse>"));
			var myIncorrectResponse = new DOMParser().parseFromString('<incorrectresponse></incorrectresponse>',  "text/xml");
			var myIncorrectResponseCDATA = myIncorrectResponse.createCDATASection("That is not correct.");
			$(data).find("page").eq(newPage).find("incorrectresponse").append(myIncorrectResponseCDATA);
			
			$(data).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); $(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("feedbacktype", "undifferentiated");
			$(data).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(data).find("page").eq(newPage).attr("audio", "null");
			$(data).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(data).find("page").eq(newPage).attr("attempts", 2);
			$(data).find("page").eq(newPage).attr("graded", false);
			$(data).find("page").eq(newPage).attr("mandatory", true);
			$(data).find("page").eq(newPage).attr("randomize", false);
			$(data).find("page").eq(newPage).attr("type", "kc");
			
			var userSelection_arr = [];
			
			var question_obj = new Object();
			question_obj.complete = false;
			question_obj.correct = null;
			question_obj.graded = false;
			question_obj.id = $(data).find('page').eq(newPage).attr('id');
			question_obj.userAnswer = userSelection_arr;
			questionResponse_arr.push(question_obj);
			
			break;

		case "essayCompare":
			$(data).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input a question.</p>");
			$(data).find("page").eq(newPage).find("question").append(myQuestionCDATA);
							
			$(data).find("page").eq(newPage).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("Expert response goes here...");
			$(data).find("page").eq(newPage).find("correctresponse").append(myCorrectResponseCDATA);
					
			$(data).find("page").eq(newPage).append($("<feedback>"));
			var myFeedback = new DOMParser().parseFromString('<feedback></feedback>',  "text/xml");
			var myFeedbackCDATA = myFeedback.createCDATASection("Input your feedback here.");
			$(data).find("page").eq(newPage).find("feedback").append(myFeedbackCDATA);
			
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(data).find("page").eq(newPage).attr("audio", "null");
			$(data).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(data).find("page").eq(newPage).attr("graded", false);
			$(data).find("page").eq(newPage).attr("mandatory", true);
			$(data).find("page").eq(newPage).attr("type", "kc");
			
			var userSelection_arr = [];
			var question_obj = new Object();
			question_obj.complete = false;
			question_obj.correct = null;
			question_obj.graded = false;
			question_obj.id = myID;
			question_obj.userAnswer = userSelection_arr;
			questionResponse_arr.push(question_obj);
			
			break;

		case "slider":
			$(data).find("page").eq(newPage).append($("<question>"));
			var myQuestion = new DOMParser().parseFromString('<question></question>',  "text/xml");
			var myQuestionCDATA = myQuestion.createCDATASection("<p>Input instructions or a question.</p>");
			$(data).find("page").eq(newPage).find("question").append(myQuestionCDATA);

			$(data).find("page").eq(newPage).append($("<slider>"));
			var mySlider = new DOMParser().parseFromString('<slider></slider>',  "text/xml");

			$(data).find("page").eq(newPage).find("slider").eq(0).attr("max", 10);
			$(data).find("page").eq(newPage).find("slider").eq(0).attr("min", 0);
			$(data).find("page").eq(newPage).find("slider").eq(0).attr("step", 1);
			$(data).find("page").eq(newPage).find("slider").eq(0).attr("start", 5);
			$(data).find("page").eq(newPage).find("slider").eq(0).attr("orientation", "horizontal");
			$(data).find("page").eq(newPage).find("slider").eq(0).attr("attempts", 1);
			$(data).find("page").eq(newPage).find("slider").eq(0).attr("correctanswer", 5);
			//content
			$(data).find("page").eq(newPage).find("slider").eq(0).append($("<content>"));
			var content1 = new DOMParser().parseFromString('<content></content>', "text/xml");
			var question1CDATA = content1.createCDATASection("Input a question.");
			$(data).find("page").eq(newPage).find("slider").eq(0).find("content").append(question1CDATA);
			//diffeed
			$(data).find("page").eq(newPage).find("slider").eq(0).append($("<diffeed>"));
			var diffFeed1 = new DOMParser().parseFromString('<diffeed></diffeed>', "text/xml");
			var difFeed1CDATA = diffFeed1.createCDATASection("Input unique option feedback.");
			$(data).find("page").eq(newPage).find("slider").eq(0).find("diffeed").append(difFeed1CDATA);
			//correctresponse
			$(data).find("page").eq(newPage).find("slider").eq(0).append($("<correctresponse>"));
			var myCorrectResponse = new DOMParser().parseFromString('<correctresponse></correctresponse>',  "text/xml");
			var myCorrectResponseCDATA = myCorrectResponse.createCDATASection("That is correct!");
			$(data).find("page").eq(newPage).find("slider").eq(0).find("correctresponse").append(myCorrectResponseCDATA);
					
			$(data).find("page").eq(newPage).attr("objective", "undefined"); 
			$(data).find("page").eq(newPage).attr("objItemId", "undefined");
			$(data).find("page").eq(newPage).attr("feedbacktype", "differentiated");
			$(data).find("page").eq(newPage).attr("feedbackdisplay", "pop");
			$(data).find("page").eq(newPage).attr("audio", "null");
			$(data).find("page").eq(newPage).attr("btnText", "Submit");
			
			$(data).find("page").eq(newPage).attr("graded", false);
			$(data).find("page").eq(newPage).attr("mandatory", true);
			$(data).find("page").eq(newPage).attr("type", "kc");
				
			var userSelection_arr = [];
			var question_obj = new Object();
			question_obj.complete = false;
			question_obj.correct = null;
			question_obj.graded = false;
			question_obj.id = myID;
			question_obj.userAnswer = userSelection_arr;
			questionResponse_arr.push(question_obj);
			
			break;
	}
	newPageAdded = true;
	sendUpdateWithRefresh();
}
