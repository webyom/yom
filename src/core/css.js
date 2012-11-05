/**
 * @namespace YOM.css
 */
define('yom/css', ['yom/object', 'yom/array', 'yom/class', 'yom/event', 'yom/element'], function(object, array, Class, Evt, Elem) {
	var YOM = {
		'object': object,
		'array': array,
		'Class': Class,
		'Event': Evt,
		'Element': Elem
	};
	
	var _linkCount = 0;
	var _href_id_hash = {};
	
	function load(href, force) {
		var id, el;
		if(YOM.array.isArray(href)) {
			id = [];
			YOM.object.each(href, function(item) {
				id.push(load(item, force));
			});
			return id;
		}
		id = _href_id_hash[href];
		el = $id(id);
		if(id && el) {
			if(force) {
				unload(href);
			} else {
				return id;
			}
		}
		id = $getUniqueId();
		el = YOM.Element.create('link', {
			id: id,
			rel: 'stylesheet',
			type: 'text/css',
			media: 'screen',
			href: href
		});
		YOM.Element.head.insertBefore(el, YOM.Element.head.firstChild);
		return _href_id_hash[href] = id;
	};
	
	function unload(href) {
		var el;
		if(YOM.array.isArray(href)) {
			el = [];
			YOM.object.each(href, function(item) {
				el.push(unload(item));
			});
			return el;
		}
		el = $id(_href_id_hash[href]);
		if(el) {
			delete _href_id_hash[href];
			return el.parentNode.removeChild(el);
		}
		return null;
	};
	
	var Css = function() {
		Css.superClass.constructor.apply(this, YOM.array.getArray(arguments));
	};
	YOM.Class.extend(Css, YOM.Event);
	
	return $extend(new Css({
	}), {
		_ID: 106,
		load: load,
		unload: unload
	});
});