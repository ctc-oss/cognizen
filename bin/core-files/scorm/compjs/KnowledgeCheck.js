var incorrectMessage = "Incorrect. ";
var choicewarn = "You need to answer the question to continue."
var choiceInfo = "Please either answer the question or click the Next Page button to skip this question.";
var correct_feedback = "You have answered the question correctly. Please click the Next Page button to contunue.";
var attempt_complete = "Your attempts are completed. Please click the Next Page button to continue.";
var g_blnAttempted = false;
var proceed=true;
var num_tries_original = -1;
var check_user_anwered_correctly = false;
var correct_image = "";
var incorrect_image = "";
var review = "";
var userArray = new Hash();

function checkSorting(base_dir, path) {
	//alert("in checkSorting(base_dir, path)");
	var kid;
	var tm_form = document.matchform;
	var content = "";
	var distractor = "";
	
	curr_tries++;

	var score = 0;
	for (kid in TS) {
		var tt = kid.toString();		
		var t0 = tt.indexOf('c_');
		
		if (t0 == 0) {
			//alert("tm_form[kid]: "+ TS[kid] + "   " + tm_form[kid].value);	
			if (tm_form[kid].value != "-1") {
				g_blnAttempted = true;
			}

			if (tm_form[kid].value == TS[kid]) {
				score++;
			}
		}
	}
	if (!g_blnAttempted) {
		curr_tries--;
		alert(choicewarn);
		return;
	}

	//alert( "score out of num_questions: " + score + " out of " + num_questions );

	if (score == num_questions) {
		//tieredFeedbackCorrect(curr_tries, base_dir, path);
		correctFeedback(curr_tries, base_dir, path);
		curr_tries += 55;
	} else {
		incorrectFeedback(curr_tries, base_dir, path);
	}

}

function checkMatching(base_dir, path) {
	//alert("in checkMatching(base_dir, path)");
	var kid;
	var tm_form = document.matchform;
	var content = "";
	var distractor = "";
	
	curr_tries++;
	var score = 0;
	for (kid in TM) {
		var tt = kid.toString();
		var t0 = tt.indexOf('c_');
		if (t0 == 0) { 
			//alert("tm_form[kid]: " + TM[kid] + "    " + tm_form[kid].value);	
			if (tm_form[kid].value != "-1") {
				g_blnAttempted = true;
			}

			if (tm_form[kid].value == TM[kid]) {
				score++;
			}
		}
	}
	if (!g_blnAttempted) {
		curr_tries--;
		alert(choicewarn);
		return;
	}
	
	//alert( "score out of num_questions: " + score + " out of " + num_questions );

	if (score == num_questions) {
		correctFeedback(curr_tries, base_dir, path);
		curr_tries += 55;
	} else {
		incorrectFeedback(curr_tries, base_dir, path);
	}

	//alert( score + " out of " + num_questions );

}

function checkFill(base_dir, path) {
	
	//alert("in checkFill(base_dir, path)");

	var distractor = "";
	var content = "";
	var userTextArray = new Array(num_questions);
	//check for all fill-in-blanks answers
	var enteredAllBlks = false;
	
	for ( var i = 0; i < num_questions; i++) {

		userTextArray[i+1] = document.forms[0].elements[i].value;
		//alert("userTextArray "+i+":"+userTextArray[i+1]);
		if (userTextArray[i+1] == "") {
			enteredAllBlks = false;
			alert("Please type in all your answers and click submit.");
			break;
		} else {
			enteredAllBlks = true;
		}
	}
	
	if (enteredAllBlks) {
		curr_tries++;

		if (curr_tries <= num_tries) {

			var isAllCorrectAns = true;
			
			for ( var i = 1; i < num_questions+1; i++) {
				var keys = allAnswerArray.keys();

				if (userTextArray[i].toUpperCase() != allAnswerArray.get(keys)) {
					isAllCorrectAns = false;
				}
			}
			//alert("isAllCorrectAns:"+isAllCorrectAns);
			if (isAllCorrectAns) {
				check_user_anwered_correctly = true;

				correctFeedback(curr_tries, base_dir, path);
			}
			
			else {

				incorrectFeedback(curr_tries, base_dir, path);
			}
		}
		if (num_tries == 0) {
			var isAllCorrectAns = true;
			
			for ( var i = 1; i < num_questions+1; i++) {
				var keys = allAnswerArray.keys();

				if (userTextArray[i].toUpperCase() != allAnswerArray.get(keys)) {
					isAllCorrectAns = false;
				}
			}
			//alert("isAllCorrectAns:"+isAllCorrectAns);
			if (isAllCorrectAns) {		

				correctFeedback(curr_tries, base_dir, path);
				check_user_anwered_correctly = true;
				curr_tries += 55;
			}
			
			else {

				incorrectFeedback(curr_tries, base_dir, path);
			}
		}

	} //end if

}

function toggleChoiceAllThatApply(number, id) {
	
	//alert("in toggleChoiceAllThatApply(number, id)");
	
	var current = userArray.get(number);
	g_blnAttempted = true;
	if (current == 'true') {
		current = 'false';
	} else {
		current = 'true';
	}
	userArray.set(number,current);
}

function checkAllThatApply(base_dir, path) {
	//alert("in checkAllThatApply(base_dir, path)");	

	if (!g_blnAttempted) {
		alert(choicewarn);
		return;
	}
	var content = "";
	var distractor = "";	
	
	curr_tries++;
	var score = 0;
	var keys=answerArray.keys();
	for ( var i = 0; i < keys.length; i++) {

		if (answerArray.get(keys[i]) == userArray.get(keys[i])) {
			score++;
		}
	}
	if (score == num_questions) {

		correctFeedback(curr_tries, base_dir, path);
		curr_tries += 55;

	} else {
		incorrectFeedback(curr_tries, base_dir, path);
	}

}

function toggleChoiceMultiple(number, base_dir) {
	
	//alert("in toggleChoiceMultiple(number, base_dir): " + number + "  ||  " + base_dir);
	
	g_blnAttempted = true;
	var keys=userArray.keys();
	for ( var i = 0; i < keys.length; i++) {
		userArray.set(keys[i],'false');
	}
	userArray.set(number,'true');

}

function checkMultiple(base_dir, path) {
	//alert("in checkMultiple(base_dir, path)");

	var content = "";
	var distractor = "";	
	
	if (!g_blnAttempted) {
		alert(choicewarn);
		return;
	}
	
	curr_tries++;

	var userSelection = "";

	var score = 0;
	var score_max = 0;
	
	var keys = userArray.keys();
	for ( var j = 0; j < keys.length; j++) {

		if (userArray.get(keys[j]) == 'true') {
			userSelection = j;
		}

		if (userArray.get(keys[j] ) == 'true' && answerArray.get(keys[j]) == userArray.get(keys[j])) {
			score++;
		}
	}
	if (score > 0) {
		correctFeedback(curr_tries, base_dir, path);
		curr_tries += 55;

	} else {
		
		incorrectFeedback(curr_tries, base_dir, path);

	}

	//Question_Popup( distractor, content, base_dir,path )
}

function Question_Popup(distractor, content, base_dir, path) {
	//var tempath='35001001/styles/customStyles.css';
	
	//alert("in Question_Popup(distractor, content, base_dir, path)");
	
	//alert('path :'+path);

	var my_width = 400;
	var my_height = 300;
	var my_scrollbars = 1;

	w = window.open("", "questionResponse",
			"resizable=1,toolbar=0,location=0,directories=0,status=1,menubar=0,scrollbars="
					+ my_scrollbars + ",copyhistory=0,width=" + my_width
					+ ",height=" + my_height);

	w.document.open();
	w.document.writeln("<html><head><title>Question Response</title>");
	
	//w.document.writeln("<link rel='stylesheet' type='text/css' href='../templates/CLT/"	+ path + "'/> ");
	
	w.document.writeln("</head><body id='popup'>");
	
	w.document.writeln("<div id='distractor'>" + distractor + "</div>");

	w.document
			.writeln("<div id='popupContent' >"
					+ content
					+ "</div><p><div id='close'><a href='javascript:self.close()'>Close this window</a></div></p></body></html>");
	w.document.close();
	w.focus();
}

function kr_next() {

	//alert("in kr_next()");
	
	parent.next();
	return false;

}
function Navigation1() {
	
	//alert("in Navigation1()");

	if (curr_tries > 0) {
		parent.next();
		return false;
	} else {
		alert("You must first try to answer the question!");
	}
}
function Navigation2() {
	
	//alert("in Navigation2()");

	if (check_user_anwered_correctly == true) {
		parent.next();
		return false;
	} else {
		alert("You must first try to answer the question Correctly!");
	}
}
function Navigation3() {
	
	//alert("in Navigation3()");

	if (check_user_anwered_correctly == true || curr_tries >= num_tries) {
		parent.next();
		return false;
	} else {
		alert("You must first try to answer the question!");
	}
}


function checkMultiple(base_dir, path) {
	//alert("in checkMultiple(base_dir, path)");
	
	var content = "";
	var distractor = "";		
	
	if (!g_blnAttempted) {
		alert(choicewarn);
		return;
	}
	curr_tries++;
	var userSelection = "";
	var score = 0;
	var score_max = 0;
	var keys = userArray.keys();
	for ( var j = 0; j < keys.length; j++) {
		if (userArray.get(keys[j]) == 'true') {
			userSelection = j;
		}
		if (userArray.get(keys[j] ) == 'true' && answerArray.get(keys[j]) == userArray.get(keys[j])) {
			score++;
		}
	}
	if (score > 0) {
		correctFeedback(curr_tries, base_dir, path);
		curr_tries += 55;
	} else {
		incorrectFeedback(curr_tries, base_dir, path);
	}
	//Question_Popup( distractor, content, base_dir,path )
}

function checkMultiple2(base_dir, path) 
{
	//alert("in checkMultiple2(base_dir, path)");
	//alert("num_tries: " + num_tries);
	
	if (num_tries_original == -1)
		num_tries_original = num_tries;
	
	//alert("num_tries_original: " + num_tries_original);
	
	var content = "";
	var distractor = "";		
	
	if (!g_blnAttempted) 
	{
		if (num_tries_original > 0)
		{
			alert(choicewarn);
			return;
		}
		else
		{
			alert(choiceInfo);
			return;
		}
	}
	else	
	{
		curr_tries++;
		
		if (curr_tries > num_tries && num_tries > 0 && num_tries_original > 0) {
			alert(attempt_complete);
			return;
		}
		
		var userSelection = "";
		var score = 0;
		var score_max = 0;
		var keys=userArray.keys();		
		
		for ( var j = 0; j < keys.length; j++) 
		{	
			if (userArray.get(keys[j]) == 'true') 
			{
				userSelection = j;
			}
	
			if (userArray.get(keys[j]) == 'true' && answerArray.get(keys[j]) == userArray.get(keys[j])) 
			{
				score++;
			}
		}
	
		if (score > 0) {
	
			distractor = "";
			check_user_anwered_correctly = true;	
			correctFeedback(curr_tries, base_dir, path);
			curr_tries += 55;
	
		} else {
			incorrectFeedback(curr_tries, base_dir, path);
		}
	}	
}

function checkAllThatApply2(base_dir, path) {
	//alert("in checkAllThatApply2(base_dir, path)");		
	//alert("num_tries: " + num_tries);
	
	if (num_tries_original == -1)
		num_tries_original = num_tries;
	
	//alert("num_tries_original: " + num_tries_original);	
	
	var checked = false;
	var userKeys = userArray.keys();
	for ( var i = 0; i < userKeys.length; i++) 
	{
		//alert("userKeys: " + i + "  ||  " + userArray.get(userKeys[i]));
		if (userArray.get(userKeys[i]) == "true")
			checked = true;
	}
	
	//alert("checked: " + checked);	
	
	if (!g_blnAttempted) 
	{		
		if (num_tries_original > 0)
		{
			alert(choicewarn);
			return;
		}
		else
		{
			alert(choiceInfo);
			return;
		}
	}
	else if (checked == false)
	{
		if (num_tries_original > 0)
		{
			alert(choicewarn);
			return;
		}
		else
		{
			alert(choiceInfo);
			return;
		}
	}
	
	var content = "";
	var distractor = "";
	curr_tries++;
	
	if (curr_tries > num_tries && num_tries > 0 && num_tries_original > 0) {
		alert(attempt_complete);
		return;
	}
	
	var score = 0;
	var keys = answerArray.keys();
	for ( var i = 0; i < keys.length; i++) {
		if (answerArray.get(keys[i]) == userArray.get(keys[i])) {
			score++;
		}
	}
	if (score == num_questions) {
		check_user_anwered_correctly = true;
		correctFeedback(curr_tries, base_dir, path);
		curr_tries += 55;		
	} else {
		incorrectFeedback(curr_tries, base_dir, path);
	}

}


function checkFillInBlank(base_dir, path) { //FillInBlank with drop down
	
	//alert("in checkFillInBlank(base_dir, path)");
	//alert("num_tries: " + num_tries);
	
	if (num_tries_original == -1)
		num_tries_original = num_tries;
	
	//alert("num_tries_original: " + num_tries_original);
	
	var distractor = "";
	var content = "";
	
	var userTextArray = new Hash();
	
	//check for all fill-in-blanks answers
	var enteredAllBlks = false;	
	
	var keys = answerArray.keys();	
	
	//First collect all form values and store into the userTextArray
	for ( var i = 0; i < keys.length; i++) {
		userTextArray.set(document.forms[0].elements[i].name, document.forms[0].elements[i].value);
		//alert("userTextArray " + i + ":"+userTextArray[i+1]);
	}

	curr_tries++;
	
	if (curr_tries > num_tries && num_tries > 0 && num_tries_original > 0) {
		alert(attempt_complete);
		return;
	}

	var isAllCorrectAns = true;
	
	for ( var i = 0; i < num_questions; i++) 
	{
		var keys = answerArray.keys();
		
		if (userTextArray.get(keys[i]) != answerArray.get(keys[i])) {
			isAllCorrectAns = false;
		}
	}
	
	//alert("isAllCorrectAns:" + isAllCorrectAns);
	if (isAllCorrectAns)  
	{
		check_user_anwered_correctly = true;		
		correctFeedback(curr_tries, base_dir, path);
		curr_tries += 55;
	}	
	else {

		incorrectFeedback(curr_tries, base_dir, path);
	}	
}


function checkFill2(base_dir, path) { //Fill in Blank
	
	//alert("in checkFill2(base_dir, path)");		
	//alert("num_tries: " + num_tries);
	
	if (num_tries_original == -1)
		num_tries_original = num_tries;
	
	//alert("num_tries_original: " + num_tries_original);
	
	var userText = "";
	
	var distractor = "";
	var content = "";
	//var userTextArray = new Array(num_questions);
	var userTextArray = new Hash();
	
	//check for all fill-in-blanks answers
	var enteredAllBlks = false;
	
	for ( var i = 0; i < num_questions; i++) {
		userTextArray.set(document.forms[0].elements[i].name, document.forms[0].elements[i].value);
		//alert("userTextArray " + i + ":" + userTextArray[i+1]);		
		userText = userText + userTextArray.get(document.forms[0].elements[i].name);
		if (userTextArray.get(document.forms[0].elements[i].name) == "") {
			enteredAllBlks = false;
			if (num_tries_original > 0)
				alert("Please type in all your answers and click submit.");			
			break;
		} else {
			enteredAllBlks = true;
		}
	}
	
	if (num_tries_original == 0 && userText == "")
	{
		alert(choiceInfo);
		return;
	}
	
	if (enteredAllBlks)
	{
		curr_tries++;
		
		if (curr_tries > num_tries && num_tries > 0 && num_tries_original > 0) 
		{
			alert(attempt_complete);
			return;
		}

		var isAllCorrectAns = true;
		
		for ( var i = 0; i < num_questions; i++) {
			var keys = allAnswerArray.keys();
			
			if (userTextArray.get(keys[i]).toUpperCase() != allAnswerArray.get(keys[i]).toUpperCase()) {
				isAllCorrectAns = false;
			}
		}
		//alert("isAllCorrectAns:" + isAllCorrectAns);
		if (isAllCorrectAns) 
		{			
			correctFeedback(curr_tries, base_dir, path);
			check_user_anwered_correctly = true;
			curr_tries += 55;
		}
		
		else {

			incorrectFeedback(curr_tries, base_dir, path);
		}
	} 
}

function checkMatching2(base_dir, path) {
	//alert("in checkMatching2(base_dir, path)");
	//alert("num_tries: " + num_tries);
	
	if (num_tries_original == -1)
		num_tries_original = num_tries;
	
	//alert("num_tries_original: " + num_tries_original);
	
	var kid;
	var tm_form = document.matchform;
	var content = "";
	var distractor = "";
	curr_tries++;

	if (curr_tries > num_tries && num_tries > 0 && num_tries_original > 0) {
		alert(attempt_complete);
		return;
	}
	
	var score = 0;
	g_blnAttempted = false;
	
	var keys = TM.keys();
	
	for(var i=0;i<keys.length;i++) {
		var key = keys[i];
		var val = TM.get(keys[i]);		
		//alert("tm_form[]: " + tm_form["c_" + key].value);
		
		if (tm_form["c_" + key].value != "-1") {
			g_blnAttempted = true;
		}
		
		//alert("tm_form[]: " + tm_form["c_" + key].value + "     " + tm_form["c_" + key].name);
		if(tm_form["c_" + key].value == tm_form["c_" + key].name) {
			score++;
		}
	}
	
	//alert("g_blnAttempted: " + g_blnAttempted);	
	
	if (!g_blnAttempted) 
	{
		curr_tries--;
		if (num_tries_original > 0)
		{
			alert(choicewarn);
			return;
		}
		else
		{
			alert(choiceInfo);
			return;
		}
	}
	
	//alert("score out of num_questions: " + score + " out of " + num_questions);
	
	if (score == num_questions) {
		check_user_anwered_correctly = true;
		correctFeedback(curr_tries, base_dir, path);
		curr_tries += 55;		

	} else {
		incorrectFeedback(curr_tries, base_dir, path);
	}

}

function checkSorting2(base_dir, path) {
	//alert("in checkSorting2(base_dir, path)");
	//alert("num_tries: " + num_tries);
	
	if (num_tries_original == -1)
		num_tries_original = num_tries;
	
	//alert("num_tries_original: " + num_tries_original);
	
	var kid;
	var tm_form = document.matchform;
	var content = "";
	var distractor = "";
	curr_tries++;	
	
	if (curr_tries > num_tries && num_tries > 0 && num_tries_original > 0) {
		alert(attempt_complete);
		return;
	}

	var score = 0;
	g_blnAttempted = false;
	for (kid in TS) {
		var tt = kid.toString();		
		var t0 = tt.indexOf('c_');		
		if (t0 == 0) {
			//alert("tm_form[kid].value: " + tm_form[kid].value + "        " + TS[kid]);
			
			if (tm_form[kid].value != "-1") {
				g_blnAttempted = true;
			}

			if (tm_form[kid].value == TS[kid]) {
				score++;
			}
		}
	}
	
	//alert("g_blnAttempted: " + g_blnAttempted);	
	
	if (!g_blnAttempted) 
	{
		curr_tries--;
		if (num_tries_original > 0)
		{
			alert(choicewarn);
			return;
		}
		else
		{
			alert(choiceInfo);
			return;
		}
	}
	
	//alert( "score out of num_questions: " + score + " out of " + num_questions );

	if (score == num_questions) {
		check_user_anwered_correctly = true;
		correctFeedback(curr_tries, base_dir, path);
		curr_tries += 55;

	} else {
		incorrectFeedback(curr_tries, base_dir, path);
	}

}

function correctFeedback(curr_tries, base_dir, path) {
	//alert("in correctFeedback(curr_tries, base_dir, path)")
	
	var content = "";
	var distractor = "";
	if(num_tries == 0)
	{
		num_tries = 55;
	}
	
	if (curr_tries >= num_tries + 1 ) 
	{
		alert(correct_feedback);
		return;
	}
	//alert("feedback_type v2: " + feedback_type + " || " + "curr_tries: " + curr_tries + " || " + "num_tries: " + num_tries);
	
	if (feedback_type == 2) 
	{
		if (curr_tries > 1) 
		{
			if (questionCorrResponse != null) 
			{
				content = questionCorrResponse;
			} 
			else if (courseCorrResponse != null) 
			{
				content = courseCorrResponse;
			} 
			else 
			{
				content = RocceCorreResponse;
			}

		}
		else 
		{
			if (courseCorrResponse != null) 
			{
				content = courseCorrResponse;
			} 
			else 
			{
				content = RocceCorreResponse;
			}
		}
	} 
	else if (feedback_type == 3) 
	{
		if (curr_tries < num_tries) 
		{
			if (courseIncorrResponse != null) 
			{
				content = courseCorrResponse;
			}
			else
			{
				content = RocceCorreResponse;
			}
		} 
		else 
		{
			if (questionIncorrResponse != null)
			{
				content = questionCorrResponse;
			}
			else if (courseIncorrResponse != null) 
			{
				content = courseCorrResponse;
			} 
			else 
			{
				content = RocceCorreResponse;
			}
		}
	}
	else 
	{
		if (questionCorrResponse != null)
		{
			content = questionCorrResponse;
		} 
		else if (courseCorrResponse != null)
		{
			content = courseCorrResponse;
		} 
		else 
		{
			content = RocceCorreResponse;
		}
	}
	if (curr_tries >= num_tries) 
	{
		content+="<br></br>Your attempts are completed.\n";
		content+="<br></br> Please click the \"Close this Window\" link to continue...";
		distractor = "";
		setProceed(true);
		Question_Popup(distractor, content, base_dir, path);
		
		return;
	}
	else
	{
		distractor = "";
		content+="<br></br> Please click the \"Close this Window\" link to continue...";
		setProceed(true);
		Question_Popup(distractor, content, base_dir, path);
		
		return;
	}

}

function incorrectFeedback(curr_tries, base_dir, path) {
	
	//alert("in incorrectFeedback(curr_tries, base_dir, path)");
	
	var content = "";
	var distractor = "";
	
		
	if(num_tries == 0)
	{
		num_tries = 55;
	}
	if (curr_tries >= num_tries + 1) 
	{
		return;
	}
	//alert("feedback_type v2: " + feedback_type + " || " + "curr_tries: " + curr_tries + " || " + "num_tries: " + num_tries);
		
	if (feedback_type == 2)
	{
		if (curr_tries > 1) 
		{
			if (questionIncorrResponse != null)
			{
				content = questionIncorrResponse;
			}
			else if (courseIncorrResponse != null) 
			{
				content = courseIncorrResponse;
			} 
			else 
			{
				content = RocceIncorreResponse;
			}

		}
		else 
		{
			if (courseIncorrResponse != null) 
			{
				content = courseIncorrResponse;
			}
			else
				content = RocceIncorreResponse;

		}
	} 
	else if (feedback_type == 3) 
	{

		if (curr_tries < num_tries) 
		{
			if (courseIncorrResponse != null) 
			{
				content = courseIncorrResponse;
			}
			else
			{
				content = RocceIncorreResponse;
			}
		} 
		else 
		{
			if (questionIncorrResponse != null)
			{
				content = questionIncorrResponse;
			}
			else if (courseIncorrResponse != null) 
			{
				content = courseIncorrResponse;
			} 
			else 
			{
				content = RocceIncorreResponse;
			}

		}
	} 
	else if (feedback_type == 1)
	{	
		
		if (questionIncorrResponse != null) 
		{
			content = questionIncorrResponse;
		}
		else if(courseIncorrResponse !=null)
		{
			content = courseIncorrResponse;
		}
		else
		{
			content=RoceeIncorreResponse;
		}
		
	}	
	else
	{
		if (questionIncorrResponse != null)
		{
			content = questionIncorrResponse;
		}
		else if (courseIncorrResponse != null)
		{
			content = courseIncorrResponse;
		}
		else
		{
			content = RocceCorreResponse;
		}
	}
	
	if (curr_tries >= num_tries) 
	{
		content+="<br></br>Your attempts are completed.\n";
		content+="<br></br> Please click the \"Close this Window\" link to continue...";
		distractor = "";
		setProceed(true);
		Question_Popup(distractor, content, base_dir, path);
		
		return;
	}	
	else
	{
		distractor = "";
		setProceed(false);
		Question_Popup(distractor, content, base_dir, path);
		
		
		
		return;
	}
}

function setProceed(go){
	proceed = go;
}

function getKbqProceed() {
	return proceed;
}
