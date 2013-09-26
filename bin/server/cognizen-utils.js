// This will take care of all the spawned instances of Node, if the main node crashes
var Utils = {
    subNodes: [],

    killSubNodes: function (err) {
        if (err) {
            console.log(err);
            console.log(err.stack);
        }

        if (this.subNodes && this.subNodes.length > 0) {
            console.log('Killing ' + this.subNodes.length + ' child node.js instance(s).');
            this.subNodes.forEach(function (worker) {
                process.kill(worker);
            });
        }

        process.exit(0);
    },

    generalError: function(err) {
        if (err) {
            console.log(err);
            console.log(err.stack);
        }
    },

    timestamp: function() {
        var now = new Date();
        var parts = [
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
        ];
        return parts.join('');
    },

    saveAll: function(mongooseObjects, success, error) {
        var count = 0;
        mongooseObjects.forEach(function(doc){
            doc.save(function(err){
                if (err) {
                    error(err);
                }
                else {
                    count++;
                    if( count == mongooseObjects.length ){
                        success();
                    }
                }
            });
        });
    },

    removeAll: function(mongooseObjects, success, error) {
        var count = 0;
        mongooseObjects.forEach(function(doc){
            doc.remove(function(err){
                if (err) {
                    error(err);
                }
                else {
                    count++;
                    if( count == mongooseObjects.length ){
                        success();
                    }
                }
            });
        });
    },

    printPermissions: function(user) {

        if (!user.permissions) {
            console.log('NO Permissions for ' + user.username);
        }
        else {
            var out = ['Permissions for ' + user.username];

            user.permissions.forEach(function(permission) {
                out.push(' - ' + permission.contentId + ': ' + permission.permission);
            });

            console.log(out.join('\n'));
        }
    }


};

module.exports = Utils;