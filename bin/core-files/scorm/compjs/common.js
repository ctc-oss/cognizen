function checkProgress(){
	num = parent.progress[0].length;
	studentnum = 0;

	for (i=0;i<parent.progress.length;i++){
		tempTopic = 0;
		for (j=0;j<parent.progress[i].length;j++){
			tempPage = 0;
			for (k=2;k<parent.progress[i][j].length;k++){
				if (parent.progress[i][j][k][1] == 1){
					tempPage++;
				}
			}
			if (tempPage == (parent.progress[i][j].length - 2)){
				parent.progress[i][j][1][1] = 1;
				tempTopic++;
			}else if (tempPage > 0){
				parent.progress[i][j][1][1] = 2;
			}
		}
//		alert('tempTopic: ' + tempTopic + '\nprogress['+i+'].length: ' + parent.progress[i].length);
		if (tempTopic == parent.progress[i].length ){
			parent.progress[i][0][0][1] = 1;
			studentnum++;
		}else if (tempTopic > 0){
			parent.progress[i][0][0][1] = 2;
		}
	}

	//parent.SCORM.SCOSetValue("cmi.suspend_data", parent.progress);
	//alert('num: ' + num + '\ntempTopic: ' + tempTopic);

//	if (num == studentnum){
	if (num == tempTopic){
		//set lesson_status to complete
		if (parent.finished != 1){
			alert('You have completed the course. \n\nWhen you have finished viewing the course be sure to \nclose this window to receive credit for the course.');
		}
		parent.finished = 1;
		parent.SCOSetStatusCompleted();
	}
}
var newWind = false;
var newWin;
function closePopup(){
	if (newWind){
		newWind.close();
	}

}
function openSimWindow(theURL, simType, height, width) {
	closePopup();
	var m = theURL.match(/[^\/\\]+\.\w+.$/);
	var fullfilename = m[0];
	var filename = fullfilename.split(".htm");
	
	switch(simType) {
		case "SME": var simPageURL = filename[0] + "_SME.htm"; break;
		case "GME": var simPageURL = filename[0] + "_GME.htm"; break;
		case "LMT": var simPageURL = filename[0] + "_LMT.htm"; break;
		case "TST": var simPageURL = filename[0] + "_TST.htm"; break;
		case "STP": var simPageURL = "docs/" + filename[0] + "_STP.pdf"; break;
	}	
	
	if (height == undefined && width == undefined){ 
		var newWind = eval("window.open('"+simPageURL+"','simwin','width=960,height=695,scrollbars=no,resizable=yes')")}
	else {
		var newWind = eval("window.open('"+simPageURL+"','simwin', 'width="+width+",height="+height+",scrollbars=no,resizable=yes')")}
	if (!newWind) {
		alert('Sorry, unable to open window at this time.')
		return;}
	if (!newWind.opener || newWind.opener == null) newWind.opener = window;    
	if (newWind) newWind.focus();
}

function openPopupWindow(theURL, height, width) {
	if (height == undefined && width == undefined){ 
		//var newWind = eval("window.open('"+theURL+"','popupwin','width=450,height=350,scrollbars=yes,resizable=no')")}
		MM_openBrWindow(theURL,'popupwin','width=500,height=350,scrollbars=yes,resizable=no,toolbar=no,menubar=no')
	}else {
		//var newWind = eval("window.open('"+theURL+"','popupwin','width="+width+",height="+height+",scrollbars=yes,resizable=yes,toolbar=no,menubar=no')")}
		MM_openBrWindow(theURL,'popupwin','width='+width+',height='+height+',scrollbars=yes,resizable=yes,toolbar=no,menubar=no')
	}


//	if (!newWind) {
//		alert('Sorry, unable to open window at this time.')
//		return;}
//	if (!newWind.opener || newWind.opener == null) newWind.opener = window;    
//	if (newWind) newWind.focus();
}


function openPopupWindow2(theURL) {
	MM_openBrWindow(theURL,'popupwin','width=500,height=350,scrollbars=yes,resizable=no,toolbar=no,menubar=no')
}

function populatePageID(data){
	var m = data.match(/[^\/\\]+\.\w+.$/);
	var fullfilename = m[0];
	var outputHTML = "Page ID: " + fullfilename;
	return outputHTML;
}

show = 0;
var mute;
function showHide(){
	if (show == 1){
		MM_showHideLayers('audio','','hide');
		show = 0;
	}else{
		MM_showHideLayers('audio','','show');
		show = 1;
	}
}
function onMuteClick() {
	if (mute==1){
		MM_swapImage('mute','','images/mute_up.jpg',1);
		mute=0;
		if (document.lastform.graphobj.value == 1){
			graphica.TGotoLabel('/volume','volumeOn');
		}
	}else{
		MM_swapImage('mute','','images/mute_off.jpg',1);
		mute=1;
		if (document.lastform.graphobj.value == 1){
			graphica.TGotoLabel('/volume','volumeOff');
		}
	}
	MM_controlShockwave('audioswf','','GotoFrame','29');
}
function onMuteOver() {
	if (mute==0){
		MM_swapImage('mute','','images/mute_over.jpg',1);
	}
}
function onMuteOut() {
	if (mute==0){
		MM_swapImgRestore();
	}
}
function setMute(val) {
	mute=val;
	if (mute==1){
		MM_swapImage('mute','','images/mute_off.jpg',1);
	}
}
function goHere(whereto,pagenum,topicid) {
//	if (document.form1.moveon.value==1) {
		window.location = whereto;
		if (parent.bottomFrame){
			parent.bottomFrame.location='../../../QA/QAStuff.asp?html=1&pageNum='+pagenum+'&topicid='+topicid;
		}
//	} else {
//		alert('Please answer the question.');
//	}
}
function MM_swapImgRestore() { //v3.0
  var i,x,a=document.MM_sr; for(i=0;a&&i<a.length&&(x=a[i])&&x.oSrc;i++) x.src=x.oSrc;
}
function MM_preloadImages() { //v3.0
  var d=document; if(d.images){ if(!d.MM_p) d.MM_p=new Array();
  var i,j=d.MM_p.length,a=MM_preloadImages.arguments; for(i=0; i<a.length; i++)
  if (a[i].indexOf("#")!=0){ d.MM_p[j]=new Image; d.MM_p[j++].src=a[i];}}
}
function MM_findObj(n, d) { //v4.01
  var p,i,x;  if(!d) d=document; if((p=n.indexOf("?"))>0&&parent.frames.length) {
	d=parent.frames[n.substring(p+1)].document; n=n.substring(0,p);}
  if(!(x=d[n])&&d.all) x=d.all[n]; for (i=0;!x&&i<d.forms.length;i++) x=d.forms[i][n];
  for(i=0;!x&&d.layers&&i<d.layers.length;i++) x=MM_findObj(n,d.layers[i].document);
  if(!x && d.getElementById) x=d.getElementById(n); return x;
}
function MM_swapImage() { //v3.0
  var i,j=0,x,a=MM_swapImage.arguments; document.MM_sr=new Array; for(i=0;i<(a.length-2);i+=3)
   if ((x=MM_findObj(a[i]))!=null){document.MM_sr[j++]=x; if(!x.oSrc) x.oSrc=x.src; x.src=a[i+2];}
}
	function MM_reloadPage(init) {  //reloads the window if Nav4 resized
  if (init==true) with (navigator) {if ((appName=="Netscape")&&(parseInt(appVersion)==4)) {
	document.MM_pgW=innerWidth; document.MM_pgH=innerHeight; onresize=MM_reloadPage; }}
  else if (innerWidth!=document.MM_pgW || innerHeight!=document.MM_pgH) location.reload();
}
MM_reloadPage(true);
function MM_showHideLayers() { //v6.0
  var i,p,v,obj,args=MM_showHideLayers.arguments;
  for (i=0; i<(args.length-2); i+=3) if ((obj=MM_findObj(args[i]))!=null) { v=args[i+2];
	if (obj.style) { obj=obj.style; v=(v=='show')?'visible':(v=='hide')?'hidden':v; }
	obj.visibility=v; }
}
function MM_openBrWindow(theURL,winName,features) { //v2.0
	closePopup();
	newWind = window.open(theURL,winName,features);
	if (newWind) {newWind.focus();}
}
 function MM_controlShockwave(objStr,x,cmdName,frameNum) { //v3.0
  var obj=MM_findObj(objStr);
  if (obj) eval('obj.'+cmdName+'('+((cmdName=='GotoFrame')?frameNum:'')+')');
}

function preloadImages() {
	nav_back_over= new Image; nav_back_over.src="css/skin/nav_back_over.gif"; 
	nav_next_over= new Image; nav_next_over.src="css/skin/nav_back_over.gif"; 
	nav_glossary_over= new Image; nav_glossary_over.src="css/skin/nav_glossary_over.gif"; 
	nav_menu_over= new Image; nav_menu_over.src="css/skin/nav_menu_over.gif"; 
	nav_help_over= new Image; nav_help_over.src="css/skin/nav_help_over.gif"; 	
}

///FUNCTIONS FOR DISABLING/ENABLING NEXT FROM FLASH
function disableNext() {
	//alert('disabling next');
	if(checkLessonCompletionFlag==false){
		this.Content.document.getElementById("nav_next").style.visibility = 'hidden';
//		this.Content.document.getElementById("no_nav_next").style.visibility = 'visible';	
//		this.Content.document.getElementById("no_nav_next").onclick = showMsg;
	}
	else{
		this.Content.document.getElementById("nav_next").style.visibility = 'visible';
//		this.Content.document.getElementById("no_nav_next").style.visibility = 'hidden';		
		this.Content.document.getElementById("nav_next").onclick = defaultNextBehavior;
	}
}

var myMsg = 'The page content must be viewed before proceeding. Click the "NEXT" button when highlighted to continue.';
function showMsg() {
	alert(myMsg);
}
function enableNext() {
	//alert('enabling next');
	this.Content.document.getElementById("nav_next").style.visibility = 'visible';
//	this.Content.document.getElementById("no_nav_next").style.visibility = 'hidden';		
	this.Content.document.getElementById("nav_next").onclick = defaultNextBehavior;
}
function defaultNextBehavior() {
	next();
	return false;
}