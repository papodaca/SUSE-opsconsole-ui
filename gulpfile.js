// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
'use strict';

var gulp = require('gulp');

require('require-dir')('./gulp');

gulp.task('default', ['clean'], function () {
    gulp.start('server');
});
