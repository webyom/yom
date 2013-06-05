/**
 * @class YOM.Chunker
 */
define(['../core/core-built'], function(YOM) {
	var Chunker = function(processer, opt) {
		opt = opt || {}
		this._bind = opt.bind
		this._duration = opt.duration >= 0 ?  opt.duration : 50
		this._interval = opt.interval || 25
		this._interval2 = opt.interval2
		this._batch = opt.batch
		this._data = []
		this._processer = processer || function() {}
		this._complete = opt.complete
		this._toRef = null
	}
	
	Chunker.prototype = {
		push: function(o, flatten) {
			if(flatten && YOM.array.isArray(o)) {
				this._data = this._data.concat(o)
			} else {
				this._data.push(o)
			}
			return this
		},
		
		process: function() {
			var self = this
			if(self._toRef) {
				return this
			}
			var aStartTime = new Date()
			var total = 0
			self._toRef = setTimeout(function() {
				var item
				var count = 0
				var bStartTime = new Date()
				if(self._data.length && !aStartTime) {
					aStartTime = bStartTime
				}
				while(self._data.length && (new Date() - bStartTime < self._duration || self._duration === 0 && count === 0)) {
					item = self._batch ? self._data.splice(0, self._batch) : self._data.shift()
					if(YOM.array.isArray(item)) {
						self._processer.apply(self._bind, item)
					} else {
						self._processer.call(self._bind, item)
					}
					count++
					total++
				}
				if(self._data.length) {
					self._toRef = setTimeout(arguments.callee, self._interval)
				} else {
					if(self._interval2) {
						self._toRef = setTimeout(arguments.callee, self._interval2)
					} else {
						self._toRef = null
					}
					if(self._complete) {
						self._complete(new Date() - aStartTime, total)
					}
					aStartTime = null
					total = 0
				}
			}, self._interval)
			return this
		},
		
		constructor: Chunker
	}
	
	return Chunker
})

