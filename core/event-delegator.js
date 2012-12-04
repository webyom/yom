/**
 * @class YOM.Event.Delegator
 */
define(['./object', './instance-manager', './event', './element'], function(object, InstanceManager, Evt, Elem) {
	var YOM = {
		'object': object,
		'InstanceManager': InstanceManager,
		'Event': Evt,
		'Element': Elem
	}
	
	var _im = new YOM.InstanceManager()
	
	/**
	 * @class
	 */
	function Delegator(ele, opt) {
		opt = opt || {}
		this._ele = YOM.Element.query(ele)
		this._delegatedTypes = {}
		this._handlers = {}
		this._eventHook = opt.eventHook
		this._id = _im.add(this)
		this._ele.setDatasetVal('yom-delegator-id', this._id)
	}
	
	Delegator._im = _im
	
	Delegator.getDelegator = function(ele) {
		ele = YOM.Element.query(ele)
		var delegator = _im.get(ele.getDatasetVal('yom-delegator-id'))
		if(!delegator) {
			delegator = new Delegator(ele)
		}
		return delegator
	}
	
	Delegator.getPageDelegator = function() {
		return Delegator.getDelegator(document.body)
	}
	
	Delegator.prototype = {
		_delegateEvent: function(type, maxBubble) {
			var flag = this._delegatedTypes[type]
			if(flag) {
				flag.maxBubble = Math.max(flag.maxBubble, maxBubble)
				return
			} else {
				var listener = YOM.object.bind(this, this._eventListener)
				this._ele.addEventListener(type, listener)
				this._handlers[type] = {}
				this._delegatedTypes[type] = {maxBubble: maxBubble, listener: listener}
			}
		},
		
		_eventListener: function(evt) {
			var target, $target, type, flag, handler, maxBubble, bubbleTimes
			target = YOM.Event.getTarget(evt)
			type = evt.type.toLowerCase()
			if(this._eventHook && this._eventHook(target, evt, type) === false) {
				return
			}
			maxBubble = this._delegatedTypes[type].maxBubble
			bubbleTimes = 0
			while(target && target != this._ele) {
				$target = new YOM.Element(target)
				if(target.disabled || $target.getAttr('disabled')) {
					return
				}
				flag = $target.getDatasetVal('yom-' + type)
				if(flag) {
					flag = flag.split(' ')
					handler = this._handlers[type][flag.shift()]
					flag.unshift(evt)
					if(handler && handler.apply(target, flag) === false) {
						break
					}
				}
				if(bubbleTimes >= maxBubble) {
					break
				}
				target = target.parentNode
				bubbleTimes++
			}
		},
		
		getId: function() {
			return this._id
		},
		
		delegate: function(type, handlerName, handler, opt) {
			type = type.toLowerCase()
			opt = opt || {}
			this._delegateEvent(type, opt.maxBubble >= 0 ? opt.maxBubble : 1983)
			this._handlers[type][handlerName] = handler
			return this
		},
		
		remove: function(type, handlerName) {
			if(!this._delegatedTypes[type]) {
				return
			}
			if(handlerName) {
				delete this._handlers[type][handlerName]
			} else {
				this._ele.removeEventListener(type, this._delegatedTypes[type].listener)
				delete this._handlers[type]
				delete this._delegatedTypes[type]
			}
		},
		
		destroy: function() {
			for(var type in this._delegatedTypes) {
				this.remove(type)
			}
			_im.remove(this.getId())
		},
		
		constructor: Delegator
	}
	
	return Delegator
})
