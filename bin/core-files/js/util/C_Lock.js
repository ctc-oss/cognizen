var justRelinquishedLock = false;

function updateActiveEditor(_user){
	if(username == _user){
		var msg = '<div id="dialog-offerEdit" title="Editor Queue"><p class="validateTips">'+ activeEditor +' has left this session and you are the next in line to edit.</p><p>Would you like to edit this lesson?</p></div>';
			
		//Add to stage.
		$("#stage").append(msg);
				
		//Make it a dialog
		$("#dialog-offerEdit").dialog({
			dialogClass: "no-close",
			modal: true,
			width: 550,
			close: function(event, ui){
				$("#dialog-offerEdit").remove();
			},
			buttons: {
				YES: function () {
					mode = "edit";
					forcedReviewer = false;
					activeEditor = _user;
					buildInterface();
					cognizenSocket.emit('editModeAccepted', {me: _user})
					$(this).dialog("close");
				},
				NO: function(){
					cognizenSocket.emit('passLock', { me: _user });
					$(this).dialog("close");
				}
			}
		});
	}
}

function openLockRequest(_data){
	if(username == _data.requestee){
		var msg = '<div id="dialog-incomingLockRequest" title="Request for Edit Control"><p class="validateTips">'+ _data.requester +' is requesting permission to edit this lesson.</p><p>You currently hold the lock on edit controls.  Would you like to give '+ _data.requester +' the edit lock?  Your rights will be changed to reviewer mode.</p></div>';
			
		//Add to stage.
		$("#stage").append(msg);
				
		//Make it a dialog
		$("#dialog-incomingLockRequest").dialog({
			dialogClass: "no-close",
			modal: true,
			width: 550,
			close: function(event, ui){
				$("#dialog-incomingLockRequest").remove();
			},
			buttons: {
				YES: function () {
					mode = "review";
					justRelinquishedLock = true;
					forcedReviewer = true;
					activeEditor = _data.requester;
					cognizenSocket.emit('approveLockRequest', { me: username, requester: _data.requester });
					buildInterface();
					$(this).dialog("close");
				},
				NO: function(){
					cognizenSocket.emit('refuseLockRequest', { me: username, requester: _data.requester });
					$(this).dialog("close");
				}
			}
		});
	}
}

function openLockRequestAccepted(_data){
	console.log(_data);
	activeEditor = _data.requester;
	if(username == _data.requester){
		var msg = '<div id="dialog-incomingLockRequest" title="Request Accepted"><p class="validateTips">You now have the lock to edit this lesson.</p><p>You currently hold the lock on edit controls so <b>be certain to close this lesson window or relinquish lock if you are not actively working on the lesson!</b></p></div>';
			
		//Add to stage.
		$("#stage").append(msg);
				
		//Make it a dialog
		$("#dialog-incomingLockRequest").dialog({
			dialogClass: "no-close",
			modal: true,
			width: 550,
			close: function(event, ui){
				$("#dialog-incomingLockRequest").remove();
			},
			buttons: {
				OK: function () {
					mode = "edit";
					forcedReviewer = false;
					activeEditor = _data.requester;
					buildInterface();
					$(this).dialog("close");
				}
			}
		});
	}
}

function openLockRequestRefused(_data){
	if(username == _data.requester){
		var msg = '<div id="dialog-incomingLockRequest" title="Request Denied"><p class="validateTips">'+ _data.me +' has refused your request for edit controls.  Contact them at their e-mail to follow up and plan access.</p></div>';
			
		//Add to stage.
		$("#stage").append(msg);
				
		//Make it a dialog
		$("#dialog-incomingLockRequest").dialog({
			dialogClass: "no-close",
			modal: true,
			width: 550,
			close: function(event, ui){
				$("#dialog-incomingLockRequest").remove();
			},
			buttons: {
				OK: function(){
					$(this).dialog("close");
				}
			}
		});
	}
}



function forcedReviewAlert(){
	var msg = '<div id="dialog-locked" title="Content: Locked"><p class="validateTips">This lesson is currently being edited by '+ activeEditor +'.</p><p>Your priveleges are being set to review mode. You can view the content but cannot edit it.</p></div>';
			
	//Add to stage.
	$("#stage").append(msg);
			
	//Make it a dialog
	$("#dialog-locked").dialog({
		dialogClass: "no-close",
		modal: true,
		width: 550,
		close: function(event, ui){
			$("#dialog-locked").remove();
		},
		buttons: {
			OK: function () {
				$(this).dialog("close");
			}
		}
	});
}
