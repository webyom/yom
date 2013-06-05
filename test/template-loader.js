exports.process = function(grunt, task, context) {
	var source = grunt.file.read(context.options.templateFile);
	return source;
};
