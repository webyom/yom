/**
 * @class YOM.Element
 */
define('yom/element', ['require'], function(require) {
	var YOM = {
		'browser': require('yom/browser'),
		'string': require('yom/string'),
		'object': require('yom/object'),
		'array': require('yom/array')
	};
	
	function _isElementNode(el) {
		return el && (el.nodeType === 1 || el.nodeType === 9);
	};
	
	function _hasClass(el, className) {
		return new RegExp('(?:^|\\s+)' + className + '(?:$|\\s+)').test(el.className);
	};
	
	function Item(el) {
		this._el = el;
		this._styleStorage = {};
	};
	
	$extend(Item.prototype, {
		get: function() {
			return this._el;
		},
		
		setStyle: function(name, value) {
			var el = this.get();
			var computer = el.ownerDocument.defaultView;
			computer = computer && computer.getComputedStyle;
			if(typeof name == 'object') {
				YOM.object.each(name, function(val, key) {
					new Item(el).setStyle(key, val);
				});
			} else {
				if(!name) {
					return this;
				}
				name = YOM.string.toCamelCase(name);
				switch(name) {
				case 'opacity':
					if(computer) {
						el.style[name] = value;
					} else {
						if(value == 1) {
							el.style.filter = '';
						} else {
							el.style.filter = 'alpha(opacity=' + parseInt(value * 100) + ')';
						}
					}
					break;
				default:
					el.style[name] = value;
				}
			}
			return this;
		},
		
		getStyle: function(name) {
			name = YOM.string.toCamelCase(name);
			var el = this.get();
			var style = el.style[name];
			var computer = el.ownerDocument.defaultView;
			computer = computer && computer.getComputedStyle;
			if(style) {
				return style;
			}
			switch(name) {
			case 'opacity':
				if(computer) {
					style = computer(el, null)[name];
				} else {
					style = 100;
					try {
						style = el.filters['DXImageTransform.Microsoft.Alpha'].opacity;
					} catch (e) {
						try {
							style = el.filters('alpha').opacity;
						} catch(e) {}
					}
					style = style / 100;
				}
				break;
			default:
				if(computer) {
					style = computer(el, null)[name];
				} else if(el.currentStyle) {
					style = el.currentStyle[name];
				} else {
					style = el.style[name];
				}
			}
			return style;
		},
		
		storeStyle: function(name) {
			if(YOM.array.isArray(name)) {
				YOM.object.each(name, function(nm) {
					this.storeStyle(nm);
				}, this);
			} else {
				this._styleStorage[name] = this.getStyle(name);
			}
			return this;
		},
		
		restoreStyle: function(name) {
			if(YOM.array.isArray(name)) {
				YOM.object.each(name, function(nm) {
					this.restoreStyle(nm);
				}, this);
			} else {
				if(typeof this._styleStorage[name] == 'undefined') {
					return this;
				}
				this.setStyle(name, this._styleStorage[name]);
			}
			return this;
		}
	});
	
	function Element(el) {
		this._items = [];
		if(el instanceof Element) {
			return el;
		} else if(YOM.array.isArray(el)) {
			YOM.object.each(el, function(item) {
				if(_isElementNode(item)) {
					this._items.push(new Item(item));
				}
			}, this);
		} else if(YOM.object.toString(el) == '[object NodeList]') {
			YOM.object.each(YOM.array.getArray(el), function(item) {
				this._items.push(new Item(item));
			}, this);
		} else if(_isElementNode(el)) {
			this._items.push(new Item(el));
		} else if(el && el.length && el.item) {//StaticNodeList, IE8/Opera
			for(var i = 0, l = el.length; i < l; i++) {
				this._items.push(new Item(el.item(i)));
			}
		}
		this._styleStorage = {};
		return this;
	};

	$extend(Element.prototype, {
		_getItem: function(i) {
			if(typeof i == 'undefined') {
				return this._items[0];
			} else {
				return this._items[i];
			}
		},
		
		get: function(i) {
			var item = this._getItem(i);
			return item && item.get();
		},
		
		getAll: function() {
			var res = [];
			this.each(function(el) {
				res.push(el);
			});
			return res;
		},
		
		find: function(sel) {
			var res = [];
			this.each(function(el) {
				var tmp;
				if(!_isElementNode(el)) {
					return;
				}
				tmp = document.querySelectorAll ? el.querySelectorAll(sel) : Sizzle(sel, el);
				if(YOM.array.isArray(tmp)) {
					res = res.concat(tmp);
				} else if(YOM.object.toString(tmp) == '[object NodeList]') {
					res = res.concat(YOM.array.getArray(tmp));
				} else if(tmp.length && tmp.item) {//StaticNodeList, IE8/Opera
					for(var i = 0, l = tmp.length; i < l; i++) {
						res.push(tmp.item(i));
					}
				}
			});
			return new Element(res);
		},
		
		toQueryString: function() {
			var res = [];
			this.find('input, select, textarea').each(function(el) {
				if(!el.name || el.disabled || el.type == 'button' || el.type == 'submit' || el.type == 'reset' || el.type == 'file') {
					return;
				}
				if(el.tagName.toLowerCase() == 'select') {
					for(var i = 0, l = el.options.length; i < l; i++) {
						if(el.options[i].selected) {
							res.push(el.name + '=' + encodeURIComponent(el.options[i].value));
						}
					}
				} else if(el.type != 'radio' && el.type != 'checkbox' || el.checked) {
					res.push(el.name + '=' + encodeURIComponent(el.value));
				}
			});
			return res.join('&');
		},
		
		size: function() {
			return this._items.length;
		},
		
		each: function(fn, bind) {
			var item;
			for(var i = 0, l = this._items.length; i < l; i++) {
				item = this._getItem(i);
				if(fn.call(bind || this, item.get(), i, item) === false) {
					return this;
				}
			}
			return this;
		},
		
		hasClass: function(className) {
			if(!this.size()) {
				return false;
			}
			var res = true;
			this.each(function(el) {
				if(!_hasClass(el, className)) {
					res = false;
					return false;
				}
				return true;
			});
			return res;
		},
		
		addClass: function(className) {
			this.each(function(el) {
				if(!_hasClass(el, className)) {
					el.className = el.className ? el.className + ' ' + className : className;
				}
			});
			return this;
		},
			
		removeClass: function(className) {
			this.each(function(el) {
				el.className = el.className.replace(new RegExp('(?:^|\\s+)' + className, 'g'), '');
			});
			return this;
		},
		
		toggleClass: function(className) {
			this.each(function(el) {
				if(_hasClass(el, className)) {
					el.className = el.className.replace(new RegExp('(?:^|\\s+)' + className, 'g'), '');
				} else {
					el.className = el.className ? el.className + ' ' + className : className;
				}
			});
			return this;
		},
		
		setAttr: function(name, value) {
			this.each(function(el) {
				if(typeof name == 'object') {
					YOM.object.each(name, function(val, key) {
						new Element(el).setAttr(key, val);
					});
				} else {
					if(!name) {
						return;
					}
					if(name.indexOf('data-') === 0 && el.dataset) {
						name = name.split('-');
						name.shift();
						new Element(el).setDatasetVal(name.join('-'), value);
					} else if(name == 'class' || name == 'className') {
						el.className = value;
					} else {
						el.setAttribute(name, value);
					}
				}
			});
			return this;
		},
		
		removeAttr: function(name) {
			this.each(function(el) {
				el.removeAttribute(name);
			});
			return this;
		},
		
		getAttr: function(name) {
			var el = this.get();
			if(name == 'class' || name == 'className') {
				return el.className;
			} else if(el.nodeType !== 1 || el.tagName == 'HTML') {
				return '';
			} else {
				return el.getAttribute(name);
			}
		},
		
		setProp: function(name, val) {
			this.each(function(el) {
				if(typeof name == 'object') {
					YOM.object.each(name, function(val, key) {
						new Element(el).setProp(key, val);
					});
				} else {
					if(!name) {
						return;
					}
					el[name] = val;
				}
			});
			return this;
		},
		
		getProp: function(name) {
			var el = this.get();
			return el[name];
		},
		
		getDatasetVal: function(name) {
			var el = this.get();
			if(el.dataset) {
				return el.dataset[YOM.string.toCamelCase(name)];
			} else {
				return this.getAttr('data-' + YOM.string.toJoinCase(name, '-'));
			}
		},
		
		setDatasetVal: function(name, value) {
			this.each(function(el) {
				if(typeof name == 'object') {
					YOM.object.each(name, function(val, key) {
						new Element(el).setDatasetVal(key, val);
					});
				} else {
					if(el.dataset) {
						el.dataset[YOM.string.toCamelCase(name)] = value;
					} else {
						this.setAttr('data-' + YOM.string.toJoinCase(name, '-'), value);
					}
				}
			});
			return this;
		},
		
		setVal: function(value) {
			this.each(function(el) {
				el.value = value;
			});
			return this;
		},
		
		getVal: function() {
			return this.get().value;
		},
		
		setStyle: function(name, value) {
			this.each(function(el, i, _item) {
				_item.setStyle(name, value);
			});
			return this;
		},
		
		getStyle: function(name) {
			return this._getItem(0).getStyle(name);
		},
		
		storeStyle: function(name) {
			this.each(function(el, i, _item) {
				_item.storeStyle(name);
			});
			return this;
		},
		
		restoreStyle: function(name) {
			this.each(function(el, i, _item) {
				_item.restoreStyle(name);
			});
			return this;
		},
		
		getScrolls: function() {
			var el = this.get();
			var parent = el.parentNode;
			var res = {left: 0, top: 0};
			while(parent && !Element.isBody(parent)) {
				res.left = parent.scrollLeft;
				res.top = parent.scrollTop;
				parent = parent.parentNode;
			}
			return res;
		},
		
		getScrollLeft: function() {
			var el = this.get();
			if(!el) {
				return 0;
			}
			if(Element.isBody(el)) {
				return Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
			} else {
				return el.scrollLeft;
			}
		},
		
		getScrollTop: function() {
			var el = this.get();
			if(!el) {
				return 0;
			}
			if(Element.isBody(el)) {
				return Math.max(document.documentElement.scrollTop, document.body.scrollTop);
			} else {
				return el.scrollTop;
			}
		},
		
		scrollLeftBy: function(x, interval) {
			var el = this.get();
			if(!x || !el) {
				return this;
			}
			this.scrollLeftTo(this.getScrollLeft() + x, interval);
			return this;
		},
		
		scrollTopBy: function(y, interval) {
			var el = this.get();
			if(!y || !el) {
				return this;
			}
			this.scrollTopTo(this.getScrollTop() + y, interval);
			return this;
		},
		
		scrollLeftTo: function(x, interval, transition) {
			var el = this.get();
			if(!el || el.scrollLeft == x) {
				return this;
			}
			if(x instanceof Element) {
				this.scrollLeftTo(x.getRect(this).left, interval, transition);
				return this;
			}
			var rect = this.getRect();
			var viewRect = Element.getViewRect();
			var scrollWidth, clientWidth;
			var isBody = Element.isBody(el);
			if(isBody) {
				scrollWidth = rect.width;
				clientWidth = viewRect.width;
			} else {
				scrollWidth = el.scrollWidth;
				clientWidth = el.clientWidth;
			}
			if(scrollWidth <= clientWidth) {
				return this;
			}
			x = x < 0 ? 0 : (x > scrollWidth - clientWidth ? scrollWidth - clientWidth : x);
			var tweenObj = isBody ? new Element(YOM.browser.chrome ? document.body : document.documentElement) : new Element(el);
			if(interval === 0) {
				tweenObj.setProp('scrollLeft', x);
				return this;
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
			});
			return this;
		},
		
		scrollTopTo: function(y, interval, transition) {
			var el = this.get();
			if(!el || el.scrollTop == y) {
				return this;
			}
			if(y instanceof Element) {
				this.scrollTopTo(y.getRect(this).top, interval, transition);
				return this;
			}
			var rect = this.getRect();
			var viewRect = Element.getViewRect();
			var scrollHeight, clientHeight;
			var isBody = Element.isBody(el);
			if(isBody) {
				scrollHeight = rect.height;
				clientHeight = viewRect.height;
			} else {
				scrollHeight = el.scrollHeight;
				clientHeight = el.clientHeight;
			}
			if(scrollHeight <= clientHeight) {
				return this;
			}
			y = y < 0 ? 0 : (y > scrollHeight - clientHeight ? scrollHeight - clientHeight : y);
			var tweenObj = isBody ? new Element(YOM.browser.chrome ? document.body : document.documentElement) : new Element(el);
			if(interval === 0) {
				tweenObj.setProp('scrollTop', y);
				return this;
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
			});
			return this;
		},
		
		getOffsetParent: function() {
			var el = this.get();
			if(!el || Element.isBody(el)) {
				return null;
			}
			return el.offsetParent && new Element(el.offsetParent);
		},
		
		getRect: function(relative) {
			var el, rect, docScrolls, elScrolls, res;
			el = this.get();
			if(Element.isBody(el)) {
				var bodySize = Element.getDocSize(el.ownerDocument);
				res = {
					top: 0, left: 0,
					width: bodySize.width,
					height: bodySize.height
				};
				res.right = res.width;
				res.bottom = res.height;
				return res;
			}
			rect = el.getBoundingClientRect && el.getBoundingClientRect();
			relative = relative ? $query(relative).getRect() : {top: 0, left: 0};
			docScrolls = Element.getViewRect(el.ownerDocument);
			elScrolls = this.getScrolls();
			if(rect) {
				if(YOM.browser.ie && !YOM.browser.isQuirksMode() && (YOM.browser.v <= 7 || document.documentMode <= 7)) {
					rect.left -= 2;
					rect.top -= 2;
					rect.right -= 2;
					rect.bottom -= 2;
				}
				res = {
					top: rect.top + docScrolls.top - relative.top,
					left: rect.left + docScrolls.left - relative.left,
					bottom: rect.bottom + docScrolls.top - relative.top,
					right: rect.right + docScrolls.left - relative.left,
					width: rect.width || Math.max(el.clientWidth, el.offsetWidth),
					height: rect.height || Math.max(el.clientHeight, el.offsetHeight)
				};
			} else {
				res = {
					top: el.offsetTop - elScrolls.top - relative.top,
					left: el.offsetLeft - elScrolls.left - relative.left,
					bottom: 0,
					right: 0,
					width: Math.max(el.clientWidth, el.offsetWidth),
					height: Math.max(el.clientHeight, el.offsetHeight)
				};
				while(el.offsetParent) {
					el = el.offsetParent;
					res.top += el.offsetTop + (parseInt(new Element(el).getStyle('borderTopWidth')) || 0);
					res.left += el.offsetLeft + (parseInt(new Element(el).getStyle('borderLeftWidth')) || 0);
				}
				res.bottom = res.top + res.height - relative.top;
				res.right = res.left + res.width - relative.left;
			}
			return res;
		},
		
		setHtml: function(html) {
			this.get().innerHTML = html;
			return this;
		},
		
		removeChild: function(el) {
			if(!(el instanceof Element)) {
				el = this.find(el);
			}
			el.each(function(child) {
				child.parentNode.removeChild(child);
			});
			return this;
		},
		
		empty: function() {
			this.setHtml('');
			return this;
		},
		
		remove: function() {
			var el = this.get();
			if(!el || Element.isBody(el)) {
				return null;
			}
			return new Element(el.parentNode.removeChild(el));
		},
		
		first: function() {
			var res = null;
			var el = this.get();
			if(!el) {
				return res;
			}
			new Element(el.childNode || el.children).each(function(item) {
				if(_isElementNode(item)) {
					res = item;
					return false;
				}
				return true;
			});
			return res;
		},
		
		next: function() {
			var el = this.get();
			if(!el) {
				return null;
			}
			return el.nextElementSibling || Element.searchChain(el, 'nextSibling', function(el) {
				return _isElementNode(el);
			});
		},
		
		previous: function() {
			var el = this.get();
			if(!el) {
				return null;
			}
			return el.previousElementSibling || Element.searchChain(el, 'previousSibling', function(el) {
				return _isElementNode(el);
			});
		},
		
		head: function(tar) {
			var firstChild = this.first();
			if(firstChild) {
				return new Element(this.get().insertBefore(tar, firstChild));
			} else {
				return this.append(tar);
			}
		},
		
		headTo: function(tar) {
			tar = $query(tar);
			var firstChild = tar.first();
			if(firstChild) {
				return new Element(tar.get().insertBefore(this.get(), firstChild));
			} else {
				return tar.append(this.get());
			}
		},
		
		append: function(el) {
			if(_isElementNode(el)) {
				return new Element(this.get().appendChild(el));
			} else if(el instanceof Element) {
				return new Element(this.get().appendChild(el.get()));
			}
			return null;
		},
		
		appendTo: function(parent) {
			var child = this.get();
			if(!child) {
				return null;
			}
			if(_isElementNode(parent)) {
				return new Element(parent.appendChild(child));
			} else if(parent instanceof Element) {
				return new Element(parent.append(child));
			}
			return null;
		},
		
		before: function(target) {
			var el = this.get();
			target = $query(target).get();
			if(!el || !target || Element.isBody(target)) {
				return this;
			}
			target.parentNode.insertBefore(el, target);
			return this;
		},
		
		after: function(target) {
			var el = this.get();
			target = $query(target).get();
			if(!el || !target || Element.isBody(target)) {
				return this;
			}
			if(target.nextSibling) {
				target.parentNode.insertBefore(el, target.nextSibling);
			} else {
				target.parentNode.appendChild(el);
			}
			return this;
		},
		
		clone: function(bool) {
			var el = this.get();
			if(el) {
				return new Element(el.cloneNode(bool));
			}
			return null;
		},
		
		show: function() {
			if(!this.size()) {
				return this;
			}
			var _display = this.getDatasetVal('yom-display');
			this.setStyle('display', _display == undefined ? 'block' : _display);
			return this;
		},
		
		hide: function() {
			if(!this.size()) {
				return this;
			}
			var _display = this.getStyle('display');
			if(_display != 'none' && this.getDatasetVal('yom-display') == undefined) {
				this.setDatasetVal('yom-display', _display);
			}
			this.setStyle('display', 'none');
			return this;
		},
		
		toggle: function(callback) {
			this.each(function(el) {
				el = new Element(el);
				if(el.getStyle('display') == 'none') {
					el.show();
					callback && callback.call(el, 'SHOW');
				} else {
					el.hide();
					callback && callback.call(el, 'HIDE');
				}
			});
			return this;
		},
		
		addEventListener: function(eType, listener, bind) {
			var Event = require('yom/event');
			this.each(function(el) {
				Event.addListener(el, eType, listener, bind || el);
			});
			return this;
		},
		
		removeEventListener: function(eType, listener) {
			var Event = require('yom/event');
			this.each(function(el) {
				Event.removeListener(el, eType, listener);
			});
			return this;
		},
		
		concat: function(els) {
			return new Element(this.getAll().concat(new Element(els).getAll()));
		},
		
		removeItem: function(el) {
			YOM.array.remove(this._items, function(item, i) {
				if(typeof el == 'function') {
					return el(item.get(), i);
				} else if(typeof el == 'number') {
					if(el == i) {
						return -1;
					} else {
						return 0;
					}
				} else {
					return el == item.el;
				}
			});
			return this;
		}
	});
	
	Element._ID = 107;
	
	Element.head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
	
	Element.isBody = function(el) {
		el = $query(el).get();
		if(!el) {
			return false;
		}
		return el.tagName == 'BODY' || el.tagName == 'HTML';
	};

	Element.create = function(name, attrs, style) {
		var el = new Element(document.createElement(name));
		attrs && el.setAttr(attrs);
		style && el.setStyle(style);
		return el.get();
	};
	
	Element.contains = function(a, b) {
		return (a.contains) ? (a != b && a.contains(b)) : !!(a.compareDocumentPosition(b) & 16);
	};
	
	Element.searchChain = function(el, prop, validator) {
		var res;
		while(el && el.nodeType) {
			res = el[prop];
			if(res && (!validator || validator(res))) {
				return res;
			}
			el = res;
		}
		return null;
	};
	
	Element.getViewRect = function(doc) {
		var res;
		doc = doc || document;
		res = {
			top: window.pageYOffset || Math.max(doc.documentElement.scrollTop, doc.body.scrollTop),
			left: window.pageXOffset || Math.max(doc.documentElement.scrollLeft, doc.body.scrollLeft),
			bottom: 0,
			right: 0,
			width: doc.documentElement.clientWidth || doc.body.clientWidth,
			height: doc.documentElement.clientHeight || doc.body.clientHeight
		};
		res.bottom = res.top + res.height;
		res.right = res.left + res.width;
		return res;
	};
	
	Element.getDocSize = function(doc) {
		var w, h;
		doc = doc || document;
		if(YOM.browser.isQuirksMode()) {
			if(YOM.browser.chrome || YOM.browser.safari || YOM.browser.firefox) {
				w = Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth);
				h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
			} else {
				w = doc.body.scrollWidth || doc.documentElement.scrollWidth;
				h = doc.body.scrollHeight || doc.documentElement.scrollHeight;
			}
		} else {
			w = doc.documentElement.scrollWidth || doc.body.scrollWidth;
			h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
		}
		return {
			width: w,
			height: h
		};
	};
	
	return Element;
});
