var fs = require('fs-extra')
	,et = require('elementtree')
	,readdirp = require('readdirp')
	,archiver = require('archiver')
	,path = require('path')
	,D = require('d.js');

var SCORM = {
    logger: {},
    scormPath: '',
    contentPath: '',
    xmlContentFile: '',
    scormVersion: '',
    courseName: '',
    packageFolder: '',
    tempXmlContentFile: '',
    binDir: 'cognizen',
    previousLesson: '',
    objectives_arr: [],
    courseXmlExists: false,
    courseData:'',
    jsResources_arr: [],
    cssResources_arr: [],
    cssCourseResources_arr: [],
    reviewLines: '',
    reviewLines_arr: [],
    courseDisplayTitle: '',
    init: function(logger, ScormPath, ContentPath, XmlContentPath, Found, ScormVersion, ManifestOnly) {
        this.logger = logger;
        this.scormPath = ScormPath;
        this.contentPath = ContentPath;
        this.xmlContentFile = XmlContentPath;
        this.found = Found;
        this.scormVersion = ScormVersion;
        this.manonly = ManifestOnly;
        return this;
    },

	generateSCORMLesson: function(callback){
        var _this = this;

        //clear objectives_arr
        _this.objectives_arr = [];
		_this.cssResources_arr = [];
        //clear js arr
        _this.jsResources_arr = [];

		readdirp(
            { root: _this.contentPath + '/../css',
                directoryFilter: [ '!.git'],
                fileFilter: [ '!.*' ] }
            , function(fileInfo) {
                //console.log("---------------------------------------------------------" + fileInfo);
            }
            , function (err, res) {
                res.files.forEach(function(file) {
                    var localFile = file.path.replace(/\\/g,"/")
                    //console.log(localFile);
                    _this.cssResources_arr.push(localFile);
                });
		        //add js directory to root of package
		        readdirp(
		            { root: _this.contentPath + '/../js',
		                directoryFilter: [ '!.git'],
		                fileFilter: [ '!.*' ] }
		            , function(fileInfo) {
		                //console.log("---------------------------------------------------------" + fileInfo);
		            }
		            , function (err, res) {
		                res.files.forEach(function(file) {
		                    var localFile = file.path.replace(/\\/g,"/")
		                    //console.log(localFile);
		                    _this.jsResources_arr.push(localFile);
		                });

		        		//console.log(_this.scormVersion);
				        readdirp(
				            { root: _this.contentPath,
				                directoryFilter: [ '!server', '!scorm', '!.git', '!js', '!CoreCSS'],
				                fileFilter: [ '!.*' ] }
				            , function(fileInfo) {
				                //console.log("---------------------------------------------------------" + fileInfo);
				            }
				            , function (err, res) {

				            	//copy content.xml file to temp location
				            	_this.packageFolder = _this.contentPath + '/packages/';
				            	_this.tempXmlContentFile = _this.packageFolder + 'content.xml';
						        try{
							        fs.copySync(_this.xmlContentFile, _this.tempXmlContentFile);//, function(err){
							    }
							    catch(err){
							    	_this.logger.error("Copy content xml file error : " + err);
							    	callback(err, null);
							    }

								var data, etree;
						       	try{
						        	data = fs.readFileSync(_this.tempXmlContentFile).toString();
						        }
						        catch(err){
						        	_this.logger.error("Error reading temp content xml file : " + err);
						        	callback(err,null);
						        }

						        etree = et.parse(data);

						        //set mode to production and scorm version in temp content.xml
				                etree.find('./courseInfo/preferences/mode').set('value','production');
				                etree.find('./courseInfo/preferences/scormVersion').set('value', _this.scormVersion);
				                etree.find('./courseInfo/preferences/finalLesson').set('value','true');
				                if(_this.scormVersion === 'none'){
				                	etree.find('./courseInfo/preferences/scorm').set('value','false');
				                }
				                var xml = etree.write({'xml_decleration': false});
				                fs.outputFile(_this.tempXmlContentFile, xml, function (err) {
				                    if (err) callback(err, null);

									_this.courseName = etree.find('.courseInfo/preferences/lessonTitle').get('value');

				                    var lessondisplaytitle = etree.find('.courseInfo/preferences/lessondisplaytitle').get('value');
				                    if(lessondisplaytitle == '' || lessondisplaytitle == undefined){
				                    	_this.courseDisplayTitle = etree.find('.courseInfo/preferences/lessonTitle').get('value');
				                    }
				                    else{
				                    	_this.courseDisplayTitle = lessondisplaytitle;
				                    }
								    
								    //find the objectives in the pages.
								    var pageCount = etree.findall('./pages/page').length;

								    //#3604
								    _this._populateObjectivesArr(pageCount, etree, _this.courseName, 0);

							        var courseXmlFile = path.normalize(_this.contentPath + "/../course.xml");
							        var tempCourseXmlFile = _this.contentPath + '/packages/tempCourse.xml';
							        try{
					                    fs.copySync(courseXmlFile, tempCourseXmlFile);//, function(err){
					                }
					                catch(err){
				                        _this.logger.error("Copy course xml file error : " + err);
				                        callback(err, null);
					                }

						            try{
				                        var _courseData = fs.readFileSync(tempCourseXmlFile).toString();
							            _this.courseData = et.parse(_courseData);
							        }
							        catch(err){
							            _this.logger.error("Error reading temp course xml file : " + err);
							            callback(err,null);
							        }

							        //set all testReview attributes to false
								    var itemCount = _this.courseData.findall('./item').length;

								    for (var i = 0; i < itemCount; i++) {
								    	var myNode = _this.courseData.findall('./item')[i];
								    	var mySeq = myNode.find('.sequencing');
								    	mySeq.set('testReview', 'false');
								    }

					                
					                var xmlCourse = _this.courseData.write({'xml_decleration': false});
					                fs.outputFile(tempCourseXmlFile, xmlCourse, function (err) {
					                    if (err) callback(err, null);

				                    	var returnPath = '';
									    var imsManifestFilePath = '';
									    //do not need to do scorm files if publishing to "none"
				        				if(_this.scormVersion != "none"){
							                var manifestFile = _this._populateManifest(res);

							                var scormBasePath = _this.scormPath + '/' + _this.scormVersion + '/';

							                // if(_this.scormVersion === '1.2_CTCU'){
							                // 	scormBasePath = _this.scormPath + '/1.2/';
							                // }

							                imsManifestFilePath = scormBasePath + 'imsmanifest.xml';

							                fs.writeFile(imsManifestFilePath, manifestFile, function(err) {
							                    if(err) {
							                        _this.logger.error("Write file error" + err);
							                        callback(err, null);
							                    }
							                    else {
							                    	if(_this.manonly){

							                    		_this._writeManifest(_this.contentPath+ '/packages/', imsManifestFilePath)
								                    		.then(function(data){
								                    			returnPath = data;
																_this._cleanAndReturn()
																	.then(function(data){callback(null, returnPath);}
																		,function(err){callback(err, null);}
																	);								                    			
								                    		}
								                    			,function(err){callback(err,null);}
								                    		);
							                    	}
							                    	else{

								                    	_this._zipScormPackage(res, scormBasePath, imsManifestFilePath, function(err, output){
								                    		if(err){
								                    			callback(err, null);
								                    		}
								                    		else{
																_this.logger.debug("packageFolder = " + _this.packageFolder);
																returnPath = output;
																_this._cleanAndReturn()
																	.then(function(data){callback(null, returnPath);}
																		,function(err){callback(err, null);}
																	);																								                    			
								                    		}

								                    	});
													}												

							                    }

							                });
						                }
						                else{
						                	_this._zipScormPackage(res, scormBasePath, imsManifestFilePath, function(err, output){
					                    		if(err){
					                    			callback(err, null);
					                    		}
					                    		else{
													_this.logger.debug("packageFolder = " + _this.packageFolder);
													returnPath = output;
													_this._cleanAndReturn()
														.then(function(data){callback(null, returnPath);}
															,function(err){callback(err, null);}
														);				                    			
					                    		}

						                	});
						                }
							                
						            //close of tempcourse write function    
						            });
				                //close of temp countent write function
				                });
				            }
				        );
		            }
		        );
	        }
	    );
	//end of generateSCORMLesson
	},

	_populateManifest: function(res){
		var _this = this;
        var manifest;
	    
	    var courseAttr = _this._parseCourseAttr();
         
        var _lms = courseAttr.lms;

	    manifest = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n';

	    if (_this.scormVersion === '2004_3rd'){
	        manifest += '<manifest identifier=\"'+ encodeURIComponent(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")) +'Course\" version=\"1.3\"\n';
	        manifest += "	xmlns = \"http://www.imsglobal.org/xsd/imscp_v1p1\" \n"+
    			"	xmlns:adlcp = \"http://www.adlnet.org/xsd/adlcp_v1p3\" \n"+
    			"	xmlns:adlseq = \"http://www.adlnet.org/xsd/adlseq_v1p3\" \n"+
    			"	xmlns:adlnav = \"http://www.adlnet.org/xsd/adlnav_v1p3\" \n"+
    			"	xmlns:imsss = \"http://www.imsglobal.org/xsd/imsss\" \n"+
    			"	xmlns:xsi = \"http://www.w3.org/2001/XMLSchema-instance\" \n";
    		if (_lms === 'CTCU'){
	        	manifest += '    xmlns:c2lcp="http://www.sumtotalsystems.com/xsd/c2l_cp_rootv1p1"';
	        }	
    		manifest += "	xsi:schemaLocation = \"http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd\n"+
    			"							http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd\n";
	        if (_lms === 'CTCU'){
	        	manifest += '\n                 http://www.sumtotalsystems.com/xsd/c2l_cp_rootv1p1 c2l_cp_rootv1p1.xsd';
	        }
	        manifest += '\">\n';    			
	        manifest += "   <metadata>\n"+
	            "       <schema>ADL SCORM</schema>\n"+
	            "       <schemaversion>2004 3rd Edition</schemaversion>\n";
	        if(_lms === 'NEL'){
	        	manifest +="		<adlcp:location>course_metadata.xml</adlcp:location>\n";
	        }    
	        manifest += "   </metadata>\n";
	        manifest += "   <organizations default=\""+encodeURIComponent(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")) +"\">\n"+
	            "       <organization identifier=\""+encodeURIComponent(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, ""))+"\" structure=\"hierarchical\">\n"+
	            "           <title>"+_this.courseDisplayTitle+"</title>\n"+
	            "           <item identifier=\"Home\" identifierref=\"RES-common-files\">\n"+
	            "               <title>"+_this.courseDisplayTitle+"</title>\n"+
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
	            "               <imsss:sequencing>\n";
	        //any objectives stuff goes here - objectivesGenerator
	       	if(_this.objectives_arr.length > 0){
	        	manifest += _this._objectivesGenerator(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, ""));
	        }

	        manifest += "                   <imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n";
	        manifest += "               </imsss:sequencing>\n";
	        manifest += "           </item>\n";
	        //sequencing rules for the course go here
	        manifest += "       </organization>\n";
	        manifest += "    </organizations>\n";
	        manifest += "   <resources>\n";
	        manifest += "      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\"" +_this.binDir+ "/index.html\">\n";
	    }
	    else if(_this.scormVersion == "2004_4th"){
	        manifest += '<manifest identifier=\"'+ encodeURIComponent(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")) +'Course\" version=\"1.3\"\n';
	        manifest += "	xmlns = \"http://www.imsglobal.org/xsd/imscp_v1p1\" \n"+
    			"	xmlns:adlcp = \"http://www.adlnet.org/xsd/adlcp_v1p3\" \n"+
    			"	xmlns:adlseq = \"http://www.adlnet.org/xsd/adlseq_v1p3\" \n"+
    			"	xmlns:adlnav = \"http://www.adlnet.org/xsd/adlnav_v1p3\" \n"+
    			"	xmlns:imsss = \"http://www.imsglobal.org/xsd/imsss\" \n"+
    			"	xmlns:xsi = \"http://www.w3.org/2001/XMLSchema-instance\" \n";
	        if (_lms === 'CTCU'){
	        	manifest += '    xmlns:c2lcp="http://www.sumtotalsystems.com/xsd/c2l_cp_rootv1p1"';
	        }    			
    		manifest += "	xsi:schemaLocation = \"http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd\n"+
    			"							http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd\n"+
    			"							http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd\n";
    		if (_lms === 'CTCU'){
	        	manifest += '\n                 http://www.sumtotalsystems.com/xsd/c2l_cp_rootv1p1 c2l_cp_rootv1p1.xsd';
	        }
	        manifest += '\">\n';	
	        manifest += "   <metadata>\n"+
	            "       <schema>ADL SCORM</schema>\n"+
	            "       <schemaversion>2004 4th Edition</schemaversion>\n";
	        if(_lms === 'NEL'){
	        	manifest +="		<adlcp:location>course_metadata.xml</adlcp:location>\n";
	        }    
	        manifest += "   </metadata>\n";	            
	        manifest += "   <organizations default=\""+encodeURIComponent(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")) +"\">\n"+
	            "       <organization identifier=\""+encodeURIComponent(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, ""))+"\" structure=\"hierarchical\">\n"+
	            "           <title>"+_this.courseDisplayTitle+"</title>\n"+
	            "           <item identifier=\"Home\" identifierref=\"RES-common-files\">\n"+
	            "               <title>"+_this.courseDisplayTitle+"</title>\n"+
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
	            "               <imsss:sequencing>\n";
	        //any objectives stuff goes here - objectivesGenerator
	        if(_this.objectives_arr.length > 0){
	        	manifest += _this._objectivesGenerator(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, ""));
	        }

	        manifest += "                   <imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n";
	        manifest += "               </imsss:sequencing>\n";
	        manifest += "           </item>\n";
	        //sequencing rules for the course go here
	        manifest += "       </organization>\n";
	        manifest += "    </organizations>\n";
        	manifest += "   <resources>\n";
        	manifest += "      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\"" +_this.binDir+ "/index.html\">\n";
	    }
	    //SCORM 1.2
	    else{
	        manifest += '<manifest identifier=\"'+ encodeURIComponent(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")) +'Course\" version=\"1\"\n';
	        manifest += '    xmlns=\"http://www.imsproject.org/xsd/imscp_rootv1p1p2\"\n'+
	            '    xmlns:adlcp=\"http://www.adlnet.org/xsd/adlcp_rootv1p2\"\n'+
	            '    xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n';
	        if (_lms === 'CTCU'){
	        	manifest += '    xmlns:c2lcp="http://www.sumtotalsystems.com/xsd/c2l_cp_rootv1p1"';
	        }
	        manifest += '    xsi:schemaLocation=\"http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd\n'+
	            '                         http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd\n'+
	            '                         http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd';
	        if (_lms === 'CTCU'){
	        	manifest += '\n                 http://www.sumtotalsystems.com/xsd/c2l_cp_rootv1p1 c2l_cp_rootv1p1.xsd';
	        }
	        manifest += '\">\n';
	        manifest +='<metadata>\n'+
	            '   <schema>ADL SCORM</schema>\n'+
	            '   <schemaversion>1.2</schemaversion>\n';
	        if(_lms === 'NEL'){
	        	manifest +="		<adlcp:location>course_metadata.xml</adlcp:location>\n";
	        }    
	        manifest += "   </metadata>\n";	            
	        manifest +='<organizations default="'+encodeURIComponent(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")) +'">\n'+
	            '   <organization identifier="'+encodeURIComponent(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")) +'">\n'+
	            '		<title>'+_this.courseDisplayTitle+'</title>\n'+
	            '		<item identifier="Home" identifierref="RES-common-files">\n'+
	            '			<title>'+_this.courseDisplayTitle+'</title>\n'+
	            '		</item>\n'+
	            '	</organization>\n'+
	            '</organizations>\n';
	        manifest += "   <resources>\n";
	   //      if(_lms === 'CTCU'){
				// manifest += "      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormtype=\"sco\" href=\"index.html\">\n";
				// manifest += "         <file href=\"index.html\"/>\n";
	   //      }
	   //      else{
        		manifest += "      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormtype=\"sco\" href=\"" +_this.binDir+ "/index.html\">\n";
        	// }
	    }
	    //resources go here - resourcesgenerator
	    var resources = _this._resourcesGenerator(res, '');
	    for (var i = 0; i < resources.length; i++) {
	    	manifest += resources[i];
	    };
	    manifest += '      </resource>\n';
	    manifest += _this._jsResourceGenerator('');
	    manifest += '   </resources>\n';

	    if (_lms === 'CTCU'){
	    	manifest += '   	<c2lcp:ItemDataExtra>\n'+
						'			<c2lcp:ItemData Type=\"Course\">\n'+
						'	 			<c2lcp:ItemSpecificData>\n'+
						'					<c2lcp:CourseData>\n'+
		 				'						<c2lcp:PackageProperties>\n'+
						'							<c2lcp:CourseDisplay>\n'+
			 			'								<c2lcp:ShowNavBar>no</c2lcp:ShowNavBar>\n'+
			 			'								<c2lcp:TOC>\n'+
						'									<c2lcp:MaxLevels>3</c2lcp:MaxLevels>\n'+
						'									<c2lcp:MaxWidth>1</c2lcp:MaxWidth>\n'+
						'									<c2lcp:ScrollBar>yes</c2lcp:ScrollBar>\n'+
						'									<c2lcp:TreeOpenIcon width=\"9\" height=\"9\" />\n'+
						'									<c2lcp:TreeCloseIcon width=\"9\" height=\"9\" />\n'+
						'									<c2lcp:TopImage width=\"-1\" height=\"-1\" />\n'+
						'									<c2lcp:BottomImage width=\"-1\" height=\"-1\" />\n'+
						'									<c2lcp:BackgroundColor>ffffff</c2lcp:BackgroundColor>\n'+
			 			'								</c2lcp:TOC>\n'+
						'							</c2lcp:CourseDisplay>\n'+
						'							<c2lcp:Launch>\n'+
			 			'								<c2lcp:Width>800</c2lcp:Width>\n'+
			 			'								<c2lcp:Height>600</c2lcp:Height>\n'+
						'							</c2lcp:Launch>\n'+
		 				'						</c2lcp:PackageProperties>\n'+
						'					</c2lcp:CourseData>\n'+
	 					'				</c2lcp:ItemSpecificData>\n'+
						'			</c2lcp:ItemData>\n'+
						'		</c2lcp:ItemDataExtra>\n';
	    }

	    manifest += '</manifest>';

	    return manifest;
	},

	_cleanAndReturn: function(){
		var _this = this;
		var deferred = D();

        //delete remove imsmanifestfile from SCORM dir
		_this._removeTempFile(_this.scormPath + '/' + _this.scormVersion + '/' + 'imsmanifest.xml')
			.then(function(data){}
				,function(err){deferred.reject(err);}
			);	

        //delete tempCourseXmlFile
		_this._removeTempFile(_this.contentPath + '/packages/tempCourse.xml')
			.then(function(data){}
				,function(err){deferred.reject(err);}
			);	

		//delete temp content file	
		_this._removeTempFile(_this.tempXmlContentFile)
			.then(function(data){
				deferred.resolve(data);
			}
				,function(err){deferred.reject(err);}
			);
			
		return deferred.promise;			
	},

	_removeTempFile: function(filePath){
		var _this = this;
		var deferred = D();

		fs.remove(filePath, function(err){
			if(err){
				_this.logger.error(err);
				deferred.reject(err);
			}
			else{
				_this.logger.info(filePath + ' temp removed.');
	            //_this.logger.debug("packageFolder = " + _this.packageFolder);
	            deferred.resolve('removed');
	        }

		});
		return deferred.promise;		
	},

	_writeManifest: function(path, imsManifestFilePath){
		var _this = this;
		var deferred = D();

        var outputXmlFile = path +_this.scormVersion+'/imsmanifest.xml';
        try{
            fs.copySync(imsManifestFilePath, outputXmlFile);//, function(err){
        }
        catch(err){
            _this.logger.error("Copy course xml file error : " + err);
            //callback(err, null);
            deferred.reject(err);
        }

        deferred.resolve(outputXmlFile);

		return deferred.promise;
	},

	_zipScormPackage: function(res, scormBasePath, imsManifestFilePath, callback) {
		var _this = this;
        var scormFileVersion = _this.scormVersion.replace(/\./, '_');
        //var packageFolder = _this.contentPath + '/packages/';
        var outputFile = _this.packageFolder + _this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")+'_'+scormFileVersion+'.zip';
        var output = fs.createWriteStream(outputFile);
        var archive = archiver('zip');

        //fired when the archiver finalized is finished
        output.on('close', function(){
        	_this.logger.info("archiver has finalized. ");
        	callback(null, outputFile);
        });

        archive.on('error', function(err) {
            throw err;
        });

        archive.pipe(output);
        //builds the cognizen directory
        res.files.forEach(function(file) {
            var localFile = file.path.replace(/\\/g,"/");
            if(localFile.indexOf('content.xml') == -1 && localFile.indexOf('packages') == -1 && localFile.indexOf('index.html')){
            	var inputFile = _this.contentPath + '/' + localFile;
            	archive.append(fs.createReadStream(inputFile), { name: _this.binDir+'/'+localFile });
        	}
        });

		 for (var i = 0; i < _this.cssResources_arr.length; i++) {
             archive.append(fs.createReadStream(_this.contentPath + '/../css/' +_this.cssResources_arr[i]), { name: _this.binDir+'/../css/'+_this.cssResources_arr[i] });
        };

		//add js directory to root of package
        for (var i = 0; i < _this.jsResources_arr.length; i++) {
             archive.append(fs.createReadStream(_this.contentPath + '/../js/' +_this.jsResources_arr[i]), { name: _this.binDir+'/../js/'+_this.jsResources_arr[i] });
        };

        //add index.html from server incase changes were made after the course was created
        archive.append(fs.createReadStream(_this.scormPath + "/../index.html"), { name: _this.binDir+'/index.html'});

        //adds temp content.xml file to zip
        archive.append(fs.createReadStream(_this.tempXmlContentFile), { name: _this.binDir+'/xml/content.xml'});

		//add course.xml file
        archive.append(fs.createReadStream(_this.contentPath + '/packages/tempCourse.xml'), { name: _this.binDir+'/../'+'course.xml'}  );


        //do not need to do scorm files if publishing to "none"
        if(_this.scormVersion != "none")
        {
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

	        //add sumtotal xsd files for CTC publish
	        if (_this._parseCourseAttr().lms === 'CTCU'){
		        readdirp({
		                root: _this.scormPath + '/1.2_sumtotal/',
		                directoryFilter: ['*'],
		                fileFilter: [ '!.DS_Store' ]
		            },
		            function(fileInfo) {},
		            function (err, res) {
		                res.files.forEach(function(file) {
		                    var localFile = file.path.replace(/\\/g,"/")
		                    //console.log(lFile);
		                    var inputFile = _this.scormPath + '/1.2_sumtotal/' + localFile;
		                    archive.append(fs.createReadStream(inputFile), { name: localFile });
		                });

		            }
		        );

		        //add a index.html file that launches the cognizen/index.html file to work in SumTotal
                var indexLaunchFile = _this._buildLaunchFile();
                var indexFilePath = _this.scormPath + '/index.html';

                fs.writeFile(indexFilePath, indexLaunchFile, function(err) {
                    if(err) {
                        _this.logger.error("Write file error" + err);
                        callback(err, null);
                    }
                    else {
                    	archive.append(fs.createReadStream(indexFilePath), { name: 'index.html' });
				        fs.remove(indexFilePath, function(err){
							if(err){
								_this.logger.error(err);
								callback(err, null);
							}
							_this.logger.info('index.html launch file removed.');
					    });
                    }

                });

	        }

	        //add imsmanifest.xml file
	        archive.append(fs.createReadStream(imsManifestFilePath), { name: 'imsmanifest.xml'});
		
	        archive.finalize();

    	}
    	else{
 		
	        archive.finalize();
    	}

	},

	_objectivesGenerator: function(lessonTitle){
		var _this = this;
		///move global objectives to objective element for JKO 3rd edition player/testing needed.
		var courseAttr = _this._parseCourseAttr();

		var objectives = "                    <imsss:objectives>\n";

		//JKO 3rd edition player requires the use of secondary objectives for module level objectives, bug with primaryObjectives in player
		//_this.logger.info(lessonTitle + " _objectivesGenerator : courseAttr.lms : " + courseAttr.lms);
		//_this.logger.info(lessonTitle + " _objectivesGenerator : scormVersion : " + _this.scormVersion);
        if(courseAttr.lms === "JKO" && _this.scormVersion === "2004_3rd"){
			objectives += "                    <imsss:primaryObjective /> \n"+
        	"					<imsss:objective objectiveID=\""+lessonTitle+"_satisfied\">\n"+
            "						<imsss:mapInfo targetObjectiveID=\""+_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")+"."+lessonTitle+"_satisfied\"\n readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\"/>\n"+
            "					</imsss:objective>\n";			
        }		
		else{
	        objectives += "                    <imsss:primaryObjective objectiveID=\""+lessonTitle+"_satisfied\">\n"+
	        "						<imsss:mapInfo targetObjectiveID=\""+_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")+"."+lessonTitle+
	        "_satisfied\"\n readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\" writeNormalizedMeasure=\"true\"/>\n"+
	        "					</imsss:primaryObjective>\n"; 			
		}

       
        objectives += _this._secondaryObjectivesGenerator();
        objectives += "                    </imsss:objectives>\n";

        return objectives;
	},

	_secondaryObjectivesGenerator: function(){
		var _this = this;
		var secondaryObjectives = "";
        for (var i = 0; i < _this.objectives_arr.length; i++) {
        	secondaryObjectives += "						<imsss:objective objectiveID=\""+_this.objectives_arr[i]+"\">\n"+
            "							<imsss:mapInfo targetObjectiveID=\""+_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")+"."+_this.objectives_arr[i]+"\"\n readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\"/>\n"+
            "						</imsss:objective>\n";
        };

        return secondaryObjectives;
	},

	_buildLaunchFile: function(){
		var _this = this;
        var index = '<!DOCTYPE html>\n'+
					'<html>\n'+
					'	<head>\n'+
					'		<title>'+_this.courseName+'</title>\n'+
					'		<!-- launch the lesson window -->\n'+
					'		<script type="text/javascript">\n'+
					'			window.open("cognizen/index.html", "lessonWindow", "width=1024, height=768");\n'+
					'			function lessonComplete(){window.top.close();}\n'+
					'		</script>\n'+
					'	</head>\n'+
					'	<body>\n'+
					'		<p>Close this window to record your progress and exit.</p>\n'+
					'	</body>\n'+
					'</html>';
		return index;
	},

	generateSCORMCourse: function(callback){
        var _this = this;

        var manifestFile = '';
        var resourceLines = [];
        var lessonsArray = [];
        var lessonsName = [];
        //clear js resources array
        _this.jsResources_arr = [];
        _this.cssResources_arr = [];
        _this.cssCourseResources_arr = [];
        _this.reviewLines = '';
        _this.reviewLines_arr = [];

        var courseXmlFile = path.normalize(_this.contentPath + "/course.xml");
        var tempCourseXmlFile = _this.contentPath + '/packages/tempCourse.xml';
        try{
	        fs.copySync(courseXmlFile, tempCourseXmlFile);//, function(err){
	    }
	    catch(err){
	    	_this.logger.error("Copy course xml file error : " + err);
	    	callback(err, null);
	    	return;
	    }

       	try{
       		var _courseData = fs.readFileSync(tempCourseXmlFile).toString();
        	_this.courseData = et.parse(_courseData);
        }
        catch(err){
        	_this.logger.error("Error reading temp course xml file : " + err);
        	callback(err,null);
        	return;
        }

        //etree = _this.courseData;

	    //var objectivesGlobalToSystem = etree.find('.sequencing').get('objectivesGlobalToSystem');
	    var itemCount = _this.courseData.findall('./item').length;
	    //stop publish if no items are found
	    if(itemCount == 0){
	    	callback("A Course must have at least 1 lesson to be published.", null);
	    	return;
	    }

	    var _contentCounter = 0;
	    for (var i = 0; i < itemCount; i++) {
	    	var myNode = _this.courseData.findall('./item')[i];
	    	var itemName = myNode.get('name');

	    	//#3356 - do not include in publish if excludeFromPublish attribute == true
	    	var _exclude = myNode.get('excludeFromPublish');
	    	if(_exclude === undefined || _exclude === 'false'){
	            var lessonPath = _this.contentPath + "/" + itemName;
	            lessonsArray.push(lessonPath);
	            lessonsName.push(itemName);
	            //console.log('Lesson Path : ' + lessonPath);
		        var lessonXmlContentFile = lessonPath + '/xml/content.xml';
	        	_this.tempXmlContentFile = _this.contentPath + '/packages/' +_contentCounter+'content.xml';
	        	_contentCounter++;
	        	try{
	        		fs.copySync(lessonXmlContentFile, _this.tempXmlContentFile);//, function(err){
	        	}
	        	catch(err){
	    			_this.logger.error("Error copying content.xml file " + err);
	    			callback(err, null);
	    			return;
	        	}
	        }
	    }        

	    //#3356 error if all lessons have excludeFromPublish set to true
	    if(lessonsArray.length == 0){
	    	callback("A Course must have at least 1 lesson that is not 'excluded from publish' to be published.", null);
	    	return;	    	
	    }

        //fs.exists(courseXmlFile, function(exists){
        var data, etree;
        var lessonXmlContentFile = lessonsArray[0] + '/xml/content.xml';
        data = fs.readFileSync(lessonXmlContentFile).toString();
        etree = et.parse(data);

        _this.courseName = etree.find('.courseInfo/preferences/courseTitle').get('value');

		var courseAttrs = _this._parseCourseAttr();
		
		if(courseAttrs.displaytitle == '' || courseAttrs.displaytitle == undefined){
			_this.courseDisplayTitle = courseAttrs.name;
		}
		else{
			_this.courseDisplayTitle = courseAttrs.displaytitle;
		}
	    


        var scormFileVersion = _this.scormVersion.replace(/\./, '_');
        _this.packageFolder = _this.contentPath + '/packages/';

        //#2764
    	var outputFile = '';
    	var archive = null;
    	if(!_this.manonly){
	        outputFile = _this.packageFolder + _this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")+'_'+scormFileVersion+'.zip';
	        var output = fs.createWriteStream(outputFile);
	        archive = archiver('zip');

	        //fired when the archiver finalized is finished
	        output.on('close', function(){
	        	_this.logger.info("archiver has finalized. ");
	        	_this.logger.debug("packageFolder = " + outputFile);
	        	callback(null, outputFile);
	        	return;
	        });

	        archive.on('error', function(err) {
	            //throw err;
				callback(err, null);
				return;            
	        });

	        archive.pipe(output);
	    }
	    else{
	    	outputFile = _this.packageFolder+_this.scormVersion+'/imsmanifest.xml';
	    }

		_this.courseXmlExists = true;

        //add js directory to root of package
		readdirp(
            { root: _this.contentPath + '/css',
                directoryFilter: [ '!.git'],
                fileFilter: [ '!.*' ] }
            , function(fileInfo) {
                //console.log("/css-------------------------------------------------------" + fileInfo);
            }
            , function (err, res) {
                res.files.forEach(function(file) {
                    var localFile = file.path.replace(/\\/g,"/")
                    //console.log(localFile);
                    _this.cssCourseResources_arr.push(localFile);
                });
                _this._exploreCoreCssDir(callback, lessonsArray, manifestFile, resourceLines, lessonsName, archive, outputFile);

			}
		);

    //end of generateSCORMCourse
	},

	_exploreCoreCssDir: function(callback, lessonsArray, manifestFile, resourceLines, lessonsName, archive, outputFile){
		var _this = this;
        readdirp(
            { root: _this.contentPath + '/../css',
                directoryFilter: [ '!.git'],
                fileFilter: [ '!.*' ] }
            , function(fileInfo) {
                //console.log("/../css------------------------------------------------------" + fileInfo);
            }
            , function (err, res) {
                res.files.forEach(function(file) {
                    var localFile = file.path.replace(/\\/g,"/")
                    //console.log(localFile);
                    _this.cssResources_arr.push(localFile);
                });
                _this._exploreJsDir(callback, lessonsArray, manifestFile, resourceLines, lessonsName, archive, outputFile);

			}
		)
	},

	_exploreJsDir: function(callback, lessonsArray, manifestFile, resourceLines, lessonsName, archive, outputFile){
		var _this = this;
        readdirp(
            { root: _this.contentPath + '/../js',
                directoryFilter: [ '!.git'],
                fileFilter: [ '!.*' ] }
            , function(fileInfo) {
                //console.log("/../js---------------------------------------------------------" + fileInfo);
            }
            , function (err, res) {
                res.files.forEach(function(file) {
                    var localFile = file.path.replace(/\\/g,"/")
                    //console.log(localFile);
                    _this.jsResources_arr.push(localFile);
                });
			    //do not need to do scorm files if publishing to "none"
				if(_this.scormVersion != "none"){
			    	manifestFile = _this._startManifest();
			    }
				_this._recurseLessons(callback, 0, lessonsArray, manifestFile, resourceLines, lessonsName, archive, outputFile);
			}
		)
	},

	_recurseLessons: function(callback, count, lArray, manifestFile, resourceLines, lessonsName, archive, outputFile){
		var _this = this;
		var _lessonPath = lArray[count];
		//clear objectives_arr
		_this.objectives_arr = [];
		//console.log(_lessonPath);
        readdirp(
            { root: _lessonPath,
                directoryFilter: [ '!server', '!scorm', '!.git', '!packages'],
                fileFilter: [ '!.*' ] }
            , function(fileInfo) {
                //console.log("---------------------------------------------------------" + fileInfo.path);
               	//resFinal.push(fileInfo.path);
            }
            , function (err, res) {
		        var data, etree;
		        var lessonXmlContentFile = _lessonPath + '/xml/content.xml';
            	//_this.tempXmlContentFile = _this.packageFolder +count+'content.xml';
            	var tempContentFile = _this.packageFolder +count+'content.xml';

				data = fs.readFileSync(tempContentFile).toString();
		        etree = et.parse(data);

		        //set mode to production and scorm version in temp content.xml
                etree.find('./courseInfo/preferences/mode').set('value','production');
                etree.find('./courseInfo/preferences/scormVersion').set('value', _this.scormVersion);
              	if(_this.scormVersion === 'none'){
                	etree.find('./courseInfo/preferences/scorm').set('value','false');
                }
                if(count+1 == lArray.length){
                	etree.find('./courseInfo/preferences/finalLesson').set('value','true');
                }
                var xml = etree.write({'xml_decleration': false});
                fs.outputFile(tempContentFile, xml, function (err) {
                    if (err) callback(err, null);

	                //add item & item sequencing (objectives)
	                var _lessonTitle = lessonsName[count];//etree.find('.courseInfo/preferences/lessonTitle').get('value');
	                //lessonsName.push(_lessonTitle);

	                //populate lessondisplaytitle #3633
                    var lessonDisplayTitle = etree.find('.courseInfo/preferences/lessondisplaytitle').get('value');
                    if(lessonDisplayTitle == '' || lessonDisplayTitle == undefined){
                    	// _this.lessonDisplayTitles_arr.push(etree.find('.courseInfo/preferences/lessonTitle').get('value'));
                    	lessonDisplayTitle = etree.find('.courseInfo/preferences/lessonTitle').get('value');
                    }
                    // else{
                    // 	_this.lessonDisplayTitles_arr.push(lessondisplaytitle);

                    // }	                

				    //find the objectives in the pages.
				    //////////////////////////////////////////////////
				    var pageCount = etree.findall('./pages/page').length;

				    //#3604
				    _this._populateObjectivesArr(pageCount, etree, _lessonTitle, 0);

					//set up the final test item structure for review
					var courseObj = _this._parseCourseItem(_lessonTitle.replace(/\s+/g, ''));
					var mySeq = courseObj.sequencing;

					if(mySeq.get("testReview") === 'true')
					{
						_this.reviewLines = '';

				        _this.reviewLines = _this._addResources(res, _lessonTitle.replace(/\s+/g, '%20') +'-Review-files/')
				        var reviewMap_obj = {
				        	lesson: _lessonTitle,
				        	lines: _this.reviewLines
				        };
				        _this.reviewLines_arr.push(reviewMap_obj);
				        if(!_this.manonly){
					        res.files.forEach(function(file) {
					            var localFile = file.path.replace(/\\/g,"/");
					            if(localFile.indexOf('content.xml') == -1 && localFile.indexOf("index.html") == -1){
					            	var inputFile = _lessonPath + '/' + localFile;
					            	archive.append(fs.createReadStream(inputFile), { name: _this.binDir + '/'+ _lessonTitle +'-Review-files/'+localFile });
					        	}
					        });
					        //add index.html from server incase changes were made after the course was created
					        archive.append(fs.createReadStream(_this.scormPath + "/../index.html"), { name: _this.binDir + '/'+ _lessonTitle +'-Review-files/index.html'});

					        //add warning icon 
					        archive.append(fs.createReadStream(_this.scormPath + "/review/cognizen_warning_icon.png"), { name: _this.binDir + '/'+ _lessonTitle +'-Review-files/media/cognizen_warning_icon.png'});
					    
							//updating temp review content.xml file
							////////////////////////////////////////////////////////////////
					        var _review_data, _review_etree;
					        var _reviewXmlContentFile = _this.scormPath + '/review/content.xml';
			            	var _tempReviewFile = _this.packageFolder + 'review' +count+'content.xml';
			            	// console.log('reviewXmlContentFile : ' +_reviewXmlContentFile);
			            	// console.log('tempReviewFile : ' + _tempReviewFile);
					        try{
						        fs.copySync(_reviewXmlContentFile, _tempReviewFile);//, function(err){
						    }
						    catch(err){
						    	_this.logger.error("Copy review content xml file error : " + err);
						    	callback(err, null);
						    	return;
						    }

					       	try{
								_review_data = fs.readFileSync(_tempReviewFile).toString();
						        _review_etree = et.parse(_review_data);
					        }
					        catch(err){
					        	_this.logger.error("Error reading temp course xml file : " + err);
					        	callback(err,null);
					        	return;
					        }

			                _review_etree.find('./courseInfo/preferences/scormVersion').set('value', _this.scormVersion);
			                _review_etree.find('./courseInfo/preferences/courseTitle').set('value', _this.courseName);
			                _review_etree.find('./courseInfo/preferences/lessonTitle').set('value', _lessonTitle + ' Review');

			              	if(_this.scormVersion === 'none'){
			                	_review_etree.find('./courseInfo/preferences/scorm').set('value','false');
			                }
			                if(count+1 == lArray.length){
			                	_review_etree.find('./courseInfo/preferences/finalLesson').set('value','true');
			                }

			                var xml = _review_etree.write({'xml_decleration': false});
			                fs.outputFile(_tempReviewFile, xml, function (err) {
			                    if (err) callback(err, null);
			                    archive.append(fs.createReadStream(_tempReviewFile), { name: _this.binDir+'/'+ _lessonTitle +'-Review-files/xml/content.xml'});

			        			try{
			        				fs.removeSync(_tempReviewFile);
			        			}
			        			catch(err){
			        				_this.logger.error("Error deleting temp review content.xml file :" + err );
			        			}

				            });
			            }//end !_this.manonly

					}


				    //do not need to do scorm files if publishing to "none"
    				if(_this.scormVersion != "none"){
	                	manifestFile += _this._add2004Item(lessonsName[count], lessonDisplayTitle, count, lArray.length, res);
	            	}

	                //add resources
	                resourceLines.push(_this._addResources(res, lessonsName[count]+'/'));
			        
			        if(!_this.manonly){
				        //builds the cognizen directory
				        res.files.forEach(function(file) {
				            var localFile = file.path.replace(/\\/g,"/");
				            if(localFile.indexOf('content.xml') == -1 && localFile.indexOf("index.html")){
				            	var inputFile = _lessonPath + '/' + localFile;
				            	archive.append(fs.createReadStream(inputFile), { name: _this.binDir+'/'+lessonsName[count]+'/'+localFile });
				        	}
				        });

				        //add index.html from server incase changes were made after the course was created
				        archive.append(fs.createReadStream(_this.scormPath + "/../index.html"), { name: _this.binDir+'/'+lessonsName[count]+'/index.html'});
				    }

	                if(count+1 == lArray.length){
				        if(manifestFile != ''){

					        var courseAttr = _this._parseCourseAttr();

					        var completionLines = '';

					        //if(_this.scormVersion.indexOf('USSOCOM') != -1){
					        if(courseAttr.lms === "JKO"){
						        //add completion  and survey files
						        if(courseAttr.survey === "true"){
					                manifestFile += _this._addUSSOCOMExtra('survey');
					                if(!_this.manonly){
						                archive.append(fs.createReadStream(_this.scormPath + '/survey/survey.html'), { name: _this.binDir + '/survey/survey.html'});
						            }
						        }

						        readdirp({
						                //root: _this.scormPath + '/completion/',
						                root: _this.scormPath + '/completion-files/',
						                directoryFilter: ['*']
						            },
						            function(fileInfo) {},
						            function (err, res) {


						                if(courseAttr.certificate === "true"){
						                	manifestFile += _this._addUSSOCOMExtra('completion');
						                	completionLines = _this._addResources(res, 'completion-files/');
						                	if(!_this.manonly){
								                res.files.forEach(function(file) {
								                    var localFile = file.path.replace(/\\/g,"/")
								                    var inputFile = _this.scormPath + '/completion-files/' + localFile;
								                    archive.append(fs.createReadStream(inputFile), { name: _this.binDir+'/completion-files/' + localFile });
								                });	

								                //add upper level js files
								                archive.append(fs.createReadStream(_this.scormPath + '/compjs/APIWrapper.js'), { name: _this.binDir+'/compjs/APIWrapper.js' });
								                //completionLines.push(_this.binDir+'/compjs/APIWrapper.js');
								                archive.append(fs.createReadStream(_this.scormPath + '/compjs/common.js'), { name: _this.binDir+'/compjs/common.js' });
								                //completionLines.push(_this.binDir+'/compjs/common.js');	
								                archive.append(fs.createReadStream(_this.scormPath + '/compjs/flashobject.js'), { name: _this.binDir+'/compjs/flashobject.js' });
								                //completionLines.push(_this.binDir+'/compjs/flashobject.js');	
								                archive.append(fs.createReadStream(_this.scormPath + '/compjs/KnowledgeCheck.js'), { name: _this.binDir+'/compjs/KnowledgeCheck.js' });
								                //completionLines.push(_this.binDir+'/compjs/KnowledgeCheck.js');	
								                archive.append(fs.createReadStream(_this.scormPath + '/compjs/prototype.js'), { name: _this.binDir+'/compjs/prototype.js' });
								                //completionLines.push(_this.binDir+'/compjs/prototype.js');	
								                archive.append(fs.createReadStream(_this.scormPath + '/compjs/soundmanager2-nodebug-jsmin.js'), { name: _this.binDir+'/compjs/soundmanager2-nodebug-jsmin.js' });
								                //completionLines.push(_this.binDir+'/compjs/soundmanager2-nodebug-jsmin.js');
							                }						                	
						            	}

						                manifestFile += _this._finalizeManifest(lessonsName, resourceLines, completionLines);
						                if(_this.scormVersion != "none"){
						                	//this needs to be moved to a function
					        				///////////////////////////////////////////////
									        var scormBasePath = _this.scormPath + '/' + _this.scormVersion + '/';

									        // //USSOCOM publishing uses 2004 4th edition SCORM files
									        // if(_this.scormVersion === '2004_4th_USSOCOM'){
									        // 	scormBasePath = _this.scormPath + '/2004_4th/';
									        // }
									        // else if(_this.scormVersion === '2004_3rd_USSOCOM'){
									        // 	scormBasePath = _this.scormPath + '/2004_3rd/';
									        // }

									        var imsManifestFilePath = scormBasePath + 'imsmanifest.xml';

									        fs.writeFile(imsManifestFilePath, manifestFile, function(err) {
									            if(err) {
									                _this.logger.error("Write file error" + err);
									                callback(err, null);
									                return;
									            }
									            else {
													if(!_this.manonly){
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
												                    var inputFile = scormBasePath + localFile;
												                    archive.append(fs.createReadStream(inputFile), { name: localFile });
												                });

												            }
												        );

														//add js directory to root of package
												        for (var i = 0; i < _this.jsResources_arr.length; i++) {
												             archive.append(fs.createReadStream(_this.contentPath + '/../js/' +_this.jsResources_arr[i]), { name: _this.binDir+'/js/'+_this.jsResources_arr[i] });
												        };

												        for (var i = 0; i < _this.cssResources_arr.length; i++) {
												             archive.append(fs.createReadStream(_this.contentPath + '/../css/' +_this.cssResources_arr[i]), { name: _this.binDir+'/css/'+_this.cssResources_arr[i] });
												        };

												        for (var i = 0; i < _this.cssCourseResources_arr.length; i++) {
												             archive.append(fs.createReadStream(_this.contentPath + '/css/' +_this.cssCourseResources_arr[i]), { name: _this.binDir+'/css/'+_this.cssCourseResources_arr[i] });
												        };

												        //add imsmanifest.xml file
												        archive.append(fs.createReadStream(imsManifestFilePath), { name: 'imsmanifest.xml'});

												        //add course.xml file
												        archive.append(fs.createReadStream(_this.contentPath + '/packages/tempCourse.xml'), { name: _this.binDir+'/'+'course.xml'}  );

									        			//adds temp content.xml file to zip
									        			for(var j=0; j<lArray.length; j++){
									        				archive.append(fs.createReadStream(_this.packageFolder +j+'content.xml'), { name: _this.binDir+'/'+lessonsName[j]+'/xml/content.xml'});
									        			}

									        			// //add review content.xml file to zip
									        			// if(_this.reviewLines != ''){
									        			// 	archive.append(fs.createReadStream(_this.scormPath + '/review/content.xml'), { name: _this.binDir+'/Review-files/xml/content.xml'});
									        			// }
							        				}
							        				else{
							                    		_this._writeManifest(_this.packageFolder, imsManifestFilePath)
								                    		.then(function(data){
								                    			callback(null, data);
								                    		}
								                    			,function(err){callback(err,null);}
								                    		);							        					
							        				}

								        			//remove temp course.xml
								        			try{
								        				fs.removeSync(_this.contentPath + '/packages/tempCourse.xml');
								        			}
								        			catch(err){
								        				_this.logger.error("Error deleting tempCourse.xml file :" + err );
								        			}

								        			//remove temp content.xml files
								        			_this._removeTempFiles(lArray);

										            fs.remove(imsManifestFilePath, function(err){
														if(err){
															_this.logger.error(err);
															callback(err, null);
															return;
														}
														_this.logger.info('imsmanifest.xml file removed.');
														if(!_this.manonly){
													        archive.finalize();
													    }

													});

									            }

									        });
									        ///////////////////////////////////////////////
						                }
						            }
						        );
					        }
					        else{
					        	manifestFile += _this._finalizeManifest(lessonsName, resourceLines, completionLines);
					        	if(_this.scormVersion != "none"){
					        		//this needs to be moved to a function
					        		///////////////////////////////////////////////
							        var scormBasePath = _this.scormPath + '/' + _this.scormVersion + '/';

							        // //USSOCOM publishing uses 2004 4th edition SCORM files
							        // if(_this.scormVersion === '2004_4th_USSOCOM'){
							        // 	scormBasePath = _this.scormPath + '/2004_4th/';
							        // }
							        // else if(_this.scormVersion === '2004_3rd_USSOCOM'){
							        // 	scormBasePath = _this.scormPath + '/2004_3rd/';
							        // }

							        var imsManifestFilePath = scormBasePath + 'imsmanifest.xml';

							        fs.writeFile(imsManifestFilePath, manifestFile, function(err) {
							            if(err) {
							                _this.logger.error("Write file error" + err);
							                callback(err, null);
							                return;
							            }
							            else {
											if(!_this.manonly){
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
										                    var inputFile = scormBasePath + localFile;
										                    archive.append(fs.createReadStream(inputFile), { name: localFile });
										                });

										            }
										        );

												//add js directory to root of package
										        for (var i = 0; i < _this.jsResources_arr.length; i++) {
										             archive.append(fs.createReadStream(_this.contentPath + '/../js/' +_this.jsResources_arr[i]), { name: _this.binDir+'/js/'+_this.jsResources_arr[i] });
										        };

										        for (var i = 0; i < _this.cssResources_arr.length; i++) {
												    archive.append(fs.createReadStream(_this.contentPath + '/../css/' +_this.cssResources_arr[i]), { name: _this.binDir+'/css/'+_this.cssResources_arr[i] });
												};

												for (var i = 0; i < _this.cssCourseResources_arr.length; i++) {
												    archive.append(fs.createReadStream(_this.contentPath + '/css/' +_this.cssCourseResources_arr[i]), { name: _this.binDir+'/css/'+_this.cssCourseResources_arr[i] });
												};

										        //add imsmanifest.xml file
										        archive.append(fs.createReadStream(imsManifestFilePath), { name: 'imsmanifest.xml'});

										        //add course.xml file
										        archive.append(fs.createReadStream(_this.contentPath + '/packages/tempCourse.xml'), { name: _this.binDir+'/'+'course.xml'}  );

							        			//adds temp content.xml file to zip
							        			for(var j=0; j<lArray.length; j++){
							        				archive.append(fs.createReadStream(_this.packageFolder +j+'content.xml'), { name: _this.binDir+'/'+lessonsName[j]+'/xml/content.xml'});
							        			}

							        			//add review content.xml file to zip
							        			// if(_this.reviewLines != ''){
							        			// 	archive.append(fs.createReadStream(_this.scormPath + '/review/content.xml'), { name: _this.binDir+'/Review-files/xml/content.xml'});
							        			// }
							        		}
					        				else{
					                    		_this._writeManifest(_this.packageFolder, imsManifestFilePath)
						                    		.then(function(data){
						                    			callback(null, data);
						                    		}
						                    			,function(err){callback(err,null);}
						                    		);							        					
					        				}
						        			//remove temp course.xml
						        			try{
						        				fs.removeSync(_this.contentPath + '/packages/tempCourse.xml');
						        			}
						        			catch(err){
						        				_this.logger.error("Error deleting tempCourse.xml file :" + err );
						        			}

						        			//remove temp content.xml files
						        			_this._removeTempFiles(lArray);

								            fs.remove(imsManifestFilePath, function(err){
												if(err){
													_this.logger.error(err);
													callback(err, null);
													return;
												}
												_this.logger.info('imsmanifest.xml file removed.');
												if(!_this.manonly){
											        archive.finalize();
											    }

											});							

							            }

							        });
							        ///////////////////////////////////////////////
					        	}
					        }


				        }
				        else if(_this.scormVersion != "none"){
				        	callback("no manifestFile", null);
				        }

					    //do not need to do scorm files if publishing to "none"
	    				if(_this.scormVersion != "none"){

	    					//code moved above
						}
						else{

		        			//adds temp content.xml file to zip
		        			for(var j=0; j<lArray.length; j++){
		        				archive.append(fs.createReadStream(_this.packageFolder +j+'content.xml'), { name: _this.binDir+'/'+lessonsName[j]+'/xml/content.xml'});
		        			}

		        			//create index.html file to place at the root of the package
		        			var tempNoneIndex = _this.packageFolder + '/index.html';
					        fs.writeFile(tempNoneIndex, _this._createNoneIndex(lArray, lessonsName), function(err) {
					            if(err) {
					                _this.logger.error("Write file error" + err);
					                callback(err, null);
					                return;
					            }

		        				archive.append(fs.createReadStream(tempNoneIndex), {name: _this.binDir+'/index.html'});

						        //add course.xml file
						        archive.append(fs.createReadStream(_this.contentPath + '/packages/tempCourse.xml'), { name: _this.binDir+'/'+'course.xml'}  );

								//add js directory to root of package
						        for (var i = 0; i < _this.jsResources_arr.length; i++) {
						             archive.append(fs.createReadStream(_this.contentPath + '/../js/' +_this.jsResources_arr[i]), { name: _this.binDir+'/js/'+_this.jsResources_arr[i] });
						        };

						        for (var i = 0; i < _this.cssResources_arr.length; i++) {
									archive.append(fs.createReadStream(_this.contentPath + '/../css/' +_this.cssResources_arr[i]), { name: _this.binDir+'/css/'+_this.cssResources_arr[i] });
								};

								for (var i = 0; i < _this.cssCourseResources_arr.length; i++) {
									archive.append(fs.createReadStream(_this.contentPath + '/css/' +_this.cssCourseResources_arr[i]), { name: _this.binDir+'/css/'+_this.cssCourseResources_arr[i] });
								};

			        			//remove temp course.xml
			        			try{
			        				fs.removeSync(_this.contentPath + '/packages/tempCourse.xml');
			        			}
			        			catch(err){
			        				_this.logger.error("Error deleting tempCourse.xml file :" + err );
			        			}

						        //remove temp content.xml files
						        _this._removeTempFiles(lArray);

						        try{
									fs.removeSync(tempNoneIndex);
						        }
						        catch(err){
									_this.logger.error(err);
									//callback(err, null);
						        }

								_this.logger.info('temp index.html file removed.');

						        archive.finalize();
		        			});



						}

	                }
	                else{
		    			_this._recurseLessons(callback, count+1, lArray, manifestFile, resourceLines, lessonsName, archive, outputFile);
	                }

	            });

            }
        );

	},

	//#3604
	//recursive function to avoid async issues when populating objectives_arr
	_populateObjectivesArr:function(_pageCount, _etree, _lessonTitle, index){
		var _this = this;

	    if(index < _pageCount){	
	    	var myNode = _etree.findall('./pages/page')[index];
	    	var pageObj = myNode.get('objective');
	    	var pageObjId = myNode.get('objItemId');
	    	var pageTitle = myNode.findtext('title');

	    	var tlo = _etree.find('.courseInfo/preferences/tlo');//.get('value');

	    	var tloValue = "undefined";
	    	if(tlo != null && tlo != "null"){
	    		tloValue = tlo.get('value');
	    	}
	    	var lessonIndictor = 'undefined';
	    	if(tloValue != 'undefined' && tloValue != undefined){
	    		lessonIndictor = tloValue.replace('.', '').replace(/\s+/g, '');
	    	}
	    	else{
	    		lessonIndictor = _lessonTitle.replace(/\s+/g, '').replace('.', '').replace(/[^\w\s]/gi, '');
	    	}

	    	var tmpObjId = '';
	    	if(pageObj != undefined && pageObj !== "undefined"){
	    		//console.log(i + " : " + pageObj);
	 			//check for duplicates; manipulate objective name if so (this may not work!!!!)
	 			tmpObjId = lessonIndictor +"."+
	 						encodeURIComponent(pageTitle.replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '').replace(/:/g, '')).replace('.', '')+"."+
	 						pageObj.replace(/\s+/g, '_').replace('.', '');

	    	}

	    	if(pageObjId != undefined && pageObjId !== "undefined"){
	    		if(tmpObjId.length > 0){
	    			tmpObjId += "." + pageObjId.replace(/\s+/g, '_').replace('.', '');
	    		}
	    		else{
		 			tmpObjId = lessonIndictor +"."+
	 						encodeURIComponent(pageTitle.replace("<![CDATA[", "").replace("]]>", "").replace(/\s+/g, '').replace(/:/g, '')).replace('.', '')+"."+
	 						pageObjId.replace(/\s+/g, '_').replace('.', '');
	    		}
	    	}

	    	if(tmpObjId.length > 0 ){
	    		tmpObjId += "_id";
	    		if(_this.objectives_arr.indexOf(tmpObjId) == -1){
	    			_this.objectives_arr.push(tmpObjId);
	    		}
	    		else{
	    			_this.objectives_arr.push(tmpObjId+i);
	    		}
	    	}

	    	_this._populateObjectivesArr(_pageCount, _etree, _lessonTitle, index+1);
	    }

	},

	_finalizeManifest: function(ilessonsName, iresourceLines, icompletionLines){
		var _this = this;

        var data, etree;

        etree = _this.courseData;

	    var choice = etree.find('.sequencing').get('choice');
	    var flow = etree.find('.sequencing').get('flow');
	    var forwardOnly = etree.find('.sequencing').get('forwardOnly');

		var _manifestFile = '';
		 //        //USSOCOM uses flow and choice control mode
   //      if(_this.scormVersion.indexOf('USSOCOM') != -1){
	  //       _manifestFile += "          <imsss:sequencing>\n";
			// _manifestFile += "		    	<imsss:controlMode choice=\"true\" flow=\"true\"/>\n";
			// _manifestFile += "		    </imsss:sequencing>\n";
   //      }
		//TODO: might have to not allow to set choice and flow both to false...
        if(choice === "false" || flow === "true" || forwardOnly === "true"){
        	_manifestFile += "          <imsss:sequencing>\n";
        	_manifestFile += "		    	<imsss:controlMode";
        	if(choice === "false"){
        		_manifestFile += " choice=\"false\"";
        	}
        	if(flow === "true"){
        		_manifestFile += " flow=\"true\"";
        	}
        	if(forwardOnly === "true"){
        		_manifestFile += " forwardOnly=\"true\"";
        	}
        	_manifestFile += " />\n";
        	_manifestFile += "		    </imsss:sequencing>\n";
        }

        _manifestFile += "       </organization>\n";
        _manifestFile += "    </organizations>\n";
		_manifestFile += "    <resources>\n";

		//have to add the resources here because the items all have to be added before the org can be closed
		for(var i=0; i<iresourceLines.length; i++){
			_manifestFile += "      <resource identifier=\"RES-"+ilessonsName[i].replace(/\s/g, "")+"-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\""+_this.binDir+"/"+encodeURIComponent(ilessonsName[i])+"/index.html\">\n";
			_manifestFile += iresourceLines[i];
			_manifestFile += '      </resource>\n';
		}

		//add resource for review res
		// if(_this.reviewLines != ''){
		// 	_manifestFile += "      <resource identifier=\"RES-Review-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\""+_this.binDir+"/Review-files/index.html\">\n";
		// 	_manifestFile += _this.reviewLines;
		// 	_manifestFile += '      </resource>\n';
		// }
		for (var i = _this.reviewLines_arr.length - 1; i >= 0; i--) {
			var reviewObj = _this.reviewLines_arr[i];
			_manifestFile += "      <resource identifier=\"RES-"+reviewObj.lesson.replace(/\s+/g, '')+"-Review-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\""+_this.binDir+"/"+encodeURIComponent(reviewObj.lesson)+"-Review-files/index.html\">\n";
			_manifestFile += reviewObj.lines;
			_manifestFile += '      </resource>\n';
		};

		//add resource for completion res
		if(icompletionLines != ''){
			//_manifestFile += "      <resource identifier=\"RES-completion-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\""+_this.binDir+"/completion-files/wrapper.html\">\n";
			_manifestFile += "      <resource identifier=\"RES-completion-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\""+_this.binDir+"/completion-files/certificate.html\">\n";			
			_manifestFile += icompletionLines;
			_manifestFile += '      </resource>\n';
		}

		var courseAttr = _this._parseCourseAttr();
		//temp add survey SCO to ussocom
		//if(_this.scormVersion.indexOf('USSOCOM') != -1){
        if(courseAttr.lms === "JKO" && courseAttr.survey === "true"){
	        //add completion  and survey files
			_manifestFile += "      <resource identifier=\"RES-survey-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\""+_this.binDir+"/survey/survey.html\">\n";
			_manifestFile += "			<file href=\""+_this.binDir+"/survey/survey.html\"/>\n";
			_manifestFile += '      </resource>\n';
		}

		_manifestFile += _this._jsResourceGenerator('cognizen/');
	    _manifestFile += '   </resources>\n';

		//Any sequencingCollections go here

		// //sequencingCollection for USSOCOM
		// if(_this.scormVersion.indexOf('USSOCOM') != -1){
		// 	_manifestFile += ' 	<imsss:sequencingCollection>\n';
		// 	_manifestFile += ' 		<imsss:sequencing ID = \"scampidl\">\n';
		// 	// Set all content SCOs to not count towards any rollup. Only the post test will count
		// 	_manifestFile += ' 			<imsss:rollupRules rollupObjectiveSatisfied=\"false\" rollupProgressCompletion=\"false\" objectiveMeasureWeight=\"0\"></imsss:rollupRules>\n';
		// 	_manifestFile += ' 			<imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n';
		// 	_manifestFile += ' 		</imsss:sequencing>\n';
		// 	_manifestFile += ' 	</imsss:sequencingCollection>\n';
		// }

    	_manifestFile += '</manifest>';
    	return _manifestFile;
	},

	_startManifest: function(){
		var _this = this;
        var data, etree;
        // data = fs.readFileSync(_courseXmlFile).toString();
        etree = _this.courseData;

	    var objectivesGlobalToSystem = etree.find('.sequencing').get('objectivesGlobalToSystem');

	   	var courseAttr = _this._parseCourseAttr();

	         

        var manifest;

	    manifest = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n';
        manifest += '<manifest identifier=\"'+ encodeURIComponent(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")) +'Course\" version=\"1.3\"\n';
        manifest += "	xmlns = \"http://www.imsglobal.org/xsd/imscp_v1p1\" \n"+
			"	xmlns:adlcp = \"http://www.adlnet.org/xsd/adlcp_v1p3\" \n"+
			"	xmlns:adlseq = \"http://www.adlnet.org/xsd/adlseq_v1p3\" \n"+
			"	xmlns:adlnav = \"http://www.adlnet.org/xsd/adlnav_v1p3\" \n"+
			"	xmlns:imsss = \"http://www.imsglobal.org/xsd/imsss\" \n"+
			"	xmlns:xsi = \"http://www.w3.org/2001/XMLSchema-instance\" \n"+
			"	xsi:schemaLocation = \"http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd\n"+
			"							http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd\n"+
			"							http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd\n"+
			"							http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd\n"+
			"							http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd\">\n";

	    if (_this.scormVersion === '2004_3rd' || _this.scormVersion === '2004_3rd_USSOCOM'){
	        manifest += "   <metadata>\n"+
	            "       <schema>ADL SCORM</schema>\n"+
	            "       <schemaversion>2004 3rd Edition</schemaversion>\n";
	    }
	    else if(_this.scormVersion === "2004_4th" || _this.scormVersion === '2004_4th_USSOCOM'){
	        manifest += "   <metadata>\n"+
	            "       <schema>ADL SCORM</schema>\n"+
	            "       <schemaversion>2004 4th Edition</schemaversion>\n";
	    }
	    else{
	    	// Courses currently can not be published to 1.2, probably remove else
	    }
	    if(courseAttr.lms === "NEL"){
	    	manifest += "		<adlcp:location>course_metadata.xml</adlcp:location>\n";
	    }  
	    manifest += "   </metadata>\n";
        manifest += "   <organizations default=\""+encodeURIComponent(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")) +"\">\n"+
            "       <organization identifier=\""+encodeURIComponent(_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, ""))+"\" structure=\"hierarchical\" ";
        //set objectivesGlobalToSystem based off of course.xml file
        if(objectivesGlobalToSystem === "true"){
        	manifest += ">\n";
        }
        else{
        	manifest += "adlseq:objectivesGlobalToSystem=\"false\">\n";
        }

        manifest += "           <title>"+_this.courseDisplayTitle+"</title>\n";

	    return manifest;
	},

	_add2004Item: function(lessonName, lessonTitle, lessonCount, totalLessons){
		var _this = this;
		var lessonNameTrim = lessonName.replace(/\s+/g, '');
		//console.log(lessonNameTrim);
	    var courseObj = _this._parseCourseItem(lessonNameTrim);
	    var mySeq = courseObj.sequencing;
	    var mySeqRules = courseObj.sequencingRules;
	    var itemSeq = {
			//choice: (mySeq.get('choice') === 'true'),
			//flow: (mySeq.get('flow') === 'true'),
			//forwardOnly: (mySeq.get('forwardOnly') === 'true'),
			choiceExit: (mySeq.get('choiceExit') === 'true'),
	    	previous: (mySeq.get('previous') === 'true'),
			continue: (mySeq.get('continue') === 'true'),
			exit: (mySeq.get('exit') === 'true'),
			exitAll: (mySeq.get('exitAll') === 'true'),
			abandon: (mySeq.get('abandon') === 'true'),
			abandonAll: (mySeq.get('abandonAll') === 'true'),
			suspendAll: (mySeq.get('suspendAll') === 'true'),
			rollupObjectiveSatisfied: (mySeq.get('rollupObjectiveSatisfied') === 'true'),
			rollupProgressCompletion: (mySeq.get('rollupProgressCompletion') === 'true'),
			rollupObjectiveMeasureWeight: mySeq.get('rollupObjectiveMeasureWeight'),
			tracked: (mySeq.get('tracked') === 'true'),
			completionSetByContent: (mySeq.get('completionSetByContent') === 'true'),
			objectiveSetByContent: (mySeq.get('objectiveSetByContent') === 'true'),
			testReview: (mySeq.get("testReview") === 'true')
		};

		if(mySeqRules.findall('.notattempthidden').length != 0){
			itemSeq["notAttemptHidden"] = (mySeqRules.find('.notattempthidden').get('value') === 'true');
		}
		else{
			itemSeq["notAttemptHidden"] = false;
		}


        var item = "           <item identifier=\""+lessonNameTrim+"_id\" identifierref=\"RES-"+lessonNameTrim+"-files\">\n"+
            "               <title>"+lessonTitle+"</title>\n";

        //setting LMS UI hide controls
         if(itemSeq.previous || itemSeq.continue || itemSeq.exit || itemSeq.exitAll ||
         	itemSeq.abandon || itemSeq.abandonAll || itemSeq.suspendAll ){

         	item += "               <adlnav:presentation>\n"+
            		"                   <adlnav:navigationInterface>\n";

            if(itemSeq.previous){
            	item += "                       <adlnav:hideLMSUI>previous</adlnav:hideLMSUI>\n";
            }
            if(itemSeq.continue){
            	item += "                       <adlnav:hideLMSUI>continue</adlnav:hideLMSUI>\n";
            }
            if(itemSeq.exit){
            	item += "                       <adlnav:hideLMSUI>exit</adlnav:hideLMSUI>\n";
            }
            if(itemSeq.exitAll){
            	item += "                       <adlnav:hideLMSUI>exitAll</adlnav:hideLMSUI>\n";
            }
            if(itemSeq.abandon){
            	item += "                       <adlnav:hideLMSUI>abandon</adlnav:hideLMSUI>\n";
            }
            if(itemSeq.abandonAll){
            	item += "                       <adlnav:hideLMSUI>abandonAll</adlnav:hideLMSUI>\n";
            }
            if(itemSeq.suspendAll){
            	item += "                       <adlnav:hideLMSUI>suspendAll</adlnav:hideLMSUI>\n";
            }

	        item += "                   </adlnav:navigationInterface>\n"+
		            "               </adlnav:presentation>\n";
         }

		item += "               <imsss:sequencing>\n";

        //setting controle modes
        //if(!itemSeq.choice || itemSeq.flow || itemSeq.forwardOnly || !itemSeq.choiceExit){
        if(!itemSeq.choicExit){
        	item += "		          <imsss:controlMode";
        	 // if(!itemSeq.choice){
        	 // 	item += " choice=\"false\"";
        	 // }
        	 // if(itemSeq.flow){
        	 // 	item += " flow=\"true\"";
        	 // }
        	 // if(itemSeq.forwardOnly){
        	 // 	item += " forwardOnly=\"true\"";
        	 // }
        	 if(!itemSeq.choiceExit){
        	 	item += " choiceExit=\"false\"";
        	 }
        	item += " />\n";
        }

        //setting sequencing rules
        if(itemSeq.notAttemptHidden){
			item +="        			  <imsss:sequencingRules>\n"+
					"	                    <imsss:preConditionRule>\n"+
					"	                        <imsss:ruleConditions conditionCombination=\"any\">\n"+
					"	                          	<imsss:ruleCondition operator=\"not\" condition=\"attempted\"/>\n"+
					"	                        </imsss:ruleConditions>\n"+
					"	                        <imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
					"	                    </imsss:preConditionRule>\n"+
					"	              </imsss:sequencingRules> \n";
        }
        //setting limitConditions

        //setting rollupRules
        if(!itemSeq.rollupObjectiveSatisfied || !itemSeq.rollupProgressCompletion || itemSeq.rollupObjectiveMeasureWeight != "1.0"){
        	item += "		           <imsss:rollupRules";
        	if(!itemSeq.rollupObjectiveSatisfied){
        		item += " rollupObjectiveSatisfied=\"false\"";
        	}
        	if(!itemSeq.rollupProgressCompletion){
        		item += " rollupProgressCompletion=\"false\"";
        	}
        	if(itemSeq.rollupObjectiveMeasureWeight != "1.0" ){
        		item += " objectiveMeasureWeight=\""+itemSeq.rollupObjectiveMeasureWeight+"\"";
        	}
        	item += " ></imsss:rollupRules>\n";
        }


        //setting objectives
        //any objectives stuff goes here - objectivesGenerator
        if(_this.objectives_arr.length > 0){
        	item += _this._objectivesGenerator(lessonNameTrim);
        }
        else{
        	//#3604 all items get a primary objective
	        var courseAttr = _this._parseCourseAttr();

	        if(courseAttr.lms === "JKO"){   
				item += "                  <imsss:objectives>\n"+
				"                    	<imsss:primaryObjective /> \n"+
	        	"                    	<imsss:objective objectiveID=\""+lessonNameTrim+"_satisfied\">\n"+
	            "                    		<imsss:mapInfo targetObjectiveID=\""+_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")+"."+lessonNameTrim+"_satisfied\"\n"+
	            "                    					readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\"/>\n"+
	            "                    	</imsss:objective>\n"+			
				"	          	   </imsss:objectives>\n";	  

	        }
	        else{
	        item += "                  <imsss:objectives>\n"+
	        "                      <imsss:primaryObjective objectiveID=\""+lessonNameTrim+"_satisfied\">\n"+
	        "						  <imsss:mapInfo targetObjectiveID=\""+_this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "")+"."+lessonNameTrim+
	        "_satisfied\"\n readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\" writeNormalizedMeasure=\"true\"/>\n"+
	        "					   </imsss:primaryObjective>\n"+
	        "	          	   </imsss:objectives>\n";	  		        	
	        }     	
        }

        //setting delivery controls
        if(!itemSeq.tracked || itemSeq.completionSetByContent || itemSeq.objectiveSetByContent){
        	item += "	          		<imsss:deliveryControls";

        	if(!itemSeq.tracked){
        		item += " tracked=\"false\"";
        	}
        	if(itemSeq.completionSetByContent){
        		item += " completionSetByContent=\"true\"";
        	}
        	if(itemSeq.objectiveSetByContent){
        		item += " objectiveSetByContent=\"true\"";
        	}
        	item += " />\n";
        }



		item += "	        	  </imsss:sequencing>\n";
        item += "           </item>\n";

        if(itemSeq.testReview){
			item += "             <item identifier=\""+lessonNameTrim+"After_id\" identifierref=\"RES-"+lessonNameTrim+"-Review-files\">\n"+// isvisible=\"false\">\n"+
			"                 <title>"+lessonName+" Review</title>\n"+
			"                 <adlnav:presentation>\n"+
			"                     <adlnav:navigationInterface>\n"+
			"                         <adlnav:hideLMSUI>abandon</adlnav:hideLMSUI>\n"+
			"                         <adlnav:hideLMSUI>abandonAll</adlnav:hideLMSUI>\n"+
			"                     </adlnav:navigationInterface>\n"+
			"                 </adlnav:presentation>\n"+
			"                 <imsss:sequencing>\n"+
			"					 <imsss:sequencingRules>\n"+
		    "                    	<imsss:preConditionRule>\n"+
		    "                          	<imsss:ruleConditions conditionCombination=\"any\">\n"+
		    "                          		<imsss:ruleCondition operator=\"not\" condition=\"attempted\"/>\n"+
		    "                        	</imsss:ruleConditions>\n"+
		    "                        	<imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
		    "                    	</imsss:preConditionRule>\n";
			// "                    	 <imsss:preConditionRule>\n"+
			// "                         	<imsss:ruleConditions conditionCombination=\"any\">\n"+
			// //"                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"satisfied\"/>\n"+
			// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
			// "                         	</imsss:ruleConditions>\n"+
			// "                         	<imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
			// "                     	</imsss:preConditionRule>\n"+
			// "                    	 <imsss:preConditionRule>\n"+
			// "                         	<imsss:ruleConditions conditionCombination=\"any\">\n"+
			// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" condition=\"satisfied\"/>\n"+
			// //"                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
			// "                         	</imsss:ruleConditions>\n"+
			// "                         	<imsss:ruleAction action=\"skip\"/>\n"+
			// "                     	</imsss:preConditionRule>\n"+
			item +="                     </imsss:sequencingRules>\n"+
			"  	          		  <imsss:rollupRules rollupObjectiveSatisfied=\"true\" rollupProgressCompletion=\"true\" objectiveMeasureWeight=\"0\"></imsss:rollupRules>\n"+
			"                     <imsss:objectives>\n"+
			"                         <imsss:primaryObjective />\n"+
			"                     	  <imsss:objective objectiveID=\"" + lessonNameTrim + "_satisfied\">\n"+
			"							<imsss:mapInfo targetObjectiveID=\"" + _this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "") + "." + lessonNameTrim + "_satisfied\"\n"+
			"                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\"/>\n"+
			"                     	  </imsss:objective>\n";
			// "			            <imsss:objective objectiveID=\"previous_sco_satisfied\">\n"+
			// "		                	<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + lessonNameTrim+ "_satisfied\"\n"+
			// "	                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
			// "	            		</imsss:objective>\n";
	        //any objectives stuff goes here - secondaryObjectivesGenerator
	        if(_this.objectives_arr.length > 0){
	        	item += _this._secondaryObjectivesGenerator();
	        }
			item += "	          		 </imsss:objectives>\n"+
			"  	          		  <imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n"+
			"                 </imsss:sequencing>\n"+
			"             </item>\n";

        }

        return item;

	},

	_parseCourseItem: function(lessonNameTrim){
        var _this = this;
        etree = _this.courseData;

	    //var objectivesGlobalToSystem = etree.find('.sequencing').get('objectivesGlobalToSystem');
	    var itemCount = etree.findall('./item').length;
	    var mySeq;
	    var mySeqRules;
	    for (var i = 0; i < itemCount; i++) {
	    	var myNode = etree.findall('./item')[i];
	    	var itemName = myNode.get('name').replace(/\s+/g, '');
	    	if(itemName === lessonNameTrim){
	    		mySeq = myNode.find('.sequencing');
	    		mySeqRules = myNode.find('.sequencing/sequencingRules');
	    		break;
	    	}
	    }
	    //var itemElements = {sequencing: mySeq, sequencingRules: mySeqRules};
	    return {sequencing: mySeq, sequencingRules: mySeqRules};

	},

	_parseCourseAttr: function(){
		var _this = this;
		var myNode = _this.courseData.getroot();
		var courseAttr = {
			id : myNode.get('id'),
			name : myNode.get('name'),
			lms : myNode.get('lms'),
			survey : myNode.get('survey'),
			certificate : myNode.get('certificate'),
			displaytitle : myNode.get('coursedisplaytitle')
		};

		return courseAttr;
	},

	_addUSSOCOMExtra: function(lessonName){
		var _this = this;
		var lessonNameTrim = lessonName.replace(/\s+/g, '');
		var courseNameTrim = _this.courseName.replace(/\s+/g, '').replace(/\(|\)/g, "");
        var item = "           <item identifier=\""+lessonNameTrim+"_id\" identifierref=\"RES-"+lessonNameTrim+"-files\" >\n"+
            "               <title>"+lessonName+"</title>\n"+
            "               <adlnav:presentation>\n"+
            "                   <adlnav:navigationInterface>\n"+
            // "                       <adlnav:hideLMSUI>continue</adlnav:hideLMSUI>\n"+
            // "                       <adlnav:hideLMSUI>previous</adlnav:hideLMSUI>\n"+
            //"                       <adlnav:hideLMSUI>exit</adlnav:hideLMSUI>\n"+
            //"                       <adlnav:hideLMSUI>exitAll</adlnav:hideLMSUI>\n"+
            "                       <adlnav:hideLMSUI>abandon</adlnav:hideLMSUI>\n"+
            "                       <adlnav:hideLMSUI>abandonAll</adlnav:hideLMSUI>\n"+
        	"                   </adlnav:navigationInterface>\n"+
            "               </adlnav:presentation>\n"+
			"				<imsss:sequencing>\n"+
		    "                  <imsss:sequencingRules>\n"+
		    "                     <imsss:preConditionRule>\n"+
		    "                        <imsss:ruleConditions conditionCombination=\"any\">\n"+
		    "                           <imsss:ruleCondition operator=\"not\" condition=\"attempted\"/>\n"+
		    "                        </imsss:ruleConditions>\n"+
		    "                        <imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
		    "                     </imsss:preConditionRule>\n"+
		    "                  </imsss:sequencingRules>	\n"+
			'				   <imsss:rollupRules objectiveMeasureWeight=\"0\"></imsss:rollupRules>\n';
			if(lessonNameTrim === "completion"){
				item += "                  <imsss:objectives>\n"+
				"                    	<imsss:primaryObjective /> \n"+
	        	"                    	<imsss:objective objectiveID=\"" + lessonNameTrim + "_satisfied\">\n"+
	            "                    		<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + lessonNameTrim + "_satisfied\"\n"+
	            "                    					readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\"/>\n"+
	            "                    	</imsss:objective>\n"+					
				"	          	   </imsss:objectives>\n";
			}			
			item += "		  	   </imsss:sequencing>\n";
   //      	"		            <imsss:sequencingRules>\n"+
			// "                     <imsss:preConditionRule>\n"+
			// "                         <imsss:ruleConditions conditionCombination=\"any\">\n"+
			// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"satisfied\"/>\n"+
			// "                             <imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
			// "                         </imsss:ruleConditions>\n"+
			// "                         <imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
			// "                     </imsss:preConditionRule>\n"+
   //          "		   	        	<imsss:postConditionRule>\n"+
   //          "	         		    	<imsss:ruleConditions conditionCombination=\"all\">\n"+
			// "								<imsss:ruleCondition operator=\"not\" condition=\"completed\"/>\n"+
   //          "             		    	</imsss:ruleConditions>\n"+
   //          "       	      		   	<imsss:ruleAction action=\"retry\"/>\n"+
   //          "		       	    	</imsss:postConditionRule>\n"+
   //          "     		   		</imsss:sequencingRules>\n"+
			// "                 <imsss:objectives>\n"+
			// "                     <imsss:primaryObjective/>\n"+
			// "                     <imsss:objective objectiveID=\"previous_sco_satisfied\">\n"+
			// "                         <imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + _this.previousLesson + "_satisfied\"\n"+
			// "                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
			// "                     </imsss:objective>\n"+
			// "                 </imsss:objectives>\n"+
           	//item += "		  	   </imsss:sequencing>\n"+
        	item +="           </item>\n";
        return item;
	},

	_addResources: function(res, lesson){
		var _this = this;
		var resourceLine = '';
	    var resources = _this._resourcesGenerator(res, lesson);

	    for (var i = 0; i < resources.length; i++) {
	    	resourceLine += resources[i];
	    };

	    return resourceLine;
	},

	_resourcesGenerator: function(res, lesson){
		var _this = this;
		var resources = [];
	    res.files.forEach(function(file) {
	        var fileName = file.path.split("\\");
	        //does not include files that don't have an "." ext, directories
	        if(fileName[fileName.length-1].indexOf('.') !== -1 && fileName.indexOf('packages') == -1){
	        	var fullPath = lesson+encodeURIComponent(file.path.replace(/\\/g,"/"));
	            resources.push("         <file href=\"" +_this.binDir+ "/"+fullPath.replace(/\s+/g, '%20')+"\"/>\n");
	        }
	    });

	    if(lesson.indexOf("Review-files") != -1){
	    	var warningIcon = lesson + "media/cognizen_warning_icon.png";
	    	resources.push("         <file href=\"" +_this.binDir+ "/"+warningIcon+"\"/>\n");
	    }
	    else if(lesson.indexOf("completion-files") != -1){
            resources.push("         <file href=\"" +_this.binDir+'/compjs/APIWrapper.js'+"\"/>\n");
            resources.push("         <file href=\"" +_this.binDir+'/compjs/common.js'+"\"/>\n");	
            resources.push("         <file href=\"" +_this.binDir+'/compjs/flashobject.js'+"\"/>\n");	
            resources.push("         <file href=\"" +_this.binDir+'/compjs/KnowledgeCheck.js'+"\"/>\n");	
            resources.push("         <file href=\"" +_this.binDir+'/compjs/prototype.js'+"\"/>\n");	
            resources.push("         <file href=\"" +_this.binDir+'/compjs/soundmanager2-nodebug-jsmin.js'+"\"/>\n");	    	
	    }
		resources.push("         <dependency identifierref=\"RES-js-files\"/>\n");
	    return resources;
	},

	_jsResourceGenerator : function(_prefix){
		var _this = this;
		var resource =  "      <resource identifier=\"RES-js-files\" type=\"webcontent\" "; 
		//fix for bug#3214
		if(_this.scormVersion.indexOf('2004') != -1){
			resource += "adlcp:scormType=\"asset\">\n";
		}
		else{
			resource += "adlcp:scormtype=\"asset\">\n";
		}
        //add js directory to resources
        _this.logger.info("CONTENTPATH " + _this.contentPath);

		for (var i = 0; i < _this.jsResources_arr.length; i++) {
		    resource += "		<file href=\""+_prefix+"js/"+_this.jsResources_arr[i]+"\"/>\n";
		};

		for (var j =0; j < _this.cssResources_arr.length; j++) {
			resource += "		<file href=\""+_prefix+"css/"+_this.cssResources_arr[j]+"\"/>\n";
		}

		for (var k =0; k < _this.cssCourseResources_arr.length; k++) {
			resource += "		<file href=\""+_prefix+"css/"+_this.cssCourseResources_arr[k]+"\"/>\n";
		}

		//added course.xml file here, figured it would cover it
		resource += "				<file href=\""+_prefix+"course.xml\"/>\n";
        resource += "		</resource>\n";
        //_this.logger.info(resource);
        return resource;
	},

	_removeTempFiles: function(lArray){
		var _this = this;
		var contentFiles = [];
		for (var i = 0; i < lArray.length; i++) {
			contentFiles.push(_this.packageFolder +i+'content.xml');
		};
		for (var i = 0; i < contentFiles.length; i++) {
			try
			{
				fs.removeSync(contentFiles[i]);
			}
			catch(err)
			{
				_this.logger.error("Error removing " + contentFiles[i] +" : " + err);
			}
		};
		// fs.remove(contentFiles[index], function(err){
		// 	if(err){
		// 		_this.logger.error(err);
		// 		callback(err);
		// 	}
		// 	_this.logger.info("removed : " + contentFiles[index]);
		// 	if(index+1 != contentFiles.length){
		// 		_this._removeTempFiles(contentFiles, index+1, callback);
		// 	}
		// 	else{
		// 		callback(null);
		// 	}
		// });
	},
	_createNoneIndex: function(lArray, lessonsName){
		var _this = this;

		var index = '<!DOCTYPE html>\n'+
		'<html>\n'+
		'	<head>\n'+
		'		<meta name=\"HandheldFriendly\" content=\"true\" />\n'+
		'		<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n'+
		'		<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n'+
		'		<title>'+_this.courseName +'</title>\n'+
		'	</head>\n'+
		'	<body>\n'+
		'		<h2>'+_this.courseName+'</h2>\n'+
		'		<ul>\n';
		for(var j=0; j<lArray.length; j++){
			index += '<li><a href=\"'+lessonsName[j]+'/index.html\">'+lessonsName[j]+'</a></li>\n';
		}
		index += '		</ul>\n'+
		'	</body>\n'+
		'</html>';

		return index;

	}


};

module.exports = SCORM;