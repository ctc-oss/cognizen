String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.contains = function(token) {
    return this.indexOf(token) >= 0;
};

var ncp = require('ncp').ncp;
ncp.limit = 100;

//ncp('../core-files', '../../core-prog', {clobber: true, filter: function(file) {
//    var match = (file.contains("css") || file.contains("media") || file.endsWith('index.html'))
//    console.log(match);
//    return false;
//}}, function(err) {
//    console.log('ERR: ' + err);
//    console.log('done');
//});

ncp('../core-files', '../../core-prog', {clobber: true, filter: function(path) {
    return (path.endsWith('core-files') || path.contains("css") || path.contains("media") || path.endsWith('index.html'));
}}, function(err) {
    if (err) console.log('ERR: ' + err);
    console.log('done');
});

ncp('../core-files', '../../core-content', {clobber: true, filter: function(path) {
    return (path.endsWith('core-files') || path.indexOf("js") >= 0 || path.indexOf("scorm") >= 0 || path.indexOf("server") >= 0 || path.indexOf("xml") >= 0);
}}, function(err) {
    if (err) console.log('ERR: ' + err);
    console.log('done');
});

//var util = require('util');
//var FileUtils = require('./file-utils');
//var fs = require('fs-extra');
//var path = require('path');

//var mkdir = function(dir) {
//    // making directory without exception if exists
//    try {
//        fs.mkdirpSync(dir, 0755);
//    } catch(e) {
//        if(e.code != "EEXIST") {
//            throw e;
//        }
//    }
//};
//
//var rmdir = function(dir) {
//    if (path.existsSync(dir)) {
//        var list = fs.readdirSync(dir);
//        for(var i = 0; i < list.length; i++) {
//            var filename = path.join(dir, list[i]);
//            var stat = fs.statSync(filename);
//
//            if(filename == "." || filename == "..") {
//                // pass these files
//            } else if(stat.isDirectory()) {
//                // rmdir recursively
//                rmdir(filename);
//            } else {
//                // rm fiilename
//                fs.unlinkSync(filename);
//            }
//        }
//        fs.rmdirSync(dir);
//    }
//};
//
//var copyDir = function(src, dest, whitelist) {
//    rmdir(dest);
//    mkdir(dest);
//    var files = fs.readdirSync(src);
//    for(var i = 0; i < files.length; i++) {
//        var current = fs.lstatSync(path.join(src, files[i]));
//        var newSrc = path.join(src, files[i]);
//        var newDest = path.join(dest, files[i]);
//        if (!whitelist || whitelist(newSrc)) {
//            if(current.isDirectory()) {
//                copyDir(newSrc, newDest, whitelist);
//            }
//            else if(current.isSymbolicLink()) {
//                var symlink = fs.readlinkSync(newSrc);
//                fs.symlinkSync(symlink, newDest);
//            }
//            else {
//                copy(newSrc, newDest);
//            }
//        }
//    }
//    console.log(3);
//};
//
//var copy = function(src, dest) {
//    var oldFile = fs.createReadStream(src);
//    var newFile = fs.createWriteStream(dest);
//    oldFile.pipe(newFile);
//};

//FileUtils.copyDir('../core', '../../core-prog', function(path) {
//    return (path.contains("css") || path.contains("media") || path.contains('index.html'));
//});
//console.log(1);
////FileUtils.copyDir('../core', '../../core-content', function(path) {
////    return (path.indexOf("js") >= 0 || path.indexOf("scorm") >= 0 || path.indexOf("server") >= 0 || path.indexOf("xml") >= 0);
////});
//console.log(2);

//var readdirp = require('readdirp');
//var fs = require('fs-extra');
//
//var root = '../../core';
//var progcopy = '../../core-prog'
//readdirp({
//    root: root,
//    directoryFilter: function (di) {
//        return (di.path.indexOf("css") == 0 || di.path.indexOf("media") == 0)
//    },
//    fileFilter: ['!.*']
//    }).on('data', function (entry) {
//        fs.mkdirpSync(progcopy + '/' + entry.parentDir)
//        fs.createReadStream(root + '/' + entry.path).pipe(fs.createWriteStream(progcopy + '/' + entry.path));
//        console.log("111: " + entry);
//    }).on('end', function() {
//        console.log('core prog done');
//    });
//
//
//contentcopy = '../../core-content'
//readdirp({
//    root: root,
//    directoryFilter: function (di) {
//        return (di.path.indexOf("js") == 0 || di.path.indexOf("scorm") == 0 || di.path.indexOf("server") == 0 || di.path.indexOf("xml") == 0);
//    },
//    fileFilter: ['!.*', '!index.html']
//    }).on('data', function (entry) {
//        fs.mkdirpSync(contentcopy + '/' + entry.parentDir)
//        fs.createReadStream(root + '/' + entry.path).pipe(fs.createWriteStream(contentcopy + '/' + entry.path));
//        console.log("222: " + entry);
//    }).on('end', function() {
//        console.log('core content done');
//    });
//
