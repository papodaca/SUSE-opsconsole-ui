// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function() {
    'use strict';

    angular.module('operations-ui').directive('dropdowncard',  function () {
        return {
            restrict: "E",
            scope: {
                configname:"="
            },
            templateUrl: "components/drop_down_card.html",
            controller: ['$scope', function ($scope) {
                $scope.$watch('configname', function(){
                    $scope.dataconfig=$scope.configname;
                }, true);
            }]
        };
    });
})();