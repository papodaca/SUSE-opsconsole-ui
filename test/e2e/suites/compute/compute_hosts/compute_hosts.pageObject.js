// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
// Represents the Compute Hosts page at: /#/compute/compute_nodes

var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');

var ComputeHosts = function() {

  var navigate = new HamburgerMenu();

  this.get = function() {
    navigate.get_page('/#/compute/compute_nodes');
  };
};

module.exports = ComputeHosts;
