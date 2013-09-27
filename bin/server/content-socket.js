var fs = require('fs-extra');
var et = require('elementtree');
var readdirp = require('readdirp');

var io;

var ContentSocket = {

    start: function(port, path, contentPath, callback) {
        var xmlContentFile = contentPath + '/xml/content.xml';

        var app = require('http').createServer(function (req, res) {
                res.writeHead(404);
                return res.end('No content available');
            });

        if (port) {
            app.listen(port);
            io = require('socket.io').listen(app);
            io.set('polling duration', 600);
            console.log('C_Server started successfully');
        }
        else {
            console.error('Port must be provided as an argument');
            callback('Port must be provided as an argument');
            return;
        }

        if (path) {
            io.set('resource', '/' + path);
            io.set('polling duration', 600);
            console.log('Socket.io resource set to /' + path);
        }
        else {
            console.error('Path must be provided as an argument');
            callback('Path must be provided as an argument');
            return;
        }

        io.sockets.on('connection', function (socket) {
            socket.emit('onConnect', { hello: 'node connection established' });

            //Set listener to update the content.xml file
            socket.on('updateXMLWithRefresh', function (data) {
                console.log("updateXMLWithRefresh called with data of " + data);
//                var file = contentPath + '../xml/content.xml';
                fs.outputFile(xmlContentFile, data.my, function(err) {
                    //Refresh the index if successfully updating the content.xml
                    if(err == null){
                        console.log("successfully updated content.xml - sending refresh ----------------------------------------------------------------------------");
                        socket.emit('updateXMLWithRefreshComplete');
                        socket.broadcast.emit('pushUpdateXMLWithRefreshComplete'); //Updates other connected clients
                    }else{
                        console.log("Houston, we have a problem - the content.xml update failed ---------------------------------------------------------------");
                    }

                })
            });

            //Update the page content
            socket.on('updateXML', function (data) {
//                var file = '../xml/content.xml';

                fs.outputFile(xmlContentFile, data.my, function(err) {
                    //Refresh the index if successfully updating the content.xml
                    if(err == null){
                        socket.emit("pushUpdateXMLWithRefreshComplete");
                        socket.broadcast.emit('pushUpdateXMLWithRefreshComplete'); //Updates other connected clients -- Did this break it?
                    }else{
                        console.log("Houston, we have a problem - the content.xml update failed - attempting to update content for node");
                    }

                })
            });

            socket.on('publishSCORM', function (data, fn) {
                var scormVersion = data.my;
                readdirp(
                    { root: "../",
                        directoryFilter: [ '!server', '!scorm', '!.git'],
                        fileFilter: [ '!.*' ] }
                    , function(fileInfo) {
                        //console.log("---------------------------------------------------------" + fileInfo);
                        //gResults.push("         <file href=\"bin/"+fileInfo.path+"\"/>\n");
                    }
                    , function (err, res) {
                        var manifest = new Array();
//                        var file = '../xml/content.xml';
                        var XML = et.XML;
                        var ElementTree = et.ElementTree;
                        var element = et.Element;
                        var subElement = et.SubElement;
                        var data, etree;
                        data = fs.readFileSync(xmlContentFile).toString();
                        etree = et.parse(data);

                        var courseName = etree.find('.courseInfo/preferences/lessonTitle').get('value');

                        var gResults = new Array();

                        manifest.push('<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n');

                        if (scormVersion === '2004'){
                            manifest.push('<manifest identifier=\"'+ courseName.replace(/\s+/g, '') +'Course\" version=\"1.3\"\n');
                            manifest.push("   xmlns=\"http://www.imsglobal.org/xsd/imscp_v1p1\"\n"+
                                "   xmlns:adlcp=\"http://www.adlnet.org/xsd/adlcp_v1p3\"\n"+
                                "   xmlns:adlnav=\"http://www.adlnet.org/xsd/adlnav_v1p3\"\n"+
                                "   xmlns:imsss=\"http://www.imsglobal.org/xsd/imsss\"\n"+
                                "   xmlns:adlseq=\"http://www.adlnet.org/xsd/adlseq_v1p3\"\n"+
                                "   xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n"+
                                "   xsi:schemaLocation=\"http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd\n"+
                                "                        http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd\n"+
                                "                        http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd\n"+
                                "                        http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd\n"+
                                "                        http://www/imsglobal.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd\">\n"+
                                "   <metadata>\n"+
                                "       <schema>ADL SCORM</schema>\n"+
                                "       <schemaversion>2004 3rd Edition</schemaversion>\n"+
                                "   </metadata>\n");
                            manifest.push("   <organizations default=\""+courseName.replace(/\s+/g, '') +"\">\n"+
                                "       <organization identifier=\""+courseName.replace(/\s+/g, '')+"\" structure=\"hierarchical\">\n"+
                                "           <title>"+courseName+"</title>\n"+
                                "           <item identifier=\"Home\" identifierref=\"RES-common-files\">\n"+
                                "               <title>"+courseName+"</title>\n"+
                                "               <adlnav:presentation>\n"+
                                "                   <adlnav:navigationInterface>\n"+
                                "                       <adlnav:hideLMSUI>continue</adlnav:hideLMSUI>\n"+
                                "                       <adlnav:hideLMSUI>previous</adlnav:hideLMSUI>\n"+
                                "                       <adlnav:hideLMSUI>exit</adlnav:hideLMSUI>\n"+
                                "                       <adlnav:hideLMSUI>exitAll</adlnav:hideLMSUI>\n"+
                                "                       <adlnav:hideLMSUI>abandon</adlnav:hideLMSUI>\n"+
                                "                       <adlnav:hideLMSUI>abandonAll</adlnav:hideLMSUI>\n"+
                                //                        "                       <adlnav:hideLMSUI>suspendAll</adlnav:hideLMSUI>\n"+
                                "                   </adlnav:navigationInterface>\n"+
                                "               </adlnav:presentation>\n"+
                                "               <imsss:sequencing>\n");
                            //any objectives stuff goes here - objectivesGenerator
                            manifest.push("\n                   <imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n");
                            manifest.push("               </imsss:sequencing>\n");
                            manifest.push("           </item>\n");
                            //sequencing rules for the course go here
                            manifest.push("       </organization>\n");
                            manifest.push("    </organizations>\n");
                            manifest.push("   <resources>\n");
                            manifest.push("      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\"bin/index.html\">\n");
                        }
                        else{
                            manifest.push('<manifest identifier=\"'+ courseName.replace(/\s+/g, '') +'Course\" version=\"1\"\n');
                            manifest.push('    xmlns=\"http://www.imsproject.org/xsd/imscp_rootv1p1p2\"'+
                                '    xmlns:adlcp=\"http://www.adlnet.org/xsd/adlcp_rootv1p2\"'+
                                '    xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"'+
                                '    xsi:schemaLocation=\"http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd'+
                                '                         http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd'+
                                '                         http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">');
                            manifest.push('<metadata>'+
                                '   <schema>ADL SCORM</schema>'+
                                '   <schemaversion>1.2</schemaversion>'+
                                '</metadata>');
                            manifest.push('<organizations default="'+courseName.replace(/\s+/g, '') +'">'+
                                '   <organization identifier="'+courseName.replace(/\s+/g, '') +'">'+
                                '		<title>'+courseName+'</title>'+
                                '		<item identifier="Home" identifierref="RES-common-files">'+
                                '			<title>'+courseName+'</title>'+
                                '		</item>'+
                                '	</organization>'+
                                '</organizations>');
                            manifest.push("   <resources>\n");
                            manifest.push("      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormtype=\"sco\" href=\"bin/index.html\">\n");
                        }
                        //resources go here - resourcesgenerator
                        for (var i=0;i<res.files.length;i++)
                        {
                            //determines the file name
                            var fileName = res.files[i].path.split("\\");
                            //does not include files that don't have an "." ext, directories
                            if(fileName[fileName.length-1].indexOf('.') !== -1){
                                manifest.push("         <file href=\"bin/"+res.files[i].path.replace(/\\/g,"/")+"\"/>\n");
                            }
                        }
                        manifest.push('      </resource>\n');
                        manifest.push('   </resources>');

                        manifest.push('\n</manifest>');

                        var manifestFile = manifest.join('');

                        var file = contentPath+'/scorm/'+scormVersion+'/imsmanifest.xml';

                        fs.writeFile(file, manifestFile, function(err) {
                            if(err) {
                                console.log("Write file error" + err);
                            }
                            else {

                                var archiver = require('archiver');
                                var scormFileVersion = scormVersion;
                                if(scormVersion === '1.2'){
                                    scormFileVersion = '1_2';
                                }

                                var packageFolder = __dirname.replace("server","packages/");
                                var output = fs.createWriteStream(packageFolder + courseName.replace(/\s+/g, '')+'_'+scormFileVersion+'.zip');
                                var archive = archiver('zip');

                                archive.on('error', function(err) {
                                    throw err;
                                });

                                archive.pipe(output);
                                //builds the bin directory
                                for(var i=0;i<res.files.length;i++){
                                    var lFile = res.files[i].path.replace(/\\/g,"/")
                                    var file1 = __dirname + '/../' + lFile;
                                    archive
                                        .append(fs.createReadStream(file1), { name: 'bin/'+lFile });
                                    //.append(fs.createReadStream(file2), { name: 'file2.txt' });

                                }

                                //add SCORM files
                                readdirp(
                                    { root: "../scorm/"+scormVersion,
                                        directoryFilter: ['*'],
                                        fileFilter: [ '!.DS_Store' ] }
                                    , function(fileInfo) {
                                    }
                                    , function (err, res) {
                                        for(var i=0;i<res.files.length;i++){
                                            var lFile = res.files[i].path.replace(/\\/g,"/")
                                            //console.log(lFile);
                                            var file1 = __dirname + '/../scorm/'+scormVersion+ '/' + lFile;
                                            archive
                                                .append(fs.createReadStream(file1), { name: lFile });
                                        }
                                    }

                                );

                                archive.finalize(function(err, written) {
                                    if (err) {
                                        throw err;
                                    }
                                    //tells the engine that it is done writing the zip file
                                    fn(packageFolder + courseName.replace(/\s+/g, '')+'_'+scormFileVersion+'.zip');
                                    console.log("packageFolder = " + packageFolder);

                                });

                            }
                        });
                    }
                );
            });
        });

        callback();
    }
};

module.exports = ContentSocket;