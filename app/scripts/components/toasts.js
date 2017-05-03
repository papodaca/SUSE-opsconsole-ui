// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function (ng) {
  'use strict';

  ng.module('operations-ui').directive('ocToasts', ['ToastNotifications', function(ToastNotifications) {
    return {
      restrict: "E",
      templateUrl: "components/toasts.html",
      scope: {
        "notifications": "="
      },
      link: function(scope, element, attributes, ngModel) {
        scope.close = ToastNotifications.removeToast;
      }
    };
  }]);
})(angular);
