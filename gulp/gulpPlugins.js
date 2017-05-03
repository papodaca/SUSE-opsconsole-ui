// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
module.exports = require("gulp-load-plugins")({
    lazy:false,
    pattern: [
    	'gulp-*',
    	'main-bower-files',
    	'event-stream',
    	'del',
    	'run-sequence',
    	'merge-stream'
    ]
});
