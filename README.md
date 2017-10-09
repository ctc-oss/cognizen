![Cognizen Logo](https://gitorious.ctc.com/gitlab/Cognizen/cognizen/raw/master/bin/css/images/cognizen_logo_final.png "Cognizen Logo")
## What is Cognizen?
Cognizen is a collaborative content creation and development tool that utilizes an intuitive WYSIWYG (what you see is what you get) editing environment and drag-and-drop media integration. This tool accomodates remote users in multiple locations to collaboratively create content in a unified environment providing a low end configuration management and versioning system for content.  Cognizen efficiently generates single-source, mobile-friendly HTML 5 content  that is both SCORM conformant and Section 508 compliant.  Cognizen encompasses the entire content development lifecycle from storyboarding to deployment within an intuitive user interface by providing features that easily enable users to author, edit, and review content, assign and track issues, integrate media, publish content, and apply versioning in a secure – yet flexible – online development environment.  Primarily constructed as a content creation environment for online and distance learning products by the Concurrent Technologies Corporation (CTC) Education and Training (E&T) division, Cognizen is also a powerful tool for building multi/single-player games, interactive media solutions, iPad applications, and web content. 


## What does Cognizen do?
Cognizen was built primarily to improve efficiency, reduce development costs, and address production and deployment requirements within the E&T division for the purpose of offering competitive, cost-effective content development solutions for our clientele. This is done in part through the rapid development of content through the use of instructional templates creating speed in the development of content, while providing a controlled/managed work environment for configuration management, review and project management.

Cognizen gives the power of course development to the content creator! This flexibility allows Cognizen to be used to support Micro-Learning, Mobile Learning, Shared Note-taking and collaboration, and in the near future, full online hosting and management of content.


## How does Cognizen work?
Cognizen separates the data from the display method by storing all content data in an XML document ensuring the data can remain portable and reusable.
*	Generates html 5 content
*	Deploys to Learning Management Systems (LMSs), mobile devices and stand-alone web applications
*	SCORM 1.2 and 2004 conformant
*	Section 508 compliant
*	This course will be in compliance with Section 508 of the Rehabilitation Act, as amended by Congress in 1998, and will provide:
*	Users with visual impairments will be able to use screen-reader software for text
*	Users with hearing impairments will have textual alternatives to audio
*	Users with motor impairments will have tab indexing for keyboard accessibility.


## Why is CTC taking Cognizen to the open source environment?
We built Cognizen to provide our clients with cost-effective web-based and distance learning products that easily integrate with established systems and processes.  Throughout the years, Cognizen has grown to become a powerful training product development tool and has allowed CTC to become more competitive in the market. More importantly, it has afforded our clients the accessibility – financially, technologically, and supportively – to fulfill their training needs making learning accessible to our warfighters, other DoD entities, and anyone else who needs to provide training to a target audience.  Cognizen is ever-developing with new features and as technology advances and learning needs change. Now, we want the experts in the fields of web-development, software engineering, design, and instructional methodologies to participate in our quest to make Cognizen the best it can be.


## How does Cognizen compare to other products?
Compared to industry standards developing distance learning products and analyzing the Chapman Alliance study to make these determinations, Cognizen has shown a 10-15% reduction in the level of effort in labor hours. 

## Key features of Cognizen
*	Assess
*	Design and Develop
*	Versioning: All content is automatically stored and updated per client in an industry standard GIT repository.
*	Outliner preview: What is it and why is it good?
*	Evaluate
*	Deploy
*	Print to PDF: What is it and why is it good? 
*	Sustain
*	Cloning: What is it and why is it good?


## Install

### Manual Instructions

* Clone the cognizen repo
* From a terminal window in cognizen/bin/server directory, run the following command:

```commandline
npm install
```
ALT:

```commandline
npm install --link
```
* Make a copy of the cognizen/bin/server/config.json.template file, and call it config.json.  This will be your local configuration options.
* Make any appropriate changes in that file, such as port, ssl, database username/password, etc..
* Take the cognizen/bin/server/siofu-server.js file, rename it to server.js and replace the server.js in node-modules/socket.io-file-upload/ (probably installed globally and linked in node-modules, depending upon your install) with this one. This npm was updated and differs from the npm install - file uploads will not work without this!!!!!

* Install MongoDB - https://docs.mongodb.com/v3.2/installation/
  - see instructions in section Mongodb Setup original admin user for cognizen install

* Install FFmpeg - https://www.ffmpeg.org/download.html
 - see FFmepg configuration

* Install Redmine (optional but recommended)
	https://www.redmine.org/projects/redmine/wiki/redmineinstall or https://bitnami.com/stack/redmine/installer
  - see instructions Redmine configuration

* Update cognizen/bin/server/config.json file to point to the appropriate values
  - ex. url, mailServer, adminEmail, ssl, port, logFolder, dbUrl, dbUsername, dbPassword, uploadTempDir, redmineHost, redmineApiKey, redmineProtocol

* Run the following command from cognizen/bin/server directory to start the cognizen-server

        node cognizen-server.js
This will start up the cognizen server, the static server, and the git server in one fell swoop. Access Cognizen at localhost:<config port>

### Docker Instructions

```commandline
docker build -t cognizen --build-arg http_proxy=http://server41.ctc.com:3128 --build-arg https_proxy=http://server41.ctc.com:3128 .
```
```commandline
docker-compose up
```
 - see instructions Redmine configuration

In another terminal
```commandline
docker-compose -f docker-compose.yml -f docker-compose-cognizen.yml up cognizen mongo
```

TODO: FFmepg

In another terminal
```commandline
docker exec -it cognizen_mongo_1 /bin/bash 
```
 - see instructions in section Mongodb Setup original admin user for cognizen install


Access Cognizen at localhost:8080

### Mongodb Setup original admin user for cognizen install
```bash
mongo
use cognizen
db.users.insert({firstName: "Cognizen", lastName: "Admin", username: "admin@cognizen.com", token:"MY_MlHiBG6gBE6N8XZxOXrirtedMyGPHotbgk2GIv8rXIgS7vNMXH2dvAx4JIxjx", password:"$2a$10$WxRNLSSHmyhcD9WPKdeyN.NaM2KQuRUZtBMQaPcoCNywkapRqeQ1y", admin:"true", active:"true"})
exit
```
This will set the admin username to 'admin@cognizen.com' and the password to 'cognizen'.

### Redmine configuration
Login to Redmine (Use localhost:10083 with Docker configuration) as admin (username:admin, pwd: admin) 

* Enable Rest web service : Administration -: Settings -: Authentication -: Check "Enable REST web service" then click "Save"
![rest](http://www.redmine.org/attachments/download/13167/enable_rest_api.png)

* Copy API access key : Click on "My account" -: Show API access key -: <br>
  For Manual Install :<br>
  Copy key and paste into config.json file as "redmineApiKey"<br>
  For Docker configuration :<br>
  Copy key and paste into DockerFile as COGNIZEN_REDMINE_API_KEY ENV

* From Administration add a user: <br>
  Login - admin@cognizen.com  <br>
  First name - admin<br>
  Last name - cognizen<br>
  email - admin@cognizen.com <br>
  administrator - check <br>

* From Administration add Group: <br>
  Name - Cognizen Admins<br>
  Users - add "admin cognizen"<br>

* Set custom fields <br>
  Administration -:  Custom Fields -:<br>
  Add "New custom field" -: Select "Issues"<br>
  Name - Page Title<br>
  Check "Required", "For all projects", "Used s a filter", "Searchable" and Visible "to any users"<br>
  Check all Trackers<br>
  Add "New custom field" -: Select "Issues"<br>
  Name - Page Id<br>
  Check "Required", "For all projects", "Used s a filter", "Searchable" and Visible "to any users"<br>
  Check all Trackers<br>

### FFmpeg configuration
```
./configure --enable-gpl --enable-version3 --enable-nonfree --enable-postproc --enable-libaacplus \
--enable-libass --enable-libcelt --enable-libfaac --enable-libfdk-aac --enable-libfreetype --enable-libmp3lame \
--enable-libopencore-amrnb --enable-libopencore-amrwb --enable-libopenjpeg --enable-openssl \
--enable-libopus --enable-libschroedinger --enable-libspeex --enable-libtheora --enable-libvo-aacenc \
--enable-libvorbis --enable-libvpx --enable-libx264 --enable-libxvid --prefix=/usr/local

```

## Server Side File Descriptions

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

4. **cognizen-redmine.js** - Handles rest calls to Redmine for handling of page level commenting

5. **cognizen-scorm.js** - Consolidated functionality to create SCORM packages from Cognizen content
    * Can generate SCORM packages for single lessons or entire courses

6. **cognizen-socket-handler.js** - Handler code for socket events
    * Contains a function mapped to each socket emit to handle the request, and return a response
    * Functions are mapped within cognizen-server.js, but all logic is contained in this file

7. **cognizen-utils.js** - General utility file for Cognizen server
    * File to place utility functions that are general to all cognizen server files
    * Contains utility functions such as command line commands, string manipulation, operating system checks, date/time functions, and database functions