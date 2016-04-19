/*!
 * C_NavBar
 * Dashboard for the cognizen tool
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 0.1
 * DATE: 2013-04-26
 * JavaScript
 *
 * Copyright (c) 2013, CTC. All rights reserved.
 *
 * @author: Philip Double, doublep@ctc.com
 */
function C_NavBar() {
	
	this.initialize = function (callback) {
		//Message sent from the server when they try to register an already registered e-mail account.
        socket.on('registrationFailed', function () {
            var myTitle = "Registration Failed";
            var myMessage = "<p>Your registration attempt to register this user failed!</p><p>The e-mail address that you provided has already been registered.</p>";
            doError(myTitle, myMessage);
        });

        //Message sent from the server letting the user know that their registration attempt was successful.
        socket.on('registrationSuccess', function () {
            socket.emit('getUserList');
            var myTitle = "Registration Success";
            var myMessage = "<p>You have successfully registered the user to the system!</p><p>A confirmation e-mail has been sent to their e-mail account. The user must click on the conformation link in that mail to enable their credentials before before logging into the cognizen content creation tool.</p>";
            doError(myTitle, myMessage);
        });

        var isHosting = false;
        socket.emit('retrieveHosting', function(fdata){

     		if(fdata) {isHosting = true}
     		
     		$("#dash-navbar").remove();
			var msg = "<div id='dash-navbar' class='dash-navbar'></div><div id='dash-subnav' class='dash-subnav'></div>";
			$(msg).insertAfter(".dash-header");
			
			if(isBoth){
		        var admin = user.admin;
		        var programAdmin = false;
				
				
		        if (!admin) {
		            // Check if user is a program admin
		            for (var i = 0; i < user.permissions.length; i++) {
		                var permission = user.permissions[i];
		                if (permission.permission == 'admin') {
		                    programAdmin = true;
		                    break;
		                }
		            }
		        }
				
				if ((admin || programAdmin) && (dashMode === 'author') || (dashMode == 'lms')) {
					//ROOT and admin can add users to the system.
		            $("#dash-subnav").append("<div id='adminAddUser'>add user</div>");
		            $("#adminAddUser").click(registerUser);
		        }
				
		            //ADDING PROGRAMS IS ROOT ONLY
		        if (admin && dashMode === 'author') {
		            $("#dash-subnav").append("<div id='adminAddProgram'>add program</div>");
		            $("#adminAddProgram").click(function () {
		                registerContent("root", "root");
		            });
		        }
		        
		        if(isHosting){

			        if (dashMode == 'lms') {
			            $("#dash-subnav").append("<div id='courseCatalogBtn'>view course catalog</div>");
			            $("#courseCatalogBtn").click(function () {
				            dashMode = 'catalog';
						 	socket.emit('checkLoginStatus');
			            });

			            $("#dash-subnav").append("<div id='transcriptBtn'>transcript</div>");
			            $("#transcriptBtn").click(function () {
				            dashMode = 'transcript';
						 	socket.emit('checkLoginStatus');
			            });			            
			        }

					$("#dash-navbar").append("<div id='gotoAuthoring' class='navbar-item'>authoring</div>");
					$("#gotoAuthoring").click(function () {
						dashMode = 'author'; 
						socket.emit('checkLoginStatus');
					});

			        //commented out for 1.3 release #4501
			        if (admin || programAdmin) {
						//ROOT and admin can add users to the system.
			            $("#dash-navbar").append("<div id='gotoLMS' class='navbar-item'>hosting</div>");
			            $("#gotoLMS").click(function(){
				            dashMode = 'lms';
						    socket.emit('checkLoginStatus');
			            });
			        }
		    	}
		        callback();	         
	        }   
	        else{
	        	callback();
	        }  		
     	});


	}
	
	function registerContent(_root, _boot){
		currentTemplate.registerContent(_root, _boot);
	}
	
	/************************************************************************************
	REGISTER NEW USERS
	************************************************************************************/
	//Launch Register USER Dialog
	function registerUser() {
	    var registerString = '<div id="dialog-registerUser" title="Add New User">';
	    	registerString += '<p class="validateTips">Add the new users details below.</p>';
	    	registerString += '<label for="firstName" class="regField">first name: </label>';
	    	registerString += '<input type="text" name="firstName" id="firstName" value="" class="regText text ui-widget-content ui-corner-all" /><br/>';
	    	registerString += '<label for="lastName" class="regField">last name: </label>';
	    	registerString += '<input type="text" name="lastName" id="lastName" value="" class="regText text ui-widget-content ui-corner-all" /><br/>';
	    	registerString += '<label for="regEmail" class="regField">email: </label>';
	    	registerString += '<input type="text" name="regEmail" id="regEmail" value="" class="regText text ui-widget-content ui-corner-all" /><br/>';
	    	registerString += '<label for="regPassword" class="regField">password: </label>';
	    	registerString += '<input type="password" name="regPassword" id="regPassword" value="" class="regText text ui-widget-content ui-corner-all" /><br/>';
	    	registerString += '<label for="regPasswordVer" class="regField">verify password: </label>';
	    	registerString += '<input type="password" name="regPasswordVer" id="regPasswordVer" value="" class="regText text ui-widget-content ui-corner-all" /></div>';
	
	    $("#stage").append(registerString);
	
	    $("#firstName").alpha();
	    $("#lastName").alpha();
	
	    $("#dialog-registerUser").dialog({
	        modal: true,
	        width: 550,
	        close: function () {
	            //enableMainKeyEvents();
	            //disableRegisterUserKeyEvents();
	        },
	        open: function () {
	            //disableMainKeyEvents();
	            //enableRegisterUserKeyEvents();
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
	            Submit: submitRegisterUser
	        }
	    });
	}
	
	function submitRegisterUser() {
	        if (checkRegister() == true) {
	            socket.emit("registerUser", { firstName: $("#firstName").val(), lastName: $("#lastName").val(), user: $("#regEmail").val().toLowerCase(), pass: $("#regPassword").val()});
	            $("#firstName").remove();
	            $("#lastName").remove();
	            $("#regEmail").remove();
	            $("#regPassword").remove();
	            $("#regPasswordVer").remove();
	            $("#dialog-registerUser").dialog("close");
	            $("#dialog-registerUser").remove();
	        }
	    }
	
	/********************************************************************************************************************END REGISTER NEW USER*/
	
	/************************************************************************************
     CHECK THAT EMAIL IS VALID FORMAT
     ************************************************************************************/
    function isValidEmailAddress(emailAddress) {
        var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
        return pattern.test(emailAddress);
    };

    /************************************************************************************
     checkRegister - Check that requirements for registration are met before sending to the server.
     ************************************************************************************/
        //Check that requirements for registration are met before sending to the server.
    function checkRegister() {
        $("#regError").remove();
	    if($("#regPassword").val().length > 7){
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
	    else{
		    $("#dialog-registerUser").append("<div id='resError' style='color:#FF0000'><br/><br/><br/>* Your password must be at least 8 characters long.</div>");
	    }  
    }


   
    /************************************************************************************************* END OF REGISTRATION CODE*/
}