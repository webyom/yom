/**
 * @class YOM.dragdrop.Droppable
 */
define(['./core-pkg', './draggable'], function(YOM, Draggable) {
	YOM.dragdrop = YOM.dragdrop || {};
	YOM.dragdrop.Draggable = Draggable;
	
	function Droppable(el, dropboxes, opts) {
		Droppable.superClass.constructor.call(this, el, opts);
		this.addObservers({
			dropstart: new YOM.Observer(),
			dropenter: new YOM.Observer(),
			dropmove: new YOM.Observer(),
			dropleave: new YOM.Observer(),
			droprelease: new YOM.Observer()
		});
		this._oriEl = this._el;
		this._dropboxes = YOM(dropboxes);
		this._clone = this._opts.clone;
		this._startOff = typeof this._opts.startOff == 'number' ? {left: this._opts.startOff, top: this._opts.startOff} : this._opts.startOff || {left: 0, top: 0};//the distance of cloned el off the original one while mousedown
		this._lastCalMouse = this._mouse.now;//the last mouse position calculating overlap
		this._lastCalTime = $now();//the last time calculating overlap
		this._calSpaceInterval = this._opts.calSpaceInterval || 10;
		this._calTimeInterval = this._opts.calTimeInterval || 50;
		this._lastDropbox = null;
	};
	
	YOM.Class.extend(Droppable, YOM.dragdrop.Draggable);
	
	Droppable.prototype = YOM.object.extend(Droppable.prototype, {
		_clear: function() {
			if(this._clone && this._el && this._el != this._oriEl) {
				this._el.remove();
				this._el = this._oriEl;
			}
			this._oriEl.restoreStyle('position');
			this._oriEl.restoreStyle('margin');
		},
		
		_mousedown: function(e) {
			if(this._dragging) {
				return;
			}
			Droppable.superClass._mousedown.call(this, e);
			var startRect = this._rect.start;
			var mouseX = YOM.Event.getPageX(e);
			var mouseY = YOM.Event.getPageY(e);
			var offsetX = mouseX - startRect.left;
			var offsetY = mouseY - startRect.top;
			this._oriEl.storeStyle('position');
			this._oriEl.storeStyle('margin');
			if(this._clone) {
				if(typeof this._clone == 'function') {
					this._el = YOM(this._clone(this._el, startRect));
				} else {
					this._el = this._oriEl.clone(true);
				}
				this._el.appendTo(this._opts.cloneContainer || document.body);
				var cloneRect = this._el.getRect();
				var relativeRect = this._oriEl.getRect(this._el.getOffsetParent());
				this._el.setStyle({
					position: 'absolute',
					margin: '0',
					left: relativeRect.left + (offsetX * (startRect.width - cloneRect.width) / startRect.width) + this._startOff.left + 'px',
					top: relativeRect.top + (offsetY * (startRect.height - cloneRect.height) / startRect.width) + this._startOff.top + 'px'}
				);
				this._rect.start = this._el.getRect();
			}
		},
		
		_startCheck: function(e) {
			if(Droppable.superClass._startCheck.call(this, e)) {
				var mouseX = YOM.Event.getPageX(e);
				var mouseY = YOM.Event.getPageY(e);
				var moveX = mouseX - this._mouse.start.x;
				var moveY = mouseY - this._mouse.start.y;
				var startRect = this._rect.start;
				if(!this._clone) {
					var parentRect = this._el.getOffsetParent().getRect();
					this._el.setStyle({
						position: 'absolute',
						margin: '0',
						left: startRect.left - parentRect.left + 'px',
						top: startRect.top - parentRect.top + 'px'
					});
				}
				this._lastCalMouse = this._mouse.now;
				this._lastCalTime = $now();
				this.dispatchEvent(this.createEvent('dropstart', {
					el: this._el,
					oriEl: this._oriEl,
					handles: this._handles,
					pos: this._pos,
					mouse: this._mouse,
					rect: this._rect,
					moveX: moveX,
					moveY: moveY
				}), 1);
			}
		},
		
		_move: function(e) {
			Droppable.superClass._move.call(this, e);
			var mouseX = YOM.Event.getPageX(e);
			var mouseY = YOM.Event.getPageY(e);
			var moveX = mouseX - this._lastCalMouse.x;
			var moveY = mouseY - this._lastCalMouse.y;
			if(Math.abs(moveX) < this._calSpaceInterval && Math.abs(moveY) < this._calSpaceInterval || $now() - this._lastCalTime < this._calTimeInterval) {
				return;
			}
			var box = this.getDroppableBox(mouseX, mouseY, this._opts.enterDirection);
			if(box) {
				if(box == this._lastDropbox) {
					this.dispatchEvent(this.createEvent('dropmove', {
						el: this._el,
						oriEl: this._oriEl,
						handles: this._handles,
						pos: this._pos,
						mouse: this._mouse,
						rect: this._rect,
						dropbox: YOM(box),
						moveX: moveX,
						moveY: moveY
					}), 1);
				} else {
					if(this._lastDropbox) {
						this.dispatchEvent(this.createEvent('dropleave', {
							el: this._el,
							oriEl: this._oriEl,
							handles: this._handles,
							pos: this._pos,
							mouse: this._mouse,
							rect: this._rect,
							dropbox: YOM(this._lastDropbox),
							moveX: moveX,
							moveY: moveY
						}), 1);
					}
					this.dispatchEvent(this.createEvent('dropenter', {
						el: this._el,
						oriEl: this._oriEl,
						handles: this._handles,
						pos: this._pos,
						mouse: this._mouse,
						rect: this._rect,
						dropbox: YOM(box),
						moveX: moveX,
						moveY: moveY
					}), 1);
				}
				this._lastDropbox = box;
			} else if(this._lastDropbox) {
				this.dispatchEvent(this.createEvent('dropleave', {
					el: this._el,
					oriEl: this._oriEl,
					handles: this._handles,
					pos: this._pos,
					mouse: this._mouse,
					rect: this._rect,
					dropbox: YOM(this._lastDropbox),
					moveX: moveX,
					moveY: moveY
				}), 1);
				this._lastDropbox = null;
			}
			this._lastCalMouse = this._mouse.now;
			this._lastCalTime = $now();
		},
		
		stop: function() {
			try {
				Droppable.superClass.stop.call(this);
			} catch(e) {
				this._clear();
				throw(e);
			}
			if(this._dragStarted && this._el) {
				try {
					this.dispatchEvent(this.createEvent('droprelease', {
						el: this._el,
						oriEl: this._oriEl,
						handles: this._handles,
						pos: this._pos,
						mouse: this._mouse,
						rect: this._rect,
						dropbox: this._lastDropbox && YOM(this._lastDropbox)
					}), 1);
				} catch(e) {
					this._clear();
					throw(e);
				}
			}
			this._clear();
		},
		
		getDroppableBox: function(x, y, d) {
			var boxes = YOM.array.filter(this._dropboxes.getAll(), function(item, i) {
				var rect = YOM(item).getRect();
				if((y > rect.top && y < rect.bottom || d == 'H') && (x > rect.left && x < rect.right || d == 'V')) {
					return true;
				}
				return false;
			});
			return boxes.length ? boxes[boxes.length - 1] : null;
		},
		
		addDropboxes: function(dropboxes, head) {
			if(head) {
				this._dropboxes = YOM(dropboxes).concat(this._dropboxes);
			} else {
				this._dropboxes = this._dropboxes.concat(dropboxes);
			}
			return this;
		},
		
		destory: function() {
			Droppable.superClass.destory.call(this);
			this._el = null;
			this._oriEl = null;
			this._dropboxes = null;
		}
	});
	
	return Droppable;
});
