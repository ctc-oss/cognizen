var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
//var ContentSchema = require('./content-model.js');
var SALT_WORK_FACTOR = 10;
 
var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true }, lowercase: true },
    password: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    token: { type: String, required: true},
    active: { type: Boolean, required: true},
    admin: { type: Boolean },
    trainingCoordinator: { type: Boolean },
    permissions: [{type: Schema.Types.ObjectId, ref: 'UserPermission'}],
    enrollments: [{type: Schema.Types.ObjectId, ref: 'UserEnrollment'}]
});

var UserPermissionSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    contentType: { type: String, required: true},
    contentId: {type: String, required: true},
    permission: {type: String, enum: ['admin', 'editor', 'reviewer', 'client']}
});

var UserEnrollmentSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    contentType: { type: String, required: true},
    contentId: {type: String, required: true},
    attemptId: {type: String, required: true},
    permission: {type: String, enum: ['admin', 'student', 'browse', 'reviewer']},
    created: {type: Date, default: Date.now}
});

UserSchema.pre('save', function(next) {
    var user = this;

	// only hash the password if it has been modified (or is new)
	if (!user.isModified('password')) return next();
 
	// generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
	    if (err) return next(err);
//	    console.log("salt factory");
	    // hash the password using our new salt
	    bcrypt.hash(user.password, salt, null, function(err, hash) {
//            console.log(err);
	        if (err) return next(err);
	 
	        // override the cleartext password with the hashed one
	        user.password = hash;
	        next();
	    });
	});
});
 
UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

UserSchema.methods.toDashboardItem = function() {
    return {
        id: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        username: this.username
    };
};
var User = mongoose.model('User', UserSchema);
var UserPermission = mongoose.model('UserPermission', UserPermissionSchema);
var UserEnrollment = mongoose.model('UserEnrollment', UserEnrollmentSchema);

module.exports = {
    User: User,
    UserPermission: UserPermission,
    UserEnrollment: UserEnrollment
};