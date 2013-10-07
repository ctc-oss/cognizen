Setup Instructions
------------------

1. From a terminal window in this directory, run the following command:

        npm install -g

2. This should globally install all of the node packages necessary to run the cognizen-server.js
3. To link those node modules to our project here, run the following command

        npm link socket.io http-proxy git-server nodemailer elementtree underscore underscore.string fs-extra winston mongoose mongoose-schema-extend bcrypt-nodejs socketio-file-upload ncp fluent-ffmpeg express cookie connect optimist readdirp archiver

4. This will create links to all the node packages in the node_modules folder
5. Make a copy of the config.json.template file, and call it config.json.  This will be your local configuration options.
6. Make any appropriate changes in that file, such as port, ssl, database username/password, etc..
7. Run the following command to start the cognizen-server

        node cognizen-server.js

8. This will start up the cognizen server, the static server, and the git server in one fell swoop
