/**
 * @class YOM.JsLoader
 */
define('yom/js-loader', ['require'], function(require) {
	var YOM = {
		'config': require('yom/config'),
		'Error': require('yom/error'),
		'browser': require('yom/browser'),
		'Class': require('yom/class'),
		'array': require('yom/array'),
		'InstanceManager': require('yom/instance-manager'),
		'Observer': require('yom/observer'),
		'Event': require('yom/event'),
		'Element': require('yom/element'),
		'util': require('yom/util')
	};
	
	var _TIMEOUT = 60000;
	var _STATUS = {
		INIT: 0,
		LOADING: 1,
		LOADED: 2,
		ABORTED: 3,
		TIMEOUT: 4
	};
	
	var _callbackQueueHash = {};
	var _callbackLoadingHash = {};
	var _loading_count = 0;
	var _im = new YOM.InstanceManager();
	
	var JsLoader = function(src, opt) {
		opt = opt || {};
		this._rawSrc = src;
		this._src = YOM.util.appendQueryString(src, opt.param);
		this._opt = opt;
		this._charset = opt.charset;
		this._callback = opt.callback;
		this._callbackName = opt.callbackName || '$JsLoaderCallback';
		this._onload = opt.load || $empty;
		this._onabort = opt.abort || $empty;
		this._onerror = opt.error;
		this._oncomplete = opt.complete || $empty;
		this._bind = opt.bind;
		this._random = opt.random;
		this._jsEl = null;
		this._status = _STATUS.INIT;
		this._callbacked = false;
		this._gid = opt.gid;//group id
		this._id = _im.add(this);
	};
	
	JsLoader._ID = 109;
	
	JsLoader._im = _im;
	
	YOM.Class.extend(JsLoader, YOM.Event);
	YOM.Class.genericize(JsLoader, ['addObservers', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'createEvent'], {bind: JsLoader});
	JsLoader.addObservers({
		start: new YOM.Observer(),
		complete: new YOM.Observer(),
		allcomplete: new YOM.Observer()
	});
	
	JsLoader.RET = {
		SUCC: 0,
		ABORTED: -1,
		ERROR: 1,
		TIMEOUT: 2
	};
	
	JsLoader.abortAll = function(gid) {
		var noGid = typeof gid == 'undefined';
		_im.each(function(inst) {
			inst.abort();
			if(noGid || inst.getGid() == gid) {
				inst.abort();
			}
		});
	};
	
	JsLoader.isUrlLoading = function(url, fullMatch) {
		var res = false;
		if(!url) {
			return res;
		}
		_im.each(function(inst) {
			if(fullMatch && url == inst._src || inst._src.indexOf(url) === 0) {
				res = true;
				return false;
			}
			return true;
		});
		return res;
	};
	
	JsLoader.isAnyLoading = function() {
		return _loading_count > 0;
	};
	
	JsLoader.prototype._clear = function() {
		_im.remove(this.getId());
		if(!this._jsEl) {
			return;
		}
		this._jsEl.parentNode.removeChild(this._jsEl);
		this._jsEl = null;
		if(this._callback) {
			_callbackLoadingHash[this._callbackName] = 0;
			if(_callbackQueueHash[this._callbackName] && _callbackQueueHash[this._callbackName].length) {
				_callbackQueueHash[this._callbackName].shift().load();
			}
		}
	};
	
	JsLoader.prototype._dealError = function(code) {
		if(this._onerror) {
			this._onerror.call(this._bind, code);
		} else {
			throw new YOM.Error(code);
		}
	};
	
	JsLoader.prototype._complete = function(ret) {
		this._opt.silent || _loading_count > 0 && _loading_count--;
		this._clear();
		try {
			_loading_count === 0 && JsLoader.dispatchEvent(JsLoader.createEvent('allcomplete', {src: this._src, opt: this._opt, ret: ret}));
			JsLoader.dispatchEvent(JsLoader.createEvent('complete', {src: this._src, opt: this._opt, ret: ret}));
		} catch(e) {
			if(YOM.config.debugMode) {
				throw new YOM.Error(YOM.Error.getCode(JsLoader._ID, 2));
			}
		}
		this._oncomplete.call(this._bind, ret);
	};
	
	JsLoader.prototype.getId = function() {
		return this._id;
	};
	
	JsLoader.prototype.getGid = function() {
		return this._gid;
	};
	
	JsLoader.prototype.load = function() {
		if(this._status != _STATUS.INIT) {
			return 1;
		}
		var self = this;
		if(this._callback) {
			if(_callbackLoadingHash[this._callbackName]) {
				_callbackQueueHash[this._callbackName] = _callbackQueueHash[this._callbackName] || [];
				_callbackQueueHash[this._callbackName].push(this);
				return -1;
			}
			_callbackLoadingHash[this._callbackName] = 1;
			window[this._callbackName] = $bind(this, function() {
				this._callbacked = true;
				if(this._status != _STATUS.LOADING) {
					return;
				}
				this._callback.apply(this._bind || this, YOM.array.getArray(arguments));
				window[this._callbackName] = null;
			});
		}
		function onload() {
			if(this._status != _STATUS.LOADING) {
				return;
			}
			this._status = _STATUS.LOADED;
			this._complete(JsLoader.RET.SUCC);
			if(this._callback && !this._callbacked) {
				this._dealError(YOM.Error.getCode(JsLoader._ID, 1));
			}
			this._onload.call(this._bind);
		};
		function onerror() {
			if(this._status != _STATUS.LOADING) {
				return;
			}
			this._status = _STATUS.LOADED;
			this._complete(JsLoader.RET.ERROR);
			this._dealError(YOM.Error.getCode(JsLoader._ID, 0));
		};
		this._jsEl = document.createElement('script');
		if(YOM.browser.ie) {
			YOM.Event.addListener(this._jsEl, 'readystatechange', function() {
				if(this._jsEl && (this._jsEl.readyState == 'loaded' || this._jsEl.readyState == 'complete')) {
					onload.call(this);
					return;
				}
			}, this);
		} else {
			YOM.Event.addListener(this._jsEl, 'load', function() {
				onload.call(this);
			}, this);
			YOM.Event.addListener(this._jsEl, 'error', function() {
				onerror.call(this);
			}, this);
		}
		if(this._charset) {
			this._jsEl.charset = this._charset;
		}
		this._jsEl.type = 'text/javascript';
		this._jsEl.async = 'async';
		this._jsEl.src = this._src;
		this._status = _STATUS.LOADING;
		this._opt.silent || _loading_count++;
		this._jsEl = YOM.Element.head.insertBefore(this._jsEl, YOM.Element.head.firstChild);
		setTimeout(function() {
			if(self._status != _STATUS.LOADING) {
				return;
			}
			self._status = _STATUS.TIMEOUT;
			self._complete(JsLoader.RET.TIMEOUT);
			self._dealError(YOM.Error.getCode(JsLoader._ID, 2));
		}, this._opt.timeout || _TIMEOUT);
		JsLoader.dispatchEvent(JsLoader.createEvent('start', {src: this._src, opt: this._opt}));
		return 0;
	};
	
	JsLoader.prototype.abort = function() {
		if(this._status != _STATUS.LOADING) {
			return 1;
		}
		this._status = _STATUS.ABORTED;
		this._complete(JsLoader.RET.ABORTED);
		this._onabort.call(this._bind);
		return 0;
	};
	
	return JsLoader;
});