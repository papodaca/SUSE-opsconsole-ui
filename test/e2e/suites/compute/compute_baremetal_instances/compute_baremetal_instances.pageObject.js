// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
// Represents the Compute Baremetal Instances page at: /#/compute/baremetal_instances

var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');

var ComputeBaremetalInstances = function() {

  var navigate = new HamburgerMenu();

  this.get = function() {
    navigate.get_page('/#/compute/baremetal_instances');
  };
};

module.exports = ComputeBaremetalInstances;
