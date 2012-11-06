/**
 * @namespace YOM.string
 */
define('./string', [], {
	_ID: 117,
	
	getByteLength: function(str) {
		return str.replace(/[^\x00-\xff]/g, 'xx').length;
	},
	
	headByByte: function(str, len, postFix) {
		if(this.getByteLength(str) <= len) {
			return str;
		}
		postFix = postFix || '';
		var l;
		if(postFix) {
			l = len = len - this.getByteLength(postFix);
		} else {
			l = len;
		}
		do {
			str = str.slice(0, l--);
		} while(this.getByteLength(str) > len);
		return str + postFix;
	},
	
	encodeHtml: function(str) {
		return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\x60/g, '&#96;').replace(/\x27/g, '&#39;').replace(/\x22/g, '&quot;');
	},
	
	decodeHtml: function(str) {
		return (str + '').replace(/&quot;/g, '\x22').replace(/&#0*39;/g, '\x27').replace(/&#0*96;/g, '\x60').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
	},
	
	trim: function(str) {
		if(str.trim) {
			return str.trim();
		} else {
			return str.replace(/^\s+|\s+$/, '');
		}
	},
	
	toCamelCase: function(str) {
		return str.replace(/[-_]+(\w)([^-_]*)/g, function($1, $2, $3) {return $2.toUpperCase() + $3.toLowerCase();});
	},
	
	toJoinCase: function(str, joiner) {
		joiner = joiner || '-';
		return str.replace(/[A-Z]/g, function($1) {return joiner + $1.toLowerCase();}).replace(new RegExp("^" + joiner), '');
	}
});