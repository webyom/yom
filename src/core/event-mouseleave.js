/**
 * @class YOM.Event.MouseleaveEventHandler
 */
define('yom/event-mouseleave', ['require'], function(require) {
	var YOM = {
		'browser': require('yom/browser'),
		'Class': require('yom/class'),
		'array': require('yom/array'),
		'Event': require('yom/event'),
		'Element': require('yom/element')
	};
	YOM.Event.VirtualEventHandler = require('yom/event-virtual-handler');
	
	var MouseleaveEventHandler = function(el) {
		this.name = 'mouseleave';
		MouseleaveEventHandler.superClass.constructor.apply(this, YOM.array.getArray(arguments));
		this._bound = {
			mouseout: $bind(this, this._mouseout)
		};
		YOM.Event.addListener(this._delegateEl, 'mouseout', this._bound.mouseout);
	};
	
	YOM.Class.extend(MouseleaveEventHandler, YOM.Event.VirtualEventHandler);
	
	MouseleaveEventHandler.prototype._destroy = function() {
		YOM.Event.removeListener(this._delegateEl, 'mouseout', this._bound.mouseout);
		MouseleaveEventHandler.superClass._destroy.apply(this, YOM.array.getArray(arguments));
	};
		
	MouseleaveEventHandler.prototype._mouseout = function(e) {
		if(!YOM.Element.contains(this._delegateEl, e.relatedTarget)) {
			e.cType = this.name;
			this._dispatch(e);
		}
	};
	
	YOM.browser.ie || YOM.Event.addCustomizedEvent('mouseleave', MouseleaveEventHandler);
	
	return MouseleaveEventHandler;
});
