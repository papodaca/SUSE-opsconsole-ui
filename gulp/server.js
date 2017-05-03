// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
'use strict';

var gulp = require('gulp');

var plugins = require('./gulpPlugins');

var common = require('./common');

gulp.task('wire-deps', function() {
    return gulp.src(['app/bower_components/**/*.js',
             'app/bower_components/**/*.swf',
		     'app/bower_components/**/*.css',
		     'app/bower_components/**/*.png',
		     'app/bower_components/**/*.gif' ])
		.pipe(gulp.dest('.tmp/bower_components'));
});

gulp.task('server', ['build', 'watch', 'wire-deps'], function() {
    plugins.connect.server({
        root: ['.tmp'],
        port: 9000,
        livereload: true,
        middleware: common.middleware
    });
});

gulp.task('server-noreload', ['build', 'watch', 'wire-deps'], function() {
    plugins.connect.server({
        root: ['.tmp'],
        port: 9000,
        livereload: false,
        middleware: common.middleware
    });
});


gulp.task('production', function(){
    plugins.connect.server({
        root: ['dist.cs'],
        port: 9001,
        livereload: false,
        middleware: common.middleware
    });
    plugins.connect.server({
        root: ['dist.hos'],
        port: 9002,
        livereload: false,
        middleware: common.middleware
    });
});
