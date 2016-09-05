module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
    	build: {
    		src: ['src/util.js', 'src/lang.js', 'src/dom.js', 'src/model.js', 'src/parser.js', 'src/directive.js', 'src/compiler.js',
    		        'src/http.js', 'src/api.js', 'src/interceptor.js',
    		        'src/directives/*.js', 'src/hash.js', 'src/filters.js'],
    		dest: 'dist/<%= pkg.name %>.js'
    	}
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
    	  files: {
    		  'dist/<%= pkg.name %>-shim.min.js': 'src/<%= pkg.name %>-shim.js',
    		  'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.js' 
    	  }
      }
    },
    devserver: {server: {}},
    watch: {
      js: {
        files: ['src/{,*/}*.js', 'Gruntfile.js'],
        tasks: ['jshint', 'concat']
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        'src/{,*/}*.js',
        'src/vendor/*',
        'test/spec/{,*/}*.js'
      ]
    },
    karma: {
      unit: {
        options: {
          files: [
            'bower_components/jquery/dist/jquery.js',
            'bower_components/jasmine-jquery/lib/jasmine-jquery.js',
            'bower_components/qjasmine-jquery/lib/jasmine-jquery.js',
            'src/lang.js', 'src/dom.js', 'src/model.js', 'src/directive.js', 'src/compiler.js',
            'src/http.js', 'src/api.js', 'src/interceptor.js',
            'src/directives/*.js', 'src/hash.js',
            {pattern: 'test/**/*.html', watched: true, served: true, included: false},
            {pattern: 'test/**/*.js', watched: true, served: true, included: true},
              'test/test.js'
          ]
        },
        frameworks: ['jasmine', 'qunit'],
        runnerPort: 9999,
        singleRun: false,
        preprocessors: {
          '**/*.html': []
        },
        browsers: [
          //'PhantomJS',
          'Chrome',
          //'Firefox', 'Safari'
        ],
        logLevel: 'DEBUG',
        autoWatch: true,
        plugins: [
          'karma-jasmine',
          'karma-chrome-launcher',
          'karma-firefox-launcher',
          'karma-safari-launcher',
          'karma-junit-reporter',
          'karma-qunit',
          'karma-commonjs'
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-devserver');

  grunt.registerTask('default', ['concat', 'uglify', 'test', 'watch']);
  grunt.registerTask('test', ['karma']);
};
