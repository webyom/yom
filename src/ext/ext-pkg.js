/**
 * @namespace
 */
define(function(require) {
	var consoleTmpl = require('./console.html');
	
	var ext = {
		'Chunker': require('./chunker'),
		'console': require('./console')
	};
	
	return ext;
});
