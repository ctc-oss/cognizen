var GitServer = require('git-server'),
    Utils = require('./cognizen-utils'),
    fs = require('fs-extra'),
    path = require('path'),
    Program = require('./content-model').Program;
var Padlock = require("padlock").Padlock;

var Git = {
    logger: {},
    Ports: {},
    Content: {},
    Program: {},
    lock: {},
    init: function(logger, Ports, Content) {
        this.Ports = Ports;
        this.logger = logger;
        this.Content = Content;
        this.lock = new Padlock();
        return this;
    },

    _editUser: {
        username: 'cct',
        password: 'cct123'
    },

    _git: {},

    indexLockFile: function() {
        return Utils.isWindows() ? '.git\\index.lock' : '.git/index.lock';
    },

    indexFile: function() {
        return Utils.isWindows() ? '.git\\index' : '.git/index';
    },

    _gitCommit: function (program, user, init, commitMessage, success, error) {
        var _this = this;
        var path = _this.Content.diskPath(program.path);
        //_this.logger.info("program " + program + " user " + user);
        // Make sure path is a git repo.
        if (!init && !fs.existsSync(path + '/.git')) {
            error("The program's folder is not a git repository");
        }
        else {

                var exec = require('child_process').exec;

                var commands = [];
                if (init) {
                    commands.push('git init');
                }

                commands.push(Utils.rmCommand() + ' ' + _this.indexLockFile());
                commands.push('git add -A .');
                commands.push('git commit -q -a -m "' + commitMessage + '"');
                commands.push('git push -f origin master');

                var command = commands.join(Utils.chainCommands());

                _this.logger.info('Git Commit: ' + command);
             _this.logger.info("before runwithlock _gitCommit");
            _this.lock.runwithlock(function () {
            _this.logger.info("Runwithlock start _gitCommit"); 
                exec(command, {cwd: path}, function (err, stdout, stderr) {
                   
                    if (stdout) _this.logger.error('STDOUT: ' + stdout);
                    if (stderr) _this.logger.error('STDERR: ' + stderr);

                    var nothingToCommit = stdout && stdout.toLowerCase().indexOf('nothing to commit') > -1;
                    var stderrError = stderr && stderr.toLowerCase().indexOf('error:') > -1;

                    if (nothingToCommit) {
                        success();
                    }
                    else if (err) {
                        _this.logger.error('ERR: ' + err);
                        error(err);
                    }
                    else if (stderrError) {
                        error(stderr);
                    }
                    else {
                        success();
                    }
                _this.logger.info("Before release _gitCommit");                
                _this.lock.release();
                _this.logger.info("after release _gitCommit");
            });                    
                });

        }
    },

    _gitUpdateLocal: function(program, callback) {
        var _this = this;
        var path = _this.Content.diskPath(program.path);

        // Make sure path is a git repo.
        if (!fs.existsSync(path + '/.git')) {
            callback("The program's folder is not a git repository");
        }
        else {

                var exec = require('child_process').exec;

                var commands = [];
                commands.push('echo 1');
                commands.push(Utils.rmCommand() + ' ' + _this.indexLockFile());
                commands.push('echo 2');
                commands.push('git add . 2>&1');
                commands.push('echo 3');
                commands.push('git fetch --all 2>&1');
                commands.push('echo 4');
                commands.push('git reset --hard origin/master 2>&1');
                commands.push('echo 5');

                var command = commands.join(Utils.chainCommands());
                _this.logger.info('Git Update: ' + command);
            _this.logger.info("before runwithlock _gitUpdateLocal");
            _this.lock.runwithlock(function () {
            _this.logger.info("Runwithlock start _gitUpdateLocal"); 
                exec(command, {cwd: path}, function (err, stdout, stderr) {
                   
                    if (stdout) _this.logger.info('Git-STDOUT: ' + stdout);
                    if (stderr) _this.logger.error('Git-STDERR: ' + stderr);

                    if (err) {
                        _this.logger.error('Git-ERR: ' + err);
                        callback(err);
                    }
                    else if (stderr && stderr.toLowerCase().indexOf('error:') > -1) {
                        callback(stderr);
                    }
                    else {
                        _this.logger.info('Local Git Content is up to date.');
                        callback();
                    }
                _this.logger.info("Before release _gitUpdateLocal");                
                _this.lock.release();
                _this.logger.info("after release _gitUpdateLocal");
            });                      
                });
          
        }
    },

    _initRepo: function (program, success, error) {
        // Should already exist on the disk, but will make sure it is added to the server cache.
        // TODO need to get the users for this content, and add them in
        var _this = this;

        var feedback = this._git.createRepo({
            name: program.getRepoName(),
            anonRead: false,
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
        var _this = this;
        var programClonedPath = _this.Content.diskPath(program.path);
        fs.exists(programClonedPath, function (exists) {
            if (!exists) {
                var originPath = path.normalize('../server/repos/' + program.getRepoName() + '.git');
                var clonePath = _this.Content.diskPath('');
                var exec = require('child_process').exec;
                var command = 'git clone ' + originPath + ' "' + program.name + '"';
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
                    if (!program.deleted) {
                        console.log('Starting GIT Server with program ' + program.name);
                        programNames.push({
                            name: program.path,
                            anonRead: true,
                            users: [
                                {user: _this._editUser, permissions: ['R', 'W']}
                            ],
                            onSuccessful: {
                                fetch: function() {
                                    return _this.logger.info('Successful fetch on ' + program.path + ' repo');
                                },
                                push: function() {
                                    _this.logger.info('Successful push on ' + program.path + ' repo');
//                                    _this._gitUpdateLocal(program, null, function(err) {
//                                        _this.logger.error(err);
//                                    });
                                }
                            }
                        });
                    }
                });
            }

            _this._git = new GitServer(programNames, true, './repos', _this.Ports.git.port);
        });
    },

    initializeProgramRepo: function (program, success, error) {
        this._initRepo(program, success, error);
    },

    commitProgramContent: function (program, user, success, error) {
        this._gitCommit(program, user, false, 'Program update from Cognizen by ' + user.username, success, error);
    },

    updateLocalContent: function(program, callback) {
        this._gitUpdateLocal(program, callback);
    },

    fixSmallIndexIssue: function(program, callback) {
        var _this = this;
        var path = _this.Content.diskPath(program.path);

        // Make sure path is a git repo.
        if (!fs.existsSync(path + '/.git')) {
            callback("The program's folder is not a git repository");
        }
        else {

                var exec = require('child_process').exec;

                var commands = [];
                commands.push(Utils.rmCommand() + ' ' + _this.indexFile());
                commands.push('git add .');

                var command = commands.join(Utils.chainCommands());
                _this.logger.info('Git Fix Small Index File: ' + command);
            _this.logger.info("before runwithlock fixSmallIndexIssue");
            _this.lock.runwithlock(function () {
            _this.logger.info("Start runwithlock fixSmallIndexIssue");   
                exec(command, {cwd: path}, function (err, stdout, stderr) {
                 
                    if (stdout) _this.logger.info('Git-STDOUT: ' + stdout);
                    if (stderr) _this.logger.error('Git-STDERR: ' + stderr);

                    if (err) {
                        _this.logger.error('Git-ERR: ' + err);
                        callback(err);
                    }
                    else if (stderr && stderr.toLowerCase().indexOf('error:') > -1) {
                        callback(stderr);
                    }
                    else {
                        _this.logger.info('Index file removed and content readded');
                        callback();
                    }
                _this.logger.info("Before release fixSmallIndexIssue");
                _this.lock.release();
                _this.logger.info("after release in fixSmallIndexIssue");
            });                     
                });
           
        }
    }
};

module.exports = Git;