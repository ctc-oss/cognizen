/*
 *  	C_Access
 *		Home for Accessibility functionalities (used across templates).
 *  	Version: 0.5
 *		Date Created: 10/07/14
 *		Created by: Philip Double
 *		Date Updated: 10/07/14
 *		Updated by: Philip Double
 *		History:
 *		Function List:
 				//Gerate the urlParams Variable
 				@doAccessibility(items)
 */





/*****************************************************************************************************************************************************************************************************************
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
ACESSIBILITY/508 FUNCTIONALITY
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
*****************************************************************************************************************************************************************************************************************/
function doAccess(items){

	var body = document.getElementsByTagName("body")[0];
	body.setAttribute('role', 'application');
	var tabIndex = 1;

	//Adding focusGuard front - added to index like skip nav - keeps focus inside of content.
	$("#frontFocusGuard").attr('tabindex', tabIndex).on('focus', function() {
	  // "last" focus guard got focus: set focus to the first field
	  var lastGlobal = globalAccess_arr.length;
	  console.log("last global = " + lastGlobal);
	  globalAccess_arr[lastGlobal - 1].focus();
	});

	tabIndex++;
	//Add page specific order
	for(var i = 0; i < items.length; i++){
		$(items[i]).attr("tabindex", tabIndex);
		tabIndex++;
	}

	for(var a = 0; a < audioAccess_arr.length; a++){
		//console.log(audioAccess_arr[a]);
		audioAccess_arr[a].attr("tabIndex", tabIndex);
		tabIndex++;
	}
	//Pick up with shell items after page items (index/next/back/page/course/module).
	for(var j = 0; j < globalAccess_arr.length; j++){
		globalAccess_arr[j].attr("tabindex", tabIndex);
		tabIndex++;
	}

	//Adding focus guard back - added to index like skip nav
	//Ensures that the tab indexing is cyclical - keeps focus inside of content.
	$("#backFocusGuard").attr('tabindex', tabIndex).on('focus', function() {
	  // "last" focus guard got focus: set focus to the first field
	  items[0].focus();
	});

	items[0].focus();
	//items[0].blur();
}