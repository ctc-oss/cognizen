/*
 *  	C_Sockets
 *  	Requires jQuery v1.9 or later
 *	
 *      Houses all of the socket listeners
 *  	Version: 0.5
 *		Date Created: 10/19/13
 *		Created by: Philip Double
 *		Date Updated: 10/19/13
 *		Updated by: Philip Double
 *		History: Moved all glossary functionality into its own js file.
 *		Todo: 	- Turn this into a plugin.  This did reside in C_Engine which was becoming unruly.
 *				- Optimize code.
 */
 
var xhr = false;
var socket, cognizenSocket, audioSocket, helpSocket, mediaSocket;
var siofu, siofuAudio, siofuHelp, siofuMedia; 
var siofuInitialized = {};
var forcedReviewer = false;
var activeEditor;
//var io;

function initializeSockets(){
	if(mode != "prod" && mode != "production"){
	    urlParams = queryStringParameters();
		//if we are in edit or review mode establish a socket to the server 					  
	   cognizenSocket = (xhr) ? io.connect(null, {resource: 'server', transports: ["websockets", "xhr-polling"], 'sync disconnect on unload' : true, 'force new connection': true, secure: secureSocket, 'connect timeout': 1000}) :
	                             io.connect(null, {resource: 'server', 'force new connection': true, 'sync disconnect on unload' : true, secure: secureSocket, 'connect timeout': 1000});
	   
	   /*cognizenSocket = io.connect({
					resource: 'server', 
					transports: ["websockets", "xhr-polling"], 
					//'sync disconnect on unload' : true, 
					'forceNew': true, 
					secure: secureSocket
					//'connect timeout': 1000,
					//'reconnect': true,
					//'reconnection delay': 500,
					//'max reconnection attempts': 10
				});*/
	                             
	    cognizenSocket.emit('userPermissionForContent', {
        	content: {type: urlParams['type'], id: urlParams['id']},
			user: {id: urlParams['u']}
        });
        
	    cognizenSocket.on("contentPermissionFound", function(data){
			if(data.permission == "admin" || data.permission == "editor"){
				mode = "edit";
			}else if(data.permission == "reviewer"){
				mode = "review";
			}else if(data.permission == "client"){
				mode = "review";
				clientReview = true;				
			}else if(data.permission == "forcedReviewer"){
				mode = "review";
//				if(!isIE){
					forcedReviewer = true;
//				}
			}else if(data.permission == "viewer"){
				mode = "production";
			}
			activeEditor = data.currentEditor;
			buildInterface();  
	    });
	    
	    cognizenSocket.on('updateActiveEditor', function(data){
		    updateActiveEditor(data);
	    });
	    
	    cognizenSocket.on('outlineActiveError', function(details) {
            //$("#preloadholder").remove();
            //window.clearInterval(myTimer);
            doError(details.title, details.message);
        });
	    
	    cognizenSocket.on('lockRequestAccepted', function (data){
		   openLockRequestAccepted(data); 
	    });
	    
	    cognizenSocket.on('grabLock', function (data){
		   grabLock(data); 
	    });
	    
	    cognizenSocket.on('lockRequestRefused', function (data){
		   openLockRequestRefused(data); 
	    });
	    
	    cognizenSocket.on('lockRequest', function (data){
		   openLockRequest(data); 
	    });
	    
	    cognizenSocket.on('connect_failed', function(){
	    	buildInterface();
    		alert('There is an error connecting to the production server. You can only view content.');
		});

	    cognizenSocket.on('commentAdded', function (_data) {
	        //clear the page comments from last page
			if(pageComments && pageComments.length > 0){
				pageComments.length = 0;
		    }
	        
	        cognizenSocket.emit('getContentComments', {
				contentId: urlParams['id'],
				pageId: $(data).find("page").eq(currentPage).attr("id")
			});
	        commentsOpen = true;
	        updateIndexCommentFlags();
	    });
	    
	    cognizenSocket.on("packageLinkAlert", function(data){
		  	doGitCommit();
		    var msg = '<div id="dialog-dlPackage" title="Retrieve your package"><p class="validateTips">A mail has been sent to you with a link for your package.</p><p>You can also download your content package by clicking the link below:<br/><br><a href='+data.path+' target="_blank">GET PACKAGE</a></p></div>';
			
			//Add to stage.
			$("#stage").append(msg);
		
			//Make it a dialog
			$("#dialog-dlPackage").dialog({
				modal: true,
				width: 550,
				close: function(event, ui){
						$("#dialog-dlPackage").remove();
					},
				buttons: {
					Close: function () {
		                    $(this).dialog("close");
					}
				}
			});
	    });
	    
	    cognizenSocket.on('retrievedContentComments', function (data) {
	    	if(pageComments && pageComments.length > 0){
		    	pageComments.length = 0;
	        }
			
	        pageComments = data;
	        
	        if(commentsOpen == true){
		        refreshPageComments();
				$("#commentInputText").empty();
	        }
	        
	        if(mode == "edit" || mode == "review"){
	        	if(pageComments.length > 0){
	        		$("#comment").removeClass('commentOpen');
					$("#comment").removeClass('commentClosed');
	        		var last = pageComments.length - 1;
		   		var status = pageComments[last].status;
		        	if(status == 'new' || status == 'inprogress'){
		        		$("#comment").addClass('commentOpen');
		        	}else{
			        	$("#comment").addClass('commentClosed');
		        	}
		      }else{
		      	$("#comment").removeClass('commentOpen');
		      	$("#comment").removeClass('commentClosed');
		      }  
	        }
	    });
	    
	    cognizenSocket.on("updateCommentIndex", function(data){
		  if(data && data.length > 0){
			  if(urlParams['id'] == data[0].contentId){
				  for(var i = 0; i < data.length; i++){
					  for(var j = 0; j < indexItem_arr.length; j++){
						  if(data[i].pageId == $(indexItem_arr[j]).attr('myID')){
							  $(indexItem_arr[j]).children("#commentSpot").removeClass("indexItemWithOpenComment");
							  $(indexItem_arr[j]).children("#commentSpot").removeClass("indexItemWithClosedComment");
							  if(data[i].status == 'closed'){
								$(indexItem_arr[j]).children("#commentSpot").addClass("indexItemWithClosedComment");  
							  }else{
							  	$(indexItem_arr[j]).children("#commentSpot").addClass("indexItemWithOpenComment");
							  }
						  }
					  }
				  } 
			   }
			}
	    });

	    cognizenSocket.on("updateRedmineCommentIndex", function(_data){
	    	_issues = _data;
	    	if(_issues.total_count != 0){

	    		var foundIssue_arr = [];
	    		for(var h = 0; h < _issues.issues.length; h++){

	    			var pageId = '';
	    			var statusId = 1;
	    			for (var i = 0; i < _issues.issues[h].custom_fields.length; i++) {
	    				if(_issues.issues[h].custom_fields[i].name === 'Page Id'){
	    					pageId = _issues.issues[h].custom_fields[i].value;
	    					statusId = _issues.issues[h].status.id;
	    				}
	    			};

					for(var j = 0; j < indexItem_arr.length; j++){
						if($.inArray(pageId, foundIssue_arr) == -1){
							if(pageId == $(indexItem_arr[j]).attr('myID')){
								  $(indexItem_arr[j]).children("#commentSpot").removeClass("indexItemWithOpenComment");
								  $(indexItem_arr[j]).children("#commentSpot").removeClass("indexItemWithClosedComment");
								  //if status == Resolved	
								  if(statusId == 3){
									$(indexItem_arr[j]).children("#commentSpot").addClass("indexItemWithClosedComment");  
								  }else{
								  	$(indexItem_arr[j]).children("#commentSpot").addClass("indexItemWithOpenComment");
								  	foundIssue_arr.push(pageId);	
								  }					
							}
							else{
								if($(data).find('page[id="'+$(indexItem_arr[j]).attr('myID')+'"]').children('branch[id="'+pageId+'"]').length > 0){
								  $(indexItem_arr[j]).children("#commentSpot").removeClass("indexItemWithOpenComment");
								  $(indexItem_arr[j]).children("#commentSpot").removeClass("indexItemWithClosedComment");
								  //if status == Resolved	
								  if(statusId == 3){
									$(indexItem_arr[j]).children("#commentSpot").addClass("indexItemWithClosedComment");  
								  }else{
								  	$(indexItem_arr[j]).children("#commentSpot").addClass("indexItemWithOpenComment");
								  	foundIssue_arr.push(pageId);	
								  }										
								}
							}
						}

					}
	    		}
	    	}

	    });

	    cognizenSocket.on('commentNotAdded', function (data) {
	        //console.log('FOO');
	    });

		//Simple listener checking connectivity
		cognizenSocket.on('setUsername', function (data) {
           username = data.username.username;
		   userID = data.username._id;
           if(username == undefined){
	           alert("your username was not set properly. please close this lesson, log out and try to log back in.");
           }
		});

	    //used in C_VisualMediaHolder.js, C_NavControl.js and C_AudioHolder.js
	    siofu = new SocketIOFileUpload(cognizenSocket);   
		
		socket = (xhr) ? io.connect(null, {resource: urlParams['id'], transports: ["websockets", "xhr-polling"], 'force new connection': true, 'sync disconnect on unload' : true, secure: secureSocket, 'connect timeout': 1000}) :
                         io.connect(null, {resource: urlParams['id'], 'force new connection': true, 'sync disconnect on unload' : true, secure: secureSocket, 'connect timeout': 1000});
		
        /*socket = io.connect({
						resource: urlParams['id'], 
						transports: ["websockets", "xhr-polling"], 
						//'sync disconnect on unload' : true, 
						'forceNew': true, 
						//secure: secureSocket
						//'connect timeout': 1000,
						//'reconnect': true,
						//'reconnection delay': 500,
						//'max reconnection attempts': 10
					});*/
		socket.on('siofu_progress', function (data) {
            //console.log('progress data: ' + data);
		});
		
		socket.on('onConnect', function(data){
			
		});
		
		socket.on('pushUpdateCourseXMLWithRefreshComplete', function(){
			
		});
		
		socket.on('returnMediaDir', function(data){
			if(data == null){
				//Empty directory
				updateMediaBrowserDir(null);
			}else{
				//Do what you do to setup directory...
				updateMediaBrowserDir(data);
			}
		});
		
		socket.on('updateCourseXMLWithRefreshComplete', function(){
			if(mode == "edit"){
		        doGitCommit();
		    }
		    
		    if(courseGlossary){
		    	updateCourseGlossary();
		    }
		});

		socket.on('updateXMLWithRefreshComplete', function(){
	        if(mode == "edit"){
		        doGitCommit();
		    }
			updateIndex();
		});
		
		socket.on('updateGlossaryComplete', function(){
			if(mode == "edit"){
				doGitCommit();
	        }
			updateGlossary();
		});
		
		socket.on('updatePrefsComplete', function(){
			if(mode == "edit"){
				doGitCommit();
			}
			updatePrefs();
		});
		
		socket.on('updatePrefsWithPublishComplete', function(){
			if(mode == "edit"){
				doGitCommit();
			}
			updatePrefs(true);
		});

        socket.on('pushUpdateXMLWithRefreshComplete', function(){
            pushedUpdate = true;
            if(mode == "edit"){
	            doGitCommit();
	        }
            updateIndex();
        });
	}else{
		buildInterface();
	}
	
}

function doGitCommit(){
	var urlParams = queryStringParameters();
	cognizenSocket.emit('contentSaved', {
		content: {type: urlParams['type'], id: urlParams['id']},
		user: {id: urlParams['u']}
	});
}