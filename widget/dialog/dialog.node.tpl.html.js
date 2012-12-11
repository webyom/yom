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
            _$out_.push('<iframe data-type="yom-dialog-frame" style="width: 100%; height: 100%;" frameborder="0" scrolling="no" allowtransparency="yes" src="', frameSrc, '"></iframe>');
        } else {
            _$out_.push('<div data-type="yom-dialog-inner" class="yom-dialog-inner" style="width: 100%; height: 100%; padding: 0; margin: 0; border: none; overflow: hidden;">');
            if (title) {
                _$out_.push('<div data-type="yom-dialog-title" class="yom-dialog-title" style="overflow: hidden; ', fixed ? "cursor: default;" : "", '"><h3>', title, '</h3><button data-type="yom-dialog-title-close-btn" class="yom-dialog-title-close-btn" title="Close">x</button></div>');
            }
            _$out_.push("");
            if (src) {
                _$out_.push('<iframe data-type="yom-dialog-frame" style="width: 100%; display: block;" frameborder="0" scrolling="no" allowtransparency="yes" src="', frameSrc, '"></iframe>');
            } else {
                _$out_.push('<div data-type="yom-dialog-content" class="yom-dialog-content" style="padding: ', contentPadding || 0, 'px; margin: 0; border: none; overflow: hidden;">', content, "</div>");
            }
            _$out_.push("");
            if (btns || tips) {
                _$out_.push('<div data-type="yom-dialog-footer" class="yom-dialog-footer" style="overflow: hidden;">');
                if (tips) {
                    _$out_.push('<div data-type="yom-dialog-tips" class="yom-dialog-tips">', tips, "</div>");
                }
                _$out_.push("");
                if (btns) {
                    _$out_.push('<div data-type="yom-dialog-btns" class="yom-dialog-btns">');
                    for (var i = 0, l = btns.length; i < l; i++) {
                        var btn = btns[i];
                        _$out_.push('<button class="', btn.className, '" title="', btn.title || btn.text, '">', btn.text, "</button>");
                    }
                    _$out_.push("</div>");
                }
                _$out_.push("</div>");
            }
            _$out_.push("</div>");
        }
        _$out_.push("");
    }
    return _$out_.join("");
};