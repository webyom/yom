/**
 * @namespace YOM.cookie
 */
define(['./config'], function(config) {
	var YOM = {
		'config': config
	}
	
	return {
		_ID: 105,
		
		set: function(name, value, domain, path, hour) {
			var expire
			if(hour) {
				expire = new Date()
				expire.setTime(expire.getTime() + 3600000 * hour)
			}
			document.cookie = (name + '=' + value + '; ') + (expire ? ('expires=' + expire.toGMTString() + '; ') : '') + ('path=' + (path || '/') + '; ') + ('domain=' + (domain || YOM.config.domain) + ';')
		},
		
		get: function(name) {
			var r = new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'), m = document.cookie.match(r)
			return m && m[1] || ''
		},
		
		del: function(name, domain, path) {
			document.cookie = name + '=; expires=Mon, 26 Jul 1997 05:00:00 GMT; ' + ('path=' + (path || '/') + '; ') + ('domain=' + (domain || YOM.config.domain) + ';')
		}
	}
})

