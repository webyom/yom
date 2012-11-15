define(function() {
	function $encodeHtml(str) {
		return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/`/g, '&#96;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
	};
	return function($data, $opt) {
		$data = $data || {};
		var _$out_= [];
		var $print = function(str) {_$out_.push(str);};
		with($data) {
		_$out_.push('<div data-type="yom-tooltip-inner" class="yom-tooltip-inner"><div data-type="yom-tooltip-content" class="yom-tooltip-content">', content, '</div><div data-type="yom-tooltip-arrow-outer" class="yom-tooltip-arrow-outer"></div><div data-type="yom-tooltip-arrow-inner" class="yom-tooltip-arrow-inner"></div>');
		if(!noCloseBtn) {
		_$out_.push('<span data-type="yom-tooltip-close-btn" class="yom-tooltip-close-btn">\\u00d7</span>');
		}
		_$out_.push('</div>');
		}
		return _$out_.join('');
	};
});