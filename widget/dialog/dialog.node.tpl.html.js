function $encodeHtml(str) {
    return (str + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/`/g, "&#96;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}

exports.render = function($data, $opt) {
    $data = $data || {};
    var _$out_ = [];
    var $print = function(str) {
        _$out_.push(str);
    };
    with ($data) {
        _$out_.push("");
        if (noBorder && src) {
            _$out_.push('\n	<iframe data-type="yom-dialog-frame" style="width: 100%; height: 100%;" frameborder="0" scrolling="no" allowtransparency="yes" src="', frameSrc, '"></iframe>\n');
        } else {
            _$out_.push('\n	<div data-type="yom-dialog-inner" class="yom-dialog-inner" style="width: 100%; height: 100%; padding: 0; margin: 0; border: none; overflow: hidden;">\n		');
            if (title) {
                _$out_.push('\n			<div data-type="yom-dialog-title" class="yom-dialog-title" style="overflow: hidden; ', fixed ? "cursor: default;" : "", '">\n				<h3>', title, '</h3>\n				<button data-type="yom-dialog-title-close-btn" class="yom-dialog-title-close-btn" title="Close">x</button>\n			</div>\n		');
            }
            _$out_.push("\n		");
            if (src) {
                _$out_.push('\n			<iframe data-type="yom-dialog-frame" style="width: 100%; display: block;" frameborder="0" scrolling="no" allowtransparency="yes" src="', frameSrc, '"></iframe>\n		');
            } else {
                _$out_.push('\n			<div data-type="yom-dialog-content" class="yom-dialog-content" style="padding: ', contentPadding || 0, 'px; margin: 0; border: none; overflow: hidden;">\n				', content, "\n			</div>\n		");
            }
            _$out_.push("\n		");
            if (btns || tips) {
                _$out_.push('\n			<div data-type="yom-dialog-footer" class="yom-dialog-footer" style="overflow: hidden;">\n				');
                if (tips) {
                    _$out_.push('\n					<div data-type="yom-dialog-tips" class="yom-dialog-tips">\n						', tips, "\n					</div>\n				");
                }
                _$out_.push("\n				");
                if (btns) {
                    _$out_.push('\n					<div data-type="yom-dialog-btns" class="yom-dialog-btns">\n						');
                    for (var i = 0, l = btns.length; i < l; i++) {
                        var btn = btns[i];
                        _$out_.push('\n							<button class="', btn.className, '" title="', btn.title || btn.text, '">', btn.text, "</button>\n						");
                    }
                    _$out_.push("\n					</div>\n				");
                }
                _$out_.push("\n			</div>\n		");
            }
            _$out_.push("\n	</div>\n");
        }
        _$out_.push("\n");
    }
    return _$out_.join("");
};