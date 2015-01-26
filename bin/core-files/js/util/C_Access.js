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
function doAccess(items, _refresh){
	var refresh = false;
	if(_refresh){
		refresh = true;
	}
	
	var globalAccess_arr = [];
	try { globalAccess_arr.push($("#indexTab")); } catch(e) {}
	try { globalAccess_arr.push($("#glossaryTab")); } catch(e) {}
	try { globalAccess_arr.push($("#back")); } catch(e) {}
	try { globalAccess_arr.push($("#next")); } catch(e) {}
	
	var tabIndex = 1;
	tabIndex++;
	
	//Add page specific order
	for(var i = 0; i < items.length; i++){
		$(items[i]).attr("tabindex", tabIndex);
		tabIndex++;
	}

	//Pick up with shell items after page items (index/next/back/page/course/module).
	for(var j = 0; j < globalAccess_arr.length; j++){

		globalAccess_arr[j].attr("tabindex", tabIndex);
		tabIndex++;
	}
	
	if(mode != "edit" && !refresh){
		$("#pageTitle").focus();
	}
	refresh = false;
}