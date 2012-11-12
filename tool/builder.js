/**
 * YOM module builder
 * Copyright (c) 2012 Gary Wang, webyom@gmail.com http://webyom.org
 * Under the MIT license
 * https://github.com/webyom/yom
 */

var os = require('os');
var fs = require('fs');
var path = require('path');

process.on('uncaughtException', function(err) {
	try {
		dealErr(err);
	} catch(e) {
		console.error(e.toString());
		process.exit(1);
	}
});

var startTime = new Date();
var charset = 'utf-8';
var buildFileName = process.argv[2] || 'build.json';
var buildDir = path.dirname(path.resolve(process.cwd(), buildFileName));
var logs = [];

function exit(code) {
	fs.writeFileSync(path.resolve(buildDir, 'build.log'), logs.join(os.EOL), charset);
	process.exit(code);
};

function log(content, err) {
	if(err) {
		console.error(content);
	} else {
		console.log(content);
	}
	logs.push(content);
};

function dealErr(err) {
	log(err.toString(), 1);
	printLine();
	log('Terminated! Spent Time: ' + (new Date() - startTime) + 'ms');
	printLine('+');
	exit(1);
};

function printLine(c) {
	log(('-----------------------------------------------------------------------').replace(/\-/g, c || '-'));
};

function mkdirs(dirpath, mode, callback) {
	fs.exists(dirpath, function(exists) {
		if(exists) {
			callback(dirpath);
		} else {
			mkdirs(path.dirname(dirpath), mode, function() {
				fs.mkdir(dirpath, mode, callback);
			});
		}
	});
};

function isLegalOutputDir(outputDir) {
	if(/\/_?src(\/|$)/.test(outputDir)) {//TODO
		return false;
	}
	return true;
};

function getDeps(def, relative, exclude, globalExclude) {
	var deps = [];
	var got = {};
	var depArr = def.match(/\bdefine\s*\([^\[\{]*(\[[^\[\]]*\])/m);
	depArr = depArr && depArr[1];
	exclude = exclude || {};
	globalExclude = globalExclude || {};
	relative && depArr && depArr.replace(new RegExp('["\'](' + (relative ? '\\.' : '') + '[^"\'\\s]+)["\']', 'mg'), function(m, dep) {
		got[dep] || exclude[dep] || globalExclude[dep] || /\.js$/.test(dep) || deps.push(dep);
		got[dep] = 1;
	});
	def.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/mg, '')//remove comments
		.replace(new RegExp('\\brequire\\s*\\(\\s*["\'](' + (relative ? '\\.' : '') + '[^"\'\\s]+)["\']\\s*\\)', 'mg'), function(m, dep) {//extract dependencies
			got[dep] || exclude[dep] || globalExclude[dep] || /\.js$/.test(dep) || deps.push(dep);
			got[dep] = 1;
		});
	return deps;
};

function getTmplFnName(str) {
	var fnName = (str + '').replace(/(?:[-_\.]+|(?:\.*\/)+)(\w)([^-_\.\/]*)/g, function($1, $2, $3) {return $2.toUpperCase() + $3;});
	fnName = fnName.charAt(0).toLowerCase() + fnName.slice(1);
	return fnName;
};

function compileTmpl(tmpl, depId, notAmdModule) {
	var fnName = notAmdModule && getTmplFnName(depId);
	var strict = /\$data\b/.test(tmpl);
	var res = [];
	if(notAmdModule) {
		res.push([
			"var " + fnName + " = (function() {"
		].join(os.EOL));
	} else {
		res.push([
			depId ? 
			"define('" + depId + "', [], function() {" :
			"define(function() {"
		].join(os.EOL));
	}
	res.push([
		"	function $encodeHtml(str) {",
		"		return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\x60/g, '&#96;').replace(/\x27/g, '&#39;').replace(/\x22/g, '&quot;');",
		"	};",
		"	return function($data, $opt) {",
		"		$data = $data || {};",
		"		var _$out_= [];",
		"		var $print = function(str) {_$out_.push(str);};",
		"		" + (strict ? "" : "with($data) {"),
		"		_$out_.push('" + tmpl
				.replace(/[\r\t\n]/g, "")
				.replace(/(?:^|%>).*?(?:<%|$)/g, function($0) {
					return $0.replace(/('|\\)/g, '\\$1');
				})
				.replace(/<%==(.*?)%>/g, "', $encodeHtml($1), '")
				.replace(/<%=(.*?)%>/g, "', $1, '")
				.split("<%").join("');" + os.EOL + "		")
				.split("%>").join(os.EOL + "		_$out_.push('") + "');",
		"		" + (strict ? "" : "}"),
		"		return _$out_.join('');",
		"	};"
	].join(os.EOL));
	if(notAmdModule) {
		res.push([
			"})();"
		].join(os.EOL));
	} else {
		res.push([
			"});"
		].join(os.EOL));
	}
	return res.join(os.EOL);
};

function fixDefineParams(def, depId) {
	var bodyDeps = getDeps(def);
	def = def.replace(/\b(define\s*\()\s*(["'][^"'\s]+["']\s*,\s*)?\s*(\[[^\[\]]*\])?/m, function(m, d, id, deps) {
		if(bodyDeps.length) {
			bodyDeps = "'" + bodyDeps.join("', '") + "'";
			if(deps) {
				deps = deps.replace(/]$/, ', ' + bodyDeps + ']');
			} else {
				deps = "['require', 'exports', 'module', " + bodyDeps + "], ";
			}
		}
		return [d, id || depId && ("'" + depId + "', "), deps || '[], '].join('');
	});
	return def;
};

function buildOne(info, exclude, no, callback) {
	log('Build ' + no);
	if(!info.output) {
		throw new Error('Output not defined!');
	}
	var input = path.resolve(buildDir, info.input);
	var inputDir = path.dirname(input);
	var output = path.resolve(buildDir, info.output);
	var outputDir = path.dirname(output);
	var depId;
	log('Input: ' + input);
	log('Output: ' + output);
	if(!isLegalOutputDir(outputDir)) {
		throw new Error('Output to src dir denied!');
	}
	fs.readFile(input, charset, function(err, content) {
		if(err) {
			throw err;
		}
		var deps, fileName, fileContent = [];
		if(/.html$/.test(input)) {
			fileContent.push(compileTmpl(content));
		} else {
			deps = getDeps(content, true, info.exclude, exclude);
			while(deps.length) {
				depId = deps.shift();
				if(/.html$/.test(depId)) {
					fileName = path.resolve(inputDir, depId);
					log('Merging: ' + fileName);
					fileContent.push(compileTmpl(fs.readFileSync(fileName, charset), depId));
				} else {
					fileName = path.resolve(inputDir, depId + '.js');
					log('Merging: ' + fileName);
					fileContent.push(fixDefineParams(fs.readFileSync(fileName, charset), depId));
				}
			}
			fileContent.push(fixDefineParams(content));
		}
		log('Merging: ' + input);
		log('Writing: ' + output);
		mkdirs(outputDir, 0777, function() {
			fs.writeFileSync(output, fileContent.join(os.EOL + os.EOL), charset);
			log('Done!');
			callback();
		});
	});
};

function combineOne(info, no, callback) {
	log('Combine ' + no);
	if(!info.output) {
		throw new Error('Output not defined!');
	}
	var output = path.resolve(buildDir, info.output);
	var outputDir = path.dirname(output);
	var depId, fileName, fileContent = [];
	log('Output: ' + output);
	if(!isLegalOutputDir(outputDir)) {
		throw new Error('Output to src dir denied!');
	}
	while(info.inputs.length) {
		depId = info.inputs.shift();
		fileName = path.resolve(buildDir, depId);
		log('Merging: ' + fileName);
		if(/.html$/.test(depId)) {
			fileContent.push(compileTmpl(fs.readFileSync(fileName, charset), depId, true));
		} else {
			fileContent.push(fs.readFileSync(fileName, charset));
		}
	}
	log('Writing: ' + output);
	mkdirs(outputDir, 0777, function() {
		fs.writeFileSync(output, fileContent.join(os.EOL + os.EOL), charset);
		log('Done!');
		callback();
	});
};

printLine('+');
log('Start! Time: ' + startTime);
fs.readFile(buildFileName, charset, function(err, data) {
	if(err) {
		throw err;
	}
	var buildJson, buildList, buildTotal, combineList, combineTotal;
	try {
		buildJson = JSON.parse(data);
	} catch(e) {
		printLine();
		throw new Error('Illegal json format build file!' + os.EOL + e.toString());
	}
	buildList = buildJson.builds || [];
	buildTotal = buildList.length;
	combineList = buildJson.combines || [];
	combineTotal = combineList.length;
	build();
	function build() {
		if(buildList.length) {
			printLine();
			buildOne(buildList.shift(), buildJson.exclude, buildTotal - buildList.length, function() {
				build();
			});
		} else {
			combine();
		}
	};
	function combine() {
		if(combineList.length) {
			printLine();
			combineOne(combineList.shift(), combineTotal - combineList.length, function() {
				combine();
			});
		} else {
			printLine();
			log('Finished! Spent Time: ' + (new Date() - startTime) + 'ms');
			printLine('+');
			exit();
		}
	};
});
