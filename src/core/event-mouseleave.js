/**
 * @class YOM.Event.MouseleaveEventHandler
 */
define('yom/event-mouseleave', ['yom/browser', 'yom/class', 'yom/array', 'yom/event', 'yom/element', 'yom/event-virtual-handler'], function(browser, Class, array, Evt, Elem, VirtualEventHandler) {
	var YOM = {
		'browser': browser,
		'Class': Class,
		'array': array,
		'Event': Evt,
		'Element': Elem
	};
	YOM.Event.VirtualEventHandler = VirtualEventHandler;
	
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
