/**
 * @namespace YOM.util
 */
define(['./object'], function(object) {
	var YOM = {
		'object': object
	}
	
	return {
		_ID: 115,
		
		getUrlParam: function(name, loc) {
			loc = loc || window.location
			var r = new RegExp('(\\?|#|&)' + name + '=(.*?)(&|#|$)')
			var m = (loc.href || '').match(r)
			return (m ? m[2] : '')
		},
		
		getUrlParams: function(loc) {
			loc = loc || window.location
			var raw = loc.search, res = {}, p, i
			if(raw) {
				raw = raw.slice(1)
				raw = raw.split('&')
				for(i = 0, l = raw.length; i < l; i++) {
					p = raw[i].split('=')
					res[p[0]] = p[1] || ''
				}
			}
			raw = loc.hash
			if(raw) {
				raw = raw.slice(1)
				raw = raw.split('&')
				for(i = 0, l = raw.length; i < l; i++) {
					p = raw[i].split('=')
					res[p[0]] = res[p[0]] || p[1] || ''
				}
			}
			return res
		},
		
		appendQueryString: function(url, param, isHashMode) {
			if(typeof param == 'object') {
				param = YOM.object.toQueryString(param)
			} else if(typeof param == 'string') {
				param = param.replace(/^&/, '')
			} else {
				param = ''
			}
			if(!param) {
				return url
			}
			if(isHashMode) {
				if(url.indexOf('#') == -1) {
					url += '#' + param
				} else {
					url += '&' + param
				}
			} else {
				if(url.indexOf('#') == -1) {
					if(url.indexOf('?') == -1) {
						url += '?' + param
					} else {
						url += '&' + param
					}
				} else {
					var tmp = url.split('#')
					if(tmp[0].indexOf('?') == -1) {
						url = tmp[0] + '?' + param + '#' + (tmp[1] || '')
					} else {
						url = tmp[0] + '&' + param + '#' + (tmp[1] || '')
					}
				}
			}
			return url
		},
		
		globalEval: function(content) {
			var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement
			var script = document.createElement('script')
			script.type = 'text/javascript'
			if('text' in script) {
				script.text = content
			} else {
				script.innerHTML = content
			}
			script = head.insertBefore(script, head.firstChild)
			setTimeout(function(){
				head.removeChild(script)
			}, 50)
		}
	}
})

