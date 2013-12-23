var Utils = require('./cognizen-utils'),
    UserModel = require('./user-model'),
    User = UserModel.User,
    UserPermission = UserModel.UserPermission,
    ContentModel = require('./content-model'),
    Program = ContentModel.Program,
    Course = ContentModel.Course,
    Lesson = ContentModel.Lesson,
    ContentComment = ContentModel.ContentComment,
    fs = require('fs-extra'),
    path = require('path'),
    ffmpeg = require('fluent-ffmpeg'),
    FileUtils = require('./file-utils'),
    SocketIOFileUploadServer = require('socketio-file-upload'),
    ContentSocket = require('./content-socket'),
    scorm = require('./cognizen-scorm');

var _ = require("underscore");
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string'); // => true


var activeEdit_arr = [];

var SocketHandler = {
    config: {},
    logger: {},
    SocketSessions: {},
    Content: {},
    Mail: {},
    Git: {},
    io: {},
    _socket: {},

    init: function(config, logger, SocketSessions, Mail, Content, Git, io) {
        this.config = config;
        this.logger = logger;
        this.SocketSessions = SocketSessions;
        this.Mail = Mail;
        this.Git = Git;
        this.Content = Content;
        this.io = io;
        return this;
    },

    socket: function (socket) {
        this._socket = socket;
        return this;
    },

    setupFileUploadHandler: function () {
        var uploader = new SocketIOFileUploadServer();
        uploader.dir = this.config.uploadTempDir;
        uploader.listen(this._socket);

        var _this = this;
        uploader.on('error', function(event) {
            _this.logger.error('Error trying to upload file: ' + event.file + '\n' + JSON.stringify(event.error));
        });

        // Do something when a file is saved:
        uploader.on("complete", function (event) {
            ////////////////////////////////////////////////////////////////// I added this if to keep the app from crashing when getting undefined for event.file.target as it is now.  Phil
            if (event.file.target != undefined) {
                var target = event.file.target.split("_");

                var fileSplit = event.file.name.split(".");
                var mediaType = fileSplit[fileSplit.length - 1];

                if (event.file && event.file.target) {
                    if (target && target.length == 2) {
                        var type = target[0];
                        var id = target[1];
                        var contentType = _this.Content.objectType(type);
                        if (contentType) {
                            contentType.findById(id, function (err, found) {
                                if (found) {
                                    var contentPath = path.normalize(_this.Content.diskPath(found.path) + '/media/' + event.file.name);
                                    var capPath = path.normalize(_this.Content.diskPath(found.path) + '/media/');
                                    //Handle our favorite media types
                                    var favoriteTypes = ["mp4", "swf", "jpg", "png", "html", "gif", "jpeg", "mp3", "svg"];
                                    var convertableVideoTypes = ["ogv", "avi", "mov", "wmv", "flv", "webm"];
                                    var convertableVectorTypes = ["eps"];
                                    var convertableAudioTypes = ["wav", "ogg", "m4a", "aiff", "flac", "wma"]; 
                                    if (favoriteTypes.indexOf(mediaType.toLowerCase()) >= 0) {
                                        var stream = fs.createReadStream(event.file.pathName);
                                        stream.pipe(fs.createWriteStream(contentPath));
                                        var had_error = false;
                                        stream.on('error', function(err){
                                            had_error = true;
                                        });

                                        stream.on('close', function(){
                                            if (!had_error) fs.unlink(event.file.pathName);
                                        });
                                        //Git commit
                                    } else if (convertableVideoTypes.indexOf(mediaType.toLowerCase()) >= 0 || /*convertableVectorTypes.indexOf(mediaType.toLowerCase()) >= 0 ||*/ convertableAudioTypes.indexOf(mediaType.toLowerCase()) >= 0){
                                        //Convert files
                                        var convertedFileName;
                                        var convertedPathName;
                                        var convertedPath;
                                        //VIDEO CONVERSION
                                        if (convertableVideoTypes.indexOf(mediaType.toLowerCase()) >= 0){
                                        	convertedFileName = event.file.name.replace(/\.[^/.]+$/, '') + '.mp4';
											convertedPathName = event.file.pathName.replace(/\.[^/.]+$/, '') + '.mp4';
											convertedPath = contentPath.replace(/\.[^/.]+$/, '') + '.mp4'; // Strip the old extension off, and put the mp4 extension on.
                                        	var proc = new ffmpeg({ source: event.file.pathName, timeout: 300, priority: 2 })
                                            	.toFormat('mp4')
												.withVideoBitrate('1200k')
												.withVideoCodec('libx264')
												.withAudioBitrate('160k')
												.withAudioCodec('libfaac')
												.withAudioChannels(2)

												.onCodecData(function (codecinfo) {
                                                	_this.logger.info(codecinfo);
													_this._socket.emit('mediaInfo', codecinfo);
												})
                                            /*.takeScreenshots({count: 1, timemarks: ['5']}, capPath, function(err, filenames) {
                                             console.log("fileNames = " + filenames);
                                             console.log('screenshots were saved');
                                             })*/
										}/*else if(convertableVectorTypes.indexOf(mediaType.toLowerCase()) >= 0){
											convertedFileName = event.file.name.replace(/\.[^/.]+$/, '') + '.svg';
											convertedPathName = event.file.pathName.replace(/\.[^/.]+$/, '') + '.svg';
											convertedPath = contentPath.replace(/\.[^/.]+$/, '') + '.svg';
											var proc = new ffmpeg({ source: event.file.pathName, timeout: 300, priority: 2 })
                                            	.toFormat('svg')
										}*/else if(convertableAudioTypes.indexOf(mediaType.toLowerCase()) >= 0){
											convertedFileName = event.file.name.replace(/\.[^/.]+$/, '') + '.mp3';
											convertedPathName = event.file.pathName.replace(/\.[^/.]+$/, '') + '.mp3';
											convertedPath = contentPath.replace(/\.[^/.]+$/, '') + '.mp3';
											var proc = new ffmpeg({ source: event.file.pathName, timeout: 300, priority: 2 })
                                            	.toFormat('mp3')
												.withAudioCodec('libmp3lame')
												.withAudioChannels(2)

												.onCodecData(function (codecinfo) {
                                                	_this.logger.info(codecinfo);
													_this._socket.emit('mediaInfo', codecinfo);
												})
										}
                                        proc.onProgress(function (progress) {
                                        	_this._socket.emit('mediaConversionProgress', progress);
										})
											.saveToFile(convertedPathName, function (stdout, stderr) {
	                                        	if (stdout) _this.logger.error('FFMPEG STDOUT: ' + stdout);
	                                            if (stderr) _this.logger.error('FFMPEG STDERR: ' + stderr);
												   
												var stream = fs.createReadStream(convertedPathName);
	                                            stream.pipe(fs.createWriteStream(convertedPath));
												   
												var had_error = false;
												stream.on('error', function(err){
													had_error = true;
												});
												   
												stream.on('close', function(){
		                                        if (!had_error) fs.unlink(event.file.pathName);
		                                        fs.unlink(convertedPathName, function (err) {
	                                            	_this._socket.emit('mediaConversionComplete', convertedPath);
	                                            });
											})
										});
                                    }
                                }
                            });
                        }
                    }
                }
            }
        });
    },

    checkLoginStatus: function() {
        var status = {};
        var sessionId = this.SocketSessions.sessionIdFromSocket(this._socket);
        status.user = this.SocketSessions.socketUsers[sessionId];
        this._socket.emit('loadDashboardPage', status);
    },
    
    objectType: function (typeName) {
        return eval(_.str.capitalize(typeName.toLowerCase()));
    },

    getPermissions: function (data) {
        var _this = this;
        UserPermission.find({contentId: data.content.id}).populate('user').exec(function (err, permissions) {
            if (err) {
                _this.logger.error(err);
                _this._socket.emit('generalError', {title: 'Error Retrieving Permissions', message: 'An error occurred while retrieving the user permissions for this content.'});
            }

            var contentPermissions = {};

            if (permissions) {
                permissions.forEach(function(permission) {
                    contentPermissions[permission.user.id] = permission.permission;
                });
            }

            // Now, get all the users and marry up the permission if it exists.
            User.find().exec(function(err, users) {
                if (err) {
                    _this.logger.error(err);
                    _this._socket.emit('generalError', {title: 'Error Retrieving Permissions', message: 'An error occurred while retrieving the user permissions for this content.'});
                }

                var usersToSend = [];

                users.forEach(function(user) {
                    if (!user.admin) {
                        var permission = contentPermissions[user.id];
                        var userToSend = user.toDashboardItem();
                        userToSend.permission = permission == undefined ? null : permission;
                        usersToSend.push(userToSend);
                    }
                });

                // Sort the users by firstName+lastName
                usersToSend = _.sortBy(usersToSend, function(user) {
                    return (user.firstName+user.lastName).toLowerCase();
                });
                _this._socket.emit('contentPermissions', usersToSend);
            });
        });
    },

    attemptLogin: function (data) {
        var _this = this;
       
        User.findOne({username: data.user}).populate('permissions').exec(function (err, user) {
            if (err) throw err;
            if (user == null) {
                _this._socket.emit("loginUserFailed");
            } else if (user.active == false) {
                _this._socket.emit('mustConfirm');
            } else {
                user.comparePassword(data.pass, function (err, isMatch) {
                    if (err) throw err;

                    if (isMatch == true) {
                        _this.SocketSessions.socketUsers[_this.SocketSessions.sessionIdFromSocket(_this._socket)] = user;
                        _this._socket.emit('loginAttemptSuccess', user);
                    } else {
                        _this._socket.emit('loginPasswordFailed');
                    }
                });
            }
        });
    },

    confirmUser: function (data) {
        var _this = this;
        User.findOne({token: data.token}).populate('permissions').exec(function (err, user) {
            if (err || !user) {
                _this.logger.info(err);
            } else {
                if (user.active == false) {
                    user.active = true;
                    user.markModified("active");
                    user.save(function (err) {
                        if (err) {
                            _this.logger.info("Problem Houston - can't save confirm." + err);
                        }
                    });
                    _this._socket.emit('confirmConfirm');
                }
            }
        });
    },

    resetPassword: function (data) {
        var _this = this;
        User.findOne({token: data.token, username: data.user}, function (err, user) {
            if (err) {
                _this.logger.info(err);
            } else {
                user.password = data.pass;
                user.markModified("password");
                user.save(function (err) {
                    if (err) {
                        _this.logger.info("Problem Houston - can't save new password." + err);
                    } else {
                        _this._socket.emit('passwordUpdated');
                    }
                });
            }
        });
    },

    processForgotPassword: function (data) {
        var _this = this;
        User.findOne({ username: data.user }, 'username token firstName', function (err, user) {
            if (err) throw err;

            if (user == null) {
                _this._socket.emit('forgetFailed');
            } else {
                _this._socket.emit('forgotSuccess', {username: user});

                _this.Mail.send({
                    user: user.username,
                    subject: "Reset Cognizen Password",
                    txtMsg: user.firstName + ", you can reset your password by navigiating to the below address.  Since you don't have html enabled in your mail client, you will have to copy and paste it into a web browser's url bar and hit the 'Return' key on your keyboard.  " + _this.config.url + "index.html?reset=" + user.username + "&token=" + user.token,
                    msg: user.firstName + ",<br/><br/><p>To reset your password, please click on the link below.</p><p><a href=" + _this.config.url + "index.html?reset=" + user.username + "&token=" + user.token + ">" + _this.config.url + "index.html?reset=" + user.username + "&token=" + user.token + "</a></p>"
                });
            }
        });
    },

    registerUser: function (data) {
        var _this = this;
        require('crypto').randomBytes(48, function (ex, buf) {
            var myToken = buf.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');

            //Create a new user from the schema
            var newUser = new User({
                firstName: data.firstName,
                lastName: data.lastName,
                username: data.user,
                password: data.pass,
                token: myToken,
                active: false
            });

            //save the new user.
            newUser.save(function (err) {
                _this.logger.info(err);
                if (err) {
                    //if already exists - kick the registration failed
                    _this._socket.emit('registrationFailed');
                } else {
                    _this._socket.emit('registrationSuccess');
                    _this.Mail.send({
                        user: data.user,
                        subject: "Cognizen Registration Confirmation",
                        txtMsg: data.firstName + ", you have been registered with the cognizen web based content framwork but you still must confirm that registration, by navigiating to the below address.  Since you don't have html enabled in your mail client, you may have to copy and paste it into a web browser's url bar and hit the 'Return' key on your keyboard.  " + _this.config.url + "index.html?reset=" + data.user + "&token=" + myToken,
                        msg: data.firstName + ",<br/><br/><p>You have been registered with the cognizen web based content framwork but you still must confirm that registration, by navigiating to the below address.</p><p><a href=" + _this.config.url + "index.html?reset=" + data.user + "&token=" + myToken + ">" + _this.config.url + "index.html?reset=" + data.user + "&token=" + myToken + "</a></p>"
                    });
                }
            });
        });
    },

    getUserList: function () {
        var _this = this;
        User.find().populate('permissions').exec(function (err, users) {
            if (err) {
                _this.logger.info(err);
            } else {
                _this._socket.emit("receiveUserList", users);
            }
        });
    },

    sendPackageMail: function (data) {
        var _this = this;
        User.findById(data.user).exec(function (err, user) {
            if (user) {

                var myPath = data.path;
                while (myPath.charAt(0) === '/') {
                    myPath = myPath.substr(1);
                }

                var url = _this.config.url + encodeURIComponent(data.path);

                _this.Mail.send({
                    user: user.username,
                    subject: "Download Link for SCORM Content",
                    txtMsg: user.firstName + ", your content package can be downloaded by navigiating to the below address.  Since you don't have html enabled in your mail client, you may have to copy and paste it into a web browser's url bar and hit the 'Return' key on your keyboard.  " + url,
                    msg: user.firstName + ",<br/><br/><p>Your content package can be downloaded by clicking on the link below.</p><p><a href=" + url + ">" + url + "</a></p>"
                });
                _this._socket.emit("packageLinkAlert", {
                    path: url
                });
            }
        });
    },

    contentSaved: function(data) {
        var _this = this;

        // First, find user and content.
        var contentType = _this.Content.objectType(data.content.type);

        if (contentType) {
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                    // Get the user associated
                    User.findById(data.user.id).exec(function (err, user) {
                        if (user) {
                            _this.Git.commitProgramContent(found.getProgram(), user, function() {
                                // Success, do nothing.
                            }, function(message) {
                                _this._socket.emit('generalError', {title: 'Repository Saving Error', message: 'Error occurred when saving repository content.'});
                                _this.logger.error("Error when committing to the Git Repo: " + message);
                            });
                        }
                    });
                }
            });
        }
    },

    userPermissionForContent: function(data) {
        var _this = this;
        var alreadySent = false;
        var emitter = 'contentPermissionFound';
        var foundPermission = 'viewer';
        var contentType = _this.Content.objectType(data.content.type);
		
		for (var i = 0; i < activeEdit_arr.length; i++){
			if(activeEdit_arr[i].lessonID == data.content.id){
				var sessionId = _this.SocketSessions.sessionIdFromSocket(_this._socket);
				var user = _this.SocketSessions.socketUsers[sessionId];
				if(activeEdit_arr[i].user == user.username){
					foundPermission = activeEdit_arr[i].permission;	
				}else{
					foundPermission = "forcedReviewer";
				}
				
				alreadySent = true;
				_this._socket.emit(emitter, {permission: foundPermission});
				break;
			}
		}
		
		if(!alreadySent){
	        if (contentType) {
	            contentType.findAndPopulate(data.content.id, function (err, found) {
	                if (found) {
	                    // Get the user associated
	                    User.findById(data.user.id).populate('permissions').exec(function (err, user) {
	                        if (user && user.permissions) {
	
	                            user.permissions.forEach(function(permission) {
	                                if (permission.contentId == data.content.id) {
	                                    foundPermission = permission.permission;
	                                }
	                            });
	                        }
	                        _this._socket.emit(emitter, {permission: foundPermission});
	                    });
	                }
	                else {
	                    _this._socket.emit(emitter, {permission: foundPermission});
	                }
	            });
	        }
	        else {
	            _this._socket.emit(emitter, {permission: foundPermission});
	        }
	    }
    },

    _copyProgramFiles: function (program, callback) {
        var baseWritePath = path.normalize(this.Content.diskPath(program.path) + '/core-prog');
        var root = path.normalize('../core-files');

        FileUtils.rmdir(baseWritePath);

        FileUtils.copyDir(root, baseWritePath, function (path) {
            return (path.endsWith('core-files') || path.contains("css") || path.contains("media") || path.endsWith('index.html'));
        }, function (err) {
            callback(err);
        });
    },
    
    _copyJSFiles: function (content, callback) {
        var _this = this;
        var baseWritePath = path.normalize(content);
        
		_this.logger.info("baseWritePath = " + baseWritePath);
		_this.logger.info("content = " + content);
        var root = path.normalize('../core-files/js');

        //FileUtils.rmdir(baseWritePath);

        FileUtils.copyDir('../core-files/js', baseWritePath+"/js", null, function (err) {
            if (err) callback(err);
        });
    },

    _copyContentFiles: function (content, callback) {
        var _this = this;
        var baseWritePath = path.normalize(_this.Content.diskPath(content.path));
        var tokenz = content.path.split("/");
        var programName = tokenz[0];

        var root = path.normalize('../core-files');

        FileUtils.rmdir(baseWritePath);

        FileUtils.copyDir(path.normalize(_this.Content.diskPath(programName) + "/core-prog"), baseWritePath, null, function (err) {
            if (err) callback(err);

            FileUtils.copyDir(root, baseWritePath, function (path) {
                return (path.endsWith('core-files') || /*path.contains("js") ||*/ path.contains("server") || path.contains("xml") || path.contains("packages"));
            }, function (err) {
                //Set the lesson and course names in the xml.
                //Once xml is copied to new lesson location -
                //   - import it
                //   - parse it
                //   - set values
                //   - write it to the doc
                _this.Content.updateContentXml(content, function(content, etree) {
                    var parentName = content.parentName ? content.parentName : ''; // Default this to blank if there is no parent name.
                    etree.find('./courseInfo/preferences/courseTitle').set('value', parentName);
                    etree.find('./courseInfo/preferences/lessonTitle').set('value', content.name);
                }, function(err) {
                    callback(err);
                });
            });
        });
    },

    registerProgram: function (data) {
        var _this = this;
        var originalName = data.name;
        var nameHadInvalidChars = Utils.hasInvalidFilenameChars(data.name);
        Program.createUnique(data, function (saved, callbackData) {
            if (saved) {
                _this.Git.initializeProgramRepo(callbackData, function () {
                    _this._copyProgramFiles(callbackData, function () {
                        _this.Git.commitProgramContent(callbackData, data.user, function () {
                            _this._assignContentPermissionAfterCreation(callbackData, 'program', 'admin', function (err) {
                                if (err) {
                                    _this._socket.emit('generalError', {title: 'Program Creation Error', message: 'Error occurred when creating Program repository.'});
                                    _this.logger.error(err);
                                }
                                else {
                                    _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                                    if (nameHadInvalidChars) {
                                        _this._socket.emit('generalError', {title: 'Program Name Changed', message: 'The program name ' + originalName + ' contained one or more invalid filename characters.  Invalid characters were removed from the name.'});
                                    }
                                }
                            });
                        }, function (message) {
                            _this._socket.emit('generalError', {title: 'Program Creation Error', message: 'Error occurred when creating Program repository.'});
                            _this.logger.error("Error when creating Git Repo (1): " + message);
                        });
                    });
                }, function (message) {
                    _this._socket.emit('generalError', {title: 'Program Creation Error', message: 'Error occurred when creating Program repository.'});
                    _this.logger.error("Error when creating Git Repo (2): " + message);
                });
            } else {
                _this._socket.emit('generalError', {title: 'Program Exists', message: 'There is already a program named ' + data.name + '. Please choose a different program name or contact the ' + data.name + ' program admin to grant you access to the program.'});
                _this.logger.info('Program already exists with name ' + data.name);
            }
        });
    },

    registerCourse: function (data) {
        var _this = this;
        Course.createUnique(data, function (saved, callbackData) {
            if (saved) {
                _this.Git.updateLocalContent(callbackData.fullProgram, function(err) {
                    if (err) {
                        _this._socket.emit('generalError', {title: 'Course Error', message: 'Error occurred when saving course content.'});
                        _this.logger.error(err);
                    }
                    else {
                        fs.createFile(path.normalize(_this.Content.diskPath(callbackData.path) + '/.gitkeep'), function (err) { // Need to create an empty file so git will keep the course folder
                            if (err) {
                                _this.logger.error(err);
                                _this._socket.emit('generalError', {title: 'Course Error', message: 'Error occurred when saving course content.'});
                            } else {
                                _this.Git.commitProgramContent(callbackData.fullProgram, data.user, function () {
                                    _this._assignContentPermissionAfterCreation(callbackData, 'program', 'admin', function (err) {
                                        if (err) {
                                            _this._socket.emit('generalError', {title: 'Course Error', message: 'Error occurred when saving course content.'});
                                            _this.logger.error(err);
                                        }
                                        else {
                                            _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                                        }
                                    });
                                }, function (message) {
                                    _this._socket.emit('generalError', {title: 'Course Error', message: 'Error occurred when saving course content.'});
                                    _this.logger.info("Error committing program content: " + message)
                                });
                            }
                        });
                    }
                });
            }
            else {
                _this._socket.emit('generalError', {title: 'Course Exists', message: 'There is already a course in this program that is named ' + data.name + '. Please choose a different course name or contact the program admin to grant you access to the course.'});
                _this.logger.info('Course already exists with name ' + data.name);
            }
        });
    },

    registerLesson: function (data) {
        var _this = this;
        Lesson.createUnique(data, function (saved, callbackData) {
            if (saved) {
                _this.Git.updateLocalContent(callbackData.fullProgram, function(err) {
                    if (err) {
                        _this._socket.emit('generalError', {title: 'Lesson Error', message: 'Error occurred when saving lesson content.'});
                        _this.logger.error(err);
                    }
                    else {
                        _this._copyContentFiles(callbackData, function () {
                            _this.Git.commitProgramContent(callbackData.fullProgram, data.user, function () {
                                _this._assignContentPermissionAfterCreation(callbackData, 'lesson', 'admin', function (err) {
                                    if (err) {
                                        _this._socket.emit('generalError', {title: 'Lesson Error', message: 'Error occurred when saving lesson content.'});
                                        _this.logger.error(err);
                                    }
                                    else {
                                        _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                                    }
                                });
                            }, function (message) {
                                _this.logger.info("Error committing program content: " + message)
                                _this._socket.emit('generalError', {title: 'Lesson Error', message: 'Error occurred when saving lesson content.'});
                            });
                        });
                    }
                });
            } else {
                _this._socket.emit('generalError', {title: 'Lesson Exists', message: 'There is already a lesson in this course that is named ' + data.name + '. Please choose a different lesson name or contact the program admin to grant you access to the course.'});
                _this.logger.info('Lesson already exists with name ' + data.name);
            }
        });
    },

    removeContent: function(data) {
        var _this = this;
        console.log(JSON.stringify(data));
        if (!data.user) {
            data.user = 'unknown';
        }
        // Look up the content by type, and mark the deleted flag.
        // Then, drill down through all its children and children's children, and mark them as well.
        // For now, retain the files on the disk.
        var contentType = _this.Content.objectType(data.type);

        if (contentType) {
            contentType.findAndPopulate(data.id, function (err, found) {
                if (found instanceof Program) {
                    _this._deleteProgram(found, function(err){
                        if (err) {
                            _this.logger.error(err);
                            _this._socket.emit('generalError', {title: 'Content Removal Error', message: 'Error occurred when removing content.'});
                        }
                        else {
                            _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                        }
                    });
                }
                else {
                    _this._deleteContent(found, data.user, function(err){
                        if (err) {
                            _this.logger.error(err);
                            _this._socket.emit('generalError', {title: 'Content Removal Error', message: 'Error occurred when removing content.'});
                        }
                        else {
                            _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                        }
                    });
                }
            });
        }
    },

    _fullDeletedSuffix: function() {
        return this.Content.DELETED_SUFFIX + Utils.timestamp();
    },

    _deleteProgram: function(program, callback) {
        var _this = this;
        var oldPath = 'repos/' + program.getRepoName() + '.git';
        var newPath = 'repos/' + program.getRepoName() + _this._fullDeletedSuffix() + '.git';
        // Get all program children and delete them.
        program.getChildren(function(err, children) {
            if (err) {
                callback(err);
            }
            else {
                children.push(program);
                // Delete the program and its children from the database.
//                children.forEach(function(item) {
//                    console.log('Deleting ' + item.name);
//                });
                Utils.removeAll(children, function(err) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        // Delete the program from the disk, recursively
                        fs.remove(_this.Content.diskPath(program.path), function(err) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                // Rename the repo using the DELETE naming.
                                console.log('From ' + oldPath + ' to ' + newPath);
                                fs.rename(oldPath, newPath, function(err) {
                                    if (err) {
                                        callback(err);
                                    }
                                    else {
                                        callback();
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    },

    _deleteContent: function(content, user, callback) {
        var _this = this;
        var program = content.getProgram();
        var programDiskPath = _this.Content.diskPath(program.path);
        var trashFolder = programDiskPath + '/_trash_/';

        // Create the trash folder if it doesn't exist.
        fs.mkdirs(trashFolder, function(err) {
            if (err) {
                callback(err);
            }
            else {
                // Get all program children and delete them.
                content.getChildren(function(err, children) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        children.push(content);
                        // Delete the program and its children from the database.
                        children.forEach(function(item) {
                            console.log('Deleting ' + item.name);
                        });
                        Utils.removeAll(children, function(err) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                // Move this content folder to the trash folder
                                var oldPath = _this.Content.diskPath(content.path);
                                var newPath = trashFolder + content.name + _this._fullDeletedSuffix();

                                console.log('From ' + oldPath + ' to ' + newPath);
                                fs.rename(oldPath, newPath, function(err) {
                                    if (err) {
                                        callback(err);
                                    }
                                    else {
                                        // Commit the program so that the files are in the trash now.
                                        _this.Git.commitProgramContent(program, user, function(){
                                            callback();
                                        }, function(err){
                                            callback(err);
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

    },

//    _markContentDeleted: function(content, error, success) {
//        var _this = this;
//        if (!(content instanceof Array)) {
//            content = [content];
//        }
//
//        if (content.length > 0) {
//            var item = content.pop();
//            var originalPath = item.path;
//            item.deleted = true;
//            item.name += _this._fullDeletedSuffix();
//            item.path += _this._fullDeletedSuffix();
//            item.save(function(err) {
//                if (err) {
//                    error(err);
//                }
//                else {
//                    var oldPath = _this.Content.diskPath(originalPath);
//                    var newPath = _this.Content.diskPath(item.path);
//                    fs.renameSync(oldPath, newPath);
//                    _this._markContentDeleted(content, error, success);
//                }
//            });
//        }
//        else {
//            success();
//        }
//    },

    _assignContentPermissionAfterCreation: function (data, contentType, permission, callback) {
        var userPermission = {
            content: {
                type: contentType,
                id: '' + data._id
            },
            users: [{id: data.user._id, permission: permission}]
        };
        this.assignContentToUsers(userPermission, callback);
    },

    assignContentToUsers: function (data, callback) {
        // data.content.id
        // data.content.type
        // data.users = [{id, permission}]

        // First, remove all the permissions for this content.
        UserPermission.remove({contentId: data.content.id}).exec(function (err) {
            if (err) {
                callback(err);
            }
            else {
                // Get all the user ids.
                var userIds = _.pluck(data.users, 'id');

                User.find({'_id':{$in: userIds}}).populate('permissions').exec(function(err, users) {
                    // Remove the permission this user has for the given content, if it exists.
                    if (err) {
                        callback(err);
                    }
                    else {
                        var usersToSave = {};
                        var permissionsToSave = [];
                        users.forEach(function(user) {
                            if (user.permissions) {
                                var foundPermissionIndex = -1;
                                for (var i = 0; i < user.permissions.length; i++) {
                                    var permission = user.permissions[i];
									
                                    if (permission.contentId == data.content.id) {
                                        foundPermissionIndex = i;
                                    }
                                }

                                if (foundPermissionIndex >= 0) {
                                    
                                    user.permissions.splice(foundPermissionIndex, 1);
                                }
                            }

                            usersToSave[user.id] = user;
                        });

                        data.users.forEach(function(user) {
                            if (user.permission && user.permission != 'null') {
                                var dbUser = usersToSave[user.id];

                                var permission = new UserPermission({
                                    user: dbUser,
                                    contentType: data.content.type,
                                    contentId: data.content.id,
                                    permission: user.permission
                                });
                                
                                dbUser.permissions.push(permission);
                                permissionsToSave.push(permission);
                            }
                        });

                        var allItemsToSave = permissionsToSave.concat(_.values(usersToSave));

                        Utils.saveAll(allItemsToSave, function(){
                            callback();
                        }, function(err) {
                            callback(err);
                        });
                    }
                });
            }
        });
    },

    getContentServerUrl: function (data) {
        this._socket.emit('contentServerUrlReceived', {resource: data.content.id})
    },

    startContentServer: function (data) {
        var _this = this;
        var contentType = _this.Content.objectType(data.content.type);

        if (contentType) {
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                    var program = found.getProgram();

                    _this.Git.updateLocalContent(program, function(err){
                        if (err) {
                            var errorMessage = JSON.stringify(err);
                            _this.logger.error(errorMessage);
                            // Notify the client of an error, unless it is the elusive 'index.lock' error, then just log it, and let it go.
                            if (errorMessage.indexOf('index.lock') == -1) {
                                _this._socket.emit('generalError', {title: 'Content Error', message: 'Could not start the content at this time. GIT INDEX.LOCK issue.'});
                            }
                        }

                        else {
                            var serverDetails = _this.Content.serverDetails(found);
							var permission = data.content.permission;
							
                            if (serverDetails.running) {
                                _this.logger.info('Content server for ' + found.path + ' already running on port ' + serverDetails.port);
                                _this._socket.emit('contentServerStarted', {
                                    id: found.id,
                                    path: found.path,
                                    type: data.content.type
                                });
                            }
                            else {
                                var scormPath = path.normalize('../core-files/scorm/');
                                var scormDir = path.resolve(process.cwd(), scormPath);
                                var programPath = path.normalize('../programs/' + found.path + '/');
                                var parentDir = path.resolve(process.cwd(), programPath);
                                
                                
                                _this.logger.info('Spawning Content Server from ' + parentDir + ' on port ' + serverDetails.port);
                                ContentSocket.start(serverDetails.port, found.id, parentDir, scormDir, _this.logger, function(error){
                                    if (error) {
                                        _this.logger.error(error);
                                        _this._socket.emit('generalError', {title: 'Content Error', message: 'Could not start the content at this time.(1)'});
                                        serverDetails.running = false;
                                    }
                                    else {
                                       _this._socket.emit('contentServerStarted', {
                                       		id: found.id,
                                            path: encodeURIComponent(found.path),
                                            type: data.content.type
                                        });
                                        serverDetails.running = true;
                                    }
                                });
                            }
                            
                            //Setting up array to track whether a lesson is locked due to another editor already in....
                            if(permission == "admin" || permission == "editor"){
                            	var tmpObject = new Object();
                            	tmpObject.lessonID = found.id;
                            	tmpObject.permission = permission;
								var sessionId = _this.SocketSessions.sessionIdFromSocket(_this._socket);
								var user = _this.SocketSessions.socketUsers[sessionId];
								tmpObject.sessionID = sessionId;
								tmpObject.user = user.username;
                            	activeEdit_arr.push(tmpObject);
                            }
                        }
                    });
                }
            });
        }
    },
	
	disconnect: function (socket) {
	    var _this = this;
	    var disconnectingLessonID = null;
	    var sessionId = _this.SocketSessions.sessionIdFromSocket(_this._socket);
		var user = _this.SocketSessions.socketUsers[sessionId];
		if(user != undefined){
	    	var wasEditor = false;
			//Remove the current lock from lesson.
			for(var i = 0; i < activeEdit_arr.length; i++){
				if(sessionId == activeEdit_arr[i].sessionID){
					disconnectingLessonID = activeEdit_arr[i].lessonID;
					activeEdit_arr.splice(i, 1);
					break;
				}
			}
			
			if(disconnectingLessonID != null){
				var newEditor = null;
				for (var i = 0; i < activeEdit_arr.length; i++){
					if(disconnectingLessonID == activeEdit_arr[i].lessonID){
						newEditor = activeEdit_arr[i].user;
						break;
					}
				}
				
				if(newEditor != null){
					//Pass the new editor, editor rights...
					console.log("new editor = " + activeEdit_arr[i].user);
				}else{
					//Unlock the lesson in the dashboard...
					console.log("remove the deal lock");
				}
			}
	    }
    },
	
    renameContent: function(data) {
        //data.content.type
        //data.content.id
        //data.content.name
        //data.user.username
        //data.user.id
        var _this = this;

        if (data.content.type === 'program') {
            // Don't allow this, too volatile to change the git repo at this point.
            return;
        }

//        console.log('Rename ' + data.content.type + '#' + data.content.id + '...');
        // First, find user and content.
        var contentType = _this.Content.objectType(data.content.type);

        if (contentType) {
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                    var oldDiskPath = _this.Content.diskPath(found.path);
                    found.name = data.content.name;
                    found.generatePath();
                    var newDiskPath = _this.Content.diskPath(found.path);
//                    console.log('Moving ' + data.content.type + ' from ' + oldDiskPath + ' to ' + newDiskPath);

                    var itemsToSave = [found];

                    found.getChildren(function(err, children) {
                        if (err) {
                            _this.logger.error('found.getChildren(): ' + err);
                            _this._socket.emit('generalError', {title: 'Renaming Error', message: 'Error occurred when renaming content. (1)'});
                        }
                        else {
                            // Make sure children paths are re-generated as well.
                            children.forEach(function(child){
                                child.setParent(found);
                                child.generatePath();
                                itemsToSave.push(child);
                            });

                            Utils.saveAll(itemsToSave, function() {
                                // Now we have to rename the folder on the disk.
                                FileUtils.renameDir(oldDiskPath, newDiskPath, function(err) {
                                    if (err) {
                                        _this.logger.error('FileUtils.renameDir(): ' + err);
                                        _this._socket.emit('generalError', {title: 'Renaming Error', message: 'Error occurred when renaming content. (2)'});
                                    }
                                    else {
                                        _this.Content.updateAllXml(itemsToSave, function(content, etree) {
                                            var parent = content.getParent();
                                            etree.find('./courseInfo/preferences/courseTitle').set('value', parent ? parent.name : '');
                                            etree.find('./courseInfo/preferences/lessonTitle').set('value', content.name);
                                        }, function() {
                                            // Need to git commit the program, then let the user know it is done.
                                            _this.Git.commitProgramContent(found.getProgram(), data.user, function(){
                                                _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                                            }, function(err){
                                                _this.logger.error('_this.Git.commitProgramContent(): ' + err);
                                                _this._socket.emit('generalError', {title: 'Renaming Error', message: 'Error occurred when renaming content. (3)'});
                                            });
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
            });
        }
    },

    addComment: function (comment) {
        //comment.user
        //comment.content.type
        //comment.content.id
        //comment.page.id
        //comment.text
        var _this = this;
        var myStatus = comment.status;

        // First, find user and content.
        var contentType = _this.Content.objectType(comment.content.type);

        if (contentType) {
            contentType.findById(comment.content.id, function (err, found) {
                if (found) {
                    // Get the user associated
                    User.findById(comment.user.id).exec(function (err, user) {
                        if (user) {
                            var newComment = new ContentComment({
                                user: user,
                                contentType: comment.content.type,
                                contentId: comment.content.id,
                                pageId: comment.page.id,
                                comment: comment.text,
                                status: myStatus
                            });
                            newComment.save(function (err) {
                                if (err) {
                                    _this._socket.emit('commentNotAdded', newComment);
                                }
                                else {
                                    // Send a notice back to the client that it was saved
                                    _this.logger.info('Comment created');
                                    _this._socket.emit('commentAdded', newComment);
                                }
                            });
                        }
                    });
                }
            });
        }
    },
   
    closeComment: function (comment) {
        //comment.id

        var _this = this;
        ContentComment.findById(comment.id).exec(function (err, found) {
            if (!err && found) {
                comment.status = 'closed';
                comment.save(function (err) {
                    // Send a notice back to the client that it was closed
                    _this.logger.info('Comment closed');
                });
            }
        });
    },

    reopenComment: function (comment) {
        var _this = this;
        ContentComment.findById(comment.id).exec(function (err, found) {
            comment.status = 'inprogress';

            comment.save(function (err) {
                _this.logger.info('Comment re-opened');
            });
        });
    },

    getContentComments: function (data) {
        // data.contentId
        // data.pageId
        var _this = this;
        ContentComment.find(data).populate('user').exec(function (err, found) {
            _this._socket.emit('retrievedContentComments', found);
        });
    },

    getCourseCommentPages: function (data) {
        var _this = this;
        // data.contentId
        ContentComment.find(data).populate('user').exec(function (err, found) {
            _this.io.sockets.emit('updateCommentIndex', found);
        });
    },

    publishContent: function (data, callback){
        var _this = this;
        if (data.content.type === 'program') {
            // Don't allow this, too volatile to change the git repo at this point.
            return;
        }

        var contentType = _this.Content.objectType(data.content.type);

        if (contentType) {
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                    //var foundPath = _this.Content.diskPath(found.path); 
                    var scormPath = path.normalize('../core-files/scorm/');
                    var scormDir = path.resolve(process.cwd(), scormPath);
                    var programPath = path.normalize('../programs/' + found.path + '/');
                    var contentPath = path.resolve(process.cwd(), programPath);                    
                    var xmlContentFile = contentPath + '/xml/content.xml';
					
                    scorm.init(_this.logger, scormDir, contentPath, xmlContentFile );

                    var itemsToSave = [found];
                    //set mode to production and scormVersion in content.xml file
                    _this.Content.updateAllXml(itemsToSave, function(content, etree) {
                        var parent = content.getParent();
                        etree.find('./courseInfo/preferences/mode').set('value','production');
                        etree.find('./courseInfo/preferences/scormVersion').set('value', data.scorm.version);
                    }, function() {
                        // Need to git commit the program, then let the user know it is done.
                        // _this.Git.commitProgramContent(found.getProgram(), data.user.id, function(){
                        //     //_this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                        // }, function(err){
                        //     _this.logger.error('_this.Git.commitProgramContent(): ' + err);
                        //     _this._socket.emit('generalError', {title: 'Renaming Error', message: 'Error occurred when renaming content. (3)'});
                        // });
                    });
					
					_this._copyJSFiles(contentPath, function () {

					});
					
                    //calls the generateSCORM functino in congizen-scorm.js
                    scorm.generateSCORM(data.scorm.version, function(err, filepath){
                        //set mode back to edit in content.xml file, not matter what
                        _this.Content.updateAllXml(itemsToSave, function(content, etree) {
                            var parent = content.getParent();
                            etree.find('./courseInfo/preferences/mode').set('value','edit');
                        }, function() {
                            // Need to git commit the program, then let the user know it is done.
                            //_this.Git.commitProgramContent(found.getProgram(), data.user.id, function(){
                            // }, function(err){
                            //     _this.logger.error('_this.Git.commitProgramContent(): ' + err);
                            //     _this._socket.emit('generalError', {title: 'Renaming Error', message: 'Error occurred when renaming content. (3)'});
                            // });
                        });                        
                        if(err){
                            _this.logger.error(err);
                            _this._socket.emit('generalError', {title: 'Generating SCORM', message: 'TODO: generating scorm error'});                
                        }
                        else{
                            _this.logger.info("publishLesson success.");
                            _this.logger.info(filepath);
                            console.log("---------- filepath = " + filepath);
                            FileUtils.rmdir(contentPath + "/js");
                            callback(filepath);
                        }
                    });                   
                }
            });
        }             
  
    }
};

module.exports = SocketHandler;
