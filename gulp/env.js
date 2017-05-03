// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
var fs = require('fs');

var envBaseDir = './envs';

var envs = fs.readdirSync(envBaseDir);

envs = envs.map(function(env) {
  var env_file = fs.readFileSync(envBaseDir + "/" + env, {encoding: "utf-8"});
  return {
    name: env.split(".")[0],
    config: JSON.parse(env_file)
  };
});

module.exports = envs;
