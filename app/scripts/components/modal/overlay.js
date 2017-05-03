// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function(ng) {
    'use strict';

    ng.module('operations-ui').directive("modalOverlay", [
        function () {
            return {
                restrict: "E",
                scope: {
                  showAttribute: "=",
                  longWaitLogout: "="
                },
                templateUrl: 'components/modal/overlay.html'
            };
        }
    ]);
})(angular);
