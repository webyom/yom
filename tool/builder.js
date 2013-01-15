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
var cssmin = require('./cssmin').cssmin
var argsGetter = require('./args').get

process.on('uncaughtException', function(err) {
	try {
		dealErr(err)
	} catch(e) {
		console.error(e.toString())
		process.exit(1)
	}
})

var DEFAULT_BUILD_JSON = {
	builds: [
		{
			input: './'
		}
	]
}

var startTime = new Date()
var charset = 'utf-8'
var args = argsGetter()
var buildFileName = args['config-file'] || 'build.json'
var buildDir = path.dirname(path.resolve(process.cwd(), buildFileName))
var logs = []
var globalUglifyLevel = 0
var globalCssmin = false
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
	log(new Array(73).join('-').replace(/\-/g, c || '-'))
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

function removeComments(content) {
	return content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/mg, '')
}

function getDeps(def, relative, exclude) {
	var deps = []
	var got = {}
	var depArr = removeComments(def).match(/\bdefine\s*\([^\[\{]*(\[[^\[\]]*\])/m)
	depArr = depArr && depArr[1]
	exclude = exclude || {}
	relative && depArr && depArr.replace(new RegExp('["\'](' + (relative ? '\\.' : '') + '[^"\'\\s]+)["\']', 'mg'), function(m, dep) {
		got[dep] || exclude[dep] || globalExclude[dep] || relative && (/(-built|\.js)$/).test(dep) || deps.push(dep)
		got[dep] = 1
	})
	removeComments(def).replace(new RegExp('\\brequire\\s*\\(\\s*["\'](' + (relative ? '\\.' : '') + '[^"\'\\s]+)["\']\\s*\\)', 'mg'), function(m, dep) {//extract dependencies
		got[dep] || exclude[dep] || globalExclude[dep] || relative && (/(-built|\.js)$/).test(dep) || deps.push(dep)
		got[dep] = 1
	})
	return deps
}

function traversalGetRelativeDeps(inputDir, def, exclude, processed, curDir) {
	var deps = getDeps(def, true, exclude)
	var res = []
	var depId, fileName
	processed = processed || {}
	curDir = curDir || inputDir
	while(deps.length) {
		depId = path.join(path.relative(inputDir, curDir), deps.shift()).split(path.sep).join('/')
		if(!(/^\./).test(depId)) {
			depId = './' + depId
		}
		if(processed[depId]) {
			continue
		} else {
			res.push(depId)
			processed[depId] = 1
		}
		if(!(/\.tpl.html?$/).test(depId)) {
			fileName = path.resolve(curDir, depId + '.js')
			def = fs.readFileSync(fileName, charset)
			res = traversalGetRelativeDeps(inputDir, def, exclude, processed, path.dirname(fileName)).concat(res)
		}
	}
	return res
}

function getTmplObjName(str) {
	var tmplObjName = (str + '').replace(/(?:[-_\.]+|(?:\.*\/)+)(\w)([^-_\.\/]*)/g, function($1, $2, $3) {return $2.toUpperCase() + $3})
	tmplObjName = tmplObjName.charAt(0).toLowerCase() + tmplObjName.slice(1)
	return tmplObjName
}

function compileTmpl(tmpl, type, opt) {
	opt = opt || {}
	var strict = (/\$data\b/).test(tmpl)
	var res = []
	tmpl = tmpl.replace(/(<script\b(?:[^>]*)>)([^\f]*?)(<\/script>)/mg, function(full, startTag, content, endTag) {
		return startTag + uglify.uglify.gen_code(uglify.parser.parse(content), {beautify: true}) + endTag
	})
	if(type == 'NODE') {
		//do nothing
	} else if(type == 'AMD') {
		res.push([
			opt.id ? 
			"define('" + opt.id + "', ['require', 'exports', 'module'], function(require, exports, module) {" :
			"define(function(require, exports, module) {"
		].join(os.EOL))
	} else {
		res.push([
			"var " + getTmplObjName(opt.id) + " = (function() {",
			"	var exports = {}"
		].join(os.EOL))
	}
	res.push([
		"	function $encodeHtml(str) {",
		"		return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\x60/g, '&#96;').replace(/\x27/g, '&#39;').replace(/\x22/g, '&quot;')",
		"	}",
		"	exports.render = function($data, $opt) {",
		"		$data = $data || {}",
		"		var _$out_= []",
		"		var $print = function(str) {_$out_.push(str)}",
		"		" + (strict ? "" : "with($data) {"),
		"		_$out_.push('" + tmpl
				.replace(/\r\n|\n|\r/g, "\v")
				.replace(/(?:^|%>).*?(?:<%|$)/g, function($0) {
					return $0.replace(/('|\\)/g, "\\$1").replace(/[\v\t]/g, "").replace(/\s+/g, " ")
				})
				.replace(/[\v]/g, os.EOL)
				.replace(/<%==(.*?)%>/g, "', $encodeHtml($1), '")
				.replace(/<%=(.*?)%>/g, "', $1, '")
				.split("<%").join("')" + os.EOL + "		")
				.split("%>").join(os.EOL + "		_$out_.push('") + "')",
		"		" + (strict ? "" : "}"),
		"		return _$out_.join('')",
		"	}"
	].join(os.EOL))
	if(type == 'NODE') {
		//do nothing
	} else if(type == 'AMD') {
		res.push([
			"})"
		].join(os.EOL))
	} else {
		res.push([
			"	return exports",
			"})()"
		].join(os.EOL))
	}
	return uglify.uglify.gen_code(uglify.parser.parse(res.join(os.EOL)), {beautify: true})
}

function fixDefineParams(def, depId) {
	var bodyDeps
	if(!(/\bdefine\b/m).test(removeComments(def))) {
		def = [
			'define(function(require, exports, module)) {',
				def,
			'})'
		].join(os.EOL)
	}
	bodyDeps = getDeps(def)
	def = def.replace(/\b(define\s*\()\s*(["'][^"'\s]+["']\s*,\s*)?\s*(\[[^\[\]]*\])?/m, function(m, d, id, deps) {
		if(bodyDeps.length) {
			bodyDeps = "'" + bodyDeps.join("', '") + "'"
			if(deps) {
				deps = deps.replace(/]$/, ', ' + bodyDeps + ']')
			} else {
				deps = "['require', 'exports', 'module', " + bodyDeps + "], "
			}
		}
		return [d, id || depId && ("'" + depId + "', "), deps || "['require', 'exports', 'module'], "].join('')
	})
	return def
}

function buildOneDir(info, callback, baseName) {
	baseName = baseName || ''
	var inputDir = path.resolve(buildDir, info.input)
	var outputDir = typeof info.output == 'undefined' ? inputDir : path.resolve(buildDir, info.output, baseName)
	var buildList = fs.readdirSync(inputDir)
	var buildTotal = buildList.length
	var ignore = info.ignore || {}
	var buildNodeTpl = typeof info.buildNodeTpl != 'undefined' ? info.buildNodeTpl : args['build-node-tpl']
	var compressCss = typeof info.cssmin != 'undefined' ? info.cssmin : globalCssmin
	if(!baseName/*avoid recalculating*/ && info.ignore) {
		ignore = {}
		for(var dir in info.ignore) {
			if(info.ignore.hasOwnProperty(dir)) {
				ignore[path.join(inputDir, dir)] = 1
			}
		}
	}
	build()
	function build() {
		var inputFile, outputFile, nodeTplOutputFile, fileName, rawFile, tmp
		if(buildList.length) {
			inputFile = path.join(inputDir, buildList.shift())
			if(ignore[inputFile] || (/^\.|~$/).test(path.basename(inputFile))) {
				build()
			} else if(path.basename(inputFile) == 'main.js' || (/-main.js$/).test(inputFile) ||  path.basename(inputFile) == path.basename(inputDir) + '.js') {
				fileName = path.basename(inputFile).replace(/\.js$/, '-built.js')
				outputFile = path.join(outputDir, fileName)
				buildOne({input: inputFile, output: outputFile, exclude: info.exclude}, function() {
					build()
				}, true)
			} else if((/\.tpl.html?$/).test(inputFile)) {
				fileName = path.basename(inputFile) + '.js'
				outputFile = path.join(outputDir, fileName)
				printLine()
				log('Build')
				log('Input: ' + inputFile)
				log('Output: ' + outputFile)
				if(buildNodeTpl) {
					nodeTplOutputFile = outputFile.replace('.tpl.', '.node.tpl.')
					log('Output: ' + nodeTplOutputFile)
				}
				rawFile = fs.readFileSync(inputFile, charset)
				log('Merging: ' + inputFile)
				tmp = getUglified(compileTmpl(rawFile, 'AMD'), info)
				log('Writing: ' + outputFile)
				mkdirs(outputDir, 0777, function() {
					fs.writeFileSync(outputFile, tmp, charset)
					if(buildNodeTpl) {
						log('Writing: ' + nodeTplOutputFile)
						fs.writeFileSync(nodeTplOutputFile, getUglified(compileTmpl(rawFile, 'NODE'), info), charset)
					}
					log('Done!')
					build()
				})
			} else if(compressCss && path.extname(inputFile) == '.css' && !(/-min.css$/).test(inputFile)) {
				fileName = path.basename(inputFile).replace(/.css$/, '-min.css')
				outputFile = path.join(outputDir, fileName)
				printLine()
				log('Build')
				log('Input: ' + inputFile)
				log('Output: ' + outputFile)
				tmp = fs.readFileSync(inputFile, charset)
				log('Merging: ' + inputFile)
				tmp = cssmin(tmp)
				log('Writing: ' + outputFile)
				mkdirs(outputDir, 0777, function() {
					fs.writeFileSync(outputFile, tmp, charset)
					log('Done!')
					build()
				})
			} else if(fs.statSync(inputFile).isDirectory()) {
				buildOneDir({input: inputFile, output: info.output, exclude: info.exclude, ignore: ignore, buildNodeTpl: buildNodeTpl, cssmin: compressCss}, function() {
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

function getBuiltAmdModContent(input, opt) {
	opt = opt || {}
	var inputDir = path.dirname(input)
	var fileContent = []
	var content = fs.readFileSync(input, charset)
	var depId, deps, fileName
	if((/\.tpl.html?$/).test(input)) {
		fileContent.push(compileTmpl(content, 'AMD'))
	} else {
		if(!(/\bdefine\b/m).test(removeComments(content))) {
			content = [
				'define(function(require, exports, module)) {',
					content,
				'})'
			].join(os.EOL)
		}
		deps = traversalGetRelativeDeps(inputDir, content, opt.exclude)
		while(deps.length) {
			depId = deps.shift()
			if((/\.tpl.html?$/).test(depId)) {
				fileName = path.resolve(inputDir, depId)
				log('Merging: ' + fileName)
				fileContent.push(compileTmpl(fs.readFileSync(fileName, charset), 'AMD', {id: depId}))
			} else {
				fileName = path.resolve(inputDir, depId + '.js')
				if(fileName == input) {
					continue
				}
				log('Merging: ' + fileName)
				fileContent.push(fixDefineParams(fs.readFileSync(fileName, charset), depId))
			}
		}
		fileContent.push(fixDefineParams(content, opt.id))
	}
	return fileContent.join(os.EOL + os.EOL)
}

function buildOne(info, callback, ignoreSrc) {
	var input = path.resolve(buildDir, info.input)
	var output = typeof info.output == 'undefined' ? '' : path.resolve(buildDir, info.output)
	var outputDir = path.dirname(output)
	var fileContent
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
	if(path.extname(input) != '.js' || path.extname(output) != '.js') {
		throw new Error('Input and output must be both js file name or dir name!')
	}
	if(!ignoreSrc && !isSrcDir(outputDir)) {
		throw new Error('Output to src dir denied!')
	}
	fileContent = getBuiltAmdModContent(input, '', {exclude: info.exclude})
	log('Merging: ' + input)
	log('Writing: ' + output)
	mkdirs(outputDir, 0777, function() {
		fs.writeFileSync(output, getUglified(fileContent, info), charset)
		log('Done!')
		callback()
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
			fileContent.push(compileTmpl(fs.readFileSync(fileName, charset), 'NONE_AMD', {id: depId}))
		} else {
			fileContent.push(fs.readFileSync(fileName, charset))
		}
	}
	log('Writing: ' + output)
	mkdirs(outputDir, 0777, function() {
		if(path.extname(output) == '.js') {
			fileContent = getUglified(fileContent.join(os.EOL + os.EOL), info)
		} else if(path.extname(output) == '.css' && (globalCssmin || (/-min.css$/).test(output))) {
			fileContent = cssmin(fileContent.join(os.EOL + os.EOL))
		} else {
			fileContent = fileContent.join(os.EOL + os.EOL)
		}
		fs.writeFileSync(output, fileContent, charset)
		log('Done!')
		callback()
	})
}

function getHashFromString(str, val) {
	var res = {}
	if(!str) {
		return null
	}
	str = str.split(/\s*,\s*/)
	for(var i = 0; i < str.length; i++) {
		res[str[i]] = typeof val != 'undefined' ? val : 1
	}
	return res
}

printLine('+')
log('Start! Time: ' + startTime)
fs.exists(buildFileName, function(exists) {
	if(exists) {
		fs.readFile(buildFileName, charset, function(err, data) {
			var buildJson
			if(err) {
				throw err
			}
			try {
				buildJson = JSON.parse(data)
			} catch(e) {
				printLine()
				throw new Error('Illegal json format build file!' + os.EOL + e.toString())
			}
			start(buildJson)
		})
	} else {
		start(DEFAULT_BUILD_JSON)
	}
	function start(buildJson) {
		var buildList, combineList, combineTotal
		globalUglifyLevel = buildJson.uglify || parseInt(args['uglify']) || 0
		globalCssmin = buildJson.cssmin || args['cssmin']
		globalExclude = buildJson.exclude || getHashFromString(args['exclude']) || {}
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
	}
})
