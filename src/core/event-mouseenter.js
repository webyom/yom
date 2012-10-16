/**
 * @class YOM.Event.MouseenterEventHandler
 */
define('yom/event-mouseenter', ['require'], function(require) {
	var YOM = {
		'browser': require('yom/browser'),
		'Class': require('yom/class'),
		'array': require('yom/array'),
		'Event': require('yom/event'),
		'Element': require('yom/element')
	};
	YOM.Event.VirtualEventHandler = require('yom/event-virtual-handler');
	
	var MouseenterEventHandler = function(el) {
		this.name = 'mouseenter';
		MouseenterEventHandler.superClass.constructor.apply(this, YOM.array.getArray(arguments));
		this._bound = {
			mouseover: $bind(this, this._mouseover)
		};
		YOM.Event.addListener(this._delegateEl, 'mouseover', this._bound.mouseover);
	};
	
	YOM.Class.extend(MouseenterEventHandler, YOM.Event.VirtualEventHandler);
	
	MouseenterEventHandler.prototype._destroy = function() {
		YOM.Event.removeListener(this._delegateEl, 'mouseover', this._bound.mouseover);
		MouseenterEventHandler.superClass._destroy.apply(this, YOM.array.getArray(arguments));
	};
		
	MouseenterEventHandler.prototype._mouseover = function(e) {
		if(!YOM.Element.contains(this._delegateEl, e.relatedTarget)) {
			e.cType = this.name;
			this._dispatch(e);
		}
	};
	
	YOM.browser.ie || YOM.Event.addCustomizedEvent('mouseenter', MouseenterEventHandler);
	
	return MouseenterEventHandler;
});
