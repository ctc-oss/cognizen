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
        // this.promisedAPI.getProjects()
        //     .then(function(data){
        //         var found = false;
        //         var _projects = data.projects;
        //         for (var i = 0; i < _projects.length; i++) {
        //             console.log(_projects[i]);
        //         };
        //     },
        //     function(err) {
        //         console.log("Error: " + err.message);
        //     }
        // );  
        //    this.promisedAPI.getIssues({project_id: 20})
        //     .then(function(data){
        //         console.log("Issues:");
        //         console.log(data);
        //         console.log(data.issues[0].project);
        //         console.log(data.issues[0].status);
        //         console.log(data.issues[0].custom_fields);
        //     },
        //     function(err) {
        //         console.log("Error: " + err.message);
        //         return;
        //     }
        // ); 
        // this.promisedAPI.get('issue_statuses')
        //     .then(function(data){
        //         console.log("custom fields:");
        //         console.log(data);
        //     },
        //     function(err) {
        //         console.log("Error: " + err.message);
        //         return;
        //     }
        // );
        // var issue = {
        //     project_id: 6,
        //     subject: "Fix the pageEE",
        //     description: "More stuff",
        //     custom_fields:
        //         [
        //             {value: "blah", id: 2},
        //             {value: "blahid", id: 3}
        //         ]
        // }            
        // this.promisedAPI.postIssue(issue)
        //     .error(function(err){
        //         console.log("Error: " + err.message);
        //     })

        //     .success(function(data){
        //         console.log(data)
        //     })
        // ; 
        // var comment = {
        //     subject: "Here is the subject.",
        //     text: "This stuff isn't right",
        //     page:{
        //         id: "ojwmf209mmmspomdos23"
        //     }
        // };
        // this.createIssue("Cognizen - Page", comment, "page Title test", function(err){
        //     if(err){
        //         _this.logger.error("Error creating redmine issue: " + err);
        //     }
        //     else{
        //         _this.logger.info(" issue created in redmine");
        //     }
        // }); 
        // var page = {
        //     lessontitle: "101 GlovesW",
        //     id: "3d4aeb42-7bb7-5b90-e375-b47c098175b3"
        // }; 
        // this.getIssueByPageId(page, function(data, err){
        //     if(err){
        //         console.log("Error finding issues: " + err);
        //     }
        //     else{
        //         console.log(" issues found");
        //         console.log(data);
        //     }
        // });
        // var issue = {
        //     id: 6,
        //     project_id: 6,
        //     //subject: "Fix the pageEEXXX"
        //     description: "More stuff for tommy t"
        // };
        // this.updateIssue(issue, function(err){
        //     if(err){
        //         console.log("error: " + err);
        //     }
        //     else{
        //         console.log("issue updated");
        //     }
        // }) ;         
        // this.promisedAPI.updateIssue(6, issue)
        //     .error(function(err){
        //         callback(err);
        //     })
        //     .success(function(data){
        //         console("done good");
        //         console(data)
        //     })
        // ;                         	
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
	createProject: function(Name, callback){
		var _this = this;
		var project = {
            name: Name,
            identifier: "rm" + Name.toLowerCase().replace(/ /g,'')
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
        _this._findProjectId(Project.name, function(data, err){
            if(err){
                console.log("Error " + err);
                callback(err);
            }
            else{
                var project = {
                    name: Name,
                    identifier: "rm" + Name.toLowerCase().replace(/ /g,''),
                    parent_id: data.id,
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
    createLesson: function(Name, Course, callback){
        var _this = this;
        _this._findProjectId(Course.name, function(data, err){
            if(err){
                console.log("Error " + err);
                callback(err);
            }
            else{
                var project = {
                    name: Name,
                    identifier: "rm" +Name.toLowerCase().replace(/ /g,''),
                    parent_id: data.id,
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
    updateProjectName: function(Original, New, callback){
        var _this = this;
        _this._findProjectId(Original, function(data, err){
            if(err){
                console.log("Error " + err);
                callback(err);
            }
            else{
                var project = {
                    name: New,
                    identifier: data.identifier,
                };
                _this.promisedAPI.put("projects/"+data.id, {project: project})
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
    createIssue: function(Comment, callback){
        var _this = this;
        //find project id
        _this._findProjectId(Comment.lessontitle, function(data, err){
            if(err){
                console.log("Error " + err);
                callback(err);
            }
            else{
                var _projectId = data.id;
                _this._findCustomFieldId("Page Title", function(data, err){
                    if(err){
                        console.log("Error " + err);
                        callback(null, err);
                    }
                    else{
                        var _pageTitleId = data.id;
                        _this._findCustomFieldId("Page Id", function(data, err){
                            if(err){
                                console.log("Error " + err);
                                callback(null, err);
                            }
                            else{
                                var _pageIdId = data.id;
                                var issue = {
                                    project_id: _projectId,
                                    subject: Comment.subject,
                                    description: Comment.text,
                                    custom_fields:
                                        [
                                            {value: Comment.page.title, id: _pageTitleId},
                                            {value: Comment.page.id, id: _pageIdId}
                                        ],
                                    status_id: Comment.status    
                                };            
                                _this.promisedAPI.postIssue(issue)
                                    .error(function(err){
                                        console.log("Error: " + err.message);
                                        callback(err);
                                    })

                                    .success(function(data){
                                        //console.log(data)
                                        callback();
                                    })
                                ; 
                            }
                        }); 
                    }
                });                                              
            }
        });          
    },
    getIssuesByPageId: function(Page, callback){
        var _this = this;
        _this._findProjectId(Page.lessontitle, function(data, err){
            if(err){
                console.log("Error " + err);
                callback(null, err);
            }
            else{
                var _projectId = data.id;
                _this._findCustomFieldId("Page Id", function(data, err){
                    if(err){
                        console.log("Error " + err);
                        callback(null, err);
                    }
                    else{
                        var _customFilter = "cf_" + data.id;
                        var _params = {project_id: _projectId};
                        _params[_customFilter] = Page.id;
                        _this.promisedAPI.getIssues(_params)
                            .error(function(err){
                                console.log("Error: " + err.message);
                                callback(null, err);
                            })
                            .success(function(data){
                                callback(data, null);
                            })
                        ;                                              
                    }
                });                

            }
        });
    },
    updateIssue: function(Issue, callback){
       var _this = this;
       
        _this.promisedAPI.updateIssue(Issue.id, Issue)
            .error(function(err){
                callback(err);
            })
            .success(function(data){
                callback();
            })
        ;  
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
    _findProjectId: function(Project, callback){
        var _this = this;
        
        _this.promisedAPI.getProjects()
            .then(function(data){
                var found = false;
                var _projects = data.projects;
                for (var i = 0; i < _projects.length; i++) {
                    if(_projects[i].name === Project){
                        found = true;
                        callback(_projects[i], null);
                    }
                };
                if(!found){
                    callback(null, "No project was found with the " + Project + " name!" );
                }
            },
            function(err) {
                console.log("Error: " + err.message);
                callback(null, "Error: " + err.message);
            }
        );          
    },
    _findCustomFieldId: function(Name, callback){
        var _this = this;

        _this.promisedAPI.get('custom_fields')
            .then(function(data){
                var found = false;
                var _customFields = data.custom_fields;
                for (var i = 0; i < _customFields.length; i++) {
                    if(_customFields[i].name === Name){
                        found = true;
                        callback(_customFields[i], null);
                    }
                };
                if(!found){
                    callback(null, "No custom_field was found with the " + Name + " name!" );
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