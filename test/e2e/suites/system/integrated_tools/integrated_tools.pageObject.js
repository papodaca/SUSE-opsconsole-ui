// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
// Represents the System Integrated Tools page at: /#/system/integrated_tools

var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');

var IntegratedTools = function() {

  var navigate = new HamburgerMenu();

  this.get = function() {
    navigate.get_page('/#/system/integrated_tools');
  };
};

module.exports = IntegratedTools;
