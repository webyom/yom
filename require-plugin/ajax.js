/**
 * YOM require ajax plugin
 */
define('require-plugin/ajax', ['global'], function(global) {
	var _ERROR_OBJ = {}
	
	var _cache = {}
	
	function _loadXhr(url, callback, opt) {
		var xhr
		try {
			xhr = new XMLHttpRequest()
		} catch(e) {
			xhr = new ActiveXObject('MSXML2.XMLHTTP')
		}
		xhr.open('GET', url, true)
		if(opt.noCache) {
			this._xhr.setRequestHeader('If-Modified-Since', 'Sun, 27 Mar 1983 00:00:00 GMT')
			this._xhr.setRequestHeader('Cache-Control', 'no-cache')
		}
		if(opt.withCredentials) {
			this._xhr.withCredentials = true
		}
		xhr.onreadystatechange = function() {
			if(xhr.readyState !== 4) {
				return
			}
			if(xhr.status >= 200 && xhr.status < 300) {
				callback(eval('(' + xhr.responseText + ')'))
			} else {
				callback(null, _ERROR_OBJ)
			}
		}
		xhr.send()
	};
	
	function req(id, config, callback, errCallback) {
		var url = this._getResource(id)
		var params
		if(callback) {
			if(url) {
				params = this._getParams(id)
				if(params['dataType'] == 'jsonp' || params['dataType'] != 'json' && url.indexOf(location.protocol + '//' + location.host + '/') !== 0) {
					require([id.replace(/^ajax/, 'jsonp')], function(data) {
						_cache[url] = data
						callback(data)
					}, function(err, info) {
						errCallback && errCallback(err, info)
					})
				} else {
					_loadXhr(url, function(data, err) {
						if(err === _ERROR_OBJ) {
							errCallback && errCallback(require.ERR_CODE.LOAD_ERROR, {uri: url})
						} else {
							_cache[url] = data
							callback(data)
						}
					}, {
						noCache: !!params['noCache'],
						withCredentials: !!params['withCredentials']
					})
				}
			} else {
				callback(this)
			}
		}
		return url && _cache[url] || this
	}
	
	return {
		require: req
	}
})
