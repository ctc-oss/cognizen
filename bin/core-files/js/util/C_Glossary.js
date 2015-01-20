/*
 *  	C_Glossary
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses glossary functionality for cognizen
 *  	Version: 0.5
 *		Date Created: 10/19/13
 *		Created by: Philip Double
 *		Date Updated: 1/6/15
 *		Updated by: Ryan Dingman
 *		History: 	Updates to make glossary work on tablets
 					Moved all glossary functionality into its own js file.
 *		Todo: 	- Turn this into a plugin.  This did reside in C_Engine which was becoming unruly.
 *				- Optimize code.
 				- Needs different functionality for phones, where the screen is too small for the current two pane setup.
 */

var glossary = false;
var glossaryState = false;
var courseGlossary = false;
var glossaryClosePos = 0;
var glossaryClosePosMobile = 0;
var glossaryTabPos = 0;
var totalGlossary = 0;


/************************************************************************************************
Function: 		checkGlossary
Param: 			none
Description:	Checks to see if this app has glossary turned on - if yes then build it.
************************************************************************************************/
function checkGlossary(){
	if($(data).find('glossary').attr('courseGlossary') == undefined){
		$(data).find('glossary').attr('courseGlossary', 'false');
	}
	if($(data).find('glossary').attr('courseGlossary') == "true"){
		courseGlossary = true;
	}
	if(($(data).find('glossary').attr('value') == "true") && !isMobilePhone){  // needs to be rewritten for phones, disable on phones for now
		glossary = true;
		var msg = "<div id='glossaryPane' class='pane'>";
			msg += "<div id='glossaryTab' class='paneTab' role='button' aria-label='click here to toggle the glossary currently closed' title='click here to toggle the glossary'/>";
			msg += "<div id='glossaryTerms' class='glossaryTerms'></div>";
			msg += "<div id='glossaryContent' class='glossaryContent'>";
			msg += "<div id='glossaryClose' title='click here to close the glossary' tabindex='1' role='button' aria-label='click here to close glossary'/>";
			msg += "<div id='glossaryDef' tabindex='0'><span style='font-size: 80%; font-style: italic;'>Click on a term at left to view the definition.</span></div></div></div>";
			
		$('#panes').append(msg);
		globalAccess_arr.push($('#glossaryTab'));
		$('#glossaryTab').click(toggleGlossary);
		$('#glossaryClose').click(toggleGlossary);

		if(!isMobile){
			$('#glossaryTab').tooltip();  // don't attach tooltip on mobile devices
			$('#glossaryClose').tooltip();  // don't attach tooltip on mobile devices
		}
	
		if(mode == "edit"){
			//Add glossary item button
			$("#glossaryContent").append("<div id='addGlossaryItem'>Add New Term</div>");
			$("#addGlossaryItem").button().click(function(){
				addGlossaryTerm();
			});
		}
		addGlossary();
	}else{
		$("#glossaryPane").remove();
	}
}

/************************************************************************************************
Function: 		updateGlossary
Param: 			none
Description:	Callback from the Socket to update the xml when the glossary has been updated.
************************************************************************************************/
function updateGlossary(){
	$.ajax({
	    	type: "GET",
	    	url: "xml/content.xml",
	    	dataType: "xml",
	    	async: false,
	    	success: function(_data){
	    		data = _data;
	    		$("#glossaryTerms").empty();
	    		$("#glossaryDef").html("");
		    	addGlossary();
		},
		error: function(){
	    	alert("unable to load content.xml in updateIndex")
	    }
	});
}

function updateCourseGlossary(){
	$('.C_LoaderText').text("Loading Course.xml");
	var loc = window.location.pathname;
	var dir = loc.substring(0, loc.lastIndexOf('/'));
	var courseXMLPath = unescape(dir + '/../course.xml');
	$.ajax({
		type: "GET",
		url: courseXMLPath,
		dataType: "xml",
		async: false,
		success: function(_data){
	    		courseData = _data;
	    		$("#glossaryTerms").empty();
	    		$("#glossaryDef").html("");
		    	addGlossary();
		   },
		error: function(){
			alert("unable to load course.xml")
		}
	});
}

function compare(a,b) {
  if (a.term < b.term)
     return -1;
  if (a.term > b.term)
    return 1;
  return 0;
}

/************************************************************************************************
Function: 		addGlossary
Param: 			none
Description:	Called when the glossary is built and when the glossary updates complete.
************************************************************************************************/
function addGlossary(){
	var glossarySource;
	if(courseGlossary){
		glossarySource = $(courseData);
	}else{
		glossarySource = $(data);
	}

	totalGlossary = glossarySource.find('glossaryitem').length;
	
	glossaryItem_arr = [];
	glossary_arr = [];
	var thisTerm;
	var termID;
	
	//Alphabatize
	for(var j = 0; j < totalGlossary; j++){
		var tmpObj = new Object();
		
		tmpObj.term = glossarySource.find('glossaryitem').eq(j).find('term').text();
		tmpObj.definition = glossarySource.find('glossaryitem').eq(j).find('content').text();
		
		tmpObj.id = j;
		glossary_arr.push(tmpObj);
	}
	
	glossary_arr.sort(compare);
	
	
	//Display
	for(var i = 0; i < glossary_arr.length; i++){
		thisTerm = "term" + i;
		termID = "#"+thisTerm;
		$("#glossaryTerms").append("<div id='"+thisTerm+"' class='glossaryItem' role='button' tabindex='1' >"+glossary_arr[i].term+"</div>");
		$(termID).data("definition", glossary_arr[i].definition);
		$(termID).data("myID", glossary_arr[i].id);
		$(termID).click(function(){
			if(hoverSubNav == false){
				$("#glossaryDef").html("<p class='term'><span class='label'>Term: </span>" + $(this).text() + "</p><p class='definition'><span class='label'>Definition: </span>" + $(this).data("definition") + "</p>");
				$("#glossaryDef").focus();
			}
		}).hover(function(){
			$(this).addClass("glossaryItemHover");
		},
		function(){
			$(this).removeClass("glossaryItemHover");
		});
		glossaryItem_arr.push("#" + thisTerm);
	}
	
	if(mode == "edit"){
		for(var i = 0; i < glossaryItem_arr.length; i++){
			addEditGlossaryRollovers($(glossaryItem_arr[i]));
		}
	}
	
	if(!indexState){
		accHideGlossary();
	}
}


/************************************************************************************************
Function: 		addEditGlossaryRollovers
Param: 			myItem = The term to attach the rollover functionality to.
Description:	Called when a user rolls over an existing glossary item.
************************************************************************************************/
function addEditGlossaryRollovers(myItem){
	//ADD Program Level Buttons
    myItem.hover(
    	function () {
            $(this).append("<div id='myGlossaryTermRemove' class='glossaryTermRemove' title='Remove this term from your glossary.'></div><div id='myGlossaryTermEdit' class='glossaryTermEdit' title='Edit this glossary term.'></div>");
            $("#myGlossaryTermRemove").click(function(){
            	removeGlossaryTerm($(this).parent().data("myID"));
	        }).hover(
            	function () {
                	hoverSubNav = true;
                },
				function () {
                	hoverSubNav = false;
                }
            ).tooltip({
            	show: {
                	delay: 1500,
                    effect: "fadeIn",
                    duration: 200
                }
           });
           
           $("#myGlossaryTermEdit").click(function(){
            	editGlossaryTerm($(this).parent().data("myID"));
	        }).hover(
            	function () {
                	hoverSubNav = true;
                },
				function () {
                	hoverSubNav = false;
                }
            ).tooltip({
            	show: {
                	delay: 1500,
                    effect: "fadeIn",
                    duration: 200
                }
           });
        },
        function () {
			$("#myGlossaryTermRemove").remove();
			$("#myGlossaryTermEdit").remove();
		});   
}

/************************************************************************************************
Function: 		removeGlossaryTerm
Param: 			myNode = node in xml to manipulate
Description:	Called when a user removes an existing glossary item.
************************************************************************************************/
function removeGlossaryTerm(myNode){
	var glossarySource;
	if(courseGlossary){
		glossarySource = $(courseData);
	}else{
		glossarySource = $(data);
	}
	var msg = '<div id="dialog-removeGlossaryTermConfirm" title="Remove Glossary Term"><p class="validateTips">Are you sure that you want to remove this item from your glossary?</p><p>This cannot be undone.</p></div>';
	
	//Add to stage.
	$("#stage").append(msg);
	
	//Make it a dialog
	$("#dialog-removeGlossaryTermConfirm").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
			$("#dialog-removeGlossaryTermConfirm").remove();
		},
		buttons: {
			Cancel: function () {
				$(this).dialog("close");
			},
			Yes: function(){
				glossarySource.find("glossaryitem").eq(myNode).remove();
				if(courseGlossary){
					sendCourseUpdate();
				}else{
					sendUpdateWithRefresh("glossary");
				}
				$(this).dialog("close");
			} 
		}
	});
}

/************************************************************************************************
Function: 		addGlossaryTerm
Param: 			none
Description:	Called when a user creates a new glossary item.
************************************************************************************************/
function addGlossaryTerm(){
	//Create the base message.
	var msg = '<div id="dialog-addGlossaryTerm" title="Add New Term"><p class="validateTips">Complete the form to create your new glossary term.</p><input id="newTerm" type="text" value="New Term" defaultValue="New Term" style="width:100%;"/><br/><div>Edit Definition:</div><div id="definitionEditText" type="text" contenteditable="true" class="dialogInput">Input defintion here.</div></div>';
	
	//Add to stage.
	$("#stage").append(msg);
	
	CKEDITOR.inline( "definitionEditText", {
		toolbar: contentToolbar,
		toolbarGroups :contentToolgroup,
		enterMode : CKEDITOR.ENTER_BR,
		shiftEnterMode: CKEDITOR.ENTER_P,
		extraPlugins: 'sourcedialog'
	});	

	//Make it a dialog
	$("#dialog-addGlossaryTerm").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
				$("#dialog-addGlossaryTerm").remove();
			},
		buttons: {
			Cancel: function () {
                    $(this).dialog("close");
			},
			Add: function(){
				insertGlossaryTerm($("#newTerm").val(), CKEDITOR.instances.definitionEditText.getData());
				if (CKEDITOR.instances.definitionEditText) CKEDITOR.instances.definitionEditText.destroy();				
				$(this).dialog("close");
			}
		}
	});
}

/************************************************************************************************
Function: 		editGlossaryTerm
Param: 			myNode = node in xml to manipulate
Description:	Called when a user edits an existing glossary item.
************************************************************************************************/
function editGlossaryTerm(myNode){
	var glossarySource;
	if(courseGlossary){
		glossarySource = $(courseData);
	}else{
		glossarySource = $(data);
	}
	
	var myTerm = glossarySource.find("glossaryitem").eq(myNode).find("term").text();
	var myDef = glossarySource.find("glossaryitem").eq(myNode).find("content").text();
	var msg = '<div id="dialog-editGlossaryTerm" title="Edit This Term"><p class="validateTips">Edit the data for your term.</p><input id="newTerm" type="text" value="'+myTerm+'" defaultValue="'+myTerm+'" style="width:100%;"/><br/><div>Edit Definition:</div><div id="definitionEditText" type="text" contenteditable="true" class="dialogInput">'+myDef+'</div></div>';
	
	//Add to stage.
	$("#stage").append(msg);
	
	CKEDITOR.inline( "definitionEditText", {
		toolbar: contentToolbar,
		toolbarGroups :contentToolgroup,
		enterMode : CKEDITOR.ENTER_BR,
		shiftEnterMode: CKEDITOR.ENTER_P,
		extraPlugins: 'sourcedialog'
	});	

	//Make it a dialog
	$("#dialog-editGlossaryTerm").dialog({
		modal: true,
		width: 550,
		close: function(event, ui){
				$("#dialog-editGlossaryTerm").remove();
			},
		buttons: {
			Cancel: function () {
                    $(this).dialog("close");
			},
			Add: function(){
				glossarySource.find("glossaryitem").eq(myNode).remove();
				insertGlossaryTerm($("#newTerm").val(), CKEDITOR.instances.definitionEditText.getData());
				if (CKEDITOR.instances.definitionEditText) CKEDITOR.instances.definitionEditText.destroy();
				$(this).dialog("close");
			}
		}
	});

}

/************************************************************************************************
Function: 		insertGlossaryTerm
Param: 			_term = the term to update.
				_defintion = explanation of the term.
Description:	Called when a user edits or creates a glossary item.
************************************************************************************************/
function insertGlossaryTerm(_term, _definition){
	var glossarySource;
	if(courseGlossary){
		glossarySource = $(courseData);
	}else{
		glossarySource = $(data);
	}
	var noError = true;
	var isLast = true;
	var term = _term.toLowerCase();
	var insertPoint = 0;
	var isOnly = false;
	var totalGlossary = glossarySource.find('glossaryitem').length;
	if(totalGlossary != 0){
		for(var i = 0; i < totalGlossary; i++){
			var testTerm = glossarySource.find('glossaryitem').eq(i).find('term').text().toLowerCase();
			insertPoint = i;
			if(term < testTerm){
				isLast = false;
				break;
			}else if(term == testTerm){
				noError = false;
				break;
			}
		}
	}else{
		isOnly = true;
	}	
	
	//IF doesn't exist already - create
	if(noError == true){
		if(isOnly == true){
			glossarySource.find("glossary").append($('<glossaryitem>'));
			//Place the page title element
			glossarySource.find("glossaryitem").eq(0).append($("<term>"));
			var newGlossaryTerm = new DOMParser().parseFromString('<term></term>',  "application/xml");
			var termCDATA = newGlossaryTerm.createCDATASection(_term);
			glossarySource.find("glossaryitem").eq(0).find("term").append(termCDATA);
		
			glossarySource.find("glossaryitem").eq(0).append($("<content>"));
			var newGlossaryDef = new DOMParser().parseFromString('<content></content>',  "application/xml");
			var defCDATA = newGlossaryDef.createCDATASection(_definition);
			glossarySource.find("glossaryitem").eq(0).find("content").append(defCDATA);
		}else if(isLast == true){
			glossarySource.find("glossaryitem").eq(insertPoint).after($('<glossaryitem></glossaryitem>'));
			//Place the page title element
			glossarySource.find("glossaryitem").eq(insertPoint + 1).append($("<term>"));
			var newGlossaryTerm = new DOMParser().parseFromString('<term></term>',  "application/xml");
			var termCDATA = newGlossaryTerm.createCDATASection(_term);
			glossarySource.find("glossaryitem").eq(insertPoint + 1).find("term").append(termCDATA);
		
			glossarySource.find("glossaryitem").eq(insertPoint + 1).append($("<content>"));
			var newGlossaryDef = new DOMParser().parseFromString('<content></content>',  "application/xml");
			var defCDATA = newGlossaryDef.createCDATASection(_definition);
			glossarySource.find("glossaryitem").eq(insertPoint + 1).find("content").append(defCDATA);
		}else{
			glossarySource.find("glossaryitem").eq(insertPoint).before($('<glossaryitem></glossaryitem>'));
			//Place the page title element
			glossarySource.find("glossaryitem").eq(insertPoint).append($("<term>"));
			var newGlossaryTerm = new DOMParser().parseFromString('<term></term>',  "application/xml");
			var termCDATA = newGlossaryTerm.createCDATASection(_term);
			glossarySource.find("glossaryitem").eq(insertPoint).find("term").append(termCDATA);
		
			glossarySource.find("glossaryitem").eq(insertPoint).append($("<content>"));
			var newGlossaryDef = new DOMParser().parseFromString('<content></content>',  "application/xml");
			var defCDATA = newGlossaryDef.createCDATASection(_definition);
			glossarySource.find("glossaryitem").eq(insertPoint).find("content").append(defCDATA);
		}
		
		//When done - update content.xml on the server.
		if(courseGlossary){
			sendCourseUpdate();
		}else{
			sendUpdateWithRefresh("glossary");
		}
	}else{
		//Error about existing....
		var msg = '<div id="dialog-addGlossaryTermError" title="Term Already Exists"><p class="validateTips">This term is already entered in this glossary.</p><p>To edit this term, roll over it in the glossary list and select the edit button.</p></div>';
	
		//Add to stage.
		$("#stage").append(msg);
	
		//Make it a dialog
		$("#dialog-addGlossaryTermError").dialog({
			modal: true,
			width: 550,
			close: function(event, ui){
				$("#dialog-addGlossaryTermError").remove();
			},
			buttons: {
				Cancel: function () {
                    $(this).dialog("close");
				}
			}
		});
	}
}

/************************************************************************************************
Function: 		updateGlossaryTerm
Param: 			none
Description:	Updates xmls and refreshes other users.
************************************************************************************************/
function updateGlossaryTerm(){
	 sendUpdateWithRefresh("glossary");
}


/************************************************************************************************
Function: 		toggleGlossary
Param: 			none
Description:	Opens and closes the glossary pane.
************************************************************************************************/
function toggleGlossary(){
	$("#glossaryPane").css({'z-index':1});
	$("#indexPane").css({'z-index':0});
	$("#docPane").css({'z-index':0});
	var icon = 'ui-icon-circle-triangle-s';
	if(glossaryState == false){
		glossaryState = true;

		gimmeGlosPos();
		TweenMax.to($('#glossaryPane'), transitionLength, {css:{left:0}, ease:transitionType});
		accShowGlossary();
		$("#glossaryDef").focus();
		// if tab is not against the left edge of the screen at start, tween it to the right edge of the pane when the pane opens
		var tabPos = glossaryClosePos * -1;
		TweenMax.to($('#glossaryTab'), transitionLength, {css:{left:tabPos}, ease:transitionType});
	}
	else{
		glossaryState = false;
		TweenMax.to($('#glossaryPane'), transitionLength, {css:{left:glossaryClosePos}, ease:transitionType, onComplete:accHideGlossary});
		TweenMax.to($('#glossaryTab'), transitionLength, {css:{left:glossaryTabPos}, ease:transitionType});
	}
}

function accShowGlossary(){
	$("#glossaryTerms").css("visibility", "visible");
	$("#glossaryContent").css("visibility", "visible");
	$("#glossaryClose").css("visibility", "visible");
}

function accHideGlossary(){
	$("#glossaryTerms").css("visibility", "hidden");
	$("#glossaryContent").css("visibility", "hidden");
	$("#glossaryClose").css("visibility", "hidden");
}

/************************************************************************************************
Function: 		gimmeGlossaryPos
Param: 			none
Description:	Discerns the open and close point for glossary animation.
************************************************************************************************/
function gimmeGlosPos(){
	glossaryClosePos = ($("#glossaryPane").position().left);
	glossaryClosePosMobile = ($("#glossaryPane").position().top);
	glossaryTabPos = ($("#glossaryTab").position().left);
}
