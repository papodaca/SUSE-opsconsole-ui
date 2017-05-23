// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
  'use strict';

  var p = ng.module('plugins');

  p.factory('compute', ['pluginBase', function() {
    return [
      {
        slug: 'compute',
        envs: ['cs', 'hos'],
        needBllPlugins: ['compute','nova', 'monitor', 'ace', 'ironic', 'baremetal'],
        type: 'menu',
        label: 'compute.main_menu',
        icon: 'Chip',
        order:2,
        children: [
          {
            type: 'controller',
            envs: ['hos', 'cs'],
            needBllPlugins: ['monitor'],
            controllerName: "ComputeSummaryPageController",
            path: '/compute_alarm_summary',
            template: 'compute_summary_container.html',
            order: 1,
            label: 'compute.compute_alarm_summary.menu'
          },
          {
            type: 'controller',
            envs: ['cs'],
            needBllPlugins: ['ace','baremetal'],
            bllPluginsOrOp: true, //do OR operation on the plugins
            controllerName: "HardwarePageController",
            path: '/hardware',
            template: 'hardware/hardware.html',
            order: 2,
            label: 'compute.hardware.menu'
          },
          {
            type: 'controller',
            envs: ['hos'],
            needBllPlugins: ['compute'],
            controllerName: "ComputeNodesHLMController",
            path: '/compute_nodes',
            template: 'compute_nodes.html',
            order: 2,
            label: 'compute.compute_nodes.menu'
          },
          {
            type: 'controller',
            envs: ['hos', 'cs'],
            needBllPlugins: ['nova', 'monitor'],
            controllerName: "ComputeInstancesController",
            path: '/compute_instances',
            template: 'computeinstances/compute_instances.html',
            order: 3,
            label: 'compute.compute_instances.menu'
          },
          {
            type: 'controller',
            envs: ['hos'],
            needBllPlugins: ['nova', 'monitor', 'ironic'],
            controllerName: "ComputeBaremetalInstancesController",
            path: '/baremetal_instances',
            template: 'baremetalinstances/compute_baremetal_instances.html',
            order: 4,
            label: 'compute.baremetal.instance.menu'
          }
        ]
      }
    ];
  }]);
})(angular);
