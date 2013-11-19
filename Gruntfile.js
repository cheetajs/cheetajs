module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
    	build: {
    		src: ['src/compiler.js', 'src/bind.js', 'src/eval.js', 'src/template.js', 'src/location.js'],
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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['concat', 'uglify']);

};
