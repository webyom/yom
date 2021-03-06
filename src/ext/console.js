/**
 * @namespace YOM.console
 */
define(['require', 'exports', 'module', 'global', '../core/core-built', './chunker'], function(require, exports, module, global, YOM, Chunker) {
	var _tmpl = require('./console.tpl.html')
	var _global = global
	var _on = 0
	var _el = {}
	var _chunker = null
	var _data = []
	var _inited = false
	
	function _inputFocus(str) {
		try {
			if(typeof str == 'string') {
				_el.inputBox.value = str
			}
			_el.inputBox.focus()
			_el.inputBox.select()
		} catch(e) {}
	}
	
	function _colExp() {
		YOM(_el.output).toggle(function(type) {
			if(type == 'SHOW') {
				_el.colExpBtn.innerHTML = '-'
				_el.colExpBtn.title = 'Minimize'
				_el.container.style.width = '500px'
				_inputFocus()
			} else {
				_el.colExpBtn.innerHTML = '^'
				_el.colExpBtn.title = 'Maxmize'
				_el.container.style.width = '160px'
			}
		})
	}
	
	function _clear() {
		_el.outputBox.innerHTML = ''
		_inputFocus('')
	}
	
	function _init() {
		if(_inited) {
			return
		}
		_inited = true
		var isIe6 = YOM.browser.ie && YOM.browser.v === 6
		_el.container = document.body.appendChild(YOM.Element.create('div', {
			id: 'yomConsole'
		}, {
			display: _on ? 'block' : 'none',
			position: isIe6 ? 'absolute' : 'fixed',
			width: '160px',
			zIndex: '99999',
			right: 0,
			bottom: isIe6 ? Math.max(0, YOM.Element.getDocSize().height - YOM.Element.getViewRect().bottom) + 'px' : 0
		}))
		_el.container.innerHTML = _tmpl.render({}, {extPkgUrl: require.toUrl('./ext-built.js')})
		_el.output = $id('yomConsoleOutput')
		_el.outputBox = $id('yomConsoleOutputBox')
		_el.inputBox = $id('yomConsoleInputBox')
		_el.colExpBtn = $id('yomConsoleColExpBtn')
		_el.clearBtn = $id('yomConsoleClearBtn')
		YOM.Event.addListener(_el.colExpBtn, 'click', _colExp)
		YOM.Event.addListener(_el.clearBtn, 'click', _clear)
		_chunker = _chunker || new Chunker(_log, {interval2: 1000})
		_chunker.push(_data, true)
		_chunker.process()
		_data = []
	}
	
	function _getEvtDelegator() {
		var delegator = new YOM.Event.Delegator(_el.outputBox)
		_getEvtDelegator = function() {
			return delegator
		}
		return delegator
	}
	
	function _expandObjStr(obj, objLevel) {
		var tmp, indent
		var expanded = parseInt(this.getAttribute('_exp'))
		indent = []
		for(var i = 0; i < objLevel; i++) {
			indent.push('&nbsp;&nbsp;&nbsp;&nbsp;')
		}
		if(YOM.array.isArray(obj)) {
			this.innerHTML = expanded ? 'Array[' + obj.length + ']' : _stringifyObj(obj, objLevel)
		} else {
			if(expanded) {
				try {
					tmp = obj.toString()
				} catch(e) {
					tmp = YOM.object.toString(obj)
				}
				this.innerHTML = tmp
			} else {
				tmp = []
				try {
					YOM.object.each(obj, function(val, key) {
						if(val === YOM.object.PRIVATE_PROPERTY) {
							val = '[Private Property]'
						}
						tmp.push(indent.join('') + '"' + key + '": ' + _stringifyObj(val, objLevel + 1))
					})
				} catch(e) {
					tmp = [indent.join('') + 'Access Denied!']
				}
				indent.pop()
				if(tmp.length) {
					this.innerHTML = '{<br />' + tmp.join(', <br />') + '<br />' + indent.join('') + '}'
				} else {
					this.innerHTML = '{}'
				}
			}
		}
		if(expanded) {
			this.setAttribute('_exp', '0')
		} else {
			this.setAttribute('_exp', '1')
		}
		this.setAttribute('_exp', expanded ? '0' : '1')
	}
	
	function _stringifyObj(obj, objLevel, isArritem) {
		objLevel = objLevel || 1
		var tmp, res
		var rdm = new Date().getTime() + '' + parseInt(Math.random() * 10000)
		if(typeof obj == 'string') {
			res = '"' + YOM.string.encodeHtml(obj) + '"'
		} else if(YOM.array.isArray(obj)) {
			if(isArritem) {
				_getEvtDelegator().delegate('click', 'consoleItem' + rdm, function(e) {
					_expandObjStr.call(this, obj, objLevel)
				}, {maxBubble: 0}).delegate('mouseover', 'consoleItem' + rdm, function(e) {
					this.style.background = '#eee'
				}, {maxBubble: 0}).delegate('mouseout', 'consoleItem' + rdm, function(e) {
					this.style.background = ''
				}, {maxBubble: 0})
				res = '<span _exp="0" data-yom-click="consoleItem' + rdm + '" data-yom-mouseover="consoleItem' + rdm + '" data-yom-mouseout="consoleItem' + rdm + '" style="cursor: pointer;">Array[' + obj.length + ']</span>'
			} else {
				tmp = []
				YOM.object.each(obj, function(item) {
					tmp.push(_stringifyObj(item, objLevel, 1))
				})
				res = '[' + tmp.join(', ') + ']'
			}
		} else if(typeof obj == 'object' && obj) {
			_getEvtDelegator().delegate('click', 'consoleItem' + rdm, function(e) {
				_expandObjStr.call(this, obj, objLevel)
			}, {maxBubble: 0}).delegate('mouseover', 'consoleItem' + rdm, function(e) {
				this.style.background = '#eee'
			}, {maxBubble: 0}).delegate('mouseout', 'consoleItem' + rdm, function(e) {
				this.style.background = ''
			}, {maxBubble: 0})
			try {
				tmp = obj.toString()
			} catch(e) {
				tmp = YOM.object.toString(obj)
			}
			res = '<span _exp="0" data-yom-click="consoleItem' + rdm + '" data-yom-mouseover="consoleItem' + rdm + '" data-yom-mouseout="consoleItem' + rdm + '" style="cursor: pointer;">' + tmp + '</span>'
		} else {
			res = YOM.string.encodeHtml(obj)
		}
		return res.replace(/\n/g, '<br />').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
	}
	
	function _log(str, type, lead) {
		var p = _el.outputBox.appendChild(YOM.Element.create('p', {}, {
			margin: 0,
			borderBottom: 'solid 1px #f3f3f3',
			padding: '2px 0',
			wordWrap: 'break-word'
		}))
		p.innerHTML = '<span style="color: blue;">' + (lead || '&gt;') + '</span>' + '<span style="color: ' + (type === 0 ? 'green' : type === 1 ? 'red' : 'black') + '; margin-left: 2px;">' + str + '</span>'
		_el.output.scrollTop = 999999999
	}
	
	function setGlobal(g) {
		if(g && g.eval) {
			_global = g
		}
	}
	
	function resetGlobal() {
		_global = global
	}
	
	function log(str, type, lead) {
		_init()
		if(typeof str != 'string') {
			str = _stringifyObj(str)
		}
		if(_on && _chunker) {
			_chunker.push([str, type, lead])
		} else {
			_data.push([str, type, lead])
		}
		return this
	}
	
	function eval(str) {
		if(str) {
			this.log('<span style="color: blue;">' + YOM.string.encodeHtml(str) + '</span>', '', '&gt;&gt;')
			try {
				this.log(_stringifyObj(_global.eval(str)))
			} catch(e) {
				this.log(new YOM.Error(e).toString(), 1)
			}
			_inputFocus('')
		}
		return this
	}
	
	function error(str) {
		log(str, 1)
		return this
	}
	
	function success(str) {
		log(str, 0)
		return this
	}
	
	function show() {
		YOM(_el.container).show()
		return this
	}
	
	function hide() {
		YOM(_el.container).hide()
		return this
	}
	
	function turnOn() {
		_on = 1
		_init()
		if(_chunker) {
			_chunker.push(_data, true)
			_data = []
		}
		show()
		return this
	}
	
	function turnOff() {
		_on = 0
		hide()
		return this
	}
	
	return {
		_ID: 118,
		setGlobal: setGlobal,
		resetGlobal: resetGlobal,
		log: log,
		eval: eval,
		error: error,
		success: success,
		show: show,
		hide: hide,
		turnOn: turnOn,
		turnOff: turnOff
	}
})
