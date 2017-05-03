// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function (ng) {
  'use strict';

  var p = ng.module('plugins');

  p.factory('storage', ['pluginBase', function() {
    return [
      {
        slug: 'storage',
        envs: ['cs','hos'],
        needBllPlugins: ['monitor', 'block_device', 'objectstorage_summary'],
        type: 'menu',
        label: 'storage.menu',
        icon: 'Storage',
        order:3,
        children: [
          {
            type: 'controller',
            envs: ['hos', 'cs'],
            needBllPlugins: ['monitor'],
            controllerName: "BlockStoragePageController",
            path: '/block_storage_summary',
            template: 'block_storage_summary.html',
            order: 1,
            label: 'storage.alarm_summary.menu'
          },
          {
            type: 'controller',
            envs: ['cs'],
            needBllPlugins: ['block_device'],
            controllerName: "BlockStorageController",
            path: '/block_storage',
            template: 'block_storage.html',
            order: 3,
            label: 'storage.block_storage.menu'
          },
          {
            type: 'controller',
            envs: ['hos','cs'],
            needBllPlugins: ['monitor', 'objectstorage_summary'],
            controllerName: "ObjectStoragePageController",
            path: '/object_storage_summary',
            template: 'object_storage.html',
            order: 2,
            label: 'storage.object_storage.menu'
           }
        ]
      },
    ];
  }]);
})(angular);
