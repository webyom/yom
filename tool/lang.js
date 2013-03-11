/**
 * Multi-Language Support
 * Copyright (c) 2012 Gary Wang, webyom@gmail.com http://webyom.org
 * Under the MIT license
 * https://github.com/webyom/yom
 */

var fs = require('fs')
var path = require('path')

function getProperty(propName, properties) {
	var tmp, res
	tmp = propName.split('.')
	res = properties
	while(tmp.length && res) {
		res = res[tmp.shift()]
	}
	return res
}

exports.replaceProperties = function(content, properties) {
	if(!properties) {
		return content
	}
	return content.replace(/\${{([\w-\.]+)}}\$/g, function(full, propName) {
		var res = getProperty(propName, properties)
		return typeof res == 'string' ? res : full
	})
}

exports.getLangResource = (function() {
	var _LANG_CODE = {
		'en': 1, 'zh-cn': 1, 'zh-hk': 1
	}
	
	var charset = 'utf-8'
	
	function define() {
		var al = arguments.length
		if(al >= 3) {
			return arguments[2]
		} else {
			return arguments[al - 1]
		}
	}
	
	function require() {}
	
	return function getLangResource(dir, callback) {
		var langList = fs.readdirSync(dir)
		var res
		getLang()
		function getLang() {
			var langDir, langCode, fileList
			if(langList.length) {
				langDir = path.resolve(dir, langList.shift())
				langCode = path.basename(langDir)
				if(fs.statSync(langDir).isDirectory() && _LANG_CODE[langCode]) {
					fileList = fs.readdirSync(langDir)
					getResourceFile()
				} else {
					getLang()
				}
			} else {
				callback(res)
			}
			function getResourceFile() {
				var file, resourceKey, resource
				if(fileList.length) {
					file = path.resolve(langDir, fileList.shift())
					if(path.extname(file) == '.js') {
						resourceKey = path.basename(file).replace(/\.js$/, '')
						resource = eval(fs.readFileSync(file, charset))
						if(typeof resource == 'function') {
							resource = resource()
						}
						res = res || {}
						res.LANG_LIST = res.LANG_LIST || []
						if(!res[langCode]) {
							res[langCode] = {}
							res.LANG_LIST.push(langCode)
						}
						res[langCode][resourceKey] = resource
					}
					getResourceFile()
				} else {
					getLang()
				}
			}
		}
	}
})()