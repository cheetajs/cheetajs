module.exports = function(grunt) {
  grunt.option('color', false);
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
    	build: {
    		src: ['src/lang.js', 'src/dom.js', 'src/model.js', 'src/directive.js', 'src/compiler.js',
    		        'src/http.js', 'src/api.js', 'src/interceptor.js',
    		        'src/directives/*.js', 'src/hash.js'],
    		dest: 'dist/<%= pkg.name %>.js'
    	}
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
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
        files: ['src/{,*/}*.js'],
        tasks: ['jshint', 'concat', 'uglify']
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
    }
  });

  grunt.loadNpmTasks('grunt-devserver');

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['concat', 'uglify', 'watch']);

};
