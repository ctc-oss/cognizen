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
    scorm = require('./cognizen-scorm'),
    unzip = require('adm-zip'),
    util = require('util'),
	readdirp = require('readdirp'),
	et = require('elementtree'),
    redmine = require('./cognizen-redmine'),
    adl = require('adl-xapiwrapper');
var _ = require("underscore");
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string'); // => true
var ss = require('socket.io-stream');
var request = require('request');

var activeEdit_arr = [];
var activeTool_arr = [];
var mylrs = '';

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
            //console.log(event);
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
                                    //var favoriteTypes = ["mp4", "swf", "jpg", "png", "html", "htm", "gif", "jpeg", "mp3", "svg", "pdf", "doc", "docx", "pptx", "ppt", "xls", "xlsx"];

                                    var convertableVideoTypes = ["ogv", "avi", "mov", "wmv", "flv", "webm", "f4v", "mpg", "mpeg", "mkv"];
                                    var convertableVectorTypes = ["eps"];
                                    var convertableAudioTypes = ["wav", "ogg", "m4a", "aiff", "flac", "wma"];
                                    var archiveTypes = ["zip"];
                                    if (convertableVideoTypes.indexOf(mediaType.toLowerCase()) >= 0 || convertableAudioTypes.indexOf(mediaType.toLowerCase()) >= 0){
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
                                           //used for ffmpeg on windows machine
                                           //proc.setFfmpegPath('C:/ffmpeg-20140723-git-a613257-win64-static/bin/ffmpeg.exe')

										}else if(convertableAudioTypes.indexOf(mediaType.toLowerCase()) >= 0){
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
			                                    	_this.logger.info("FILE HAS BEEN MOVED AFTER CONVERSION");
		                                        	_this._socket.emit('mediaConversionComplete', convertedPath);
		                                        });
											})
										});
                                    }else if (archiveTypes.indexOf(mediaType.toLowerCase()) >= 0) {
                                    	console.log("old way");
                                    	console.log(event.file.pathName)
                                    	var zip = new unzip(event.file.pathName);
                                    	var zipEntries = zip.getEntries();

                                    	zipEntries.forEach(function(entry) {
										    var entryName = entry.entryName;
										    zip.extractEntryTo(entryName, path.normalize(_this.Content.diskPath(found.path) + '/media/'), true, true);
										});

										fs.unlink(event.file.pathName, function (err) {
	                                    	_this._socket.emit('unzipComplete', convertedPath);
	                                    });
                                    }
                                    //if (favoriteTypes.indexOf(mediaType.toLowerCase()) >= 0) {
                                    else{
                                        var stream = fs.createReadStream(event.file.pathName);
                                        stream.pipe(fs.createWriteStream(contentPath));
                                        var had_error = false;
                                        stream.on('error', function(err){
                                            had_error = true;
                                        });

                                        stream.on('close', function(){
                                            _this.logger.info("wrote to location - now trying to delete file from tmp");
                                            if (!had_error) fs.unlink(event.file.pathName);
                                        });
                                        //Git commit
                                    }
                                }
                            });
                        }
                    }
                }
            }
        });
        
        ss(_this._socket).on('upload-media', function(stream, data){
			var cleanName = data.name.replace(/ /g,"_");
			var filename = uploader.dir + "/" + cleanName;
			var mediaStream = stream.pipe(fs.createWriteStream(filename));
			var tmpSock = stream.socket
			
			//Complete upload callback
			mediaStream.on('close', function(){
				var type = data.type;
                var id = data.id;
                var contentType = _this.Content.objectType(type);
				
                if (contentType) {
                    contentType.findById(id, function (err, found) {
                        if (found) {
	                        var trackPath = "";
	                        if(data.track == "media"){
		                        trackPath = "/media/";
	                        }else if(data.track == "core"){
		                        trackPath = "/../../core-prog/";
	                        }else if(data.track == "course"){
		                        trackPath = "/../css/CourseCSS/";
	                        }else if(data.track == "lesson"){
		                        trackPath = "/css/";
	                        }
                            var contentPath = path.normalize(_this.Content.diskPath(found.path) + trackPath + data.path + cleanName);
							var fileSplit = cleanName.split(".");
							var mediaType = fileSplit[fileSplit.length - 1];
							
							var convertableVideoTypes = ["ogv", "avi", "mov", "wmv", "flv", "webm", "f4v", "mpg", "mpeg", "asf"];
                            var convertableVectorTypes = ["eps"];
                            var convertableAudioTypes = ["wav", "ogg", "m4a", "aiff", "flac", "wma"];
                            var archiveTypes = ["zip"];
                            if (convertableVideoTypes.indexOf(mediaType.toLowerCase()) >= 0 || convertableAudioTypes.indexOf(mediaType.toLowerCase()) >= 0){
                                tmpSock.sio.emit("mediaBrowserConversionStart");
                                //Convert files
                                var convertedFileName;
                                var convertedPathName;
                                var convertedPath;
                                //VIDEO CONVERSION
                                if (convertableVideoTypes.indexOf(mediaType.toLowerCase()) >= 0){
                                	convertedFileName = cleanName.replace(/\.[^/.]+$/, '') + '.mp4';
									convertedPathName = filename.replace(/\.[^/.]+$/, '') + '.mp4';
									convertedPath = contentPath.replace(/\.[^/.]+$/, '') + '.mp4'; // Strip the old extension off, and put the mp4 extension on.
                                	var proc = new ffmpeg({ source: filename, timeout: 300, priority: 2 })
                                    	.toFormat('mp4')
										.withVideoBitrate('1200k')
										.withVideoCodec('libx264')
										.withAudioBitrate('160k')
										.withAudioCodec('libfaac')
										.withAudioChannels(2)
										.onCodecData(function (codecinfo) {
                                        	_this.logger.info(codecinfo);
											tmpSock.sio.emit('mediaInfo', codecinfo);
										})
                                   //used for ffmpeg on windows machine
                                   //proc.setFfmpegPath('C:/ffmpeg-20140723-git-a613257-win64-static/bin/ffmpeg.exe')

								}else if(convertableAudioTypes.indexOf(mediaType.toLowerCase()) >= 0){
									convertedFileName = cleanName.replace(/\.[^/.]+$/, '') + '.mp3';
									convertedPathName = filename.replace(/\.[^/.]+$/, '') + '.mp3';
									convertedPath = contentPath.replace(/\.[^/.]+$/, '') + '.mp3';
									var proc = new ffmpeg({ source: filename, timeout: 300, priority: 2 })
                                    	.toFormat('mp3')
										.withAudioCodec('libmp3lame')
										.withAudioChannels(2)
										.onCodecData(function (codecinfo) {
                                        	_this.logger.info(codecinfo);
											tmpSock.sio.emit('mediaInfo', codecinfo);
										})
								}
                                proc.onProgress(function (progress) {
                                	tmpSock.sio.emit('mediaBrowserConversionProgress', progress);
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
                                        if (!had_error) fs.unlink(filename);
	                                    fs.unlink(convertedPathName, function (err) {
	                                    	_this.logger.info("FILE HAS BEEN MOVED AFTER CONVERSION");
                                        	tmpSock.sio.emit('mediaBrowserUploadComplete', convertedPath);
                                        });
									})
								});
							}else if(archiveTypes.indexOf(mediaType.toLowerCase()) >= 0){
								var zip = new unzip(filename);
                            	var zipEntries = zip.getEntries();
                            	zipEntries.forEach(function(entry) {
								    var entryName = entry.entryName;
								    var pathSplit = contentPath.split("/");
								    pathSplit.pop();
								    var extractPath = "";
								    for(var i = 0; i < pathSplit.length; i++){
									    extractPath += (pathSplit[i] + "/");
								    }
								    zip.extractEntryTo(entryName, path.normalize(extractPath), true, true);
								});
								fs.unlink(filename, function (err) {
                                	tmpSock.sio.emit('mediaBrowserUploadComplete', "zip");
                                });
                            }else{
	                            var stream = fs.createReadStream(filename);
	                            stream.pipe(fs.createWriteStream(contentPath));
	                            var had_error = false;
	                            stream.on('error', function(err){
	                                had_error = true;
	                            });
	
	                            stream.on('close', function(){
		                            //Remove item from tmp folder after moving it over.
	                                if (!had_error) fs.unlink(filename);
	                                tmpSock.sio.emit('mediaBrowserUploadComplete', contentPath);
	                            });
                            }
						}
					});
				}
			});
		});
    },
    
    mediaBrowserRemoveDir: function(data){
	    var _this = this;
	    var type = data.type;
	    var id = data.id;
        var contentType = _this.Content.objectType(type);
        var folderPath = "";
		if(data.track == "media"){
			folderPath = "/media/"
		}else if(data.track == "core"){
			folderPath = "/../../core-prog/"
		}else if(data.track == "course"){
			folderPath = "/../css/"
		}else if(data.track == "lesson"){
			folderPath = "/css/"
		}
		
		if (contentType) {
        	contentType.findById(id, function (err, found) {
            	if (found) {
                	var contentPath = path.normalize(_this.Content.diskPath(found.path) + folderPath + data.path);
                	console.log(contentPath);
                	fs.remove(contentPath, function (err) {
						if (err) throw err;
						_this._socket.emit('mediaBrowserRemoveDirectoryComplete');
					});
                }
            });
        }
	    
    },
    
    mediaBrowserCreateDir: function(data){
		var _this = this;
		var type = data.type;
	    var id = data.id;
        var contentType = _this.Content.objectType(type);
        var folderPath = "";
		if(data.track == "media"){
			folderPath = "/media/"
		}else if(data.track == "core"){
			folderPath = "/../../core-prog/"
		}else if(data.track == "course"){
			folderPath = "/../css/"
		}else if(data.track == "lesson"){
			folderPath = "/css/"
		}
		
		if (contentType) {
        	contentType.findById(id, function (err, found) {
            	if (found) {
                	var contentPath = path.normalize(_this.Content.diskPath(found.path) + folderPath + data.path + data.name);
                	console.log(contentPath);
                	fs.mkdirs(contentPath, function (err) {
						if (err) throw err;
						_this._socket.emit('mediaBrowserCreateDirectoryComplete');
					});
                }
            });
        }
    },
    
    mediaBrowserRemoveMedia: function(data) {
		var _this = this;
		var type = data.type;
        var id = data.id;
        var contentType = _this.Content.objectType(type);
		var folderPath = "";
		if(data.track == "media"){
			folderPath = "/media/"
		}else if(data.track == "core"){
			folderPath = "/../../core-prog/"
		}else if(data.track == "course"){
			folderPath = "/../css/"
		}else if(data.track == "lesson"){
			folderPath = "/css/"
		}

        if (contentType) {
        	contentType.findById(id, function (err, found) {
            	if (found) {
                	var contentPath = path.normalize(_this.Content.diskPath(found.path) + folderPath + data.file);
                	fs.unlink(contentPath, function (err) {
						if (err) throw err;
						console.log('successfully deleted media file at: ' + contentPath);
						_this._socket.emit('mediaBrowserRemoveMediaComplete');
					});
                }
            });
        }
    },
    
    mediaBrowserDownloadMedia: function(data) {
		var _this = this;
		var type = data.type;
        var id = data.id;
        var contentType = _this.Content.objectType(type);
				
        if (contentType) {
        	contentType.findById(id, function (err, found) {
            	if (found) {
                	var contentPath = path.normalize(_this.Content.diskPath(found.path) + '/media/' + data.file);
                	/*fs.unlink(contentPath, function (err) {
						if (err) throw err;
						console.log('successfully deleted media file');
						_this._socket.emit('mediaBrowserRemoveMediaComplete');
					});*/
					//var file = fs.createReadStream(contentPath);
					//console.log(file);
					//_this._socket.stream(file);
					request(data.url+"media/"+data.file).pipe(fs.createWriteStream('doodle.png'))
                }
            });
        }
    },
    
    getHostedContent: function(data){
		var _this = this;
		fs.readdir("../hosted/", function(err, files){
			if (!files.length) {
	    		console.log("empty directory!")
	    	}else{
		    	_this._socket.emit('recieveHostedProjectsFromDB', files);
	    	}
		}); 
    },

    checkLoginStatus: function() {
        var _this = this;
        var status = {};
        var sessionId = this.SocketSessions.sessionIdFromSocket(this._socket);
        status.user = this.SocketSessions.socketUsers[sessionId];
        //cognizen-redmine init
        redmine.init(_this.logger, _this.config.redmineHost, _this.config.redmineApiKey, _this.config.redmineProtocal);
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
					if (permission.user && permission.user.id) {
						contentPermissions[permission.user.id] = permission.permission;
					}
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
        // #3397 added regular expression
        User.findOne({username: { $regex : new RegExp(data.user, "i") } }).populate('permissions').exec(function (err, user) {
            if (err) throw err;
            if (user == null) {
                _this._socket.emit("loginUserFailed");
            } else if (user.active == false) {
                _this._socket.emit('mustConfirm');
            } else {
                user.comparePassword(data.pass, function (err, isMatch) {
                    if (err) throw err;
                    if (isMatch == true) {
	                    if(data.pass.length > 7){
                        	_this.SocketSessions.socketUsers[_this.SocketSessions.sessionIdFromSocket(_this._socket)] = user;
							_this._socket.emit('loginAttemptSuccess', user);
						}else{
							_this.logger.info(data.user + "'s password is too short - sending them alert");
							_this._socket.emit('loginPasswordTooShort', user);
						}
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
                        //update user password in Redmine
                        redmine.updateUserPassword(data.user, data.pass, function(err){
                            if(err){
                                _this.logger.error("Error updating redmine user: " + err);
                            }
                            else{
                                _this.logger.info("User updated to redmine");
                            }
                        });                        
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
			console.log(user.firstName + ",<br/><br/><p>To reset your password, please click on the link below.</p><p><a href=" + _this.config.url + "index.html?reset=" + user.username + "&token=" + user.token + ">" + _this.config.url + "index.html?reset=" + user.username + "&token=" + user.token + "</a></p>");
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
                    //create user in Redmine
                    redmine.createUser(data.user, data.firstName, data.lastName, data.pass, false, function(err){
                        if(err){
                            _this.logger.error("Error creating redmine user: " + err);
                        }
                        else{
                            _this.logger.info("User added to redmine");
                        }
                    });
                    
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

                var url = _this.config.url + myPath;
                var fileName = url.substring(url.lastIndexOf('/')+1);

                _this.Mail.send({
                    user: user.username,
                    subject: "Download Link for SCORM Content",
                    txtMsg: user.firstName + ", your content package can be downloaded by navigiating to the below address.  Since you don't have html enabled in your mail client, you may have to copy and paste it into a web browser's url bar and hit the 'Return' key on your keyboard.  " + url,
                    msg: user.firstName + ",<br/><br/><p>Your content package can be downloaded by clicking on the link below.</p><p><a href=" + url + ">" + fileName + "</a></p>"
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

    setUsername: function(){
	    var _this = this;
	    var sessionId = _this.SocketSessions.sessionIdFromSocket(_this._socket);
		var user = _this.SocketSessions.socketUsers[sessionId];
		_this._socket.emit('setUsername', {username: user});
		//Complete the handshake to show that user is connected and clean the isActive == false....

		if(user){
			_this.logger.info("user.username = " + user.username);
			for(var i = 0; i < activeEdit_arr.length; i++){
				if(activeEdit_arr[i].user == user.username){
					activeEdit_arr[i].isActive = true;
					_this.logger.info(user.username + " is now Active.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
				}
			}
		}
    },

    userPermissionForContent: function(data) {
        var _this = this;
        var emitter = 'contentPermissionFound';
        var foundPermission = 'viewer';
        var contentType = _this.Content.objectType(data.content.type);
		var activeEditor = null;
		for (var i = 0; i < activeEdit_arr.length; i++){
			if(activeEdit_arr[i].lessonID == data.content.id && activeEdit_arr[i].isEditor == true){
				var sessionId = _this.SocketSessions.sessionIdFromSocket(_this._socket);
				var user = _this.SocketSessions.socketUsers[sessionId];
				activeEditor = activeEdit_arr[i].user;
				break;
			}
		}

		if (contentType) {
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                    // Get the user associated
                    User.findById(data.user.id).populate('permissions').exec(function (err, user) {
                        if (user && user.permissions) {
                            if(user.admin == true){
                            	foundPermission = 'forcedReviewer'
                            }else{
	                            user.permissions.forEach(function(permission) {
	                                if (permission.contentId == data.content.id) {
	                                    if(permission.permission != "admin" && permission.permission != "editor"){
	                                    	foundPermission = permission.permission;
	                                    }else{
		                                    foundPermission = "forcedReviewer";
	                                    }
	                                }
	                            });
	                        }
                        }
                        _this._socket.emit(emitter, {permission: foundPermission, currentEditor: activeEditor});
                    });
                }
                else {
                    _this._socket.emit(emitter, {permission: foundPermission, currentEditor: activeEditor});
                }
            });
        }
        else {
            _this._socket.emit(emitter, {permission: foundPermission, currentEditor: activeEditor});
        }
    },

    _copyProgramFiles: function (program, callback) {
        var _this = this;
        var baseWritePath = path.normalize(_this.Content.diskPath(program.path) + '/core-prog');
        var root = path.normalize('../core-files');

        FileUtils.rmdir(baseWritePath);

        FileUtils.copyDir(root, baseWritePath, function (path) {
            return (path.endsWith('core-files') || path.contains("media") || path.contains("ProgramCSS") || path.endsWith('index.html'));
        }, function (err) {
            FileUtils.copyDir(root + '/css/jqueryui', baseWritePath + '/jqueryui', function (path) {
	            return (path.endsWith('jqueryui') || path.contains("images") || path.endsWith('jquery-ui.min.css'));
	        }, function (err) {
                fs.copy(path.normalize('../.gitignore'), path.normalize(_this.Content.diskPath(program.path) +'/.gitignore'), function(err){
                    if(err){
                        _this.logger.error("Error copying .gitignore file " + err);
                        callback(err);                        
                    }
                    else{
                        callback(err);
                    }
                });
	            
	        });
        });
    },

    _copyCourseFiles: function (content, callback) {
	    var _this = this;
	    var baseWritePath = path.normalize(_this.Content.diskPath(content.path));
	    var newCourseXML = baseWritePath + "/course.xml";
	    var tokenz = content.path.split("/");
	    var programName = tokenz[0];
	    var xmlPath = path.normalize('../course-files/xml/course.xml');
	    var courseMediaPath = path.normalize('../course-files/media/test.png');
	    var courseID = content._id;
	    var courseName = content.name;

        var root = path.normalize('../core-files');

        FileUtils.copyDir(root, baseWritePath + '/css', function (path) {
            return (path.endsWith('core-files') || path.contains('CourseCSS'));
        }, function (err) {
	        //add program css here...
        	FileUtils.copyDir(path.normalize(_this.Content.diskPath(programName) + "/core-prog/jqueryui"), baseWritePath + '/css/CourseCSS/jqueryui', function (path) {
	            return (path.endsWith('jqueryui') || path.contains('images') || path.endsWith('jquery-ui.min.css'));
	        }, function (err) {
				fs.mkdir(baseWritePath + path.normalize("/media"), function(err){
					fs.copy(xmlPath, newCourseXML, function(err){
				    	if(err){
							_this.logger.error("Error copying content.xml file " + err);
							callback(err, null);
			            }
	
			            _this.logger.info('course.xml file copied success');
	
					    var data, etree;
	
					    fs.readFile(newCourseXML, function(err, data){
					    	data = data.toString();
							etree = et.parse(data);
							//set the name and id in the course.xml
					        etree.find('./').set('name', courseName);
					        etree.find('./').set('id', courseID);
                            etree.find('./').set("redmine", "true");
					        var xml = etree.write({'xml_decleration': false});
					        fs.outputFile(newCourseXML, xml, function (err) {
					        	if (err) callback(err, null);
                                fs.copy(path.normalize('../.gitignore'), baseWritePath +'/.gitignore', function(err){
                                    if(err){
                                        _this.logger.error("Error copying .gitignore file " + err);
                                        callback(err);                        
                                    }
                                    else{
                                        callback(err);
                                    }
                                });
					        });
					    });
				    });
				});
	        });
        });
    },

    _copyContentFiles: function (content, callback) {
        var _this = this;
        var baseWritePath = path.normalize(_this.Content.diskPath(content.path));
        var tokenz = content.path.split("/");
        var programName = tokenz[0];
        var root = path.normalize('../core-files');
        FileUtils.rmdir(baseWritePath);

        FileUtils.copyDir(path.normalize(_this.Content.diskPath(programName) + "/core-prog"), baseWritePath, function (path) {
			return (path.endsWith('core-prog') || path.contains('media') || path.endsWith('index.html'));
		}, function (err) {
            FileUtils.copyDir(root, baseWritePath, function (path) {
                return (path.endsWith('core-files') || path.contains("xml") || path.contains("packages"));
            }, function (err) {
	             FileUtils.copyDir(root, baseWritePath + '/css', function (path) {
	                return (path.endsWith('core-files') || path.contains("ModuleCSS"));
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

	                    var tloValue = "undefined"
	                    if(content.tlo != ""){
	                        tloValue = content.tlo;
	                    }
	                    etree.find('./courseInfo/preferences/tlo').set('value', tloValue);
	                    etree.find('./courseInfo/preferences/id').set('value', content._id);

						var myID = FileUtils.guid();
						etree.find('./pages/page').set('id', myID);

	                    var coursePath = baseWritePath;
	                    var tempPath = coursePath.substr(0, coursePath.lastIndexOf("\/"));
	                    if(tempPath === ""){
	                        tempPath = coursePath.substr(0, coursePath.lastIndexOf("\\"));
	                    }
						coursePath = tempPath + "/course.xml";

					    fs.readFile(coursePath, function(err, data){
					    	var XML = et.XML;
							var ElementTree = et.ElementTree;
							var element = et.Element;
							var subElement = et.SubElement;
							var _data, etree;

					    	_data = data.toString();
							etree = et.parse(_data);

					        var root = etree.find('./');

					        var item = subElement(root, 'item');
					        item.set("name", content.name);
					        item.set("id", content._id);
	                        item.set("tlo", tloValue);
                            //item.set("coursedisplaytitle", content.name);
                            item.set("excludeFromPublish", 'false');
					        var sequencing = subElement(item, "sequencing");
					        sequencing.set("choice", "true");
					        sequencing.set("flow", "false");
					        sequencing.set("forwardOnly", "false");
					        sequencing.set("choiceExit", "true");
					        sequencing.set("previous", "false");
					        sequencing.set("continue", "false");
					        sequencing.set("exit", "false");
					        sequencing.set("exitAll", "false");
					        sequencing.set("abandon", "false");
					        sequencing.set("abandonAll", "false");
					        sequencing.set("suspendAll", "false");
					        sequencing.set("tracked", "true");
					        sequencing.set("completionSetByContent", "false");
					        sequencing.set("objectiveSetByContent", "false");
					        sequencing.set("rollupObjectiveSatisfied", "true");
					        sequencing.set("rollupProgressCompletion", "true");
					        sequencing.set("rollupObjectiveMeasureWeight", "1.0");

					        var objectives = subElement(sequencing, "objectives");
					        var primaryObjective = subElement(objectives, "primaryObjective");
					        var sequencingRules = subElement(sequencing, "sequencingRules");
					        etree = new ElementTree(root);
					        var xml = etree.write({'xml_decleration': false});
					        fs.outputFile(coursePath, xml, function (err) {
					        	if (err) callback(err, null);
					         	callback(err);
					        });
					    });
					});
                });
            });
        });
    },

    _copyJSFiles: function (content, callback) {
        var _this = this;
        var baseWritePath = path.normalize(content);

		_this.logger.info("baseWritePath = " + baseWritePath);
		_this.logger.info("content = " + content);
        var root = path.normalize('../core-files/js');

        //FileUtils.rmdir(baseWritePath);
        readdirp({
                root: root,
                directoryFilter: ['!*ckeditor'],
                fileFilter: [ '!.DS_Store' ]
            },
            function(fileInfo) {
                var localFile = fileInfo.path.replace(/\\/g,"/");
                try{
                    fs.copySync(root + '/' + localFile, baseWritePath+'/js/'+localFile);
                }
                catch(err){
                    _this.logger.error("error copying js dir :" + err);
                    callback(err);
                }
            },
            function (err, res) {
                callback(null);
            }
        );
    },

    _copyCSSFiles: function (content, isCourse, callback) {
        var _this = this;
        var baseWritePath = path.normalize(content);

		_this.logger.info("baseWritePath = " + baseWritePath);
		_this.logger.info("content = " + content);
        var root = path.normalize('../core-files/css');
		if(isCourse){
			var programCSSPath = baseWritePath + 'core-prog/ProgramCSS';

		}else{
			var programCSSPath = baseWritePath + '../core-prog/ProgramCSS';
		}
		console.log("-----------------------------------------------------");
		console.log("programCSSPath = " + programCSSPath);
		console.log("-----------------------------------------------------");
        readdirp({
                root: root,
                directoryFilter: ['!*ckeditor'],
                fileFilter: [ '!.DS_Store' ]
            },
            function(fileInfo) {
                //Left blank on purpose...
            },
            function (err, res) {
                res.files.forEach(function(file) {
                    var localFile = file.path.replace(/\\/g,"/");
                    try{
	                    fs.copySync(root + '/' + localFile, baseWritePath+'/css/CoreCSS/'+localFile);
	                }
	                catch(err){
	                    _this.logger.error("error copying css dir :" + err);
	                    callback(err);
	                }
                });

                readdirp({
		                root: programCSSPath,
		                directoryFilter: ['!*ckeditor'],
		                fileFilter: [ '!.DS_Store' ]
		            },
		            function(fileInfo) {
		              //Left blank on purpose...
		            },
		            function (err, res) {
		                console.log("baseWritePath = " + baseWritePath);
		                res.files.forEach(function(file) {
		                    var localFile = file.path.replace(/\\/g,"/");
		                    console.log("localFile = " + localFile);
		                    try{
			                    fs.copySync(programCSSPath + '/' + localFile, baseWritePath+'/css/ProgramCSS/'+localFile);
			                }
			                catch(err){
			                    _this.logger.error("error copying css dir :" + err);
			                    callback(err);
			                }
		                });
		                callback(null);
		            }
		        );
                //callback(null);
            }
        );
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
                            //create project in Redmine
                            _this._createRedmineProject(data.name, callbackData._id, function(){

                                _this._assignContentPermissionAfterCreation(callbackData, 'program', 'admin', data.name, function (err) {
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

    _createRedmineProject: function(name, id, callback){
        //create project in Redmine
        var _this = this;
        redmine.createProject(name, id, function(err){
            if(err){
                _this.logger.error("Error creating redmine project: " + err);
                callback();
            }
            else{
                _this.logger.info("Project added to redmine");
                callback();
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
                            	 _this._copyCourseFiles(callbackData, function () {
	                                _this.Git.commitProgramContent(callbackData.fullProgram, data.user, function () {
                                        _this._createRedmineCourse(data.name, callbackData._id, data.program.id, function(){
                                            _this._assignContentPermissionAfterCreation(callbackData, 'program', 'admin', data.name, function (err) {
                                                if (err) {
                                                    _this._socket.emit('generalError', {title: 'Course Error', message: 'Error occurred when saving course content.'});
                                                    _this.logger.error(err);
                                                }
                                                else {
                                                   
                                                    _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                                                }
                                            });
                                        });

	                                }, function (message) {
	                                    _this._socket.emit('generalError', {title: 'Course Error', message: 'Error occurred when saving course content.'});
	                                    _this.logger.info("Error committing program content: " + message)
	                                });
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

    _createRedmineCourse: function(courseName, courseId, projectId, callback){
        var _this = this;
        //create Redmine project for the course
        redmine.createCourse(courseName, courseId, projectId, function(err){
            if(err){
                _this.logger.error("Error creating redmine course project: " + err);
                callback();
            }
            else{
                _this.logger.info("course project added to redmine");
                callback();
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

                                _this._createRedmineLesson(data.name, callbackData._id, data.course, function(){
                                    _this._assignContentPermissionAfterCreation(callbackData, 'lesson', 'admin', data.name, function (err) {
                                        if (err) {
                                            _this._socket.emit('generalError', {title: 'Lesson Error', message: 'Error occurred when saving lesson content.'});
                                            _this.logger.error(err);
                                        }
                                        else {
                                              
                                            _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                                        }
                                    });
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

    

    _createRedmineLesson: function(name, id, course, callback){
        var _this = this;
        //create Redmine project for the lesson
        redmine.createLesson(name, id, course, function(err){
            if(err){
                _this.logger.error("Error creating redmine lesson project: " + err);
                callback();
            }
            else{
                _this.logger.info("Lesson project added to redmine");
                callback();
            }
        }); 
    },

    removeContent: function(data) {
        var _this = this;
        //_this.logger.info(JSON.stringify(data));
        if (!data.user) {
            data.user = 'unknown';
        }
        // Look up the content by type, and mark the deleted flag.
        // Then, drill down through all its children and children's children, and mark them as well.
        // For now, retain the files on the disk.
        var contentType = _this.Content.objectType(data.type);
        _this.logger.info("ID " + data.id + " TYPE " + data.type + " loc " + data.loc);
		var _dataId = data.id;
        var _dataType = data.type;
        var _orgLoc = data.loc;
        if (contentType) {
            contentType.findAndPopulate(data.id, function (err, found) {
                if (found instanceof Program) {
                    _this.logger.info("DELETEPROGRAM");
                    _this._deleteProgram(found, data.user.username, function(err){
                        if (err) {
                            _this.logger.error(err);
                            _this._socket.emit('generalError', {title: 'Content Removal Error', message: 'Error occurred when removing content.'});
                        }
                        else {
                            //close redmine comments for the program
                            //parent is empty
                            _this._closeAllRedmineIssues(data.name, found._id, data.user.username, function(err){
                                if(err){
                                    _this.logger.error(err);
                                    _this._socket.emit('generalError', {title: 'Content Removal Error', message: 'Error occurred when removing content.'});
                                }
                                else{
                                    _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                                }
                            });                        
                        }
                    });
                }
                else {
                    //if data.type == lesson remove from course.xml
                    if(_dataType == "lesson" && _orgLoc == 'dashboard'){
                        var courseXml = path.normalize('../programs/' + found.path + '/../course.xml');
                        var courseXmlPath = path.resolve(process.cwd(), courseXml);
                        var _data, etree;

                        try{
                            _data = fs.readFileSync(courseXmlPath).toString();
                        }
                        catch(err){
                            _this.logger.error(err);
                            _this._socket.emit('generalError', {title: 'Content Removal Error', message: 'Error occurred when reading course.xml file.'});
                        }
                        etree = et.parse(_data);

                        var itemCount = etree.findall('./item').length;
                        var courseNode = etree.getroot();
                        for (var i = 0; i < itemCount; i++) {
                            var myNode = etree.findall('./item')[i];

                            var nodeId = myNode.get('id');
                            if(nodeId == _dataId){
                                courseNode.remove(myNode);
                                break;
                            }
                        };

                        var xml = etree.write({'xml_decleration': false});

                        try{
                            fs.outputFileSync(courseXmlPath, xml);
                        }
                        catch(err){
                            _this.logger.error(err);
                            _this._socket.emit('generalError', {title: 'Content Removal Error', message: 'Error occurred when writing course.xml file.'});
                        }

                    }
                    // console.log(found);
                    //// TODO: ///////////////////////////////////////
                    //remove content id from parent record
                    // var parentId = '';
                    // var parentType = 'project';
                    // if(_dataType === 'lesson'){
                    //     parentType = 'course';
                    //     parentId = found.course._id;
                    // }
                    // else{
                    //     parentId = found.program._id;
                    // }

                    // var contentType = _this.Content.objectType(parentType);
                    // console.log("contentType : " + contentType);
                    // console.log("parentType : " + parentType);
                    // console.log("parentId : " + parentId);
                    // if (contentType) {
                    //     contentType.findAndPopulate(parentId, function (err, found) { 
                    //         if(found){
                    //             console.log('found parent : ' + found);
                    //         }
                    //     });
                    // }
                    //////////////////////////////////////////////////////                   

                    _this._deleteContent(found, data.user, function(err){
                        if (err) {
                            _this.logger.error(err);
                            _this._socket.emit('generalError', {title: 'Content Removal Error', message: 'Error occurred when removing content.'});
                        }
                        else {
                            //close redmine comments for the program
                            _this._closeAllRedmineIssues(data.name, _dataId, data.user.username, function(err){
                                if(err){
                                    _this.logger.error(err);
                                    _this._socket.emit('generalError', {title: 'Content Removal Error', message: 'Error occurred when removing content.'});
                                }
                                else{
                                    _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                                }
                            });                             
                            //_this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                        }
                    });
                }
            });
        }
    },

    _fullDeletedSuffix: function() {
        return this.Content.DELETED_SUFFIX + Utils.timestamp();
    },

    _closeAllRedmineIssues: function(name, id, username, callback){
        var _this = this;

        var _lesson = {
            lessontitle: name,
            id: id
        };

        redmine.getIssuesByLessonId(_lesson, function(fdata){    
            var _issues = fdata;
            if(_issues.total_count != 0){
                var issuesMsg = '';
                for(var h = 0; h < _issues.issues.length; h++){
                    _issues.issues[h].notes = 'This program was deleted in Cognizen so the issue was closed.';

                    _issues.issues[h].status_id = 5;

                    redmine.updateIssue( _issues.issues[h], username, function(err){
                        if(err){
                            callback(err);
                        }
                        else{
                            //rename Redmine project for the project
                            redmine.updateProjectName(name, id, name+_this._fullDeletedSuffix(), function(err){
                                if(err){
                                    callback(err)
                                }
                                else{
                                    _this.logger.info(name + " project renamed in redmine");
                                    callback();
                                }
                            }); 
                        }
                    });
                }
            }
            else{
                //rename Redmine project for the project
                redmine.updateProjectName(name, id, name+_this._fullDeletedSuffix(), function(err){
                    if(err){
                        callback(err)
                    }
                    else{
                        _this.logger.info(name + " project renamed in redmine");
                        callback();
                    }
                }); 
            }
        });          
    },

    _deleteProgram: function(program, username, callback) {
        var _this = this;
        var oldPath = 'repos/' + program.getRepoName() + '.git';
        var newPath = 'repos/' + program.getRepoName() + _this._fullDeletedSuffix() + '.git';
        var oldName = program.name;
        // Get all program children and delete them.
        program.getChildren(function(err, children) {
            if (err) {
                callback(err);
            }
            else {
                children.push(program);
                // Delete the program and its children from the database.
//                children.forEach(function(item) {
//                    _this.logger.info('Deleting ' + item.name);
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
                                _this.logger.info('From ' + oldPath + ' to ' + newPath);
                                
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
                            _this.logger.info('Deleting ' + item.name);
                        });
                        Utils.removeAll(children, function(err) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                // Move this content folder to the trash folder
                                var oldPath = _this.Content.diskPath(content.path);
                                var newPath = trashFolder + content.name + _this._fullDeletedSuffix();

                                _this.logger.info('From ' + oldPath + ' to ' + newPath);
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

    _assignAllLessonsPermission: function (courseData, permission, callback){
        var _this = this;

        var structure_arr = [];
        Course.findAndPopulate(courseData._id, function (err, found) {
            if(err){
                _this.logger.error('Error in Course findAndPopulate');
                callback(err);
            }
            else{

                found.getChildren(function(err, children) {
                    if (err) {
                        _this.logger.error('found.getChildren(): ' + err);
                       callback(err);
                    }
                    else {
                        children.forEach(function(child){
                             var page = {
                                lessontitle : child.name,
                                lessonid: child._id,
                                coursetitle : found.name,
                                courseid: found._id,
                                programtitle : found.getProgram().name,
                                programid : found.getProgram()._id,
                                contenttype : 'lesson'
                            };
                            structure_arr.push(page);
                        });  
                    }
                    _this._assignLessonPermission(courseData, permission, structure_arr, 0, function(err){
                        if(err)
                        {
                            _this.logger.error('Error in _assignLessonPermission');
                            callback(err);
                        }
                        else{ 
                            callback(); 
                        }
                    });                    
                });          


            }
        });        
    },

    _assignLessonPermission: function(data, permission, structure_arr, index, callback){
        var _this = this;

        if(index < structure_arr.length ){
            var lessonData = {
                id: structure_arr[index].lessonid,
                user: data.user
            };
            _this._assignContentPermissionAfterCreation(lessonData, 'lesson', permission, data.name, function (err) {
                if (err) {
                    _this._socket.emit('generalError', {title: 'Lesson Error', message: 'Error occurred when saving lesson content.'});
                    _this.logger.error(err);
                }
                else {
                    _this._assignLessonPermission(data, permission, structure_arr, index+1, function(err){
                        (err) ? callback(err) : callback();
                    });   
                }
            });
        }
        else{
            callback();
        }        
        
    },

    _assignContentPermissionAfterCreation: function (data, contentType, permission, name, callback) {
        var userPermission = {
            content: {
                type: contentType,
                id: '' + data.id,
                name: name
            },
            users: [{id: data.user._id, permission: permission}]
        };
        this.assignContentToUsers(userPermission, callback);
    },

    assignContentToUsers: function (data, callback) {
        var _this = this;
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

                        //update Redmine project membership
                        redmine.updateProjectMembership(data, function(err){
                            if(err){
                                _this.logger.error("Error udpating redmine project membership :"+ data.content.type +" project: " + err);
                            }
                            else{
                                _this.logger.info(data.content.name + " project membership updated in redmine");
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
        this._socket.emit('contentServerUrlReceived', {path: data.content.id})
    },

    getCoursePath: function (data){
		var _this = this;
        var contentType = _this.Content.objectType(data.content.type);
        if (contentType) {
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                	var program = found.getProgram();
                	 _this.Git.updateLocalContent(program, function(err){
                	 	if (err) {
                	 		_this.logger.error("GIT ERROR ON STARTING OUTLINER");
                	 	}else{
	                	 	var serverDetails = _this.Content.serverDetails(found);
							var permission = data.content.permission;
							var xmlPath = path.normalize(found.path);
							_this._socket.emit('receiveCoursePath', {
                           		id: found.id,
                                path: encodeURIComponent(xmlPath),
                                type: data.content.type
                            });
                	 	}
                	 });
                }
            });
        }
    },

	updateCourseXML: function (data){
		var _this = this;
		var contentType = _this.Content.objectType(data.content.type);
		if (contentType) {
			_this.logger.info("content.id = " + data.content.id)
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                	var program = found.getProgram();
            	 	var serverDetails = _this.Content.serverDetails(found);
					var permission = data.content.permission;
					var xmlPath = path.normalize(found.path);
					var programPath = path.normalize('../programs/' + found.path + '/course.xml');
					var contentPath = path.resolve(process.cwd(), programPath);
					_this.logger.info("outliner updating " + contentPath)
					fs.outputFile(contentPath, data.myXML, function(err) {
	                    //Refresh the index if successfully updating the content.xml
	                    if (err == null && data.commit == true){
	                        _this.Git.commitProgramContent(found.getProgram(), data.user, function(){
                            	_this.logger.info("Outliner successfully updated xml");
                                //_this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                            }, function(err){
                            	_this.logger.error('_this.Git.commitProgramContent(): ' + err);
                                _this._socket.emit('generalError', {title: 'Renaming Error', message: 'Error occurred when renaming content. (3)'});
                            });
	                    }
	                    else{
	                        _this.logger.debug("Houston, we have a problem - the course.xml update failed");
	                    }
	                })
                }
            });
        }
	},

    updateModuleXML: function (data){
		var _this = this;
		_this.logger.info("contentType = " + data.content.type);
		var contentType = _this.Content.objectType(data.content.type);
		if (contentType) {
			_this.logger.info("content.id = " + data.content.id)
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                	var program = found.getProgram();
            	 	var serverDetails = _this.Content.serverDetails(found);
					var permission = data.content.permission;
					var xmlPath = path.normalize(found.path);
					var programPath = path.normalize('../programs/' + found.path + '/' + data.moduleXMLPath);
					var contentPath = path.resolve(process.cwd(), programPath);
					_this.logger.info("outliner updating " + contentPath)
					fs.outputFile(contentPath, data.myXML, function(err) {
	                    //Refresh the index if successfully updating the content.xml
	                    if (err == null && data.commit == true){
	                        _this.Git.commitProgramContent(found.getProgram(), data.user, function(){
                            	_this.logger.info("Outliner successfully updated xml")
                                if(data.refresh == true){
	                                _this._socket.emit('refreshDashboard');
                                }
                                //_this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                            }, function(err){
                            	_this.logger.error('_this.Git.commitProgramContent(): ' + err);
                                _this._socket.emit('generalError', {title: 'Renaming Error', message: 'Error occurred when renaming content. (3)'});
                            });
	                    }
	                    else{
	                        _this.logger.debug("Houston, we have a problem - the content.xml update failed - attempting to update glossary for node");
	                    }
	                })
                }
            });
        }
    },

    startContentServer: function (data) {
        var _this = this;
        var contentType = _this.Content.objectType(data.content.type);
        if (contentType) {
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                    var program = found.getProgram();
                    _this.Git.updateLocalContent(program, function(err){
                        var gitFail = false;
                        if (err) {
                            _this.logger.error("NWE FRANK : " + err);
							// _this.Git.lock.runwithlock(function () {
                        }
                        else {
                        	_this.logger.info("into the launch code ====================================================================================");
                            var serverDetails = _this.Content.serverDetails(found);
							var permission = data.content.permission;
							var xmlPath = path.normalize('../programs/' + found.path + '/xml/content.xml');
							var conWidth = 1024;
							var conHeight = 768;
							fs.exists(xmlPath, function(exists) {
					            if (exists) {
					                var xmldata = fs.readFileSync(xmlPath).toString();
					                var etree = et.parse(xmldata);
					                try { conWidth = etree.find('./courseInfo/preferences/lessonWidth').get('value'); } catch(e) {}
					                try { conHeight = etree.find('./courseInfo/preferences/lessonHeight').get('value'); } catch(e) {}
					                if (serverDetails.running) {
		                                _this.logger.info('Content server for ' + found.path + ' already running on port ' + serverDetails.port);
		                                _this._socket.emit('contentServerStarted', {
		                                    id: found.id,
		                                    path: found.path,
		                                    myWidth: conWidth,
		                                    myHeight: conHeight,
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
		                                       _this.logger.info("socket ID that contentServerStarted is being sent to:");
		                                       _this.logger.info(_this._socket.id);
		                                       _this._socket.emit('contentServerStarted', {
		                                       		id: found.id,
		                                            path: encodeURIComponent(found.path),
		                                            myWidth: conWidth,
													myHeight: conHeight,
		                                            type: data.content.type
		                                        });

		                                       serverDetails.running = true;
		                                    }
		                                });
		                            }

		                            //Setting up array to track whether a lesson is locked due to another editor already in....
		                            if(permission == "admin" || permission == "editor"){
		                            	var alreadyIn = false;
		                            	var sessionId = _this.SocketSessions.sessionIdFromSocket(_this._socket);
										var user = _this.SocketSessions.socketUsers[sessionId];
										
										//This shouldn't be needed anymore BUT will hold off until sure - it checks if the user is in....
		                            	for(var i = 0; i < activeEdit_arr.length; i++){
		                            		if(activeEdit_arr[i].user == user.username){
			                            		_this.logger.info("USER WAS ALREADY IN+++++++++++++++++++++++++++++++++++++++++++++");
			                            		alreadyIn = true;
			                            		activeEdit_arr[i].courseID = found.course.id;
			                            		activeEdit_arr[i].lessonID = found.id;
			                            		activeEdit_arr[i].permission = permission;
			                            		activeEdit_arr[i].rejectEdit = false;
			                            		activeEdit_arr[i].isEditor = false;
			                            		activeEdit_arr[i].isActive = false;
			                            		activeEdit_arr[i].socketID = _this._socket.id;
			                            		activeEdit_arr[i].socket = _this._socket;
			                            		activeEdit_arr[i].sessionID = sessionId;
			                            		activeEdit_arr[i].user = user.username;
		                            		}
		                            	}

		                            	if(!alreadyIn){
			                            	var tmpObject = new Object();
			                            	tmpObject.courseID = found.course.id;
			                            	tmpObject.lessonID = found.id;
			                            	tmpObject.permission = permission;
			                            	tmpObject.rejectEdit = false;
			                            	tmpObject.isEditor = false;
			                            	tmpObject.isActive = false;
			                            	tmpObject.socketID = _this._socket.id;
			                            	tmpObject.socket = _this._socket;
											tmpObject.sessionID = sessionId;
											tmpObject.user = user.username;
			                            	activeEdit_arr.push(tmpObject);
										}
									}
								}
							});
						}
					});
				}
			});
		}
    },

    allowTool: function (data){
		var _this = this;
		var allow = true;
		var moduleUser_arr = [];
		var activeToolEditor = null;
        var activeTool = null;

		for(var i = 0; i < activeEdit_arr.length; i++){
			if(data.id == activeEdit_arr[i].courseID || data.id == activeEdit_arr[i].lessonID){
				if(activeEdit_arr[i].isEditor == true){
					allow = false;
					moduleUser_arr.push(activeEdit_arr[i].user);
				}
			}
		}

		for(var j = 0; j < activeTool_arr.length; j++){
			if(data.id == activeTool_arr[j].courseID || data.id == activeEdit_arr[i].lessonID){
				allow = false;
				activeToolEditor = activeTool_arr[j].username;
                activeTool = activeTool_arr[j].tool;
			}
		}

		if(allow == false){
			var myMessage;
			if(activeToolEditor != null){
				myMessage = activeToolEditor + ' is currently using the ' + activeTool + ' on this course. Please contact them to request control or try again later.';
			}else{
				myMessage = "This course currently has modules being edited by the following people:<br/>";
				for(var i = 0; i < moduleUser_arr.length; i++){
					myMessage += moduleUser_arr[i] + '<br/>';
				}
				myMessage += "Either contact them all and request that they step out of their lessons or try again later.";
			}
			_this._socket.emit('generalError', {title: 'ToolLocked', message: myMessage});
		}else{
			var tmpObj = new Object();
			if(data.level == "projectSearch"){
				tmpObj.lessonID = data.id;
				tmpObj.courseID = null;
			}else{
				tmpObj.courseID = data.id;
				tmpObj.lessonID = null;
			}
			
			var sessionId = _this.SocketSessions.sessionIdFromSocket(_this._socket);
			tmpObj.username = _this.SocketSessions.socketUsers[sessionId].username;
            tmpObj.tool = data.tool;
			activeTool_arr.push(tmpObj);
			_this._socket.emit('allowToolLaunch', data.tool);
		}
    },

    closeTool: function (data){
		for(var i = 0; i < activeTool_arr.length; i++){
			if((data.id == activeTool_arr[i].courseID) && (data.tool == activeTool_arr[i].tool)){
				activeTool_arr.splice(i, 1);
			}else if((data.id == activeTool_arr[i].lessonID) && (data.tool == activeTool_arr[i].tool)){
				activeTool_arr.splice(i, 1);
			}
		}
    },

	disconnect: function (socket) {
	    console.log("disconnect called");
	    var _this = this;
	    var disconnectingLessonID = null;
	    var sessionId = _this.SocketSessions.sessionIdFromSocket(_this._socket);
		var user = _this.SocketSessions.socketUsers[sessionId];
		//_this.logger.info("in disconnect function.  sessionId = " + sessionId);
		_this.logger.info("number of active users before disconnect = " + activeEdit_arr.length)
		if(user != undefined){
	    	var wasEditor = false;
			//Remove the current lock from lesson.
			for(var i = 0; i < activeEdit_arr.length; i++){
				if(sessionId == activeEdit_arr[i].sessionID){
					disconnectingLessonID = activeEdit_arr[i].lessonID;
					if(activeEdit_arr[i].isEditor){
						wasEditor = true;
					}
					//_this.logger.info("wasEditor = " + wasEditor);
					_this.logger.info(activeEdit_arr[i].user + " is being removed from the activeEdit_arr and has closed lessonID == " + activeEdit_arr[i].lessonID);
					activeEdit_arr.splice(i, 1);
					break;
				}
			}

			_this.logger.info("number of active users after = " + activeEdit_arr.length + " These users still remain:");
			for(var i = 0; i < activeEdit_arr.length; i++){
				_this.logger.info(activeEdit_arr[i].user + " is still in the activeEdit_arr and assigned to lessonID = " + activeEdit_arr[i].lessonID);
			}

			//If the disconnecting user was the editor, try to pass the lock to the next user.
			if(wasEditor){
				if(disconnectingLessonID != null){
					var newEditor = null;
					var tmpObj = new Object();
					tmpObj.newEditor = null;
					tmpObj.lessonID = disconnectingLessonID;
					_this._socket.broadcast.emit('updateActiveEditor', tmpObj);
				}
			}

			for(var i = 0; i < activeTool_arr.length; i++){
				if(activeTool_arr[i].username == user.username && disconnectingLessonID == null){
					activeTool_arr.splice(i, 1);
				}
			}
	    }
    },



    passLock: function (data){
	    var lessonID = null;
	    var _this = this;
		_this.logger.info("ME = " + data.me)
	    for(var i = 0; i < activeEdit_arr.length; i++){
		    if(activeEdit_arr[i].user == data.me){
		    	activeEdit_arr[i].isEditor = false;
		    	activeEdit_arr[i].rejectEdit = true;
		    	var tmpObj = new Object();
		    	tmpObj.newEditor = null;
		    	tmpObj.lessonID = activeEdit_arr[i].lessonID;
				_this._socket.broadcast.emit('updateActiveEditor', tmpObj);
		    	break;
		    }
	    }
    },

    editModeAccepted: function (data){
	    for(var i = 0; i < activeEdit_arr.length; i++){
	    	if(data.me == activeEdit_arr[i].user  && activeEdit_arr[i].isActive == true){
	    		activeEdit_arr[i].isEditor = true;
	    	}
	    }
    },

    requestLock: function (data){
		var _this = this;
		var currentLesson = null;
		var currentCourse = null;
		var courseToolBeingEdited = false;
		for (var i = 0; i < activeEdit_arr.length; i++){
			if(activeEdit_arr[i].user == data.me){
				currentLesson = activeEdit_arr[i].lessonID;
				currentCourse = activeEdit_arr[i].courseID
				break;
			}
		}

		for (var j = 0; j < activeTool_arr.length; j++){
			if(activeTool_arr[j].courseID == currentCourse || currentLesson == activeTool_arr[j].lessonID){
				courseToolBeingEdited = true;
				_this._socket.emit('outlineActiveError', {title: 'Course ' + activeTool_arr[j].tool + ' Being Edited', message: 'Sorry, the course outline is currently being edited by '+activeTool_arr[j].username+' at this time.  Please contact them or try again later.'});
			}
		}

		if(!courseToolBeingEdited){
			if(currentLesson != null){
				var isSent = false;
				for(var i = 0; i < activeEdit_arr.length; i++){
					if(activeEdit_arr[i].isEditor == true && activeEdit_arr[i].lessonID == currentLesson){
						var tmpData = new Object();
						tmpData.requester = data.me;
						tmpData.requestee = activeEdit_arr[i].user;
						isSent = true;
						_this._socket.broadcast.emit('lockRequest', tmpData);
					}
				}

				//If there is no active editor then take the lock...
				if (!isSent){
					for(var i = 0; i < activeEdit_arr.length; i++){
					    if(activeEdit_arr[i].user == data.me && activeEdit_arr[i].isActive == true){
						    activeEdit_arr[i].rejectEdit = false;
						    activeEdit_arr[i].isEditor = true;
						    var tmpObj = new Object();
						    tmpObj.courseID = activeEdit_arr[i].courseID;
						    tmpObj.lessonID = activeEdit_arr[i].lessonID;
						    tmpObj.newEditor = data.me;
						    _this._socket.broadcast.emit('updateActiveEditor', tmpObj);
						    _this._socket.emit('lockRequestAccepted', {requester: data.me, me: "No One"});
						    break;
					    }
				    }

				}
			}
		}
    },

    approveLockRequest: function (data){
	    var _this = this;
	    var currentLesson = null;
	    for (var i = 0; i < activeEdit_arr.length; i++){
			if(activeEdit_arr[i].user == data.me){
				currentLesson = activeEdit_arr[i].lessonID;
				break;
			}
		}

	    for(var i = 0; i < activeEdit_arr.length; i++){
	    	if(activeEdit_arr[i].isEditor == true){
	    		activeEdit_arr[i].isEditor = false;
	    		activeEdit_arr[i].rejectEdit = false;
	    		break;
	    	}
	    }

	    if(currentLesson != null){
		    for(var i = 0; i < activeEdit_arr.length; i++){
			    if(activeEdit_arr[i].user == data.requester && activeEdit_arr[i].isActive == true){
				    activeEdit_arr[i].isEditor = true;
				    var tmpObj = new Object();
				    tmpObj.newEditor = data.requester;
				    tmpObj.lessonID = activeEdit_arr[i].lessonID;
				    _this._socket.broadcast.emit('updateActiveEditor', tmpObj);
				    _this._socket.broadcast.emit('lockRequestAccepted', data);
				    break;
			    }
		    }
		}
    },

    refuseLockRequest: function (data){
	    var _this = this;
	    _this._socket.broadcast.emit('lockRequestRefused', data);
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

        _this.logger.info('Rename ' + data.content.type + '#' + data.content.id + '...');
        // First, find user and content.
        var contentType = _this.Content.objectType(data.content.type);

        if (contentType) {
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                	var serverDetails = _this.Content.serverDetails(found);
                    var oldName = found.name;

                    var oldDiskPath = _this.Content.diskPath(found.path);
                    found.name = data.content.name;
                    found.generatePath();

                    var newDiskPath = _this.Content.diskPath(found.path);
                    var parentDir = path.resolve(process.cwd(), newDiskPath);
					var myxml = parentDir + '/xml/content.xml';
                    _this.logger.info('Moving ' + data.content.type + ' from ' + oldDiskPath + ' to ' + newDiskPath);

					if(serverDetails.running == true){
						//Code to update xmlPath on ContentSocket goes here...
						ContentSocket.stop(myxml, serverDetails.port, parentDir, _this.logger);
						serverDetails.running = false;
					}

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
                                        //rename Redmine project for the course or lesson
                                        redmine.updateProjectName(oldName, found._id, found.name, function(err){
                                            if(err){
                                                _this.logger.error("Error renaming redmine "+ data.content.type +" project: " + err);
                                            }
                                            else{
                                                _this.logger.info(data.content.type + " project renamed in redmine");
                                            }
                                        }); 

                                        _this.Content.updateAllXml(itemsToSave, function(content, etree) {
                                            var parent = content.getParent();
                                            //console.log("parent : " + parent.name + " content : " + content.name);
                                            etree.find('./courseInfo/preferences/courseTitle').set('value', parent ? parent.name : '');
                                            etree.find('./courseInfo/preferences/lessonTitle').set('value', content.name);
                                            etree.find('./courseInfo/preferences/tlo').set('value', content.tlo);
                                        }, function() {
                                            // Need to git commit the program, then let the user know it is done.
                                            _this.Git.commitProgramContent(found.getProgram(), data.user, function(){
                                                _this.logger.info("rename commit went well.")
                                                _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                                                //_this._socket.emit('refreshDashboard');
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

    _renameContent: function(data, callback) {
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

        _this.logger.info('Rename ' + data.content.type + '#' + data.content.id + '...');
        // First, find user and content.
        var contentType = _this.Content.objectType(data.content.type);

        if (contentType) {
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                    var serverDetails = _this.Content.serverDetails(found);
                    var oldName = found.name;

                    var oldDiskPath = _this.Content.diskPath(found.path);
                    found.name = data.content.name;
                    found.generatePath();

                    var newDiskPath = _this.Content.diskPath(found.path);
                    var parentDir = path.resolve(process.cwd(), newDiskPath);
                    var myxml = parentDir + '/xml/content.xml';
                    _this.logger.info('Moving ' + data.content.type + ' from ' + oldDiskPath + ' to ' + newDiskPath);

                    if(serverDetails.running == true){
                        //Code to update xmlPath on ContentSocket goes here...
                        ContentSocket.stop(myxml, serverDetails.port, parentDir, _this.logger);
                        serverDetails.running = false;
                    }

                    var itemsToSave = [found];

                    found.getChildren(function(err, children) {
                        if (err) {
                            _this.logger.error('found.getChildren(): ' + err);
                            callback(err);
                            //_this._socket.emit('generalError', {title: 'Renaming Error', message: 'Error occurred when renaming content. (1)'});
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
                                        callback(err);
                                        //_this._socket.emit('generalError', {title: 'Renaming Error', message: 'Error occurred when renaming content. (2)'});
                                    }
                                    else {
                                        //rename Redmine project for the course or lesson
                                        redmine.updateProjectName(oldName, found._id, found.name, function(err){
                                            if(err){
                                                _this.logger.error("Error renaming redmine "+ data.content.type +" project: " + err);
                                            }
                                            else{
                                                _this.logger.info(data.content.type + " project renamed in redmine");
                                            }
                                        }); 

                                        _this.Content.updateAllXml(itemsToSave, function(content, etree) {
                                            var parent = content.getParent();
                                            //console.log("parent : " + parent.name + " content : " + content.name);
                                            etree.find('./courseInfo/preferences/courseTitle').set('value', parent ? parent.name : '');
                                            etree.find('./courseInfo/preferences/lessonTitle').set('value', content.name);
                                            etree.find('./courseInfo/preferences/tlo').set('value', content.tlo);
                                        }, function() {
                                            // Need to git commit the program, then let the user know it is done.
                                            _this.Git.commitProgramContent(found.getProgram(), data.user, function(){
                                                _this.logger.info("rename commit went well.");
                                                callback();
                                                //_this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                                                //_this._socket.emit('refreshDashboard');
                                            }, function(err){
                                                _this.logger.error('_this.Git.commitProgramContent(): ' + err);
                                                callback(err);
                                                //_this._socket.emit('generalError', {title: 'Renaming Error', message: 'Error occurred when renaming content. (3)'});
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

    clearLessonComments: function (lesson){
    	ContentComment.find({contentId: lesson.lesson}).remove()
    },

    retrieveRedmineHost: function(callback){
        var _this = this;
        callback(_this.config.redmineHost);
    },    

    addRedmineIssue: function(comment, callback){
        var _this = this;

        //console.log(comment);
        redmine.createIssue(comment, function(err){
            if(err){
                _this.logger.error("Error creating redmine issue: " + err);
                callback(err);
            }
            else{
                _this.logger.info(" issue created in redmine");
                callback();
            }
        }); 
    },

    getRedminePageIssues: function (page, callback){
        var _this = this;
        redmine.getIssuesByPageId(page, function(data, err){
            if(err){
                _this.logger.error("Error finding issues: " + err);
                callback({ issues: [], total_count: 0, offset: 0, limit: 25 });
            }
            else{
                //_this.logger.info(data);
                callback(data);
            }
        }); 
    },

    // getRedmineLessonIssues: function (_lessontitle, callback){
    //     var _this = this;
    //     redmine.getIssuesByLessonId(_lessontitle, function(data, err){
    //         if(err){
    //             _this.logger.error("Error finding issues: " + err);
    //             callback({ issues: [], total_count: 0, offset: 0, limit: 25 });
    //         }
    //         else{
    //             callback(data);
    //         }
    //     }); 
    // }, 

    getRedmineLessonIssuesForIndex: function (_lesson){
        var _this = this;
        redmine.getIssuesByLessonId(_lesson, function(data, err){
            if(err){
                _this.logger.error("Error finding issues: " + err);
            }
            else{
                _this.io.sockets.emit('updateRedmineCommentIndex', data);
            }
        }); 
    },    

    updateRedmineIssue: function (issue, username, callback){
        var _this = this;
        redmine.updateIssue(issue, username, function(err){
            if(err){
                _this.logger.error("Error updating issue: " + err);
                callback(err);
            }
            else{
                _this.logger.info("Issue updated successfully");
                callback();
            }
        }) ; 

    },

    getRedmineIssueJournal: function(issueId, callback){
        var _this = this;
        redmine.getIssueJournal(issueId, function(data, err){
            if(err){
                _this.logger.error("Error finding journal: " + err.message);
                var emptyJournal = [];
                callback(emptyJournal);
            }
            else{
                callback(data);
            }
        });
    },

    getRedmineProjectMembership: function(page, callback){
        var _this = this;

        redmine.getProjectMembership(page.lessonid, function(data, projId, err){
            if(err){
                _this.logger.error("Error finding project membership: " + err.message);
                var emptyMembership = [];
                callback(emptyMembership);
            }
            else{
                callback(data);
            }
        });
    },

    findRedmineProjectId: function(projectId, callback){
        var _this = this;

        redmine.findProjectId(projectId, function(data, err){
            if(err){
                //_this.logger.error("Error finding project id: " + err.message);
                var emptyProject = {};
                callback(emptyProject);
            }
            else{
                callback(data);
            }
        });
    },

    checkRedmineProjectStructure: function(courseid, callback){
        var _this = this;

        var structure_arr = [];
        Course.findAndPopulate(courseid, function (err, found) {
            //console.log(found.getProgram().name);
            if(err){
                _this.logger.error('Error in Course findAndPopulate');
                callback(err);
            }
            else{
                var page = {
                    programtitle : found.getProgram().name,
                    programid: found.getProgram()._id,
                    contenttype : 'program'
                };
                structure_arr.push(page);

                page = {
                    coursetitle : found.name,
                    courseid: found._id,
                    programtitle : found.getProgram().name,
                    programid : found.getProgram()._id,
                    contenttype : 'course'
                }
                structure_arr.push(page);

                found.getChildren(function(err, children) {
                    if (err) {
                        _this.logger.error('found.getChildren(): ' + err);
                       callback(err);
                    }
                    else {
                        // Make sure children paths are re-generated as well.
                        children.forEach(function(child){
                            //console.log(child.name);
                            page = {
                                lessontitle : child.name,
                                lessonid: child._id,
                                coursetitle : found.name,
                                courseid: found._id,
                                programtitle : found.getProgram().name,
                                programid : found.getProgram()._id,
                                contenttype : 'lesson'
                            };
                            structure_arr.push(page);
                        });  
                    }
                    _this._findAndCreateRedmineProject(structure_arr, 0, function(err){
                        if(err)
                        {
                            _this.logger.error('Error in _findAndCreateRedmineProject');
                            callback(err);
                        }
                        else{ 
                            callback(); 
                        }
                    });                    
                });          


            }
        });
    },

    _findAndCreateRedmineProject: function(_structure_arr, index, callback){
        var _this = this;

        var _project = {};

        if(index < _structure_arr.length ){
            var testid = '';
            if(_structure_arr[index].contenttype == 'program'){
                testid = _structure_arr[index].programid;
            }
            else if(_structure_arr[index].contenttype == 'course'){
                testid = _structure_arr[index].courseid
            }
            else{
                testid = _structure_arr[index].lessonid
            }
            _this.findRedmineProjectId(testid, function(data){
                _project = data;

                //if no id create project
                if(_project.id == undefined){
                    if(_structure_arr[index].contenttype == 'program'){
                        _this._createRedmineProject(_structure_arr[index].programtitle, _structure_arr[index].programid, function(){
                            _this.logger.info('Redmine project created for '+ _structure_arr[index].lessontitle);
                            _this._findAndCreateRedmineProject(_structure_arr, index+1, function(err){
                                (err) ? callback(err) : callback();
                            });                            
                        });
                    }
                    else if(_structure_arr[index].contenttype == 'course'){
                        // var _program = {
                        //     name : _structure_arr[index].coursetitle
                        // };
                        _this._createRedmineCourse(_structure_arr[index].coursetitle, _structure_arr[index].courseid, _structure_arr[index].programid, function(){
                            _this._findAndCreateRedmineProject(_structure_arr, index+1, function(err){
                                (err) ? callback(err) : callback();
                            });                            
                        });
                    }
                    else{

                        var _course = {
                            id : _structure_arr[index].courseid
                        };
                        // var _program = {
                        //     name : _structure_arr[index].programtitle
                        // };

                        _this._createRedmineLesson(_structure_arr[index].lessontitle, _structure_arr[index].lessonid, _course, function(){
                            _this._findAndCreateRedmineProject(_structure_arr, index+1, function(err){
                                (err) ? callback(err) : callback();
                            }); 
                        });

                    }
                }
                else{
                    _this._findAndCreateRedmineProject(_structure_arr, index+1, function(err){
                        (err) ? callback(err) : callback();
                    });                       
                }


            });
        }
        else{
            callback();
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

    _copyJSArray: function(lessons, index, callback){
        var _this = this;
        _this._copyJSFiles(lessons[index], function(err){
            if(err){
                callback(err);
            }

            if(index+1 != lessons.length){
                _this._copyJSArray(lessons, index+1, callback);
            }
            else{
                callback(null);
            }
        });
    },

    _removeJSArray: function(lessons, index, callback){
        var _this = this;
        try{
            fs.removeSync(lessons[index]);
        }
        catch(err){
            callback(err);
        }

        if(index+1 != lessons.length){
            _this._removeJSArray(lessons, index+1, callback);
        }
        else{
            callback(null);
        }
    },

    retrieveServer: function(callback){
        var _this = this;
        callback(_this.config.server);
    },

    //xapi functions
    configLrs: function(){
        var _this = this;

        var myconfig = {
            "url" : "http://cde-cognizen-vm-2.ctc.com/xapi/",
            "auth" : {
                "user" : "cognizen",
                "pass" : "cognizen"
            }
        };

        _this.mylrs = new adl.XAPIWrapper(myconfig);
    },

    sendXapiStatement: function(_stmt, callback){
        var _this = this;
        _this.mylrs.testConfig(function(data){
            _this.logger.info("testConfig : " + data);
        });
        _this.mylrs.sendStatements(_stmt, function (err, resp, bdy) {
            // _this.logger.info(resp.statusCode);
            // _this.logger.info(bdy);
            var returnData = {
                err : err,
                resp : resp,
                bdy : bdy
            };
            callback(returnData);            
        });

    },

    getXapiStatement: function(_searchParams, callback){
        var _this = this;

        _this.mylrs.getStatements(_searchParams, null, function (err, resp, bdy) {
            var returnData = {
                err : err,
                resp : resp,
                bdy : bdy
            };
            callback(returnData);            
        });
    },

    sendXapiState: function(data, callback){
        var _this = this;
        if(data.virg){
            _this.mylrs.sendState(data.activity, data.agent, data.stateid, null, data.state, null, "*", function (err, resp, bdy) {
                var returnData = {
                    err : err,
                    resp : resp,
                    bdy : bdy
                };
                callback(returnData);
            });
        }
        else{
            _this.mylrs.sendState(data.activity, data.agent, data.stateid, null, data.state, adl.hash(JSON.stringify(data.matchHash)), null, function (err, resp, bdy) {
                var returnData = {
                    err : err,
                    resp : resp,
                    bdy : bdy
                };
                callback(returnData);
            });            
        }

    },

    getXapiState: function(data, callback){
        var _this = this;
        _this.mylrs.getState(data.activity, data.agent, data.stateid, null, null, function (err, resp, bdy) {
            var returnData = {
                err : err,
                resp : resp,
                bdy : bdy
            };
            _this.logger.info(resp.statusCode);
            callback(returnData);
        });
    },

    sendXapiActivityProfile: function(data, callback){
        var _this = this;
        //new activity profile 
        _this.mylrs.sendActivityProfile(data.activityid, data.profileid, data.profile, null, "*", function (err, resp, bdy) {
            var returnData = {
                err : err,
                resp : resp,
                bdy : bdy
            };
            callback(returnData);
        });

        //TODO: update 
        //_this.mylrs.sendActivity(data.activityid, data.profileid, data.profile, adl.hash(JSON.stringify(data.profHash)), null,function (err, resp, bdy) {} )
    },

    getXapiActivityProfile: function(data, callback){
        var _this = this;

        _this.mylrs.getActivityProfile(data.activityid, data.profileid, null, function (err, resp, bdy) {
            var returnData = {
                err : err,
                resp : resp,
                bdy : bdy
            };
            callback(returnData);            
        });
    },
    //xapi functions end
    //cloning functions

    cloneProgram: function (data){
        var _this = this;
       // console.log(data);
        var origPath = data.path;
        var originalName = data.name;
        var nameHadInvalidChars = Utils.hasInvalidFilenameChars(data.name);
        Program.createUnique(data, function (saved, callbackData) {
            if (saved) {
                _this.Git.initializeProgramRepo(callbackData, function () {
                    //setup of object for _cloneProgramFiles
                    var cloneData = {
                        original: {
                            id: data.id,
                            type: data.type,
                            path: origPath,
                            permission: data.permission,
                            user: data.user
                        },
                        destination:{
                            path: callbackData.path,
                            name: callbackData.name,
                            _id: callbackData._id
                        }
                    };                       
                    _this._cloneProgramFiles(cloneData, function () {
                        _this.Git.commitProgramContent(callbackData, data.user, function () {
                            //create project in Redmine
                            _this._createRedmineProject(data.name, callbackData._id, function(){
                                Program.findAndPopulate(callbackData._id, function (err, found) {

                                    var coursesLength = found.courses.length;
                                    for (var i = 0; i < coursesLength; i++) {
                                        //build approprate data for each course. 
                                        Course.findAndPopulate(found.courses[i], function (err, found){
                                            if(found){ 
                                                _this.checkRedmineProjectStructure(found._id, function (err){
                                                    if(err){
                                                        _this._socket.emit('generalError', {title: 'Redmine Error', message: 'There was an error creating the Redmine project structure.'});
                                                        _this.logger.error(err);                                                                                               
                                                    }
                                                });

                                            }
                                        });
                                    }
                                    _this._assignContentPermissionAfterCreation(callbackData, 'program', 'admin', data.name, function (err) {
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
                                 
                                });                                                                                           
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

    _cloneProgramFiles: function (program, callback) {
        var _this = this;
        var destWritePath = path.normalize(_this.Content.diskPath(program.destination.path));
        var srcWritePath = path.normalize(_this.Content.diskPath(program.original.path));
        var root = path.normalize('../core-files');

        FileUtils.copyDir(srcWritePath, destWritePath, function (path) {
            return (!path.endsWith('.git'));
        }, function (err){
            Program.findAndPopulate(program.original.id, function (err, found) {

                var coursesLength = found.courses.length;
                for (var i = 0; i < coursesLength; i++) {
                    //build approprate data for each course. 
                    Course.findAndPopulate(found.courses[i], function (err, found){
                        if(found){

                            var newCourseXML = destWritePath + "/" + found.name + "/course.xml";                         
                            var newCourse = {
                                program: {
                                    id : program.destination._id
                                },
                                id: found._id,
                                name: found.name,
                                parent: program.destination._id,
                                parentDir: program.destination.name,
                                path: program.destination.path + "/" + found.name,
                                permission: program.original.permission,
                                type: 'course',
                                user: program.original.user 
                            };
                            
                            var courseName = found.name;
                            Course.createUnique(newCourse, function (saved, callbackData) {
                                //probably do this for all courses
                                //////////////////////////////
                                var data, etree;
                                var courseID = callbackData._id;
                                fs.readFile(newCourseXML, function(err, data){
                                    data = data.toString();
                                    etree = et.parse(data);
                                    //set the name and id in the course.xml
                                    etree.find('./').set('name', courseName);
                                    etree.find('./').set('coursedisplaytitle', courseName);
                                    etree.find('./').set('id', courseID);

                                    var itemCount = etree.findall('./item').length;

                                    var updatedCount = 0;
                                    for (var i = 0; i < itemCount; i++) {
                                        var myNode = etree.findall('./item')[i];
                                        var nodeId = myNode.get('id');
                                        var nodeName = myNode.get('name');

                                        var lessonData = {
                                            course: {
                                                id: courseID
                                            },
                                            id: nodeId,
                                            name: nodeName,
                                            parent: courseID,
                                            parentDir: courseName,
                                            path: destWritePath +'/'+nodeName,
                                            permission: program.original.permission,
                                            type: 'lesson',
                                            user: program.original.user

                                        };

                                        Lesson.createUnique(lessonData, function (saved, callbackData) {
                                            if (saved) {
                             
                                                var tmpContent = {
                                                    course: callbackData.course,
                                                    path: callbackData.path,
                                                    name: callbackData.name,
                                                    _id: callbackData._id,
                                                    parentName: courseName
                                                };

                                                _this.Content.updateContentXml(tmpContent, function(newcontent, etreeContent) {
                                                    var parentName = newcontent.parentName ? newcontent.parentName : '';
                                                    etreeContent.find('./courseInfo/preferences/courseTitle').set('value', parentName);
                                                    etreeContent.find('./courseInfo/preferences/id').set('value', callbackData._id);

                                                    var myItemNode = etree.findall('./item')[updatedCount];
                                                    myItemNode.set('id', callbackData._id);

                                                    if(++updatedCount == itemCount){

                                                        var xml = etree.write({'xml_decleration': false});
                                                        fs.outputFile(newCourseXML, xml, function (err) {
                                                            if (err) callback(err, null);                     
                                                            callback(err);

                                                        });                                    
                                                    }

                                                });            

                                            }
                                            else 
                                            {
                                                _this._socket.emit('generalError', {title: 'Lesson Exists', message: 'There is already a lesson in this course that is named ' + data.name + '. Please choose a different lesson name or contact the program admin to grant you access to the course.'});
                                                _this.logger.info('Lesson already exists with name ' + data.name);
                                            }                        
                                        });                    

                                    };                

                                });
                                ////////////////////////////////////
                            });                            
                        }
                    });

                }

            });         
        }); 

    },

    cloneCourse: function (data) {
        var _this = this;
        var origPath = data.path;
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
                                //setup of object for _cloneContentFiles
                                var cloneData = {
                                    original: {
                                        id: data.id,
                                        type: data.type,
                                        parentDir: data.parentDir,
                                        path: origPath,
                                        parent: data.parent,
                                        permission: data.permission,
                                        user: data.user
                                    },
                                    destination:{
                                        course: callbackData.course,
                                        path: callbackData.path,
                                        name: callbackData.name,
                                        _id: callbackData._id
                                    }
                                };                             
                                 _this._cloneCourseFiles(cloneData, function () {
                                    _this.Git.commitProgramContent(callbackData.fullProgram, data.user, function () {
                                        _this.checkRedmineProjectStructure(callbackData._id, function (err){
                                            if(err){
                                                _this._socket.emit('generalError', {title: 'Redmine Error', message: 'There was an error creating the Redmine project structure.'});
                                                _this.logger.error(err);                                                                                               
                                            }
                                            else{
                                                _this._assignContentPermissionAfterCreation(callbackData, 'program', 'admin', data.name, function (err) {
                                                    if (err) {
                                                        _this._socket.emit('generalError', {title: 'Course Error', message: 'Error occurred when saving course content.'});
                                                        _this.logger.error(err);
                                                    }
                                                    else {
                                                        _this._assignAllLessonsPermission(callbackData, 'admin', function (err) {
                                                            if(err){
                                                                _this._socket.emit('generalError', {title: 'Clone Error', message: 'Error occurred when assigning lesson permissions.'});
                                                                _this.logger.error(err);                                                                
                                                            }
                                                            _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                                                        });

                                                    }
                                                });
                                            }
                                        });

                                    }, function (message) {
                                        _this._socket.emit('generalError', {title: 'Course Error', message: 'Error occurred when saving course content.'});
                                        _this.logger.info("Error committing program content: " + message)
                                    });
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

    _cloneCourseFiles: function (content, callback) {
        var _this = this;
        var destWritePath = path.normalize(_this.Content.diskPath(content.destination.path));
        var srcWritePath = path.normalize(_this.Content.diskPath(content.original.path));
        var newCourseXML = destWritePath + "/course.xml";
        var srcCourseXML = srcWritePath + '/course.xml';
        var tokenz = content.destination.path.split("/");
        var programName = tokenz[0];

        var courseID = content.destination._id;
        var courseName = content.destination.name;

        FileUtils.copyDir(srcWritePath, destWritePath, true, function (err) {
    
            var data, etree;

            fs.readFile(newCourseXML, function(err, data){
                data = data.toString();
                etree = et.parse(data);
                //set the name and id in the course.xml
                etree.find('./').set('name', courseName);
                etree.find('./').set('coursedisplaytitle', courseName);
                etree.find('./').set('id', courseID);

                var itemCount = etree.findall('./item').length;

                var updatedCount = 0;
                for (var i = 0; i < itemCount; i++) {
                    var myNode = etree.findall('./item')[i];
                    var nodeId = myNode.get('id');
                    var nodeName = myNode.get('name');

                    var lessonData = {
                        course: {
                            id: courseID
                        },
                        id: nodeId,
                        name: nodeName,
                        parent: courseID,
                        parentDir: courseName,
                        path: destWritePath +'/'+nodeName,
                        permission: content.original.permission,
                        type: 'lesson',
                        user: content.original.user

                    };

                    Lesson.createUnique(lessonData, function (saved, callbackData) {
                        if (saved) {
         
                            var tmpContent = {
                                course: callbackData.course,
                                path: callbackData.path,
                                name: callbackData.name,
                                _id: callbackData._id,
                                parentName: courseName
                            };

                            _this.Content.updateContentXml(tmpContent, function(newcontent, etreeContent) {
                                var parentName = newcontent.parentName ? newcontent.parentName : '';
                                etreeContent.find('./courseInfo/preferences/courseTitle').set('value', parentName);
                                etreeContent.find('./courseInfo/preferences/id').set('value', callbackData._id);

                                var myItemNode = etree.findall('./item')[updatedCount];
                                myItemNode.set('id', callbackData._id);

                                if(++updatedCount == itemCount){

                                    var xml = etree.write({'xml_decleration': false});
                                    fs.outputFile(newCourseXML, xml, function (err) {
                                        if (err) callback(err, null);                     
                                        callback(err);

                                    });                                    
                                }

                            });            

                        }
                        else 
                        {
                            _this._socket.emit('generalError', {title: 'Lesson Exists', message: 'There is already a lesson in this course that is named ' + data.name + '. Please choose a different lesson name or contact the program admin to grant you access to the course.'});
                            _this.logger.info('Lesson already exists with name ' + data.name);
                        }                        
                    });                    

                };                

            });

        });
    },    

    cloneLesson: function (data){
        var _this = this;
        var origPath = data.path;
        Lesson.createUnique(data, function (saved, callbackData) {
            if (saved) {
                _this.Git.updateLocalContent(callbackData.fullProgram, function(err) {
                    if (err) {
                        _this._socket.emit('generalError', {title: 'Lesson Error', message: 'Error occurred when saving lesson content.'});
                        _this.logger.error(err);
                    }
                    else {
                        //setup of object for _cloneContentFiles
                        //var myNewId = FileUtils.guid();
                        var cloneData = {
                            original: {
                                id: data.id,
                                type: data.type,
                                parentDir: data.parentDir,
                                path: origPath,
                                parent: data.parent,
                                permission: data.permission
                            },
                            destination:{
                                course: callbackData.course,
                                path: callbackData.path,
                                name: callbackData.name,
                                _id: callbackData._id
                            }
                        };

                        _this._cloneContentFiles(cloneData, function () {
                            _this.Git.commitProgramContent(callbackData.fullProgram, data.user, function () {
                                //format dest course id for _createRedmineLesson
                                var destCourse = {
                                    id: callbackData.course
                                };
                                _this._createRedmineLesson(data.name, callbackData._id, destCourse, function(){
                                    _this._assignContentPermissionAfterCreation(callbackData, 'lesson', 'admin', data.name, function (err) {
                                        if (err) {
                                            _this._socket.emit('generalError', {title: 'Lesson Error', message: 'Error occurred when saving lesson content.'});
                                            _this.logger.error(err);
                                        }
                                        else {
                                              
                                            _this.io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
                                        }
                                    });
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

    _cloneContentFiles: function (content, callback) {
        var _this = this;
        var destWritePath = path.normalize(_this.Content.diskPath(content.destination.path));
        var srcWritePath = path.normalize(_this.Content.diskPath(content.original.path));
        var tokenz = content.destination.path.split("/");
        var programName = tokenz[0];
        var courseName = tokenz[1];
        var root = path.normalize('../core-files');
        var myID = content.destination._id;
        
        FileUtils.rmdir(destWritePath);        

        FileUtils.copyDir(srcWritePath, destWritePath, true, function (err) {
            var tmpContent = {
                course: content.destination.course,
                path: content.destination.path,
                name: content.destination.name,
                _id: content.destination._id,
                parentName: courseName
            };
            _this.Content.updateContentXml(tmpContent, function(newcontent, etree) {
                var parentName = newcontent.parentName ? newcontent.parentName : '';
                etree.find('./courseInfo/preferences/courseTitle').set('value', parentName);
                etree.find('./courseInfo/preferences/lessonTitle').set('value', newcontent.name);
                etree.find('./courseInfo/preferences/lessondisplaytitle').set('value', newcontent.name);
                etree.find('./courseInfo/preferences/id').set('value', myID);

                //setup srcCoursePath
                var srcCoursePath = srcWritePath;
                var tempPath = srcCoursePath.substr(0, srcCoursePath.lastIndexOf("\/"));
                if(tempPath === ""){
                    tempPath = srcCoursePath.substr(0, srcCoursePath.lastIndexOf("\\"));
                }
                srcCoursePath = tempPath + "/course.xml";

                //setup destCoursePath
                var destCoursePath = destWritePath;
                tempPath = destCoursePath.substr(0, destCoursePath.lastIndexOf("\/"));
                if(tempPath === ""){
                    tempPath = destCoursePath.substr(0, destCoursePath.lastIndexOf("\\"));
                }
                destCoursePath = tempPath + "/course.xml";

                //read scr course.xml
                fs.readFile(srcCoursePath, function(err, data){

                    //copy src item and update id and name
                    var _data, etree;
                    _data = data.toString();
                    etree = et.parse(_data);

                    var root = etree.find('./');
                    var origItem = root.find('./item[@id="'+content.original.id+'"]');
                    origItem.set('id', myID);
                    origItem.set('name', newcontent.name);

                    //add updated src item to dest course.xml
                    fs.readFile(destCoursePath, function(err, data){
                        var XML = et.XML;
                        var ElementTree = et.ElementTree;
                        var element = et.Element;
                        var subElement = et.SubElement;
                        var _data, etree;

                        _data = data.toString();
                        etree = et.parse(_data);

                        var root = etree.find('./');
                        root.append(origItem);

                        etree = new ElementTree(root);
                        var xml = etree.write({'xml_decleration': false});
                        fs.outputFile(destCoursePath, xml, function (err) {
                            if (err) callback(err, null);
                            callback(err);
                        });
                    });

                });

            });

        });
    },    
    //cloning functions end

    publishContent: function (data, callback){
        var _this = this;
        var user = data.user.username;
        console.log(data);
        console.log("publishContent");
        if (data.content.type === 'program') {
            // Don't allow this, too volatile to change the git repo at this point.
            return;
        }

        var contentType = _this.Content.objectType(data.content.type);

        if (contentType) {
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                    _this.Git.lock.runwithlock(function () {
                        if(data.content.type === 'course'){
                            var scormPath = path.normalize('../core-files/scorm/');
                            var scormDir = path.resolve(process.cwd(), scormPath);
                            var programPath = path.normalize('../programs/' + found.path + '/');
                            var contentPath = path.resolve(process.cwd(), programPath);
                            var xmlContentFile = contentPath + '/xml/content.xml';

                            //creates the packages directory under the course dir
                            fs.mkdirs(contentPath + "/packages", function(err){
                                if(err) return _this.logger.error(err);
                                _this.logger.info("created packages directory");
                            });

                            //init SCORM (itemsToSave may need to be passed into init)
                            scorm.init(_this.logger, scormDir, contentPath, xmlContentFile, found, data.scorm, data.deliverable );

                            _this._copyJSFiles(programPath +'/../', function (err) {
                                if(err){
                                    _this.logger.error(err);
                                    _this.Git.lock.release();
                                }

                                _this._copyCSSFiles(programPath +'/../', true, function (err) {
                                	if(err){
                                    	_this.logger.error(err);
										_this.Git.lock.release();
                                	}
                                    console.log("pub generateSCORMCourse");
	                                scorm.generateSCORMCourse(function(err, filepath){

	                                    if(err){
	                                        _this.logger.error(err);
	                                        _this._socket.emit('generalError', {title: 'Generating SCORM Course', message: err});

	                                        _this.Git.lock.release();
	                                        callback('');

	                                    }
	                                    else{

	                                        _this.logger.info("publish Course success.");
	                                        _this.logger.info("---------- filepath = " + filepath);
	                                        _this.Git.lock.release();
	                                        callback(filepath);
	                                    }

	                                    try{
	                                        fs.removeSync(programPath + '/../js');
	                                    }
	                                    catch(err)
	                                    {
	                                        _this.logger.error(err);
	                                    }

	                                    try{
	                                        fs.removeSync(programPath + '/../css/CoreCSS');
	                                    }
	                                    catch(err)
	                                    {
	                                        _this.logger.error(err);
	                                    }

	                                    try{
	                                        fs.removeSync(programPath + '/../css/ProgramCSS');
	                                    }
	                                    catch(err)
	                                    {
	                                        _this.logger.error(err);
	                                    }
	                                });
	                            });
                            });
                        }
                        else{
                            var scormPath = path.normalize('../core-files/scorm/');
                            var scormDir = path.resolve(process.cwd(), scormPath);
                            var programPath = path.normalize('../programs/' + found.path + '/');
                            var contentPath = path.resolve(process.cwd(), programPath);
                            var xmlContentFile = contentPath + '/xml/content.xml';

                            scorm.init(_this.logger, scormDir, contentPath, xmlContentFile, null, data.scorm, data.deliverable );

                            _this._copyJSFiles(programPath +'/../', function (err) {
                                if(err){
                                    _this.logger.error(err);
                                    _this.Git.lock.release();
                                }

                                _this._copyCSSFiles(programPath +'/../', false, function (err) {
                                	if(err){
                                    	_this.logger.error(err);
										_this.Git.lock.release();
                                	}

	                                //calls the generateSCORMLesson function in congizen-scorm.js
	                                scorm.generateSCORMLesson(function(err, filepath){

	                                    if(err){
	                                        _this._socket.emit('generalError', {title: 'Generating SCORM Lesson', message: 'TODO: generating scorm error'});
	                                        callback('');
	                                        _this.Git.lock.release();
	                                    }
	                                    else{
	                                        _this.logger.info("publishLesson success.");
	                                        _this.logger.info("---------- filepath = " + filepath);
	                                        _this.Git.lock.release();
	                                        callback(filepath);
	                                    }

	                                    try{
	                                        fs.removeSync(programPath + '/../js');
	                                    }
	                                    catch(err)
	                                    {
	                                        _this.logger.error(err);
	                                    }

	                                    try{
	                                        fs.removeSync(programPath + '/../css/CoreCSS');
	                                    }
	                                    catch(err)
	                                    {
	                                        _this.logger.error(err);
	                                    }

	                                    try{
	                                        fs.removeSync(programPath + '/../css/ProgramCSS');
	                                    }
	                                    catch(err)
	                                    {
	                                        _this.logger.error(err);
	                                    }

	                                });
	                            });
                            });
                        }
                    /////////end lock
                    });
                    //Add GIT Commit code
                    _this.Git.commitProgramContent(found.getProgram(), user, function() {
                    	console.log("committed your published package to git.");
                    }, function(message) {
                        	_this._socket.emit('generalError', {title: 'Repository Saving Error', message: 'Error occurred when saving repository content.'});
                            _this.logger.error("Error when committing to the Git Repo: " + message);
                    });
                }
            });
        }
    }};

module.exports = SocketHandler;
