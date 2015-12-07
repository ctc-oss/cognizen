/*!
 * C_TextTop
 * This class creates a template for a text top / image bottom layout.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2012-12-16
 * JavaScript
 *
 * Copyright (c) 2012, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 * @example: o_obj = new someObj();
 *			 alert(o_obj.publicVar);//alerts "public"
 *	         o_obj.publicVar = 'new';
 *			 alert(o_obj.publicVar);//alerts "new"
 *			 alert(o_obj.privateVar);//alerts nothing or an error, depending on the browser ---- WRONG WAY!!!!
 *			 o_obj.someOtherMethod();//will throw an undefined function error ----- WRONG WAY!!!!
 *			 o_obj.someMethod();//alerts "boo" followed by "indirect reference".
 *			 o_obj = new someObj();
 *			 o_obj.doOtherObj();
 *			 o_obj.o_otherObj.otherMethod(); //alerts "over the rainbow"
 *
 * @usage: to set a value as public you must have this.myVar - var myVar results in a private var.
 *		   to call a private function, you must call it from a public function - see example below.
 */
function someObj() {

    this.o_otherobj;
    this.publicVar = 'public';
    var privateVar = 'private';


    this.doOtherObj = function() {

        this.o_otherobj = new otherObj();

    }
    
    //Defines a public method - notice the difference between the private definition below.
	this.someMethod = function someMethod(){
		alert("boo");
		someOtherMethod();
	}
	
	//Defines a private method - notice the difference between the public definitions above.
	var someOtherMethod = function() {
		alert('indirect reference');
	}

}



function otherObj() {

    this.otherMethod = function() {

        alert('over the rainbow');

    }

}



o_obj = new someObj();

o_obj.someMethod();

o_obj.doOtherObj();

o_obj.o_otherobj.otherMethod(); //alerts "over the rainbow"