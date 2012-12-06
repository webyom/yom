/**
 * @namespace YOM.json
 */
define(['./error', './object', './array', './json-sans-eval'], function(Err, object, array, jsonParse) {
	var YOM = {
		'Error': Err,
		'object': object,
		'array': array,
		'jsonParse': jsonParse
	}
	
	var _ID = 126
	
	var _escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g
	var _meta = {
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'"' : '\\"',
		'\\': '\\\\'
	}
	
	function _quote(str) {
		_escapable.lastIndex = 0
		return _escapable.test(str) ? '"' + str.replace(_escapable, function(c) {
			return _meta[c] || '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)
		}) + '"' : '"' + str + '"'
	}
	
	return {
		parse: function(str) {
			return YOM.jsonParse(str)
		},
		
		stringify: function(obj, prettify, objIndentLevel) {
			var self = this
			var res, tmp, indent, newLine, colon, comma
			if(prettify) {
				objIndentLevel = objIndentLevel || 1
				newLine = '\n'
				colon = ': '
				comma = ', '
			} else {
				objIndentLevel = 0
				newLine = ''
				colon = ':'
				comma = ','
			}
			switch(typeof obj) {
			case 'string':
				res = _quote(obj)
				break
			case 'boolean':
				res = obj.toString()
				break
			case 'number':
				if(isNaN(obj)) {
					throw new YOM.Error(YOM.Error.getCode(_ID, 1), 'NaN not supported.')
				} else if(!isFinite(obj)) {
					throw new YOM.Error(YOM.Error.getCode(_ID, 2), 'Infinite number not supported.')
				} else {
					res = obj.toString()
				}
				break
			case 'object':
				if(!obj) {
					res = 'null'
					break
				}
				tmp = []
				if(obj.__YOM_JSON_STRINGIFY_MARKED__) {
					throw new YOM.Error(YOM.Error.getCode(_ID, 1), 'YOM.json.stringify can not deal with circular reference.')
				}
				obj.__YOM_JSON_STRINGIFY_MARKED__ = 1
				if(YOM.array.isArray(obj)) {
					YOM.object.each(obj, function(val) {
						var s = self.stringify(val, prettify, objIndentLevel)
						s && tmp.push(s)
					})
					res = '[' + tmp.join(comma) + ']'
				} else {
					indent = []
					for(var i = 0; i < objIndentLevel; i++) {
						indent.push('    ')
					}
					YOM.object.each(obj, function(val, key) {
						if(key == '__YOM_JSON_STRINGIFY_MARKED__' || val === YOM.object.PRIVATE_PROPERTY) {
							return
						}
						if(YOM.object.hasOwnProperty(obj, key)) {
							var s = self.stringify(val, prettify, objIndentLevel + 1)
							s && tmp.push(indent.join('') + _quote(key) + colon + s)
						}
					})
					indent.pop()
					if(tmp.length) {
						res = '{' + newLine + tmp.join(comma + newLine) + newLine + indent.join('') + '}'
					} else {
						res = '{}'
					}
				}
				delete obj.__YOM_JSON_STRINGIFY_MARKED__
				break
			default:
				throw new YOM.Error(YOM.Error.getCode(_ID, 3), typeof obj + ' type not supported.')
			}
			return res
		}
	}
})

