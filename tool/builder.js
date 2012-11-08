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
var buildFileName = process.argv[2] || 'build.json';
var buildDir = path.dirname(path.resolve(process.cwd(), buildFileName));
var logs = [];

function exit(code) {
	fs.writeFileSync(path.resolve(buildDir, 'build.log'), logs.join('\n'), 'utf-8');
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

function getDeps(def, exclude, globalExclude) {
	var deps = [];
	var got = {};
	var depArr = def.match(/\bdefine\s*\([^\[]*?(\[[^\]]*?\])/);
	depArr = depArr && depArr[1];
	exclude = exclude || {};
	globalExclude = globalExclude || {};
	depArr && depArr.replace(/["'](\.[^"'\s]+)["']/g, function(m, dep) {
		got[dep] || exclude[dep] || globalExclude[dep] || /\.js$/.test(dep) || deps.push(dep);
		got[dep] = 1;
	});
	def.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/mg, '')//remove comments
		.replace(/\brequire\s*\(\s*["'](\.[^"'\s]+)["']\s*\)/g, function(m, dep) {//extract dependencies
			got[dep] || exclude[dep] || globalExclude[dep] || /\.js$/.test(dep) || deps.push(dep);
			got[dep] = 1;
		});
	return deps;
};

function isLegalOutputDir(outputDir) {
	if(/\/_?src(\/|$)/.test(outputDir)) {//TODO
		return false;
	}
	return true;
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
	log('Input: ' + input);
	log('Output: ' + output);
	if(!isLegalOutputDir(outputDir)) {
		throw new Error('Output to src dir denied!');
	}
	fs.readFile(input, 'utf-8', function(err, content) {
		if(err) {
			throw err;
		}
		var deps = getDeps(content, info.exclude, exclude);
		var fileName, fileContent = [];
		while(deps.length) {
			fileName = path.resolve(inputDir, deps.shift() + '.js');
			log('Merging: ' + fileName);
			fileContent.push(fs.readFileSync(fileName, 'utf-8'));
		}
		fileContent.push(content);
		log('Merging: ' + input);
		log('Writing: ' + output);
		mkdirs(outputDir, 0777, function() {
			fs.writeFileSync(output, fileContent.join('\n\n'), 'utf-8');
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
	var fileName, fileContent = [];
	log('Output: ' + output);
	if(!isLegalOutputDir(outputDir)) {
		throw new Error('Output to src dir denied!');
	}
	while(info.inputs.length) {
		fileName = path.resolve(buildDir, info.inputs.shift());
		log('Merging: ' + fileName);
		fileContent.push(fs.readFileSync(fileName, 'utf-8'));
	}
	log('Writing: ' + output);
	mkdirs(outputDir, 0777, function() {
		fs.writeFileSync(output, fileContent.join('\n\n'), 'utf-8');
		log('Done!');
		callback();
	});
};

fs.readFile(buildFileName, 'utf-8', function(err, data) {
	if(err) {
		throw err;
	}
	var buildJson, buildList, buildTotal, combineList, combineTotal;
	try {
		buildJson = JSON.parse(data);
	} catch(e) {
		throw new Error('Illegal json format build file!\n' + e.toString());
	}
	buildList = buildJson.builds || [];
	buildTotal = buildList.length;
	combineList = buildJson.combines || [];
	combineTotal = combineList.length;
	printLine('+');
	log('Start! Time: ' + startTime);
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
