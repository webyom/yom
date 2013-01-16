/**
 * YOM module builder
 * Copyright (c) 2012 Gary Wang, webyom@gmail.com http://webyom.org
 * Under the MIT license
 * https://github.com/webyom/yom
 */

var os = require('os')
var fs = require('fs')
var path = require('path')
var utils = require('./utils')
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

var EOL = '\n'
var EOLEOL = EOL + EOL
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
var globalBuildNodeTpl = false
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

function getUglified(content, info, opt) {
	opt = opt || {}
	var ast
	var level = typeof info.uglify != 'undefined' ? info.uglify : globalUglifyLevel
	var copyright = opt.inline ? '' : (info.copyright || globalCopyright)
	if(!(/\S/).test(content)) {
		return ''
	}
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
	relative && depArr && depArr.replace(new RegExp('(["\'])(' + (relative ? '\\.' : '') + '[^"\'\\s]+)\\1', 'mg'), function(full, quote, dep) {
		got[dep] || exclude[dep] || globalExclude[dep] || relative && (/(-built|\.js)$/).test(dep) || deps.push(dep)
		got[dep] = 1
	})
	removeComments(def).replace(new RegExp('\\brequire\\s*\\(\\s*(["\'])(' + (relative ? '\\.' : '') + '[^"\'\\s]+)\\1\\s*\\)', 'mg'), function(full, quote, dep) {//extract dependencies
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
		if(!(/\.tpl\.html?$/).test(depId)) {
			fileName = path.resolve(curDir, depId + '.js')
			def = fs.readFileSync(fileName, charset)
			res = traversalGetRelativeDeps(inputDir, def, exclude, processed, path.dirname(fileName)).concat(res)
		}
	}
	return res
}

function getTmplObjName(str) {
	var tmplObjName = (str + '').replace(/(?:[-_\.]+|(?:\.*\/)+)(\w)([^-_\.\/]*)/g, function($0, $1, $2) {return $1.toUpperCase() + $2})
	tmplObjName = tmplObjName.charAt(0).toLowerCase() + tmplObjName.slice(1)
	return tmplObjName
}

function getIncProcessed(input, info, opt) {
	input = path.resolve(input)
	opt = opt || {}
	var inputDir = path.dirname(input)
	var outputDir = opt.outputDir || inputDir
	var tmpl = opt.tmpl || fs.readFileSync(input, charset)
	var compressCss = typeof info.cssmin != 'undefined' ? info.cssmin : globalCssmin
	var reverseDepMap = utils.cloneObject(opt.reverseDepMap) || {}
	var baseUrl, ugl
	if(reverseDepMap[input]) {
		log('Warn: "' + input + '" have circular reference!')
		return ''
	}
	reverseDepMap[input] = 1
	tmpl = tmpl.replace(/<!--\s*cssmin\s+(['"])([^'"]+)\1\s*-->/m, function(full, quote, val) {
		if(val == 'false' || val == '0') {
			compressCss = false
		} else {
			compressCss = true
		}
		return ''
	}).replace(/<!--\s*uglify\s+(['"])([^'"]+)\1\s*-->/m, function(full, quote, val) {
		ugl = parseInt(val)
		return ''
	}).replace(/<!--\s*base\s+(['"])([^'"]+)\1\s*-->/m, function(full, quote, base) {
		baseUrl = base.replace(/\/+$/, '')
		baseUrl = baseUrl && ("'" + baseUrl + "'")
		return ''
	}).replace(/<!--\s*include\s+(['"])([^'"]+)\1\s*-->/mg, function(full, quote, file) {
		var res, extName
		var ug = isNaN(ugl) ? info.uglify : ugl
		file = path.join(inputDir, file)
		extName = path.extname(file)
		if((/\.inc\.html?$/).test(file)) {
			res = getIncProcessed(file, info, {reverseDepMap: reverseDepMap, outputDir: outputDir})
		} else {
			res = fs.readFileSync(file, charset)
			if(extName == '.js') {
				res = [
					'<script type="text/javascript">',
					getUglified(res, {uglify: ug}, {inline: true}),
					'</script>'
				].join(EOL)
			} else if(extName == '.css') {
				res = [
					'<style type="text/css">',
					compressCss ? cssmin(res) : res,
					'</style>'
				].join(EOL)
			}
		}
		return res
	}).replace(/<!--\s*require\s+(['"])([^'"]+)\1\s*-->/mg, function(full, quote, id) {
		var file = path.join(inputDir, id)
		var ug = isNaN(ugl) ? info.uglify : ugl
		id = id.replace(/\.js$/, '')
		id = path.join(path.relative(outputDir, inputDir), id)
		return [
			'<script type="text/javascript">',
			getUglified([
				getBuiltAmdModContent(file, info, {id: id, reverseDepMap: reverseDepMap}),
				'require.processDefQueue(\'\', ' + (baseUrl || 'require.PAGE_BASE_URL') + ', require.getBaseUrlConfig(' + (baseUrl || 'require.PAGE_BASE_URL') + '))'
			].join(EOL), {uglify: ug}, {inline: true}),
			'</script>'
		].join(EOL)
	}).replace(/(<script\b[^>]*>)([^\f]*?)(<\/script>)/mg, function(full, startTag, content, endTag) {
		var eol, ug
		startTag = startTag.replace(/\s+data-uglify=(['"])(\d+)\1/, function(full, quote, val) {
			ug = parseInt(val)
			return ''
		})
		content = content.replace(/^\s+$/, '')
		eol = content ? EOL : ''
		if(opt.tmpl && ug !== 0) {
			//beautify micro template inline script
			content = uglify.uglify.gen_code(uglify.parser.parse(content), {beautify: true})
		}
		if(isNaN(parseInt(ug))) {
			ug = isNaN(ugl) ? info.uglify : ugl
		}
		if(ug === 0) {
			eol = ''
		}
		return startTag + eol + getUglified(content, {uglify: ug}, {inline: true}) + eol + endTag
	})
	return tmpl.replace(/\r\n/g, '\n')
}

function compileTmpl(input, type, info, opt) {
	input = path.resolve(input)
	opt = opt || {}
	var tmpl = fs.readFileSync(input, charset)
	var strict = (/\$data\b/).test(tmpl)
	var res = []
	tmpl = getIncProcessed(input, info, utils.extendObject(opt, {tmpl: tmpl}))
	if(type == 'NODE') {
		//do nothing
	} else if(type == 'AMD') {
		res.push([
			opt.id ? 
			"define('" + opt.id + "', ['require', 'exports', 'module'], function(require, exports, module) {" :
			"define(function(require, exports, module) {"
		].join(EOL))
	} else {
		res.push([
			"var " + getTmplObjName(opt.id) + " = (function() {",
			"	var exports = {}"
		].join(EOL))
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
				.replace(/[\v]/g, EOL)
				.replace(/<%==(.*?)%>/g, "', $encodeHtml($1), '")
				.replace(/<%=(.*?)%>/g, "', $1, '")
				.split("<%").join("')" + EOL + "		")
				.split("%>").join(EOL + "		_$out_.push('") + "')",
		"		" + (strict ? "" : "}"),
		"		return _$out_.join('')",
		"	}"
	].join(EOL))
	if(type == 'NODE') {
		//do nothing
	} else if(type == 'AMD') {
		res.push([
			"})"
		].join(EOL))
	} else {
		res.push([
			"	return exports",
			"})()"
		].join(EOL))
	}
	return uglify.uglify.gen_code(uglify.parser.parse(res.join(EOL)), {beautify: true})
}

function fixDefineParams(def, depId, baseId) {
	var bodyDeps
	if(!(/\bdefine\b/m).test(removeComments(def))) {
		def = [
			'define(function(require, exports, module)) {',
				def,
			'})'
		].join(EOL)
	}
	bodyDeps = getDeps(def)
	def = def.replace(/\b(define\s*\()\s*(?:(["'])([^"'\s]+)\2\s*,\s*)?\s*(\[[^\[\]]*\])?/m, function(full, d, quote, id, deps) {
		if(bodyDeps.length) {
			bodyDeps = "'" + bodyDeps.join("', '") + "'"
			if(deps) {
				deps = deps.replace(/]$/, ', ' + bodyDeps + ']')
			} else {
				deps = "['require', 'exports', 'module', " + bodyDeps + "], "
			}
		}
		id = id || depId || ''
		id = id && baseId ? path.join(path.dirname(baseId), id) : id
		if(id && !(/^\./).test(id)) {
			id = './' + id
		}
		return [d, id && ("'" + id + "', "), deps || "['require', 'exports', 'module'], "].join('')
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
	var buildNodeTpl = typeof info.buildNodeTpl != 'undefined' ? info.buildNodeTpl : globalBuildNodeTpl
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
		var inputFile, outputFile, nodeTplOutputFile, fileName, tmp
		if(buildList.length) {
			inputFile = path.join(inputDir, buildList.shift())
			if(ignore[inputFile] || (/^\.|~$/).test(path.basename(inputFile))) {
				build()
			} else if(path.basename(inputFile) == 'main.js' || (/-main.js$/).test(inputFile) ||  path.basename(inputFile) == path.basename(inputDir) + '.js') {
				fileName = path.basename(inputFile).replace(/\.js$/, '-built.js')
				outputFile = path.join(outputDir, fileName)
				buildOne(utils.extendObject(utils.cloneObject(info), {input: inputFile, output: outputFile}), function() {
					build()
				}, true)
			} else if((/\.tpl\.html?$/).test(inputFile)) {
				fileName = path.basename(inputFile) + '.js'
				outputFile = path.join(outputDir, fileName)
				buildOne(utils.extendObject(utils.cloneObject(info), {input: inputFile, output: outputFile}), function() {
					build()
				}, true)
			} else if((/\.inc\.html?$/).test(inputFile)) {
				fileName = path.basename(inputFile).replace('.inc.htm', '.htm')
				outputFile = path.join(outputDir, fileName)
				buildOne(utils.extendObject(utils.cloneObject(info), {input: inputFile, output: outputFile}), function() {
					build()
				}, true)
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

function getBuiltAmdModContent(input, info, opt) {
	input = path.resolve(input)
	opt = opt || {}
	var inputDir = path.dirname(input)
	var fileContent = []
	var depId, deps, fileName, content
	var reverseDepMap = utils.cloneObject(opt.reverseDepMap) || {}
	if(reverseDepMap[input]) {
		log('Warn: "' + input + '" have circular reference!')
		return ''
	}
	reverseDepMap[input] = 1
	content = fs.readFileSync(input, charset)
	if(!(/\bdefine\b/m).test(removeComments(content))) {
		content = [
			'define(function(require, exports, module)) {',
				content,
			'})'
		].join(EOL)
	}
	deps = traversalGetRelativeDeps(inputDir, content, info.exclude)
	while(deps.length) {
		depId = deps.shift()
		if((/\.tpl\.html?$/).test(depId)) {
			fileName = path.resolve(inputDir, depId)
			if(reverseDepMap[fileName]) {
				log('Warn: "' + fileName + '" and "' + input + '" have circular reference!')
				continue
			}
			log('Merging: ' + fileName)
			fileContent.push(compileTmpl(fileName, 'AMD', info, {id: depId, reverseDepMap: reverseDepMap}))
		} else {
			fileName = path.resolve(inputDir, depId + '.js')
			if(reverseDepMap[fileName]) {
				log('Warn: "' + fileName + '" and "' + input + '" have circular reference!')
				continue
			}
			log('Merging: ' + fileName)
			fileContent.push(fixDefineParams(fs.readFileSync(fileName, charset), depId, opt.id))
		}
	}
	fileContent.push(fixDefineParams(content, opt.id))
	return fileContent.join(EOLEOL)
}

function buildOne(info, callback, ignoreSrc) {
	var input = path.resolve(buildDir, info.input)
	var output = typeof info.output == 'undefined' ? '' : path.resolve(buildDir, info.output)
	var outputDir = path.dirname(output)
	var buildNodeTpl = typeof info.buildNodeTpl != 'undefined' ? info.buildNodeTpl : globalBuildNodeTpl
	var fileContent, nodeTplOutput
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
	if(!ignoreSrc && !isSrcDir(outputDir)) {
		throw new Error('Output to src dir denied!')
	}
	if((/\.tpl\.html?$/).test(input)) {
		if(buildNodeTpl) {
			nodeTplOutput = output.replace('.tpl.', '.node.tpl.')
			log('Output: ' + nodeTplOutput)
		}
		log('Merging: ' + output)
		fileContent = getUglified(compileTmpl(input, 'AMD', info), info)
		log('Writing: ' + output)
		mkdirs(outputDir, 0777, function() {
			fs.writeFileSync(output, fileContent, charset)
			if(buildNodeTpl) {
				log('Merging: ' + nodeTplOutput)
				fileContent = getUglified(compileTmpl(input, 'NODE', info), info)
				log('Writing: ' + nodeTplOutput)
				fs.writeFileSync(nodeTplOutput, fileContent, charset)
			}
			log('Done!')
			callback()
		})
	} else if((/\.inc\.html?$/).test(input)) {
		log('Merging: ' + input)
		fileContent = getIncProcessed(input, info, {outputDir: outputDir})
		log('Writing: ' + output)
		mkdirs(outputDir, 0777, function() {
			fs.writeFileSync(output, fileContent, charset)
			log('Done!')
			callback()
		})
	} else {
		log('Merging: ' + input)
		fileContent = getUglified(getBuiltAmdModContent(input, info), info)
		log('Writing: ' + output)
		mkdirs(outputDir, 0777, function() {
			fs.writeFileSync(output, fileContent, charset)
			log('Done!')
			callback()
		})
	}
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
		if((/\.tpl\.html?$/).test(depId)) {
			fileContent.push(compileTmpl(fileName, 'NONE_AMD', info, {id: depId}))
		} else {
			fileContent.push(fs.readFileSync(fileName, charset))
		}
	}
	log('Writing: ' + output)
	mkdirs(outputDir, 0777, function() {
		if(path.extname(output) == '.js') {
			fileContent = getUglified(fileContent.join(EOLEOL), info)
		} else if(path.extname(output) == '.css' && (globalCssmin || (/-min.css$/).test(output))) {
			fileContent = cssmin(fileContent.join(EOLEOL))
		} else {
			fileContent = fileContent.join(EOLEOL)
		}
		fs.writeFileSync(output, fileContent, charset)
		log('Done!')
		callback()
	})
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
				throw new Error('Illegal json format build file!' + EOL + e.toString())
			}
			start(buildJson)
		})
	} else {
		start(DEFAULT_BUILD_JSON)
	}
	function start(buildJson) {
		var buildList, combineList, combineTotal
		globalUglifyLevel = buildJson.uglify || parseInt(args['uglify']) || 0
		globalBuildNodeTpl = buildJson.buildNodeTpl || args['build-node-tpl']
		globalCssmin = buildJson.cssmin || args['cssmin']
		globalExclude = buildJson.exclude || utils.getHashFromString(args['exclude']) || {}
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
