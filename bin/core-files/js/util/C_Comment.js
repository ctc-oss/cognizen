/*
 *  	C_Comment
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses the cognizen commenting system
 *  	Version: 0.5
 *		Date Created: 10/19/13
 *		Created by: Philip Double
 *		Date Updated: 10/19/13
 *		Updated by: Philip Double
 *		History: Moved all glossary functionality into its own js file.
 *		Todo: 	- Turn this into a plugin.  This did reside in C_Engine which was becoming unruly.
 *				- Optimize code.
 */

var commentsOpen = false;
var pageComments;

function checkComment(){
	$("#myCanvas").append("<div id='comment' class='btn_comment' title='Add a Page Comment'></div>");
	$("#comment").tooltip().click(function(){
		var pageNumber = currentPage + 1;
		
		//Create the Comment Dialog
		$("#stage").append("<div id='commentDialog' title='Comments for Page "+ pageNumber + ": " + $(data).find("page").eq(currentPage).find('title').text() + "'><div id='commentDisplayHolder' class='nano'><div id='pageComments' class='commentDisplay overthrow content'></div></div><div id='commentInputText' class='commentInput' type='text'>Add Comment Here...</div><label id='label'>Resolved: </label><input id='commentStatus' type='checkbox' name='status' class='radio' value='true'/><br/></div>");
			
						
		if(pageComments.length > 0){
			var last = pageComments.length - 1;
			var myStatus = pageComments[last].status;
			if(myStatus == 'new' || myStatus == 'inprogress'){
				$("#commentStatus").removeAttr("checked");
			}else{
				$("#commentStatus").attr("checked", 'checked');
			}
		}
			
		//Toggle to switch formatting of comments to alternate....
		var even = true;

		for(var i = 0; i < pageComments.length; i++){
			var myFirstName = pageComments[i].user.firstName;
			var myLastName = pageComments[i].user.lastName;
			var myTime = pageComments[i].created;
			var myComment = pageComments[i].comment;
			
			if(even == true){
				$("#pageComments").append("<div class='commentHolder'><div class='commentHeaderEven'>" + myFirstName + " " + myLastName + " posted at " + myTime + "</div><div class='commentItemEven'>"+ myComment +"</div></div>");
			}else{
				$("#pageComments").append("<div class='commentHolder'><div class='commentHeaderOdd'>" + myFirstName + " " + myLastName + " posted at " + myTime + "</div><div class='commentItemOdd'>"+ myComment +"</div></div>");
			}
			if(even == true){
				even = false;
			}else{
				even = true;
			}
		}

		//Style it to jQuery UI dialog
		$("#commentDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 600,
			height: 625,
			buttons:{
				Close: function(){
					$( this ).dialog( "close" );
					commentsOpen = false;
				},
				Save: function(){
					var myStatus;
					if($("#commentStatus").prop("checked") == true){
						myStatus = 'closed';
					}else{
						myStatus = 'inprogress';
					}
					cognizenSocket.emit('addComment', {
						user: {id: urlParams['u']},
						content: {type: urlParams['type'], id: urlParams['id']},
						page: {id: $(data).find("page").eq(currentPage).attr("id")},
						text: $("#commentInputText").getCode(),
						status: myStatus
					});
				}
			},
			close: function(){
				$("#commentDialog").remove();
			}
		});

		$("#commentInputText").redactor({
			focus: true,
			buttons: ['html', '|', 'bold', 'italic', 'underline', 'deleted', '|', 'link', 'fontcolor', 'backcolor']
		});
		 
		 //Set Scrollbar for comments if one is needed...
		 $(".nano").nanoScroller({
               	flashDelay: 4000,
		 	flash: true,
		 	sliderMaxHeight: 350,
		 	scroll: 'bottom'
		 });
	});
}

function refreshPageComments(){
	$("#pageComments").empty();
	
	var even = true;

	for(var i = 0; i < pageComments.length; i++){
		var myFirstName = pageComments[i].user.firstName;
		var myLastName = pageComments[i].user.lastName;
		var myTime = pageComments[i].created;
		var myComment = pageComments[i].comment;
		
		if(even == true){
			$("#pageComments").append("<div class='commentHolder'><div class='commentHeaderEven'>" + myFirstName + " " + myLastName + " posted at " + myTime + "</div><div class='commentItemEven'>"+ myComment +"</div></div>");
		}else{
			$("#pageComments").append("<div class='commentHolder'><div class='commentHeaderOdd'>" + myFirstName + " " + myLastName + " posted at " + myTime + "</div><div class='commentItemOdd'>"+ myComment +"</div></div>");
		}
		if(even == true){
			even = false;
		}else{
			even = true;
		}
	}
	
	 $(".nano").nanoScroller({
      	flashDelay: 4000,
		flash: true,
		sliderMaxHeight: 350,
		scroll: 'bottom'
	});
}

function updateIndexCommentFlags(){
	cognizenSocket.emit('getCourseCommentPages', {
		contentId: urlParams['id']
	});
}
