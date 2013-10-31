/*
 * C_Login
 * This class creates a template for a basic animated login process.
 * VERSION: version 1.0
 * DATE: 2013/03/22
 * JavaScript
 *
 * Copyright (c) 2013, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
function C_Login(_type) {
	//Allows us to add variations for different types without creating a whole new login.
	var type = _type;
	//The page to load if login is successful.
	var successID = $(data).find("page").eq(currentPage).attr('successID');
	var access_arr = [];
	var resUser;
	var resToken;
	
    //Defines a public method - notice the difference between the private definition below.
	this.initialize = function(){
		//If utilizing transitions - hide the page.
		if(transition == true){
			$('#stage').css({'opacity':0});
		}
		
		
		/*****************************************
		**Set template variables.
		*****************************************/
		if(getURLParameter("token") != "null" && getURLParameter("reset") == "null"){
			var myToken = getURLParameter("token");
			socket.emit('confirmUser', { token: myToken});
		}
		
		if(getURLParameter("reset") != "null"  && getURLParameter("token") != "null"){
			var myUser = getURLParameter("reset");
			var myToken = getURLParameter("token");
			resUser = myUser;
			resToken = myToken;
			socket.emit('confirmUser', { token: myToken});
			doResetPassword(myUser, myToken);
		}
		
		buildTemplate();
	}
	
	
	
	function getURLParameter(name) {
	    return decodeURI(
	        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
	    );
	}

    function buildTemplate(){
    	/*********************************************************************************
    	SETUP LISTENERS FOR RESPONSES FROM THE SERVER
    	*********************************************************************************/
    	
    		//Successfully logged in - send them to page defined in content.xml - successID attribute for this page.
    		socket.on('loginAttemptSuccess', function(data){
			user = data;
			loadPageFromID(successID);
		});
		
		//Message from server saying that they are registered but have not confirmed their registration from the e-mail sent to their address.
		socket.on('mustConfirm', function(){
			var myTitle = "Failed Login Attempt";
			var myMessage = "<p>Your login attempt failed!</p><p>You are registered but you have not confirmed your registration. Please, check your e-mail for a message titled 'Cognizen Registration Confirmation' and follow the instructions in that mail.</p><p>If the mail does not appear in your mailbox, please check your junk mail folder, in case it was blocked.</p>";
			doError(myTitle, myMessage);
		});
		
		//Message from server when their login attempt fails due to improper username.
		socket.on('loginUserFailed', function(){
			var myTitle = "Failed Login Attempt";
			var myMessage = "Your login attempt failed!<br/>The provided username does not exist in our records.<br/>Please check your credentials and try again or select 'Register' below, to register a new user.";
			doError(myTitle, myMessage);
		});
		
		//Message sent from the server when they have an incorrect password.
		socket.on('loginPasswordFailed', function(){
			var myTitle = "Failed Login Attempt";
			var myMessage = "Your login attempt failed!<br/>The password did not match the record for this username.<br/>Please check your credentials and try again.";
			doError(myTitle, myMessage);
		});
		
		//Message sent from the server when they try to register an already registered e-mail account.
		socket.on('registrationFailed', function(){
			var myTitle = "Registration Failed";
			var myMessage = "<p>Your registration attempt failed!</p><p>The e-mail address that you provided has already been registered.</p><p>If you have forgotten your password, please close this window and select the 'Forgot Password' button below the 'Register' button.</p>";
			doError(myTitle, myMessage);
		});
		
		//Message sent from the server letting the user know that their registration attempt was successful.
		socket.on('registrationSuccess', function(){
			var myTitle = "Registration Success";
			var myMessage = "<p>You have successfully registered for the PME Challenge!</p><p>A confirmation e-mail has been sent to your e-mail account. You must click on the conformation link in that mail to enable your credentials before before logging into the PME Challenge.</p>";
			doError(myTitle, myMessage);
		});
		
		//Message from the server letting the user know that they are not registered in the system when they try to reset their password.
		socket.on('forgetFailed', function(){
			var myTitle = "User Not Registered";
			var myMessage = "<p>We do not have a record of this e-mail address.</p><p>Are you sure that you entered your e-mail correctly?  If not, please try again. If you are sure that you have entered the correct e-mail address, then please register again.</p>";
			doError(myTitle, myMessage);
		});
		
		//Message from the server letting the user know that they are not registered in the system when they try to reset their password.
		socket.on('forgotSuccess', function(data){
			var myTitle = "Password Reset Success";
			var myMessage = "<p>A mail has been sent to your provided e-mail address.</p><p>Please check your mail and navigate to the link provided to complete the resetting of your password.</p>";
			doError(myTitle, myMessage);
		});
		
		/*********************************************************************************
    	Build the page
    	*********************************************************************************/
		
	    //Add the login form.		
		$("#stage").append("<form id='logForm'><fieldset id='loginFieldSet'><label class='loginField' for='username'>email: </label><input type='text'  id='username' class='loginText text ui-widget-content ui-corner-all'/><br><br><label class='loginField' for='pass'>password: </label><input type='password' id='pass' class='loginText text ui-widget-content ui-corner-all'/><br><br><div style='width: 400px; margin-left: auto; margin-right:auto;' id='loginSubmit'>login</div></fieldset></form>");
				
		$("#loginSubmit").button();
		//Add rounded corners for IE because it SUX
		if(/msie [1-9]./.test(navigator.userAgent.toLowerCase())){
			$("#loginSubmit").corner();
		}
		
		$("#loginSubmit").click(parseLogin);
				
		/*$("#stage").append("<div id='registerSubmit'>register</div>");
		
		$("#registerSubmit").button();
		
		//Add rounded corners for IE because it SUX
		if(/msie [1-9]./.test(navigator.userAgent.toLowerCase())){
			$("#registerSubmit").corner();
		}
		
		$("#registerSubmit").click(doRegister);*/
				
		$("#stage").append("<div id='forgotSubmit'>forgot password</div>");
		
		$("#forgotSubmit").button();
		
		//Add rounded corners for IE because it SUX
		if(/msie [1-9]./.test(navigator.userAgent.toLowerCase())){
			$("#forgotSubmit").corner();
		}
		
		$("#forgotSubmit").click(doForgotPassword);
				
		enableMainKeyEvents();
		
		$("#username").focus();
		access_arr.push("#username");
		access_arr.push("#pass");
		access_arr.push("#loginSubmit");
		access_arr.push("#registerSubmit");
		access_arr.push("#forgotSubmit");
		
		doAccess(access_arr);
		
		//If transitions are true then fade the page in now that it is built.
		if(transition == true){
			TweenMax.to($('#stage'), transitionLength, {css:{opacity:1}, ease:transitionType});
		}
    }
    
    /***********************************************************************************************
    KEYBOARD EVENTS
    ***********************************************************************************************/
    
    function enableMainKeyEvents(){
		$("#username").bind("keyup", keyUpParseLogin);
		$("#pass").bind("keyup", keyUpParseLogin);
		$("#loginSubmit").bind("keyup", keyUpParseLogin);
		$("#forgotSubmit").bind("keyup", keyUpDoForgot);
		$("#registerSubmit").bind("keyup", keyUpDoRegister);
    }
    
    function disableMainKeyEvents(){
		$("#username").unbind("keyup", keyUpParseLogin);
		$("#pass").unbind("keyup", keyUpParseLogin);
		$("#loginSubmit").unbind("keyup", keyUpParseLogin);
		$("#forgotSubmit").unbind("keyup", keyUpDoForgot);
		$("#registerSubmit").unbind("keyup", keyUpDoRegister);
    }
    
    function enableResetKeyEvents(){
		$("#resPass").bind("keyup", keyUpSubmitResetPass);
		$("#resPassVer").bind("keyup", keyUpSubmitResetPass);
    }
    
    function disableResetKeyEvents(){
		$("#resPass").unbind("keyup", keyUpSubmitResetPass);
		$("#resPassVer").unbind("keyup", keyUpSubmitResetPass);
    }
    
    function enableForgotKeyEvents(){
		$("#forgotSubmit").blur();
		$("#forgotEmail").bind("keyup", keyUpSubmitForgotPass);
    }
    
    function disableForgotKeyEvents(){
    	$("#forgotSubmit").blur();
		$("#forgotEmail").unbind("keyup", keyUpSubmitForgotPass);
    }
    
    function enableRegisterKeyEvents(){
    		$("#registerSubmit").blur();
	    	$("#firstName").bind("keyup", keyUpSubmitRegister);
	    	$("#lastName").bind("keyup", keyUpSubmitRegister);
	    	$("#regEmail").bind("keyup", keyUpSubmitRegister);
	    	$("#regPassword").bind("keyup", keyUpSubmitRegister);
	    	$("#regPasswordVer").bind("keyup", keyUpSubmitRegister);
    }
    
    function disableRegisterKeyEvents(){
	    	$("#registerSubmit").blur();
	    	$("#firstName").unbind("keyup", keyUpSubmitRegister);
	    	$("#lastName").unbind("keyup", keyUpSubmitRegister);
	    	$("#regEmail").unbind("keyup", keyUpSubmitRegister);
	    	$("#regPassword").unbind("keyup", keyUpSubmitRegister);
	    	$("#regPasswordVer").unbind("keyup", keyUpSubmitRegister);
    }
    
    function keyUpParseLogin(event){
	    if(event.which == 13 || event.keyCode == 13){
	    		parseLogin();		
	    }
    }
    
    function keyUpDoForgot(event){
	    if(event.which == 13 || event.keyCode == 13){
	    		doForgotPassword();		
	    }
    }
    
    function keyUpDoRegister(event){
	    if(event.which == 13 || event.keyCode == 13){
	    		doRegister();		
	    }
    }
    
    function keyUpSubmitForgotPass(event){
	    if(event.which == 13 || event.keyCode == 13){
	    		submitForgotPass();
	    }
    }
    
    function submitForgotPass(event){
	    socket.emit("processForgotPass", { user: $("#forgotEmail").val()});
		$("#forgotEmail").remove();
		$("#dialog-forgot").dialog( "close" );
		$("#dialog-forgot").remove();
    }
    
    function keyUpSubmitRegister(event){
	    if(event.which == 13 || event.keyCode == 13){
	    		submitRegister();
	    }
    }
    
    function submitRegister(){
	    	if (checkRegister() == true) {
	    		socket.emit("registerUser", { firstName: $("#firstName").val(), lastName: $("#lastName").val(), user: $("#regEmail").val(), pass: $("#regPassword").val()});
	    		$("#firstName").remove();
				$("#lastName").remove();
				$("#regEmail").remove();
				$("#regPassword").remove();
				$("#regPasswordVer").remove();
	    		$("#dialog-registerUser").dialog("close");
				$("#dialog-registerUser").remove();
         }
    }
    
    function keyUpSubmitResetPass(event){
	     if(event.which == 13 || event.keyCode == 13){
	     	submitResetPass();
	     }
    }
    
    function submitResetPass(){
	    if(checkResetPass() == true){
		    socket.emit("resetPass", { user: resUser, pass: $("#resPass").val(), token: resToken});
			$("#dialog-resetPass").dialog( "close" );
			$("#resPass").remove();
			$("#resPassVer").remove();
			$("#dialog-resetPass").remove();
		}
    }
    
    function doError(title, msg){
	    $("#stage").append('<div id="dialog-error"><p>' + msg + '</p></div>');
		
		$( "#dialog-error" ).dialog({
			modal: true,
			width: 520,
			close: enableMainKeyEvents,
			open: disableMainKeyEvents,
			title: title,
			buttons: {
				Ok: function() {
					$( this ).dialog( "close" );
					$("#dialog-error").remove();
				}
			}
		});
    }
    
    function doForgotPassword(){
	    $("#stage").append('<div id="dialog-forgot" title="Forgot Password"><p class="validateTips">Enter your email below and click submit. Your credentials will be delivered to your mail.</p><label for="forgotEmail" class="regField">email: </label><input type="text" name="forgotEmail" id="forgotEmail" value="" class="regText text ui-widget-content ui-corner-all" /></div>');
		$( "#dialog-forgot" ).dialog({
			modal: true,
			width: 550,
			close: function(event, ui){
					enableMainKeyEvents();
					disableForgotKeyEvents();
				},
			open:  function(event, ui){
					disableMainKeyEvents();
					enableForgotKeyEvents()
				},
			buttons: {
				Cancel: function(){
					$( this ).dialog( "close" );
					$("#forgotEmail").remove();
					$("#dialog-forgot").remove();
				},
				Submit: submitForgotPass			
			}
		});
    }
    
    
    //reset password
    function doResetPassword(_myUser, _myToken){
	    $("#stage").append('<div id="dialog-resetPass" title="Reset password for: ' + _myUser + '"><p class="validateTips">Enter a new password and verify it.</p><label for="resPass" class="regField">password: </label><input type="password" name="resPass" id="resPass" value="" class="regText text ui-widget-content ui-corner-all" /><br/><label for="resPassVer" class="regField">verify password: </label><input type="password" name="resPassVer" id="resPassVer" value="" class="regText text ui-widget-content ui-corner-all" /></div>');
		$("#resPass").focus();
		$( "#dialog-resetPass" ).dialog({
			modal: true,
			width: 550,
			close: function(event, ui){
					enableMainKeyEvents();
					disableResetKeyEvents();
				},
			open:  function(event, ui){
					disableMainKeyEvents();
					enableResetKeyEvents()
				},
			buttons: {
				Cancel: function(){
					$( this ).dialog( "close" );
					$("#password").remove();
					$("#passwordVer").remove();
					$("dialog-resetPass").remove();
				},
				Submit: submitResetPass
			}
		});
				
    }
    
    //Set 508 accessibility
    function doAccess(_my_arr){
		var tabindex = 1;

		for(var i = 0; i < _my_arr.length; i++){
			$(_my_arr[i]).attr("tabindex", tabindex);
			tabindex++;
		}
    }
    
    //Login function if success - take them to the leader board - if fail - show pop-up saying they failed and to try again.
    function parseLogin(){
    	if($("#username").val() != null && $("#pass").val() != "" && $("#pass").val() != null && $("#pass").val() != ""){
    		socket.emit('attemptLogin', { user: $("#username").val(), pass: $("#pass").val()});
    	}else{
	    		var myTitle = "Failed Login Attempt";
			var myMessage = "All form fields are required.</p><p>You must enter e-mail address and password before continuing.";
			doError(myTitle, myMessage);
		};
    }
    
    
    /************************************************************************************
     REGISTER NEW USERS
     ************************************************************************************/
    //Launch Register Dialog
    function doRegister() {
        $("#stage").append('<div id="dialog-registerUser" title="Add New User"><p class="validateTips">Add the new users details below.</p><label for="firstName" class="regField">first name: </label><input type="text" name="firstName" id="firstName" value="" class="regText text ui-widget-content ui-corner-all" /><br/><label for="lastName" class="regField">last name: </label><input type="text" name="lastName" id="lastName" value="" class="regText text ui-widget-content ui-corner-all" /><br/><label for="regEmail" class="regField">email: </label><input type="text" name="regEmail" id="regEmail" value="" class="regText text ui-widget-content ui-corner-all" /><br/><label for="regPassword" class="regField">password: </label><input type="password" name="regPassword" id="regPassword" value="" class="regText text ui-widget-content ui-corner-all" /><br/><label for="regPasswordVer" class="regField">verify password: </label><input type="password" name="regPasswordVer" id="regPasswordVer" value="" class="regText text ui-widget-content ui-corner-all" /></div>');
        $("#dialog-registerUser").dialog({
            modal: true,
            width: 550,
            close: function(){
					enableMainKeyEvents();
					disableRegisterKeyEvents();
				},
			open:  function(){
					disableMainKeyEvents();
					enableRegisterKeyEvents();
				},
            buttons: {
                Cancel: function () {
                	$("#firstName").remove();
                    $("#lastName").remove();
                    $("#regEmail").remove();
                    $("#regPassword").remove();
                    $("#regPasswordVer").remove();
                    $(this).dialog("close");
                    $("#dialog-registerUser").remove();
                },
                Submit: submitRegister
            }
        });
    }
    
    
    //Validate email address...
    function isValidEmailAddress(emailAddress) {
    		var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
    		return pattern.test(emailAddress);
    	
    	};
    //Check that requirements for registration are met before sending to the server.
    function checkRegister() {
        $("#regError").remove();
        if ($("#regPassword").val() == $("#regPasswordVer").val()) {
            var myDomain = $("#regEmail").val().slice(-3);
		  if($("#firstName").val() != "" && $("#lastName").val() != ""){
	            if (isValidEmailAddress( $("#regEmail").val())) {
	                return true;
	            } else {
	                $("#dialog-registerUser").append("<br/><br/><br/><div id='regError' style='color:#FF0000'>* You must register with a valid e-mail account.</div>");
	            }
		  }else{
			  $("#dialog-registerUser").append("<div id='regError' style='color:#FF0000'><br/><br/><br/>* The name fields are mandatory.</div>");
		  }
        } else {
            $("#dialog-registerUser").append("<div id='regError' style='color:#FF0000'><br/><br/><br/>* Your password entries must match.</div>");
        }
    }
    
    //Check that password requirements are met before sending it to the server.
    function checkResetPass(){
	    $("#resError").remove();
	    if($("#resPass").val() == $("#resPassVer").val()){
		    return true;
	    }else{
		    $("#dialog-resetPass").append("<div id='resError' style='color:#FF0000'><br/><br/><br/>* Your password entries must match.</div>");
	    }
    }

    
    //All classes have to have a destroySelf and fadeComplete to unload before the next page loads.
    this.destroySelf = function() {
	   if(transition == true){
	   		TweenMax.to($('#stage'), transitionLength, {css:{opacity:0}, ease:transitionType, onComplete:fadeComplete});
	   	}else{
		   	fadeComplete();
	   	}
    }
    
    function fadeComplete() {
	    $("#logForm").remove();
	    $("#registerSubmit").remove();
	    $("#forgotSubmit").remove();
	    $("#dialog-register").remove();
	    $("#dialog-error").remove();
	    $("#dialog-forgot").remove();
	    $("dialog-resetPass").remove();
	    disableMainKeyEvents();
	    socket.removeAllListeners("mustConfirm");
	    socket.removeAllListeners("forgetFailed");
	    socket.removeAllListeners("forgetSuccess");
	    socket.removeAllListeners("registrationFailed");
	    socket.removeAllListeners("registrationSuccess");
	    socket.removeAllListeners("loginAttemptSuccess");
	    socket.removeAllListeners("loginPasswordFailed");
	    socket.removeAllListeners("loginUserFailed");
	    loadPage();
    }
}