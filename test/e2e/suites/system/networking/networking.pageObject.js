// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
// Represents the System Networking page at: /#/system/system_networking

var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');

var SystemNetworking = function() {

  var navigate = new HamburgerMenu();

  this.get = function() {
    navigate.get_page('/#/system/system_networking');
  };
};

module.exports = SystemNetworking;
