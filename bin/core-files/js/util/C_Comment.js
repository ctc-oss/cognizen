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
var issueMenu_arr = [];
var _issues = {};
var scroller;

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
			updatePageIssues(true);
		});		

	}

}

function updatePageIssues(create){

	var redmineHost = '';
	cognizenSocket.emit('retrieveRedmineHost', function(fdata){
		redmineHost = fdata;
	
		//var _issues = {};

		//gets title and id for templates with subpages (branches)
		var layout = $(data).find('page').eq(currentPage).attr('layout');
		var _id = $(data).find("page").eq(currentPage).attr("id");
		var _title = $(data).find("page").eq(currentPage).find('title').text();
		if(layout === 'branching' || layout === 'chaining' || layout === 'pathing'){
			_title = $(data).find("page").eq(currentPage).find('branch').eq(currentBranch).find('title').first().text();
			_id = $(data).find("page").eq(currentPage).find("branch").eq(currentBranch).attr("id");
		}

		var _page = {
			lessontitle: $(data).find('lessonTitle').attr('value'),
			coursetitle: $(data).find('courseTitle').attr('value'),
			lessonid: $(data).find('id').attr('value'),
			id: _id
		};


		cognizenSocket.emit('getRedmineProjectMembership', _page, function(fdata){
			var _membership_arr = fdata.memberships;
			var pageNumber = currentPage + 1;

			//Create the Comment Dialog
			var msg = '';
			if(create == true){
				msg += "<div id='commentDialog' title='Comments for Page "+ pageNumber + ": " + _title + "'>";
			}
			//style needs moved to css
			// msg += "<div id='commentDisplayHolder' class='box-wrap antiscroll-wrap' style='height:450px'>";
			// msg += "<div class='box' style='width:auto; height:450px'><div id='pageComments' class='editItemContainer overthrow antiscroll-inner' style='height:440px'></div></div>";
			// msg += "</div>";//contentDisplayHolder
			msg += "<div id='commentDisplayHolder' style='height:450px'>";
			msg += "<div id='pageComments' style='height:440px'></div>";
			msg += "</div>";//contentDisplayHolder
			msg += "<div id='newComment' class='editItemContainer'>";
			msg += '<div id="addLabel" style="text-align:center;font-weight:bold">Add Comment Here</div>';
			msg += "<label for='commentInputSubject'>Subject: *</label>";
			msg += "<input type='text' id='commentInputSubject' name='commentInputSubject' type='text' title='Add comment subject here.''/><br/>";
			msg += "<label for='commentInputText'>Description: </label>";
			msg += '<div name="commentInputText" id="commentInputText" title="Add comment description here." class="dialogInput" contenteditable="true"></div><br/>';
			//msg += '<textarea rows="4" cols="50" name="commentInputText" id="commentInputText" title="Add comment description here." class="text ui-widget-content ui-corner-all"></textarea><br/>';

			if(!clientReview){
				msg += '<div id="dropdowns" >';		

			 	msg += "<div name='commentInputStatus' id='commentInputStatus' title='Set the status of the issue.' style='float:left; margin-right:20px;'>";
			 	msg += "<label for='commentInputStatus'>Status: </label><select>";
			 	msg += "<option>New</option>";
			 	msg += "<option>In Progress</option>";
			 	msg += "<option>Resolved</option>";
			 	msg += "<option>Feedback</option>";
			 	msg += "<option>Tested</option>";			 	
			 	msg += "<option>Closed</option>";
			 	msg += "<option>Rejected</option>";
			 	msg += "</select></div> ";
			 
			 	msg += '<div name="assigneeInput" id="assigneeInput" title="Set whom the comment is assigned to." >';
			 	msg += '<label for="assigneeInput">Assignee: </label><select>';
			 	msg += '<option value=""> </option>';
			 	for (var i = 0; i < _membership_arr.length; i++) {
			 		msg += '<option value="'+_membership_arr[i].user.id+'">'+_membership_arr[i].user.name+'</option>';
			 	};
			 	msg += '</select>';

			 	msg += '</div>'; //end assignee div
			 	msg += '</div><br/>'; //end dropdowns div
			}

		 	msg += '</div>'; //end newComment
			if(create == true){		     		
				msg += "</div>";//commentDialog
				$("#stage").append(msg);
			}
			else{
				$('#commentDialog').append(msg);
			}
						
			$('#newComment').append('<div id="addIssueBtn" title="Adds new issue">Add</div>');

			$("#addIssueBtn").button().click(function(){
				if($('#commentInputSubject').val().length != 0){
					var inputStatusId = clientReview == true ? 'New' : findStatusId($('#commentInputStatus option:selected').text());
					var _id = $(data).find("page").eq(currentPage).attr("id");
					var _title = $(data).find('page').eq(currentPage).find("title").first().text().trim();
					if(layout === 'branching' || layout === 'chaining' || layout === 'pathing'){
						_title = $(data).find("page").eq(currentPage).find('branch').eq(currentBranch).find('title').first().text().trim();
						_id = $(data).find("page").eq(currentPage).find("branch").eq(currentBranch).attr("id");
					}									
					var pageData = {
						user: {id: urlParams['u'], username: username},
						content: {type: urlParams['type'], id: urlParams['id']},
						lessontitle: $(data).find('lessonTitle').attr('value'),
						coursetitle: $(data).find('courseTitle').attr('value'),
						lessonid: $(data).find('id').attr('value'),
						page: {
							id: _id,
							title: _title
						},
						subject: $('#commentInputSubject').val().replace('<p>', '').replace('</p>', '').trim(),
						text: CKEDITOR.instances['commentInputText'].getData(),
						status: inputStatusId,
						assigned_to_id: $('#assigneeInput option:selected').val()
					};

					try { CKEDITOR.instances["commentText"].destroy() } catch (e) {}
					try { CKEDITOR.instances["commentNote"].destroy() } catch (e) {}
					try { CKEDITOR.instances["commentInputText"].destroy() } catch (e) {}
					$("#commentDisplayHolder").remove();
					$("#newComment").remove();

					cognizenSocket.emit('addRedmineIssue', pageData, function(err){
						if(err){
							alert(err);
						}
						else{

							updateIndexCommentFlags();
							updateRedmineCommentIcon();

							setTimeout(updatePageIssues(false), 3000);
						}
					});
					
				}
				else{
					alert("A subject must be provided to add a comment.");
				}
			}).tooltip();

			//Add and style commentInputText button
	        $("#commentInputText").attr('contenteditable', true);
	        CKEDITOR.disableAutoInline = true;
			CKEDITOR.inline( 'commentInputText', {
				toolbar: pageTitleToolbar,
				toolbarGroups : pageTitleToolgroup,
				enterMode : CKEDITOR.ENTER_BR,
				shiftEnterMode: CKEDITOR.ENTER_P
			});	


			cognizenSocket.emit('getRedminePageIssues', _page, function(fdata){
				_issues = fdata;

				if(_issues.total_count != 0){
					var issuesMsg = '';
					issuesMsg += "</div>";
			issuesMsg += "<div id='questionMenu'><label style='position: relative; float: left; margin-right:20px; vertical-align:middle; line-height:30px;'><b>Comment Menu: </b></label></div><br/><br/>";					
			issuesMsg += "<div id='commentHolder' class='box-wrap antiscroll-wrap' style='width:100%; background-color:rgba(51, 51, 51, 0);'>";
			issuesMsg += "<div class='box' style='height:410px;width:auto'><div id='page' class='editItemContainer overthrow antiscroll-inner' style='height:390px;width:auto;'>";

					issuesMsg += "<label for='commentSubject'>Comment Subject: </label>";
					issuesMsg += "<input type='text' id='commentSubject' name='commentSubject' type='text' title='Edit comment subject here.'' value='"+_issues.issues[currentIssueBankMember].subject+"'/><br/>";
					issuesMsg += "<div id='label'>Comment Description: </div>";
					issuesMsg += '<div name="commentText" id="commentText" title="Edit comment description here." class="dialogInput" contenteditable="true"></div><br/>';	
					
					if(!clientReview){
						issuesMsg += '<div id="dropdowns" >';		
			
				     	issuesMsg += "<div name='commentStatus' id='commentStatus' title='Edit the status of the issue.' style='float:left; margin-right:20px;'>";
				     	issuesMsg += "<label for='commentStatus'>Status: </label><select>";
				     	issuesMsg += "<option>New</option>";
				     	issuesMsg += "<option>In Progress</option>";
				     	issuesMsg += "<option>Resolved</option>";
				     	issuesMsg += "<option>Feedback</option>";
				     	issuesMsg += "<option>Tested</option>";
				     	issuesMsg += "<option>Closed</option>";
				     	issuesMsg += "<option>Rejected</option>";
				     	issuesMsg += "</select></div> ";
				     
				     	issuesMsg += '<div name="assignee" id="assignee" title="Edit who comment is assigned to." >';
				     	issuesMsg += '<label for="assignee">Assignee: </label><select>';
				     	issuesMsg += '<option value=""> </option>';
				     	for (var i = 0; i < _membership_arr.length; i++) {
				     		issuesMsg += '<option value="'+_membership_arr[i].user.id+'">'+_membership_arr[i].user.name+'</option>';
				     	};
				     	issuesMsg += '</select>';

				     	issuesMsg += '</div>'; //end assignee div
				     	issuesMsg += '</div><br/>'; //end dropdowns div
				     }
			     	issuesMsg += '<div id="issueNotes" name="issueNotes"></div>';
			     	issuesMsg += "<div id='label'>Add Note: </div>";
					issuesMsg += '<div name="commentNote" id="commentNote" title="Add note to comment here." class="dialogInput" contenteditable="true"></div><br/>';					
			issuesMsg += "</div></div></div>";//box page contentHolder

					$("#pageComments").append(issuesMsg);

					var journal = [];
					cognizenSocket.emit('getRedmineIssueJournal', _issues.issues[currentIssueBankMember].id, function(fdata){
						journal = fdata;

						if(journal.length != 0){
							var journalMsg = '<div id="label">Last Update: </div>';
							for (var w = journal.length-1; w < journal.length; w++) {
								var time = new Date(journal[w].created_on);
								var monthAdj = time.getMonth()+1;
								var dateAdj = time.getDate() < 10 ? '0' + time.getDate() : time.getDate();
								var hourAdj = time.getHours() < 10 ? '0' + time.getHours() : time.getHours();
								var minAdj = time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes();
								var ampm = 'AM';
								if(hourAdj > 12){
									hourAdj = hourAdj-12;
									ampm = 'PM';
								}
								journalMsg += '<div id="journalUpdate'+w+'" name="journalUpdate'+w+'">Updated by ' +journal[w].user.name +' on ';
								journalMsg += time.getFullYear()+'-'+monthAdj+'-'+dateAdj+' '+hourAdj+':'+minAdj+' '+ampm+'</div><hr>';
								journalMsg += '<div id="journalUpdateNote'+w+'" name="journalUpdateNote'+w+'">' + journal[w].notes + '</div><br/>';
							};
							$('#issueNotes').append(journalMsg);
						}

						$('#commentText').append(_issues.issues[currentIssueBankMember].description);

						var currentStatus = _issues.issues[currentIssueBankMember].status.name;
						$('#commentStatus option:contains('+currentStatus+')').attr('selected', 'selected');

						var assigned_to = _issues.issues[currentIssueBankMember].assigned_to;
						if(assigned_to != undefined){
							var currentAssignee = assigned_to.id;
							$('#assignee option[value='+currentAssignee+']').attr('selected', 'selected');							
						}

						updateBankMenu();


						//#3667
						if(!clientReview){
							$("#page").append('<div><div id="updateIssueBtn" style="float:left;" title="Updates current issue">Submit</div>&nbsp;&nbsp;<div id="redmineLink" style="float:right;"><a href="http://'+redmineHost+'/issues/'+_issues.issues[currentIssueBankMember].id+'" target="_blank">Link to Redmine</a></div></div><br/>');
						}
						else{
							$("#page").append('<div id="updateIssueBtn" style="float:left;">Submit</div><br/><br/>');
						}
									
						$("#updateIssueBtn").button().click(function(){
							_issues.issues[currentIssueBankMember].subject = $('#commentSubject').val();
							_issues.issues[currentIssueBankMember].description = CKEDITOR.instances['commentText'].getData();
							_issues.issues[currentIssueBankMember].notes = CKEDITOR.instances['commentNote'].getData();

							var currentStatus = $('#commentStatus option:selected').text();
							_issues.issues[currentIssueBankMember].status_id = findStatusId(currentStatus);

							var issueAssignee = $('#assignee option:selected').val();
							_issues.issues[currentIssueBankMember].assigned_to_id = issueAssignee;

							try { CKEDITOR.instances["commentText"].destroy() } catch (e) {}
							try { CKEDITOR.instances["commentNote"].destroy() } catch (e) {}
							try { CKEDITOR.instances["commentInputText"].destroy() } catch (e) {}
							
							$("#commentDisplayHolder").remove();
							$("#newComment").remove();

							cognizenSocket.emit('updateRedmineIssue', _issues.issues[currentIssueBankMember], username, function(err){
								if(err){
									alert(err);
								}
								else{
									if (currentStatus == 'Closed' || currentStatus == 'Rejected'){
										currentIssueBankMember = 0;
									} 
									updateIndexCommentFlags();
									updateRedmineCommentIcon();
									setTimeout(updatePageIssues(false), 3000);
								}
							});				
						}).tooltip();

						//Add and style contentEdit button
				        $("#commentText").attr('contenteditable', true);
				        CKEDITOR.disableAutoInline = true;
						CKEDITOR.inline( 'commentText', {
							toolbar: pageTitleToolbar,
							toolbarGroups : pageTitleToolgroup,
							enterMode : CKEDITOR.ENTER_BR,
							shiftEnterMode: CKEDITOR.ENTER_P
						});	

						//Add and style contentEdit button
				        $("#commentNote").attr('contenteditable', true);
				        CKEDITOR.disableAutoInline = true;
						CKEDITOR.inline( 'commentNote', {
							toolbar: pageTitleToolbar,
							toolbarGroups : pageTitleToolgroup,
							enterMode : CKEDITOR.ENTER_BR,
							shiftEnterMode: CKEDITOR.ENTER_P
						});	



					});

				}
				else{
					$('#pageComments').hide();
				}

				//Style it to jQuery UI dialog
				if(create == true){
					$("#commentDialog").dialog({
						autoOpen: true,
						modal: true,
						width: 700,
						height: 750,
						dialogClass: "no-close",
						buttons:[		
							{
								text: "Done",
								title: "Saves and closes the edit dialog.",
								click: function(){

									try { CKEDITOR.instances["commentText"].destroy() } catch (e) {}
									try { CKEDITOR.instances["commentNote"].destroy() } catch (e) {}
									try { CKEDITOR.instances["commentInputText"].destroy() } catch (e) {}
									$( this ).dialog( "close" );
									$("#commentDialog").remove();
								}
							}					
						] 					
					});				
				}

			});	
		});

	});		

	//$('.box-wrap').antiscroll().data('antiscroll');
	scroller = $('.box-wrap').antiscroll().data('antiscroll');

}

function updateBankMenu(){
	issueMenu_arr = [];
	var issuesMsg = '';
	for(var h = 0; h < _issues.issues.length; h++){
		var label = h + 1;
		var tmpID = "bankItem"+h;
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

	$("#questionMenu").append(issuesMsg);

	for(var j = 0; j < issueMenu_arr.length; j++){
		if(currentIssueBankMember != j){
			var tmpID = "#" + issueMenu_arr[j];
			$(tmpID).click(function(){

				$('#bankItem'+ currentIssueBankMember).removeClass("selectedEditBankMember").addClass("unselectedEditBankMember");
				currentIssueBankMember = parseInt($(this).attr("data-myID"));
				$(this).removeClass("unselectedEditBankMember").addClass("selectedEditBankMember");
				try { CKEDITOR.instances["commentText"].destroy() } catch (e) {}
				try { CKEDITOR.instances["commentNote"].destroy() } catch (e) {}
				try { CKEDITOR.instances["commentInputText"].destroy() } catch (e) {}
				$(".questionBankItem").remove();
				$("#commentDisplayHolder").remove();
				$("#newComment").remove();
		
				updatePageIssues(false);

			}).tooltip();
		}
	}

}

function findStatusId(name){
	var myStatusId = 1;
	if(name == "In Progress"){
		myStatusId = 2;
	}
	else if(name == "Resolved"){
		myStatusId = 3;
	}
	else if(name == "Feedback"){
		myStatusId = 4;
	}
	else if(name == "Closed"){
		myStatusId = 5;
	}
	else if(name == "Rejected"){
		myStatusId = 6;
	}
	else if(name == "Tested"){
		myStatusId = 7;
	}
	return myStatusId;	
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

function closeAllPageIssues(_currentPage){
	var _issues = {};
	//get issues for the page
	var _page = {
		lessontitle: $(data).find('lessonTitle').attr('value'),
		coursetitle: $(data).find('courseTitle').attr('value'),
		lessonid: $(data).find('id').attr('value'),
		id: $(data).find("page").eq(_currentPage).attr("id")
	};

	cognizenSocket.emit('getRedminePageIssues', _page, function(fdata){
		_issues = fdata;
		if(_issues.total_count != 0){
			var issuesMsg = '';
			for(var h = 0; h < _issues.issues.length; h++){
				_issues.issues[h].notes = 'This page was deleted in Cognizen so the issue was closed.';

				_issues.issues[h].status_id = 5;

				cognizenSocket.emit('updateRedmineIssue', _issues.issues[h], username, function(err){
					if(err){
						alert(err);
					}
				});
			}
		}
	});	
}

function updateIndexCommentFlags(){
	if(!$(courseData).find("course").attr("redmine") || $(courseData).find("course").attr("redmine") == "false"){
		cognizenSocket.emit('getCourseCommentPages', {
			contentId: urlParams['id']
		});
	}
	else{
		var _data = {
			lessontitle: $(data).find('lessonTitle').attr('value'),
			coursetitle: $(data).find('courseTitle').attr('value'),
			id: $(data).find('id').attr('value') 
		};
		cognizenSocket.emit('getRedmineLessonIssuesForIndex', _data);		
	}
}

function updateRedmineCommentIcon(){
	var _layout = $(data).find('page').eq(currentPage).attr('layout');
	var _id = $(data).find("page").eq(currentPage).attr("id");
	var _title = $(data).find("page").eq(currentPage).find('title').text();
	if(_layout === 'branching' || _layout === 'chaining' || _layout === 'pathing'){
		_title = $(data).find("page").eq(currentPage).find('branch').eq(currentBranch).find('title').first().text();
		_id = $(data).find("page").eq(currentPage).find("branch").eq(currentBranch).attr("id");
	}

	var _page = {
		lessontitle: $(data).find('lessonTitle').attr('value'),
		coursetitle: $(data).find('courseTitle').attr('value'),
		lessonid: $(data).find('id').attr('value'),
		id: _id
	};			
	cognizenSocket.emit('getRedminePageIssues', _page, function(fdata){
		_issues = fdata;
        if(mode == "edit" || mode == "review"){
        	if(_issues.total_count > 0){
        		$("#comment").removeClass('commentOpen');
				$("#comment").removeClass('commentClosed');
				var isOpen = false;
	    		for(var h = 0; h < _issues.issues.length; h++){
	    			if(_issues.issues[h].status.id != 3 && !isOpen){
	    				$("#comment").addClass('commentOpen');
	    				isOpen = true;
	    			}
	    		}

	    		if(!isOpen){
	    			$("#comment").addClass('commentClosed');
	    		}		        		

	      }
	      else{
	      	$("#comment").removeClass('commentOpen');
	      	$("#comment").removeClass('commentClosed');
	      }  
        }				
	});		
}
