// (c) Copyright 2017 Hewlett Packard Enterprise Development LP
(function (ng) {
    'use strict';

    var p = ng.module('plugins');

    p.factory('system', ['pluginBase', function() {
        return [
            {
                type: 'menu',
                envs: ['cs', 'hos'],
                needBllPlugins: [
                    'ace', 'attis', 'cinder', 'ardana', 'monitor', 'sirius',
                    'user_group','vcenters'
                ],
                slug: 'system',
                label: 'system.home',
                icon: 'System',
                order: 9,
                children: [
                    {
                        type: 'controller',
                        envs: ['cs'],
                        needBllPlugins: ['ardana'],
                        controllerName: "SystemNetworkingController",
                        path: '/system_networking',
                        template: 'sys_networking/networking.html',
                        label: 'system.networking.label',
                        order: 0
                    },
                    {
                        type: 'controller',
                        envs: ['cs', 'hos'],
                        needBllPlugins: ['monitor'],
                        controllerName: "AppliancesListController",
                        path: '/appliance_list',
                        template: 'appliance_list/appliance_list.html',
                        label: 'system.applianceslistlabel',
                        order: 1
                    },
                    {
                        type: 'controller',
                        envs: ['cs'],
                        needBllPlugins: ['vcenters', 'cinder', 'ace', 'sirius'],
                        bllPluginsOrOp: true, //do OR operation on the plugins
                        controllerName: "IntegratedToolsController",
                        path: '/integrated_tools',
                        template: 'integrated_tools.html',
                        label: 'system.integratedtoolslabel',
                        order: 2
                    },
                    {
                        type: 'controller',
                        envs: ['cs'],
                        needBllPlugins: ['attis'],
                        controllerName: "BackupRestoreController",
                        path: '/backup_restore',
                        template: 'backup_restore/backuprestore.html',
                        label: 'system.backuprestorelabel',
                        order: 3
                    }
                ]
            }
        ];
    }]);
})(angular);
