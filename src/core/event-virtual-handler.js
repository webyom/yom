/**
 * @class YOM.Event.VirtualEventHandler
 */
define('yom/event-virtual-handler', ['require'], function(require) {
	var YOM = {
		'object': require('yom/object'),
		'Event': require('yom/event')
	};
	
	var VirtualEventHandler = function(el) {
		this._delegateEl = el;
		this._targetEl = null;
		this._listenerPool = [];
		this._listenerCount = 0;
	};
	
	VirtualEventHandler.prototype = {
		_destroy: function() {
			YOM.Event.removeCustomizedEventHandler(this.name, this._delegateEl.elEventRef);
		},
		
		_dispatch: function(e) {
			YOM.object.each(this._listenerPool, function(listener) {
				listener(e);
			});
		},
		
		addListener: function(listener) {
			var found;
			if(!listener) {
				return null;
			}
			YOM.object.each(this._listenerPool, function(item) {
				if(listener == item) {
					found = 1;
					return false;
				}
				return true;
			});
			if(found) {
				return null;
			}
			this._listenerCount++;
			return this._listenerPool.push(listener);
		},
		
		removeListener: function(listener) {
			var found = null;
			var self = this;
			YOM.object.each(this._listenerPool, function(item, i) {
				if(listener == item) {
					found = item;
					self._listenerPool.splice(i, 1);
					this._listenerCount--;
					return false;
				}
				return true;
			});
			if(!this._listenerCount) {
				this._destroy();
			}
			return found;
		},
		
		constructor: VirtualEventHandler
	};
	
	return VirtualEventHandler;
});
