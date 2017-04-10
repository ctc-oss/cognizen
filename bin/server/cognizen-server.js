var config = require('./config.json');
var Utils = require('./cognizen-utils');

var http = require('http');
var https = require('https');
var httpProxy = require('http-proxy');
var path = require("path");
var et = require('elementtree');
var express = require('express');
var session = require('express-session');
var cookie = require("cookie");
var connect = require("connect");
var cookieParser = require("cookie-parser");
var cookieParser = require('cookie-parser');
var socketIo = require('socket.io');

var fs = require('fs-extra');
var winston = require('winston');
var ffmpeg = require('fluent-ffmpeg');

// Load Underscore.string for string manipulation
var _ = require("underscore");
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string'); // => true

var mongoose = require('mongoose');
var UserModel = require('./user-model');
var User = UserModel.User;
var UserPermission = UserModel.UserPermission;
var ContentModel = require('./content-model');
var Program = ContentModel.Program;
var Course = ContentModel.Course;
var Lesson = ContentModel.Lesson;
var ContentComment = ContentModel.ContentComment;
var io;

var logFolder = Utils.defaultValue(config.logFolder, './');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: 'info',
            timestamp: true
        }),
        new (winston.transports.File)({
            filename: logFolder + 'cognizen.log',
            timestamp: true
        })
    ]
});

var Ports = {
    external: {
        port: Utils.defaultValue(config.port, 9443)
    },
    proxy: {
        port: 8088
    },
    server: {
        port: 22800,
        path: '/server'
    },
    git: {
        port: 22898,
        path: '/git'
    },
    initialContent: {
        port: 22801
    }
};

// Don't check these into the repository, to generate your own cert for testing:
//     openssl genrsa -out privatekey.pem 2048
//     openssl req -new -key privatekey.pem -out certrequest.csr
//     openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
if (config.ssl) {
    var Certs = {
        key: fs.readFileSync('privatekey.pem'),
        cert: fs.readFileSync('certificate.pem')
    };
}

//////////////////////////////////////////////////////////////////////
// MAIL FUNCTIONALITY
//////////////////////////////////////////////////////////////////////
var Mail = require('./cognizen-mail').init(config, logger);

var SocketSessions = {
    socketUsers: [],

    sessionIdFromSocket: function(socket) {
        return connect.utils.parseSignedCookies(cookie.parse(decodeURIComponent(socket.handshake.headers.cookie)), 'cognizen')['connect.sid'];
    }
};

var Content = {
    DELETED_SUFFIX: '_DELETED',
    currentContentPort: Ports.initialContent.port,
    contentServerDetails: {},
    serverDetails: function (content) {
        // Check the map, if no port exists, grab the next one in sequence
        if (!this.contentServerDetails[content.id]) {
            this.contentServerDetails[content.id] = {
                port: this.currentContentPort++,
                running: false
            };
        }
        return this.contentServerDetails[content.id];
    },

    userPermittedContent: function (user, allContent) {
        var allContentArray = _.values(allContent);
        if (user.admin) {
            var allDashboardItems = [];
            allContentArray.forEach(function(item) {
                var dashboardItem = item.toDashboardItem();
                dashboardItem.permission = 'admin';
                allDashboardItems.push(dashboardItem);
            });
            return {directories: allDashboardItems};
        }

        var parentsToAdd = [];
        var accessibleContent = {};
        allContentArray.forEach(function (content) {
            user.permissions.forEach(function (permission) {
                if (permission.contentId == content.id) {
                    content.permission = permission.permission;
                    accessibleContent[content.id] = content;

                    var parent = content.getParent();
                    while (parent) { // This should get all parents to the top.
                        parent = allContent[parent.id];
                        if (parent) {
                            parentsToAdd.push(parent);
                            parent = parent.getParent();
                        }
                    }
                }
            });
        });

        // At this point, we have all content that the user has been directly tied to.
        // First, let's get all the parent content and assign permissions as such:
        parentsToAdd.forEach(function(parent) {
            accessibleContent[parent.id] = parent;
        });

        // At this point, we should have programs down to all accessible content.
        // Now, we just need to get leaves of all accessible content.
        var parents = _.keys(accessibleContent);

        var childrenToAdd = [];
        parents.forEach(function(id) {
            allContentArray.forEach(function (content) {
                var parent = content.getParent();
                if (parent && parent.id == id) {
                    childrenToAdd.push(content);
                    parents.push(content.id);
                }
            });
        });

        childrenToAdd.forEach(function(child) {
            accessibleContent[child.id] = child;
        });

        var accessibleContentArray = [];
        for (var id in accessibleContent) {
            if (accessibleContent.hasOwnProperty(id)) {
                var dashboardItem = accessibleContent[id].toDashboardItem();
                accessibleContentArray.push(dashboardItem);
            }
        }
        return {directories: accessibleContentArray};
    },

    updateContentXml: function(content, updater, callback) {
        var baseWritePath = path.normalize(Content.diskPath(content.path));
        var fileLink = baseWritePath + "/xml/content.xml";
        fs.exists(fileLink, function(exists) {
            if (exists) {
                var data = fs.readFileSync(fileLink).toString();
                var etree = et.parse(data);
                updater(content, etree);
                var xml = etree.write({'xml_decleration': false});
                fs.outputFile(fileLink, xml, function (err) {
                    if (callback) callback(err);
                })
            }
        });
    },

    updateAllXml: function(mongooseObjects, updater, success) {
        var _this = this;
        var count = 0;
        mongooseObjects.forEach(function(item){
            _this.updateContentXml(item, updater);
            count++;
            if( count == mongooseObjects.length ){
                success();
            }
        });
    },

    allContentForUser: function(socket, user, callback) {
        var _this = this;
        if (!user || !user.username) {
            user = {username: '', admin: false};
        }

        var allContent = {};

        User.findOne({username: user.username}).populate('permissions').exec(function (err, loggedInUser) {
            if (!loggedInUser) {
                var data = _this.userPermittedContent(user, allContent);
                if (callback) {
                    callback(data);
                }
                else{
                    socket.emit('receiveProjectsFromDB', data);
                }
            }
            else {
                var deleted = [{'deleted': null}, {'deleted': false}];
                Program.find().or(deleted).exec(function (err, programs) {
                    programs.forEach(function(program) {
                        allContent[program.id] = program;
                    });

                    Course.find().or(deleted).populate('program').exec(function(err, courses) {
                        courses.forEach(function(course) {
                            allContent[course.id] = course;
                        });

                        Lesson.find().or(deleted).populate('course').exec(function(err, lessons) {
                            lessons.forEach(function(lesson) {
                                allContent[lesson.id] = lesson;
                            });

                            var data = _this.userPermittedContent(loggedInUser, allContent);
                            if (callback) {
                                callback(data);
                            }
                            else{
                                socket.emit('receiveProjectsFromDB', data);
                                //socket.emit('updateOutlineData', data);
                            }
                        });
                    });
                });
            }
        });
    },

    allClonableContentForUser: function(socket, clone, callback)
    {
        var _this = this;
        //console.log(clone);
        if (!clone.user || !clone.user.username) {
            clone.user = {username: '', admin: false};
        }

        var allContent = {};

        User.findOne({username: clone.user.username}).populate('permissions').exec(function (err, loggedInUser) {
            if (!loggedInUser) {
                var data = _this.userPermittedContent(clone.user, allContent);
                if (callback) {
                    callback(data);
                }
                else{
                    socket.emit('receiveProjectsFromDB', data);
                }
            }
            else {               
                var deleted = [{'deleted': null}, {'deleted': false}];
                //clone.level == 'root' then clone projects                
                if(clone.level == 'root'){
                    Program.find().or(deleted).exec(function (err, programs) {
                        programs.forEach(function(program) {
                            allContent[program.id] = program;
                        });

                        var data = _this.userPermittedContent(loggedInUser, allContent);
                        if (callback) {
                            callback(data);
                        }
                        else{
                            socket.emit('receiveClonableFromDB', data);
                        }

                    });
                }
                //clone.level == 'project' then clone courses
                else if(clone.level == 'project'){
                    Course.find().or(deleted).populate('program').exec(function(err, courses) {
                        courses.forEach(function(course) {
                            allContent[course.id] = course;
                        });

                        var data = _this.userPermittedContent(loggedInUser, allContent);
                        if (callback) {
                            callback(data);
                        }
                        else{
                            socket.emit('receiveClonableFromDB', data);
                        }                    

                    }); 
                }
                //clone.level == 'lesson' then clone lessons
                else{                  
                    Lesson.find().or(deleted).populate('course').exec(function(err, lessons) {
                        lessons.forEach(function(lesson) {
                            allContent[lesson.id] = lesson;
                        });

                        var data = _this.userPermittedContent(loggedInUser, allContent);
                        if (callback) {
                            callback(data);
                        }
                        else{
                            socket.emit('receiveClonableFromDB', data);
                        }
                    }); 
                }                            
            }
        });

    },

    objectType: function (typeName) {
        return eval(_.str.capitalize(typeName.toLowerCase()));
    },

    diskPath: function (contentPath) {
        return path.normalize('../programs/' + contentPath);
    },

    startProxyServer: function (callback) {
        var proxyServer = require('http-proxy').createServer(function (req, res, proxy) {
            logger.verbose('Proxy Request: ' + req.url);

            var backendPort;
            var idMatches = req.url.match(/\/[0-9a-f]{24}/);

            if (req.url.indexOf(Ports.server.path) == 0) {
                backendPort = Ports.server.port;
            }
            else if (req.url.indexOf(Ports.git.path) == 0) {
                req.url = req.url.replace('/git', ''); // Remove the git part of the path, since it is not part of the GIT url.
                backendPort = Ports.git.port;
            }
            else if (idMatches && idMatches.length == 1) {
                var id = idMatches[0].substring(1);
                // Lookup the content ID in the port map, and send it to that one.
                // Pull the id out of the url by removing the first slash
                var details = Content.serverDetails({id: id});
                if (details && details.port) {
                    backendPort = details.port;
                }
                else {
                    logger.info("Couldn't find content related to '" + req.url + "'")
                }
            }
            else {
                backendPort = Ports.server.port;
            }

            logger.verbose('-- Proxying to port ' + backendPort);
            if (backendPort) {
                proxy.proxyRequest(req, res, {
                    host: 'localhost',
                    port: backendPort
                });
            }
            else {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Content Not Found');
            }
        });

        proxyServer.listen(Ports.proxy.port);

        var cognizenProxy = new httpProxy.HttpProxy({
            target: {
                host: 'localhost',
                port: Ports.proxy.port
            }
        });

        var externalServer;

        if (config.ssl) {
            externalServer = https.createServer(Certs, function (req, res) {
                cognizenProxy.proxyRequest(req, res)
            });
        }
        else {
            externalServer = http.createServer(function (req, res) {
                cognizenProxy.proxyRequest(req, res)
            });
        }

        externalServer.listen(Ports.external.port, '0.0.0.0', null, function () {
            if (config.ssl) {
                logger.info('HTTPS Web Application available on port ' + Ports.external.port);
            }
            else {
                logger.info('HTTP Web Application available on port ' + Ports.external.port);
            }

            if (typeof process.getuid == 'function') {
                if (process.getuid() == 0) {
                    process.setgid('cognizen');
                    process.setuid('nobody');
                    logger.info('Dropped process from root to nobody');
                } else {
                    logger.info('No need to drop from root to nobody');
                }
            } else {
                logger.info('No need to drop from root to nobody');
            }

            callback();
        });
    }
};
// Initializing Code
(function () {
    process.on('exit', Utils.shutdown);
    process.on("SIGINT", Utils.shutdown);
    process.on("uncaughtException", Utils.generalError);

    mongoose.connect(config.dbUrl, {
        user: config.dbUsername,
        pass: config.dbPassword
    },function (err) {
        if (err) throw err;
        logger.info('Successfully connected to ' + config.dbUrl + ' with username ' + config.dbUsername);
    });

    var app = express();
    app.use(cookieParser('cognizen'));
    app.use(session());
    app.get('/logout', function(req, res) {
        if (req.session) {
            req.session.auth = null;
            res.clearCookie('auth');
            req.session.destroy(function() {});
        }
        res.redirect('/');
    });
    app.use(express.static(path.join(__dirname, '../')));
    app.use(function(req, res) {
        logger.info('404: ' + req.url);
        // This will redirect 404s to the home page.
        res.redirect('/');
    });

    io = socketIo.listen(app.listen(Ports.server.port, null, null, function () {
        logger.info('Cognizen Server Started');
    }));
    io.set('resource', Ports.server.path);
    io.set('log level', 1);

//    io.set('authorization', function (handshakeData, accept) {
//        if (handshakeData.headers.cookie) {
//            handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
//            handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['connect.sid'], 'cognizen');
//            console.log('SID:::::' + handshakeData.sessionID);
//            if (handshakeData.cookie['connect.sid'] == handshakeData.sessionID) {
//                return accept('Cookie is invalid.', false);
//            }
//        } else {
//            return accept('No cookie transmitted.', false);
//        }
//
//        return accept(null, true);
//    });


    //io.enable('browser client minification');  // send minified client
    //io.enable('browser client etag');          // apply etag caching logic based on version number
    //io.enable('browser client gzip');          // gzip the file
    //io.set('log level', 1);                    // reduce logging

    // enable all transports (optional if you want flashsocket support, please note that some hosting
    // providers do not allow you to create servers that listen on a port different than 80 or their
    // default port)
    
    //io.set('polling duration', 600);
    io.configure(function () {
    	io.set('connect timeout', 1000);
        io.set('heartbeat timeout', 5);
        //io.set('close timeout', 25);
	    io.set('transports', [
	        'websocket',
	        'xhr-polling',
	        'jsonp-polling',
	        'flashsocket',
	        'htmlfile'
	    ]);
    });

    var Git = require('./cognizen-git').init(logger, Ports, Content);
    var SocketHandler = require('./cognizen-socket-handler').init(config, logger, SocketSessions, Mail, Content, Git, io);

    Content.startProxyServer(function () {
        Git.startServer();

        /*******************************************************************************************
         FIRE UP THE SOCKET SERVER AND SETUP LISTENERS
         *******************************************************************************************/
        var count = 0;
        io.sockets.on('connection', function (socket) {
			//console.log("----------------------------------------- " + socket.transport);
			
			SocketHandler.socket(socket).setUsername();
			//SocketHandler.socket(socket).cleanupUserArray();
            SocketHandler.socket(socket).setupFileUploadHandler();
			
			socket.on('disconnect', function () {
				SocketHandler.socket(socket).disconnect(socket);
			});
			
			socket.on('allowTool', function(data){
				SocketHandler.socket(socket).allowTool(data);
			});
			
			socket.on('passLock', function (data){
	           SocketHandler.socket(socket).passLock(data); 
            });
            
            socket.on('requestLock', function (data){
	            SocketHandler.socket(socket).requestLock(data);
            });
            
            socket.on('approveLockRequest', function (data){
	            SocketHandler.socket(socket).approveLockRequest(data);
            });
            
            socket.on('refuseLockRequest', function (data){
	            SocketHandler.socket(socket).refuseLockRequest(data);
            });
			
			socket.on('editModeAccepted', function (data){
				SocketHandler.socket(socket).editModeAccepted(data);
			});
			
            socket.on('checkLoginStatus', function() {
                SocketHandler.socket(socket).checkLoginStatus();
            });
			
			socket.on('getCoursePath', function(data){
				SocketHandler.socket(socket).getCoursePath(data);
			});
			
			socket.on('updateCourseXML', function(data){
				SocketHandler.socket(socket).updateCourseXML(data);
			});
			
			socket.on('mediaBrowserRemoveMedia', function(data){
				SocketHandler.socket(socket).mediaBrowserRemoveMedia(data);
			});
			
			socket.on('mediaBrowserRemoveDir', function(data){
				SocketHandler.socket(socket).mediaBrowserRemoveDir(data);
			});
			
			socket.on('mediaBrowserCreateDir', function(data){
				SocketHandler.socket(socket).mediaBrowserCreateDir(data);
			});
			
			socket.on('mediaBrowserDownloadMedia', function(data){
				SocketHandler.socket(socket).mediaBrowserDownloadMedia(data);
			});
			
			socket.on('updateModuleXML', function(data){
				SocketHandler.socket(socket).updateModuleXML(data);
			});

            socket.on('getProjects', function (data) {
                Content.allContentForUser(socket, data);
            });
            
            socket.on('getHostedContent', function (data) {
                SocketHandler.socket(socket).getHostedContent(data);
            });

            socket.on('getPermissions', function (data) {
                SocketHandler.socket(socket).getPermissions(data);
            });

            socket.on('attemptLogin', function (data) {
                SocketHandler.socket(socket).attemptLogin(data);
            });

            socket.on('confirmUser', function (data) {
                SocketHandler.socket(socket).confirmUser(data);
            });

            socket.on('resetPass', function (data) {
                SocketHandler.socket(socket).resetPassword(data);
            });

            socket.on('processForgotPass', function (data) {
                SocketHandler.socket(socket).processForgotPassword(data);
            });

            socket.on('registerUser', function (data) {
                SocketHandler.socket(socket).registerUser(data);
            });

            socket.on('getUserList', function () {
                SocketHandler.socket(socket).getUserList();
            });

            socket.on('registerProgram', function (data) {
                SocketHandler.socket(socket).registerProgram(data);
            });

            socket.on('registerCourse', function (data) {
                SocketHandler.socket(socket).registerCourse(data);
            });

            socket.on('registerLesson', function (data) {
                SocketHandler.socket(socket).registerLesson(data);
            });

            socket.on('removeContent', function (data) {
                SocketHandler.socket(socket).removeContent(data);
            });

            socket.on('assignContentToUsers', function (data) {
                SocketHandler.socket(socket).assignContentToUsers(data, function(err) {
                    if (err) {
                        logger.error(err);
                        socket.emit('generalError', {title: 'Permissions Error', message: 'Error occurred when assigning content.'});
                    }
                    else {
                        io.sockets.emit('refreshDashboard');
                    }
                });
            });
            
            socket.on('closeTool', function(data){
	           SocketHandler.socket(socket).closeTool(data);
	           io.sockets.emit('refreshDashboard'); 
            });

            socket.on('getContentServerUrl', function (data) {
                SocketHandler.socket(socket).getContentServerUrl(data);
            });

            socket.on('startContentServer', function (data) {
                SocketHandler.socket(socket).startContentServer(data);
            });

            socket.on('addComment', function (data) {
                SocketHandler.socket(socket).addComment(data);
            });
            
            socket.on('clearLessonComments', function (data) {
	            SocketHandler.socket(socket).clearLessonComments(data);
            });

            socket.on('closeComment', function (data) {
                SocketHandler.socket(socket).closeComment(data);
            });

            socket.on('getContentComments', function (data) {
                SocketHandler.socket(socket).getContentComments(data);
            });

            socket.on('getCourseCommentPages', function (data) {
                SocketHandler.socket(socket).getCourseCommentPages(data);
            });

            socket.on('retrieveRedmineHost', function (callback){
                SocketHandler.socket(socket).retrieveRedmineHost(function (fdata){
                    callback(fdata);
                });
            });

            socket.on('addRedmineIssue', function (data, callback){
                SocketHandler.socket(socket).addRedmineIssue(data, function (fdata){
                    callback(fdata);
                });
            });

            socket.on('getRedminePageIssues', function (data, callback){
                SocketHandler.socket(socket).getRedminePageIssues(data, function (fdata){
                    callback(fdata);
                });
            });             

            // socket.on('getRedmineLessonIssues', function (data, callback){
            //     SocketHandler.socket(socket).getRedmineLessonIssues(data, function (fdata){
            //         callback(fdata);
            //     });
            // }); 

            socket.on('getRedmineLessonIssuesForIndex', function (data){
                SocketHandler.socket(socket).getRedmineLessonIssuesForIndex(data);
            }); 

            socket.on('updateRedmineIssue', function (data, username, callback){
                SocketHandler.socket(socket).updateRedmineIssue(data, username, function (fdata){
                    callback(fdata);
                });
            }); 

            socket.on('getRedmineIssueJournal', function (data, callback){
                SocketHandler.socket(socket).getRedmineIssueJournal(data, function (fdata){
                    callback(fdata);
                });
            }); 

            socket.on('getRedmineProjectMembership', function (data, callback){
                SocketHandler.socket(socket).getRedmineProjectMembership(data, function (fdata){
                    callback(fdata);
                });
            });             

            socket.on('findRedmineProjectId', function (data, callback){
                SocketHandler.socket(socket).findRedmineProjectId(data, function (fdata){
                    callback(fdata);
                });
            });

            socket.on('checkRedmineProjectStructure', function (data, callback){
                SocketHandler.socket(socket).checkRedmineProjectStructure(data, function (fdata){
                    callback(fdata);
                });
            });

            socket.on('sendPackageMail', function (data) {
                SocketHandler.socket(socket).sendPackageMail(data);
            });

            socket.on('contentSaved', function (data) {
                SocketHandler.socket(socket).contentSaved(data);
            });

            socket.on('userPermissionForContent', function (data) {
                SocketHandler.socket(socket).userPermissionForContent(data);
            });

            socket.on('renameContent', function (data) {
                SocketHandler.socket(socket).renameContent(data);
            });

            socket.on('publishContent', function (data, callback) {
                SocketHandler.socket(socket).publishContent(data, function(err){
                    callback(err);
                });
            });
            //retrieveServer
            socket.on('retrieveServer', function (callback) {
                SocketHandler.socket(socket).retrieveServer(function(err){
                    callback(err);
                });
            });

            socket.on('configLrs', function(){
                SocketHandler.socket(socket).configLrs();
            });            

            socket.on('sendXapiStatement', function (data, callback){
                SocketHandler.socket(socket).sendXapiStatement(data, function (fdata){
                    callback(fdata);
                });
            });

            socket.on('getXapiStatement', function (data, callback){
                SocketHandler.socket(socket).getXapiStatement(data, function (fdata){
                    callback(fdata);
                });
            });             

            socket.on('sendXapiState', function (data, callback){
                SocketHandler.socket(socket).sendXapiState(data, function (fdata){
                    callback(fdata);
                });
            }); 

            socket.on('getXapiState', function (data, callback){
                SocketHandler.socket(socket).getXapiState(data, function (fdata){
                    callback(fdata);
                });
            });  

            socket.on('sendXapiActivityProfile', function (data, callback){
                SocketHandler.socket(socket).sendXapiActivityProfile(data, function (fdata){
                    callback(fdata);
                });
            }); 

            socket.on('getXapiActivityProfile', function (data, callback){
                SocketHandler.socket(socket).getXapiActivityProfile(data, function (fdata){
                    callback(fdata);
                });
            }); 

            socket.on('getClonables', function (data){
                Content.allClonableContentForUser(socket, data);
            });

            socket.on('cloneLesson', function (data){
                SocketHandler.socket(socket).cloneLesson(data);
            });   

            socket.on('cloneCourse', function (data){
                SocketHandler.socket(socket).cloneCourse(data);
            });  

            socket.on('cloneProgram', function (data){
                SocketHandler.socket(socket).cloneProgram(data);
            });    

            socket.on('readDir', function (data, callback){
                SocketHandler.socket(socket).readDir(data, function (fdata){
                    callback(fdata);
                });
            });   

            socket.on('removeMetadata', function(data){
                SocketHandler.socket(socket).removeMetadata(data);
            });    

            socket.on('getResourcePackage', function (data){
                SocketHandler.socket(socket).getResourcePackage(data);
            });                                       
                              
        });
    });
})();
