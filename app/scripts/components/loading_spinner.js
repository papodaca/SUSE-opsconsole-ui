// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function(){
    'use strict';

    angular.module('operations-ui').directive("ocloading", [
        function() {
            return {
                restrict: "E",
                scope: {},
                templateUrl: 'components/loading_spinner.html'
            };
        }
    ]);
})();