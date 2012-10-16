/**
 * @namespace YOM.object
 */
define('yom/object', ['require'], function(require) {
	return {
		_ID: 110,
		
		PRIVATE_PROPERTY: {/*Do not assign this value to your reference in your code!*/},
			
		toString: function(obj) {
			return Object.prototype.toString.call(obj);
		},
		
		isArray: function(obj) {
			var YOM = {
				'array': require('yom/array')
			};
			return YOM.array.isArray(obj);
		},
		
		isFunction: function(obj) {
			return typeof obj == 'function';
		},
		
		hasOwnProperty: function(obj, prop) {
			return Object.prototype.hasOwnProperty.call(obj, prop);
		},
		
		each: function(obj, fn, bind) {
			var YOM = {
				'array': require('yom/array')
			};
			var val;
			if(YOM.array.isArray(obj)) {
				YOM.array.each(obj, fn, bind);
			} else {
				for(var p in obj) {
					if(this.hasOwnProperty(obj, p)) {
						try {
							val = obj[p];
						} catch(e) {
							val = this.PRIVATE_PROPERTY;
						}
						if(fn.call(bind || obj, val, p, obj) === false) {
							break;
						}
					}
				}
			}
		},
		
		extend: function(origin, extend, check) {
			origin = origin || {};
			for(var p in extend) {
				if(this.hasOwnProperty(extend, p) && (!check || typeof origin[p] == 'undefined')) {
					origin[p] = extend[p];
				}
			}
			return origin;
		},
		
		bind: function(obj, fn) {
			return $bind(obj, fn);
		},

		clone: function(obj, deep) {
			var YOM = {
				'array': require('yom/array')
			};
			if(typeof obj == 'object') {
				var res = YOM.array.isArray(obj) ? [] : {};
				for(var i in obj) {
					res[i] = deep ? this.clone(obj[i], deep) : obj[i];
				}
				return res;
			}
			return obj;
		},
		
		toQueryString: function(obj) {
			var res = [];
			this.each(obj, function(val, key) {
				var type = typeof val;
				if(!(type == 'string' || type == 'number')) {
					return;
				}
				res.push(key + '=' + encodeURIComponent(val));
			});
			return res.join('&');
		},
		
		fromQueryString: function(str) {
			var res = {};
			var items = str.split('&');
			this.each(items, function(item) {
				item = item.split('=');
				res[item[0]] = decodeURIComponent(item[1]);
			});
			return res;
		}
	};
});