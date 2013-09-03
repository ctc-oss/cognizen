var fs = require('fs-extra');
var ncp = require('ncp').ncp;
ncp.limit = 100;
var path = require('path');

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.contains = function(token) {
    return this.indexOf(token) >= 0;
};

var FileUtils = {
    mkdir: function (dir) {
        // making directory without exception if exists
        try {
            fs.mkdirpSync(dir, 0755);
        } catch (e) {
            if (e.code != "EEXIST") {
                throw e;
            }
        }
    },

    rmdir: function (dir) {
        if (fs.existsSync(dir)) {
            var list = fs.readdirSync(dir);
            for (var i = 0; i < list.length; i++) {
                var filename = path.join(dir, list[i]);
                var stat = fs.statSync(filename);

                if (filename == "." || filename == "..") {
                    // pass these files
                } else if (stat.isDirectory()) {
                    // rmdir recursively
                    this.rmdir(filename);
                } else {
                    // rm fiilename
                    fs.unlinkSync(filename);
                }
            }
            fs.rmdirSync(dir);
        }
    },

    copyDir: function (src, dest, whitelist, callback) {
        var _this = this;
        _this.mkdir(dest);
        ncp(src, dest, {clobber: true, filter: whitelist}, function(err) {
            callback(err);
        });
    }

//    copy: function (src, dest) {
//        var oldFile = fs.createReadStream(src);
//        var newFile = fs.createWriteStream(dest);
//        oldFile.pipe(newFile);
//    }
}

module.exports = FileUtils;

