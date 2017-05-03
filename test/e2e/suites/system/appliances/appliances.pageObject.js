// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
// Represents the System Appliances page at: /#/system/appliance_list

var HamburgerMenu = require('../../common/hamburger_menu.pageObject.js');

var Appliances = function() {

  var navigate = new HamburgerMenu();

  this.get = function() {
    navigate.get_page('/#/system/appliance_list');
  };
};

module.exports = Appliances;
