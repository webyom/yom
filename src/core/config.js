/**
 * YOM framework
 * Copyright (c) Gary Wang, webyom@gmail.com http://webyom.org
 * Under the MIT license
 * https://github.com/webyom/yom
 */

/*
ID LIST:
100: base
101: error
102: class
103: array
104: browser
105: cookie
106: css
107: element
108: event
109: js_loader
110: object
111: observer
112: pos
113: js
114: tmpl
115: util
116: xhr
117: string
118: console
119: transition
120: tween
121: localStorage
122: dragdrop
123: HashArray
124: InstanceManager
125: CrossDomainPoster
126: json
127: history
128: widget
129: flash
128001: Mask widget
128002: Dialog widget
128003: Tooltip widget
128004: ModOdl widget
128005: ImgOdl widget
*/

/**
 * @namespace
 */
define('yom/config', [], function() {
	var t = document.domain.split('.'), l = t.length;
	return {
		debugMode: 0,
		domain: t.slice(l - 2, l).join('.')
	};
});
