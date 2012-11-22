/**
 * @namespace YOM.pos
 */
define(['./object'], function(object) {
	var YOM = {
		'object': object
	}
	
	return {
		_ID: 112,
		
		getPos: function(onSuccess, onFail) {
			if(navigator.geolocation && navigator.geolocation.getCurrentPosition) {
				navigator.geolocation.getCurrentPosition(function (position) {
					if(YOM.object.isFunction(onSuccess)) {
						onSuccess.call(position, position.coords.latitude, position.coords.longitude)
					}
				}, onFail)
			} else {
				onFail({
					code: 0,
					message: 'Not Supported'
				})
			}
		},
		
		watchPos: function(onSuccess, onFail) {
			if(navigator.geolocation && navigator.geolocation.watchPosition) {
				return navigator.geolocation.watchPosition(function (position) {
					if(YOM.object.isFunction(onSuccess)) {
						onSuccess.call(position, position.coords.latitude, position.coords.longitude)
					}
				}, onFail)
			} else {
				onFail({
					code: 0,
					message: 'Not Supported'
				})
				return null
			}
		},
		
		clearWatch: function(watchHandler) {
			if(watchHandler && navigator.geolocation && navigator.geolocation.clearWatch) {
				navigator.geolocation.clearWatch(watchHandler)
			}
		}
	}
})
