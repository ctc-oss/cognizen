var promised = require('promised-redmine');

var REDMINE = {
	logger: {},
	promisedAPI: {},
	init: function(logger, Host, ApiKey, Protocol){
		this.logger = logger;

        var config = {
            host: Host,
            apiKey: ApiKey,
            protocol: Protocol
        };
        this.promisedAPI = new promised(config);
        console.log("In cognizen-redmine");
        console.log(config);
        // this.promisedAPI.getUserCurrent()
        //     .then(function(data){
        //         console.log("Current user:");
        //         console.log(data);
        //     },
        //     function(err) {
        //         console.log("Error: " + err.message);
        //         return;
        //     }
        // ); 
        // this.promisedAPI.getUsers()
        //     .then(function(data){
        //         console.log(data);
        //         console.log(data.total_count);
        //         console.log(data.users);
        //         console.log(data.users.length);
        //     },
        //     function(err) {
        //         console.log("Error: " + err.message);
        //         return;
        //     }
        // );   
  //      var user = {
		// 	login: "shuie28@gmail.com", 
		// 	firstname: "Luke",
		//  	lastname: "Shumaker",
		//  	mail: "shuie28@gmail.com",
		//  	password: "test8888"
		// };

		// this.promisedAPI.put("users/5",{user:user})
		// 	.error(function(err){
		// 		callback(err);
		// 	})
		// 	.success(function(data){
		// 		_this.logger.info(data)
		// 	})
		// ;  
        this.promisedAPI.getProjects()
            .then(function(data){
                var found = false;
                var _projects = data.projects;
                for (var i = 0; i < _projects.length; i++) {
                    console.log(_projects[i]);
                };
            },
            function(err) {
                console.log("Error: " + err.message);
            }
        );                        	
        return this;
	},
	createUser: function(Username, FirstName, LastName, _Password, callback){
		var _this = this;

		var user = {
			login: Username, 
			firstname: FirstName,
		 	lastname: LastName,
		 	mail: Username,
		 	password: _Password
		};

		_this.promisedAPI.post("users",{user:user})
			.error(function(err){
				callback(err);
			})
			.success(function(data){
				_this.logger.info(data)
			})
		;
	},
	updateUserPassword: function(Username, _Password, callback){
		var _this = this;

		_this._findUserId(Username, function(data, err){
			if(err){
				console.log("Error " + err);
				callback(err);
			}
			else{
				data.password = _Password;
				_this.promisedAPI.put("users/"+data.id,{user:data})
					.error(function(err){
						callback(err);
					})
					.success(function(data){
						_this.logger.info("Redmine user password updated successfully " + data)
					})
				;
			}
		});


	},
	_findUserId: function(Username, callback){
		var _this = this;

        _this.promisedAPI.getUsers()
            .then(function(data){
                var found = false;
                var _users = data.users;
                for (var i = 0; i < _users.length; i++) {
                	if(_users[i].login === Username){
                		found = true;
                		callback(_users[i], null);
                	}
                };
                if(!found){
                	callback(null, "No user was found with the " + Username + " username!" );
                }
            },
            function(err) {
                console.log("Error: " + err.message);
                callback(null, "Error: " + err.message);
            }
        );  
	},
	createProject: function(Name, callback){
		var _this = this;
		var project = {
            name: Name,
            identifier: Name
        };
		_this.promisedAPI.post("projects", {project: project})
			.error(function(err){
				callback(err);
			})
			.success(function(data){
				_this.logger.info(data)
			})
		;        
	},
    createCourse: function(Name, Project, callback){
        var _this = this;
        console.log("inside createCourse");
        _this._findProjectId(Project, function(data, err){
            if(err){
                console.log("Error " + err);
                callback(err);
            }
            else{
                var project = {
                    name: Name,
                    identifier: Name,
                    parent_id: data.identifier,
                    inherit_members: true
                };
                _this.promisedAPI.post("projects", {project: project})
                    .error(function(err){
                        callback(err);
                    })
                    .success(function(data){
                        _this.logger.info(data)
                    })
                ;                                 
            }
        });

        
    },
    _findProjectId: function(Project, callback){
        var _this = this;
        console.log("_findProjectId Name " + Project.name);
        _this.promisedAPI.getProjects()
            .then(function(data){
                var found = false;
                var _projects = data.projects;
                for (var i = 0; i < _projects.length; i++) {
                    if(_projects[i].name === Project.name){
                        found = true;
                        callback(_projects[i], null);
                    }
                };
                if(!found){
                    callback(null, "No project was found with the " + Name + " name!" );
                }
            },
            function(err) {
                console.log("Error: " + err.message);
                callback(null, "Error: " + err.message);
            }
        );          
    }

};

module.exports = REDMINE;

        // var project = {
        //     name: "test2",
        //     identifier: "test2"
        // };

        // var issue = {
        //     project_id: 1,
        //     subject: "Test issue",
        //     description: "More stuff"
        // }

        // redmineApi.post("projects", {project: project})
        // //redmineApi.post("issues", issue)
        // //redmineApi.postIssue(issue)
        //     .error(function(err){
        //         console.log("Error: " + err.message);
        //     })

        //     .success(function(data){
        //         console.log(data)
        //     })
        // ;

        // redmineApi.getIssues({project_id: 1})
        //     .then(function(data){
        //         console.log("Issues:");
        //         console.log(data);
        //     },
        //     function(err) {
        //         console.log("Error: " + err.message);
        //         return;
        //     }
        // );
        // // redmineApi.getIssues().success(function(issues){
        // //     console.log("ISSUES  " + issues);
        // // });