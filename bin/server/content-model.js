var mongoose = require('mongoose'),
    extend = require('mongoose-schema-extend');
var Schema = mongoose.Schema;

var findByPath = function(mongooseType, item, callback) {
    mongooseType.findOne({path: item.path}, function (err, found) {
        if (found == null) {
            callback(false, item);
        }
        else {
            callback((err == null), found);
        }
    });
};

var createUnique = function (mongooseType, item, callback, additionalProperties) {
    findByPath(mongooseType, item, function(found, item) {
        if (!found) {
            var newInstance = null;
            if (additionalProperties != null) {
                newInstance = new mongooseType(additionalProperties);
            }
            else {
                newInstance = new mongooseType();
            }

            for (var prop in item) {
                newInstance[prop] = item[prop];
            }

            newInstance.save(function (err, savedData) {
                callback((err == null), savedData);
            });
        }
        else {
            callback(false, item);
        }
    });
};

var findProgram = function (program, callback) {
    Program.findById(program.id, function (err, found) {
        if (!err && found) {
            callback(found);
        }
        else {
            if (err) {
                console.log(err);
            }
            callback(null);
        }
    });
};

var findCourse = function (course, callback) {
    Course.findAndPopulate(course.id, function (err, found) {
        if (!err && found) {
            callback(found);
        }
        else {
            if (err) {
                console.log(err);
            }
            callback(null);
        }
    });
};

var allowCreationOfProgramContent = function(item, callback) {
    // Need to make sure that there are no applications or courses with this name already.
    findByPath(Course, item, function(courseFound, course) {
        if (courseFound) {
            callback(false);
        }
        else {
            findByPath(Application, item, function(applicationFound, application) {
                if (applicationFound) {
                    callback(false);
                }
                else {
                    callback(true);
                }
            });
        }
    });
};

var ContentSchema = new Schema({
    name: {type: String, required: true},
    path: {type: String, required: true},
    deleted: {type: Boolean, default: false}
});

var ProgramSchema = ContentSchema.extend({
    applications: [
        {type: Schema.Types.ObjectId, ref: 'Application'}
    ],
    courses: [
        {type: Schema.Types.ObjectId, ref: 'Course'}
    ]
});

ProgramSchema.statics.createUnique = function (program, callback) {
    program.path = encodeURIComponent(program.name);
    createUnique(Program, program, callback);
};

ProgramSchema.methods.getProgram = function() {
    return this;
};

ProgramSchema.methods.getChildren = function(callback) {
    callback([]);
};

ProgramSchema.methods.getParent = function() {
    return null;
};

ProgramSchema.methods.setParent = function(parent) {
    // NOOP
};

ProgramSchema.methods.toDashboardItem = function() {
    return {
        id: this.id,
        type: 'program',
        name: this.name,
        parentDir: '',
        path: this.name
    };;
};

var ProjectSchema = ContentSchema.extend({
    program: {type: Schema.Types.ObjectId, ref: 'Program'}
});

var ApplicationSchema = ProjectSchema.extend({});
ApplicationSchema.statics.createUnique = function (app, callback) {
    findProgram(app.program, function (program) {
        if (program) {
            app.program = program;
            app.path = [app.program.path, '/', encodeURIComponent(app.name)].join('');
            // Make sure that we can create an application or course given the items path
            allowCreationOfProgramContent(app, function(allow) {
                if (allow) {
                    createUnique(Application, app, function (saved, data) {
                        if (saved) {
                            program.applications.push(data);
                            program.save(function (err) {
                                data.fullProgram = program;
                                callback(saved, data);
                            });
                        }
                        else {
                            callback(saved, data);
                        }
                    });
                }
                else {
                    callback(false, app);
                }
            });
        }
        else {
            console.log("Program with name '" + app.program.name + "' not found");
        }
    });
};

ApplicationSchema.methods.getProgram = function() {
    return this.program;
};

ApplicationSchema.methods.getParent = function() {
    return this.program;
};

ApplicationSchema.methods.setParent = function(parent) {
    this.program = parent;
};

ApplicationSchema.methods.getChildren = function(callback) {
    callback([]);
};

ApplicationSchema.methods.generatePath = function() {
    this.path = [this.program.path, '/', encodeURIComponent(this.name)].join('');
};

ApplicationSchema.methods.toDashboardItem = function() {
    return {
        id: this.id,
        type: 'application',
        name: this.name,
        parentDir: this.program.name,
        path: this.path,
        parent: this.program.id
    };
};

ApplicationSchema.statics.findAndPopulate = function(id, callback) {
    Application.findById(id).populate('program').exec(callback);
};

var CourseSchema = ProjectSchema.extend({
    lessons: [
        {type: Schema.Types.ObjectId, ref: 'Lesson'}
    ]
});

CourseSchema.methods.getProgram = function() {
    return this.program;
};

CourseSchema.methods.getParent = function() {
    return this.program;
};

CourseSchema.methods.setParent = function(parent) {
    this.program = parent;
};

CourseSchema.methods.getChildren = function(callback) {
    Lesson.find({course: this}).populate('course').exec(function(err, lessons) {
        callback(err, lessons);
    });
};

CourseSchema.methods.generatePath = function() {
    this.path = [this.program.path, '/', encodeURIComponent(this.name)].join('');
};

CourseSchema.methods.toDashboardItem = function() {
    return {
        id: this.id,
        type: 'course',
        name: this.name,
        parentDir: this.program.name,
        path: this.path,
        parent: this.program.id
    };
};

CourseSchema.statics.findAndPopulate = function(id, callback) {
    Course.findById(id).populate('program lessons').exec(callback);
};

CourseSchema.statics.createUnique = function (course, callback) {
    findProgram(course.program, function (program) {
        if (program) {
            course.program = program;
            course.path = [course.program.path, '/', encodeURIComponent(course.name)].join('');
            // Make sure that we can create an application or course given the items path
            allowCreationOfProgramContent(course, function(allow) {
                if (allow) {
                    createUnique(Course, course, function (saved, data) {
                        if (saved) {
                            program.courses.push(data);
                            program.save(function (err) {
                                data.fullProgram = program;
                                callback(saved, data);
                            });
                        }
                        else {
                            callback(saved, data);
                        }
                    });
                }
                else {
                    callback(false, course);
                }
            });
        }
        else {
            console.log("Program with name '" + course.program.name + "' not found");
        }
    });
};

var LessonSchema = ContentSchema.extend({
    course: {type: Schema.Types.ObjectId, ref: 'Course'}
});
LessonSchema.statics.createUnique = function (lesson, callback) {
    findCourse(lesson.course, function (course) {
        if (course) {
            var courseProgram = course.program;
            lesson.course = course;
            lesson.path = [lesson.course.path, '/', encodeURIComponent(lesson.name)].join('');
//            lesson.generatePath();
            createUnique(Lesson, lesson, function (saved, data) {
                if (saved) {
                    course.lessons.push(data);
                    course.save(function (err) {
                        data.fullProgram = courseProgram;
                        callback(saved, data);
                    });
                }
                else {
                    callback(saved, data);
                }
            });
        }
        else {
            console.log("Course with name '" + lesson.course.name + "' not found");
        }
    });
};

LessonSchema.methods.getProgram = function() {
    return this.course.program;
};

LessonSchema.methods.getParent = function() {
    return this.course;
};

LessonSchema.methods.setParent = function(parent) {
//    this.course = undefined;
    this.course = parent;
};

LessonSchema.methods.getChildren = function(callback) {
    callback([]);
};

LessonSchema.methods.generatePath = function() {
    this.path = [this.course.path, '/', encodeURIComponent(this.name)].join('');
};

LessonSchema.methods.toDashboardItem = function() {
    return {
        id: this.id,
        type: 'lesson',
        name: this.name,
        parentDir: this.course.name,
        path: this.path,
        parent: this.course.id
    };
};

LessonSchema.statics.findAndPopulate = function(id, callback) {
    Lesson.findById(id).populate('course').exec(function(err, foundLesson) {
        if (err || !foundLesson) {
            callback(err, foundLesson);
        }
        else {
            Course.findAndPopulate(foundLesson.course.id, function(err, foundCourse) {
                if (err || !foundLesson) {
                    callback(err, foundLesson);
                }
                else {
                    foundLesson.course = foundCourse;
                    callback(err, foundLesson);
                }
            });
        }
    });
};


var ContentCommentSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    contentType: { type: String, required: true},
    contentId: {type: String, required: true},
    pageId: {type: String, required: true},
    comment: {type: String, required: true},
    created: {type: Date, default: Date.now},
    status: {type: String, enum: ['new', 'inprogress', 'closed']}
});

var Content = mongoose.model('Content', ContentSchema);
var Program = mongoose.model('Program', ProgramSchema);
var Application = mongoose.model('Application', ApplicationSchema);
var Course = mongoose.model('Course', CourseSchema);
var Lesson = mongoose.model('Lesson', LessonSchema);
var ContentComment = mongoose.model('ContentComment', ContentCommentSchema);

module.exports = {
    Program: Program,
    Application: Application,
    Course: Course,
    Lesson: Lesson,
    ContentComment: ContentComment
}