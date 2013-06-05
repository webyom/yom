/**
 * @class YOM.Element
 */
define(['./browser', './string', './object', './array', './event'], function(browser, string, object, array, Evt) {
	var YOM = {
		'browser': browser,
		'string': string,
		'object': object,
		'array': array,
		'Event': Evt
	}
	
	var _ID = 107
	
	function _isElementNode(el) {
		return el && (el.nodeType === 1 || el.nodeType === 9)
	}
	
	function _hasClass(el, className) {
		return new RegExp('(?:^|\\s+)' + className + '(?:$|\\s+)').test(el.className)
	}
	
	function Item(el) {
		this._el = el
		this._styleStorage = {}
	}
	
	YOM.object.extend(Item.prototype, {
		get: function() {
			return this._el
		},
		
		setStyle: function(name, value) {
			var el = this.get()
			var computer = el.ownerDocument.defaultView
			computer = computer && computer.getComputedStyle
			if(typeof name == 'object') {
				YOM.object.each(name, function(val, key) {
					new Item(el).setStyle(key, val)
				})
			} else {
				if(!name) {
					return this
				}
				name = YOM.string.toCamelCase(name)
				switch(name) {
				case 'opacity':
					if(computer) {
						el.style[name] = value
					} else {
						if(value == 1) {
							el.style.filter = ''
						} else {
							el.style.filter = 'alpha(opacity=' + parseInt(value * 100) + ')'
						}
					}
					break
				default:
					el.style[name] = value
				}
			}
			return this
		},
		
		getStyle: function(name) {
			name = YOM.string.toCamelCase(name)
			var el = this.get()
			var style = el.style[name]
			var computer = el.ownerDocument.defaultView
			computer = computer && computer.getComputedStyle
			if(style) {
				return style
			}
			switch(name) {
			case 'opacity':
				if(computer) {
					style = computer(el, null)[name]
				} else {
					style = 100
					try {
						style = el.filters['DXImageTransform.Microsoft.Alpha'].opacity
					} catch (e) {
						try {
							style = el.filters('alpha').opacity
						} catch(e) {}
					}
					style = style / 100
				}
				break
			default:
				if(computer) {
					style = computer(el, null)[name]
				} else if(el.currentStyle) {
					style = el.currentStyle[name]
				} else {
					style = el.style[name]
				}
			}
			return style
		},
		
		storeStyle: function(name) {
			if(YOM.array.isArray(name)) {
				YOM.object.each(name, function(nm) {
					this.storeStyle(nm)
				}, this)
			} else {
				this._styleStorage[name] = this.getStyle(name)
			}
			return this
		},
		
		restoreStyle: function(name) {
			if(YOM.array.isArray(name)) {
				YOM.object.each(name, function(nm) {
					this.restoreStyle(nm)
				}, this)
			} else {
				if(typeof this._styleStorage[name] == 'undefined') {
					return this
				}
				this.setStyle(name, this._styleStorage[name])
			}
			return this
		}
	})
	
	function Elem(el) {
		this._items = []
		if(el instanceof Elem) {
			return el
		} else if(YOM.array.isArray(el)) {
			YOM.object.each(el, function(item) {
				if(_isElementNode(item)) {
					this._items.push(new Item(item))
				}
			}, this)
		} else if(YOM.object.toString(el) == '[object NodeList]') {
			YOM.object.each(YOM.array.getArray(el), function(item) {
				this._items.push(new Item(item))
			}, this)
		} else if(_isElementNode(el)) {
			this._items.push(new Item(el))
		} else if(el && el.length && el.item) {//StaticNodeList, IE8/Opera
			for(var i = 0, l = el.length; i < l; i++) {
				this._items.push(new Item(el.item(i)))
			}
		}
		this._styleStorage = {}
		return this
	}

	YOM.object.extend(Elem.prototype, {
		_getItem: function(i) {
			if(typeof i == 'undefined') {
				return this._items[0]
			} else {
				return this._items[i]
			}
		},
		
		get: function(i) {
			var item = this._getItem(i)
			return item && item.get()
		},
		
		getAll: function() {
			var res = []
			this.each(function(el) {
				res.push(el)
			})
			return res
		},
		
		find: function(sel) {
			var res = []
			this.each(function(el) {
				var tmp
				if(!_isElementNode(el)) {
					return
				}
				tmp = document.querySelectorAll ? el.querySelectorAll(sel) : Sizzle(sel, el)
				if(YOM.array.isArray(tmp)) {
					res = res.concat(tmp)
				} else if(YOM.object.toString(tmp) == '[object NodeList]') {
					res = res.concat(YOM.array.getArray(tmp))
				} else if(tmp.length && tmp.item) {//StaticNodeList, IE8/Opera
					for(var i = 0, l = tmp.length; i < l; i++) {
						res.push(tmp.item(i))
					}
				}
			})
			return new Elem(res)
		},
		
		toQueryString: function() {
			var res = []
			this.find('input, select, textarea').each(function(el) {
				if(!el.name || el.disabled || el.type == 'button' || el.type == 'submit' || el.type == 'reset' || el.type == 'file') {
					return
				}
				if(el.tagName.toLowerCase() == 'select') {
					for(var i = 0, l = el.options.length; i < l; i++) {
						if(el.options[i].selected) {
							res.push(el.name + '=' + encodeURIComponent(el.options[i].value))
						}
					}
				} else if(el.type != 'radio' && el.type != 'checkbox' || el.checked) {
					res.push(el.name + '=' + encodeURIComponent(el.value))
				}
			})
			return res.join('&')
		},
		
		size: function() {
			return this._items.length
		},
		
		each: function(fn, bind, reverse) {
			var item, i, l
			if(reverse) {
				for(i = this._items.length - 1; i >= 0; i--) {
					item = this._getItem(i)
					if(fn.call(bind || this, item.get(), i, item) === false) {
						return this
					}
				}
			} else {
				for(i = 0, l = this._items.length; i < l; i++) {
					item = this._getItem(i)
					if(fn.call(bind || this, item.get(), i, item) === false) {
						return this
					}
				}
			}
			return this
		},
		
		hasClass: function(className) {
			if(!this.size()) {
				return false
			}
			var res = true
			this.each(function(el) {
				if(!_hasClass(el, className)) {
					res = false
					return false
				}
				return true
			})
			return res
		},
		
		addClass: function(className) {
			this.each(function(el) {
				if(!_hasClass(el, className)) {
					el.className = el.className ? el.className + ' ' + className : className
				}
			})
			return this
		},
			
		removeClass: function(className) {
			this.each(function(el) {
				el.className = el.className.replace(new RegExp('(?:^|\\s+)' + className, 'g'), '')
			})
			return this
		},
		
		toggleClass: function(className) {
			this.each(function(el) {
				if(_hasClass(el, className)) {
					el.className = el.className.replace(new RegExp('(?:^|\\s+)' + className, 'g'), '')
				} else {
					el.className = el.className ? el.className + ' ' + className : className
				}
			})
			return this
		},
		
		setAttr: function(name, value) {
			this.each(function(el) {
				if(typeof name == 'object') {
					YOM.object.each(name, function(val, key) {
						new Elem(el).setAttr(key, val)
					})
				} else {
					if(!name) {
						return
					}
					if(name.indexOf('data-') === 0 && el.dataset) {
						name = name.split('-')
						name.shift()
						new Elem(el).setDatasetVal(name.join('-'), value)
					} else if(name == 'class' || name == 'className') {
						el.className = value
					} else {
						el.setAttribute(name, value)
					}
				}
			})
			return this
		},
		
		removeAttr: function(name) {
			this.each(function(el) {
				el.removeAttribute(name)
			})
			return this
		},
		
		getAttr: function(name) {
			var el = this.get()
			if(name == 'class' || name == 'className') {
				return el.className
			} else if(el.nodeType !== 1 || el.tagName == 'HTML') {
				return ''
			} else {
				return el.getAttribute(name)
			}
		},
		
		setProp: function(name, val) {
			this.each(function(el) {
				if(typeof name == 'object') {
					YOM.object.each(name, function(val, key) {
						new Elem(el).setProp(key, val)
					})
				} else {
					if(!name) {
						return
					}
					el[name] = val
				}
			})
			return this
		},
		
		getProp: function(name) {
			var el = this.get()
			return el[name]
		},
		
		getDatasetVal: function(name) {
			var el = this.get()
			if(el.dataset) {
				return el.dataset[YOM.string.toCamelCase(name)]
			} else {
				return this.getAttr('data-' + YOM.string.toJoinCase(name, '-'))
			}
		},
		
		setDatasetVal: function(name, value) {
			this.each(function(el) {
				if(typeof name == 'object') {
					YOM.object.each(name, function(val, key) {
						new Elem(el).setDatasetVal(key, val)
					})
				} else {
					if(el.dataset) {
						el.dataset[YOM.string.toCamelCase(name)] = value
					} else {
						this.setAttr('data-' + YOM.string.toJoinCase(name, '-'), value)
					}
				}
			})
			return this
		},
		
		setVal: function(value) {
			this.each(function(el) {
				el.value = value
			})
			return this
		},
		
		getVal: function() {
			return this.get().value
		},
		
		setStyle: function(name, value) {
			this.each(function(el, i, _item) {
				_item.setStyle(name, value)
			})
			return this
		},
		
		getStyle: function(name) {
			return this._getItem(0).getStyle(name)
		},
		
		storeStyle: function(name) {
			this.each(function(el, i, _item) {
				_item.storeStyle(name)
			})
			return this
		},
		
		restoreStyle: function(name) {
			this.each(function(el, i, _item) {
				_item.restoreStyle(name)
			})
			return this
		},
		
		getScrolls: function() {
			var el = this.get()
			var parent = el.parentNode
			var res = {left: 0, top: 0}
			while(parent && !Elem.isBody(parent)) {
				res.left = parent.scrollLeft
				res.top = parent.scrollTop
				parent = parent.parentNode
			}
			return res
		},
		
		getScrollLeft: function() {
			var el = this.get()
			if(!el) {
				return 0
			}
			if(Elem.isBody(el)) {
				return Math.max(document.documentElement.scrollLeft, document.body.scrollLeft)
			} else {
				return el.scrollLeft
			}
		},
		
		getScrollTop: function() {
			var el = this.get()
			if(!el) {
				return 0
			}
			if(Elem.isBody(el)) {
				return Math.max(document.documentElement.scrollTop, document.body.scrollTop)
			} else {
				return el.scrollTop
			}
		},
		
		scrollLeftBy: function(x, interval) {
			var el = this.get()
			if(!x || !el) {
				return this
			}
			this.scrollLeftTo(this.getScrollLeft() + x, interval)
			return this
		},
		
		scrollTopBy: function(y, interval) {
			var el = this.get()
			if(!y || !el) {
				return this
			}
			this.scrollTopTo(this.getScrollTop() + y, interval)
			return this
		},
		
		scrollLeftTo: function(x, interval, transition) {
			var el = this.get()
			if(!el || el.scrollLeft == x) {
				return this
			}
			if(x instanceof Elem) {
				this.scrollLeftTo(x.getRect(this).left, interval, transition)
				return this
			}
			var rect = this.getRect()
			var viewRect = Elem.getViewRect()
			var scrollWidth, clientWidth
			var isBody = Elem.isBody(el)
			if(isBody) {
				scrollWidth = rect.width
				clientWidth = viewRect.width
			} else {
				scrollWidth = el.scrollWidth
				clientWidth = el.clientWidth
			}
			if(scrollWidth <= clientWidth) {
				return this
			}
			x = x < 0 ? 0 : (x > scrollWidth - clientWidth ? scrollWidth - clientWidth : x)
			var tweenObj = isBody ? new Elem(YOM.browser.chrome ? document.body : document.documentElement) : new Elem(el)
			if(interval === 0) {
				tweenObj.setProp('scrollLeft', x)
				return this
			}
			tweenObj.tween(interval || 1000, {
				transition: transition || 'easeOut',
				origin: {
					prop: {
						scrollLeft: el.scrollLeft
					}
				},
				target: {
					prop: {
						scrollLeft: x
					}
				}
			})
			return this
		},
		
		scrollTopTo: function(y, interval, transition) {
			var el = this.get()
			if(!el || el.scrollTop == y) {
				return this
			}
			if(y instanceof Elem) {
				this.scrollTopTo(y.getRect(this).top, interval, transition)
				return this
			}
			var rect = this.getRect()
			var viewRect = Elem.getViewRect()
			var scrollHeight, clientHeight
			var isBody = Elem.isBody(el)
			if(isBody) {
				scrollHeight = rect.height
				clientHeight = viewRect.height
			} else {
				scrollHeight = el.scrollHeight
				clientHeight = el.clientHeight
			}
			if(scrollHeight <= clientHeight) {
				return this
			}
			y = y < 0 ? 0 : (y > scrollHeight - clientHeight ? scrollHeight - clientHeight : y)
			var tweenObj = isBody ? new Elem(YOM.browser.chrome ? document.body : document.documentElement) : new Elem(el)
			if(interval === 0) {
				tweenObj.setProp('scrollTop', y)
				return this
			}
			tweenObj.tween(interval || 1000, {
				transition: transition || 'easeOut',
				origin: {
					prop: {
						scrollTop: el.scrollTop
					}
				},
				target: {
					prop: {
						scrollTop: y
					}
				}
			})
			return this
		},
		
		getOffsetParent: function() {
			var el = this.get()
			if(!el || Elem.isBody(el)) {
				return null
			}
			return el.offsetParent && new Elem(el.offsetParent)
		},
		
		getRect: function(relative) {
			var el, rect, docScrolls, elScrolls, res
			el = this.get()
			if(Elem.isBody(el)) {
				var bodySize = Elem.getDocSize(el.ownerDocument)
				res = {
					top: 0, left: 0,
					width: bodySize.width,
					height: bodySize.height
				}
				res.right = res.width
				res.bottom = res.height
				return res
			}
			rect = el.getBoundingClientRect && el.getBoundingClientRect()
			relative = relative ? Elem.query(relative).getRect() : {top: 0, left: 0}
			docScrolls = Elem.getViewRect(el.ownerDocument)
			elScrolls = this.getScrolls()
			if(rect) {
				if(YOM.browser.ie && !YOM.browser.isQuirksMode() && (YOM.browser.v <= 7 || document.documentMode <= 7)) {
					rect.left -= 2
					rect.top -= 2
					rect.right -= 2
					rect.bottom -= 2
				}
				res = {
					top: rect.top + docScrolls.top - relative.top,
					left: rect.left + docScrolls.left - relative.left,
					bottom: rect.bottom + docScrolls.top - relative.top,
					right: rect.right + docScrolls.left - relative.left,
					width: rect.width || Math.max(el.clientWidth, el.offsetWidth),
					height: rect.height || Math.max(el.clientHeight, el.offsetHeight)
				}
			} else {
				res = {
					top: el.offsetTop - elScrolls.top - relative.top,
					left: el.offsetLeft - elScrolls.left - relative.left,
					bottom: 0,
					right: 0,
					width: Math.max(el.clientWidth, el.offsetWidth),
					height: Math.max(el.clientHeight, el.offsetHeight)
				}
				while(el.offsetParent) {
					el = el.offsetParent
					res.top += el.offsetTop + (parseInt(new Elem(el).getStyle('borderTopWidth')) || 0)
					res.left += el.offsetLeft + (parseInt(new Elem(el).getStyle('borderLeftWidth')) || 0)
				}
				res.bottom = res.top + res.height - relative.top
				res.right = res.left + res.width - relative.left
			}
			return res
		},
		
		setHtml: function(html) {
			this.each(function(el) {
				el.innerHTML = html
			})
			return this
		},
		
		empty: function() {
			this.setHtml('')
			return this
		},
		
		remove: function(query) {
			var res = []
			if(query) {
				this.find(query).each(function(el) {
					res.push(el.parentNode.removeChild(el))
				})
			} else {
				this.each(function(el) {
					res.push(el.parentNode.removeChild(el))
				})
			}
			return new Elem(res)
		},
		
		first: function() {
			var res = []
			this.each(function(el) {
				new Elem(el.childNodes || el.children).each(function(el) {
					if(_isElementNode(el)) {
						res.push(el)
						return false
					}
					return true
				})
			})
			return new Elem(res)
		},
		
		next: function() {
			var res = []
			this.each(function(el) {
				el = el.nextElementSibling || Elem.searchChain(el, 'nextSibling', function(el) {
					return _isElementNode(el)
				})
				el && res.push(el)
			})
			return new Elem(res)
		},
		
		previous: function() {
			var res = []
			this.each(function(el) {
				el = el.previousElementSibling || Elem.searchChain(el, 'previousSibling', function(el) {
					return _isElementNode(el)
				})
				el && res.push(el)
			})
			return new Elem(res)
		},
		
		head: function(target) {
			var res = []
			target = Elem.query(target)
			this.each(function(el) {
				target.each(function(tar) {
					var firstChild = new Elem(el).first().get()
					if(firstChild) {
						res.push(el.insertBefore(tar, firstChild))
					} else {
						res.push(el.appendChild(tar))
					}
				}, target, true)
			})
			return new Elem(res)
		},
		
		headTo: function(target) {
			var res = []
			target = Elem.query(target)
			target.each(function(tar) {
				this.each(function(el) {
					var firstChild = new Elem(tar).first().get()
					if(firstChild) {
						res.push(tar.insertBefore(el, firstChild))
					} else {
						res.push(tar.appendChild(el))
					}
				}, this, true)
			}, this)
			return new Elem(res)
		},
		
		append: function(target) {
			var res = []
			target = Elem.query(target)
			this.each(function(el) {
				target.each(function(tar) {
					res.push(el.appendChild(tar))
				}, this)
			})
			return new Elem(res)
		},
		
		appendTo: function(target) {
			var res = []
			target = Elem.query(target)
			target.each(function(tar) {
				this.each(function(el) {
					res.push(tar.appendChild(el))
				})
			}, this)
			return new Elem(res)
		},
		
		before: function(target) {
			var res = []
			target = Elem.query(target)
			if(Elem.isBody(target)) {
				return this
			}
			target.each(function(tar) {
				this.each(function(el) {
					res.push(tar.parentNode.insertBefore(el, tar))
				})
			}, this)
			return new Elem(res)
		},
		
		after: function(target) {
			var res = []
			target = Elem.query(target)
			if(Elem.isBody(target)) {
				return this
			}
			target.each(function(tar) {
				this.each(function(el) {
					if(tar.nextSibling) {
						res.push(tar.parentNode.insertBefore(el, tar.nextSibling))
					} else {
						res.push(tar.parentNode.appendChild(el))
					}
				}, this, true)
			}, this)
			return new Elem(res)
		},
		
		clone: function(bool) {
			var el = this.get()
			if(el) {
				return new Elem(el.cloneNode(bool))
			}
			return null
		},
		
		show: function() {
			if(!this.size()) {
				return this
			}
			var _display = this.getDatasetVal('yom-display')
			this.setStyle('display', _display == undefined ? 'block' : _display)
			return this
		},
		
		hide: function() {
			if(!this.size()) {
				return this
			}
			var _display = this.getStyle('display')
			if(_display != 'none' && this.getDatasetVal('yom-display') == undefined) {
				this.setDatasetVal('yom-display', _display)
			}
			this.setStyle('display', 'none')
			return this
		},
		
		toggle: function(callback) {
			this.each(function(el) {
				el = new Elem(el)
				if(el.getStyle('display') == 'none') {
					el.show()
					callback && callback.call(el, 'SHOW')
				} else {
					el.hide()
					callback && callback.call(el, 'HIDE')
				}
			})
			return this
		},
		
		addEventListener: function(eType, listener, bind) {
			this.each(function(el) {
				YOM.Event.addListener(el, eType, listener, bind || el)
			})
			return this
		},
		
		removeEventListener: function(eType, listener) {
			this.each(function(el) {
				YOM.Event.removeListener(el, eType, listener)
			})
			return this
		},
		
		concat: function(els) {
			return new Elem(this.getAll().concat(new Elem(els).getAll()))
		},
		
		removeItem: function(el) {
			YOM.array.remove(this._items, function(item, i) {
				if(typeof el == 'function') {
					return el(item.get(), i)
				} else if(typeof el == 'number') {
					if(el == i) {
						return -1
					} else {
						return 0
					}
				} else {
					return el == item.el
				}
			})
			return this
		}
	})
	
	Elem.head = document.head || document.getElementsByTagName('head')[0] || document.documentElement
	
	Elem.query = function(sel, context) {
		var res
		if(sel instanceof Elem) {
			return sel
		} else if(typeof sel == 'string') {
			if(context) {
				context = new Elem(typeof context == 'string' ? (document.querySelectorAll ? document.querySelectorAll(context) : Sizzle(context)) : context)
				res = context.find(sel)
			} else {
				res = new Elem(document.querySelectorAll ? document.querySelectorAll(sel) : Sizzle(sel))
			}
		} else {
			res = new Elem(sel)
		}
		return res
	}
	
	Elem.isBody = function(el) {
		el = Elem.query(el).get()
		if(!el) {
			return false
		}
		return el.tagName == 'BODY' || el.tagName == 'HTML'
	}

	Elem.create = function(name, attrs, style) {
		var el = new Elem(document.createElement(name))
		attrs && el.setAttr(attrs)
		style && el.setStyle(style)
		return el.get()
	}
	
	Elem.contains = function(a, b) {
		return (a.contains) ? (a != b && a.contains(b)) : !!(a.compareDocumentPosition(b) & 16)
	}
	
	Elem.searchChain = function(el, prop, validator) {
		var res
		while(el && el.nodeType) {
			res = el[prop]
			if(res && (!validator || validator(res))) {
				return res
			}
			el = res
		}
		return null
	}
	
	Elem.getViewRect = function(ownerDoc) {
		var res
		var doc = ownerDoc || document
		res = {
			top: !ownerDoc && window.pageYOffset > 0 ? window.pageYOffset : Math.max(doc.documentElement.scrollTop, doc.body.scrollTop),
			left: !ownerDoc && window.pageXOffset > 0 ? window.pageXOffset : Math.max(doc.documentElement.scrollLeft, doc.body.scrollLeft),
			bottom: 0,
			right: 0,
			width: doc.documentElement.clientWidth || doc.body.clientWidth,
			height: doc.documentElement.clientHeight || doc.body.clientHeight
		}
		res.bottom = res.top + res.height
		res.right = res.left + res.width
		return res
	}

	Elem.getFrameRect = function(maxBubble) {
		var res, rect
		var win = window
		var frame = win.frameElement
		var bubbleLeft = maxBubble
		if(!frame) {
			return new Elem(document.body).getRect()
		}
		res = new Elem(frame).getRect()
		win = win.parent
		frame = win.frameElement
		while(frame && (!maxBubble || --bubbleLeft > 0)) {
			rect = new Elem(frame).getRect()
			res.left += rect.left
			res.right += rect.left
			res.top += rect.top
			res.bottom += rect.top
			win = win.parent
			frame = win.frameElement
		}
		return res
	}
	
	Elem.getDocSize = function(doc) {
		var w, h
		doc = doc || document
		if(YOM.browser.isQuirksMode()) {
			if(YOM.browser.chrome || YOM.browser.safari || YOM.browser.firefox) {
				w = Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth)
				h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight)
			} else {
				w = doc.body.scrollWidth || doc.documentElement.scrollWidth
				h = doc.body.scrollHeight || doc.documentElement.scrollHeight
			}
		} else {
			w = doc.documentElement.scrollWidth || doc.body.scrollWidth
			h = doc.documentElement.scrollHeight || doc.body.scrollHeight
		}
		return {
			width: w,
			height: h
		}
	}
	
	return Elem
})
