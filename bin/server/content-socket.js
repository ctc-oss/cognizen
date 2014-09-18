var http = require('http');
var fs = require('fs-extra');
var et = require('elementtree');
var readdirp = require('readdirp');
var archiver = require('archiver');
var scorm = require('./cognizen-scorm');
var openServers = [];
var io;

var ContentSocket = {
	
    start: function(port, path, contentPath, scormPath, logger, callback) {
        var xmlContentFile = contentPath + '/xml/content.xml';
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

        if (path) {
            io.set('resource', '/' + path);
            io.set('log level', 1);
//          io.set('polling duration', 600);
            logger.info('Socket.io resource set to /' + path);
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
        serverObj.id = path;
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
            socket.emit('onConnect', { hello: 'node connection established' });
			
            //Set listener to update the content.xml file
            socket.on('updateXMLWithRefresh', function (data) {
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
	            fs.outputFile(/*getXMLContentFile()*/xmlContentFile, data.my, function(err) {
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