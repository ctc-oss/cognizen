nodeSetup Instructions
------------------
!!!!!! IF INSTALLING ON node 10.26 or later, skip steps 1-5 and replace with:
!!!!!!  npm install --link !!!!! - this line does 1-5 below on node 10.26 and later.
1. From a terminal window in this directory, run the following command:
		On older (node 10.15):
        npm install -g
        On new hosted server install:
        node installs //cd /apache/vhosts/cognizen-dev.ctc.com/docs/cognizen/bin/server/opt/node.js/v0.10.26/bin/npm install --link

2. This should globally install all of the node packages necessary to run the cognizen-server.js
3. To link those node modules to our project here, run the following command

        npm link

4. This will create links to all the node packages in the node_modules folder
5. Make a copy of the config.json.template file, and call it config.json.  This will be your local configuration options.
6. Make any appropriate changes in that file, such as port, ssl, database username/password, etc..
7. Take the siofu-server.js file, rename it to server.js and replace the server.js in node-modules/socket.io-file-upload/ (probably installed globally and linked in node-modules, depending upon your install) with this one. This npm was updated by Jeremy Snyder and differs from the npm install - file uploads will not work without this!!!!!
8. Run the following command to start the cognizen-server

        node cognizen-server.js

9. This will start up the cognizen server, the static server, and the git server in one fell swoop


Server Side File Descriptions
-----------------------------

All important files used to power the server are in the file format name of cognizen-[function].js.  Purposes are as follows:

1. **cognizen-server.js** - Main entry point for the server
    - Configures logging
    - Configures all internal ports for the proxy, Git, and socket connections
    - Configures SSL
    - Connects to Mail configuration
    - Holds some of the logic to determine user permissions on content
    - Contains utility functions
    - Maps socket calls to functions
    - Starts up all of the servers, sockets, and proxies

2. **cognizen-git.js** - Contains all the logic to start and maintain the Cognizen Git server for the program repositories
    * Allows developers to easily interact with a program and its corresponding Git repository on the server
    * Creates Git repositories for new programs
    * Allows commits of Git repositories
    * Has utility methods to deal with lock files, etc.

3. **cognizen-mail.js** - Mail server connection and sending functionality
    * Reads configuration of mail from config.json to connect to outgoing mail server
    * Sends mail

4. **cognizen-scorm.js** - Consolidated functionality to create SCORM packages from Cognizen content
    * Can generate SCORM packages for single lessons or entire courses

5. **cognizen-socket-handler.js** - Handler code for socket events
    * Contains a function mapped to each socket emit to handle the request, and return a response
    * Functions are mapped within cognizen-server.js, but all logic is contained in this file

6. **cognizen-utils.js** - General utility file for Cognizen server
    * File to place utility functions that are general to all cognizen server files
    * Contains utility functions such as command line commands, string manipulation, operating system checks, date/time functions, and database functions

