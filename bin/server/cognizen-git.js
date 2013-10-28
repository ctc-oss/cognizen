var GitServer = require('git-server');
var Utils = require('./cognizen-utils');
var fs = require('fs-extra');
var path = require('path');
var Program = require('./content-model').Program;

var Git = {
    logger: {},
    Ports: {},
    Content: {},
    Program: {},
    init: function(logger, Ports, Content) {
        this.Ports = Ports;
        this.logger = logger;
        this.Content = Content;
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

    _gitCommit: function (program, user, init, commitMessage, success, error) {
        var _this = this;
        var path = _this.Content.diskPath(program.path);

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

            commands.push(Utils.rmCommand() + ' ' + this.indexLockFile());
            commands.push('git add -A .');
            commands.push('git commit -q -a -m "' + commitMessage + '"');
            commands.push('git push -f origin master');

            var command = commands.join(Utils.chainCommands());

            _this.logger.info('Git Commit: ' + command);
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
            });
        }
    },

    _gitUpdateLocal: function(program, success, error) {
        var _this = this;
        var path = _this.Content.diskPath(program.path);

        // Make sure path is a git repo.
        if (!fs.existsSync(path + '/.git')) {
            error("The program's folder is not a git repository");
        }
        else {
            var exec = require('child_process').exec;

            var commands = [];
            commands.push(Utils.rmCommand() + ' ' + this.indexLockFile());
            commands.push('git add .');
            commands.push('git fetch --all');
            commands.push('git reset --hard origin/master');

            var command = commands.join(Utils.chainCommands());
            _this.logger.info('Git Update: ' + command);

            exec(command, {cwd: path}, function (err, stdout, stderr) {
                if (stdout) _this.logger.info('Git-STDOUT: ' + stdout);
                if (stderr) _this.logger.error('Git-STDERR: ' + stderr);

                if (err) {
                    _this.logger.error('Git-ERR: ' + err);
                    error(err);
                }
                else if (stderr && stderr.toLowerCase().indexOf('error:') > -1) {
                    error(stderr);
                }
                else {
                    _this.logger.info('Local Git Content is up to date.');
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

    updateLocalContent: function(program, success, error) {
        this._gitUpdateLocal(program, success, error);
    }
};

module.exports = Git;