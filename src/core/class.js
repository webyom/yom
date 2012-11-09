/**
 * @class YOM.Class
 */
define(['./error', './object', './array'], function(Err, object, array) {
	var YOM = {
		'Error': Err,
		'object': object,
		'array': array
	};
	
	var Class = function() {};

	var _ID = 102;
	
	Class.extend = function(subClass, superClass) {
		if(arguments.length < 2) {
			throw new YOM.Error(YOM.Error.getCode(_ID, 1));
		}
		var F = function() {};
		F.prototype = superClass.prototype;
		subClass.prototype = new F();
		subClass.prototype.constructor = subClass;
		subClass.superClass = superClass.prototype;
		if(superClass.prototype.constructor == Object.prototype.constructor) {
			superClass.prototype.constructor = superClass;
		}
		return subClass;
	};
	
	Class.genericize = function(obj, props, opt) {
		opt = opt || {};
		if(!YOM.array.isArray(props)) {
			props = [props];
		}
		YOM.object.each(props, function(prop) {
			if((!opt.check || !obj[prop]) && YOM.object.isFunction(obj.prototype[prop])) {
				obj[prop] = function(){
					var args = YOM.array.getArray(arguments);
					return obj.prototype[prop].apply(opt.bind || args.shift(), args);
				};
			}
		});
	};
	
	return Class;
});

