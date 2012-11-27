/**
 * YOM module builder watcher
 * Copyright (c) 2012 Gary Wang, webyom@gmail.com http://webyom.org
 * Under the MIT license
 * https://github.com/webyom/yom
 */

var fs = require('fs')
var path = require('path')
var exec = require('child_process').exec

var BUILD_CONF_FILE_NAME = 'build.json'

var watchDirPath = path.resolve(process.cwd(), process.argv[2] || './')
var builderPath = path.join(path.dirname(path.resolve(process.cwd(), process.argv[1])), 'builder.js')
var includeDir = null
var excludeDir = null
var building = false

//init includeDir and excludeDir
;(function() {
	var i
	var arg = process.argv[3]
	if(arg) {
		if((/^include=/).test(arg)) {
			includeDir = {}
			arg = arg.replace(/^include=/, '').replace(/\s+$/, '').split(/\s*,\s*/)
			for(i = 0; i < arg.length; i++) {
				includeDir[path.resolve(watchDirPath, arg[i])] = 1
			}
		} else if((/^exclude=/).test(arg)) {
			excludeDir = {}
			arg = arg.replace(/^exclude=/, '').replace(/\s+$/, '').split(/\s*,\s*/)
			for(i = 0; i < arg.length; i++) {
				excludeDir[path.resolve(watchDirPath, arg[i])] = 1
			}
		}
	}
})()

function getConfPath(dir) {
	var res = path.join(dir, BUILD_CONF_FILE_NAME)
	return fs.existsSync(res) && res
}

function isValidDir(dir) {
	if(excludeDir && excludeDir[dir]) {
		return false
	}
	return fs.statSync(dir).isDirectory() && !(/^\.|~$/).test(path.basename(dir))
}

function watch(dir, confPath) {
	if(isValidDir(dir)) {
		if(includeDir) {
			if(includeDir[dir]) {
				includeDir[dir] = 0
			} else {
				return
			}
		}
		confPath = getConfPath(dir) || confPath
		if(confPath) {
			console.log('Watching Dir: ' + dir)
			fs.watch(dir, function(evt, file) {
				if((evt == 'change' || evt == 'rename') && !building) {
					building = true
					console.log('Building ' + confPath + ' at ' + new Date())
					exec('node ' + builderPath + ' ' + confPath, function(err, stdout, stderr) {
						building = false
						if(err) {
							console.log(err)
						} else {
							console.log('Done!')
						}
					})
				}
			})
		}
	}
}

function traversalWatch(dir, confPath, callback) {
	if(isValidDir(dir)) {
		confPath = getConfPath(dir) || confPath
		watch(dir, confPath)
		fs.readdir(dir, function(err, files) {
			var i, file
			var cbcount = 0
			if(!files || !files.length) {
				callback()
				return
			}
			for(i = 0; i < files.length; i++) {
				traversalWatch(path.join(dir, files[i]), confPath, function() {
					cbcount++
					if(cbcount == files.length) {
						callback()
					}
				})
			}
		})
	} else {
		callback()
	}
}

traversalWatch(watchDirPath, getConfPath(watchDirPath), function() {
	for(var dir in includeDir) {
		if(includeDir[dir]) {
			watch(dir, getConfPath(watchDirPath))
		}
	}
})
