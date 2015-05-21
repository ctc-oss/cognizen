/********************************************************************************************
**  PAGE CONTENT EDITOR TOOLBARS
********************************************************************************************/
var contentToolbar = [
	//{ name: 'clipboard', groups: [ 'clipboard', 'undo' ], items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
	//{ name: 'forms', items: [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField' ] },
	{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat' ] },
	{ name: 'paragraph', groups: [ 'list', 'liststle', 'indent', 'blocks', 'align', 'bidi' ], items: [ 'NumberedList', 'BulletedList', 'ListStyle', '-', 'Outdent', 'Indent', '-', 'Blockquote', /*'CreateDiv',*/ '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'/*, '-', 'BidiLtr', 'BidiRtl', 'Language'*/ ] },
	{ name: 'links', items: [ 'Link', 'Unlink'/*, 'Anchor' */] },
	{ name: 'insert', items: [ 'Image', 'Flash', 'Table', 'Chart', 'HorizontalRule', /*'Smiley',*/ 'SpecialChar'/*, 'PageBreak', 'Iframe'*/ ] },
	'/',
	{ name: 'editing', groups: [ 'find', 'spellchecker' ], items: [ 'Find', 'Replace', '-', 'Scayt' ] },
	{ name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize' ] },
	{ name: 'colors', items: [ 'TextColor', 'BGColor' ] },
	{ name: 'tools', items: [ 'Maximize', 'ShowBlocks' ] },
	{ name: 'document', groups: [ 'mode', 'document', 'doctools' ], items: [ 'Sourcedialog', '-', 'Templates' ] }
	//{ name: 'others', items: [ '-' ] },
	//{ name: 'about', items: [ 'About' ] }
];

var contentToolgroup = [
	
	//{ name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
	//{ name: 'forms' },
	{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
	{ name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },
	{ name: 'links' },
	{ name: 'insert' },
	'/',
	{ name: 'editing', groups: [ 'find', 'spellchecker' ] },
	{ name: 'styles' },
	{ name: 'colors' },
	{ name: 'tools' },
	{ name: 'document', groups: [ 'mode', 'document', 'doctools' ] }
	//{ name: 'others' },
	//{ name: 'about' }
];


/********************************************************************************************
**  PAGE TITLE EDITOR TOOLBARS
********************************************************************************************/
var pageTitleToolbar = [
	{ name: 'basicstyles', groups: [ 'basicstyles'], items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript','-', 'RemoveFormat'] },
	{ name: 'colors', items: [ 'TextColor', 'BGColor' ] },
	{ name: 'document', groups: [ 'mode'], items: [ 'Sourcedialog'] }
];


var pageTitleToolgroup = [
	{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
	{ name: 'colors' },
	{ name: 'document', groups: [ 'mode'], items: [ 'Sourcedialog'] }
];

/********************************************************************************************
**  CAPTION TEXT EDITOR TOOLBARS
********************************************************************************************/
var captionToolbar = [
	{ name: 'basicstyles', groups: [ 'basicstyles'], items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'] },
	{ name: 'links', items: [ 'Link', 'Unlink'/*, 'Anchor' */] },
	{ name: 'document', groups: [ 'mode'], items: [ 'Sourcedialog'] }
];

var captionToolgroup = [
	{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
	{ name: 'links' },
	{ name: 'document', groups: [ 'mode'] }
];
