/**
 * Inspired by KISSY
 * @class YOM.Tween
 */
define('yom/tween', ['require'], function(require) {
	var YOM = {
		'browser': require('yom/browser'),
		'object': require('yom/object'),
		'InstanceManager': require('yom/instance-manager'),
		'Element': require('yom/element'),
		'transition': require('yom/transition')
	};
	
	var _ID = 120;
	var _STATUS = {
		INIT: 0,
		TWEENING: 1,
		STOPPED: 2
	};
	var _STYLE_PROPS = [
		'backgroundColor', 'borderBottomColor', 'borderBottomWidth', 'borderBottomStyle', 'borderLeftColor', 'borderLeftWidth', 'borderLeftStyle', 'borderRightColor', 'borderRightWidth', 'borderRightStyle', 'borderSpacing', 'borderTopColor', 'borderTopWidth', 'borderTopStyle', 'bottom', 'color', 'font', 'fontFamily', 'fontSize', 'fontWeight', 'height', 'left', 'letterSpacing', 'lineHeight', 'marginBottom', 'marginLeft', 'marginRight', 'marginTop', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth', 'opacity', 'outlineColor', 'outlineOffset', 'outlineWidth', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingTop', 'right', 'textIndent', 'top', 'width', 'wordSpacing', 'zIndex', 'position'
	];
	var _FPS = 60;
	
	var _im = new YOM.InstanceManager();
	var _parserEl = null;
	
	var _requestAnimationFrame = window.requestAnimationFrame
	|| window.webkitRequestAnimationFrame
	|| window.mozRequestAnimationFrame
	|| window.oRequestAnimationFrame
	|| window.msRequestAnimationFrame
	|| function(callback) {
		return setTimeout(callback, 1000 / _FPS);
	}
	
	var _cancelAnimationFrame = window.cancelAnimationFrame
	|| window.webkitCancelAnimationFrame
	|| window.mozCancelAnimationFrame
	|| window.oCancelAnimationFrame
	|| window.msCancelAnimationFrame
	|| function(timer) {
		clearTimeout(timer);
	};
	
	function _getParserEl() {
		if(!_parserEl) {
			_parserEl = YOM.Element.create('div');
		}
		return _parserEl;
	};
	
	function _getRgbVal(str) {
		var res;
		str += '';
		if(str.indexOf('rgb') === 0) {
			res = str.match(/\d+/g);
		} else if(str.indexOf('#') === 0) {
			if(str.length === 4) {
				str = '#' + str.slice(1, 2) + str.slice(1, 2) + str.slice(2, 3) + str.slice(2, 3) + str.slice(3, 4) + str.slice(3, 4);
			}
			res = [parseInt(str.slice(1, 3), 16) || 0, parseInt(str.slice(3, 5), 16) || 0, parseInt(str.slice(5, 7), 16) || 0];
		}
		return res || [];
	};
	
	function _calColorVal(source, target, percent) {
		var srcTmp = _getRgbVal(source);
		var tarTmp = _getRgbVal(target);
		if(!tarTmp.length) {
			return target;
		}
		var tmp = [];
		for(var i = 0; i < 4; i++) {
			srcTmp[i] = parseInt(srcTmp[i]) || 0;
			tarTmp[i] = parseInt(tarTmp[i]) || 0;
			tmp[i] = parseInt(srcTmp[i] + (tarTmp[i] - srcTmp[i]) * percent);
			tmp[i] = tmp[i] < 0 ? 0 : tmp[i] > 255 ? 255 : tmp[i];
		}
		if(target.indexOf('rgba') === 0) {
			return 'rgba(' + tmp.join(',') + ')';
		} else {
			tmp.pop();
			return 'rgb(' + tmp.join(',') + ')';
		}
	};
	
	function _calNumVal(origin, target, percent) {
		return origin + (target - origin) * percent;
	};
	
	function _calStrVal(origin, target, percent) {
		return percent === 1 ? target : origin;
	};
	
	function _parsePropVal(val) {
		var v, u;
		val = val + '';
		v = parseFloat(val);
		u = val.replace(/^[-\d\.]+/, '');
		return isNaN(v) ? {v: val, u: '', f: (/^#|rgb/).test(val) ? _calColorVal : _calStrVal} : {v: v, u: u, f: _calNumVal};
	};
	
	function _getStyle(style) {
		var res = {};
		var parserEl;
		if(!style) {
			return res;
		}
		if(typeof style == 'string') {
			parserEl = _getParserEl();
			parserEl.innerHTML = '<div style="' + style + '"></div>';
			style = parserEl.firstChild.style;
		}
		YOM.object.each(_STYLE_PROPS, function(prop) {
			var val = style[prop];
			if(val || val === 0) {
				res[prop] = _parsePropVal(val);
			}
		});
		return res;
	};
	
	function _getOriginStyle(el, target, origin) {
		var res = {};
		origin = _getStyle(origin);
		YOM.object.each(target, function(propVal, propName) {
			var val;
			if(origin[propName]) {
				res[propName] = origin[propName];
			} else {
				val = el.getStyle(propName);
				if(val || val === 0) {
					res[propName] = _parsePropVal(val);
				} else {
					res[propName] = propVal;
				}
			}
		});
		return res;
	};
	
	function _getProp(prop) {
		var res = {};
		YOM.object.each(prop, function(propVal, propName) {
			res[propName] = _parsePropVal(propVal);
		});
		return res;
	};
	
	function _getOriginProp(el, target, origin) {
		var res = {};
		origin = _getProp(origin);
		YOM.object.each(target, function(propVal, propName) {
			var val;
			if(origin[propName]) {
				res[propName] = origin[propName];
			} else {
				val = el.getProp(propName);
				if(val != undefined) {
					res[propName] = _parsePropVal(val);
				} else {
					res[propName] = propVal;
				}
			}
		});
		return res;
	};
	
	function Tween(el, duration, opt) {
		if(!(this instanceof Tween)) {
			return new Tween(el, duration, opt);
		}
		opt = opt || {};
		opt.origin = opt.origin || {};
		opt.target = opt.target || {};
		this._opt = opt;
		this._el = $query(el);
		this._duration = duration;
		this._css = opt.css && !opt.target.prop && Tween.getCssTransitionName();
		this._targetStyle = _getStyle(opt.target.style);
		this._originStyle = _getOriginStyle(this._el, this._targetStyle, opt.origin.style);
		this._targetProp = _getProp(opt.target.prop);
		this._originProp = _getOriginProp(this._el, this._targetProp, opt.origin.prop);
		this._transition = YOM.transition[opt.transition] || opt.transition || YOM.transition['easeOut'];
		this._complete = opt.complete || $empty;
		this._timer = null;
		this._startTime = null;
		this._status = _STATUS.INIT;
		this._id = _im.add(this);
		return this;
	};
	
	Tween._im = _im;
	
	Tween.getCssTransitionName = function() {
		var el = new YOM.Element(_getParserEl());
		var name = 'transition';
		var isSupport = el.getStyle(name) != undefined;
		if(!isSupport) {
			if(YOM.browser.chrome || YOM.browser.safari || YOM.browser.ipad || YOM.browser.iphone || YOM.browser.android) {
				name = '-webkit-transition';
			} else if(YOM.browser.firefox) {
				name = '-moz-transition';
			} else if(YOM.browser.opera) {
				name = '-o-transition';
			} else if(YOM.browser.ie) {
				name = '-ms-transition';
			} else {
				name = '';
			}
			if(name) {
				isSupport = el.getStyle(name) != undefined;
				if(!isSupport) {
					name = '';
				}
			}
		}
		Tween.getCssTransitionName = function() {
			return name;
		};
		return name;
	};
	
	Tween.setTimer = function(setter, duration, callback, transition) {
		transition = YOM.transition[transition] || transition || YOM.transition['linear'];
		var start = $now();
		var end = start + duration;
		setter(_requestAnimationFrame(function() {
			var now = $now();
			var percent = now >= end ? 1 : (now - start) / duration;
			percent = Math.min(transition(percent), 1);
			callback(percent);
			if(percent < 1) {
				setter(_requestAnimationFrame(arguments.callee));
			}
		}));
	};

	Tween.stopAllTween = function(el) {
		$query(el).each(function(el) {
			var tweenObj = _im.get(new YOM.Element(el).getDatasetVal('yom-tween-oid'));
			tweenObj && tweenObj.stop();
		});
	};
	
	Tween.cancelTimer = _cancelAnimationFrame;
	
	Tween.prototype._stopAllTween = function() {
		Tween.stopAllTween(this._el);
	};
	
	Tween.prototype._removeTweeningEl = function() {
		this._el.removeItem(function(el) {
			var tweenObj = _im.get(new YOM.Element(el).getDatasetVal('yom-tween-oid'));
			return tweenObj && tweenObj.isTweening();
		});
	};
	
	Tween.prototype._cssTween = function() {
		var self = this;
		var originStyle = this._originStyle;
		var targetStyle = this._targetStyle;
		var timingFunction = YOM.transition.css[this._opt.transition] || YOM.transition.css['easeOut'];
		var tVal;
		for(prop in originStyle) {
			tVal = originStyle[prop];
			this._el.setStyle(prop, tVal.v + tVal.u);
		}
		this._el.each(function(el) {
			el.clientLeft;//force reflow
		});
		this._el.storeStyle(this._css + '-duration');
		this._el.storeStyle(this._css + '-timing-function');
		this._el.setStyle(this._css + '-duration', this._duration + 'ms');
		this._el.setStyle(this._css + '-timing-function', timingFunction);
		for(prop in targetStyle) {
			tVal = targetStyle[prop];
			this._el.setStyle(prop, tVal.v + tVal.u);
		}
		this._timer = setTimeout(function() {
			self.stop(true);
		}, this._duration);
	};
	
	Tween.prototype.isTweening = function() {
		return this._status == _STATUS.TWEENING;
	};
	
	Tween.prototype.play = function() {
		if(this._status != _STATUS.INIT) {
			return 1;
		}
		if(this._opt.prior) {
			this._stopAllTween();
		} else {
			this._removeTweeningEl();
		}
		if(!this._el.size()) {
			return 2;
		}
		this._status = _STATUS.TWEENING;
		this._el.setDatasetVal('yom-tween-oid', this._id);
		var self = this;
		var targetStyle = this._targetStyle;
		var originStyle = this._originStyle;
		var targetProp = this._targetProp;
		var originProp = this._originProp;
		var prop, oVal, tVal;
		this._startTime = $now();
		if(this._css) {
			this._cssTween();
		} else {
			Tween.setTimer(function(timer) {self._timer = timer;}, this._duration, function(percent) {
				if(self._status == _STATUS.STOPPED) {
					return;
				}
				for(prop in targetStyle) {
					tVal = targetStyle[prop];
					oVal = originStyle[prop];
					if(oVal.u != tVal.u) {
						oVal.v = 0;
					}
					self._el.setStyle(prop, tVal.f(oVal.v, tVal.v, percent) + tVal.u);
				}
				for(prop in targetProp) {
					tVal = targetProp[prop];
					oVal = originProp[prop];
					if(oVal.u != tVal.u) {
						oVal.v = 0;
					}
					self._el.setProp(prop, tVal.f(oVal.v, tVal.v, percent) + tVal.u);
				}
				if(percent === 1) {
					self.stop(true);
				}
			}, this._transition);
		}
		return 0;
	};
	
	Tween.prototype.stop = function(_finished) {
		if(this._status == _STATUS.STOPPED) {
			return;
		}
		var el = this._el;
		var status = this._status;
		var tVal, oVal, percent;
		if(this._css) {
			clearTimeout(this._timer);
			this._el.restoreStyle(this._css + '-duration');
			this._el.restoreStyle(this._css + '-timing-function');
			if(!_finished) {
				percent = ($now() - this._startTime) / this._duration;
				percent = Math.min(this._transition(percent), 1);
				for(prop in this._targetStyle) {
					tVal = this._targetStyle[prop];
					oVal = this._originStyle[prop];
					if(oVal.u != tVal.u) {
						oVal.v = 0;
					}
					this._el.setStyle(prop, tVal.f(oVal.v, tVal.v, percent) + tVal.u);
				}
			}
		} else {
			_cancelAnimationFrame(this._timer);
		}
		this._el = null;
		this._status = _STATUS.STOPPED;
		_im.remove(this._id);
		if(status != _STATUS.INIT && this._complete) {
			this._complete(el);
		}
	};
	
	return Tween;
});
