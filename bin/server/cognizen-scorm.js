var fs = require('fs-extra');
var et = require('elementtree');
var readdirp = require('readdirp');
var archiver = require('archiver');

var SCORM = {
    logger: {},
    scormPath: '',
    contentPath: '',
    xmlContentPath: '',
    init: function(logger, ScormPath, ContentPath, XmlContentPath) {
        this.logger = logger;
        this.scormPath = ScormPath;
        this.contentPath = ContentPath;
        this.xmlContentFile = XmlContentPath;
        return this;
    },

	generateSCORM: function(data, callback){
        var _this = this;
        var scormVersion = data;
        //handle if scormVersion = none...

        readdirp(
            { root: _this.contentPath,
                directoryFilter: [ '!server', '!scorm', '!.git'],
                fileFilter: [ '!.*' ] }
            , function(fileInfo) {
                //console.log("---------------------------------------------------------" + fileInfo);
                //gResults.push("         <file href=\"bin/"+fileInfo.path+"\"/>\n");
            }
            , function (err, res) {

		        var data, etree;
		        data = fs.readFileSync(_this.xmlContentFile).toString();
		        etree = et.parse(data);
			    
			    var courseName = etree.find('.courseInfo/preferences/lessonTitle').get('value');
                var manifestFile = _this._populateManifest(scormVersion, courseName, res).join('');

                var scormBasePath = _this.scormPath + '/' + scormVersion + '/';
                var imsManifestFilePath = scormBasePath + 'imsmanifest.xml';

                fs.writeFile(imsManifestFilePath, manifestFile, function(err) {
                    if(err) {
                        _this.logger.error("Write file error" + err);
                        callback(err, null);
                    }
                    else {
                    	_this._zipScormPackage(callback, res, scormVersion, courseName, scormBasePath, imsManifestFilePath);

                    }
                    fs.remove(imsManifestFilePath, function(err){
						if(err) return _this.logger.error(err);
						_this.logger.info('imsmanifest.xml file removed.');
					});
                });


            }
        );
	//end of generateSCORM
	},

	_populateManifest: function(scormVersion, courseName, res){
		var _this = this;
        var manifest = [];

	    manifest.push('<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n');

	    if (scormVersion === '2004_3rd'){
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
	            //"                       <adlnav:hideLMSUI>exit</adlnav:hideLMSUI>\n"+
	            //"                       <adlnav:hideLMSUI>exitAll</adlnav:hideLMSUI>\n"+
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
	    }
	    else if(scormVersion == "2004_4th"){
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
	            "       <schemaversion>2004 4th Edition</schemaversion>\n"+
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
	            //"                       <adlnav:hideLMSUI>exit</adlnav:hideLMSUI>\n"+
	            //"                       <adlnav:hideLMSUI>exitAll</adlnav:hideLMSUI>\n"+
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
	    }
	    //resources go here - resourcesgenerator
        manifest.push("   <resources>\n");
        manifest.push("      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\"bin/index.html\">\n");	    
	    var resources = _this._resourcesGenerator(res);
	    for (var i = 0; i < resources.length; i++) {
	    	manifest.push(resources[i]);
	    };
	    manifest.push('      </resource>\n');
	    manifest.push('   </resources>\n');

	    manifest.push('</manifest>');	

	    return manifest;	
	},

	_resourcesGenerator: function(res){
		var resources = [];
	    res.files.forEach(function(file) {
	        var fileName = file.path.split("\\");
	        //does not include files that don't have an "." ext, directories
	        if(fileName[fileName.length-1].indexOf('.') !== -1){
	            resources.push("         <file href=\"bin/"+file.path.replace(/\\/g,"/")+"\"/>\n");
	        }
	    });
	    return resources;		
	},

	_zipScormPackage: function(callback, res, scormVersion, courseName, scormBasePath, imsManifestFilePath) {
		var _this = this;
        var scormFileVersion = scormVersion.replace(/\./, '_');
        var packageFolder = _this.contentPath + '/packages/';
        var outputFile = packageFolder + courseName.replace(/\s+/g, '')+'_'+scormFileVersion+'.zip';
        var output = fs.createWriteStream(outputFile);
        var archive = archiver('zip');

        archive.on('error', function(err) {
            throw err;
        });

        archive.pipe(output);
        //builds the bin directory
        res.files.forEach(function(file) {
            var localFile = file.path.replace(/\\/g,"/");
            var inputFile = _this.contentPath + '/' + localFile;
            archive.append(fs.createReadStream(inputFile), { name: 'bin/'+localFile });
        });

        //add SCORM files
        readdirp({
                root: scormBasePath,
                directoryFilter: ['*'],
                fileFilter: [ '!.DS_Store' ]
            },
            function(fileInfo) {},
            function (err, res) {
                res.files.forEach(function(file) {
                    var localFile = file.path.replace(/\\/g,"/")
                    //console.log(lFile);
                    var inputFile = scormBasePath + localFile;
                    archive.append(fs.createReadStream(inputFile), { name: localFile });
                });

            }
        );

        //add imsmanifest.xml file
        archive.append(fs.createReadStream("../core-files/pub-html"), { name: 'index.html'});
        archive.append(fs.createReadStream(imsManifestFilePath), { name: 'imsmanifest.xml'});

        archive.finalize(function(err, written) {
            if (err) {
                callback(err, null);
            }
        
        	//_this.logger.info("packageFolder " + packageFolder + " courseName " + courseName + " scormFileVersion " + scormFileVersion);

            //tells the engine that it is done writing the zip file
            callback(null, packageFolder + courseName.replace(/\s+/g, '')+'_'+scormFileVersion+'.zip');
            _this.logger.debug("packageFolder = " + packageFolder);

        });		
	}  

};

module.exports = SCORM;