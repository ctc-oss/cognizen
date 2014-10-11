/*
 *  jQuery Dynamic Background Image Plugin
 *  Requires jQuery v1.2.6 or later
 *
 *
 *  Version: 1.0
 */
(function($)
{
   $.fn.fitToBackgroundImage = function()
   {
   		
      // Helper function to extract the URL from CSS
      function cleanupUrl(aUrl)
      {
         var regExp = /^url\("?(.*?)"?\)$/ig;
         var matches = regExp.exec(aUrl);
 
         if(matches == null || typeof matches[1] == "undefined")
          
            return null;
           
 
         return matches[1];
      }
 
      // Returning the updated HTML elements in a
      // way that allows for other jQuery methods
      // to manipulate them further
      return this.each
      (function(index)
      {
         // Ensure we get a reference to the element
         // which we can use closure on
         var $this = $(this);
        
         // Get the baground image using jQuery,
         // no need to worry about computed style
         // because jQuery will handle that part
         var backgroundImageUrl = cleanupUrl($this.css("background-image"));
        
         // If no background image is set then return
         if(backgroundImageUrl == null){
            if(isMobile){
               $this.css("width", windowWidth+"px")
                 .css("height", windowHeight+"px");
            }
         }
            //return;
 
         // Create a dummy image to get the dimensions
         // of the image
         var dummyImage = document.createElement("img");
 
         // When the image is loaded then
         // set the dimensions
         dummyImage.onload = function()
         {
            // Thanks to JavaScript closure we can access
            // the elt variable from the onload method
            $this.css("width", this.width+"px")
                 .css("height", this.height+"px");
         };
 
         // Get the URL for the background image
         dummyImage.src = backgroundImageUrl;
 
         // Cleanup
         dummyImage = null;
      });
   }
}) (jQuery);
