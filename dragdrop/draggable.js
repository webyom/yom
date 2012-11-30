/**
 * @class YOM.dragdrop.Draggable
 */
define(['../core/core-built'], function(YOM) {
	var _DIRECTION_MAP = {'H': 'H', 'V': 'V'}
	
	function Draggable(el, opts) {
		Draggable.superClass.constructor.call(this, {
			dragmousedown: new YOM.Observer(),
			dragstart: new YOM.Observer(),
			dragmove: new YOM.Observer(),
			dragstop: new YOM.Observer()
		})
		this._el = YOM(el)
		this._opts = opts || {}
		this._dragDirection = _DIRECTION_MAP[this._opts.dragDirection] || 'ALL'
		this._dragging = false
		this._dragStarted = false
		this._fix = parseInt(this._opts.fix) || 0
		this._pos = {
			start: {left: 0, top: 0},
			now: {left: 0, top: 0}
		}
		this._mouse = {
			start: {x: 0, y: 0},
			now: {x: 0, y: 0}
		}
		this._rect = {start: null, now: null}
		this._bound = {
			mousedown: $bind(this, this._mousedown),
			startCheck: $bind(this, this._startCheck),
			move: $bind(this, this._move),
			stop: $bind(this, this.stop),
			preventSelect: function(e) {YOM.Event.preventDefault(e)}
		}
		this._handles = this._opts.handles ? YOM(this._opts.handles, this._el) : this._el
		this._scrollContainer = this._opts.scrollContainer ? YOM(this._opts.scrollContainer) : null
		this._scrollToRef = null
		this.enable()
	}
	
	YOM.Class.extend(Draggable, YOM.Event)
	
	Draggable.prototype = YOM.object.extend(Draggable.prototype, {
		_mousedown: function(e) {
			if(this._dragging) {
				return
			}
			this._dragging = true
			this._dragStarted = false
			var mouseX = YOM.Event.getPageX(e)
			var mouseY = YOM.Event.getPageY(e)
			var posLeft = parseInt(this._el.getStyle('left'))
			var posTop = parseInt(this._el.getStyle('top'))
			this._rect.start = this._rect.now = this._el.getRect()
			if(isNaN(posLeft) || isNaN(posTop)) {
				var rect = this._el.getRect(this._el.getOffsetParent())
				this._pos.start = {left: rect.left, top: rect.top}
			} else {
				this._pos.start = {left: posLeft, top: posTop}
			}
			this._mouse.start = {x: mouseX, y: mouseY}
			this._pos.now = YOM.object.clone(this._pos.start)
			this._mouse.now = YOM.object.clone(this._mouse.start)
			YOM.Event.addListener(document, 'mousemove', this._bound.startCheck)
			YOM.Event.addListener(document, 'mouseup', this._bound.stop)
			YOM.Event.addListener(document, YOM.browser.ie ? 'selectstart' : 'mousedown', this._bound.preventSelect)
			this.dispatchEvent(this.createEvent('dragmousedown', {
				el: this._el,
				handles: this._handles,
				pos: this._pos,
				mouse: this._mouse
			}), 1)
		},
		
		_startCheck: function(e) {
			var snap = parseInt(this._opts.snap) || 0
			var mouseX = YOM.Event.getPageX(e)
			var mouseY = YOM.Event.getPageY(e)
			var moveX = Math.abs(mouseX - this._mouse.start.x)
			var moveY = Math.abs(mouseY - this._mouse.start.y)
			this._mouse.now = {x: mouseX, y: mouseY}
			if(moveX > snap || moveY > snap) {
				YOM.Event.removeListener(document, 'mousemove', this._bound.startCheck)
				YOM.Event.addListener(document, 'mousemove', this._bound.move)
				this._dragStarted = true
				this.dispatchEvent(this.createEvent('dragstart', {
					el: this._el,
					handles: this._handles,
					pos: this._pos,
					mouse: this._mouse,
					rect: this._rect
				}), 1)
			}
			return this._dragStarted
		},
		
		_getMovePos: function(moveX, moveY) {
			var fix = this._fix
			var dragDirection = this._dragDirection
			var boundary = this._opts.boundary
			var startRect = this._rect.start
			var toLeft = startRect.left + (dragDirection == 'V' ? 0 : (moveX + fix))
			var toTop = startRect.top + (dragDirection == 'H' ? 0 : (moveY + fix))
			var viewRect, parentRect
			if(boundary) {
				if(boundary == 'PAGE') {
					viewRect = YOM.Element.getViewRect()
					boundary = YOM(document.body).getRect()
					boundary.height = Math.max(boundary.height, viewRect.height)
					boundary.width = Math.max(boundary.width, viewRect.width)
					boundary.bottom = Math.max(boundary.bottom, viewRect.bottom)
					boundary.right = Math.max(boundary.right, viewRect.right)
				} else if(boundary == 'VIEW') {
					boundary = YOM.Element.getViewRect()
				} else if(YOM(boundary).get()) {
					boundary = YOM(boundary).getRect()
				} else if(!isNaN(boundary.left) && !isNaN(boundary.top) && !isNaN(boundary.right) && !isNaN(boundary.bottom)) {
					boundary = YOM.object.extend(boundary, {width: boundary.right - boundary.left, height: boundary.bottom - boundary.top})
				} else {
					boundary = null
				}
				if(boundary && boundary.width > 0 && boundary.height > 0) {
					if(boundary.width >= startRect.width && dragDirection != 'V') {
						if(startRect.left + moveX + fix < boundary.left) {
							toLeft += boundary.left - startRect.left - moveX - fix
						} else if(startRect.right + moveX + fix > boundary.right) {
							toLeft += boundary.right - startRect.right - moveX - fix
						}
					}
					if(boundary.height >= startRect.height && dragDirection != 'H') {
						if(startRect.top + moveY + fix < boundary.top) {
							toTop += boundary.top - startRect.top - moveY - fix
						} else if(startRect.bottom + moveY + fix > boundary.bottom) {
							toTop += boundary.bottom - startRect.bottom - moveY - fix
						}
					}
				}
			}
			parentRect = this._el.getOffsetParent().getRect()
			toLeft -= parentRect.left
			toTop -= parentRect.top
			return {
				left: toLeft,
				top: toTop
			}
		},
		
		_move: function(e) {
			var mouseX = YOM.Event.getPageX(e)
			var mouseY = YOM.Event.getPageY(e)
			var moveX = mouseX - this._mouse.start.x
			var moveY = mouseY - this._mouse.start.y
			var movePos = this._getMovePos(moveX, moveY)
			this._el.setStyle({
				left: movePos.left + 'px',
				top: movePos.top + 'px'
			})
			this._pos.now = {left: movePos.left, top: movePos.top}
			this._mouse.now = {x: mouseX, y: mouseY}
			this._rect.now = this._el.getRect()
			try {
				this.dispatchEvent(this.createEvent('dragmove', {
					el: this._el,
					handles: this._handles,
					pos: this._pos,
					mouse: this._mouse,
					rect: this._rect
				}))
			} catch(e) {
				this._checkScroll(mouseX, mouseY)
				throw(e)
			}
			this._checkScroll(mouseX, mouseY)
		},
		
		_checkScroll: function(mouseX, mouseY) {
			var self = this
			var scrollContainer = this._scrollContainer
			if(!scrollContainer) {
				return
			}
			var rect = YOM.Element.isBody(scrollContainer.get()) ? YOM.Element.getViewRect() : scrollContainer.getRect()
			var advance = this._opts.scrollAdvance || Math.floor(Math.min(30, rect.width / 10, rect.height / 10))
			var maxStep = this._opts.scrollStep || 10
			var scrollTop = scrollContainer.getScrollTop()
			var scrollLeft = scrollContainer.getScrollLeft()
			var scrollTopBy = 0
			var scrollLeftBy = 0
			var movePos, parentRect
			if(mouseY + advance > rect.bottom) {
				scrollTopBy = Math.min(mouseY + advance - rect.bottom, maxStep)
				scrollContainer.scrollTopBy(scrollTopBy, 0)
			} else if(mouseY - advance < rect.top) {
				scrollTopBy = Math.max(mouseY - advance - rect.top, -maxStep)
				scrollContainer.scrollTopBy(scrollTopBy, 0)
			}
			if(mouseX + advance > rect.right) {
				scrollLeftBy = Math.min(mouseX + advance - rect.right, maxStep)
				scrollContainer.scrollLeftBy(scrollLeftBy, 0)
			} else if(mouseX - advance < rect.left) {
				scrollLeftBy = Math.max(mouseX - advance - rect.left, -maxStep)
				scrollContainer.scrollLeftBy(scrollLeftBy, 0)
			}
			this._scrollToRef && clearTimeout(this._scrollToRef)
			if(scrollTopBy !== 0 && scrollTop != scrollContainer.getScrollTop() || scrollLeftBy !== 0 && scrollLeft != scrollContainer.getScrollLeft()) {
				parentRect = this._el.getOffsetParent().getRect()
				movePos = this._getMovePos(scrollLeftBy + parentRect.left + this._pos.now.left - this._rect.start.left, scrollTopBy + parentRect.top + this._pos.now.top - this._rect.start.top)
				this._el.setStyle({
					left: movePos.left + 'px',
					top: movePos.top + 'px'
				})
				this._pos.now = {left: movePos.left, top: movePos.top}
				this._scrollToRef = setTimeout(function() {
					self._checkScroll(mouseX + scrollLeftBy, mouseY + scrollTopBy)
				}, 50)
			}
		},
		
		enable: function() {
			this._handles.addEventListener('mousedown', this._bound.mousedown)
			return this
		},
		
		disable: function() {
			this._handles.removeEventListener('mousedown', this._bound.mousedown)
			return this
		},
		
		stop: function(e) {
			if(!this._dragging) {
				return
			}
			this._scrollToRef && clearTimeout(this._scrollToRef)
			if(this._dragStarted) {
				YOM.Event.removeListener(document, 'mousemove', this._bound.move)
			} else {
				YOM.Event.removeListener(document, 'mousemove', this._bound.startCheck)
			}
			YOM.Event.removeListener(document, 'mouseup', this._bound.stop)
			YOM.Event.removeListener(document, YOM.browser.ie ? 'selectstart' : 'mousedown', this._bound.preventSelect)
			this._dragging = false
			if(this._dragStarted && this._el) {
				this._rect.now = this._el.getRect()
				if(e) {
					this._mouse.now = {x: YOM.Event.getPageX(e), y: YOM.Event.getPageY(e)}
				}
				this.dispatchEvent(this.createEvent('dragstop', {
					el: this._el,
					handles: this._handles,
					pos: this._pos,
					mouse: this._mouse,
					rect: this._rect
				}))
			}
		},
		
		destory: function() {
			this.disable()
			if(this._dragging) {
				this.stop()
			}
			this._el = null
			this._handles = null
		}
	})
	
	return Draggable
})

