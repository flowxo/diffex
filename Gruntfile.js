'use strict';

module.exports = function (grunt) {

  // Load grunt tasks automatically, when needed
  require('jit-grunt')(grunt, {
    buildcontrol: 'grunt-build-control'
  });

  grunt.initConfig({
    clean: {
      demo: ['build']
    },
    copy: {
      demo: {
        files: {
          'build/index.html': ['demo/index.html']
        }
      }
    },

    browserify: {
      options: {
        alias: {
          'diffex': './lib/index.js'
        }
      },
      demo: {
        files: {
          'build/bundle.js': ['demo/index.js']
        },
        options: {
          watch: true
        }
      }
    },

    connect: {
      dev: {
        options: {
          base: 'build',
          hostname: 'localhost',
          port: 3000,
          livereload: true
        }
      }
    },

    watch: {
      dev: {
        files: 'build/bundle.js',
        options: {
          livereload: true
        }
      }
    },

    buildcontrol: {
      options: {
        dir: 'build',
        commit: true,
        push: true,
        connectCommits: false,
        message: 'Built live demo from commit %sourceCommit%'
      },
      demo: {
        options: {
          remote: 'git@github.com:flowxo/diffex.git',
          branch: 'gh-pages',
        }
      }
    },
  });

  grunt.registerTask('build', ['clean', 'copy', 'browserify']);
  grunt.registerTask('serve', ['build', 'connect', 'watch']);
  grunt.registerTask('deploy', ['build', 'buildcontrol']);
  grunt.registerTask('default', ['serve']);
};
