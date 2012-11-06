/**
 * @namespace
 */
define(['require', document.querySelectorAll ? '' : './inc/sizzle'], function(require, Sizzle) {
	var YOM = function(sel, context) {
		return Elem.query(sel, context);
	};
	
	var object = require('./object');
	var Elem = require('./element');
	
	YOM._ID = 100;
	YOM.debugMode = 0;
	
	YOM = object.extend(YOM, {
		'config': require('./config'),
		'Error': require('./error'),
		'browser': require('./browser'),
		'string': require('./string'),
		'object': object,
		'array': require('./array'),
		'Chunker': require('./chunker'),
		'Class': require('./class'),
		'HashArray': require('./hash-array'),
		'InstanceManager': require('./instance-manager'),
		'json': require('./json'),
		'Observer': require('./observer'),
		'Event': require('./event'),
		'Element': Elem,
		'transition': require('./transition'),
		'Tween': require('./tween'),
		'cookie': require('./cookie'),
		'Xhr': require('./xhr'),
		'CrossDomainPoster': require('./cross-domain-poster'),
		'pos': require('./pos'),
		'util': require('./util'),
		'JsLoader': require('./js-loader'),
		'css': require('./css'),
		'tmpl': require('./tmpl'),
		'console': require('./console'),
		'flash': require('./flash'),
		'widget': require('./widget')
	});
	
	YOM.Event = object.extend(YOM.Event, {
		'Delegator': require('./event-delegator'),
		'VirtualEventHandler': require('./event-virtual-handler'),
		'MouseenterEventHandler': require('./event-mouseenter'),
		'MouseleaveEventHandler': require('./event-mouseleave')
	});
	
	require('./element-fx');
	
	return YOM;
});

function $id(id) {
	return document.getElementById(id);
};

function $query(sel, context) {
	var Element = require('yom/element');
	return Element.query(sel, context);
};

function $getClean(obj) {
	var object = require('yom/object');
	return object.getClean(obj);
};

function $extend(origin, extend, check) {
	var object = require('yom/object');
	return object.extend(origin, extend, check);
};

function $bind(that, fn) {
	var object = require('yom/object');
	return object.bind(that, fn);
};

function $now() {
	return +new Date();
};

function $empty() {};

var _yom_unique_id_count = 0;
function $getUniqueId() {
	return 'YOM_UNIQUE_ID_' + _yom_unique_id_count++;	
};
