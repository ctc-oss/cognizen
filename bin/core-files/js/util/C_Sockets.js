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
var socket;
var cognizenSocket;
var siofu;
var siofuInitialized = {};
var forcedReviewer = false;
 
function initializeSockets(){
	if(mode == "edit" || mode == "review"){
	    urlParams = queryStringParameters();
		//if we are in edit or review mode establish a socket to the server.
	    //Add a check for IE < 10...
	    //cognizenSocket = (xhr) ? io.connect(null, {resource: 'server', transports: ["websockets", "xhr-polling"], 'sync disconnect on unload' : true, 'force new connection': true, secure: secureSocket, 'connect timeout': 1000}) :
	    //                         io.connect(null, {resource: 'server', 'force new connection': true, 'sync disconnect on unload' : true, secure: secureSocket, 'connect timeout': 1000});
	    
	    //var xhr = true;
		//socket = (xhr) ? io.connect(null, {resource: "server", 'sync disconnect on unload' : true, transports: ["websockets", "xhr-polling"]}) :
                     //io.connect(null, {resource: "server", 'sync disconnect on unload' : true});
	
		
		if (isOldIE()){
			cognizenSocket = io.connect(null, {resource: "server", transports: ["flashsocket", "xhr-polling"], 'sync disconnect on unload' : true, 'connect timeout': 1000});
		}else{
			cognizenSocket = io.connect(null, {resource: "server", 'sync disconnect on unload' : true, 'connect timeout': 1000});
		}
	    
	    cognizenSocket.emit('userPermissionForContent', {
        	content: {type: urlParams['type'], id: urlParams['id']},
			user: {id: urlParams['u']}
        });

	    cognizenSocket.on("contentPermissionFound", function(data){
			if(data.permission == "admin" || data.permission == "editor"){
				mode = "edit";
			}else if(data.permission == "reviewer"){
				mode = "review";
			}else{
				mode = "review";
				forcedReviewer = true;
			}
			buildInterface();  
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

	    cognizenSocket.on('commentNotAdded', function (data) {
	        //console.log('FOO');
	    });

	    siofu = new SocketIOFileUpload(cognizenSocket);

		//socket = (xhr) ? io.connect(null, {resource: urlParams['id'], transports: ["websockets", "xhr-polling"], 'force new connection': true, 'sync disconnect on unload' : true, secure: secureSocket, 'connect timeout': 1000}) :
        //                 io.connect(null, {resource: urlParams['id'], 'force new connection': true, 'sync disconnect on unload' : true, secure: secureSocket, 'connect timeout': 1000});

		if (isOldIE()){
			socket = io.connect(null, {resource: urlParams['id'], transports: ["flashsocket", "xhr-polling"], 'force new connection': true, 'sync disconnect on unload' : true, secure: secureSocket, 'connect timeout': 1000});
		}else{
			socket = io.connect(null, {resource: urlParams['id'], 'force new connection': true, 'sync disconnect on unload' : true, secure: secureSocket, 'connect timeout': 1000});
		}
		
		//Simple listener checking connectivity
		socket.on('onConnect', function (data) {
            console.log('connected to cserver' + data);
		});
		
		socket.on('siofu_progress', function (data) {
            //console.log('progress data: ' + data);
		});
		

		socket.on('updateXMLWithRefreshComplete', function(){
            cognizenSocket.emit('contentSaved', {
                content: {type: urlParams['type'], id: urlParams['id']},
                user: {id: urlParams['u']}
            });
            updateIndex();
		});
		
		socket.on('updateGlossaryComplete', function(){
			cognizenSocket.emit('contentSaved', {
                content: {type: urlParams['type'], id: urlParams['id']},
                user: {id: urlParams['u']}
            });
			updateGlossary();
		});
		
		socket.on('updatePrefsComplete', function(){
			cognizenSocket.emit('contentSaved', {
				content: {type: urlParams['type'], id: urlParams['id']},
                user: {id: urlParams['u']}
			});
			updatePrefs();
		});
		
		socket.on('updatePrefsWithPublishComplete', function(){
			cognizenSocket.emit('contentSaved', {
				content: {type: urlParams['type'], id: urlParams['id']},
                user: {id: urlParams['u']}
			});
			updatePrefs(true);
		});

        socket.on('pushUpdateXMLWithRefreshComplete', function(){
            pushedUpdate = true;
            cognizenSocket.emit('contentSaved', {
                content: {type: urlParams['type'], id: urlParams['id']},
                user: {id: urlParams['u']}
            });
            updateIndex();
        });
	}else{
		buildInterface();
	}
	
}