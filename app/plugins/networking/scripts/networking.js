// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function (ng) {
  'use strict';

  var p = ng.module('plugins');

  p.factory('networking', ['pluginBase', function() {
    return [
      {
        slug: 'networking',
        envs: ['cs', 'hos'],
        needBllPlugins: ['monitor', 'sys_sum', 'user_group'],
        type: 'menu',
        label: 'networking.main_menu',
        icon: 'Networking',
        order:4,
        children: [
          {
            type: 'controller',
            envs: ['hos', 'cs'],
            needBllPlugins: ['monitor'],
            controllerName: "NetworkingSummaryPageController",
            path: '/networking_summary',
            template: 'networking_summary.html',
            order: 0,
            label: 'networking.alarm_summary.menu'
          }
        ]
      },
    ];
  }]);
})(angular);
