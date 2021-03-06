/**
 * @namespace
 */
define(function(require) {
	var YOM = function(sel, context) {
		return Elem.query(sel, context)
	}
	
	var object = require('./object')
	var Elem = require('./element')
	
	YOM._ID = 100
	YOM.debugMode = 0
	
	YOM = object.extend(YOM, {
		'config': require('./config'),
		'Error': require('./error'),
		'browser': require('./browser'),
		'string': require('./string'),
		'object': object,
		'array': require('./array'),
		'Class': require('./class'),
		'HashArray': require('./hash-array'),
		'InstanceManager': require('./instance-manager'),
		'jsonSansEval': require('./json-sans-eval'),
		'json': require('./json'),
		'Observer': require('./observer'),
		'Event': require('./event'),
		'Sizzle': require('./sizzle'),
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
		'flash': require('./flash'),
		'widget': require('./widget')
	})
	
	YOM.Event = object.extend(YOM.Event, {
		'Delegator': require('./event-delegator'),
		'VirtualEventHandler': require('./event-virtual-handler'),
		'MouseenterEventHandler': require('./event-mouseenter'),
		'MouseleaveEventHandler': require('./event-mouseleave')
	})
	
	require('./element-fx')
	
	return YOM
})

function $id(id) {
	return document.getElementById(id)
}

function $now() {
	return +new Date()
}

function $empty() {}

var _yom_unique_id_count = 0
function $getUniqueId() {
	return 'YOM_UNIQUE_ID_' + _yom_unique_id_count++	
}
