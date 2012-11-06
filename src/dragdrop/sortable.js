/**
 * @class YOM.dragdrop.Sortable
 */
define('./sortable', ['./core-pkg', './droppable'], function(YOM, Droppable) {
	YOM.dragdrop = YOM.dragdrop || {};
	YOM.dragdrop.Droppable = Droppable;
	
	var _DIRECTION_MAP = {'H': 'H', 'V': 'V'};
	
	function Sortable(els, opts) {
		Sortable.superClass.constructor.call(this, {
			sortstart: new YOM.Observer(),
			sortenter: new YOM.Observer(),
			sortmove: new YOM.Observer(),
			sortrelease: new YOM.Observer()
		});
		this._id = $getUniqueId();
		this._opts = opts || {};
		this._opts.clone = typeof this._opts.clone == 'function' ? this._opts.clone : $bind(this, this._clone);
		this._opts.enterDirection = _DIRECTION_MAP[this._opts.enterDirection];
		this._sortDirection = this._opts.enterDirection || _DIRECTION_MAP[this._opts.sortDirection] || 'V';
		this._droppables = [];
		this._bound = {
			start: $bind(this, this._start),
			enter: $bind(this, this._enter),
			move: $bind(this, this._move),
			release: $bind(this, this._release)
		};
		this._placeHolder = this._getHolder();
		this._lastDropbox = null;
		this._lastMove = 0;
		this._items = [];
		this._boxes = [];
		this.addItem(els);
		this.addBox(opts.box);
	};
	
	YOM.Class.extend(Sortable, YOM.Event);
	
	Sortable.prototype = $extend(Sortable.prototype, {
		_clone: function(el, startRect) {
			var w = parseInt(el.getStyle('width'));
			var h = parseInt(el.getStyle('height'));
			var padding = {
				left: parseInt(el.getStyle('padding-left')) || 0,
				top: parseInt(el.getStyle('padding-top')) || 0,
				right: parseInt(el.getStyle('padding-right')) || 0,
				bottom: parseInt(el.getStyle('padding-bottom')) || 0
			};
			el = el.clone(true);
			el.setStyle({
				width: ((w || startRect.width) - (YOM.browser.ie && YOM.browser.v < 9 ? padding.left + padding.right : 0)) + 'px',
				height: ((h || startRect.height) - (YOM.browser.ie && YOM.browser.v < 9 ? padding.top + padding.bottom : 0)) + 'px',
				opacity: 0.7
			});
			return el;
		},
		
		_isBox: function(el) {
			return el.getDatasetVal('yom-sortable-box') == this._id;
		},
		
		_start: function(e) {
			if(this.dispatchEvent(this.createEvent('sortstart', e)) ===  false) {
				return;
			}
			e.oriEl.setStyle('visibility', 'hidden');
			e.oriEl.find('[data-yom-sortable-item]').setStyle('visibility', 'hidden');
			this.showHolder(e.oriEl);
		},
		
		_enter: function(e) {
			var isBox = this._isBox(e.dropbox);
			if(isBox && YOM.Element.contains(e.dropbox.get(), e.oriEl.get())) {
				return;
			}
			var move = this._sortDirection == 'V' ? e.moveY : e.moveX;
			if(!move || e.dropbox.get() == e.oriEl.get()) {
				return;
			}
			var dropAfter = move > 0 ? 1 : 0;
			this._lastDropbox = e.dropbox.get();
			this._lastMove = move;
			if(this.dispatchEvent(this.createEvent('sortenter', $extend(e, {dropAfter: dropAfter}))) ===  false) {
				return;
			}
			if(dropAfter) {
				if(isBox) {
					e.oriEl.headTo(e.dropbox);
				} else {
					e.oriEl.after(e.dropbox);
				}
			} else {
				if(isBox) {
					e.oriEl.appendTo(e.dropbox);
				} else {
					e.oriEl.before(e.dropbox);
				}
			}
			this.showHolder(e.oriEl);
		},
		
		_move: function(e) {
			var isBox = this._isBox(e.dropbox);
			if(isBox && YOM.Element.contains(e.dropbox.get(), e.oriEl.get())) {
				return;
			}
			var move = this._sortDirection == 'V' ? e.moveY : e.moveX;
			if(!move || e.dropbox.get() == e.oriEl.get() || e.dropbox.get() == this._lastDropbox && move / this._lastMove > 0) {
				return;
			}
			var mouse = e.mouse.now;
			var rect = e.dropbox.getRect();
			var dropAfter;
			if(move > 0 && (this._sortDirection == 'V' && mouse.y > rect.top + rect.height / 2 || this._sortDirection == 'H' && mouse.x > rect.left + rect.width / 2)) {
				dropAfter = 1;
			} else if(move < 0 && (this._sortDirection == 'V' && mouse.y < rect.top + rect.height / 2 || this._sortDirection == 'H' && mouse.x < rect.left + rect.width / 2)) {
				dropAfter = 0;
			} else {
				return;
			}
			this._lastMove = move;
			if(this.dispatchEvent(this.createEvent('sortmove', $extend(e, {dropAfter: dropAfter}))) ===  false) {
				return;
			}
			if(dropAfter) {
				if(isBox) {
					e.oriEl.headTo(e.dropbox);
				} else {
					e.oriEl.after(e.dropbox);
				}
			} else {
				if(isBox) {
					e.oriEl.appendTo(e.dropbox);
				} else {
					e.oriEl.before(e.dropbox);
				}
			}
			this.showHolder(e.oriEl);
		},
		
		_release: function(e) {
			if(this.dispatchEvent(this.createEvent('sortrelease', e)) ===  false) {
				return;
			}
			var self = this;
			var targetRect = e.oriEl.getRect();
			var parentRect = this._opts.cloneContainer && (e.el.getOffsetParent() || e.oriEl.getOffsetParent() || YOM(document.body)).getRect() || YOM(document.body).getRect();
			e.el.clone(true).appendTo(this._opts.cloneContainer || document.body).tween(300, {
				origin: {
					style: {
						left: e.rect.now.left - parentRect.left + 'px',
						top: e.rect.now.top - parentRect.top + 'px',
						opacity: 0.7
					}
				},
				target: {
					style: {
						left: targetRect.left - parentRect.left + 'px',
						top: targetRect.top - parentRect.top + 'px',
						opacity: 1
					}
				},
				complete: function(el) {
					e.oriEl.setStyle('visibility', 'visible');
					e.oriEl.find('[data-yom-sortable-item]').setStyle('visibility', 'visible');
					self.hideHolder();
					el.remove();
				},
				css: true,
				transition: 'easeOut'
			});
		},
		
		_getHolder: function() {
			var holder = this._placeHolder;
			if(holder) {
				return holder;
			}
			if(this._opts.holderCreater) {
				holder = YOM(this._opts.holderCreater());
			} else {
				holder = YOM(YOM.Element.create('div', {}, this._opts.holderStyle || {
					display: 'none',
					position: 'absolute',
					border: 'dotted 1px #ccc'
				})).appendTo(document.body);
			}
			this._placeHolder = holder;
			return holder;
		},
		
		showHolder: function(el) {
			var rect = el.getRect();
			var borderWidth = YOM.browser.isQuirksMode() && YOM.browser.ie ? 0 : parseInt(this._placeHolder.getStyle('border-width')) || 0;
			this._placeHolder.setStyle({
				left: rect.left + 'px',
				top: rect.top + 'px',
				width: rect.width - borderWidth * 2 + 'px',
				height: rect.height - borderWidth * 2 + 'px'
			}).show();
		},
		
		hideHolder: function() {
			this._placeHolder && this._placeHolder.hide();
		},
		
		addItem: function(els) {
			if(!els) {
				return this;
			}
			var self = this;
			var toBeAdded = YOM.array.filter(YOM(els).getAll(), function(el) {
				var notFound = true;
				YOM.object.each(this._items, function(_el) {
					return notFound = el != _el;
				});
				if(notFound) {
					YOM(el).setDatasetVal('yom-sortable-item', self._id);
				}
				return notFound;
			});
			if(!toBeAdded.length) {
				return this;
			}
			this._items = this._items.concat(toBeAdded);
			YOM.object.each(this._droppables, function(droppable) {
				droppable.addDropboxes(toBeAdded);
			});
			YOM(toBeAdded).each(function(el) {
				var drop = new YOM.dragdrop.Droppable(el, this._boxes.concat(this._items), this._opts);
				drop.addEventListener('dropstart', this._bound.start);
				drop.addEventListener('dropenter', this._bound.enter);
				drop.addEventListener('dropmove', this._bound.move);
				drop.addEventListener('droprelease', this._bound.release);
				this._droppables.push(drop);
			}, this);
			return this;
		},
		
		addBox: function(els) {
			if(!els) {
				return this;
			}
			var self = this;
			var toBeAdded = YOM.array.filter(YOM(els).getAll(), function(el) {
				var notFound = true;
				YOM.object.each(this._boxes, function(_el) {
					return notFound = el != _el;
				});
				if(notFound) {
					YOM(el).setDatasetVal('yom-sortable-box', self._id);
				}
				return notFound;
			});
			if(!toBeAdded.length) {
				return this;
			}
			this._boxes = this._boxes.concat(toBeAdded);
			YOM.object.each(this._droppables, function(droppable) {
				droppable.addDropboxes(toBeAdded, true);
			});
			return this;
		},
		
		remove: function(els) {
			YOM(els).each(function(el) {
				YOM.array.remove(this._droppables, function(droppable) {
					if(el == droppable._oriEl.get()) {
						droppable.destory();
						return true;
					}
					return false;
				});
			});
			return this;
		},
		
		destory: function() {
			YOM.object.each(this._droppables, function(droppable) {
				droppable.destory();
			});
			try {
				this._placeHolder.remove();
			} catch(e) {};
			this._placeHolder = null;
			this._items = null;
			this._boxes = null;
			this._lastDropbox = null;
		}
	});
	
	return Sortable;
});
