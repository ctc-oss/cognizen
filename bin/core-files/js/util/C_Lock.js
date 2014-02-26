var justRelinquishedLock = false;

function updateActiveEditor(_user){
	console.log("update active editor to: " +_user);
	activeEditor = _user;
	/*if(username == _user){
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
					$(this).dialog("close");
					nextDisabled = true;
					backDisabled = true;
					buildInterface();
					cognizenSocket.emit('editModeAccepted', {me: _user})
					
				},
				NO: function(){
					$(this).dialog("close");
					cognizenSocket.emit('passLock', { me: _user });
				}
			}
		});
	}*/
}


var requestInterval;
var lockCounter = $(data).find('lockRequestDuration').attr("value");
var alertSnd;
function startLockTimer(_data){
	lockCounter = $(data).find('lockRequestDuration').attr("value");
	requestInterval = setInterval(function() {
		lockCounter--;
		$("#lockCountdown").text(lockCounter);
		if(lockCounter == 10){
			alertSnd.play();
		}
		if(lockCounter <= 10){
			$("#lockCountdown").css("color", "red");
		}
		if (lockCounter == 0) {
			
			mode = "review";
			justRelinquishedLock = true;
			forcedReviewer = true;
			activeEditor = _data.requester;
			cognizenSocket.emit('approveLockRequest', { me: username, requester: _data.requester });
			$("#dialog-incomingLockRequest").dialog("close");
			nextDisabled = true;
			backDisabled = true;
			buildInterface();
			openTimeOutAlert(_data);
			clearInterval(requestInterval);
		}
	}, 1000);
}

function openTimeOutAlert(_data){
	var msg = '<div id="dialog-incomingLockRequestTimeout" title="Request for Edit Control"><p class="validateTips">'+ _data.requester +' was given the editor lock becuase you did not respond to the request.</p><p>To request the lock back, close this dialog and click on the lock icon below.</p></div>';
			
	//Add to stage.
	$("#stage").append(msg);
	
	//Make it a dialog
	$("#dialog-incomingLockRequestTimeout").dialog({
		dialogClass: "no-close",
		modal: true,
		width: 550,
		close: function(event, ui){
			$("#dialog-incomingLockRequestTimeout").remove();
		},
		buttons: {
			OK: function () {
				$(this).dialog("close");
			}
		}
	});
}


function openLockRequest(_data){
	if(username == _data.requestee){
		var msg = '<div id="dialog-incomingLockRequest" title="Request for Edit Control"><p class="validateTips">'+ _data.requester +' is requesting permission to edit this lesson.</p><p>You currently hold the lock on edit controls.  Would you like to give '+ _data.requester +' the edit lock?  Your rights will be changed to reviewer mode.</p><p>If you do not make a choice in <span id="lockCountdown"> </span> seconds the lock will be passed to '+ _data.requester + '.</p></div>';
		
		$("#lockCountdown").text(lockCounter);	
		//Add to stage.
		$("#stage").append(msg);
		startLockTimer(_data);	
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
					$(this).dialog("close");
					nextDisabled = true;
					backDisabled = true;
					clearInterval(requestInterval);
					buildInterface();
				},
				NO: function(){
					cognizenSocket.emit('refuseLockRequest', { me: username, requester: _data.requester });
					clearInterval(requestInterval);
					$(this).dialog("close");
				}
			}
		});
		
		alertSnd = new Audio("media/RequestAlert.mp3"); // buffers automatically when created
		alertSnd.play();
	}
}

function openLockRequestAccepted(_data){
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
					$(this).dialog("close");
					nextDisabled = true;
					backDisabled = true;
					buildInterface();
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
	if(activeEditor == null){
		var msg = '<div id="dialog-locked" title="Content: Locked"><p class="validateTips">This lesson is not currently being edited.</p><p>To make edits, click the lock icon.</p></div>';
	}else{
		var msg = '<div id="dialog-locked" title="Content: Locked"><p class="validateTips">This lesson is currently being edited by '+ activeEditor +'.</p><p>You can view the content but cannot edit it.</p><p>To request the lock from ' + activeEditor + ', click the lock icon.</p></div>';
	}
			
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
