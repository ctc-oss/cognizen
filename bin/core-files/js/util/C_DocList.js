/*
 *  	C_DocList
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses DocList pane functionality
 *  	Version: 0.5
 *		Date Created: 10/19/13
 *		Created by: Philip Double
 *		Date Updated: 10/19/13
 *		Updated by: Philip Double
 *		History: Moved all glossary functionality into its own js file.
 *		Todo: 	- Turn this into a plugin.  This did reside in C_Engine which was becoming unruly.
 *				- Optimize code.
 */
 
 
var docs = false;
var totalDocs = 0;
var docState = false;
var docClosePos = 0;
var docClosePosMobile = 0;

function checkDocs(){
	//Set up Doc pane, if needed...
	totalDocs = $(data).find('docItem').length;
	if(totalDocs > 0){
		docs = true;
		addDocs();
	}
} 

//addDocs pane
function addDocs(){
	$('#panes').append("<div id='docPane' class='pane'><button id='docTab' class='paneTab'></button><div id='docContent' class='docContent'></div></div>");
	for (var i = 0; i < totalDocs; i++){
		var linkID = "docPaneItem" + i;
		var thisLink = $(data).find('docItem').eq(i).find('doc').attr('link');
		var thisDoc = $(data).find('docItem').eq(i).find('doc').text();
		var thisDescription = $(data).find('docItem').eq(i).find('description').text();
		$("#docContent").append("<div class='docPaneItem'><a href='"+thisLink+"' id='"+linkID+"' target='_blank'>"+thisDoc+"</a><div class='docPaneItemDescription'>"+thisDescription+"</div></div>");
		$('#'+linkID).button();
	}
	
	$('#docTab').click(toggleDoc);	
}


/*************************************************************
** DOC Button Funcitonality
*************************************************************/
function toggleDoc(){
	$("#docPane").css({'z-index':1});
	$("#indexPane").css({'z-index':0});
	$("#glossaryPane").css({'z-index':0});
	
	if(docState == false){
		docState = true;
		gimmeDocPos();
		TweenMax.to($('#docPane'), transitionLength, {css:{left:0}, ease:transitionType});


	}
	else{
		docState = false;
		TweenMax.to($('#docPane'), transitionLength, {css:{left:docClosePos}, ease:transitionType});

	}
}

function gimmeDocPos(){
	docClosePos = ($("#docPane").position().left);
}
