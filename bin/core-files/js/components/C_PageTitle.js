function C_PageTitle(){
	 var myPageTitle;//Title of this page.
	 //Page title value from content.xml
     myPageTitle = $(data).find("page").eq(currentPage).find('title').first().text();
     
     //Add the divs for the page title adn the content divs.
     $('#stage').append('<div id="pageTitle"></div>');
     $("#pageTitle").append(myPageTitle);
     
     if(mode == "edit"){	
        /*******************************************************
		* Edit Title
		********************************************************/
		$("#pageTitle").attr('contenteditable', true);
        CKEDITOR.disableAutoInline = true;
        
		CKEDITOR.inline( 'pageTitle', {
			on: {
				blur: function (event){
					if(cachedTextPreEdit != event.editor.getData()){
						saveTitleEdit(event.editor.getData());
					}
					enableNext();
					enableBack();
				},
				focus: function(event){
					cachedTextPreEdit = event.editor.getData();
					disableNext();
					disableBack();
				}
			},
			toolbar: pageTitleToolbar,
			toolbarGroups : pageTitleToolgroup,
			extraPlugins: 'sourcedialog',
			enterMode : CKEDITOR.ENTER_BR,
			shiftEnterMode: CKEDITOR.ENTER_P,
			allowedContent: true
		});
	}
	
	/**********************************************************************
     **Save Title Edit - save updated page title text to content.xml
     **********************************************************************/
	function saveTitleEdit(_data){
        var titleUpdate = _data.replace('<p>', '').replace('</p>', '');
	   	var docu = new DOMParser().parseFromString('<title></title>',  "application/xml");
	   	var newCDATA=docu.createCDATASection(titleUpdate);
	   	$(data).find("page").eq(currentPage).find("title").first().empty();
	   	$(data).find("page").eq(currentPage).find("title").first().append(newCDATA);
	   	sendUpdateWithRefresh();
	};
	
	//get myPageTitle
	this.getPageTitle = function (){
		return myPageTitle;
	}
	
	/*****************************************************************************************************************************************************************************************************************
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    WIPE YOUR ASS AND WASH YOUR HANDS BEFORE LEAVING THE BATHROOM
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    *****************************************************************************************************************************************************************************************************************/
	this.destroy = function(){
		try { $('#pageTitle').remove(); } catch (e) {}
	}
	///////////////////////////////////////////////////////////////////////////THAT'S A PROPER CLEAN
}