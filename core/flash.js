/**
 * @namespace YOM.flash
 */
define(['./browser', './object'], function(browser, object) {
	var YOM = {
		'browser': browser,
		'object': object
	};
	
	var _ID = 129;
	
	var _flashVersion = null;
	
	/**
	 * @returns {Array}
	 */
	function getVersion() {
		var plugin, i;
		if(_flashVersion) {
			return _flashVersion.concat();
		}
		_flashVersion = ['0', '0', '0', '0'];
		if(navigator.plugins && navigator.mimeTypes.length) {
			plugin = navigator.plugins['Shockwave Flash'];
			if(plugin) {
				_flashVersion = plugin.description.match(/\d+/g);
			}
		} else {
			try {
				for(i = 6, plugin = new Object(); plugin; i++) {
					plugin = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.' + i);
				}
			} catch(e) {
				if(i !== 6) {
					_flashVersion[0] = (i - 1) + '';
				}
			}
			try {
				_flashVersion = plugin.GetVariable('$version').match(/\d+/g);
			} catch(e) {}
		}
		return _flashVersion.concat();
	};
	
	/**
	 * @returns {String}
	 */
	function getHtml(src, data) {
		var attrs = [];
		var params = [];
		if(YOM.browser.ie) {
			params.push('<param name="movie" value="', src, '" />');
			attrs.push(' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"');
		} else {
			attrs.push(' data="', src, '"');
			attrs.push(' type="application/x-shockwave-flash"');
		}
		for(var p in data) {
			if(!YOM.object.hasOwnProperty(data, p)) {
				continue;
			}
			switch(p) {
			case 'id':
			case 'name':
			case 'width':
			case 'height':
			case 'style':
				attrs.push(' ', p, '="', data[p], '"');
				break;
			default :
				params.push('<param name="', p, '" value="', data[p], '" />');
			}
		}
		return '<object' + attrs.join('') + '>' + params.join('') + '</object>';
	};
	
	/**
	 * @param {Obj} flashObj
	 * @param {String} methodName
	 * @param {Array} args
	 */
	function invoke(flashObj, methodName, args) {
		if(flashObj && !flashObj[methodName]) {
			eval('flashObj["' + methodName + '"] = function(){return eval(this.CallFunction("<invoke name=\\"' + methodName + '\\" returntype=\\"javascript\\">" + __flash__argumentsToXML(arguments,0) + "</invoke>"));}');
		}
		return flashObj[methodName].apply(flashObj, args || []);
	};
	
	return {
		getVersion: getVersion,
		getHtml: getHtml,
		invoke: invoke
	};
});
