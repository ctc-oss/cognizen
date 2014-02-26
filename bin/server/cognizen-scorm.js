var fs = require('fs-extra');
var et = require('elementtree');
var readdirp = require('readdirp');
var archiver = require('archiver');

var SCORM = {
    logger: {},
    scormPath: '',
    contentPath: '',
    xmlContentFile: '',
    scormVersion: '',
    courseName: '',
    packageFolder: '',
    tempXmlContentFile: '',
    binDir: 'bin',
    previousLesson: '',
    init: function(logger, ScormPath, ContentPath, XmlContentPath, Found, ScormVersion) {
        this.logger = logger;
        this.scormPath = ScormPath;
        this.contentPath = ContentPath;
        this.xmlContentFile = XmlContentPath;
        this.found = Found;
        this.scormVersion = ScormVersion;
        return this;
    },

	generateSCORMLesson: function(callback){
        var _this = this;
        //handle if scormVersion = none...

        if(_this.scormVersion === '2004_SGST'){
        	_this.binDir = "bin2";
        }
        else
        {
        	_this.binDir = "bin";
        }

        readdirp(
            { root: _this.contentPath,
                directoryFilter: [ '!server', '!scorm', '!.git'],
                fileFilter: [ '!.*' ] }
            , function(fileInfo) {
                //console.log("---------------------------------------------------------" + fileInfo);
            }
            , function (err, res) {

            	//copy content.xml file to temp location
            	_this.packageFolder = _this.contentPath + '/packages/';
            	_this.tempXmlContentFile = _this.packageFolder + 'content.xml';
            	fs.copy(_this.xmlContentFile, _this.tempXmlContentFile, function(err){
            		if(err){
            			_this.logger.error("Error copying content.xml file " + err);
            			callback(err, null);
            		}
            		_this.logger.info('content.xml file copied success');

			        var data, etree;

			        fs.readFile(_this.tempXmlContentFile, function(err, data){
			        	if(err){
			        		_this.logger.error("Error reading temp content.xml file " + err);
            				callback(err, null);
			        	}

			        	data = data.toString();
				        etree = et.parse(data);

				        //set mode to production and scorm version in temp content.xml
		                etree.find('./courseInfo/preferences/mode').set('value','production');
		                etree.find('./courseInfo/preferences/scormVersion').set('value', _this.scormVersion);	
		                etree.find('./courseInfo/preferences/finalLesson').set('value','true');
		                var xml = etree.write({'xml_decleration': false});
		                fs.outputFile(_this.tempXmlContentFile, xml, function (err) {
		                    if (err) callback(err, null);
		                });		                	        
					    
					    _this.courseName = etree.find('.courseInfo/preferences/lessonTitle').get('value');
		                var manifestFile = _this._populateManifest(res);

		                var scormBasePath = _this.scormPath + '/' + _this.scormVersion + '/';

		                //catch for SGST - use 2004_3rd files
		                if(_this.scormVersion === '2004_SGST'){
		                	scormBasePath = _this.scormPath + '/2004_3rd/';
		                }

		                var imsManifestFilePath = scormBasePath + 'imsmanifest.xml';

		                fs.writeFile(imsManifestFilePath, manifestFile, function(err) {
		                    if(err) {
		                        _this.logger.error("Write file error" + err);
		                        callback(err, null);
		                    }
		                    else {
		                    	_this._zipScormPackage(callback, res, scormBasePath, imsManifestFilePath);

		                    }
		                    fs.remove(imsManifestFilePath, function(err){
								if(err) return _this.logger.error(err);
								_this.logger.info('imsmanifest.xml file removed.');
							});
							fs.remove(_this.tempXmlContentFile, function(err){
								if(err) return _this.logger.error(err);
								_this.logger.info('temp content.xml file removed.');
							})
		                });			        	
			        });


            	});

            }
        );
	//end of generateSCORMLesson
	},

	//probably need to pass lessons into (maybe during init)
	generateSCORMCourse: function(callback){
        var _this = this;

        var manifestFile = '';
        var resourceLines = [];
        var lessonsArray = [];
        var lessonsName = [];

        for(var i=0; i<_this.found.lessons.length; i++){
            var obj = _this.found.lessons[i];
            var lessonPath = _this.contentPath + "/" + obj.name;
            lessonsArray.push(lessonPath); 	                            
        } 
        var data, etree;
        var lessonXmlContentFile = lessonsArray[0] + '/xml/content.xml';
        data = fs.readFileSync(lessonXmlContentFile).toString();
        etree = et.parse(data);

	    _this.courseName = etree.find('.courseInfo/preferences/courseTitle').get('value');

	    manifestFile = _this._startManifest();				    	

        var scormFileVersion = _this.scormVersion.replace(/\./, '_');
        _this.packageFolder = _this.contentPath + '/packages/';
        var outputFile = _this.packageFolder + _this.courseName.replace(/\s+/g, '')+'_'+scormFileVersion+'.zip';
        var output = fs.createWriteStream(outputFile);
        var archive = archiver('zip');

        archive.on('error', function(err) {
            throw err;
        });

        archive.pipe(output);

	    _this._recurseLessons(callback, 0, lessonsArray, manifestFile, resourceLines, lessonsName, archive, outputFile);

    //end of generateSCORMCourse    
	},

	_recurseLessons: function(callback, count, lArray, manifestFile, resourceLines, lessonsName, archive, outputFile){
		var _this = this;
		var _lessonPath = lArray[count];
		console.log(_lessonPath);
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
            	_this.tempXmlContentFile = _this.packageFolder +count+'content.xml';

            	fs.copy(lessonXmlContentFile, _this.tempXmlContentFile, function(err){
            		if(err){
            			_this.logger.error("Error copying content.xml file " + err);
            			callback(err, null);
            		}
            		_this.logger.info('content.xml file copied success');	

			        fs.readFile(_this.tempXmlContentFile, function(err, data){
			        	if(err){
			        		_this.logger.error("Error reading temp content.xml file " + err);
            				callback(err, null);
			        	}
			        	data = data.toString();
				        etree = et.parse(data);

				        //set mode to production and scorm version in temp content.xml
		                etree.find('./courseInfo/preferences/mode').set('value','production');
		                etree.find('./courseInfo/preferences/scormVersion').set('value', _this.scormVersion);
		                if(count+1 == lArray.length){
		                	etree.find('./courseInfo/preferences/finalLesson').set('value','true');	
		                }
		                var xml = etree.write({'xml_decleration': false});
		                fs.outputFile(_this.tempXmlContentFile, xml, function (err) {
		                    if (err) callback(err, null);
		                });	
   	
		                //add item & item sequencing (objectives)
		                lessonsName.push(etree.find('.courseInfo/preferences/lessonTitle').get('value'));
		                manifestFile += _this._add2004Item(lessonsName[count], count, lArray.length);

		                //add resources
		                resourceLines.push(_this._addResources(res, lessonsName[count]+'/'));
				        //builds the bin directory
				        res.files.forEach(function(file) {
				            var localFile = file.path.replace(/\\/g,"/");
				            if(localFile.indexOf('content.xml') == -1 ){
				            	var inputFile = _lessonPath + '/' + localFile;
				            	archive.append(fs.createReadStream(inputFile), { name: 'bin/'+lessonsName[count]+'/'+localFile });
				        	}
				        });

		                if(count+1 == lArray.length){
					        if(manifestFile != ''){
						        //sequencing rules for the course go here

						        //USSOCOM uses flow and choice control mode
						        if(_this.scormVersion === '2004_USSOCOM'){
							        manifestFile += "       <imsss:sequencing>\n";
	             					manifestFile += "		   <imsss:controlMode choice=\"true\" flow=\"true\"/>\n";
	           						manifestFile += "		</imsss:sequencing>\n"; 						        	
						        }
   
						        manifestFile += "       </organization>\n";
						        manifestFile += "    </organizations>\n";
								manifestFile += "    <resources>\n";

								//have to add the resources here because the items all have to be added before the org can be closed
								for(var i=0; i<resourceLines.length; i++){
									manifestFile += "      <resource identifier=\"RES-"+lessonsName[i].replace(/\s/g, "")+"-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\"bin/"+encodeURIComponent(lessonsName[i])+"/index.html\">\n";
									manifestFile += resourceLines[i];
									manifestFile += '      </resource>\n';
								}				    
							    manifestFile += '   </resources>\n';
								
								//Any sequencingCollections go here

								//sequencingCollection for USSOCOM 
								if(_this.scormVersion === '2004_USSOCOM'){
									manifestFile += ' 	<imsss:sequencingCollection>\n';
									manifestFile += ' 		<imsss:sequencing ID = \"scampidl\">\n';
									// Set all content SCOs to not count towards any rollup. Only the post test will count
									manifestFile += ' 			<imsss:rollupRules rollupObjectiveSatisfied=\"false\" rollupProgressCompletion=\"false\" objectiveMeasureWeight=\"0\"></imsss:rollupRules>\n';
									manifestFile += ' 			<imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n';
									manifestFile += ' 		</imsss:sequencing>\n';
									manifestFile += ' 	</imsss:sequencingCollection>\n';  
								}

						    	manifestFile += '</manifest>';	

					        }
					        else{
					        	callback("no manifestFile", null);
					        }                	

					        var scormBasePath = _this.scormPath + '/' + _this.scormVersion + '/';

					        //USSOCOM publishing uses 2004 4th edition SCORM files
					        if(_this.scormVersion === '2004_USSOCOM'){
					        	scormBasePath = _this.scormPath + '/2004_4th/'; 
					        }
					        var imsManifestFilePath = scormBasePath + 'imsmanifest.xml';

					        fs.writeFile(imsManifestFilePath, manifestFile, function(err) {
					            if(err) {
					                _this.logger.error("Write file error" + err);
					                callback(err, null);
					            }
					            else {

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

							        //add imsmanifest.xml file
							        archive.append(fs.createReadStream(imsManifestFilePath), { name: 'imsmanifest.xml'});
				        			//adds temp content.xml file to zip
				        			for(var j=0; j<lArray.length; j++){
				        				archive.append(fs.createReadStream(_this.packageFolder +j+'content.xml'), { name: 'bin/'+lessonsName[j]+'/xml/content.xml'});	
				        			}
							        
							        archive.finalize(function(err, written) {
							            if (err) {
							                callback(err, null);
							            }
							            //tells the engine that it is done writing the zip file
							            callback(null, outputFile);
							            _this.logger.debug("packageFolder = " + outputFile);

							        });				            	

					            }
					            fs.remove(imsManifestFilePath, function(err){
									if(err) return _this.logger.error(err);
									_this.logger.info('imsmanifest.xml file removed.');
								});
								//remove temp content.xml files
								for (var i = 0; i < lArray.length; i++) {
									fs.remove(_this.packageFolder +i+'content.xml', function(err){
										if(err) return _this.logger.error(err);
									});	
								};

					        });

		                }
		                else{
			    			_this._recurseLessons(callback, count+1, lArray, manifestFile, resourceLines, lessonsName, archive, outputFile);
		                }	                			        	

			        });            		

		        });        
		            			        
            }
        ); 

	},

	_startManifest: function(){
		var _this = this;
        var manifest;

	    manifest = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n';

	    if (_this.scormVersion === '2004_3rd'){
	        manifest += '<manifest identifier=\"'+ _this.courseName.replace(/\s+/g, '') +'Course\" version=\"1.3\"\n';
	        manifest += "   xmlns=\"http://www.imsglobal.org/xsd/imscp_v1p1\"\n"+
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
	            "   </metadata>\n";
	        manifest += "   <organizations default=\""+_this.courseName.replace(/\s+/g, '') +"\">\n"+
	            "       <organization identifier=\""+_this.courseName.replace(/\s+/g, '')+"\" structure=\"hierarchical\">\n"+
	            "           <title>"+_this.courseName+"</title>\n";

	    }
	    else if(_this.scormVersion === "2004_4th" || _this.scormVersion === '2004_USSOCOM'){
	        manifest += '<manifest identifier=\"'+ _this.courseName.replace(/\s+/g, '') +'Course\" version=\"1.3\"\n';
	        manifest += "   xmlns=\"http://www.imsglobal.org/xsd/imscp_v1p1\"\n"+
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
	            "   </metadata>\n";
	        manifest += "   <organizations default=\""+_this.courseName.replace(/\s+/g, '') +"\">\n"+
	            "       <organization identifier=\""+_this.courseName.replace(/\s+/g, '')+"\" structure=\"hierarchical\">\n"+
	            "           <title>"+_this.courseName+"</title>\n";
	    }
	    else{
	    	// Courses currently can not be published to 1.2, probably remove else

	    }	    

	    return manifest;
	},

	_add2004Item: function(lessonName, lessonCount, totalLessons){
		var _this = this;
		var lessonNameTrim = lessonName.replace(/\s+/g, '');

        var item = "           <item identifier=\""+lessonNameTrim+"_id\" identifierref=\"RES-"+lessonNameTrim+"-files\">\n"+
            "               <title>"+lessonName+"</title>\n"+
            "               <adlnav:presentation>\n"+
            "                   <adlnav:navigationInterface>\n"+
            "                       <adlnav:hideLMSUI>continue</adlnav:hideLMSUI>\n"+
            "                       <adlnav:hideLMSUI>previous</adlnav:hideLMSUI>\n"+
            //"                       <adlnav:hideLMSUI>exit</adlnav:hideLMSUI>\n"+
            //"                       <adlnav:hideLMSUI>exitAll</adlnav:hideLMSUI>\n"+
            "                       <adlnav:hideLMSUI>abandon</adlnav:hideLMSUI>\n"+
            "                       <adlnav:hideLMSUI>abandonAll</adlnav:hideLMSUI>\n"+
            //"                       <adlnav:hideLMSUI>suspendAll</adlnav:hideLMSUI>\n"+
            "                   </adlnav:navigationInterface>\n"+
            "               </adlnav:presentation>\n";
        item += _this._add2004ItemSeq(lessonNameTrim, lessonCount, totalLessons);    
        item += "           </item>\n";

        return item;

	},

	_add2004ItemSeq: function(lessonId, lessonCount, totalLessons){
		var _this = this;
		var seq = "";
		var courseNameTrim = _this.courseName.replace(/\s+/g, ''); 
		// //any objectives stuff goes here - objectivesGenerator

		//seq rules for USSOCOM
		if(_this.scormVersion === '2004_USSOCOM'){
			//all of the items except the last one (post test) get IDRef to sequencingCollection "scampidl"
			if(lessonCount + 1 == totalLessons){
				//sequencing elements for the post test
				seq += "               <imsss:sequencing>\n"+
					"        			<imsss:sequencingRules>\n"+
					"	            		<imsss:preConditionRule>\n"+
					"		   	                <imsss:ruleConditions conditionCombination=\"any\">\n"+
					"	                			<imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"satisfied\"/>\n"+
					"	                			<imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
					"			                </imsss:ruleConditions>\n"+
					"	              			<imsss:ruleAction action=\"hiddenFromChoice\"/>\n"+
					"			            </imsss:preConditionRule>\n"+
					"		            </imsss:sequencingRules>\n"+
					//handles the score from the post test to be the only activity that counts towards rollup so that the course (these defaults and don't have to be included)					          
					"	          		<imsss:rollupRules rollupObjectiveSatisfied=\"true\" rollupProgressCompletion=\"true\" objectiveMeasureWeight=\"1\"></imsss:rollupRules>\n"+
					"	   	            <imsss:objectives>\n"+
					"			            <imsss:primaryObjective objectiveID=\"" + lessonId + "_satisfied\" />\n"+
					"			            <imsss:objective objectiveID=\"previous_sco_satisfied\">\n"+
					"		                	<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + _this.previousLesson + "_satisfied\"\n"+
					"	                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
					"	            		</imsss:objective>\n"+
					"	          		</imsss:objectives>\n"+
					"	          		<imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n"+
					"	        	</imsss:sequencing>\n";				
			}
			else{
				seq += "               <imsss:sequencing IDRef = \"scampidl\">\n";
				//first SCO, there is not preivous SCO to track
				if(lessonCount == 0){
					seq +="	   	            <imsss:objectives>\n"+
					"			            <imsss:primaryObjective objectiveID=\"" + lessonId + "_satisfied\">\n"+
					"		                	<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + lessonId + "_satisfied\"\n"+
					"	                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\"/>\n"+
					"	            		</imsss:primaryObjective>\n"+
					"	          		</imsss:objectives>\n"+	
					"	        	</imsss:sequencing>\n";										
				}
				else{
					seq +="        			<imsss:sequencingRules>\n"+
					"	            		<imsss:preConditionRule>\n"+
					"		   	                <imsss:ruleConditions conditionCombination=\"any\">\n"+
					"	                			<imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"satisfied\"/>\n"+
					"	                			<imsss:ruleCondition referencedObjective=\"previous_sco_satisfied\" operator=\"not\" condition=\"objectiveStatusKnown\"/>\n"+
					"			                </imsss:ruleConditions>\n"+
					"	              			<imsss:ruleAction action=\"disabled\"/>\n"+
					"			            </imsss:preConditionRule>\n"+
					"		            </imsss:sequencingRules>\n"+
					"	   	            <imsss:objectives>\n"+
					"			            <imsss:primaryObjective objectiveID=\"" + lessonId + "_satisfied\">\n"+	
					"		                	<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + lessonId + "_satisfied\"\n"+
					"	                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"true\"/>\n"+
					"	            		</imsss:primaryObjective>\n"+	
					"			            <imsss:objective objectiveID=\"previous_sco_satisfied\">\n"+
					"		                	<imsss:mapInfo targetObjectiveID=\"" + courseNameTrim + "." + _this.previousLesson + "_satisfied\"\n"+
					"	                                       readSatisfiedStatus=\"true\" writeSatisfiedStatus=\"false\"/>\n"+
					"	            		</imsss:objective>\n"+	
					"	          		</imsss:objectives>\n"+	
					"	        	</imsss:sequencing>\n";																		

				}
			}

		}
		else{
			seq += "               <imsss:sequencing>\n"+		
			"	          		<imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n"+
			"	        	</imsss:sequencing>\n";					
		}
		_this.previousLesson = lessonId;
		return seq;
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

	_populateManifest: function(res){
		var _this = this;
        var manifest;

	    manifest = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n';

	    if (_this.scormVersion === '2004_3rd' || _this.scormVersion === '2004_SGST'){
	        manifest += '<manifest identifier=\"'+ _this.courseName.replace(/\s+/g, '') +'Course\" version=\"1.3\"\n';
	        manifest += "   xmlns=\"http://www.imsglobal.org/xsd/imscp_v1p1\"\n"+
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
	            "   </metadata>\n";
	        manifest += "   <organizations default=\""+_this.courseName.replace(/\s+/g, '') +"\">\n"+
	            "       <organization identifier=\""+_this.courseName.replace(/\s+/g, '')+"\" structure=\"hierarchical\">\n"+
	            "           <title>"+_this.courseName+"</title>\n"+
	            "           <item identifier=\"Home\" identifierref=\"RES-common-files\">\n"+
	            "               <title>"+_this.courseName+"</title>\n"+
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
	        manifest += "\n                   <imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n";
	        manifest += "               </imsss:sequencing>\n";
	        manifest += "           </item>\n";
	        //sequencing rules for the course go here
	        manifest += "       </organization>\n";
	        manifest += "    </organizations>\n";
	        manifest += "   <resources>\n";
	        manifest += "      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormType=\"sco\" href=\"" +_this.binDir+ "/index.html\">\n";	  	        
	    }
	    else if(_this.scormVersion == "2004_4th"){
	        manifest += '<manifest identifier=\"'+ _this.courseName.replace(/\s+/g, '') +'Course\" version=\"1.3\"\n';
	        manifest += "   xmlns=\"http://www.imsglobal.org/xsd/imscp_v1p1\"\n"+
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
	            "   </metadata>\n";
	        manifest += "   <organizations default=\""+_this.courseName.replace(/\s+/g, '') +"\">\n"+
	            "       <organization identifier=\""+_this.courseName.replace(/\s+/g, '')+"\" structure=\"hierarchical\">\n"+
	            "           <title>"+_this.courseName+"</title>\n"+
	            "           <item identifier=\"Home\" identifierref=\"RES-common-files\">\n"+
	            "               <title>"+_this.courseName+"</title>\n"+
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
	        manifest += "\n                   <imsss:deliveryControls completionSetByContent=\"true\" objectiveSetByContent=\"true\"/>\n";
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
	        manifest += '<manifest identifier=\"'+ _this.courseName.replace(/\s+/g, '') +'Course\" version=\"1\"\n';
	        manifest += '    xmlns=\"http://www.imsproject.org/xsd/imscp_rootv1p1p2\"'+
	            '    xmlns:adlcp=\"http://www.adlnet.org/xsd/adlcp_rootv1p2\"'+
	            '    xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"'+
	            '    xsi:schemaLocation=\"http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd'+
	            '                         http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd'+
	            '                         http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">';
	        manifest +='<metadata>'+
	            '   <schema>ADL SCORM</schema>'+
	            '   <schemaversion>1.2</schemaversion>'+
	            '</metadata>';
	        manifest +='<organizations default="'+_this.courseName.replace(/\s+/g, '') +'">'+
	            '   <organization identifier="'+_this.courseName.replace(/\s+/g, '') +'">'+
	            '		<title>'+_this.courseName+'</title>'+
	            '		<item identifier="Home" identifierref="RES-common-files">'+
	            '			<title>'+_this.courseName+'</title>'+
	            '		</item>'+
	            '	</organization>'+
	            '</organizations>';
	        manifest += "   <resources>\n";
        	manifest += "      <resource identifier=\"RES-common-files\" type=\"webcontent\" adlcp:scormtype=\"sco\" href=\"" +_this.binDir+ "/index.html\">\n";	      
	    }
	    //resources go here - resourcesgenerator  
	    var resources = _this._resourcesGenerator(res, '');
	    for (var i = 0; i < resources.length; i++) {
	    	manifest += resources[i];
	    };
	    manifest += '      </resource>\n';
	    manifest += '   </resources>\n';

	    manifest += '</manifest>';	

	    return manifest;	
	},

	_resourcesGenerator: function(res, lesson){
		var _this = this;
		var resources = [];
	    res.files.forEach(function(file) {
	        var fileName = file.path.split("\\");
	        //does not include files that don't have an "." ext, directories
	        if(fileName[fileName.length-1].indexOf('.') !== -1 && fileName.indexOf('packages') == -1){
	        	var fullPath = lesson+file.path.replace(/\\/g,"/");
	            resources.push("         <file href=\"" +_this.binDir+ "/"+fullPath.replace(/\s+/g, '%20')+"\"/>\n");
	        }
	    });
	    return resources;		
	},

	_zipScormPackage: function(callback, res, scormBasePath, imsManifestFilePath) {
		var _this = this;
        var scormFileVersion = _this.scormVersion.replace(/\./, '_');
        //var packageFolder = _this.contentPath + '/packages/';
        var outputFile = _this.packageFolder + _this.courseName.replace(/\s+/g, '')+'_'+scormFileVersion+'.zip';
        var output = fs.createWriteStream(outputFile);
        var archive = archiver('zip');

        archive.on('error', function(err) {
            throw err;
        });

        archive.pipe(output);
        //builds the bin directory
        res.files.forEach(function(file) {
            var localFile = file.path.replace(/\\/g,"/");
            if(localFile.indexOf('content.xml') == -1 && localFile.indexOf('packages') == -1){
            	var inputFile = _this.contentPath + '/' + localFile;
            	archive.append(fs.createReadStream(inputFile), { name: _this.binDir+'/'+localFile });
        	}
        });

        //adds temp content.xml file to zip
        archive.append(fs.createReadStream(_this.tempXmlContentFile), { name: _this.binDir+'/xml/content.xml'});

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
        archive.append(fs.createReadStream(imsManifestFilePath), { name: 'imsmanifest.xml'});

        archive.finalize(function(err, written) {
            if (err) {
                callback(err, null);
            }
        
            //tells the engine that it is done writing the zip file
            callback(null, outputFile);
            _this.logger.debug("packageFolder = " + _this.packageFolder);

        });		
	}  

};

module.exports = SCORM;