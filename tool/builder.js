/**
 * YOM module builder
 * Copyright (c) 2012 Gary Wang, webyom@gmail.com http://webyom.org
 * Under the MIT license
 * https://github.com/webyom/yom
 */

var os = require('os')
var fs = require('fs')
var path = require('path')
var exec = require('child_process').exec
var utils = require('./utils')
var lang = require('./lang')
var uglify = require('./uglify-js')
var less = require('./less')
var cssmin = require('./cssmin').cssmin
var argsGetter = require('./args').get
var replaceProperties = require('./properties').replaceProperties

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
var outputBasePath = ''
var htmlCompressorPath = path.join(path.dirname(path.resolve(process.cwd(), process.argv[1])), 'html-compressor/html-compressor.jar')
var logs = []
var globalUglifyLevel = 0
var globalBuildNodeTpl = false
var globalCssmin = false
var globalCompressHtml = false
var globalCompressHtmlOptions = ''
var globalExclude = {}
var globalCopyright = ''
var properties
var langResource

function exit(code) {
	printLine()
	log((code ? 'Terminated' : 'Finished') + '! Spent Time: ' + (new Date() - startTime) + 'ms', 0, true)
	printLine('+')
	fs.writeFileSync(path.resolve(buildDir, 'build.log'), logs.join(os.EOL), charset)
	process.exit(code)
}

function log(content, err, verbose) {
	if(err) {
		console.error(content)
	} else if(verbose || args.verbose) {
		console.log(content)
	}
	logs.push(content)
}

function dealErr(err) {
	log(err.toString(), 1)
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

function writeFileSync(path, content, charset, lang) {
	if(properties && charset) {
		properties._lang_ = lang || undefined
		content = replaceProperties(content, properties)
		properties._lang_ = undefined
	}
	fs.writeFileSync(path, content, charset)
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
	var copyright = info.copyright || (opt.inline ? '' : globalCopyright)
	if(!(/\S/).test(content)) {
		return ''
	}
	if(!level) {
		return copyright + content
	} else {
		content = replaceProperties(content, properties)
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

function getBodyDeps(def) {
	var deps = []
	var got = {}
	def.replace(/(?:^|[^\.\/\w])require\s*\(\s*(["'])([^"']+?)\1\s*\)/mg, function(full, quote, dep) {
		got[dep] || deps.push(dep)
		got[dep] = 1
	})
	return deps
}

function getRelativeDeps(def, exclude) {
	var deps = []
	var got = {}
	var depArr = def.match(/(?:^|[^\.\/\w])define\s*\([^\[\{]*(\[[^\[\]]*\])/m)
	depArr = depArr && depArr[1]
	exclude = exclude || {}
	depArr && depArr.replace(/(["'])(\.[^"']+?)\1/mg, function(full, quote, dep) {
		got[dep] || exclude[dep] || globalExclude[dep] || (/(-built|\.js)$/).test(dep) || deps.push(dep)
		got[dep] = 1
	})
	def.replace(/(?:^|[^\.\/\w])require\s*\(\s*(["'])(\.[^"']+?)\1\s*\)/mg, function(full, quote, dep) {
		got[dep] || exclude[dep] || globalExclude[dep] || (/(-built|\.js)$/).test(dep) || deps.push(dep)
		got[dep] = 1
	})
	return deps
}

function traversalGetRelativeDeps(inputDir, def, exclude, processed, curDir) {
	var deps = getRelativeDeps(def, exclude)
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
	if(info.lang) {
		tmpl = replaceProperties(tmpl, {_lang_: info.lang})
	}
	tmpl = replaceProperties(tmpl, properties)
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
	}).replace(/<!--\s*include\s+(['"])([^'"]+)\1(?:\s+plain-id:([\w-]+))?\s*-->/mg, function(full, quote, file, plainId) {
		var res, extName
		var ug = isNaN(ugl) ? info.uglify : ugl
		file = path.join(inputDir, file)
		extName = path.extname(file)
		log('Merging: ' + file)
		if((/\.(src|inc|tpl)\.html?$/).test(file)) {
			res = getIncProcessed(file, info, {reverseDepMap: reverseDepMap, outputDir: outputDir})
		} else {
			res = fs.readFileSync(file, charset)
			if(extName == '.js') {
				res = [
					plainId ? '<script type="text/plain" id="' + plainId + '">' : '<script type="text/javascript">',
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
	}).replace(/<!--\s*require\s+(['"])([^'"]+)\1(?:\s+plain-id:([\w-]+))?\s*-->/mg, function(full, quote, id, plainId) {
		var file = path.join(inputDir, id).replace(/\.js$/, '') + '.js'
		var ug = isNaN(ugl) ? info.uglify : ugl
		id = id.replace(/\.js$/, '').replace(/\\/g, '/')
		log('Merging: ' + file)
		return [
			plainId ? '<script type="text/plain" id="' + plainId + '">' : '<script type="text/javascript">',
			getUglified([
				getBuiltAmdModContent(file, info, {id: id, reverseDepMap: reverseDepMap}),
				(/\brequire-plugin\b/).test(id) ? 'require.processDefQueue()' : 'require.processDefQueue(\'\', ' + (baseUrl || 'require.PAGE_BASE_URL') + ', require.getBaseUrlConfig(' + (baseUrl || 'require.PAGE_BASE_URL') + '))'
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
	if(info.lang) {
		tmpl = lang.replaceProperties(tmpl, langResource[info.lang])
	}
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
					var uglifyLevel = typeof info.uglify != 'undefined' ? info.uglify : globalUglifyLevel
					if(type == 'NODE' && uglifyLevel <= 0) {
						return $0.replace(/('|\\)/g, "\\$1").replace(/[\v]/g, '\\n')
					} else {
						return $0.replace(/('|\\)/g, "\\$1").replace(/[\v\t]/g, "").replace(/\s+/g, " ")
					}
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
	bodyDeps = getBodyDeps(def)
	def = def.replace(/\b(define\s*\()\s*(?:(["'])([^"'\s]+)\2\s*,\s*)?\s*(\[[^\[\]]*\])?/m, function(full, d, quote, definedId, deps) {
		var id
		if(bodyDeps.length) {
			bodyDeps = "'" + bodyDeps.join("', '") + "'"
			if(deps) {
				deps = deps.replace(/]$/, ', ' + bodyDeps + ']')
			} else {
				deps = "['require', 'exports', 'module', " + bodyDeps + "], "
			}
		}
		if(definedId && !(/^\./).test(definedId)) {
			id = definedId
		} else {
			id = depId || ''
			id = id && baseId ? path.join(path.dirname(baseId), id) : id
			if(id && !(/^\./).test(id)) {
				id = './' + id
			}
		}
		return [d, id && ("'" + id.replace(/\\/g, '/') + "', "), deps || "['require', 'exports', 'module'], "].join('')
	})
	return def
}

function buildOneDir(info, callback, baseName) {
	baseName = baseName || ''
	var inputDir = path.resolve(buildDir, info.input)
	var outputDir = typeof info.output == 'undefined' ? inputDir : path.resolve(buildDir, outputBasePath, info.output, baseName)
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
		var inputFile, outputFile, nodeTplOutputFile, fileName, langList, tmp
		if(buildList.length) {
			inputFile = path.resolve(inputDir, buildList.shift())
			if(ignore[inputFile] || (/^\.|~$/).test(path.basename(inputFile))) {
				build()
			} else if(path.basename(inputFile) == 'main.js' || (/-main.js$/).test(inputFile) ||  path.basename(inputFile) == path.basename(inputDir) + '.js') {
				fileName = path.basename(inputFile).replace(/\.js$/, '-built.js')
				outputFile = path.join(outputDir, fileName)
				buildOne(utils.extendObject(utils.cloneObject(info), {input: inputFile, output: outputFile}), function() {
					build()
				}, true)
			} else if(path.basename(inputFile) == 'main.less' || (/-main.less$/).test(inputFile) ||  path.basename(inputFile) == path.basename(inputDir) + '.less') {
				fileName = path.basename(inputFile).replace(/\.less$/, '.css')
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
			} else if((/\.src\.html?$/).test(inputFile)) {
				fileName = path.basename(inputFile).replace(/\.src(\.html?)$/, '$1')
				if(langResource) {
					langList = langResource.LANG_LIST.concat()
					;(function() {
						var buildLang = arguments.callee
						var langCode = langList.shift()
						if(langCode) {
							outputFile = path.join(outputDir, fileName.replace(/(\.html?)$/, '-' + langCode + '$1'))
							buildOne(utils.extendObject(utils.cloneObject(info), {input: inputFile, output: outputFile, lang: langCode}), function() {
								buildLang()
							}, true)
						} else {
							build()
						}
					})()
				} else {
					outputFile = path.join(outputDir, fileName)
					buildOne(utils.extendObject(utils.cloneObject(info), {input: inputFile, output: outputFile}), function() {
						build()
					}, true)
				}
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
					writeFileSync(outputFile, tmp, charset)
					log('Done!')
					build()
				})
			} else if(fs.statSync(inputFile).isDirectory() && !(inputFile == outputDir || path.relative(inputFile, outputDir).indexOf('..') != 0)) {
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
			fileContent.push(fixDefineParams(compileTmpl(fileName, 'AMD', info, {id: depId, reverseDepMap: reverseDepMap}), depId, opt.id))
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

function compileLess(input, callback) {
	less.render(fs.readFileSync(input, charset), {
		paths: [path.dirname(input)], // Specify search paths for @import directives
		strictMaths: false,
		strictUnits: false,
		filename: input // Specify a filename, for better error messages
	}, function(err, css) {
		if(err) {
			dealErr(JSON.stringify(err))
		}
		callback(css)
	})
}

function checkCondition(condition) {
	var type, tmp
	if(!condition) {
		return true
	}
	tmp = condition.split(/\s*:\s*/)
	type = tmp[0]
	condition = tmp[1]
	if(type == 'property') {
		with(properties || {}) {
			return eval(condition)
		}
	}
	return true
}

function buildOne(info, callback, ignoreSrc) {
	if(!checkCondition(info.condition)) {
		callback()
		return
	}
	var input = path.resolve(buildDir, info.input)
	var output = typeof info.output == 'undefined' ? '' : path.resolve(buildDir, outputBasePath, info.output)
	var outputDir = path.dirname(output)
	var buildNodeTpl = typeof info.buildNodeTpl != 'undefined' ? info.buildNodeTpl : globalBuildNodeTpl
	var compressCss = typeof info.cssmin != 'undefined' ? info.cssmin : globalCssmin
	var compressHtml = typeof info.compressHtml != 'undefined' ? info.compressHtml : globalCompressHtml
	var compressHtmlOptions = typeof info.compressHtmlOptions != 'undefined' ? info.compressHtmlOptions : globalCompressHtmlOptions
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
	if(!output) {
		throw new Error('Output not defined!')
	}
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
			writeFileSync(output, fileContent, charset)
			if(buildNodeTpl) {
				log('Merging: ' + nodeTplOutput)
				fileContent = getUglified(compileTmpl(input, 'NODE', info), info)
				log('Writing: ' + nodeTplOutput)
				writeFileSync(nodeTplOutput, fileContent, charset)
			}
			log('Done!')
			callback()
		})
	} else if((/\.src\.html?$/).test(input)) {
		log('Merging: ' + input)
		fileContent = getIncProcessed(input, info, {outputDir: outputDir})
		log('Writing: ' + output)
		mkdirs(outputDir, 0777, function() {
			writeFileSync(output, fileContent, charset, info.lang)
			if(compressHtml) {
				exec('java -jar ' + htmlCompressorPath + ' ' + compressHtmlOptions + ' ' + output, function(err, stdout, stderr) {
					if(err) {
						throw err
					} else {
						writeFileSync(output, stdout, charset)
						log('Done!')
						callback()
					}
				})
			} else {
				log('Done!')
				callback()
			}
		})
	} else if(path.extname(input) == '.less') {
		log('Merging: ' + input)
		compileLess(input, function(css) {
			log('Writing: ' + output)
			mkdirs(outputDir, 0777, function() {
				if(compressCss) {
					css = cssmin(css)
				}
				writeFileSync(output, css, charset)
				log('Done!')
				callback()
			})
		})
	} else {
		log('Merging: ' + input)
		fileContent = getUglified(getBuiltAmdModContent(input, info), info)
		log('Writing: ' + output)
		mkdirs(outputDir, 0777, function() {
			writeFileSync(output, fileContent, charset)
			log('Done!')
			callback()
		})
	}
}

function combineOne(info, callback) {
	if(!checkCondition(info.condition)) {
		callback()
		return
	}
	printLine()
	log('Combine')
	if(!info.output) {
		throw new Error('Output not defined!')
	}
	var output = path.resolve(buildDir, outputBasePath, info.output)
	var outputDir = path.dirname(output)
	var compressCss = typeof info.cssmin != 'undefined' ? info.cssmin : globalCssmin
	var fileContent = []
	log('Output: ' + output)
	if(!isSrcDir(outputDir)) {
		throw new Error('Output to src dir denied!')
	}
	;(function() {
		var combineNext = arguments.callee
		var depId, fileName
		if(info.inputs.length) {
			depId = info.inputs.shift()
			fileName = path.resolve(buildDir, depId)
			log('Merging: ' + fileName)
			if((/\.tpl\.html?$/).test(depId)) {
				fileContent.push(compileTmpl(fileName, 'NONE_AMD', info, {id: depId}))
				combineNext()
			} else if(path.extname(fileName) == '.less' && path.extname(output) == '.css') {
				compileLess(fileName, function(css) {
					fileContent.push(css)
					combineNext()
				})
			} else {
				fileContent.push(fs.readFileSync(fileName, charset))
				combineNext()
			}
		} else {
			log('Writing: ' + output)
			mkdirs(outputDir, 0777, function() {
				if(path.extname(output) == '.js') {
					fileContent = getUglified(fileContent.join(EOLEOL), info)
				} else if(path.extname(output) == '.css' && compressCss) {
					fileContent = cssmin(fileContent.join(EOLEOL))
				} else {
					fileContent = fileContent.join(EOLEOL)
				}
				writeFileSync(output, fileContent, charset)
				log('Done!')
				callback()
			})
		}
	})()
}

function copyOne(info, callback) {
	if(!checkCondition(info.condition)) {
		callback()
		return
	}
	if(!info.input) {
		printLine()
		log('Copy')
		throw new Error('Input not defined!')
	}
	if(!info.output) {
		printLine()
		log('Copy')
		throw new Error('Output not defined!')
	}
	var filterRegexp = info.regexp
	var input = path.resolve(buildDir, info.input)
	var output = path.resolve(buildDir, outputBasePath, info.output)
	var outputDir = path.dirname(output)
	var copyList, content
	if(input == output) {
		return
	}
	if(fs.statSync(input).isDirectory()) {
		copyList = fs.readdirSync(input)
		copy()
	} else {
		printLine()
		log('Copy')
		log('Input: ' + input)
		log('Output: ' + output)
		if(!isSrcDir(outputDir)) {
			throw new Error('Output to src dir denied!')
		}
		mkdirs(outputDir, 0777, function() {
			if((/\.(js|css|html|htm)$/).test(input)) {
				content = replaceProperties(fs.readFileSync(input, charset), properties)
				writeFileSync(output, content, charset)
			} else {
				writeFileSync(output, fs.readFileSync(input))
			}
			log('Done!')
			callback()
		})
	}
	function copy() {
		var inputFile, outputFile
		if(copyList.length) {
			inputFile = path.resolve(input, copyList.shift())
			outputFile = path.resolve(output, path.basename(inputFile))
			if(filterRegexp && !new RegExp(filterRegexp).test(inputFile) && !fs.statSync(inputFile).isDirectory() || inputFile == output || path.relative(output, inputFile).indexOf('..') != 0 || path.relative(inputFile, output).indexOf('..') != 0) {
				copy()
			} else {
				copyOne(utils.extendObject(utils.cloneObject(info), {input: inputFile, output: outputFile}), function() {
					copy()
				})
			}
		} else {
			callback()
		}
	}
}

printLine('+')
log('Start! Time: ' + startTime)
fs.exists(buildFileName, function(exists) {
	var argProperties = args.properties
	if(argProperties) {
		argProperties = JSON.parse(argProperties)
	}
	if(exists) {
		fs.readFile(buildFileName, charset, function(err, data) {
			var buildJson
			if(err) {
				throw err
			}
			try {
				eval(getUglified('buildJson = ' + data, {uglify: -1, copyright: ' '}))//remove comments in json
				buildJson.builds = buildJson.builds || DEFAULT_BUILD_JSON.builds
				properties = utils.extendObject(buildJson.properties, argProperties)
			} catch(e) {
				printLine()
				throw new Error('Illegal json format build file!' + EOL + e.toString())
			}
			start(buildJson)
		})
	} else {
		properties = argProperties
		start(DEFAULT_BUILD_JSON)
	}
	function start(buildJson) {
		var combineList, buildList, copyList
		outputBasePath = utils.getDefinedItem([args['output-base-path'], buildJson.outputBasePath, outputBasePath])
		globalUglifyLevel = utils.getDefinedItem([args['uglify'], buildJson.uglify, globalUglifyLevel])
		globalBuildNodeTpl = utils.getDefinedItem([args['build-node-tpl'], buildJson.buildNodeTpl, globalBuildNodeTpl])
		globalCssmin = utils.getDefinedItem([args['cssmin'], buildJson.cssmin], globalCssmin)
		globalCompressHtml = utils.getDefinedItem([args['compress-html'], buildJson.compressHtml, globalCompressHtml])
		globalCompressHtmlOptions = utils.getDefinedItem([args['compress-html-options'], buildJson.compressHtmlOptions, globalCompressHtmlOptions])
		globalExclude = utils.getDefinedItem([utils.getHashFromString(args['exclude']) || undefined, buildJson.exclude, globalExclude])
		globalCopyright = buildJson.copyright || globalCopyright
		combineList = buildJson.combines || []
		buildList = buildJson.builds || []
		copyList = buildJson.copies || []
		if(buildJson.lang) {
			lang.getLangResource(path.resolve(buildDir, buildJson.lang.base), function(res) {
				langResource = res
				doStart()
			})
		} else {
			doStart()
		}
		function doStart() {
			if(buildJson.beginHook) {
				require(path.join(buildDir, buildJson.beginHook)).init(buildDir, function(err) {
					if(err) {
						throw err
					} else {
						combine()
					}
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
				build()
			}
		}
		function build() {
			if(buildList.length) {
				buildOne(buildList.shift(), function() {
					build()
				})
			} else {
				copy()
			}
		}
		function copy() {
			if(copyList.length) {
				copyOne(copyList.shift(), function() {
					copy()
				})
			} else {
				end()
			}
		}
		function end() {
			if(buildJson.endHook) {
				require(path.join(buildDir, buildJson.endHook)).init(buildDir, function(err) {
					if(err) {
						throw err
					} else {
						exit()
					}
				})
			} else {
				exit()
			}
		}
	}
})
