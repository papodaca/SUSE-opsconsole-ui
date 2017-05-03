// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
// Represents the Compute Instances page at: /#/compute/compute_instances

var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');

var ComputeInstances = function() {

  var navigate = new HamburgerMenu();

  this.get = function() {
    navigate.get_page('/#/compute/compute_instances');
  };
};

module.exports = ComputeInstances;
