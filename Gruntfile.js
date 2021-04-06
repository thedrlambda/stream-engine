module.exports = function (grunt) {
  grunt.initConfig({
    ts: {
      default: {
        tsconfig: "./tsconfig.json",
      },
    },
    pkg: grunt.file.readJSON("package.json"),
    concat: {
      options: {
        // define a string to put between each file in the concatenated output
        separator: ";",
      },
      dist: {
        // the files to concatenate
        src: ["client/*.js"],
        // the location of the resulting JS file
        dest: "heroku/public/<%= pkg.name %>.js",
      },
    },
    uglify: {
      options: {
        // the banner is inserted at the top of the output
        banner:
          '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
      },
      dist: {
        files: {
          "heroku/public/<%= pkg.name %>.min.js": ["<%= concat.dist.dest %>"],
        },
      },
    },
    watch: {
      files: ["client/*.ts", "heroku/server.ts"],
      tasks: ["default"],
    },
    browserify: {
      dist: {
        files: {
          "heroku/public/<%= pkg.name %>.js": ["client/*.js"],
        },
        options: {},
      },
    },
  });
  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-browserify");
  grunt.registerTask("default", ["ts", "browserify", "uglify"]);
};
