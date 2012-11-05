/**
 * @namespace
 */
define(['require', document.querySelectorAll ? '' : 'yom/inc/sizzle'], function(require, Sizzle) {
	var YOM = function(sel, context) {
		return $query(sel, context);
	};
	
	YOM._ID = 100;
	YOM.debugMode = 0;
	
	YOM = $extend(YOM, {
		'config': require('yom/config'),
		'Error': require('yom/error'),
		'browser': require('yom/browser'),
		'string': require('yom/string'),
		'object': require('yom/object'),
		'array': require('yom/array'),
		'Chunker': require('yom/chunker'),
		'Class': require('yom/class'),
		'HashArray': require('yom/hash-array'),
		'InstanceManager': require('yom/instance-manager'),
		'json': require('yom/json'),
		'Observer': require('yom/observer'),
		'Event': require('yom/event'),
		'Element': require('yom/element'),
		'transition': require('yom/transition'),
		'Tween': require('yom/tween'),
		'cookie': require('yom/cookie'),
		'Xhr': require('yom/xhr'),
		'CrossDomainPoster': require('yom/cross-domain-poster'),
		'pos': require('yom/pos'),
		'util': require('yom/util'),
		'JsLoader': require('yom/js-loader'),
		'css': require('yom/css'),
		'tmpl': require('yom/tmpl'),
		'console': require('yom/console'),
		'flash': require('yom/flash'),
		'widget': require('yom/widget')
	});
	
	YOM.Event = $extend(YOM.Event, {
		'Delegator': require('yom/event-delegator'),
		'VirtualEventHandler': require('yom/event-virtual-handler'),
		'MouseenterEventHandler': require('yom/event-mouseenter'),
		'MouseleaveEventHandler': require('yom/event-mouseleave')
	});
	
	require('yom/element-fx');
	
	return YOM;
});

function $id(id) {
	return document.getElementById(id);
};

function $query(sel, context) {
	var Element = require('yom/element');
	var res;
	if(sel instanceof Element) {
		return sel;
	} else if(typeof sel == 'string') {
		if(context) {
			context = new Element(typeof context == 'string' ? (document.querySelectorAll ? document.querySelectorAll(context) : Sizzle(context)) : context);
			res = context.find(sel);
		} else {
			res = new Element(document.querySelectorAll ? document.querySelectorAll(sel) : Sizzle(sel));
		}
	} else {
		res = new Element(sel);
	}
	return res;
};

function $getClean(obj) {
	var object = require('yom/object');
	var cleaned;
	if(obj && obj.getClean) {
		cleaned = obj.getClean();
	} else if(typeof obj == 'object') {
		cleaned = {};
		for(var p in obj) {
			if(object.hasOwnProperty(obj, p)) {
				cleaned[p] = obj[p];
			}
		}
	} else {
		cleaned = obj;
	}
	return cleaned;
};

function $extend(origin, extend, check) {
	var object = require('yom/object');
	return object.extend(origin, extend, check);
};

function $bind(that, fn) {
	var array = require('yom/array');
	if(fn.bind) {
		return fn.bind(that);
	} else {
		return function() {
			return fn.apply(that, array.getArray(arguments));
		};
	}
};

function $now() {
	return +new Date();
};

function $empty() {};

var _yom_unique_id_count = 0;
function $getUniqueId() {
	return 'YOM_UNIQUE_ID_' + _yom_unique_id_count++;	
};
