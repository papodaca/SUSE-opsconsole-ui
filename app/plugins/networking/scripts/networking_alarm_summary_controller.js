// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('NetworkingAlarmSummaryController', ['$scope',
        function ($scope) {
            //this is a dummy controller which just passes the service keys
            //actual handling is in alarm_summary_directive.js
            $scope.alarmServices = [
                'bind', 'dns', 'powerdns', 'networking'
            ];
        }
    ]);
})(angular);
