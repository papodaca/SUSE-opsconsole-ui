// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function (ng) {
    'use strict';

    var p = ng.module('plugins');

    p.directive('clickProxy', function() {
      return {
        restrict: "A",
        link: function(scope, el, attrs) {
          el.on('click', function (event) {
            el.parent().find(attrs.clickProxy).click();
          });
        }
      };
    });

})(angular);
