// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
/**
 * This is to handle the directive <empty-data-page>
 */
(function(){
    'use strict';
    angular.module('operations-ui').directive("emptyDataPage", [
        '$translate',
        function($translate) {
            return {
                restrict: "E",
                scope: {
                    type: "=",
                    showAttribute: "=",
                    reasonMessage: "=",
                    actionMessage: "=",
                    actionLabel: "=",
                    action:"="
                },
                templateUrl: 'components/empty_data_page.html',

                link: function(scope, el, attr) {
                    scope.doAction = function () {
                        if(angular.isDefined(scope.action)) {
                            scope.action();
                        }
                        scope.showAttribute = false;
                    };
                }
            };
        }
    ]);
})();