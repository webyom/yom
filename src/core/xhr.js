/**
 * @namespace YOM.Xhr
 */
define('yom/xhr', ['require'], function(require) {
	var YOM = {
		'config': require('yom/config'),
		'Error': require('yom/error'),
		'Class': require('yom/class'),
		'object': require('yom/object'),
		'InstanceManager': require('yom/instance-manager'),
		'Observer': require('yom/observer'),
		'Event': require('yom/event')
	};
	
	var _ID = 116;
	var _STATUS = {
		INIT: 0,
		LOADING: 1,
		LOADED: 2,
		ABORTED: 3
	};
	
	var _loading_count = 0;
	var _im = new YOM.InstanceManager();
	
 	function Xhr(url, opt) {
		opt = opt || {};
		this._opt = opt;
		this._method = (opt.method == 'GET' ? 'GET' : 'POST');
		this._param = typeof opt.param == 'object' ? YOM.object.toQueryString(opt.param) : opt.param;
		this._formData = opt.formData;
		this._charset = opt.charset;
		this._url = url + (opt.method == 'GET' && this._param ? '?' + this._param : '');
		this._status = _STATUS.INIT;
		this._onload = opt.load || $empty;
		this._onabort = opt.abort || $empty;
		this._onerror = opt.error || $empty;
		this._oncomplete = opt.complete || $empty;
		this._bind = opt.bind;
		this._xhr = null;
		this._gid = opt.gid;//group id
		this._id = _im.add(this);
	};
	
	YOM.Class.extend(Xhr, YOM.Event);
	YOM.Class.genericize(Xhr, ['addObservers', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'createEvent'], {bind: Xhr});
	Xhr.addObservers({
		start: new YOM.Observer(),
		complete: new YOM.Observer(),
		allcomplete: new YOM.Observer()
	});
	
	Xhr._im = _im;
	
	Xhr.RET = {
		SUCC: 0,
		ABORTED: -1,
		ERROR: 1	
	};
	
	Xhr.abortAll = function(gid) {
		var noGid = typeof gid == 'undefined';
		_im.each(function(inst) {
			if(noGid || inst.getGid() == gid) {
				inst.abort();
			}
		});
	};
	
	Xhr.isUrlLoading = function(url, fullMatch) {
		var res = false;
		if(!url) {
			return res;
		}
		_im.each(function(inst) {
			if(fullMatch && url == inst._url || inst._url.indexOf(url) === 0) {
				res = true;
				return false;
			}
			return true;
		});
		return res;
	};
	
	Xhr.isAnyLoading = function() {
		return _loading_count > 0;
	};
	
	_onReadyStateChange = function() {
		if(this._xhr.readyState !== 4 || this._status == _STATUS.ABORTED) {
			return;
		}
		this._status = _STATUS.LOADED;
		if(this._xhr.status >= 200 && this._xhr.status < 300) {
			this._complete(Xhr.RET.SUCC);
			this._onload.call(this._bind, this._xhr.responseText, this._xhr.responseXML);
		} else {
			this._complete(Xhr.RET.ERROR);
			this._onerror.call(this._bind, new YOM.Error(YOM.Error.getCode(_ID, 1), 'Xhr request failed.'));
		}
	};
	
	Xhr.prototype._complete = function(ret) {
		this._opt.silent || _loading_count > 0 && _loading_count--;
		_im.remove(this.getId());
		try {
			_loading_count === 0 && Xhr.dispatchEvent(Xhr.createEvent('allcomplete', {url: this._url, method: this._method, opt: this._opt, ret: ret}));
			Xhr.dispatchEvent(Xhr.createEvent('complete', {url: this._url, method: this._method, opt: this._opt, ret: ret}));
		} catch(e) {
			if(YOM.config.debug) {
				throw new YOM.Error(YOM.Error.getCode(_ID, 2));
			}
		}
		this._oncomplete.call(this._bind, ret);
	};
	
	Xhr.prototype.getId = function() {
		return this._id;
	};
	
	Xhr.prototype.getGid = function() {
		return this._gid;
	};
	
	Xhr.prototype.send = function() {
		if(this._status != _STATUS.INIT) {
			return 1;
		}
		try {
			this._xhr = new XMLHttpRequest();
		} catch(e) {
			this._xhr = new ActiveXObject('MSXML2.XMLHTTP');
		}
		this._xhr.open(this._method, this._url, this._opt.isAsync === false ? false : true);
		if(this._method == 'GET') {
			if(this._opt.noCache) {
				this._xhr.setRequestHeader('If-Modified-Since', 'Sun, 27 Mar 1983 00:00:00 GMT');
				this._xhr.setRequestHeader('Cache-Control', 'no-cache');
			}
		} else if(!this._formData) {
			this._xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded' + (this._charset ? '; charset=' + this._charset : ''));
		}
		if(this._opt.withCredentials) {
			this._xhr.withCredentials = true;
		}
		this._xhr.onreadystatechange = $bind(this, _onReadyStateChange);
		this._status = _STATUS.LOADING;
		this._opt.silent || _loading_count++;
		this._xhr.send(this._method == 'POST' ? (this._formData || this._param) : null);
		Xhr.dispatchEvent(Xhr.createEvent('start', {url: this._url, method: this._method, opt: this._opt}));
		return 0;
	};
	
	Xhr.prototype.abort = function () {
		if(this._status != _STATUS.LOADING) {
			return 1;
		}
		this._xhr.abort();
		this._status = _STATUS.ABORTED;
		this._complete(Xhr.RET.ABORTED);
		this._onabort.call(this._bind);
		return 0;
	};
	
	Xhr.prototype.getXhrObj = function () {
		return this._xhr;
	};
	
	return Xhr;
});
