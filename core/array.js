/**
 * @namespace YOM.array
 */
define(['require'], function(require) {
	return {
		_ID: 103,
		
		isArray: Array.isArray || function(obj) {
			var object = require('./object')
			return object.toString(obj) == '[object Array]'
		},
	
		each: function(arr, fn, bind) {
			for(var i = 0, l = arr.length; i < l; i++) {
				if(fn.call(bind || arr, arr[i], i, arr) === false) {
					break
				}
			}
		},
		
		remove: function(arr, item) {
			var isFn = typeof item == 'function'
			var flag
			for(var i = arr.length - 1; i >= 0; i--) {
				flag = isFn && item(arr[i], i, arr)
				if(arr[i] == item || flag) {
					arr.splice(i, 1)
					if(flag === -1) {
						break
					}
				}
			}
			return arr
		},
		
		getArray: function(obj) {
			return Array.prototype.slice.call(obj)
		},
		
		filter: function(arr, fn) {
			var object = require('./object')
			if(typeof arr.filter == 'function') {
				return arr.filter(fn)
			} else {
				var res = []
				object.each(arr, function(item, i) {
					if(fn(item, i, arr)) {
						res.push(item)
					}
				})
				return res
			}
		}
	}
})
