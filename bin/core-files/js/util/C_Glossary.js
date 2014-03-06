/*
 *  	C_Glossary
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses glossary functionality for cognizen
 *  	Version: 0.5
 *		Date Created: 10/19/13
 *		Created by: Philip Double
 *		Date Updated: 10/19/13
 *		Updated by: Philip Double
 *		History: Moved all glossary functionality into its own js file.
 *		Todo: 	- Turn this into a plugin.  This did reside in C_Engine which was becoming unruly.
 *				- Optimize code.
 */

var glossary = false;
var glossaryState = false;
var glossaryClosePos = 0;
var glossaryClosePosMobile = 0;
var totalGlossary = 0;


/************************************************************************************************
Function: 		checkGlossary
Param: 			none
Description:	Check's to see if this app has glossary turned on - if yes then build it.
************************************************************************************************/
function checkGlossary(){
	if($(data).find('glossary').attr('value') == "true"){
		glossary = true;
		if(windowWidth <= mobileWidth){
			$('#panes').append("<div id='glossaryPane' class='pane'><button id='glossaryTab' class='paneTab'></button><div id='glossaryContent' class='glossaryContent'></div></div>");
		}
		else{
			$('#panes').append("<div id='glossaryPane' class='pane'><div id='glossaryTab' class='paneTab' title='click here to toggle the glossary'/><div id='glossaryTerms' class='glossaryTerms'></div><div id='glossaryContent' class='glossaryContent'><div id='glossaryDef'></div></div></div>");
		}
		
		$('#glossaryTab').click(toggleGlossary).tooltip();
	
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
	    		//$("#glossaryPane").remove();
	    		$("#glossaryTerms").empty();
	    		$("#glossaryDef").html("");
		    	addGlossary();
		},
		error: function(){
	    	alert("unable to load content.xml in updateIndex")
	    }
	});
}


/************************************************************************************************
Function: 		addGlossary
Param: 			none
Description:	Called when the glossary is built and when the glossary updates complete.
************************************************************************************************/
function addGlossary(){
	totalGlossary = $(data).find('glossaryitem').length;
	glossaryItem_arr = [];
	var thisTerm;
	var termID;
	
	for(var i = 0; i < totalGlossary; i++){
		thisTerm = "term" + i;
		termID = "#"+thisTerm;
		$("#glossaryTerms").append("<div id='"+thisTerm+"' class='glossaryItem'>"+$(data).find('glossaryitem').eq(i).find('term').text()+"</div>");
		$(termID).data("definition", $(data).find('glossaryitem').eq(i).find('content').text());
		$(termID).data("myID", i);
		$(termID).click(function(){
			if(hoverSubNav == false){
				$("#glossaryDef").html("<b>Term: </b>" + $(this).text() + "<br/><br/><b>Definition: </b>" + $(this).data("definition"));
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
				$(data).find("glossaryitem").eq(myNode).remove();
				sendUpdateWithRefresh("glossary");
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
	var myTerm = $(data).find("glossaryitem").eq(myNode).find("term").text();
	var myDef = $(data).find("glossaryitem").eq(myNode).find("content").text();
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
				$(data).find("glossaryitem").eq(myNode).remove();
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
	var noError = true;
	var isLast = true;
	var term = _term.toLowerCase();
	var insertPoint = 0;
	var isOnly = false;
	var totalGlossary = $(data).find('glossaryitem').length;
	if(totalGlossary != 0){
		for(var i = 0; i < totalGlossary; i++){
			var testTerm = $(data).find('glossaryitem').eq(i).find('term').text().toLowerCase();
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
			$(data).find("glossary").append($('<glossaryitem>'));
			//Place the page title element
			$(data).find("glossaryitem").eq(0).append($("<term>"));
			var newGlossaryTerm = new DOMParser().parseFromString('<term></term>',  "application/xml");
			var termCDATA = newGlossaryTerm.createCDATASection(_term);
			$(data).find("glossaryitem").eq(0).find("term").append(termCDATA);
		
			$(data).find("glossaryitem").eq(0).append($("<content>"));
			var newGlossaryDef = new DOMParser().parseFromString('<content></content>',  "application/xml");
			var defCDATA = newGlossaryDef.createCDATASection(_definition);
			$(data).find("glossaryitem").eq(0).find("content").append(defCDATA);
		}else if(isLast == true){
			$(data).find("glossaryitem").eq(insertPoint).after($('<glossaryitem></glossaryitem>'));
			//Place the page title element
			$(data).find("glossaryitem").eq(insertPoint + 1).append($("<term>"));
			var newGlossaryTerm = new DOMParser().parseFromString('<term></term>',  "application/xml");
			var termCDATA = newGlossaryTerm.createCDATASection(_term);
			$(data).find("glossaryitem").eq(insertPoint + 1).find("term").append(termCDATA);
		
			$(data).find("glossaryitem").eq(insertPoint + 1).append($("<content>"));
			var newGlossaryDef = new DOMParser().parseFromString('<content></content>',  "application/xml");
			var defCDATA = newGlossaryDef.createCDATASection(_definition);
			$(data).find("glossaryitem").eq(insertPoint + 1).find("content").append(defCDATA);
		}else{
			$(data).find("glossaryitem").eq(insertPoint).before($('<glossaryitem></glossaryitem>'));
			//Place the page title element
			$(data).find("glossaryitem").eq(insertPoint).append($("<term>"));
			var newGlossaryTerm = new DOMParser().parseFromString('<term></term>',  "application/xml");
			var termCDATA = newGlossaryTerm.createCDATASection(_term);
			$(data).find("glossaryitem").eq(insertPoint).find("term").append(termCDATA);
		
			$(data).find("glossaryitem").eq(insertPoint).append($("<content>"));
			var newGlossaryDef = new DOMParser().parseFromString('<content></content>',  "application/xml");
			var defCDATA = newGlossaryDef.createCDATASection(_definition);
			$(data).find("glossaryitem").eq(insertPoint).find("content").append(defCDATA);
		}
		
		//When done - update content.xml on the server.
		sendUpdateWithRefresh("glossary");
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
		if(windowWidth <= mobileWidth){
			TweenMax.to($('#glossaryPane'), transitionLength, {css:{top:0}, ease:transitionType});
		}
		else{
			TweenMax.to($('#glossaryPane'), transitionLength, {css:{left:0}, ease:transitionType});
		}
	}
	else{
		glossaryState = false;
		if(windowWidth <= mobileWidth){
			TweenMax.to($('#glossaryPane'), transitionLength, {css:{top:glossaryClosePosMobile}, ease:transitionType});
		}
		else{
			TweenMax.to($('#glossaryPane'), transitionLength, {css:{left:glossaryClosePos}, ease:transitionType});
		}
	}
}

/************************************************************************************************
Function: 		gimmeGlossaryPos
Param: 			none
Description:	Discerns the open and close point for glossary animation.
************************************************************************************************/
function gimmeGlosPos(){
	glossaryClosePos = ($("#glossaryPane").position().left);
	glossaryClosePosMobile = ($("#glossaryPane").position().top);
}
