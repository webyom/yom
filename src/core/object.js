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

		clone: function(obj, deep, _level) {
			var YOM = {
				'array': require('yom/array')
			};
			var res = obj;
			var i, j, p;
			deep = deep || 0;
			_level = _level || 0;
			if(_level > deep) {
				return res;
			}
			if(typeof obj == 'object' && obj) {
				if(YOM.array.isArray(obj)) {
					res = [];
					for(i = 0, l = obj.length; i < l; i++) {
						res.push(obj[i]);
					}
				} else {
					res = {};
					for(p in obj) {
						if(this.hasOwnProperty(obj, p)) {
							res[p] = deep ? this.clone(obj[p], deep, ++_level) : obj[p];
						}
					}
				}
			}
			return res;
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