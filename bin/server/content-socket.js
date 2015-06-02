var http = require('http');
var fs = require('fs-extra');
var et = require('elementtree');
var path = require('path');
var readdirp = require('readdirp');
var archiver = require('archiver');
var scorm = require('./cognizen-scorm');
var openServers = [];
var io;
/*var walk = require('walk');				///////////////////Comment before push
var walker;								///////////////////Comment before push	
var walkerOptions = {
    followLinks: false,
    // directories with these keys will be skipped 
	filters: ["edge_includes", ".DS_Store"]
  };	*/				

var ContentSocket = {
	
    start: function(port, _path, contentPath, scormPath, logger, callback) {
        var xmlContentFile = contentPath + '/xml/content.xml';
        var xmlCourseFile = contentPath + '/../course.xml';
        
        var mediaPath = contentPath + '/media/';
        var corePath = contentPath + '/../../core-prog/';
        var coursePath = contentPath + '/../css/CourseCSS/';
        var lessonPath = contentPath + '/css/';
        
		var thisPort = port;
        var	app = http.createServer(function (req, res) {
        	res.writeHead(404);
            return res.end('No content available');
        });

        if (port) {
            app.listen(port);
            io = require('socket.io').listen(app);
            logger.info('C_Server started successfully');
        }
        else {
            logger.error('Port must be provided as an argument');
            callback('Port must be provided as an argument');
            return;
        }

        if (_path) {
            io.set('resource', '/' + _path);
            io.set('log level', 1);
//          io.set('polling duration', 600);
            logger.info('Socket.io resource set to /' + _path);
        }
        else {
            logger.error('Path must be provided as an argument');
            callback('Path must be provided as an argument');
            return;
        }
        
        //POPULATE ARRAY OF APPS TO BE ABLE TO TURN SERVERS OFF...
        //IMPORTANT FOR ON RENAME TO UPDATE XML PATH
        //WOULD PREFER TO BE ABLE TO UPDATE xmlContentFile above!
        
        var serverObj = new Object();
        serverObj.app = app;
        serverObj.id = _path;
        serverObj.port = port;
        serverObj.xml = xmlContentFile;
        openServers.push(serverObj);
        
        
        function getXMLContentFile(){
	        for(var i = 0; i < openServers.length; i++){
		        if(openServers[i].port == thisPort){
			        return openServers[i].xml;
		        }
	        }
        }

        io.sockets.on('connection', function (socket) {
            socket.emit('onConnect', { hello: 'node connection established!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' });
			
			//Set listener to update the course.xml file
			socket.on('updateCourseXMLWithRefresh', function (data) {
				
				fs.outputFile(xmlCourseFile, data.my, function(err) {
					//Refresh the index if successfully updating the content.xml
                    if(err == null){
                        logger.debug("successfully updated course.xml - sending refresh ----------------------------------------------------------------------------");
                        socket.emit('updateCourseXMLWithRefreshComplete');
                        socket.broadcast.emit('pushUpdateCourseXMLWithRefreshComplete'); //Updates other connected clients
                    }else{
                        logger.error("content.xml update failed: " + err);
                    }
				})
			});
			
			//Set listener to get list of files in media folder
			socket.on('getMediaDir', function (data) {
				var p;
				
				if(data.loc == "core"){
					p = corePath + data.path;
				}else if(data.loc == "course"){
					p = coursePath + data.path;
				}else if(data.loc == "lesson"){
					p = lessonPath + data.path;
				}else{
					p = mediaPath + data.path;
				}
				
				fs.readdir(p, function(err, files){
    				
    				if (!files.length) {
	    				//Return for empty directory....
	    				//socket.emit('returnFileList', null);
        			}
        			
        			// called for each file walked in the directory
			        var file_dict = {};
			        var file_index = 0;
					var dir_dict = {};
					var dir_index = 0;
			        function file(i) {
			            var filename = files[i];
			            fs.stat(p + '/' + filename, function (err, stat) {
			
			                if (stat.isDirectory() || filename[0] == '.') {
			                    //List of directories to ignore.
			                    if(filename != "edge_includes" && filename[0] != '.'){
									++dir_index;
									dir_dict[dir_index] = filename;
								}
			                } else {
				                //List of filenames to ignore.
				                if(filename != ""){
			                    	++file_index;
									file_dict[file_index] = filename;
								}
			                };
			
			                if (++i == files.length) {
			                    var returnObject = {'dirs': dir_dict, 'files': file_dict};
								socket.emit('returnMediaDir', returnObject);
			                } else {
			                    // continue getting files
			                    return file(i);
			                };
			            });
			        }
			        return file(0);
			    });
			});

			socket.on('updateHelpLocation', function(data){
				fs.copy(path.normalize(contentPath + "/media/") + data.my , path.normalize(contentPath +'/../media/') + data.my, { replace: true }, function (err) {
				  if (err) {
				    // i.e. file already exists or can't write to directory 
				    throw err;
				  }
				  socket.emit("courseHelpLocationUpdated");
				});
			});
			
            //Set listener to update the content.xml file
            socket.on('updateXMLWithRefresh', function (data) {
                console.log("CALLED UPDATECONTENTXML");
                fs.outputFile(/*getXMLContentFile()*/xmlContentFile, data.my, function(err) {
                    
                    //Refresh the index if successfully updating the content.xml
                    if(err == null){
                        logger.debug("successfully updated content.xml - sending refresh ----------------------------------------------------------------------------");
                        socket.emit('updateXMLWithRefreshComplete');
                        socket.broadcast.emit('pushUpdateXMLWithRefreshComplete'); //Updates other connected clients
                    }else{
                        logger.error("content.xml update failed: " + err);
                    }

                })
            });
            
            //Set Listener for updates to the glossary.
            socket.on('updateXMLGlossary', function(data){
	            fs.outputFile(/*getXMLContentFile()*/xmlContentFile, data.my, function(err) {
                    //Refresh the index if successfully updating the content.xml
                    if(err == null){
                        socket.emit('updateGlossaryComplete');
                        socket.broadcast.emit('updateGlossaryComplete'); //Updates other connected clients
                    }else{
                        logger.error("content.xml update failed: " + err);
                    }
                })
            });
            
            //Set Listener for updates to the prefs.
            socket.on('updateXMLPrefs', function(data){
	            fs.outputFile(xmlContentFile, data.my, function(err) {
                    //Refresh the index if successfully updating the content.xml
                    if(err == null){
                        socket.emit('updatePrefsComplete');
                        socket.broadcast.emit('updatePrefsComplete'); //Updates other connected clients
                    }else{
                        logger.error("content.xml update failed: " + err);
                    }
                })
            });
            
             //Set Listener for updates to the prefs during publish.
            socket.on('updateXMLPrefsWithPublish', function(data){
	            fs.outputFile(/*getXMLContentFile()*/xmlContentFile, data.my, function(err) {
                    //Refresh the index if successfully updating the content.xml
                    if(err == null){
                        socket.emit('updatePrefsWithPublishComplete');
                        socket.broadcast.emit('updatePrefsComplete'); //Updates other connected clients
                    }else{
                        logger.error("content.xml update failed: " + err);
                    }
                })
            });

            //Update the page content
            socket.on('updateXML', function (data) {
                fs.outputFile(/*getXMLContentFile()*/xmlContentFile, data.my, function(err) {
                    //Refresh the index if successfully updating the content.xml
                    if (err == null){
                        socket.emit("pushUpdateXMLWithRefreshComplete");
                        socket.broadcast.emit('pushUpdateXMLWithRefreshComplete'); //Updates other connected clients -- Did this break it?
                    }
                    else{
                        logger.debug("Houston, we have a problem - the content.xml update failed - attempting to update glossary for node");
                    }
                })
            });
            
            //Update path on name change
            socket.on('updateXMLPath', function(data){
            	logger.info("HIT UPDATEXMLPATH YO with data.path = " + data.path);
            	xmlContentFile = data.path + '/xml/content.xml';
				logger.info("xmlContentFile = " + xmlContentFile);
            });

        });

        callback();
    }, 
    
    stop: function(myXML, myPort, myDir, logger){
	    logger.info("STOP BEEN CALLED");
	    for(var i = 0; i < openServers.length; i++){
		    if(myPort == openServers[i].port){
			    var server = openServers[i].app;
			    //server.emit()
			    server.close();
			    openServers.splice(i, 1);
			    //openServers[i].xml = myXML;
		    }
	    }
    }
};

module.exports = ContentSocket;