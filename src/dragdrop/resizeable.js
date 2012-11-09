/**
 * @class YOM.dragdrop.Resizeable
 */
define(['./core-pkg', './draggable'], function(YOM, Draggable) {
	YOM.dragdrop = YOM.dragdrop || {};
	YOM.dragdrop.Draggable = Draggable;
	
	function ResizeHandle(el, opts) {
		ResizeHandle.superClass.constructor.call(this, el, opts);
		this._handleType = this._opts.handleType;
	};
	
	YOM.Class.extend(ResizeHandle, YOM.dragdrop.Draggable);
	
	ResizeHandle.prototype = YOM.object.extend(ResizeHandle.prototype, {
		_mousedown: function(e) {
			ResizeHandle.superClass._mousedown.call(this, e);
			YOM.Event.cancelBubble(e);
			YOM.Event.preventDefault(e);
		},
		
		_move: function(e) {
			var mouseX = YOM.Event.getPageX(e);
			var mouseY = YOM.Event.getPageY(e);
			var moveX = mouseX - this._mouse.start.x;
			var moveY = mouseY - this._mouse.start.y;
			this.dispatchEvent(this.createEvent('dragmove', {
				el: this._el,
				handleType: this._handleType,
				moveX: moveX,
				moveY: moveY
			}));
			this._checkScroll(mouseX, mouseY);
		},
		
		_checkScroll: function(mouseX, mouseY) {
			var scrollContainer = this._scrollContainer;
			if(!scrollContainer) {
				return;
			}
			var rect = YOM.Element.isBody(scrollContainer.get()) ? YOM.Element.getViewRect() : scrollContainer.getRect();
			var advance = this._opts.scrollAdvance || Math.floor(Math.min(30, rect.width / 10, rect.height / 10));
			var maxStep = this._opts.scrollStep || 3;
			if(mouseY + advance > rect.bottom) {
				scrollContainer.scrollTopBy(Math.min(mouseY + advance - rect.bottom, maxStep), 0);
			} else if(mouseY - advance < rect.top) {
				scrollContainer.scrollTopBy(Math.max(mouseY - advance - rect.top, -maxStep), 0);
			}
			if(mouseX + advance > rect.right) {
				scrollContainer.scrollLeftBy(Math.min(mouseX + advance - rect.right, maxStep), 0);
			} else if(mouseX - advance < rect.left) {
				scrollContainer.scrollLeftBy(Math.max(mouseX - advance - rect.left, -maxStep), 0);
			}
		},
		
		destory: function() {
			var el = this._el;
			ResizeHandle.superClass.destory.call(this);
			el.remove();
		}
	});
	
	function Resizeable(el, opts) {
		Resizeable.superClass.constructor.call(this, {
			resizemove: new YOM.Observer()
		});
		this._el = YOM(el);
		this._opts = opts || {};
		this._minWidth = this._opts.minWidth || 0;
		this._minHeight = this._opts.minHeight || 0;
		this._maxWidth = this._opts.maxWidth || 9999;
		this._maxHeight = this._opts.maxHeight || 9999;
		this._startPos = null;
		this._startRect = null;
		this.bound = {
			mousedown: $bind(this, this._mousedown),
			move: $bind(this, this._move)	
		};
		this._resizeHandles = [];
		this._init();
	};
	
	YOM.Class.extend(Resizeable, YOM.Event);
	
	Resizeable.prototype = YOM.object.extend(Resizeable.prototype, {
		_init: function() {
			var attr = {'data-yom-type': 'resizeHandle'};
			var extra = YOM.browser.isQuirksMode() && YOM.browser.ie ? 2 : 0;
			var style = YOM.object.extend({
				border: 'solid 1px #000',
				width: 6 + extra + 'px',
				height: 6 + extra + 'px',
				lineHeight: '6px',
				background: '#fff',
				position: 'absolute',
				display: 'none'
			}, this._opts.style);
			var borders = this._getBorders(true);
			var handleTypes = {
				'LT': {left: -borders.left + 'px', top: -borders.top + 'px', cursor: 'nw-resize'},
				'RT': {right: -borders.right + 'px', top: -borders.top + 'px', left: '', cursor: 'ne-resize'},
				'RB': {right: -borders.right + 'px', bottom: -borders.bottom + 'px', left: '', top: '', cursor: 'se-resize'},
				'LB': {left: -borders.left + 'px', bottom: -borders.bottom + 'px', top: '', cursor: 'sw-resize'},
				'R': {right: -borders.right + 'px', top: '50%', left: '', marginTop: '-4px', cursor: 'e-resize'},
				'L': {left: -borders.left + 'px', top: '50%', marginTop: '-4px', cursor: 'w-resize'},
				'T': {left: '50%', top: -borders.top + 'px', marginLeft: '-4px', marginTop: '0', cursor: 'n-resize'},
				'B': {left: '50%', bottom: -borders.bottom + 'px', top: '', marginLeft: '-4px', cursor: 's-resize'}
			};
			var resizeHandle;
			if(this._opts.handles) {
				YOM.object.each(this._opts.handles, function(t) {
					if(handleTypes[t]) {
						resizeHandle = new ResizeHandle(this._el.append(YOM.Element.create('div', attr, YOM.object.extend(style, handleTypes[t]))).setHtml('&nbsp'), {scrollContainer: this._opts.scrollContainer, handleType: t});
						resizeHandle.addEventListener('dragmove', this.bound.move);
						resizeHandle.addEventListener('dragmousedown', this.bound.mousedown);
						this._resizeHandles.push(resizeHandle);
					}
				}, this);
			} else {
				if(this._el.getStyle('position') == 'absolute') {
					YOM.object.each(handleTypes, function(s, t) {
						resizeHandle = new ResizeHandle(this._el.append(YOM.Element.create('div', attr, YOM.object.extend(style, s))).setHtml('&nbsp'), {scrollContainer: this._opts.scrollContainer, handleType: t});
						resizeHandle.addEventListener('dragmove', this.bound.move);
						resizeHandle.addEventListener('dragmousedown', this.bound.mousedown);
						this._resizeHandles.push(resizeHandle);
					}, this);
				} else {
					resizeHandle = new ResizeHandle(this._el.append(YOM.Element.create('div', attr, YOM.object.extend(style, handleTypes['RB']))).setHtml('&nbsp'), {scrollContainer: this._opts.scrollContainer, handleType: 'RB'});
					resizeHandle.addEventListener('dragmove', this.bound.move);
					resizeHandle.addEventListener('dragmousedown', this.bound.mousedown);
					this._resizeHandles.push(resizeHandle);
				}
			}
		},
		
		_getBorders: function(ignoreQuirkMode) {
			if(YOM.browser.isQuirksMode() && YOM.browser.ie && !ignoreQuirkMode) {
				return {left: 0, top: 0, right: 0, bottom: 0};
			}
			return {
				left: parseInt(this._el.getStyle('border-left-width')) || 0,
				top: parseInt(this._el.getStyle('border-top-width')) || 0,
				right: parseInt(this._el.getStyle('border-right-width')) || 0,
				bottom: parseInt(this._el.getStyle('border-bottom-width')) || 0
			};
		},
		
		_getBoundary: function() {
			var boundary = this._opts.boundary;
			if(boundary) {
				if(boundary == 'PAGE') {
					boundary = YOM(document.body).getRect();
				} else if(boundary == 'VIEW') {
					boundary = YOM.Element.getViewRect();
				} else if(YOM(boundary).get()) {
					boundary = YOM(boundary).getRect();
				} else if(!isNaN(parseInt(boundary.left)) && !isNaN(parseInt(boundary.top)) && !isNaN(parseInt(boundary.right)) && !isNaN(parseInt(boundary.bottom))) {
					boundary = YOM.object.extend(boundary, {width: boundary.right - boundary.left, height: boundary.bottom - boundary.top});
				} else {
					boundary = null;
				}
			}
			return boundary;
		},
		
		_setWidth: function(moveX) {
			var w = Math.min(this._maxWidth, Math.max(this._minWidth, this._startRect.width + moveX));
			var boundary = this._getBoundary();
			if(boundary) {
				var borders = this._getBorders();
				if(this._startRect.left + borders.left + borders.right + w > boundary.right) {
					w = Math.min(this._maxWidth, Math.max(this._minWidth, boundary.right - this._startRect.left - borders.left - borders.right));
				}
			}
			this._el.setStyle('width', w + 'px');
		},
		
		_setHeight: function(moveY) {
			var h = Math.min(this._maxHeight, Math.max(this._minHeight, this._startRect.height + moveY));
			var boundary = this._getBoundary();
			if(boundary) {
				var borders = this._getBorders();
				if(this._startRect.top + borders.top + borders.bottom + h > boundary.bottom) {
					h = Math.min(this._maxHeight, Math.max(this._minHeight, boundary.bottom - this._startRect.top - borders.top - borders.bottom));
				}
			}
			this._el.setStyle('height', h + 'px');
		},
		
		_setLeft: function(moveX) {
			var w = Math.min(this._maxWidth, Math.max(this._minWidth, this._startRect.width - moveX));
			var boundary = this._getBoundary();
			if(boundary) {
				var borders = this._getBorders();
				if(this._startRect.right - borders.left - borders.right - w < boundary.left) {
					w = Math.min(this._maxWidth, Math.max(this._minWidth, this._startRect.right - boundary.left - borders.left - borders.right));
				}
			}
			this._el.setStyle('width', w + 'px');
			if(w != this._minWidth && w!= this._maxWidth && w == this._startRect.width - moveX) {
				this._el.setStyle('left', this._startPos.left + moveX + 'px');
			} else {
				this._el.setStyle('left', this._startPos.left + this._startRect.width - w + 'px');
			}
		},
		
		_setTop: function(moveY) {
			var h = Math.min(this._maxHeight, Math.max(this._minHeight, this._startRect.height - moveY));
			var boundary = this._getBoundary();
			if(boundary) {
				var borders = this._getBorders();
				if(this._startRect.bottom - borders.top - borders.bottom - h < boundary.top) {
					h = Math.min(this._maxHeight, Math.max(this._minHeight, this._startRect.bottom - boundary.top - borders.top - borders.bottom));
				}
			}
			this._el.setStyle('height', h + 'px');
			if(h != this._minHeight && h!= this._maxHeight && h == this._startRect.height - moveY) {
				this._el.setStyle('top', this._startPos.top + moveY + 'px');
			} else {
				this._el.setStyle('top', this._startPos.top + this._startRect.height - h + 'px');
			}
		},
		
		_mousedown: function(e) {
			var borders = this._getBorders();
			this._startRect = this._el.getRect();
			this._startRect.width -= borders.left + borders.right;
			this._startRect.height -= borders.top + borders.bottom;
			var posLeft = parseInt(this._el.getStyle('left'));
			var posTop = parseInt(this._el.getStyle('top'));
			if(isNaN(posLeft) || isNaN(posTop)) {
				var rect = this._el.getRect(this._el.getOffsetParent());
				this._startPos = {left: rect.left, top: rect.top};
			} else {
				this._startPos = {left: posLeft, top: posTop};
			}
		},
		
		_move: function(e) {
			switch(e.handleType) {
			case 'T':
				this._setTop(e.moveY);
				break;
			case 'R':
				this._setWidth(e.moveX);
				break;
			case 'B':
				this._setHeight(e.moveY);
				break;
			case 'L':
				this._setLeft(e.moveX);
				break;
			case 'LT':
				this._setLeft(e.moveX);
				this._setTop(e.moveY);
				break;
			case 'RT':
				this._setWidth(e.moveX);
				this._setTop(e.moveY);
				break;
			case 'RB':
				this._setWidth(e.moveX);
				this._setHeight(e.moveY);
				break;
			case 'LB':
				this._setLeft(e.moveX);
				this._setHeight(e.moveY);
				break;
			default:
			}
			this.dispatchEvent(this.createEvent('resizemove', {
				el: this._el
			}));
		},
		
		enable: function() {
			this._el.find('[data-yom-type="resizeHandle"]').show();
		},
		
		disable: function() {
			this._el.find('[data-yom-type="resizeHandle"]').hide();
		},
		
		destory: function() {
			this.disable();
			this._el = null;
			YOM.object.each(this._resizeHandles, function(resizeHandle, i) {
				resizeHandle.destory();
				this._resizeHandles[i] = null;
			}, this);
			this._resizeHandles = null;
		}
	});
	
	return Resizeable;
});
