(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('HardwarePageController', ['$scope','$rootScope',
        function ($scope, $rootScope) {
            $scope.hardwareTabbedPages = [{
                header: 'compute.hardware.tab.header',
                template: 'compute/templates/hardware/oneview_servers.html',
                tabname: 'hardwareoneview'
            }];

            //"is_foundation_installed":"True" in cloud_system.json
            //show baremetal tab
            if($rootScope.appConfig &&
               angular.isDefined($rootScope.appConfig.is_foundation_installed) && (
                $rootScope.appConfig.is_foundation_installed === "true"  ||
                $rootScope.appConfig.is_foundation_installed === "True"  ||
                $rootScope.appConfig.is_foundation_installed === true)) {
                    $scope.hardwareTabbedPages.push({
                         header: 'compute.header.baremetal',
                         template: 'compute/templates/hardware/bare_metal.html',
                         tabname: 'hardwarebaremetal'
                    });
            }
        }
    ]);
})(angular);