/**
 * @class YOM.Event.MouseleaveEventHandler
 */
define(['./browser', './object', './array', './class', './event', './element', './event-virtual-handler'], function(browser, object, array, Class, Evt, Elem, VirtualEventHandler) {
	var YOM = {
		'browser': browser,
		'object': object,
		'array': array,
		'Class': Class,
		'Event': Evt,
		'Element': Elem
	}
	YOM.Event.VirtualEventHandler = VirtualEventHandler
	
	var MouseleaveEventHandler = function(el) {
		this.name = 'mouseleave'
		MouseleaveEventHandler.superClass.constructor.apply(this, YOM.array.getArray(arguments))
		this._bound = {
			mouseout: YOM.object.bind(this, this._mouseout)
		}
		YOM.Event.addListener(this._delegateEl, 'mouseout', this._bound.mouseout)
	}
	
	YOM.Class.extend(MouseleaveEventHandler, YOM.Event.VirtualEventHandler)
	
	MouseleaveEventHandler.prototype._destroy = function() {
		YOM.Event.removeListener(this._delegateEl, 'mouseout', this._bound.mouseout)
		MouseleaveEventHandler.superClass._destroy.apply(this, YOM.array.getArray(arguments))
	}
		
	MouseleaveEventHandler.prototype._mouseout = function(e) {
		if(!YOM.Element.contains(this._delegateEl, e.relatedTarget)) {
			e.cType = this.name
			this._dispatch(e)
		}
	}
	
	YOM.browser.ie || YOM.Event.addCustomizedEvent('mouseleave', MouseleaveEventHandler)
	
	return MouseleaveEventHandler
})

