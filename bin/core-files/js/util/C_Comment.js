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
var currentIssueBankMember = 0;

function checkComment(){
	$("#myCanvas").append("<div id='comment' class='btn_comment' title='Add a Page Comment'></div>");
	if(!$(courseData).find("course").attr("redmine") || $(courseData).find("course").attr("redmine") == "false"){
		$("#comment").tooltip().click(function(){
			var pageNumber = currentPage + 1;
			
			//Create the Comment Dialog
			$("#stage").append("<div id='commentDialog' title='Comments for Page "+ pageNumber + ": " + $(data).find("page").eq(currentPage).find('title').text() + "'><div id='commentDisplayHolder' class='antiscroll-wrap'><div id='pageComments' class='commentDisplay overthrow antiscroll-inner'></div></div><div id='commentInputText' class='commentInput' type='text'>Add Comment Here...</div><label id='label'>Resolved: </label><input id='commentStatus' type='checkbox' name='status' class='radio' value='true'/><br/></div>");
				
							
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
							text: CKEDITOR.instances['commentInputText'].getData(),
							status: myStatus
						});
					}
				},
				close: function(){
					$("#commentDialog").remove();
				}
			});

			
			
			//Add and style contentEdit button
	        $("#commentInputText").attr('contenteditable', true);
	        CKEDITOR.disableAutoInline = true;
			CKEDITOR.inline( 'commentInputText', {
				toolbar: contentToolbar,
				toolbarGroups :contentToolgroup,
				enterMode : CKEDITOR.ENTER_BR,
				shiftEnterMode: CKEDITOR.ENTER_P
			});
			 
			 
			 $('.antiscroll-wrap').antiscroll();
		});		
	}
	else{
		$("#comment").tooltip().click(function(){
			updatePageIssues();
		});		

	}

}

function updatePageIssues(){
	//alert("new comment");
	var pageNumber = currentPage + 1;

	//Create the Comment Dialog
	var msg = "<div id='commentDialog' title='Comments for Page "+ pageNumber + ": " + $(data).find("page").eq(currentPage).find('title').text() + "'>";
	msg += "<div id='commentDisplayHolder'>";
	msg += "<div id='pageComments' class='editItemContainer '></div>";
	msg += "</div>";//contentDisplayHolder
	msg += "<label for='commentInputSubject'>Comment Subject: </label>";
	msg += "<input type='text' id='commentInputSubject' name='commentInputSubject' type='text' title='Add comment subject here.''/><br/>";
	msg += "<label for='commentInputText'>Comment Description: </label>";
	msg += '<textarea rows="4" cols="50" name="commentInputText" id="commentInputText" title="Add comment description here." class="text ui-widget-content ui-corner-all"></textarea><br/>';
	//msg += "<div id='commentInputText' name='commentInputText' class='commentInput' type='text'>Add Comment Here...</div>";
 	msg += "<label for='commentInputStatus'>Status: </label>";
 	msg += "<select name='commentInputStatus' id='commentInputStatus' title='Set the status of the issue.'>";
 	msg += "<option selected='selected'>New</option>";
 	msg += "<option>In Progress</option>";
 	msg += "<option>Resolved</option>";
 	msg += "<option>Tested</option>";
 	msg += "<option>Closed</option>";
 	msg += "<option>Rejected</option>";
 	msg += "</select> ";
	msg += "</div>";//commentDialog
	$("#stage").append(msg);

	var _issues = {};
	//get issues for the page
	var _page = {
		lessontitle: $(data).find('lessonTitle').attr('value'),
		id: $(data).find("page").eq(currentPage).attr("id")
	};
	cognizenSocket.emit('getRemineIssues', _page, function(fdata){
		_issues = fdata;

		console.log(_issues);
		var issueMenu_arr = [];
		if(_issues.total_count != 0){
			var issuesMsg = '';
			for(var h = 0; h < _issues.issues.length; h++){
				var label = h + 1;
				var tmpID = "bankItem"+h;
				console.log(tmpID);
				issuesMsg += "<div id='"+tmpID+"' class='questionBankItem";
				if(currentIssueBankMember == h){
					issuesMsg += " selectedEditBankMember";
				}
				else{
					issuesMsg += " unselectedEditBankMember";
				}
				issuesMsg += "' style='";

				if(h < 100){
					issuesMsg += "width:30px;";
				}else if(h > 99){
					issuesMsg += "width:45px;";
				}

				issuesMsg += "' data-myID='" + h + "' title='" + _issues.issues[h].subject + "'>" + label + "</div>";

				issueMenu_arr.push(tmpID);
			}
			issuesMsg += "</div><br/><br/>";

			issuesMsg += "<label for='commentSubject'>Comment Subject: </label>";
			issuesMsg += "<input type='text' id='commentSubject' name='commentSubject' type='text' title='Edit comment subject here.'' value='"+_issues.issues[currentIssueBankMember].subject+"'/><br/>";
			issuesMsg += "<div id='label'>Comment Description: </div>";
			issuesMsg += '<div name="commentText" id="commentText" title="Edit comment description here." class="dialogInput" contenteditable="true"></div><br/>';
	     	issuesMsg += "<label for='commentStatus'>Status: </label>";
	     	issuesMsg += "<select name='commentStatus' id='commentStatus' title='Edit the status of the issue.'>";
	     	issuesMsg += "<option>New</option>";
	     	issuesMsg += "<option>In Progress</option>";
	     	issuesMsg += "<option>Resolved</option>";
	     	issuesMsg += "<option>Tested</option>";
	     	issuesMsg += "<option>Closed</option>";
	     	issuesMsg += "<option>Rejected</option>";
	     	issuesMsg += "</select> ";					

			$("#pageComments").append(issuesMsg);

			$('#commentText').append(_issues.issues[currentIssueBankMember].description);

			var currentStatus = _issues.issues[currentIssueBankMember].status.name;
			$('#commentStatus option:contains('+currentStatus+')').attr('selected', 'selected');
			//$("#pageComments").append("<div>"+_issues.total_count+"</div");
			console.log(_issues.issues[currentIssueBankMember]);
			for(var j = 0; j < issueMenu_arr.length; j++){
				if(currentIssueBankMember != j){
					var tmpID = "#" + issueMenu_arr[j];
					$(tmpID).click(function(){
						// var tmpObj = makeQuestionDataStore();
						// saveQuestionEdit(tmpObj);
						$('#bankItem'+ currentIssueBankMember).removeClass("selectedEditBankMember").addClass("unselectedEditBankMember");
						currentIssueBankMember = $(this).attr("data-myID");
						$(this).removeClass("unselectedEditBankMember").addClass("selectedEditBankMember");
						$("#commentDialog").remove();
						updatePageIssues();
					}).tooltip();
				}
			}					
		}
		else{
			$('#pageComments').hide();
		}

		//Style it to jQuery UI dialog
		$("#commentDialog").dialog({
			autoOpen: true,
			modal: true,
			width: 600,
			height: 625,
			dialogClass: "no-close",
			buttons:[		
				{
					text: "Add",
					title: "Adds a new issue.",
					click: function(){
						var myStatusId = 1;
						if($("#commentInputStatus").val() == "In Progress"){
							myStatusId = 2;
						}
						else if($("#commentInputStatus").val() == "Resolved"){
							myStatusId = 3;
						}
						else if($("#commentInputStatus").val() == "Tested"){
							myStatusId = 4;
						}
						else if($("#commentInputStatus").val() == "Closed"){
							myStatusId = 5;
						}
						else if($("#commentInputStatus").val() == "Rejected"){
							myStatusId = 6;
						}

						cognizenSocket.emit('addRedmineIssue', {
							user: {id: urlParams['u']},
							content: {type: urlParams['type'], id: urlParams['id']},
							lessontitle: $(data).find('lessonTitle').attr('value'),
							page: {
								id: $(data).find("page").eq(currentPage).attr("id"),
								title: $(data).find('page').eq(currentPage).find("title").first().text().trim()
							},
							subject: $('#commentInputSubject').val().replace('<p>', '').replace('</p>', '').trim(),
							text: $('#commentInputText').val().replace('<p>', '').replace('</p>', '').trim(),
							status: myStatusId
						});
						setTimeout(updatePageIssues(), 3000);
					}	
				},
				{
					text: "Done",
					title: "Saves and closes the edit dialog.",
					click: function(){
						$( this ).dialog( "close" );
						$("#commentDialog").remove();
					}
				}					
			] 					
		});				

	});			

	$('.antiscroll-wrap').antiscroll();		
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
	
	$('.antiscroll-wrap').antiscroll();
}

function updateIndexCommentFlags(){
	cognizenSocket.emit('getCourseCommentPages', {
		contentId: urlParams['id']
	});
}
