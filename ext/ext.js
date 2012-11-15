/**
 * @namespace
 */
define(function(require) {
	var consoleTmpl = require('./console.tpl.html');
	
	var ext = {
		'Chunker': require('./chunker'),
		'console': require('./console')
	};
	
	return ext;
});
