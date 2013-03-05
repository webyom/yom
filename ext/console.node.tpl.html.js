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
        _$out_.push('<div style="background: #555; padding: 2px; padding-top: 0; font-size: 12px; font-family: Courier New, Courier, monospace;">\n	<h2 style="margin: 0; font-size: 14px; line-height: 22px; color: #fff; padding: 2px; padding-top: 0;">\n		<span style="float: left;">Console</span>\n		<span title="Maxmize" id="yomConsoleColExpBtn" style="float: right; cursor: pointer; padding: 0 3px;">^</span>\n		<span title="Clear" id="yomConsoleClearBtn" style="float: right; cursor: pointer; padding: 0 3px; margin-right: 10px;">[C]</span>\n	</h2>\n	<div id="yomConsoleOutput" style="clear: both; height: 300px; overflow-y: scroll; background: #fff; padding: 0; display: none; text-align: left;">\n		<div id="yomConsoleOutputBox" style="line-height: 15px;"></div>\n		<div>\n			<label for="yomConsoleInputBox" style="font-weight: bold; color: blue;">&gt;&gt;</label>\n			<input id="yomConsoleInputBox" type="text" style="width: 458px; border: none; font-family: Courier New, Courier, monospace;" onkeyup="if(event.keyCode === 13) {require(\'', $opt.extPkgUrl, "').console.eval(this.value); return false;}\" ondblclick=\"require('", $opt.extPkgUrl, '\').console.eval(this.value); return false;" />\n		</div>\n	</div>\n	<div style="height: 0; line-height: 0; clear: both;">&nbsp;</div>\n</div>');
    }
    return _$out_.join("");
};