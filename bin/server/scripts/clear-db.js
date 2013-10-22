var config = require('./../config.json');
var mongoose = require('mongoose');
var UserPermission = require('./../user-model').UserPermission;
var Program = require('./../content-model').Program;
var Application = require('./../content-model').Application;
var Course = require('./../content-model').Course;
var Lesson = require('./../content-model').Lesson;
var ContentComment = require('./../content-model').ContentComment;

(function () {
    mongoose.connect(config.dbUrl, {
        user: config.dbUsername,
        pass: config.dbPassword
    },function (err) {
        if (err) throw err;
        console.log('Successfully connected to ' + config.dbUrl + ' with username ' + config.dbUsername);
    });

    Lesson.collection.drop(function(err) {
        if (err) {console.log('Lesson: '+ err)}
        Course.collection.drop(function(err) {
            if (err) {console.log('Course: '+ err)}
            Application.collection.drop(function (err) {
                if (err) {console.log('Application: '+ err)}
                Program.collection.drop(function (err) {
                    if (err) {console.log('Program: '+ err)}
                    UserPermission.collection.drop(function(err) {
                        if (err) {console.log('UserPermission: '+ err)}
                        ContentComment.collection.drop(function(err) {
                            if (err) {console.log('ContentComment: '+ err)}
                            console.log('All Content Dropped');
                            process.exit(0);
                        });
                    });
                });
            });
        });
    });
})();
