/**
 * @class YOM.Error
 */
/*
Code Description:
YOM.Class
	10101: constructor - arguments length error
YOM.JsLoader
	10201: load fail
	10202: callback fail
YOM.Xhr
	10401: onerror
*/
define(function() {
	var YomError = function(code, opt) {
		if(typeof opt == 'string') {
			opt = {message: opt}
		}
		this.opt = opt || {}
		if(code instanceof YomError) {
			this.name = code.name
			this.code = code.code
			this.message = code.message
		} else if(code instanceof Error || Object.prototype.toString.call(code) == '[object Error]') {
			this.name = code.name
			this.code = 0
			this.message = code.message
		} else {
			this.name = this.opt.name || 'YOM Error'
			this.code = +code
			this.message = this.opt.message || ''
		}
	}
	
	YomError._ID = 101
	
	YomError.getCode = function(id, code) {
		if(code < 10) {
			code = '0' + code
		}
		return parseInt(id + '' + code)
	}
	
	YomError.prototype.toString = function() {
		return this.name + ': ' + this.message + (this.code ? ' [' + this.code + ']' : '')
	}
	
	return YomError
})
