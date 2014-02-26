/*
 *  	C_ScrubContent
 *  	Requires jQuery v1.9 or later
 *	
 *   This function is run after content fields have been created.  Checks for specific .classes which then are formatted properly from their html code.	
 *  	Version: 1.0
 */
(function($){
	//Running a simple test.
	$.fn.scrubContent = function(){
		
		/***********************************************************
		CREATES A FOOTNOTE tooltip on .tooltip class members.  Very similar to tooltip but styled differently in C_Engine.css
		***********************************************************/
		$("#footnote").tooltip({
			show:{
				effect: "slideDown",
				delay: 500
			},
			track: true,
			tooltipClass: "footnoteTip"
		});
		
		/***********************************************************
		CREATES A MODAL DIALOG on .dialog class members.
		***********************************************************/
		$(".dialog").each(function(){
			$(this).dialog({
				modal: true,
				autoOpen: false,
				width: 500,
				//close: function(){$(this).remove();}
			})
		});
		
		
		/***********************************************************
		CREATES A BUTTON on .tooltip class members.
		***********************************************************/
		$(".button").each(function(){
			$(this).button();
			$(this).click(function(){
				var tempID = "#" + $(this).attr("title");
				$(tempID).dialog("open");
			})
		});
		
		/***********************************************************
		CREATES A TOOLTIP on .tooltip class members.
		***********************************************************/
		$(".toolTip").each(function(){
			$(this).tooltip({
				content: $(this).attr("title")
			})
		})
		
		
		/***********************************************************
		CREATES A TABBED LAYOUT
		***********************************************************/
		var tabLength = 0;
		var tabString = '<ul>'
		var myContent = $("#content").html();
		//SAVE THE PRE-TABS TEXT
		var removeElements = function(text, selector) {
		    var wrapped = $("<div>" + text + "</div>");
		    wrapped.find(selector).remove();
		    return wrapped.html();
		}
		
		var strippedContent = removeElements(myContent, "tab");

		$(".contentTab").each(function(){
			tabString += '<li><a href="#'+ $(this).attr("title") +'">'+ $(this).attr("title") +'</a></li>';
			tabLength++;
		});
			
		if(tabLength > 0){	
			tabString += "</ul>";
			$(".contentTab").each(function(){
				var currentTab = $(this).attr("title");
				var currentTabContent = $(this).html();
				tabString += '<div id="'+ currentTab +'">' + currentTabContent + '</div>';
			});
			
			$("#content").empty();
			$("#content").append(strippedContent + tabString);
			var newWidth = $("#content").width() -3;
			$("#content").width(newWidth);
			$("#content").tabs();
			
		}

		$("#editTip").tooltip();
	}	
}) (jQuery);