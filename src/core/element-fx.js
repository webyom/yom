/**
 * YOM.Element FX extention, inspired by KISSY
 */
define(['./object', './array', './element', './tween'], function(object, array, Elem, Tween) {
	var YOM = {
		'object': object,
		'array': array,
		'Element': Elem,
		'Tween': Tween
	}
	
	YOM.object.extend(YOM.Element.prototype, (function() {
		var _DURATION = 300
		var _CONF = {
			fxShow: {style: ['overflow', 'opacity', 'width', 'height'], isShow: 1},
			fxHide: {style: ['overflow', 'opacity', 'width', 'height']},
			fxToggle: {style: []},
			fadeIn: {style: ['opacity'], isShow: 1},
			fadeOut: {style: ['opacity']},
			slideDown: {style: ['overflow', 'height'], isShow: 1},
			slideUp: {style: ['overflow', 'height']}
		}
		
		function _doFx(type, el, duration, complete) {
			var conf, iStyle, oStyle, tStyle, isShow, width, height
			YOM.Tween.stopAllTween(el)
			if(type == 'fxToggle') {
				type = el.getStyle('display') == 'none' ? 'fxShow' : 'fxHide'
			}
			conf = _CONF[type]
			iStyle = {}
			oStyle = {}
			tStyle = {}
			isShow = conf.isShow
			isShow && el.show()
			YOM.object.each(conf.style, function(prop) {
				switch(prop) {
				case 'overflow':
					iStyle.overflow = el.getStyle('overflow')
					oStyle.overflow = 'hidden'
					break
				case 'opacity':
					iStyle.opacity = 1
					if(isShow) {
						oStyle.opacity = 0
						tStyle.opacity = 1
					} else {
						tStyle.opacity = 0
					}
					break
				case 'width':
					width = el.getStyle('width')
					iStyle.width = width
					width = width == 'auto' ? Math.max(el.getAttr('clientWidth'), el.getAttr('offsetWidth')) + 'px' : width
					if(isShow) {
						oStyle.width = '0px'
						tStyle.width = width
					} else {
						oStyle.width = width
						tStyle.width = '0px'
					}
					break
				case 'height':
					height = el.getStyle('height')
					iStyle.height = height
					height = height == 'auto' ? Math.max(el.getAttr('clientHeight'), el.getAttr('offsetHeight')) + 'px' : height
					if(isShow) {
						oStyle.height = '0px'
						tStyle.height = height
					} else {
						oStyle.height = height
						tStyle.height = '0px'
					}
					break
				default:
				}
			})
			el.setStyle(oStyle)
			new YOM.Tween(el, duration, {
				target: {
					style: tStyle
				},
				transition: 'easeOut',
				prior: true,
				complete: function() {
					isShow || el.hide()
					el.setStyle(iStyle)
					complete && complete.call(el, isShow ? 'SHOW' : 'HIDE')
				}
			}).play()
		}
		
		var fx = {
			tween: function() {
				var args = YOM.array.getArray(arguments)
				this.each(function(el) {
					YOM.Tween.apply(this, [el].concat(args)).play()
				})
				return this
			},
			
			tweenWait: function(ms) {
				var self = this
				return {
					tween: function() {
						var args = YOM.array.getArray(arguments)
						setTimeout(function() {
							self.tween.apply(self, args)
						}, ms)
						return {
							tweenWait: function(plusMs) {
								return self.tweenWait(ms + plusMs)
							}
						}
					}
				}
			}
		}
		
		YOM.object.each(['fxShow', 'fxHide', 'fxToggle', 'fadeIn', 'fadeOut', 'slideDown', 'slideUp'], function(type) {
			fx[type] = function(duration, complete) {
				if(!this.size()) {
					return this
				}
				var self = this
				duration = duration || _DURATION
				this.each(function(el) {
					_doFx.call(self, type, new YOM.Element(el), duration, complete)
				})
				return this
			}
		})
		
		return fx
	})(), true)
	
	return {}
})