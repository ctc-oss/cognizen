/*
 *  	C_DocList
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses DocList pane functionality
 *
 *      ©Concurrent Technologies Corporation 2018
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
	$('#panes').append("<div id='docPane' class='pane'><div id='docTab' class='paneTab' title='click here to view documents'></div><div id='docContent' class='docContent'></div></div>");
	for (var i = 0; i < totalDocs; i++){
		var linkID = "docPaneItem" + i;
		var thisLink = $(data).find('docItem').eq(i).find('doc').attr('link');
		var thisDoc = $(data).find('docItem').eq(i).find('doc').text();
		var thisDescription = $(data).find('docItem').eq(i).find('description').text();
		$("#docContent").append("<div class='docPaneItem'><a href='"+thisLink+"' id='"+linkID+"' title='click here launch document' target='_blank'>"+thisDoc+"</a><div class='docPaneItemDescription'>"+thisDescription+"</div></div>");
		$('#'+linkID).button().tooltip();
	}
	
	$('#docTab').click(toggleDoc).tooltip();	
	
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
		$('#docPane').velocity({
			left: 0
		}, {
			duration: transitionLength
		});

	}
	else{
		docState = false;
		$('#docPane').velocity({
			left: docClosePos
		}, {
			duration: transitionLength
		});

	}
}

function gimmeDocPos(){
	docClosePos = ($("#docPane").position().left);
}
