// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function(ng) {
  'use strict';
  var p = ng.module('plugins');

  p.controller('helion_icon_example', ['$scope',
      function ($scope) {
        $scope.icons = Object.keys(document.styleSheets).map(function(styleIndex) {
          var style = document.styleSheets[styleIndex];
          return Object.keys(style.cssRules).map(function(ruleIndex) {
             return style.cssRules[ruleIndex].selectorText;
          });
        }).reduce(function(a,b) {
          return a.concat(b);
        }).filter(function(rule) {
          return !!rule && !!/\.helion-icon-(.+)::before/.exec(rule);
        }).map(function(rule) {
          var matches = /\.helion-icon-(.+)::before/.exec(rule);
          return matches[1];
        });
    }
  ]);

})(angular);
