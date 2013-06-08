/*
 * YOM
 *
 * Copyright (c) 2013 webyom.org
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    outputBasePath: '<%=grunt.option("yomb-output-base-path") || "./"%>',

    jshint: {
      all: [
        'Gruntfile.js',
        'src/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    watch: {
      all: {
        files: [
          '**/*.html',
          '**/*.js',
          '**/*.css',
          '**/*.less'
        ],
        tasks: [
          'yomb:build-all',
          'yomb:concat-all',
          'yomb:copy-all'
        ]
      }
    },

    jasmine: {
      all: {
        options: {
          outfile: '<%=outputBasePath%>/test/template/_SpecRunner.html',
          template: require('./test/template-loader'),
          templateOptions: {
            templateFile: '<%=outputBasePath%>/test/template/core.html'
          }
        }
      }
    },

    yomb: {
      options: {
        buildTpl: false,
        buildNodeTpl: false,
        allowSrcOutput: true,
        uglify: 0,
        cssmin: false,
        compressHtml: false,
        /*
         -c, --charset <charset>       Charset for reading files, UTF-8 by default
         --preserve-comments           Preserve comments
         --preserve-multi-spaces       Preserve multiple spaces
         --preserve-line-breaks        Preserve line breaks
         --remove-intertag-spaces      Remove intertag spaces
         --remove-quotes               Remove unneeded quotes
         --simple-doctype              Change doctype to <!DOCTYPE html>
         --remove-style-attr           Remove TYPE attribute from STYLE tags
         --remove-link-attr            Remove TYPE attribute from LINK tags
         --remove-script-attr          Remove TYPE and LANGUAGE from SCRIPT tags
         --remove-form-attr            Remove METHOD="GET" from FORM tags
         --remove-input-attr           Remove TYPE="TEXT" from INPUT tags
         --simple-bool-attr            Remove values from boolean tag attributes
         --remove-js-protocol          Remove "javascript:" from inline event handlers
         --remove-http-protocol        Remove "http:" from tag attributes
         --remove-https-protocol       Remove "https:" from tag attributes
         --remove-surrounding-spaces <min|max|all|custom_list>
        */
        compressHtmlOptions: '--remove-script-attr',
        outputBasePath: '<%=outputBasePath%>',
        protect: ['./src'],
        lang: null,
        properties: {
          cssmin: 'false'
        },
        coffeeOptions: {
          bare: true
        }
      },

      'coffee-all': {
        files: [
          {
            src: './src'
          }
        ]
      },

      'build-test': {
        files: [
          {
            src: './test',
            dest: './test'
          }
        ]
      },

      'build-all': {
        files: [
          {
            src: './src',
            dest: './dest',
            ignore: {
            }
          }
        ]
      },

      'concat-all': {
        files: [
        ]
      },

      'copy-test': {
        files: [
        ]
      },

      'copy-all': {
        files: [
          {
            src: './src',
            dest: './dest',
            regexp: '(\\.jpg|\\.jpeg|\\.gif|\\.png|\\.ico|\\.otf|\\.eot|\\.svg|\\.ttf|\\.woff|-min\\.css|\\.html)$',
            cssmin: false
          }
        ]
      }
    },

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-yomb');

  //
  grunt.registerTask('hint', ['jshint']);
  grunt.registerTask('build', ['yomb:coffee-all', 'yomb:build-all', 'yomb:concat-all', 'yomb:copy-all']);
  grunt.registerTask('test', ['build', 'yomb:build-test', 'yomb:copy-test', 'jasmine']);
  grunt.registerTask('default', ['build']);
};
