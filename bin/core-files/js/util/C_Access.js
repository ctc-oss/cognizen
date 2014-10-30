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
	var tabIndex = 1;
	//Add page specific order
	for(var i = 0; i < items.length; i++){
		//console.log($(items[i]));
		$(items[i]).attr("tabindex", tabIndex);
		//$(items[i]).attr("aria-label", $(items[i]).text());
		tabIndex++;
	}

	for(var a = 0; a < audioAccess_arr.length; a++){
		//console.log(audioAccess_arr[a]);
		audioAccess_arr[a].attr("tabIndex", tabIndex);
		tabIndex++;
	}
	//Pick up with shell items after page items (index/next/back/page/course/module).
	for(var j = 0; j < globalAccess_arr.length; j++){
		//console.log(globalAccess_arr[j]);
		//globalAccess_arr[j].attr('aria-label', globalAccess_arr[j].text());
		globalAccess_arr[j].attr("tabindex", tabIndex);
		tabIndex++;
	}

	items[0].focus();
	items[0].blur();
}