/**
 * @class YOM.HashArray
 */
define('./hash-array', [], function() {
	var HashArray = function() {
		this._items = [];
		this._k2i = {};
		this._i2k = [];
		for(var i = 0, l = arguments.length; i < l; i += 2) {
			if(this._isValidKey(arguments[i])) {
				this._items.push(arguments[i + 1]);
				this._i2k.push(arguments[i]);
				this._k2i[arguments[i]] = this.size() - 1;
			}
		}
	};
	
	HashArray._ID = 123;
	
	HashArray.prototype = {
		_isValidKey: function(key) {
			return key && typeof key == 'string';
		},
		
		size: function() {
			return this._items.length;	
		},
		
		get: function(key) {
			if(typeof key == 'string') {
				return this._items[this._k2i[key]];
			} else {
				return this._items[key];
			}
		},
		
		set: function(key, val) {
			if(this._isValidKey(key)) {
				if(this._k2i[key] >= 0) {
					this._items[this._k2i[key]] = val;
				}
			} else if(typeof key == 'number') {
				if(key < this._items.length) {
					this._items[key] = val;
				}
			}
		},
		
		remove: function(key) {
			if(this._isValidKey(key)) {
				if(this._k2i[key] >= 0) {
					return this.splice(this._k2i[key], 1);
				}
			} else if(typeof key == 'number') {
				if(key < this._items.length) {
					return this.splice(key, 1);
				}
			}
			return null;
		},
		
		hasKey: function(key) {
			return this._k2i[key] >= 0;
		},
		
		hasValue: function(val) {
			var has = false;
			this.each(function(v) {
				if(val === v) {
					has = true;
					return false;
				}
				return true;
			});
			return has;
		},
		
		each: function(cb) {
			for(var i = 0, l = this._items.length; i < l; i++) {
				if(cb(this._items[i], i, this._i2k[i]) ===  false) {
					break;
				}
			}
		},
		
		push: function(key, val) {
			if(!this._isValidKey(key)) {
				return;
			}
			var i = this._items.length;
			this._items.push(val);
			this._i2k.push(key);
			this._k2i[key] = i;
		},
		
		pop: function() {
			var dk = this._i2k.pop();
			var dv = this._items.pop();
			delete this._k2i[dk];
			return dk ? new HashArray(dk, dv) : undefined;
		},
		
		unshift: function(key, val) {
			if(!this._isValidKey(key)) {
				return;
			}
			this._items.unshift(val);
			this._i2k.unshift(key);
			for(var k in this._k2i) {
				if(this._k2i.hasOwnProperty(k)) {
					this._k2i[k]++;
				}
			}
			this._k2i[key] = 0;
		},
		
		shift: function() {
			var dk = this._i2k.shift();
			var dv = this._items.shift();
			for(var k in this._k2i) {
				if(this._k2i.hasOwnProperty(k)) {
					if(dk == k) {
						delete this._k2i[k];
					} else {
						this._k2i[k]--;
					}
				}
			}
			return dk ? new HashArray(dk, dv) : undefined;
		},
		
		slice: function(s, e) {
			var ks, vs, res;
			ks = this._i2k.slice(s, e);
			vs = this._items.slice(s, e);
			res = new HashArray();
			for(i = 0, l = ks.length; i < l; i++) {
				res.push(ks[i], vs[i]);
			}
			return res;
		},
		
		splice: function(s, c) {
			var dks, dvs, i, l, res;
			var ks = [], vs = [];
			for(i = 2, l = arguments.length; i < l; i += 2) {
				if(this._isValidKey(arguments[i])) {
					ks.push(arguments[i]);
					vs.push(arguments[i + 1]);
				}
			}
			dks = Array.prototype.splice.apply(this._i2k, [s, c].concat(ks));
			dvs = Array.prototype.splice.apply(this._items, [s, c].concat(vs));
			res = new HashArray();
			for(i = 0, l = dks.length; i < l; i++) {
				if(this._k2i.hasOwnProperty(dks[i])) {
					delete this._k2i[dks[i]];
				}
				res.push(dks[i], dvs[i]);
			}
			for(i = s, l = this._i2k.length; i < l; i++) {
				this._k2i[this._i2k[i]] = i;
			}
			return res;
		},
		
		concat: function(ha) {
			var res, i, l;
			var ks = [], vs = [];
			if(!(ha instanceof HashArray)) {
				return this;
			}
			res = new HashArray();
			for(i = 0, l = this.size(); i < l; i++) {
				res.push(this._i2k[i], this._items[i]);
			}
			for(i = 0, l = ha.size(); i < l; i++) {
				res.push(ha._i2k[i], ha._items[i]);
			}
			return res;
		},
		
		join: function(s) {
			return this._items.join(s);
		},
		
		constructor: HashArray
	};
	
	return HashArray;
});
