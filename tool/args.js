/**
 * Command line args getter
 * Copyright (c) 2012 Gary Wang, webyom@gmail.com http://webyom.org
 * Under the MIT license
 * https://github.com/webyom/yom
 */

exports.get = function() {
	var args = {}
	var argv = Array.prototype.slice.call(process.argv)
	var i = 2
	for(; i < argv.length;) {
		if(!argv[i]) {
			break
		}
		if((/^-/).test(argv[i])) {
			if(!argv[i + 1] || (/^-/).test(argv[i + 1])) {
				args[argv[i].replace(/^-+/, '')] = true
				i++
			} else {
				args[argv[i].replace(/^-+/, '')] = argv[i + 1]
				i += 2
			}
		} else {
			i++
		}
	}
	return args
}
