/*!
 * C_Chain
 * This class creates a template for placing grouping a collection of pages to appear as a single page.
 * Must be added to the template switch statement in the C_Engine!!!!!!!!!!!
 * VERSION: alpha 1.0
 * DATE: 2014-10-06
 *
 * Copyright (c) 2014, CTC. All rights reserved. 
 * 
 * @author: Philip Double, doublep@ctc.com
 */
 
 function C_Chain(_type) {
	//Template Variables
	var type = _type;
	var jointCount = 0;
	var currentJoint = 0;
	var isMandatory = true;
	
	//Edit Dialog Variables
	var currentEditBankMember = 0;
	var revealMenu_arr = [];
	var currentItem;
	var myObjective = "undefined";
    var myObjItemId = "undefined";
	
	
	this.initialize = function(){
		if(transition){
			$('#stage').css({'opacity':0});
		}
		
		//Set template variable values.
		jointCount = $(data).find("page").eq(currentPage).find("joint").length;
		
		if($(data).find("page").eq(currentPage).attr('objective')){
			myObjective = $(data).find("page").eq(currentPage).attr('objective');
		}

		if($(data).find("page").eq(currentPage).attr('objItemId')){
			myObjItemId = $(data).find("page").eq(currentPage).attr('objItemId');
		}
		
		buildTemplate();
	}
	
	function buildTemplate(){
		alert("buildTemplate() called.");
		loadJoint(currentJoint);
	}
	
	function chainComplete(){
		//Enable next/back buttons? Override buttons until chain complete?
	}
}