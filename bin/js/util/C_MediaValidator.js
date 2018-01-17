/*
 *  	C_MediaValidator
 *  	Requires jQuery v1.9 or later
 *
 *      Houses functionality to validate all referenced and unreferenced media
 *
 *      ©Concurrent Technologies Corporation 2018
 */
function C_MediaValidator(_myItem, _myParent) {

	////////////////////////////////////////////////   COURSE LEVEL VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	var myItem = _myItem;										//The Button that was clicked in the dashboard.
	var courseID = myItem.data('id');							//Course to check for modules
    var currentCourseType = myItem.data('type');				//Type to be passed to node server
    var currentCoursePermission = myItem.data('permission');	//Permission to be passed to node server

    var coursePath;												//Path to the course
    var courseData;												//Variable to hold and manipulate course.xml - the xml is imported and held in courseData object.
    var courseXMLPath;											//Path to the course.xml
    var refreshExpected = false;								//Toggle on refreshes coming in - true when needed.


    ////////////////////////////////////////////////   MODULE LEVEL VARIABLES   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    var totalVMModules;									//Number of modules in course
    var loadedVMModules;									//Variable to track how many module xml files have been loaded.
	var mediaArr = [];
	var removedArr = [];
	var allGood = true;

    $(document).ready(function(){
    	initMediaValidator();
    });

    socket.on('receiveCoursePath', function (data){
		receiveCoursePath(data);
    });

    this.refreshVMData = function(){
	   refreshVMData();
    }

    function refreshVMData(){
	    if(refreshExpected == true){
		   module_arr = [];
		   indexItem_arr = [];
		   loadedVMModules = 0;
		   refreshExpected = false;

		   $.ajax({
			   type: "GET",
			   url: courseXMLPath,
			   dataType: "xml",
			   async: false,
			   success: importVMItems,
			   error: function(){
				   alert("unable to load content data")
			   }
			});
		}
    }

	 /************************************************************************************
     initMediaValidator()
     -- reach out to the node server and get the path to the course.
     ************************************************************************************/
     function initMediaValidator(){
     	loadedVMModules = 0;
     	var tmpCourseId = courseID;
     	if(currentCourseType === 'lesson'){
     		tmpCourseId = _myParent.id;
     	}
		socket.emit("getCoursePath", {
        	content: {
            	id: tmpCourseId,
                type: 'course',
                permission: currentCoursePermission
             }
		});
     }

     /************************************************************************************
     receiveCoursePath(data)
     -- recieve course path back from node in data object.
     -- use recieved path to load the course.xml file.
     ************************************************************************************/
     function receiveCoursePath(data){
	     coursePath = [window.location.protocol, '//', window.location.host, '/programs/', decodeURIComponent(data.path)].join('').replace(/\\/g, "/");
	     var xmlPath = coursePath + "/course.xml";
	     courseXMLPath = xmlPath;
	     $.ajax({
		    type: "GET",
		    url: xmlPath,
		    dataType: "xml",
		    async: false,
		    success: importVMItems,
		    error: function(){
			    alert("unable to load content data")
		    }
		});
     }

     /************************************************************************************
     importVMItems(_data);
     -- store the course.xml in courseData variable to read and manipulate as needed.
     -- call functionimport each of the module content.xml files.
     ************************************************************************************/
     function importVMItems(_data){
	     courseData = _data;

	     //TODO: course level not yet implemented
		if(currentCourseType === 'course'){
		    totalVMModules = $(courseData).find("item").length;

			if(totalVMModules > 0){
				for(var y = 0; y < totalVMModules; y++){
					 var moduleObj = new Object();

					 moduleObj.name = $(courseData).find("item").eq(y).attr("name");
					 moduleObj.id = $(courseData).find("item").eq(y).attr("id");
					 moduleObj.parent = courseID;
					 moduleObj.parentDir = coursePath;
					 moduleObj.path = coursePath + "/" +$(courseData).find("item").eq(y).attr("name");
					 moduleObj.xml = null;
					 moduleObj.xmlPath = ["/", encodeURIComponent($(courseData).find("item").eq(y).attr("name").trim()), "/xml/content.xml"].join("");
					 module_arr.push(moduleObj);

					 var currentXML = [coursePath, "/", encodeURIComponent($(courseData).find("item").eq(y).attr("name")), "/xml/content.xml"].join("");
					 importModuleXML(currentXML);
				}
			}
			else{
				buildVMInterface();
			}

		}
		else{
			totalVMModules = 1;
			 var moduleObj = new Object();

			 moduleObj.name = $(courseData).find("item[id='"+courseID+"']").attr("name");
			 moduleObj.id = $(courseData).find("item[id='"+courseID+"']").attr("id");
			 moduleObj.parent = _myParent.id;
			 moduleObj.parentDir = coursePath;
			 moduleObj.path = coursePath + "/" +$(courseData).find("item[id='"+courseID+"']").attr("name");
			 var pathSplit = moduleObj.path.split('/programs');
			 moduleObj.normPath = '../programs' + pathSplit[1];
			 moduleObj.xml = null;
			 moduleObj.xmlPath = ["/", encodeURIComponent($(courseData).find("item[id='"+courseID+"']").attr("name").trim()), "/xml/content.xml"].join("");
			 module_arr.push(moduleObj);

			 var currentXML = [coursePath, "/", encodeURIComponent($(courseData).find("item[id='"+courseID+"']").attr("name")), "/xml/content.xml"].join("");
			 importModuleXML(currentXML);			
		}
     }


     /************************************************************************************
     importModuleXML(_path)
     -- download content.xml for each module
	 -- call importOUtlineModuleComplete after each is pulled to see if all are pulled.
     ************************************************************************************/
     function importModuleXML(_path){
	     $.ajax({
		    type: "GET",
		    url: _path,
		    dataType: "xml",
		    async: false,
		    success: importVMModuleItemComplete,
		    error: function(){
			    alert("unable to load module data for " + _path);
		    }
		});
     }


     /************************************************************************************
     importVMModuleItemComplete(_data);
     -- attach module content.xml to appropriate module_arr item
	 -- Check if all are downloaded then move on.
     ************************************************************************************/
     function importVMModuleItemComplete(_data){
	     for(var i = 0; i < module_arr.length; i++){
	     	//#4929 updated to compare ids instead of names
		     if($(_data).find("id").attr("value") == module_arr[i].id){
			     module_arr[i].xml = _data;
		     }
	     }
	     loadedVMModules++;
	     if(loadedVMModules === totalVMModules){
		     buildVMInterface(module_arr[0]);
	     }
     }


     /************************************************************************************
	 buildVMInterface()
     -- build menuing system and add functionalities
     ************************************************************************************/
     function buildVMInterface(_mod){
     	try {$("#dialog-mv").dialog("close");} catch (e) {}
        socket.emit('readDir', {path: _mod.normPath, track: 'media'}, function(fdata){

            if(fdata == ''){
            	console.log("fdata is empty");
            }
            else{

	            for (var k = 0; k < fdata.length; k++) {
	            	if(fdata[k].parentDir !== "edge_includes" && fdata[k].path !== "loadingIcon.gif"){
	            		mediaArr.push(fdata[k].path);
	            	}
	            }

		     	var thisID;
		     	indexItem_arr = [];

		     	var searchTitle = $(courseData).find('course').first().attr("name");
		     	if(currentCourseType === 'lesson'){
		     		searchTitle = $(courseData).find("item[id='"+courseID+"']").attr("name");
		     	}

		     	var data = module_arr[0].xml;
		     	var totalPages = $(data).find('page').length;
		     	msg = '<div id="dialog-mv" title="Media Validator (Beta) : '+ searchTitle + ':">';
			    msg += '<div id="mvPane" class="pane">'
			    msg += '<div id="mediaValidatorPane" class="paneContent">';

			    msg += '<div id="allGood"></div>';
			    if($(data).find('help').attr('value') === 'true'){
				    var helpUrl = $(data).find('help').attr("url");
				    var icon = validateMedia(helpUrl) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
				    msg += 'help url : ' + helpUrl + " " + icon;
				}
			    msg += '<hr/>';

				for(var i = 0; i < totalPages; i++){

				 	/////#5035///////
					var branchCount = $(data).find("page").eq(i).children("branch").length;
					
					if(branchCount != 0){
						msg += 'branchCount : ' + branchCount + '<br/>';
						for (var h = 0; h < branchCount; h++) {	
							var branchTitle = $(data).find("page").eq(i).children("branch").eq(h).find("title").text().replace(/<\/?[^>]+(>|$)/g, "");
							var branchType = $(data).find("page").eq(i).children("branch").eq(h).attr('layout');
							msg += '<br/>////////////////////////////////////////////////////<br/>';
							msg += branchTitle + ' - ' + branchType + '<br/>';	
							if(branchType != 'textOnly' && branchType != 'sidebar'){
								var img = $(data).find("page").eq(i).children("branch").eq(h).attr('img');
							 	if(typeof img !== typeof undefined && img !== 'null' && img !== '' && img.indexOf('http') === -1){
								 	icon = validateMedia(img) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
								 	msg += 'img : ' + img + " " + icon + '<br/>';
							 	}
							}

						 	var branchContent = $(data).find("page").eq(i).children("branch").eq(h).find("content").first().text();
						 	var branchContentImgLength = 0;
						 	try{ branchContentImgLength = $($.parseXML(branchContent)).find("img").length;} 
						 	catch(e) {branchContentImgLength = $($.parseHTML(branchContent)).find("img").length;}
						 	if(branchContentImgLength != 0){
						 		for (var m = 0; m < branchContentImgLength; m++) {
								 	var branchContentImg = '';
								 	try{ branchContentImg = $($.parseXML(branchContent)).find("img").eq(m).attr("src");} 
								 	catch(e) {branchContentImg = $($.parseHTML(branchContent)).find("img").eq(m).attr("src");}
								 	if(typeof branchContentImg !== typeof undefined && branchContentImg !== 'null' && branchContentImg !== '' && branchContentImg.indexOf('http') === -1){
									 	icon = validateMedia(branchContentImg) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
									 	msg += 'content img : ' + branchContentImg + " " + icon + '<br/>';
								 	}
						 		}
						 	}

						 	var branchContentHrefLength = 0;
						 	try{branchContentHrefLength = $($.parseXML(branchContent)).find("a").length;} 
						 	catch(e) {branchContentHrefLength = $($.parseHTML(branchContent)).find("a").length;}
						 	if(branchContentHrefLength != 0){
						 		for(var n=0; n < branchContentHrefLength; n++){
						 			var branchContentHref = '';
						 			try{branchContentHref = $($.parseXML(branchContent)).find("a").eq(n).attr("href");} 
						 			catch(e) {branchContentHref = $($.parseHTML(branchContent)).find("a").eq(n).attr("href");}
						 			if(typeof branchContentHref !== typeof undefined && branchContentHref !== 'null' && branchContentHref !== '' && 
						 				branchContentHref.indexOf('http') === -1 && branchContentHref.indexOf('mailto:') === -1){
									 	icon = validateMedia(branchContentHref) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
									 	msg += 'content href : ' + branchContentHref + " " + icon + '<br/>';		
								 	}		 			
						 		}
						 	}							 									
							
						 	var sidebar = $(data).find("page").eq(i).children("branch").eq(h).find("sidebar").first().text();
						 	var sidebarImgLength = 0;
						 	try{sidebarImgLength = $($.parseXML(sidebar)).find("img").length;} 
						 	catch(e) {sidebarImgLength = $($.parseHTML(sidebar)).find("img").length;}
						 	if(sidebarImgLength != 0){
						 		for (var m = 0; m < sidebarImgLength; m++) {
								 	var sidebarImg = '';
								 	try{sidebarImg = $($.parseXML(sidebar)).find("img").eq(m).attr("src");} 
								 	catch(e) {sidebarImg = $($.parseHTML(sidebar)).find("img").eq(m).attr("src");}
								 	if(typeof sidebarImg !== typeof undefined && sidebarImg !== 'null' && sidebarImg !== '' && sidebarImg.indexOf('http') === -1){
									 	icon = validateMedia(sidebarImg) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
									 	msg += 'sidebar img : ' + sidebarImg + " " + icon + '<br/>';
								 	}
						 		}
						 	}

						 	var sidebarHrefLength = 0;
						 	try{sidebarHrefLength = $($.parseXML(sidebar)).find("a").length;} 
						 	catch(e) {sidebarHrefLength = $($.parseHTML(sidebar)).find("a").length;}
						 	if(sidebarHrefLength != 0){
						 		for(var n=0; n < sidebarHrefLength; n++){
						 			var sidebarHref = '';
						 			try{ sidebarHref = $($.parseXML(sidebar)).find("a").eq(n).attr("href");} 
						 			catch(e) {sidebarHref = $($.parseHTML(sidebar)).find("a").eq(n).attr("href");}
						 			if(typeof sidebarHref !== typeof undefined && sidebarHref !== 'null' && sidebarHref !== '' && 
						 				sidebarHref.indexOf('http') === -1 && sidebarHref.indexOf('mailto:') === -1){
									 	icon = validateMedia(sidebarHref) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
									 	msg += 'sidebar href : ' + sidebarHref + " " + icon + '<br/>';		
								 	}		 			
						 		}
						 	}	

						}
					}
					else{	

						var type = $(data).find("page").eq(i).attr('layout');
					 	msg += '<h3>' + $(data).find("page").eq(i).find('title').first().text() + ' - ' + type + '</h3>';

					 	var poster = $(data).find("page").eq(i).attr('poster');
					 	if(typeof poster !== typeof undefined && poster !== 'null' && poster !== ''){
					 		icon = validateMedia(poster) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
					 		msg += 'poster : ' + poster + " " + icon + '<br/>';
					 	}

					 	var img = $(data).find("page").eq(i).attr('img');
					 	if(typeof img !== typeof undefined && img !== 'null' && img !== '' && img.indexOf('http') === -1){
					 		icon = validateMedia(img) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
					 		msg += 'img : ' + img + " " + icon + '<br/>';

					 		//if mp4 check for .srt file
					 		var ext = img.split('.').pop();
					 		if(ext === 'mp4'){
					 			var srt = img.replace(/\.[^/.]+$/, ".srt");
					 			if($.inArray(srt, mediaArr) !== -1){
					 				icon = validateMedia(srt) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
									msg += 'srt : ' + srt + " " + icon + '<br/>';
					 			}
					 		}
					 	}

					 	var audio = $(data).find("page").eq(i).attr('audio');
					 	if(typeof audio !== typeof undefined && audio !== 'null' && audio !== ''){
					 		icon = validateMedia(audio) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
					 		msg += 'audio : ' + audio + " " + icon+ '<br/>';
					 	}

					 	if(type != 'matching'){
					 		debugger;
						 	var content = $(data).find("page").eq(i).find("content").first().text();
						 	var contentImgLength = 0;
						 	try{contentImgLength = $($.parseXML(content)).find("img").length;}
						 	catch(e) { contentImgLength = $($.parseHTML(content)).find("img").length;}
						 	if(contentImgLength != 0){
						 		for (var m = 0; m < contentImgLength; m++) {
								 	var contentImg = '';
								 	try{contentImg = $($.parseXML(content)).find("img").eq(m).attr("src");} 
								 	catch(e) {contentImg = $($.parseHTML(content)).find("img").eq(m).attr("src");}
								 	if(typeof contentImg !== typeof undefined && contentImg !== 'null' && contentImg !== '' && contentImg.indexOf('http') === -1){
									 	icon = validateMedia(contentImg) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
									 	msg += 'content img : ' + contentImg + " " + icon + '<br/>';
								 	}
						 		}
						 	}

						 	// #4968
						 	var contentHrefLength = 0;
						 	try{contentHrefLength = $($.parseXML(content)).find("a").length;} 
						 	catch(e) {contentHrefLength = $($.parseHTML(content)).find("a").length;}
						 	if(contentHrefLength != 0){
						 		for(var n=0; n < contentHrefLength; n++){
						 			var contentHref = '';
						 			try{contentHref = $($.parseXML(content)).find("a").eq(n).attr("href");} 
						 			catch(e) {contentHref = $($.parseHTML(content)).find("a").eq(n).attr("href");}
						 			if(typeof contentHref !== typeof undefined && contentHref !== 'null' && contentHref !== '' && 
						 				contentHref.indexOf('http') === -1 && contentHref.indexOf('mailto:') === -1){
									 	icon = validateMedia(contentHref) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
									 	msg += 'content href : ' + contentHref + " " + icon + '<br/>';		
								 	}		 			
						 		}
						 	}
					 	}

					 	// sidebar #5035
					 	var sidebar = $(data).find("page").eq(i).find("sidebar").first().text();
					 	var sidebarImgLength = 0;
					 	try{sidebarImgLength = $($.parseXML(sidebar)).find("img").length;} 
					 	catch(e) {sidebarImgLength = $($.parseHTML(sidebar)).find("img").length;}
					 	if(sidebarImgLength != 0){
					 		for (var m = 0; m < sidebarImgLength; m++) {
							 	var sidebarImg = '';
							 	try{sidebarImg = $($.parseXML(sidebar)).find("img").eq(m).attr("src");} 
							 	catch(e) {sidebarImg = $($.parseHTML(sidebar)).find("img").eq(m).attr("src");}
							 	if(typeof sidebarImg !== typeof undefined && sidebarImg !== 'null' && sidebarImg !== '' && sidebarImg.indexOf('http') === -1){
								 	icon = validateMedia(sidebarImg) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
								 	msg += 'sidebar img : ' + sidebarImg + " " + icon + '<br/>';
							 	}
					 		}
					 	}

					 	var sidebarHrefLength = 0;
					 	try{sidebarHrefLength = $($.parseXML(sidebar)).find("a").length;} 
					 	catch(e) {sidebarHrefLength = $($.parseHTML(sidebar)).find("a").length;}
					 	if(sidebarHrefLength != 0){
					 		for(var n=0; n < sidebarHrefLength; n++){
					 			var sidebarHref = '';
					 			try{sidebarHref = $($.parseXML(sidebar)).find("a").eq(n).attr("href");} 
					 			catch(e) {sidebarHref = $($.parseHTML(sidebar)).find("a").eq(n).attr("href");}
					 			if(typeof sidebarHref !== typeof undefined && sidebarHref !== 'null' && sidebarHref !== '' && 
					 				sidebarHref.indexOf('http') === -1 && sidebarHref.indexOf('mailto:') === -1){
								 	icon = validateMedia(sidebarHref) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
								 	msg += 'sidebar href : ' + sidebarHref + " " + icon + '<br/>';		
							 	}		 			
					 		}
					 	}				 	

					 	/////#4998/////
					 	var question = $(data).find("page").eq(i).find("question").first().text();
					 	var questionImgLength = 0;
					 	try{questionImgLength = $($.parseXML(question)).find("img").length;} 
					 	catch(e) {questionImgLength = $($.parseHTML(question)).find("img").length;}
					 	if(questionImgLength != 0){
					 		for (var o = 0; o < questionImgLength; o++) {
					 			var questionImg = '';
					 			try{questionImg = $($.parseXML(question)).find("img").eq(o).attr("src");} 
					 			catch(e) {questionImg = $($.parseHTML(question)).find("img").eq(o).attr("src");}
					 			if(typeof questionImg !== typeof undefined && questionImg !== 'null' && questionImg !== '' && questionImg.indexOf('http') === -1){	
								 	icon = validateMedia(questionImg) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
								 	msg += 'question img : ' + questionImg + " " + icon + '<br/>';
							 	}				 			
					 		}
					 	}

					 	var questionHrefLength = 0;
					 	try{questionHrefLength = $($.parseXML(question)).find("a").length;} 
					 	catch(e) {questionHrefLength = $($.parseHTML(question)).find("a").length;}
					 	if(questionHrefLength != 0){
					 		for (var p = 0; p < questionHrefLength; p++) {
					 			var questionHref = '';
					 			try{questionHref = $($.parseXML(question)).find("a").eq(p).attr("href");} 
					 			catch(e) {questionHref = $($.parseHTML(question)).find("a").eq(p).attr("href");}
					 			if(typeof questionHref !== typeof undefined && questionHref !== 'null' && questionHref !== '' && 
					 				questionHref.indexOf('http') === -1 && questionHref.indexOf('mailto:') === -1){	
								 	icon = validateMedia(questionHref) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
								 	msg += 'question href : ' + questionHref+ " " + icon + '<br/>';	
							 	}				 			
					 		}
					 	}

					 	var answerLength = $(data).find("page").eq(i).find("answer").length;
					 	if(answerLength != 0){
					 		for (var q = 0; q < answerLength; q++) {
					 			var answerImg = $(data).find("page").eq(i).find("answer").eq(q).attr('img');
								if(typeof answerImg !== typeof undefined && answerImg !== 'null' && answerImg !== '' && answerImg.indexOf('http') === -1){	
								 	icon = validateMedia(answerImg ) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
								 	msg += 'answer img : ' + answerImg + " " + icon + '<br/>';									
								}	
								// #5036
								var answerContent = $(data).find("page").eq(i).find("answer").eq(q).find("content").first().text();
							 	var contentImgLength = 0;
							 	try{ contentImgLength = $($.parseXML(answerContent)).find("img").length;} 
							 	catch(err) {contentImgLength = $($.parseHTML(answerContent)).find("img").length;}
							 	if(contentImgLength != 0){
							 		for (var m = 0; m < contentImgLength; m++) {
							 			var contentImg = '';
							 			try{ contentImg = $($.parseXML(answerContent)).find("img").eq(m).attr("src");} 
							 			catch(err) {contentImg = $($.parseHTML(answerContent)).find("img").eq(m).attr("src");}
									 	if(typeof contentImg !== typeof undefined && contentImg !== 'null' && contentImg !== '' && contentImg.indexOf('http') === -1){
										 	icon = validateMedia(contentImg) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
										 	msg += 'content img : ' + contentImg + " " + icon + '<br/>';
									 	}
							 		}
							 	}									 			
					 		}

					 	}
					 	/////#4998/////

					 	var revealLength = $(data).find("page").eq(i).find("reveal").length;
					 	if (revealLength != 0){
					 		for(var o=0; o < revealLength; o++){
					 			var revealImg = $(data).find("page").eq(i).find("reveal").eq(o).attr("img");
					 			if(typeof revealImg !== typeof undefined && revealImg !== 'null' && revealImg !== '' && revealImg.indexOf('http') === -1){	
								 	icon = validateMedia(revealImg) !== true ? '<img src="css/images/wrong.png"/>' : '<img src="css/images/correct.png"/>';
								 	msg += 'reveal image : ' + revealImg + " " + icon + '<br/>';						 	
							 	}		
					 		}
					 	}
				 	}

				 	msg += '<hr/>';
				}

				msg += '<h3>Dangling resources</h3>';
				if(mediaArr.length != 0){
					for (var i = 0; i < mediaArr.length; i++) {
						msg += mediaArr[i] + '<br/>';
					}
				}
				else{
					msg += 'All media is referenced.';
				}
			    msg += '</div>';//close the mediaValidatorPane

			    msg += '</div>';//close the mv pane
			    msg += '</div>';//close the dialog
		        //ADD menu to stage
		        $("#stage").append(msg);

		        //lesson overall status
			 	var lessonPass = allGood !== true ? '<b>Lesson does not pass Media Validator</b> <img src="css/images/wrong.png"/>' : '<b>Lesson passes Media Validator<b/> <img src="css/images/correct.png"/>';
			 	msg += $('#allGood').append(lessonPass);

		        $("#dialog-mv").dialog({
		            modal: true,
		            width: 1024,
		            height: 768,
		            resizable: false,
		            close: function (event, ui) {
		                socket.removeAllListeners('receiveCoursePath');
		                socket.emit("closeTool", {
		                	id : courseID,
		                	tool : 'media'
		                });
		                module_arr = [];
		                $(this).dialog('destroy').remove();
		            },
		            open: function (event, ui) {

		            },
		            buttons: [
						{
							text: "Print",
							title: "Prints the answer key .",
							click: function(){
								$('#mediaValidatorPane').printThis({pageTitle:searchTitle});
							}
						}
					]	            
		        });
		    }


			try{$("#preloadholder").remove();} catch(e){};
        });
     }

     function validateMedia(_media){
     	_media = _media.replace('media/', '');
     	if($.inArray(_media, mediaArr) !== -1){
     		mediaArr = $.grep(mediaArr, function(value){
     		    return value != _media;
     		});
     		removedArr.push(_media);
     		return true;
     	}
     	else{
     		//check if media is one that was already removed
	     	if($.inArray(_media, removedArr) !== -1){
	     		return true;
	     	}
	     	else{   
	     		allGood = false; 		
     			return false;
     		}
     	}
     }

    /*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
    function destroy(){
	     try { $("#dialog-mv").remove(); } catch (e) {}

    }
    ///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}