/**
 * @namespace YOM.tmpl
 */
define('./tmpl', ['./browser', './string', './object'], function(browser, string, object) {
	var YOM = {
		'browser': browser,
		'string': string,
		'object': object
	};
	
	var _cache = {};
	var _useArrayJoin = YOM.browser.ie;
	
	function _getMixinTmplStr(rawStr, mixinTmpl) {
		if(mixinTmpl) {
			YOM.object.each(mixinTmpl, function(val, key) {
				var r = new RegExp('<%#' + key + '%>', 'g');
				rawStr = rawStr.replace(r, val);
			});
		}
		return rawStr;
	};
	
	function render(str, data, opt) {
		var strict, key, fn;
		str += '';
		data = data || {};
		opt = opt || {};
		strict = opt.strict;
		key = opt.key;
		if(key) {
			fn = _cache[key];
			if(fn) {
				return fn(data);
			}
		}
		if(opt.mixinTmpl) {
			str = _getMixinTmplStr(str, opt.mixinTmpl);
		}
		fn = _useArrayJoin ? 
		new Function("$data", "var YOM=this,_$out_=[],$print=function(str){_$out_.push(str);};" + (strict ? "" : "with($data){") + "_$out_.push('" + str
			.replace(/[\r\t\n]/g, " ")
			.split("<%").join("\t")
			.replace(/(?:^|%>).*?(?:\t|$)/g, function($0) {
				return $0.replace(/('|\\)/g, '\\$1');
			})
			.replace(/\t==(.*?)%>/g, "',YOM.string.encodeHtml($1),'")
			.replace(/\t=(.*?)%>/g, "',$1,'")
			.split("\t").join("');")
			.split("%>").join("_$out_.push('")
		+ "');" + (strict ? "" : "}") + "return _$out_.join('');") : 
		new Function("$data", "var YOM=this,_$out_='',$print=function(str){_$out_+=str;};" + (strict ? "" : "with($data){") + "_$out_+='" + str
			.replace(/[\r\t\n]/g, " ")
			.split("<%").join("\t")
			.replace(/(?:^|%>).*?(?:\t|$)/g, function($0) {
				return $0.replace(/('|\\)/g, '\\$1');
			})
			.replace(/\t==(.*?)%>/g, "'+YOM.string.encodeHtml($1)+'")
			.replace(/\t=(.*?)%>/g, "'+($1)+'")
			.split("\t").join("';")
			.split("%>").join("_$out_+='")
		+ "';" + (strict ? "" : "}") + "return _$out_;");
		if(key) {
			_cache[key] = fn;
		}
		return fn.call(YOM, data);
	};
	
	function renderId(id, data, opt) {
		data = data || {};
		opt = opt || {};
		var key = opt.key = opt.key || id;
		var fn = _cache[key];
		if(fn) {
			return fn(data);
		}
		return render($id(id).innerHTML, data, opt);
	};
	
	return {
		_ID: 114,
		render: render,
		renderId: renderId
	};
});
