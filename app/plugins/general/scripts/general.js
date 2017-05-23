// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';

    var p = ng.module('plugins');

    p.factory('general', ['pluginBase', function() {
        return [
            {
                type: 'menu',
                slug: 'general',
                envs: ['cs', 'hos'],
                needBllPlugins: ['monitor', 'preferences'],
                label: 'general.home',
                icon: 'Home',
                order: 1,
                children: [
                    {
                        type: 'controller',
                        envs: ['hos', 'cs'],
                        needBllPlugins: ['monitor', 'preferences'],
                        controllerName: "CentralDashboardPageController",
                        path: '/dashboard_alarms_summary',//to change this path need to change the cloud_system.json in ansible
                        template: 'central_dashboard.html',
                        label: window.appConfig && window.appConfig.env === 'hos' ? 'general.dashboardsummary' : 'general.alarmsdashboard',
                        order: 1
                    },
                    {
                        type: 'controller',
                        envs: ['cs', 'hos'],
                        //don't need bll plugins
                        controllerName: "LoggingController",
                        path: '/logging',
                        template: 'logging.html',
                        label: 'general.loggingtitle',
                        order: 4
                    }
                ]
            }
        ];
    }]);
})(angular);
