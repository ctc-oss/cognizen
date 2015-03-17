var promised = require('promised-redmine');

var REDMINE = {
	promisedAPI: {},
	init: function(){
        var config = {
            host: "192.168.191.128",
            apiKey: "1a9467aecfde737f12e1fc8c1db50f7ca04786df",
            protocol: "http"
        };
        this.promisedAPI = promised(config);
        return this;
	}

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

};

module.export = REDMINE;