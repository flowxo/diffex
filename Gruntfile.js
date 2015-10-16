'use strict';

module.exports = function (grunt) {

  var pkg = grunt.file.readJSON('package.json');

  // Load grunt tasks automatically, when needed
  require('jit-grunt')(grunt, {
    buildcontrol: 'grunt-build-control',
    browserify: 'grunt-browserify'
  });

  grunt.initConfig({
    clean: {
      editor: ['dist']
    },
    copy: {
      editor: {
        files: {
          'dist/index.html': ['editor/index.html']
        }
      }
    },

    browserify: {
      options: {
        alias: {
          'diffex': './lib/index.js'
        }
      },
      editor: {
        files: {
          'dist/bundle.js': ['lib/*.js', 'editor/*.js']
        }
      }
    },

    uglify: {
      editor: {
        src: 'dist/bundle.js',
        dest: 'dist/bundle.min.js'
      }
    },

    buildcontrol: {
      options: {
        dir: 'dist',
        commit: true,
        push: true,
        connectCommits: false,
        message: 'Built live editor from commit %sourceCommit%'
      },
      editor: {
        options: {
          remote: 'git@github.com:flowxo/diffex.git',
          branch: 'gh-pages',
        }
      }
    },
  });

  grunt.registerTask('build', ['clean', 'copy', 'browserify', 'uglify']);
  grunt.registerTask('deploy', ['build', 'buildcontrol']);
};
