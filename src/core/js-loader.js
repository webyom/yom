/**
 * @class YOM.JsLoader
 */
define(['global', './config', './error', './browser', './object', './class', './array', './instance-manager', './observer', './event', './element', './util'], function(global, config, Err, browser, object, Class, array, InstanceManager, Observer, Evt, Elem, util) {
	var YOM = {
		'config': config,
		'Error': Err,
		'browser': browser,
		'object': object,
		'Class': Class,
		'array': array,
		'InstanceManager': InstanceManager,
		'Observer': Observer,
		'Event': Evt,
		'Element': Elem,
		'util': util
	};
	
	var _TIMEOUT = 60000;
	var _STATUS = {
		INIT: 0,
		LOADING: 1,
		LOADED: 2,
		ABORTED: 3,
		TIMEOUT: 4
	};
	
	var _callbackHolder = {};
	var _interactiveMode = false;
	var _scriptBeingInserted = null;
	var _loading_count = 0;
	var _im = new YOM.InstanceManager();
	
	function _getInteractiveScript() {
		var script, scripts;
		scripts = document.getElementsByTagName('script');
		for(var i = 0; i < scripts.length; i++) {
			script = scripts[i];
			if(script.readyState == 'interactive') {
				return script;
			}
		}
		return script;
	};
	
	var CallbackHolder = function(name) {
		this._name = name;
		this._callbackArgs = CallbackHolder.NOT_CALLBACKED;
		global[name] = YOM.object.bind(this, this._callback);
	};
	
	CallbackHolder.NOT_CALLBACKED = new Object();
	
	CallbackHolder.prototype._callback = function() {
		var script, loaderId, loader;
		if(_interactiveMode) {
			script = _scriptBeingInserted || _getInteractiveScript();
			if(script) {
				loaderId = script.getAttribute('data-yom-jsloader-id');
				if(loaderId) {
					loader = _im.get(loaderId);
					loader && loader.callback.apply(loader, arguments);
				}
			}
		} else {
			this._callbackArgs = arguments;
		}
	};
	
	CallbackHolder.prototype.getCallbackArgs = function() {
		var res = this._callbackArgs;
		this._callbackArgs = CallbackHolder.NOT_CALLBACKED;
		return res;
	};
	
	var JsLoader = function(src, opt) {
		opt = opt || {};
		this._rawSrc = src;
		this._src = YOM.util.appendQueryString(src, opt.param);
		this._opt = opt;
		this._charset = opt.charset;
		this._callback = function() {
			this._callbacked = true;
			opt.callback && opt.callback.apply(this._bind || this, YOM.array.getArray(arguments));
		};
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
		this._bound = {
			onloadHandler: YOM.object.bind(this, this._onloadHandler),
			onerrorHandler: YOM.object.bind(this, this._onerrorHandler),
			ieOnloadHandler: YOM.object.bind(this, this._ieOnloadHandler)
		};
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
		if(this._jsEl.addEventListener) {
			this._jsEl.removeEventListener('load', this._bound.onloadHandler, false);
			this._jsEl.removeEventListener('error', this._bound.onerrorHandler, false);
		} else {
			this._jsEl.detachEvent('onreadystatechange', this._bound.ieOnloadHandler);
		}
		this._jsEl.parentNode.removeChild(this._jsEl);
		this._jsEl = null;
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
			if(YOM.config.debug) {
				throw new YOM.Error(YOM.Error.getCode(JsLoader._ID, 2));
			}
		}
		this._oncomplete.call(this._bind, ret);
	};
	
	JsLoader.prototype.callback = function() {
		this._callbacked = true;
		this._opt.callback && this._opt.callback.apply(this._bind || this, YOM.array.getArray(arguments));
	};
	
	JsLoader.prototype.getId = function() {
		return this._id;
	};
	
	JsLoader.prototype.getGid = function() {
		return this._gid;
	};
	
	JsLoader.prototype._onloadHandler = function() {
		var callbackArgs;
		if(this._status != _STATUS.LOADING) {
			return;
		}
		this._status = _STATUS.LOADED;
		this._complete(JsLoader.RET.SUCC);
		if(this._callbackName) {
			callbackArgs = _callbackHolder[this._callbackName].getCallbackArgs();
			if(callbackArgs == CallbackHolder.NOT_CALLBACKED) {
				this._dealError(YOM.Error.getCode(JsLoader._ID, 1));
				return;
			}
			this.callback.apply(this, YOM.array.getArray(callbackArgs));
		}
		this._onload.call(this._bind);
	};
	
	JsLoader.prototype._onerrorHandler = function() {
		if(this._status != _STATUS.LOADING) {
			return;
		}
		this._status = _STATUS.LOADED;
		this._complete(JsLoader.RET.ERROR);
		this._dealError(YOM.Error.getCode(JsLoader._ID, 0));
	};
	
	JsLoader.prototype._ieOnloadHandler = function() {
		if(this._jsEl && (this._jsEl.readyState == 'loaded' || this._jsEl.readyState == 'complete')) {
			if(this._status != _STATUS.LOADING) {
				return;
			}
			this._status = _STATUS.LOADED;
			this._complete(JsLoader.RET.SUCC);
			if(this._callbackName && !this._callbacked) {
				this._dealError(YOM.Error.getCode(JsLoader._ID, 1));
			}
			this._onload.call(this._bind);
		}
	};
	
	JsLoader.prototype.load = function() {
		if(this._status != _STATUS.INIT) {
			return 1;
		}
		var self = this;
		if(this._callbackName) {
			_callbackHolder[this._callbackName] = _callbackHolder[this._callbackName] || new CallbackHolder(this._callbackName);
		}
		this._jsEl = document.createElement('script');
		if(this._jsEl.attachEvent && !YOM.browser.opera) {
			_interactiveMode = true;
			this._jsEl.attachEvent('onreadystatechange', this._bound.ieOnloadHandler);
		} else {
			this._jsEl.addEventListener('load', this._bound.onloadHandler, false);
			this._jsEl.addEventListener('error', this._bound.onerrorHandler, false);
		}
		if(this._charset) {
			this._jsEl.charset = this._charset;
		}
		this._jsEl.type = 'text/javascript';
		this._jsEl.async = 'async';
		this._jsEl.src = this._src;
		this._jsEl.setAttribute('data-yom-jsloader-id', this.getId());
		this._status = _STATUS.LOADING;
		this._opt.silent || _loading_count++;
		_scriptBeingInserted = this._jsEl;
		this._jsEl = YOM.Element.head.insertBefore(this._jsEl, YOM.Element.head.firstChild);
		_scriptBeingInserted = null;
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
