// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function (ng) {
    'use strict';

    var p = ng.module('plugins');

    p.controller('BkRstJobTaskController', ['$scope', '$translate',
        function ($scope, $translate) {
            $scope.jobTaskTableConfig = {
                headers: [
                    {
                        name: $translate.instant('system.backuprestore.joblist.jobname'),
                        type: 'string',
                        sortfield: 'name',
                        displayfield: 'name'
                    },
                    {
                        name: $translate.instant('system.backuprestore.joblist.tasks.host'),
                        type: 'string',
                        sortfield: 'appliance',
                        displayfield: 'appliance'
                    },
                    {
                        name: $translate.instant('system.backuprestore.joblist.tasks.status'),
                        type: 'string',
                        sortfield: 'state',
                        displayfield: 'state',
                        filterOptions: [{
                            displayLabel: $translate.instant('system.filter.state.completed'),
                            value: 'Completed'
                        },{
                            displayLabel: $translate.instant('system.filter.state.waiting'),
                            value: 'waiting'
                        },{
                            displayLabel: $translate.instant('system.filter.state.failed'),
                            value: 'Failed'
                        }]
                    },
                    /*{//not in the present mock data // after ATTIS-140 may need to be in expanded row section
                        name: $translate.instant('system.backuprestore.joblist.tasks.details'),
                        type: 'string',
                        sortfield: 'details',
                        displayfield: 'details'
                    },*/
                    {
                        name: $translate.instant('system.backuprestore.joblist.jobdate'),
                        type: 'string',
                        sortfield: 'date_modified',
                        displayfield: 'date_modified'//,
                        //type: 'number',
                        //sortfield: 'date',
                        //displayfield: 'date',
                        //filter: 'simpleDateTimeFilter'
                    }
                ],
                filters: [],
                methods:[],

                pageConfig: {
                    page: 1,
                    pageSize: 1000 //temp for now
                }
            };

        }
    ]);
})(angular);
