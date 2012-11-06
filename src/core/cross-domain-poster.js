/**
 * @class YOM.CrossDomainPoster
 */
define('yom/cross-domain-poster', ['require', 'yom/config', 'yom/error', 'yom/class', 'yom/instance-manager', 'yom/json', 'yom/observer', 'yom/event', 'yom/element'], function(require, config, Err, Class, InstanceManager, json, Observer, Evt, Elem) {
	var YOM = {
		'config': config,
		'Error': Err,
		'Class': Class,
		'InstanceManager': InstanceManager,
		'json': json,
		'Observer': Observer,
		'Event': Evt,
		'Element': Elem
	};
	
	var _ID = 125;
	var _STATUS = {
		INIT: 0,
		LOADING: 1,
		LOADED: 2,
		ABORTED: 3
	};
	var _PROXY = require.toUrl('./cdp-proxy.html', true);
	var _CROSS_SITE_PROXY = require.toUrl('./cdp-cs-proxy.html', true);
	
	var _sameSiteTester = new RegExp(':\\/\\/(?:[^\\.]+\\.)*' + YOM.config.domain + '\\/');
	var _im = new YOM.InstanceManager();
	var _loading_count = 0;
	
	var CrossDomainPoster = function(url, opt) {
		opt = opt || {};
		this._opt = opt;
		this._url = url;
		this._charset = (opt.charset || 'utf-8').toLowerCase();
		this._data = opt.data || {};
		this._onload = opt.load || $empty;
		this._onerror = opt.error || $empty;
		this._oncomplete = opt.complete || $empty;
		this._onabort = opt.abort || $empty;
		this._bind = opt.bind;
		this._crossSite = !_sameSiteTester.test(url);//cross top level domain
		this._proxy = opt.proxy || _PROXY;
		this._crossSiteProxy = opt.crossSiteProxy || _CROSS_SITE_PROXY;
		this._proxyParamName = opt.proxyParamName || '_response_url_';
		this._frameEl = null;
		this._frameOnLoadListener = null;
		this._status = _STATUS.INIT;
		this._id = _im.add(this);
	};
	
	YOM.Class.extend(CrossDomainPoster, YOM.Event);
	YOM.Class.genericize(CrossDomainPoster, ['addObservers', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'createEvent'], {bind: CrossDomainPoster});
	CrossDomainPoster.addObservers({
		start: new YOM.Observer(),
		complete: new YOM.Observer(),
		allcomplete: new YOM.Observer()
	});
	
	CrossDomainPoster._im = _im;
	
	CrossDomainPoster.RET = {
		SUCC: 0,
		ABORTED: -1,
		ERROR: 1	
	};
	
	CrossDomainPoster.isUrlLoading = function(url, fullMatch) {
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
	
	CrossDomainPoster.isAnyLoading = function() {
		return _loading_count > 0;
	};
	
	CrossDomainPoster.getInstance = function(id) {
		return _im.get(id);
	};
	
	CrossDomainPoster.prototype._complete = function(ret) {
		var self = this;
		_loading_count > 0 && _loading_count--;
		setTimeout(function() {
			self._clear();
		}, 0);
		try {
			_loading_count === 0 && CrossDomainPoster.dispatchEvent(CrossDomainPoster.createEvent('allcomplete', {url: this._url, opt: this._opt}));
		CrossDomainPoster.dispatchEvent(CrossDomainPoster.createEvent('complete', {url: this._url, opt: this._opt, ret: ret}));
		} catch(e) {
			if(YOM.config.debug) {
				throw new YOM.Error(YOM.Error.getCode(_ID, 1));
			}
		}
		this._oncomplete.call(this._bind, ret);
	};
	
	CrossDomainPoster.prototype._frameOnLoad = function() {
		if(this._crossSite) {
			if(this._status != _STATUS.LOADING) {
				return;
			}
			this._status = _STATUS.LOADED;
			var data;
			var parseError = false;
			try {
				data = YOM.json.parse(this._frameEl.contentWindow.name);
			} catch(e) {
				parseError = true;
			}
			if(parseError) {
				this._complete(CrossDomainPoster.RET.ERROR);
				this._onerror.call(this._bind);
				if(YOM.config.debug) {
					throw new YOM.Error(YOM.Error.getCode(_ID, 1));
				}
			} else {
				this._complete(CrossDomainPoster.RET.SUCC);
				this._onload.call(this._bind, data);
			}
		} else {
			if(this._frameEl) {
				this._complete(CrossDomainPoster.RET.ERROR);
				this._onerror.call(this._bind);
			}
		}
	};
	
	CrossDomainPoster.prototype._clear = function() {
		if(!this._frameEl) {
			return;
		}
		YOM.Event.removeListener(this._frameEl, 'load', this._frameOnLoadListener);
		document.body.removeChild(this._frameEl);
		this._frameEl = null;
		_im.remove(this.getId());
	};
		
	CrossDomainPoster.prototype.getId = function() {
		return this._id;
	};
		
	CrossDomainPoster.prototype.post = function() {
		if(this._status != _STATUS.INIT) {
			return 1;
		}
		this._frameEl = YOM.Element.create('iframe', {src: this._proxy}, {display: 'none'});
		this._frameEl.instanceId = this.getId();
		this._frameEl.callback = $bind(this, function(o) {
			if(this._status != _STATUS.LOADING) {
				return;
			}
			this._status = _STATUS.LOADED;
			this._complete(CrossDomainPoster.RET.SUCC);
			this._onload.call(this._bind, o);
		});
		this._frameOnLoadListener = $bind(this, this._frameOnLoad);
		YOM.Event.addListener(this._frameEl, 'load', this._frameOnLoadListener);
		this._frameEl = document.body.appendChild(this._frameEl);
		this._status = _STATUS.LOADING;
		_loading_count++;
		CrossDomainPoster.dispatchEvent(CrossDomainPoster.createEvent('start', {url: this._url, opt: this._opt}));
		return 0;
	};
	
	CrossDomainPoster.prototype.abort = function() {
		if(this._status != _STATUS.LOADING) {
			return 1;
		}
		this._status = _STATUS.ABORTED;
		this._complete(CrossDomainPoster.RET.ABORTED);
		this._onabort.call(this._bind);
		return 0;
	};
	
	return CrossDomainPoster;
});
