/**
 * YOM module builder
 * Copyright (c) 2012 Gary Wang, webyom@gmail.com http://webyom.org
 * Under the MIT license
 * https://github.com/webyom/yom
 */

var os = require('os')
var fs = require('fs')
var path = require('path')
var uglify = require('./uglify-js')

process.on('uncaughtException', function(err) {
	try {
		dealErr(err)
	} catch(e) {
		console.error(e.toString())
		process.exit(1)
	}
})

var startTime = new Date()
var charset = 'utf-8'
var buildFileName = process.argv[2] || 'build.json'
var buildDir = path.dirname(path.resolve(process.cwd(), buildFileName))
var logs = []
var globalUglifyLevel = 0
var globalExclude = {}
var globalCopyright = ''

function exit(code) {
	fs.writeFileSync(path.resolve(buildDir, 'build.log'), logs.join(os.EOL), charset)
	process.exit(code)
}

function log(content, err) {
	if(err) {
		console.error(content)
	} else {
		console.log(content)
	}
	logs.push(content)
}

function dealErr(err) {
	log(err.toString(), 1)
	printLine()
	log('Terminated! Spent Time: ' + (new Date() - startTime) + 'ms')
	printLine('+')
	exit(1)
}

function printLine(c) {
	log(('-----------------------------------------------------------------------').replace(/\-/g, c || '-'))
}

function mkdirs(dirpath, mode, callback) {
	fs.exists(dirpath, function(exists) {
		if(exists) {
			callback(dirpath)
		} else {
			mkdirs(path.dirname(dirpath), mode, function() {
				fs.mkdir(dirpath, mode, callback)
			})
		}
	})
}

function isSrcDir(outputDir) {
	if((/\/_?src(\/|$)/).test(outputDir)) {//TODO
		return false
	}
	return true
}

function getUglified(content, info) {
	var ast
	var level = typeof info.uglify != 'undefined' ? info.uglify : globalUglifyLevel
	var copyright = info.copyright || globalCopyright
	if(!level) {
		return copyright + content
	}
	ast = uglify.parser.parse(content)
	if(level > 1) {
		ast = uglify.uglify.ast_mangle(ast, {except: ['require']})
	}
	if(level > 2) {
		ast = uglify.uglify.ast_squeeze(ast)
	}
	return copyright + uglify.uglify.gen_code(ast, {beautify: level < 0})
}

function getDeps(def, relative, exclude) {
	var deps = []
	var got = {}
	var depArr = def.match(/\bdefine\s*\([^\[\{]*(\[[^\[\]]*\])/m)
	depArr = depArr && depArr[1]
	exclude = exclude || {}
	relative && depArr && depArr.replace(new RegExp('["\'](' + (relative ? '\\.' : '') + '[^"\'\\s]+)["\']', 'mg'), function(m, dep) {
		got[dep] || exclude[dep] || globalExclude[dep] || (/(-built|\.js)$/).test(dep) || deps.push(dep)
		got[dep] = 1
	})
	def.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/mg, '')//remove comments
		.replace(new RegExp('\\brequire\\s*\\(\\s*["\'](' + (relative ? '\\.' : '') + '[^"\'\\s]+)["\']\\s*\\)', 'mg'), function(m, dep) {//extract dependencies
			got[dep] || exclude[dep] || globalExclude[dep] || (/(-built|\.js)$/).test(dep) || deps.push(dep)
			got[dep] = 1
		})
	return deps
}

function getTmplFnName(str) {
	var fnName = (str + '').replace(/(?:[-_\.]+|(?:\.*\/)+)(\w)([^-_\.\/]*)/g, function($1, $2, $3) {return $2.toUpperCase() + $3})
	fnName = fnName.charAt(0).toLowerCase() + fnName.slice(1)
	return fnName
}

function compileTmpl(tmpl, depId, notAmdModule) {
	var fnName = notAmdModule && getTmplFnName(depId)
	var strict = (/\$data\b/).test(tmpl)
	var res = []
	if(notAmdModule) {
		res.push([
			"var " + fnName + " = (function() {"
		].join(os.EOL))
	} else {
		res.push([
			depId ? 
			"define('" + depId + "', [], function() {" :
			"define(function() {"
		].join(os.EOL))
	}
	res.push([
		"	function $encodeHtml(str) {",
		"		return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\x60/g, '&#96;').replace(/\x27/g, '&#39;').replace(/\x22/g, '&quot;')",
		"	}",
		"	return function($data, $opt) {",
		"		$data = $data || {}",
		"		var _$out_= []",
		"		var $print = function(str) {_$out_.push(str)}",
		"		" + (strict ? "" : "with($data) {"),
		"		_$out_.push('" + tmpl
				.replace(/[\r\t\n]/g, "")
				.replace(/(?:^|%>).*?(?:<%|$)/g, function($0) {
					return $0.replace(/('|\\)/g, '\\$1')
				})
				.replace(/<%==(.*?)%>/g, "', $encodeHtml($1), '")
				.replace(/<%=(.*?)%>/g, "', $1, '")
				.split("<%").join("')" + os.EOL + "		")
				.split("%>").join(os.EOL + "		_$out_.push('") + "')",
		"		" + (strict ? "" : "}"),
		"		return _$out_.join('')",
		"	}"
	].join(os.EOL))
	if(notAmdModule) {
		res.push([
			"})()"
		].join(os.EOL))
	} else {
		res.push([
			"})"
		].join(os.EOL))
	}
	return res.join(os.EOL)
}

function fixDefineParams(def, depId) {
	var bodyDeps = getDeps(def)
	def = def.replace(/\b(define\s*\()\s*(["'][^"'\s]+["']\s*,\s*)?\s*(\[[^\[\]]*\])?/m, function(m, d, id, deps) {
		if(bodyDeps.length) {
			bodyDeps = "'" + bodyDeps.join("', '") + "'"
			if(deps) {
				deps = deps.replace(/]$/, ', ' + bodyDeps + ']')
			} else {
				deps = "['require', 'exports', 'module', " + bodyDeps + "], "
			}
		}
		return [d, id || depId && ("'" + depId + "', "), deps || '[], '].join('')
	})
	return def
}

function buildOneDir(info, callback, baseName) {
	var inputDir = path.resolve(buildDir, info.input)
	var outputDir = typeof info.output == 'undefined' ? '' : path.resolve(buildDir, info.output)
	var buildList = fs.readdirSync(inputDir)
	var buildTotal = buildList.length
	baseName = baseName || ''
	build()
	function build() {
		var inputFile, outputFile, fileName
		if(buildList.length) {
			inputFile = path.join(inputDir, buildList.shift())
			if(path.basename(inputFile) == 'main.js' || path.basename(inputFile) == path.basename(inputDir) + '.js') {
				fileName = path.basename(inputFile).replace(/\.js$/, '-built.js')
				outputFile = outputDir ? path.join(outputDir, baseName, fileName) : path.join(inputDir, fileName)
				buildOne({input: inputFile, output: outputFile, exclude: info.exclude}, function() {
					build()
				}, true)
			} else if((/\.tpl.html?$/).test(inputFile)) {
				fileName = path.basename(inputFile) + '.js'
				outputFile = outputDir ? path.join(outputDir, baseName, fileName) : path.join(inputDir, fileName)
				printLine()
				log('Build')
				log('Input: ' + inputFile)
				log('Output: ' + outputFile)
				fs.writeFileSync(outputFile, getUglified(compileTmpl(fs.readFileSync(inputFile, charset)), info), charset)
				log('Done!')
				build()
			} else if(!path.extname(inputFile) && !(/^\.|~$/).test(path.basename(inputFile))) {
				buildOneDir({input: inputFile, output: info.output, exclude: info.exclude}, function() {
					build()
				}, baseName ? baseName + '/' + path.basename(inputFile) : path.basename(inputFile))
			} else {
				build()
			}
		} else {
			callback()
		}
	}
}

function buildOne(info, callback, ignoreSrc) {
	var input = path.resolve(buildDir, info.input)
	var inputDir = path.dirname(input)
	var output = typeof info.output == 'undefined' ? '' : path.resolve(buildDir, info.output)
	var outputDir = path.dirname(output)
	var depId
	if(input == output) {
		printLine()
		log('Build')
		log('Input: ' + input)
		log('Output: ' + output)
		throw new Error('Input and output must not be the same!')
	}
	if(!path.extname(input)) {//build dir
		buildOneDir(info, callback)
		return
	}
	printLine()
	log('Build')
	log('Input: ' + input)
	log('Output: ' + output)
	if(!(/\.js$/).test(input) || !(/\.js$/).test(output)) {
		throw new Error('Input and output must be both js file name or dir name!')
	}
	if(!ignoreSrc && !isSrcDir(outputDir)) {
		throw new Error('Output to src dir denied!')
	}
	fs.readFile(input, charset, function(err, content) {
		if(err) {
			throw err
		}
		var deps, fileName, fileContent = []
		if((/\.tpl.html?$/).test(input)) {
			fileContent.push(compileTmpl(content))
		} else {
			deps = getDeps(content, true, info.exclude)
			while(deps.length) {
				depId = deps.shift()
				if((/\.tpl.html?$/).test(depId)) {
					fileName = path.resolve(inputDir, depId)
					log('Merging: ' + fileName)
					fileContent.push(compileTmpl(fs.readFileSync(fileName, charset), depId))
				} else {
					fileName = path.resolve(inputDir, depId + '.js')
					log('Merging: ' + fileName)
					fileContent.push(fixDefineParams(fs.readFileSync(fileName, charset), depId))
				}
			}
			fileContent.push(fixDefineParams(content))
		}
		log('Merging: ' + input)
		log('Writing: ' + output)
		mkdirs(outputDir, 0777, function() {
			fs.writeFileSync(output, getUglified(fileContent.join(os.EOL + os.EOL), info), charset)
			log('Done!')
			callback()
		})
	})
}

function combineOne(info, callback) {
	printLine()
	log('Combine')
	if(!info.output) {
		throw new Error('Output not defined!')
	}
	var output = path.resolve(buildDir, info.output)
	var outputDir = path.dirname(output)
	var depId, fileName, fileContent = []
	log('Output: ' + output)
	if(!isSrcDir(outputDir)) {
		throw new Error('Output to src dir denied!')
	}
	while(info.inputs.length) {
		depId = info.inputs.shift()
		fileName = path.resolve(buildDir, depId)
		log('Merging: ' + fileName)
		if((/\.tpl.html?$/).test(depId)) {
			fileContent.push(compileTmpl(fs.readFileSync(fileName, charset), depId, true))
		} else {
			fileContent.push(fs.readFileSync(fileName, charset))
		}
	}
	log('Writing: ' + output)
	mkdirs(outputDir, 0777, function() {
		if((/.js$/).test(output)) {
			fs.writeFileSync(output, getUglified(fileContent.join(os.EOL + os.EOL), info), charset)
		} else {
			fs.writeFileSync(output, fileContent.join(os.EOL + os.EOL), charset)
		}
		log('Done!')
		callback()
	})
}

printLine('+')
log('Start! Time: ' + startTime)
fs.readFile(buildFileName, charset, function(err, data) {
	if(err) {
		throw err
	}
	var buildJson, buildList, combineList, combineTotal
	try {
		buildJson = JSON.parse(data)
	} catch(e) {
		printLine()
		throw new Error('Illegal json format build file!' + os.EOL + e.toString())
	}
	globalUglifyLevel = buildJson.uglify || 0
	globalExclude = buildJson.exclude || {}
	globalCopyright = buildJson.copyright || ''
	buildList = buildJson.builds || []
	combineList = buildJson.combines || []
	combineTotal = combineList.length
	build()
	function build() {
		if(buildList.length) {
			buildOne(buildList.shift(), function() {
				build()
			})
		} else {
			combine()
		}
	}
	function combine() {
		if(combineList.length) {
			combineOne(combineList.shift(), function() {
				combine()
			})
		} else {
			printLine()
			log('Finished! Spent Time: ' + (new Date() - startTime) + 'ms')
			printLine('+')
			exit()
		}
	}
})
