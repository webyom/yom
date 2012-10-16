/**
 * @namespace YOM.browser
 */
define('yom/browser', [], function() {
	var _ua = navigator.userAgent.toLowerCase();
	
	return {
		_ID: 104,
		v: +(_ua.match(/(?:version|firefox|chrome|safari|opera|msie)[\/: ]([\d]+)/) || [0, 0])[1],
		ie: (/msie/).test(_ua) && !(/opera/).test(_ua),
		opera: (/opera/).test(_ua),
		firefox: (/firefox/).test(_ua),
		chrome: (/chrome/).test(_ua),
		safari: (/safari/).test(_ua) && !(/chrome/).test(_ua) && !(/android/).test(_ua),
		iphone: (/iphone|ipod/).test(_ua),
		ipad: (/ipad/).test(_ua),
		android: (/android/).test(_ua),
		
		isQuirksMode: function() {
			return document.compatMode != 'CSS1Compat';
		}
	};
});
