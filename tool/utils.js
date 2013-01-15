/**
 * Utils
 * Copyright (c) 2012 Gary Wang, webyom@gmail.com http://webyom.org
 * Under the MIT license
 * https://github.com/webyom/yom
 */
 
var isArray = Array.isArray || function(obj) {
	return Object.prototype.toString.call(obj) == '[object Array]'
}

function arrayEach(arr, callback) {
	for(var i = 0, l = arr.length; i < l; i++) {
		callback(arr[i], i, arr)
	}
}

function extendObject(origin, extend, check) {
	origin = origin || {}
	for(var p in extend) {
		if(Object.prototype.hasOwnProperty.call(extend, p) && (!check || typeof origin[p] == 'undefined')) {
			origin[p] = extend[p]
		}
	}
	return origin
}

function cloneObject(obj, deep, _level) {
	var res = obj
	deep = deep || 0
	_level = _level || 0
	if(_level > deep) {
		return res
	}
	if(typeof obj == 'object' && obj) {
		if(isArray(obj)) {
			res = []
			arrayEach(obj, function(item) {
				res.push(item)
			})
		} else {
			res = {}
			for(var p in obj) {
				if(Object.prototype.hasOwnProperty.call(obj, p)) {
					res[p] = deep ? cloneObject(obj[p], deep, ++_level) : obj[p]
				}
			}
		}
	}
	return res
}

exports.extendObject = extendObject
exports.cloneObject = cloneObject
