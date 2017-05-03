// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function (ng) {
  'use strict';

  ng.module('operations-ui').directive('ocCheckbox', function() {
    return {
      restrict: "E",
      require: "ngModel",
      templateUrl: "components/oc_checkbox.html",
      scope: {
          "hpDisabled": "&",
          "disabledClear": "&"
      },
      link: function(scope, element, attributes, ngModel) {
        scope.value = ngModel.$modelValue || true;

        scope.$watch(function() {
          return ngModel.$modelValue;
        }, function() {
          scope.value = ngModel.$viewValue;
        });

        if(scope.disabledClear && scope.disabledClear()) {
          scope.$watch(function() {
            return scope.hpDisabled();
          }, function() {
            if(scope.hpDisabled()) {
              ngModel.$setViewValue(false);
            }
          });
        }

        scope.$watch('value', function() {
          ngModel.$setViewValue(scope.value);
        });
      }
    };
  });
})(angular);
