// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function (ng) {
  'use strict';

  ng.module('operations-ui').directive('ocApplicationNotifications', ['ApplicationNotifications', function(ApplicationNotifications) {
    return {
      restrict: "E",
      templateUrl: "components/application_notifications.html",
      scope: {
          "notifications": "="
      },
      link: function(scope, element, attributes, ngModel) {
          scope.remove = ApplicationNotifications.remove;
      }
    };
  }]);
})(angular);
