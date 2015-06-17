var promised = require('promised-redmine');
var Utils = require('./cognizen-utils');

var REDMINE = {
	logger: {},
	promisedAPI: {},
	init: function(logger, Host, ApiKey, Protocol){
		this.logger = logger;

        var config = {
            host: Host,
            apiKey: ApiKey,
            protocol: Protocol//,
            //sslCaCert: 'C:\\TEMP\\server.13.redmine.pem'
        };
        this.promisedAPI = new promised(config);
        // console.log("In cognizen-redmine");
        // console.log(config);
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

        return this;
	},
	createUser: function(Username, FirstName, LastName, _Password, MustChange, callback){
		var _this = this;

		var user = {
			login: Username, 
			firstname: FirstName,
		 	lastname: LastName,
		 	mail: Username,
		 	password: _Password,
            must_change_passwd: MustChange
		};

		_this.promisedAPI.post("users",{user:user})
			.error(function(err){
				callback(err);
			})
			.success(function(data){
                _this.logger.info('Redmine user was created : ');
                _this.logger.info(data);
                callback();
			})
		;
	},
	updateUserPassword: function(Username, _Password, callback){
		var _this = this;

		_this._findUserId(Username, function(data, err){
			if(err){
				_this.logger.error("Error " + err);
				callback(err);
			}
			else{
				data.password = _Password;
				_this.promisedAPI.put("users/"+data.id,{user:data})
					.error(function(err){
						callback(err);
					})
					.success(function(data){
						_this.logger.info("Redmine user password updated successfully :");
                        _this.logger.info(data);
                        callback();
					})
				;
			}
		});
	},
	createProject: function(Name, id, callback){
		var _this = this;
		var project = {
            name: Name,
            identifier: "rm" + id,
            is_public: false
        };
		_this.promisedAPI.post("projects", {project: project})
			.error(function(err){
				callback(err);
			})
			.success(function(data){
				_this.logger.info(data)
                //#3735
                _this._addCognizenAdmins(id, function(err){
                    if(err){
                        callback(err);
                    }
                    else{
                        callback();
                    }
                }); 
			})
		;        
	},
    createCourse: function(Name, id, ProjectId, callback){
        var _this = this;
        //finds the id of the parent project
        _this.findProjectId(ProjectId, function(data, err){
            if(err){
                _this.logger.error("Error " + err);
                callback(err);
            }
            else{
                var project = {
                    name: Name,
                    identifier: "rm" + id,
                    parent_id: data.id,
                    inherit_members: false,
                    is_public: false
                };
                _this.promisedAPI.post("projects", {project: project})
                    .error(function(err){
                        callback(err);
                    })
                    .success(function(data){
                        _this.logger.info(data);
                        //#3735
                        _this._addCognizenAdmins(id, function(err){
                            if(err){
                                callback(err);
                            }
                            else{
                                callback();
                            }
                        });                        
                    })
                ;                                 
            }
        });        
    },
    createLesson: function(Name, id, Course, callback){
        var _this = this;

        _this.findProjectId(Course.id, function(data, err){
            if(err){
                _this.logger.error("Error " + err);
                callback(err);
            }
            else{
                var project = {
                    name: Name,
                    identifier: "rm" + id,
                    parent_id: data.id,
                    inherit_members: false,
                    is_public: false
                };
                _this.promisedAPI.post("projects", {project: project})
                    .error(function(err){
                        callback(err);
                    })
                    .success(function(data){
                        _this.logger.info(data);
                        //#3735
                        _this._addCognizenAdmins(id, function(err){
                            if(err){
                                callback(err);
                            }
                            else{
                                callback();
                            }
                        }); 
                    })
                ;                                 
            }
        });        
    },
    updateProjectName: function(Original, id, New, callback){
        var _this = this;

        _this.findProjectId(id, function(data, err){            
            if(err){
                _this.logger.error("Error " + err);
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
                        _this.logger.info(data);
                        callback();
                    })
                ;                                 
            }
        });    
    },
    createIssue: function(Comment, callback){
        var _this = this;
        //find project id
        _this.findProjectId(Comment.lessonid, function(data, err){  
            if(err){
                _this.logger.error("Error " + err);
                callback(err);
            }
            else{
                var _projectId = data.id;
                _this._findCustomFieldId("Page Title", function(data, err){
                    if(err){
                        _this.logger.error("Error " + err);
                        callback(null, err);
                    }
                    else{
                        var _pageTitleId = data.id;
                        _this._findCustomFieldId("Page Id", function(data, err){
                            if(err){
                                _this.logger.error("Error " + err);
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
                                    status_id: Comment.status,
                                    assigned_to_id: Comment.assigned_to_id   
                                }; 
                                var params = {impersonate: Comment.user.username};           
                                _this.promisedAPI.postIssue(issue, params)
                                    .error(function(err){
                                        _this.logger.error("Error: " + err.message);
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
        _this.findProjectId(Page.lessonid, function(data, err){             
            if(err){
                _this.logger.error("Error " + err);
                callback(null, err);
            }
            else{
                var _projectId = data.id;
                _this._findCustomFieldId("Page Id", function(data, err){
                    if(err){
                        _this.logger.error("Error " + err);
                        callback(null, err);
                    }
                    else{
                        var _customFilter = "cf_" + data.id;
                        var _params = {project_id: _projectId};
                        _params[_customFilter] = Page.id;
                        _this.promisedAPI.getIssues(_params)
                            .error(function(err){
                                _this.logger.error("Error: " + err.message);
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
    getIssuesByLessonId: function(Lesson, callback){
        var _this = this;
        _this.findProjectId(Lesson.id, function(data, err){ 
            if(err){
                _this.logger.error("Error " + err);
                callback(null, err);
            }
            else{
                var _projectId = data.id;
                var _params = {project_id: _projectId};
                _this.promisedAPI.getIssues(_params)
                    .error(function(err){
                        _this.logger.error("Error: " + err.message);
                        callback(null, err);
                    })
                    .success(function(data){
                        callback(data, null);
                    })
                ;                                              
              

            }
        });
    },
    updateIssue: function(Issue, username, callback){
       var _this = this;
       var params = {impersonate: username};  
        _this.promisedAPI.updateIssue(Issue.id, Issue, params)
            .error(function(err){
                callback(err);
            })
            .success(function(data){
                callback();
            })
        ;  
    },
    getIssueJournal: function(IssueId, callback){
        var _this = this;

       _this.promisedAPI.request('GET', '/issues/'+IssueId+'.json', {include: 'journals'})
            .then(function(data){

                callback(data.issue.journals, null);

            },
            function(err) {
                _this.logger.error("Error: " + err.message);
                callback(null, err);
            }
        ); 

    },
    updateProjectMembership: function(Permissions, callback){
        var _this = this;

        _this.getProjectMembership(Permissions.content.id, function(data, projId, err){
            if(err){
                _this.logger.error("Error getting project membership " + err);
                callback(err);
            }
            else{
                var _membership_arr = data.memberships;

                if(Permissions.users[0].username != undefined){
                    _this._assignMembership(projId, _membership_arr, Permissions.users, 0, function(err){
                        if(err){
                            callback(err);
                        }
                        else{
                            callback();
                        }
                    });                    
                }
                                         
            }
        });
      
    },
    getProjectMembership: function(id, callback){
        var _this = this;
        //console.log('^^^^^^ ' + Project + ' : ' + ProjectParent);
        //console.log(id);
        _this.findProjectId(id, function(data, err){
            if(err){
                _this.logger.error("Error " + err);
                callback(null, null, err);
            }
            else{
                var _projectId = data.id;
                _this.promisedAPI.get('/projects/'+_projectId+'/memberships', {})
                    .then(function(data){
                        callback(data, _projectId, null);
                    },
                    function(err) {
                        _this.logger.error("Error in _getProjectMembership: " + err.message);
                        callback(null, null, err);
                    }
                );  
            }
        });      
    },   
    findProjectId: function(ProjectId, callback){
        var _this = this;

        _this.promisedAPI.get('/projects/rm'+ProjectId, {})
            .then(function(data){
                callback(data.project);
            },
            function(err) {
                //_this.logger.error("Error: " + err.message);
                callback(null, "Error: " + err.message);
            }
        );          
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
                    callback("404", "No user was found with the " + Username + " username!" );
                }
            },
            function(err) {
                _this.logger.error("Error: " + err.message);
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
                _this.logger.error("Error: " + err.message);
                callback(null, "Error: " + err.message);
            }
        );
    },
    _findRoleId: function(Name, callback){
        var _this = this;

        _this.promisedAPI.get('roles', {})
            .then(function(data){
                var found = false;
                for (var i = 0; i < data.roles.length; i++) { 
                    if(data.roles[i].name === Name){
                        found = true;
                        callback(data.roles[i], null);
                    }                   
                };
                if(!found){
                    callback(null, "No role with the name of "+ Name+ " was found!");
                }
            },
            function(err) {
                _this.logger.error("Error: " + err.message);
                callback(null, "Error: " + err.message);
            }
        );        
    },
    _addCognizenAdmins: function(ProjectIdentifier, callback){
        var _this = this;
        //console.log('_addCognizenAdmins ' + ProjectIdentifier);
        _this._findGroupId('Cognizen Admins', function(data, err){
            if(err){
                _this.logger.error("Error " + err);
                callback(err);
            }
            else{
                var _groupId = data.id;
                //console.log('_groupId ' + _groupId);
                _this._getGroupUsers(_groupId, function(data, err){
                    if(err){
                        _this.logger.error("Error " + err);
                        callback(err);
                    }
                    else{
                        var _users = data;
                        //console.log('_users ' + _users);
                        _this.getProjectMembership(ProjectIdentifier, function(data, projId, err){
                            if(err){
                                _this.logger.error("Error getting project membership " + err);
                                callback(err);
                            }
                            else{
                                var _membership_arr = data.memberships;
                                //console.log(_membership_arr);
                                _this._assignGroupMembership(_users, _membership_arr, projId, 0, function(err){
                                    if(err){
                                        callback(err);
                                    }
                                    else{
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
    _assignGroupMembership: function(Users, Membership_arr, ProjectId, Index, callback){
        var _this = this;

        if(Index < Users.length){
            var _userId = Users[Index].id;
            var _membershipId = _this._getMembershipId(Membership_arr, _userId);
            _this._setMembership(_membershipId, ProjectId, _userId, 'admin', function(data, err){
                if(err){
                    _this.logger.error("Error in setMembership " + err);
                    callback(err);
                }
                else{
                    _this._assignGroupMembership(Users, Membership_arr, ProjectId, Index+1, function(err){
                        if(err){
                            callback(err);
                        }
                        else{
                            callback();
                        }
                    }); 
                }
            }); 

        }
        else{
            callback();
        }
    },
    _findGroupId: function(Name, callback){
        var _this = this;

        _this.promisedAPI.get('groups')
            .then(function(data){
                var found = false;
                var _groups = data.groups;
                for (var i = 0; i < _groups.length; i++) {
                    if(_groups[i].name === Name){
                        found = true;
                        callback(_groups[i], null);
                    }
                };
                if(!found){
                    callback(null, "No group was found with the " + Name + " name!" );
                }                
            },
            function(err) {
                _this.logger.error("Error: " + err.message);
                callback(null, "Error: " + err.message);
            }
        );  
    },
    _getGroupUsers: function(GroupId, callback){
        var _this = this;

       _this.promisedAPI.request('GET', '/groups/'+GroupId+'.json', {include: 'users'})
            .then(function(data){
                callback(data.group.users, null);
            },
            function(err) {
                _this.logger.error("Error in _getGroupUsers: " + err.message);
                callback(null, err);
            }
        ); 

    },
    _assignMembership: function(ProjectId, Membership_arr, Users, Index, callback){
        var _this = this;

        if(Index < Users.length){
            _this._findUserId(Users[Index].username, function(data, err){
                if(err){
                    ///if user not found then create the user and do stuff
                    if(data === '404'){
                        //no reason to change anything if permission is null
                        if(Users[Index].permission != null){
                            //require password reset on first login / default password is cognizen
                            console.log('_assignMembership create user debug : ' + Users[Index].username + ' ' + Users[Index].first + ' ' + Users[Index].last);
                            _this.createUser(Users[Index].username, Users[Index].first, Users[Index].last, 'cognizen', true, function(err){
                                if(err){
                                    _this.logger.error("Error creating redmine user: " + err);
                                    callback(err);                                        
                                }
                                else{
                                    //now call assignMembership with the same index
                                    _this._assignMembership(ProjectId, Membership_arr, Users, Index, function(err){
                                        if(err){
                                            callback(err);
                                        }
                                        else{
                                            callback();
                                        }
                                    }); 

                                }
                            });
                        }
                        else{
                            //now call assignMembership with the same index
                            _this._assignMembership(ProjectId, Membership_arr, Users, Index+1, function(err){
                                if(err){
                                    callback(err);
                                }
                                else{
                                    callback();
                                }
                            });                             
                        }
                    }
                    else{
                        _this.logger.error("Error " + err);
                        callback(err);
                    }
                }
                else{
                    //add the user id and role id to the projects membership
                    var userId = data.id;
                    var _membershipId = _this._getMembershipId(Membership_arr, userId);
                    _this._setMembership(_membershipId, ProjectId, userId, Users[Index].permission, function(data, err){
                        if(err){
                            _this.logger.error("Error in setMembership " + err);
                            callback(err);
                        }
                        else{
                            _this._assignMembership(ProjectId, Membership_arr, Users, Index+1, function(err){
                                if(err){
                                    callback(err);
                                }
                                else{
                                    callback();
                                }
                            }); 
                        }
                    });                                        

                }
            });  
        }
        else{
            callback();            
        }
    },
    _setMembership: function(MembershipId, ProjectId, UserId, Permission, callback){
        var _this = this;

        var redmineRole = '';
        if(Permission === 'admin'){
            redmineRole = 'Manager';
        }
        else if(Permission === 'editor'){
            redmineRole = 'Developer';
        }
        else if(Permission === 'reviewer'){
            redmineRole = 'Reporter';
        }

        if(MembershipId != 0){
            if(redmineRole != ''){
                //update membership
                _this._findRoleId(redmineRole, function(data, err){
                    if(err){
                        _this.logger.error("Error finding role id " + err);
                        callback(err);
                    }
                    else{
                        var roleId = data.id;
                        _this.promisedAPI.put('/memberships/'+MembershipId, {"membership": {"role_ids": [roleId]}})
                            .error(function(err){
                                _this.logger.error("Error: " + err.message);
                                callback(err);
                            })

                            .success(function(data){
                                callback();
                            })
                        ;    

                    }
                });                    
            }
            else{
                //delete membership
                _this.promisedAPI.del('/memberships/'+MembershipId, {})
                    .error(function(err){
                        _this.logger.error("Error: " + err.message);
                        callback(err);
                    })

                    .success(function(data){
                        callback();
                    })
                ;                     
            }
        }
        else{
             if(redmineRole != ''){
                _this._findRoleId(redmineRole, function(data, err){
                    if(err){
                        console.log("Error finding role id " + err);
                        callback(err);
                    }
                    else{
                        var roleId = data.id;
                        _this.promisedAPI.post('/projects/'+ProjectId+'/memberships', {"membership": {"user_id": UserId, "role_ids": [roleId]}})
                            .error(function(err){
                                _this.logger.error("Error: " + err.message);
                                callback(err);
                            })

                            .success(function(data){
                                callback();
                            })
                        ;    

                    }
                });
            }
            else{
                //do nothing callback 
                callback();
            }                               
        }
    },

    _getMembershipId: function(Membership_arr, UserId){
        var _this = this;

        for (var i = 0; i < Membership_arr.length; i++) {
            var found = false;
            if(Membership_arr[i].user.id == UserId){
                found = true;
                return Membership_arr[i].id;
            }
        }
        if(!found){
            return 0;
        }        
    }
};

module.exports = REDMINE;