var config = require('./config.json');

var mongoose = require('mongoose');//mongoose connector
var User = require('./user-model').User;

var Users = {
    register: function (data, callback) {
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
                active: true,
                admin: data.admin
            });

            //save the new user.
            newUser.save(function (err) {
                if (err) {
                    //if already exists - kick the registration failed
                    console.log('New User Registration Failed');
                    console.log(err);
                    callback(err);
                } else {
                    console.log('New User Registration Succeeded for ' + data.firstName + ' ' + data.lastName + ' <' + data.user + '>');
                    callback();
                }
            });
        });
    }
};

// Initializing Code
(function () {
    if (process.argv.length < 6) {
        console.log('Usage: node create-user.js [First Name] [Last Name] [Email (Username)] [Password]');
        process.exit(1);
    }

    mongoose.connect(config.dbUrl, {
        user: config.dbUsername,
        pass: config.dbPassword
    },function (err) {
        if (err) throw err;
        console.log('Successfully connected to ' + config.dbUrl + ' with username ' + config.dbUsername);
    });

    var data = {
        firstName: process.argv[2],
        lastName: process.argv[3],
        user: process.argv[4],
        pass: process.argv[5],
        admin: process.argv[6]
    }

    Users.register(data, function(err) {
        if (err) {
            process.exit(1);
        }
        else {
            process.exit(0);
        }
    });
})();
