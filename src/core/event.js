/**
 * @class YOM.Event
 */
define('./event', ['./error', './object', './observer'], function(Err, object, Observer) {
	var YOM = {
		'Error': Err,
		'object': object,
		'Observer': Observer
	};
	
	var _ID = 108;
	
	var _elRefCount = 0;
	_customizedEventHash = {
		
	};
	
	function _getObserver(instance, type) {
		if(!instance instanceof Evt) {
			throw new YOM.Error(YOM.Error.getCode(_ID, 1));
		}
		instance._observers = instance._observers || {};
		instance._observers[type] = instance._observers[type] || new YOM.Observer();
		return instance._observers[type];
	};
	
	function _getObservers(instance) {
		if(!instance instanceof Evt) {
			throw new YOM.Error(YOM.Error.getCode(_ID, 1));
		}
		instance._observers = instance._observers || {};
		return instance._observers;
	};
	
	function Evt(observers) {
		this._observers = YOM.object.getClean(observers) || {};
	};
	
	Evt.prototype = {
		addObservers: function(newObservers) {
			var observers = _getObservers(this);
			newObservers = YOM.object.getClean(newObservers);
			for(var type in newObservers) {
				if(newObservers[type] instanceof YOM.Observer) {
					observers[type] = newObservers[type];
				}
			}
		},
		
		addEventListener: function(type, listener, bind) {
			var observer = _getObserver(this, type);
			if(!observer) {
				throw new YOM.Error(YOM.Error.getCode(_ID, 1));
			}
			return observer.subscribe(listener, bind);
		},
		
		removeEventListener: function(type, listener) {
			var observer = _getObserver(this, type);
			if(!observer) {
				throw new YOM.Error(YOM.Error.getCode(_ID, 2));
			}
			return observer.remove(listener);
		},
		
		dispatchEvent: function(e, asyn) {
			if(typeof e == 'string') {
				e = {type: e};
			}
			var self = this;
			var observer = _getObserver(this, e.type);
			if(!observer) {
				throw new YOM.Error(YOM.Error.getCode(_ID, 3));
			}
			if(asyn) {
				setTimeout(function() {
					observer.dispatch.call(observer, e, self);
				}, 0);
				return undefined;
			} else {
				return observer.dispatch.call(observer, e, self);
			}
		},
		
		createEvent: function(type, opt) {
			var e = YOM.object.clone(opt) || {};
			e.type = type;
			return e;
		},
		
		constructor: Evt
	};
	
	Evt.addListener = function(el, eType, listener, bind) {
		var cEvent, cEventHandler;
		eType = eType.toLowerCase();
		listener = bind ? YOM.object.bind(bind, listener) : listener;
		cEvent = _customizedEventHash[eType];
		if(cEvent) {
			el.elEventRef = el.elEventRef || ++_elRefCount;
			cEventHandler = cEvent.elEventRefHandlerHash[el.elEventRef];
			if(!cEventHandler) {
				cEventHandler = cEvent.elEventRefHandlerHash[el.elEventRef] = new cEvent.Handler(el);
			}
			cEventHandler.addListener(listener);
		} else if(el.addEventListener) {
			el.addEventListener(eType, listener, false);
		} else {
			el.attachEvent('on' + eType, listener);
		}
		return listener;
	};
	
	Evt.removeListener = function(el, eType, listener) {
		var cEvent, cEventHandler;
		eType = eType.toLowerCase();
		cEvent = _customizedEventHash[eType];
		if(cEvent) {
			cEventHandler = cEvent.elEventRefHandlerHash[el.elEventRef];
			if(cEventHandler) {
				cEventHandler.removeListener(listener);
			}
		} else if(el.removeEventListener) {
			el.removeEventListener(eType, listener, false);
		} else {
			el.detachEvent('on' + eType, listener);
		}
	};
	
	Evt.addCustomizedEvent = function(type, Handler) {
		_customizedEventHash[type] = {
			Handler: Handler,
			elEventRefHandlerHash: {}
		};
	};
	
	Evt.removeCustomizedEventHandler = function(type, ref) {
		var cEvent = _customizedEventHash[type];
		if(cEvent) {
			cEvent.elEventRefHandlerHash[ref] = null;
		}
	};
	
	Evt.cancelBubble = function(e) {
		if(e.stopPropagation) {
			e.stopPropagation();
		} else {
			e.cancelBubble = true;
		}
	};
	
	Evt.preventDefault = function(e) {
		if(e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
	};
	
	Evt.getTarget = function(e) {
		return e.target || e.srcElement;
	};
	
	Evt.getPageX = function(e) {
		return e.pageX != undefined ? e.pageX : e.clientX + Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
	};
	
	Evt.getPageY = function(e) {
		return e.pageY != undefined ? e.pageY : e.clientY + Math.max(document.documentElement.scrollTop, document.body.scrollTop);
	};
	
	return Evt;
});