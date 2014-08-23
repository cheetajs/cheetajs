module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
    	build: {
    		src: ['src/dom.js', 'src/model.js', 'src/directive.js', 'src/compiler.js', 'src/http.js', 'src/directives/*.js', 'src/hash.js'],
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
    devserver: {server: {}}
  });

  grunt.loadNpmTasks('grunt-devserver');

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['concat', 'uglify']);

};
