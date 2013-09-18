var config = require('./config.json');

var http = require('http');
var https = require('https');
var httpProxy = require('http-proxy');
var path = require("path");
var et = require('elementtree');
var express = require('express');
var cookie = require("cookie");
var connect = require("connect");

var socketIo = require('socket.io');
var SocketIOFileUploadServer = require('socketio-file-upload');

var GitServer = require('git-server');
var nodemailer = require("nodemailer");
var fs = require('fs-extra');
var winston = require('winston');
var ffmpeg = require('fluent-ffmpeg');
var subNodes = [];

// Load Underscore.string for string manipulation
var _ = require("underscore");
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string'); // => true

var mongoose = require('mongoose');//mongoose connector
var FileUtils = require('./file-utils');
var User = require('./user-model').User;
var UserPermission = require('./user-model').UserPermission;
var Program = require('./content-model').Program;
var Application = require('./content-model').Application;
var Course = require('./content-model').Course;
var Lesson = require('./content-model').Lesson;
var ContentComment = require('./content-model').ContentComment;
var io;

var logFolder = config.logFolder ? config.logFolder : './';
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

var _default = function(value, fallback) {
    return (!value ? fallback : value);
};


var Ports = {
    external: {
        port: _default(config.port, 9443)
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
var Mail = {
    send: function (data) {
        var smtpTransport = nodemailer.createTransport("SMTP", {
            //Docs available at: https://github.com/andris9/Nodemailer
            host: config.mailServer
        });

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: "cognizen <" + config.adminEmail + ">",// sender address
            to: data.user, // list of receivers
            subject: data.subject, // Subject line
            text: data.txtMsg, // plaintext body
            html: data.msg // html body
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) {
                logger.info("Houston: We have a problem = " + error);
            } else {
                logger.info("Message sent: " + response.message);
            }

            // if you don't want to use this transport object anymore, uncomment following line
            smtpTransport.close(); // shut down the connection pool, no more messages
        });
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
        if (user.admin) {
            return {directories: _.values(allContent)};
        }

        var accessibleContentArray = _.filter(allContent, function (content, key) {
            return content.permission != null;
        });

        var accessibleContent = {};
        accessibleContentArray.forEach(function (content) {
            accessibleContent[content.id] = content;
            // Add all parents in
            if (content.parent) {
                var parentId = content.parent;
                while (parentId) {
                    var parentContent = allContent[parentId];
                    accessibleContent[parentId] = parentContent;
                    parentId = parentContent.parent;
                }
            }
        });

        return {directories: _.values(accessibleContent)};
    },

    userPermission: function (user, content) {
        var found = null;
        if (user.permissions) {
            user.permissions.forEach(function (permission) {
                if (permission.contentId == content.id) {
                    found = permission.permission;
                }
            });
        }

        return found;
    },

    allContentForUser: function (socket, user) {
        var _this = this;

        User.findOne({username: user.username}).populate('permissions').exec(function (err, loggedInUser) {
            var allContent = {};

            if (err || !loggedInUser) {
                socket.emit('receiveProjectsFromDB', {directories: []});
            }
            else {
                Program.find().or([{'deleted': null}, {'deleted': false}]).populate('courses applications').exec(function (err, found) {
                    // For now, and maybe forever, going to mimic the folder structure that we used to return, so the client doesn't have to change
                    var sendMessage = true;
                    var totalContentCount = 0;//This is for the Course.find cycle - was sending once for each program.  This ensures that the emit only fires once when combined with found.length.
                    if (found) {
                        found.forEach(function (program) {
                            allContent[program.id] = {
                                id: program.id,
                                type: 'program',
                                name: program.name,
                                parentDir: '',
                                path: program.name,
                                permission: _this.userPermission(loggedInUser, program)
                            };

                            if (program.applications) {
                                program.applications.forEach(function (app) {
                                    if (!app.deleted) {
                                        allContent[app.id] = {
                                            id: app.id,
                                            type: 'application',
                                            name: app.name,
                                            parentDir: program.name,
                                            path: [program.name, '/', app.name].join(''),
                                            parent: program.id,
                                            permission: _this.userPermission(loggedInUser, app)
                                        };
                                    }
                                });
                            }

                            if (program.courses) {

                                sendMessage = false; // Need to wait and let the Course.find send the message
                                var ids = _.pluck(program.courses, 'id');

                                // This is ugly and I hate it, but since mongoose can't seem to populate 2 deep on arrays, I had to lookup the course
                                Course.find({'_id': {$in: ids}}).or([{'deleted': null}, {'deleted': false}]).populate('lessons').exec(function (err, courses) {
                                    if (courses && courses.length > 0) {
                                        courses.forEach(function (course) {
                                            allContent[course.id] = {
                                                id: course.id,
                                                type: 'course',
                                                name: course.name,
                                                parentDir: program.name,
                                                path: [program.name, '/', course.name].join(''),
                                                parent: program.id,
                                                permission: _this.userPermission(loggedInUser, course)
                                            };

                                            if (course.lessons) {
                                                course.lessons.forEach(function (lesson) {
                                                    if (!lesson.deleted) {
                                                        allContent[lesson.id] = {
                                                            id: lesson.id,
                                                            type: 'lesson',
                                                            name: lesson.name,
                                                            parentDir: [program.name, '/', course.name].join(''),
                                                            path: [program.name, '/', course.name, '/', lesson.name].join(''),
                                                            parent: course.id,
                                                            permission: _this.userPermission(loggedInUser, lesson)
                                                        };
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    totalContentCount++;

                                    if (totalContentCount == found.length) {
                                        var data = _this.userPermittedContent(loggedInUser, allContent);
                                        socket.emit('receiveProjectsFromDB', data);
                                    }
                                });
                            }
                        });
                    }

                    if (sendMessage) {
                        var data = _this.userPermittedContent(loggedInUser, allContent);
                        socket.emit('receiveProjectsFromDB', data);
                    }
                });
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

//////////////////////////////////////////////////////////////////////
// Git Functionality
//////////////////////////////////////////////////////////////////////
var Git = {
    _editUser: {
        username: 'cct',
        password: 'cct123'
    },
    _git: {},
    _gitCommit: function (program, user, init, commitMessage, success, error) {
        var path = Content.diskPath(program.path);

        // Make sure path is a git repo.
        if (!init && !fs.existsSync(path + '/.git')) {
            error("The program's folder is not a git repository");
        }
        else {
            var exec = require('child_process').exec;
            var command = 'rm -f .git/index.lock && git add . && git commit -q -a -m "' + commitMessage + '" && git push -f origin master';
            if (init) {
                command = 'git init && ' + command;
            }
            exec(command, {cwd: path}, function (err, stdout, stderr) {
                logger.error('ERR: ' + err);
                logger.error('STDOUT: ' + stdout);
                logger.error('STDERR: ' + stderr);

                var nothingToCommit = stdout && stdout.toLowerCase().indexOf('nothing to commit') > -1;
                var stderrError = stderr && stderr.toLowerCase().indexOf('error:') > -1;

                if (err) {
                    error(err);
                }
                else if (nothingToCommit) {
                    success();
                }
                else if (stderrError) {
                    error(stderr);
                }
                else {
                    success();
                }
            });
        }
    },

    _gitUpdateLocal: function(program, success, error) {
        var path = Content.diskPath(program.path);

        // Make sure path is a git repo.
        if (!fs.existsSync(path + '/.git')) {
            error("The program's folder is not a git repository");
        }
        else {
            var exec = require('child_process').exec;
            var command = 'git fetch --all && git reset --hard origin/master';
            exec(command, {cwd: path}, function (err, stdout, stderr) {
                if (err) {
                    error(err);
                }
                else if (stderr && stderr.toLowerCase().indexOf('error:') > -1) {
                    error(stderr);
                }
                else {
                    logger.info('Local Git Content is up to date.');
                    if (success) success();
                }
            });
        }
    },

    _initRepo: function (program, success, error) {
        // Should already exist on the disk, but will make sure it is added to the server cache.
        // TODO need to get the users for this content, and add them in
        var _this = this;

        var feedback = this._git.createRepo({
            name: program.path,
            anonRead: true,
            users: [
                {user: _this._editUser, permissions: ['R', 'W']}
            ]
        }, function (err) {
            if (err) {
                error(err);
            }
            else {
                _this._cloneRepo(program, success, error);
            }
        });

        if (feedback instanceof String) {
            // Repo already existed, make sure it is cloned
            _this._cloneRepo(program, success, error);
        }
    },

    _cloneRepo: function (program, success, error) {
        var programClonedPath = Content.diskPath(program.path);
        fs.exists(programClonedPath, function (exists) {
            if (!exists) {
                var originPath = path.normalize('../server/repos/' + program.path + '.git');
                var clonePath = Content.diskPath('');
                var exec = require('child_process').exec;
                var command = 'git clone ' + originPath;
                exec(command, {cwd: clonePath}, function (err, stdout, stderr) {
                    if (err) {
                        error(err);
                    }
                    else if (stderr && stderr.toLowerCase().indexOf('error:') > -1) {
                        error(stderr);
                    }
                    else {
                        success();
                    }
                });
            }
            else {
                success();
            }
        });
    },

    startServer: function () {
        var _this = this;
        Program.find().exec(function (err, programs) {
            var programNames = [];

            if (programs) {
                programs.forEach(function (program) {
                    programNames.push({
                        name: program.path,
                        anonRead: true,
                        users: [
                            {user: _this._editUser, permissions: ['R', 'W']}
                        ],
                        onSuccessful: {
                            fetch: function() {
                                return console.log('Successful fetch on ' + program.path + ' repo');
                            },
                            push: function() {
                                console.log('Successful push on ' + program.path + ' repo');
                                _this._gitUpdateLocal(program, null, function(err) {
                                    logger.error(err);
                                });
                            }
                        }
                    });
                });
            }

            _this._git = new GitServer(programNames, true, './repos', Ports.git.port);
        });
    },

    initializeProgramRepo: function (program, success, error) {
        this._initRepo(program, success, error);
    },

    commitProgramContent: function (program, user, success, error) {
        this._gitCommit(program, user, false, 'Program update from Cognizen by ' + user.username, success, error);
    },

    updateLocalContent: function(program, success, error) {
        this._gitUpdateLocal(program, success, error);
    }
};

var SocketHandler = {
    _socket: {},
    init: function (socket) {
        this._socket = socket;
        return this;
    },

    setupFileUploadHandler: function () {
        var uploader = new SocketIOFileUploadServer();
        uploader.dir = config.uploadTempDir;
        uploader.listen(this._socket);

        var _this = this;
        uploader.on('error', function(event) {
            logger.error('Error trying to upload file: ' + event.file + '\n' + event.error);
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
                        var contentType = Content.objectType(type);
                        if (contentType) {
                            contentType.findById(id, function (err, found) {
                                if (found) {

                                    var contentPath = path.normalize(Content.diskPath(found.path) + '/media/' + event.file.name);

                                    //Handle our favorite media types
                                    var favoriteTypes = ["mp4", "swf", "jpg", "png", "html", "gif", "jpeg"];
                                    if (favoriteTypes.indexOf(mediaType.toLowerCase()) >= 0) {
                                        fs.createReadStream(event.file.pathName).pipe(fs.createWriteStream(contentPath));
                                        //Git commit
                                    } else {
                                        //Convert files
                                        var convertedPath;
                                        convertedPath = contentPath.replace(/\.[^/.]+$/, '') + '.mp4'; // Strip the old extension off, and put the mp4 extension on.


                                        var proc = new ffmpeg({ source: event.file.pathName, timeout: 300, priority: 2 })
                                            //.usingPreset('cognizen')
                                            .toFormat('mp4')
                                            .withVideoBitrate('1200k')
                                            .withVideoCodec('libx264')
                                            .withAudioBitrate('160k')
                                            .withAudioCodec('libfaac')
                                            .withAudioChannels(2)
                                            //.addOptions(['-flags', '-strict experimental', '-preset slow', '-maxrate 20000000', '-bufsize 20000000', '-flags2', '+mixed_refs', '-qdiff 4', '-level 13'])
                                            //.addOptions(['-flags', '+loop', '-cmp', '+chroma', '-partitions','+parti4x4+partp8x8+partb8x8', '-flags2',
                                            //'+mixed_refs', '-me_method umh', '-subq 5', '-bufsize 2M', '-rc_eq \'blurCplx^(1-qComp)\'',
                                            //'-qcomp 0.6', '-qmin 10', '-qmax 51', '-qdiff 4', '-level 13' ]);
                                            .onCodecData(function (codecinfo) {
                                                console.log(codecinfo);
                                                _this._socket.emit('mediaInfo', codecinfo);
                                            })
                                            .onProgress(function (progress) {
                                                _this._socket.emit('mediaConversionProgress', progress);
                                            })
                                            .saveToFile(convertedPath, function (stdout, stderr) {
                                                console.log('FFMPEG err: ' + stderr);
                                                console.log('FFMPEG out: ' + stdout);
                                                _this._socket.emit('mediaConversionComplete', convertedPath);
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
        var sessionId = Utils.sessionIdFromSocket(this._socket);
        status.user = Utils.socketUsers[sessionId];
        this._socket.emit('loadDashboardPage', status);
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
                        Utils.socketUsers[Utils.sessionIdFromSocket(_this._socket)] = user;
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
                logger.info(err);
            } else {
                if (user.active == false) {
                    user.active = true;
                    user.markModified("active");
                    user.save(function (err) {
                        if (err) {
                            logger.info("Problem Houston - can't save confirm." + err);
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
                logger.info(err);
            } else {
                user.password = data.pass;
                user.markModified("password");
                user.save(function (err) {
                    if (err) {
                        logger.info("Problem Houston - can't save new password." + err);
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

                Mail.send({
                    user: user.username,
                    subject: "Reset Cognizen Password",
                    txtMsg: user.firstName + ", you can reset your password by navigiating to the below address.  Since you don't have html enabled in your mail client, you will have to copy and paste it into a web browser's url bar and hit the 'Return' key on your keyboard.  " + config.url + "index.html?reset=" + user.username + "&token=" + user.token,
                    msg: user.firstName + ",<br/><br/><p>To reset your password, please click on the link below.</p><p><a href=" + config.url + "index.html?reset=" + user.username + "&token=" + user.token + ">" + config.url + "index.html?reset=" + user.username + "&token=" + user.token + "</a></p>"
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
                logger.info(err);
                if (err) {
                    //if already exists - kick the registration failed
                    _this._socket.emit('registrationFailed');
                } else {
                    _this._socket.emit('registrationSuccess');
                    Mail.send({
                        user: data.user,
                        subject: "Cognizen Registration Confirmation",
                        txtMsg: data.firstName + ", you have been registered with the cognizen web based content framwork but you still must confirm that registration, by navigiating to the below address.  Since you don't have html enabled in your mail client, you may have to copy and paste it into a web browser's url bar and hit the 'Return' key on your keyboard.  " + config.url + "index.html?reset=" + data.user + "&token=" + myToken,
                        msg: data.firstName + ",<br/><br/><p>You have been registered with the cognizen web based content framwork but you still must confirm that registration, by navigiating to the below address.</p><p><a href=" + config.url + "index.html?reset=" + data.user + "&token=" + myToken + ">" + config.url + "index.html?reset=" + data.user + "&token=" + myToken + "</a></p>"
                    });
                }
            });
        });
    },

    getUserList: function () {
        var _this = this;
        User.find().populate('permissions').exec(function (err, users) {
            if (err) {
                logger.info(err);
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
                while (myPath.charAt(0) === '/')
                    myPath = myPath.substr(1);

                Mail.send({
                    user: user.username,
                    subject: "Dowload Link for ",
                    txtMsg: user.firstName + ", your content package can be downloaded by navigiating to the below address.  Since you don't have html enabled in your mail client, you may have to copy and paste it into a web browser's url bar and hit the 'Return' key on your keyboard.  " + config.url + data.path,
                    msg: user.firstName + ",<br/><br/><p>Your content package can be downloaded by clicking on the link below.</p><p><a href=" + config.url + data.path + ">" + config.url + data.path + "</a></p>"
                });
                _this._socket.emit("packageLinkAlert", {
                    path: config.url + data.path
                });
            }
        });
    },

    contentSaved: function(data) {
        var _this = this;

        // First, find user and content.
        var contentType = Content.objectType(data.content.type);

        if (contentType) {
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                    // Get the user associated
                    User.findById(data.user.id).exec(function (err, user) {
                        if (user) {
                            Git.commitProgramContent(found.getProgram(), user, function() {
                                // Success, do nothing.
                            }, function(message) {
                                _this._socket.emit('generalError', {title: 'Repository Saving Error', message: 'Error occurred when saving repository content.'});
                                logger.error("Error when committing to the Git Repo: " + message);
                            });
                        }
                    });
                }
            });
        }
    },

    userPermissionForContent: function(data) {
        var _this = this;
        var emitter = 'contentPermissionFound';
        var foundPermission = 'viewer';
        var contentType = Content.objectType(data.content.type);

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
    },

    _copyProgramFiles: function (program, callback) {
        var baseWritePath = path.normalize(Content.diskPath(program.path) + '/core-prog');
        var root = path.normalize('../core-files');

        FileUtils.rmdir(baseWritePath);

        FileUtils.copyDir(root, baseWritePath, function (path) {
            return (path.endsWith('core-files') || path.contains("css") || path.contains("media") || path.endsWith('index.html'));
        }, function (err) {
            callback(err);
        });
    },

    _copyContentFiles: function (content, callback) {
        var baseWritePath = path.normalize(Content.diskPath(content.path));
        var tokenz = content.path.split("/");
        var programName = tokenz[0];

        var root = path.normalize('../core-files');

        FileUtils.rmdir(baseWritePath);

        FileUtils.copyDir(path.normalize(Content.diskPath(programName) + "/core-prog"), baseWritePath, null, function (err) {
            if (err) callback(err);

            FileUtils.copyDir(root, baseWritePath, function (path) {

                return (path.endsWith('core-files') || path.contains("js") || path.contains("scorm") || path.contains("server") || path.contains("xml") || path.contains("packages"));
            }, function (err) {
                //Set the lesson and course names in the xml.
                //Once xml is copied to new lesson location - 
                //   - import it
                //   - parse it
                //   - set values
                //   - write it to the doc
                var xml = et.XML;
                var ElementTree = et.ElementTree;
                var element = et.Element;
                var subElement = et.SubElement;
                var data, etree;
                var courseName;
                var lessonName;

                fileLink = baseWritePath + "/xml/content.xml";
                data = fs.readFileSync(fileLink).toString();
                etree = et.parse(data);
                etree.find('./courseInfo/preferences/courseTitle').set('value', content.parentName);
                etree.find('./courseInfo/preferences/lessonTitle').set('value', content.name);
                xml = etree.write({'xml_decleration': false});
                fs.outputFile(fileLink, xml, function (err) {
                    //Refresh the index if successfully updating the content.xml
                    if (err == null) {
                        console.log("UPDATED THE COURSE AND LESSON TITLE IN THE XML ----------------------------------------------------------------------------");
                    } else {
                        console.log("Houston, we have a problem - the content.xml update failed ---------------------------------------------------------------");
                    }

                })
                callback(err);
            });
        });
    },

    registerProgram: function (data) {
        var _this = this;
        Program.createUnique(data, function (saved, callbackData) {
            if (saved) {
                Git.initializeProgramRepo(callbackData, function () {
                    _this._copyProgramFiles(callbackData, function () {
                        Git.commitProgramContent(callbackData, data.user, function () {
                            _this._assignContentPermissionAfterCreation(callbackData, 'program', 'admin', function (err) {
                                if (err) {
                                    _this._socket.emit('generalError', {title: 'Program Creation Error', message: 'Error occurred when creating Program repository.'});
                                    logger.error(err);
                                }
                                else {
                                    io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
//                                    Content.allContentForUser(_this._socket, data.user);
                                }
                            });
                        }, function (message) {
                            _this._socket.emit('generalError', {title: 'Program Creation Error', message: 'Error occurred when creating Program repository.'});
                            logger.info("Error when creating Git Repo: " + message);
                        });
                    });
                }, function (message) {
                    _this._socket.emit('generalError', {title: 'Program Creation Error', message: 'Error occurred when creating Program repository.'});
                    logger.info("Error when creating Git Repo: " + message);
                });
            } else {
                _this._socket.emit('generalError', {title: 'Program Exists', message: 'There is already a program named ' + data.name + '. Please choose a different program name or contact the ' + data.name + ' program admin to grant you access to the program.'});
                logger.info('Program already exists with name ' + data.name);
            }
        });
    },

    registerCourse: function (data) {
        var _this = this;
        Course.createUnique(data, function (saved, callbackData) {
            if (saved) {
                // Need to create an empty file so git will keep the course folder
                fs.createFile(path.normalize(Content.diskPath(callbackData.path) + '/.gitkeep'), function (err) {
                    if (err) {
                        logger.error(err);
                        _this._socket.emit('generalError', {title: 'Course Error', message: 'Error occurred when saving course content.'});
                    } else {
                        Git.commitProgramContent(callbackData.fullProgram, data.user, function () {
                            _this._assignContentPermissionAfterCreation(callbackData, 'program', 'admin', function (err) {
                                if (err) {
                                    _this._socket.emit('generalError', {title: 'Course Error', message: 'Error occurred when saving course content.'});
                                    logger.error(err);
                                }
                                else {
                                    io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
//                                    Content.allContentForUser(_this._socket, data.user);
                                }
                            });
                        }, function (message) {
                            _this._socket.emit('generalError', {title: 'Course Error', message: 'Error occurred when saving course content.'});
                            logger.info("Error committing program content: " + message)
                        });
                    }
                });
            }
            else {
                _this._socket.emit('generalError', {title: 'Course or Application Exists', message: 'There is already a course or application in this program that is named ' + data.name + '. Please choose a different course name or contact the program admin to grant you access to the course.'});
                logger.info('Course or application already exists with name ' + data.name);
            }
        });
    },

    registerApplication: function (data) {
        var _this = this;
        Application.createUnique(data, function (saved, callbackData) {
            if (saved) {
                _this._copyContentFiles(callbackData, function (err) {
                    Git.commitProgramContent(callbackData.fullProgram, data.user, function () {
                        _this._assignContentPermissionAfterCreation(callbackData, 'program', 'admin', function (err) {
                            if (err) {
                                _this._socket.emit('generalError', {title: 'Application Error', message: 'Error occurred when saving application content.'});
                                logger.error(err);
                            }
                            else {
                                io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
//                                Content.allContentForUser(_this._socket, data.user);
                            }
                        });
                    }, function (message) {
                        logger.info("Error committing program content: " + message)
                        _this._socket.emit('generalError', {title: 'Application Error', message: 'Error occurred when saving application content.'});
                    });
                });
            } else {
                _this._socket.emit('generalError', {title: 'Application or Course Exists', message: 'There is already an application or course in this program that is named ' + data.name + '. Please choose a different application name or contact the program admin to grant you access to the application.'});
                logger.info('Application or course already exists with name ' + data.name);
            }
        });
    },

    registerLesson: function (data) {
        var _this = this;
        Lesson.createUnique(data, function (saved, callbackData) {
            if (saved) {
                _this._copyContentFiles(callbackData, function () {
                    Git.commitProgramContent(callbackData.fullProgram, data.user, function () {
                        _this._assignContentPermissionAfterCreation(callbackData, 'lesson', 'admin', function (err) {
                            if (err) {
                                _this._socket.emit('generalError', {title: 'Lesson Error', message: 'Error occurred when saving lesson content.'});
                                logger.error(err);
                            }
                            else {
                                io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
//                                Content.allContentForUser(_this._socket, data.user);
                            }
                        });
                    }, function (message) {
                        logger.info("Error committing program content: " + message)
                        _this._socket.emit('generalError', {title: 'Lesson Error', message: 'Error occurred when saving lesson content.'});
                    });
                });
            } else {
                _this._socket.emit('generalError', {title: 'Lesson Exists', message: 'There is already a lesson in this course that is named ' + data.name + '. Please choose a different lesson name or contact the program admin to grant you access to the course.'});
                logger.info('Lesson already exists with name ' + data.name);
            }
        });
    },

    removeContent: function(data) {
        var _this = this;
        // Look up the content by type, and mark the deleted flag.
        // Then, drill down through all its children and children's children, and mark them as well.
        // For now, retain the files on the disk.
        var contentType = Content.objectType(data.type);

        var contentToMarkDeleted = [];

        if (contentType) {
            contentType.findById(data.id, function (err, found) {
                contentToMarkDeleted.push(found);

                // After we have gathered all the items, delete them all.
                _this._markContentDeleted(contentToMarkDeleted, function(err){
                    _this._socket.emit('generalError', {title: 'Content Removal Error', message: 'Error occurred when removing content.'});
                }, function(){
                    io.sockets.emit('refreshDashboard'); // Refresh all clients dashboards, in case they were attached to the content.
//                    Content.allContentForUser(_this._socket, data.user);
                });
            });
        }
    },

    _markContentDeleted: function(content, error, success) {
        var _this = this;
        if (!(content instanceof Array)) {
            content = [content];
        }

        if (content.length > 0) {
            var item = content.pop();
            item.deleted = true;
            item.name = item.name + Content.DELETED_SUFFIX;
            item.save(function(err) {
                if (err) {
                    error(err);
                }
                else {
                    _this._markContentDeleted(content, error, success);
                }
            });
        }
        else {
            success();
        }
    },

    _assignContentPermissionAfterCreation: function (data, contentType, permission, callback) {
        var fullPermission = {
            permission: permission,
            content: {
                type: contentType,
                id: '' + data._id
            },
            user: data.user.username
        };
        this.assignContentToUser(fullPermission, callback);
    },

    assignContentToUser: function (data, callback) {
        logger.info('Assigning ' + data.permission + ' to user ' + data.user + ' for content ' + data.content.id + '.')
        User.findOne({username: data.user}).exec(function (err, foundUser) {
            if (!err && foundUser) {
                var permission = new UserPermission({
                    user: foundUser,
                    contentType: data.content.type,
                    contentId: data.content.id,
                    permission: data.permission
                });

                permission.save(function (err, saved) {
                    if (err) {
                        logger.error(err);
                        if (callback) callback(err);
                    }
                    else {
                        foundUser.permissions.push(saved);
                        foundUser.save(function (err, savedUser) {
                            if (callback) callback(err);
                        });
                    }
                });
            }
            else {
                if (callback) callback(err);
            }
        });

    },


    getContentServerUrl: function (data) {
//        var serverDetails = Content.serverDetails(data.content);
        this._socket.emit('contentServerUrlReceived', {resource: data.content.id})
    },

    startContentServer: function (data) {
        var _this = this;
        var contentType = Content.objectType(data.content.type);

        if (contentType) {
            contentType.findAndPopulate(data.content.id, function (err, found) {
                if (found) {
                    var program = found.getProgram();

                    Git.updateLocalContent(program, function(){
                        var serverDetails = Content.serverDetails(found);

                        if (serverDetails.running) {
                            _this._socket.emit('contentServerStarted', {
                                id: found.id,
                                path: found.path,
                                type: data.content.type
                            });
                        }
                        else {
                            var programPath = path.normalize('../programs/' + found.path + '/server');
                            var parentDir = require('path').resolve(process.cwd(), programPath);

                            var spawn = require('child_process').spawn;
                            var subNode = spawn(process.execPath, ['C_Server.js', serverDetails.port, found.id], {cwd: parentDir});

                            subNodes.push(subNode);

                            subNode.stdout.on('data', function (stdoutdata) {
                                logger.info('stdout: ' + stdoutdata);
                                var message = stdoutdata.toString();
                                if (message.indexOf('C_Server started successfully') > -1) {
                                    _this._socket.emit('contentServerStarted', {
                                        id: found.id,
                                        path: found.path,
                                        type: data.content.type
                                    });
                                    serverDetails.running = true;
                                }
                                else if (!serverDetails.running && message.indexOf("error") > -1) {
                                    _this._socket.emit('contentServerDidNotStart', {message: data});
                                    serverDetails.running = false;
                                }
                            });

                            subNode.stderr.on('data', function (data) {
                                logger.info('stderr: ' + data);
                                _this._socket.emit('contentServerDidNotStart', {message: data});
                                serverDetails.running = false;
                            });
                        }

                    }, function(err) {
                        logger.error(err);
                        _this._socket.emit('contentServerDidNotStart', {message: err});
                    })
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
        var contentType = Content.objectType(comment.content.type);

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
                                    logger.info('Comment created');
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

        ContentComment.findById(comment.id).exec(function (err, found) {
            if (!err && found) {
                comment.status = 'closed';
                comment.save(function (err) {
                    // Send a notice back to the client that it was closed
                    logger.info('Comment closed');
                });
            }
        });
    },

    reopenComment: function (comment) {
        ContentComment.findById(comment.id).exec(function (err, found) {
            comment.status = 'inprogress';

            comment.save(function (err) {
                logger.info('Comment re-opened');
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
        // data.contentId
        var _this = this;
        ContentComment.find(data).populate('user').exec(function (err, found) {
           io.sockets.emit('updateCommentIndex', found); 
        });
    }
};

// This will take care of all the spawned instances of Node, if the main node crashes
var Utils = {
    killSubNodes: function (err) {
        if (err) {
            console.log(err);
            console.log(err.stack);
        }
        console.log('Killing ' + subNodes.length + ' child node.js instance(s).');
        subNodes.forEach(function (worker) {
            process.kill(worker);
        });
        process.exit(0);
    },

    generalError: function(err) {
        if (err) {
            console.log(err);
            console.log(err.stack);
        }
    },

    sessionIdFromSocket: function(socket) {
        return connect.utils.parseSignedCookies(cookie.parse(decodeURIComponent(socket.handshake.headers.cookie)), 'cognizen')['connect.sid'];
    },

    socketUsers: []
};

// Initializing Code
(function () {
    process.on('exit', Utils.killSubNodes);
    process.on("SIGINT", Utils.killSubNodes);
    process.on("uncaughtException", Utils.generalError);
    mongoose.connect(config.dbUrl, {
        user: config.dbUsername,
        pass: config.dbPassword
    },function (err) {
        if (err) throw err;
        logger.info('Successfully connected to ' + config.dbUrl + ' with username ' + config.dbUsername);
    });

    var app = express();
    app.use(express.cookieParser('cognizen'));
    app.use(express.session());
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
    io.set('transports', [
        'websocket',
        'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling'
    ]);
    io.set('polling duration', 600);
    io.configure(function () {
        io.set('close timeout', 60 * 60 * 2);
    });//Set the timeout to two hours - fix for uploading large video files losing connection.
    Content.startProxyServer(function () {
        Git.startServer();

        /*******************************************************************************************
         FIRE UP THE SOCKET SERVER AND SETUP LISTENERS
         *******************************************************************************************/
        io.sockets.on('connection', function (socket) {

//            console.log(Utils.sessionIdFromSocket(socket));

            SocketHandler.init(socket).setupFileUploadHandler();

            socket.on('checkLoginStatus', function() {
                SocketHandler.init(socket).checkLoginStatus();
            });

            socket.on('getProjects', function (data) {
                Content.allContentForUser(socket, data);
            });

            socket.on('attemptLogin', function (data) {
                SocketHandler.init(socket).attemptLogin(data);
            });

            socket.on('confirmUser', function (data) {
                SocketHandler.init(socket).confirmUser(data);
            });

            socket.on('resetPass', function (data) {
                SocketHandler.init(socket).resetPassword(data);
            });

            socket.on('processForgotPass', function (data) {
                SocketHandler.init(socket).processForgotPassword(data);
            });

            socket.on('registerUser', function (data) {
                SocketHandler.init(socket).registerUser(data);
            });

            socket.on('getUserList', function () {
                SocketHandler.init(socket).getUserList();
            });

            socket.on('registerProgram', function (data) {
                SocketHandler.init(socket).registerProgram(data);
            });

            socket.on('registerCourse', function (data) {
                SocketHandler.init(socket).registerCourse(data);
            });

            socket.on('registerApplication', function (data) {
                SocketHandler.init(socket).registerApplication(data);
            });

            socket.on('registerLesson', function (data) {
                SocketHandler.init(socket).registerLesson(data);
            });

            socket.on('removeContent', function (data) {
                SocketHandler.init(socket).removeContent(data);
            });

            socket.on('assignContentToUser', function (data) {
                SocketHandler.init(socket).assignContentToUser(data, function(err) {
                    if (err) {
                        socket.emit('generalError', {title: 'Permissions Error', message: 'Error occurred when assigning content.'});
                    }
                    else {
                        io.sockets.emit('refreshDashboard');
                    }
                });
            });

            socket.on('getContentServerUrl', function (data) {
                SocketHandler.init(socket).getContentServerUrl(data);
            });

            socket.on('startContentServer', function (data) {
                SocketHandler.init(socket).startContentServer(data);
            });

            socket.on('addComment', function (data) {
                SocketHandler.init(socket).addComment(data);
            });

            socket.on('closeComment', function (data) {
                SocketHandler.init(socket).closeComment(data);
            });

            socket.on('getContentComments', function (data) {
                SocketHandler.init(socket).getContentComments(data);
            });

            socket.on('getCourseCommentPages', function (data) {
                SocketHandler.init(socket).getCourseCommentPages(data);
            });

            socket.on('sendPackageMail', function (data) {
                SocketHandler.init(socket).sendPackageMail(data);
            });

            socket.on('contentSaved', function (data) {
                SocketHandler.init(socket).contentSaved(data);
            });

            socket.on('userPermissionForContent', function (data) {
                SocketHandler.init(socket).userPermissionForContent(data);
            });

        });
    });
})();
