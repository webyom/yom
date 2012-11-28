/**
 * Inspired by KISSY
 * @namespace YOM.transition
 */
define(function() {
	var _BACK_CONST = 1.70158
	
	var transition = {
		css: {
			linear: 'linear',
			ease: 'ease',
			easeIn: 'ease-in',
			easeOut: 'ease-out',
			easeInOut: 'ease-in-out'
		},
		
		linear: function(t) {
			return t
		},
		
		/**
		 * Begins slowly and accelerates towards end. (quadratic)
		 */
		easeIn: function(t) {
			return t * t
		},
	
		/**
		 * Begins quickly and decelerates towards end.  (quadratic)
		 */
		easeOut: function(t) {
			return (2 - t) * t
		},
		
		/**
		 * Begins slowly and decelerates towards end. (quadratic)
		 */
		easeInOut: function(t) {
			return (t *= 2) < 1 ?
				0.5 * t * t :
				0.5 * (1 - (--t) * (t - 2))
		},
		
		/**
		 * Begins slowly and accelerates towards end. (quartic)
		 */
		easeInStrong: function(t) {
			return t * t * t * t
		},
		
		/**
		 * Begins quickly and decelerates towards end.  (quartic)
		 */
		easeOutStrong: function(t) {
			return 1 - (--t) * t * t * t
		},
		
		/**
		 * Begins slowly and decelerates towards end. (quartic)
		 */
		easeInOutStrong: function(t) {
			return (t *= 2) < 1 ?
				0.5 * t * t * t * t :
				0.5 * (2 - (t -= 2) * t * t * t)
		},
		
		/**
		 * Snap in elastic effect.
		 */
		elasticIn: function(t) {
			var p = 0.3, s = p / 4
			if(t === 0 || t === 1) {
				return t
			}
			return -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p))
		},
		
		/**
		 * Snap out elastic effect.
		 */
		elasticOut: function(t) {
			var p = 0.3, s = p / 4
			if(t === 0 || t === 1) {
				return t
			}
			return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1
		},
		
		/**
		 * Snap both elastic effect.
		 */
		elasticInOut: function(t) {
			var p = 0.45, s = p / 4
			if(t === 0 || (t *= 2) === 2) {
				return t / 2
			}
			if(t < 1) {
				return -0.5 * (Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p))
			}
			return Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p) * 0.5 + 1
		},
	
		/**
		 * Backtracks slightly, then reverses direction and moves to end.
		 */
		backIn: function(t) {
			if(t === 1) {
				t -= 0.001
			}
			return t * t * ((_BACK_CONST + 1) * t - _BACK_CONST)
		},
		
		/**
		 * Overshoots end, then reverses and comes back to end.
		 */
		backOut: function(t) {
			return (t -= 1) * t * ((_BACK_CONST + 1) * t + _BACK_CONST) + 1
		},
		
		/**
		 * Backtracks slightly, then reverses direction, overshoots end,
		 * then reverses and comes back to end.
		 */
		backInOut: function(t) {
			if((t *= 2 ) < 1) {
				return 0.5 * (t * t * (((_BACK_CONST *= (1.525)) + 1) * t - _BACK_CONST))
			}
			return 0.5 * ((t -= 2) * t * (((_BACK_CONST *= (1.525)) + 1) * t + _BACK_CONST) + 2)
		},
		
		/**
		 * Bounce off of start.
		 */
		bounceIn: function(t) {
			return 1 - transition.bounceOut(1 - t)
		},
		
		/**
		 * Bounces off end.
		 */
		bounceOut: function(t) {
			var s = 7.5625, r
			if(t < (1 / 2.75)) {
				r = s * t * t
			} else if(t < (2 / 2.75)) {
				r =  s * (t -= (1.5 / 2.75)) * t + 0.75
			} else if(t < (2.5 / 2.75)) {
				r =  s * (t -= (2.25 / 2.75)) * t + 0.9375
			} else {
				r =  s * (t -= (2.625 / 2.75)) * t + 0.984375
			}
			return r
		},
		
		/**
		 * Bounces off start and end.
		 */
		bounceInOut: function(t) {
			if(t < 0.5) {
				return transition.bounceIn(t * 2) * 0.5
			}
			return transition.bounceOut(t * 2 - 1) * 0.5 + 0.5
		}
	}
	
	return transition
})
