/**
 * @class YOM.InstanceManager
 */
define('./instance-manager', ['./object', './array'], function(object, array) {
	var YOM = {
		'object': object,
		'array': array
	};
		
	var InstanceManager = function() {
		this._init();
	};
	
	InstanceManager._ID = 124;
	
	InstanceManager.prototype = {
		_init: function() {
			this._pool = [];
		},
		
		add: function(inst) {
			var id = $getUniqueId();
			this._pool.push({id: id, inst: inst});
			return id;
		},
		
		get: function(id) {
			var res;
			YOM.object.each(this._pool, function(item) {
				if(item.id == id) {
					res = item.inst;
					return false;
				}
				return true;
			});
			return res;
		},
		
		remove: function(id) {
			YOM.array.remove(this._pool, function(item) {
				if(item.id == id) {
					return -1;
				}
				return 0;
			});
		},
		
		count: function() {
			return this._pool.length;
		},
		
		each: function(cb, bind) {
			YOM.object.each(this._pool, function(item) {
				if(item) {
					return cb.call(bind, item.inst, item.id);
				}
				return true;
			});
		},
		
		clear: function() {
			this._init();
		},
		
		constructor: InstanceManager
	};
	
	return InstanceManager;
});
