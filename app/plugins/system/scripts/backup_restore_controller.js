// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function (ng) {
    'use strict';

    var p = ng.module('plugins');

    p.controller('BackupRestoreController', ['$scope', '$http', '$translate', 'bllApiRequest', 'ocValidators',
        '$filter', 'addNotification', '$timeout', 'isUndefined', 'log',
        function ($scope, $http, $translate, bllApiRequest, ocValidators, $filter,
                  addNotification, $timeout, isUndefined, log) {

            $scope.showBackupLogs = false;
            $scope.showJobList = false;
            $scope.logsForBackupData = [];
            $scope.multiSelectActionData = [];

            $scope.jobTypes = {
                'backup': 'system.backuprestore.job_type.backup',
                'restore': 'system.backuprestore.job_type.restore',
                'recover': 'system.backuprestore.job_type.recover',
                'report': 'system.backuprestore.job_type.report'
            };
            $scope.jobStates = {
                'Completed': 'system.backuprestore.job_state.completed',
                'Failed': 'system.backuprestore.job_state.failed',
                'Partial_Completed': 'system.backuprestore.job_state.partial_completed',
                'In_Progress': 'system.backuprestore.job_state.in_progress',
                'waiting': 'system.backuprestore.job_state.waiting',
                'Unreachable': 'system.backuprestore.job_state.unreachable'
            };
            $scope.bkrstConfig = {
                'admin password name for nova': 'system.backuprestore.config.admin_pass_name_nova',
                'admin tenant name for nova': 'system.backuprestore.config.admin_tenant_name_nova',
                'admin user name for nova': 'system.backuprestore.config.admin_user_name_nova',
                'auth url to connect to keystone': 'system.backuprestore.config.auth_url_connect_keystone',
                'backup database password': 'system.backuprestore.config.backup_db_pass',
                'backup database user': 'system.backuprestore.config.backup_db_user',
                'backup target user': 'system.backuprestore.config.backup_target_user',
                'backup temporary directory': 'system.backuprestore.config.backup_temp_dir',
                'base name of backup file': 'system.backuprestore.config.base_name_backup_file',
                'exclude files from backup': 'system.backuprestore.config.exclude_files_from_backup',
                'exclude files from restore': 'system.backuprestore.config.exlcude_files_from_restore',
                'file backup target user': 'system.backuprestore.config.file_backup_target_user',
                'installation directory of mysql': 'system.backuprestore.config.install_dir_mysql',
                'name of the vertica database to back up': 'system.backuprestore.config.name_vertica_db_backup',
                'name of the vertica database to restore': 'system.backuprestore.config.name_vertica_db_restore',
                'path to existing vbr-compatible configuration file': 'system.backuprestore.config.path_vbr_config_file',
                'path where backups are stored': 'system.backuprestore.config.path_backups_stored',
                'restore target user': 'system.backuprestore.config.restore_target_user',
                'restore temporary directory': 'system.backuprestore.config.restore_temp_dir',
                'specify alternate timestamp (yyyymmdd-hhmmss) to restore': 'system.backuprestore.config.alt_timestamp_restore',
                'target backup temporary directory': 'system.backuprestore.config.target_backup_temp_dir',
                'target file backup path': 'system.backuprestore.config.target_file_backup_path',
                'target file restore path': 'system.backuprestore.config.target_file_restore_path',
                'target restore nodes': 'system.backuprestore.config.target_restore_nodes',
                'target restore temporary directory': 'system.backuprestore.config.target_restore_temp_dir',
                'target temporary directory': 'system.backuprestore.config.target_temp_dir',
                'user on the controller which will execute the playbook': 'system.backuprestore.config.user_controller_playbook',
                'version of nova': 'system.backuprestore.config.version_nova',
                'vertica admin password': 'system.backuprestore.config.vertica_admin_pass',
                'vertica admin user': 'system.backuprestore.config.vertica_admin_user',
                'vertica backup target user': 'system.backuprestore.config.vertica_backup_target_user',
                'vertica installation path': 'system.backuprestore.config.vertica_install_path',
                'vertica restore target user': 'system.backuprestore.config.vertica_restore_target_user'
            };

            //deal with the joblist or view backup logs 's retrieving data
            //last N days request params.
            $scope.lastNDayOptions =  [
                {'value': 1,  'label': 'system.backuprestore.1.day'},
                {'value': 5,  'label': 'system.backuprestore.5.day'},
                {'value': 7,  'label': 'system.backuprestore.7.day'},
                {'value': 14, 'label': 'system.backuprestore.14.day'},
                {'value': 30, 'label': 'system.backuprestore.30.day'},
                {'value': 100,'label': 'system.backuprestore.all.day'}
            ];

            $scope.lastNDaySelection = 5; //default 5 days

            /**
             * track the number of details requests outstanding, details do not come back with the
             * general query, defaults to 0
             * @type {number}
             */
            $scope.detailsWaitingCount = 0;

            /**
             * wrapper to view the tasks for a particular job
             * @param input
             */
            $scope.viewTasks = function (input) {
                $scope.jobListStackableModal.addStack("system/templates/backup_restore/jobtask_drawer.html");
                $scope.getJobTaskData(input);
            };

            /**
             * wrapper to view tasks for a particular resource
             * @param input
             */
            $scope.viewResourceTasks = function(input){
                $scope.getResyncJobTaskData(input);
            };

            /**
             * checking if the valid configs are present to perform an action
             * @param data
             * @param actionName
             */
            $scope.actionMenuPermissionsCheck = function(data, actionName){
                var i = 0;
                var backup_enabled = false;
                var restore_enabled = false;
                var report_enabled = false;
                var recovery_enabled = false;
                var actionPermissions = {
                    enabled: true,
                    hidden: false
                };

                for(i = 0; i < data.configs.length; i++){
                    if(data.configs[i].type === 'backup'){
                        backup_enabled = true;
                    } else if (data.configs[i].type === 'restore'){
                        restore_enabled = true;
                    } else if (data.configs[i].type === 'report'){
                        report_enabled = true;
                    } else if (data.configs[i].type === 'recover'){
                        recovery_enabled = true;
                    }
                }

                if(actionName === 'dobackup'){
                    actionPermissions = {
                        enabled: backup_enabled,
                        hidden: false
                    };
                } else if (actionName === 'dorestore'){
                    actionPermissions = {
                        enabled: restore_enabled,
                        hidden: restore_enabled? false : true
                    };
                } else if (actionName === 'runresyncreport'){
                    //currently run report and run recovery are only supported
                    //for CloudControllerappliancedb. hide the actions for
                    //others
                    actionPermissions = {
                        enabled: report_enabled,
                        hidden: report_enabled ? false : true
                    };
                } else if (actionName === 'runresync'){
                    actionPermissions = {
                        enabled: recovery_enabled,
                        hidden: recovery_enabled ? false : true
                    };
                }

                return actionPermissions;
            };

            $scope.showJobListModal = function() {
                $scope.showJobList = true;
                $scope.jobListDataLoading = true;
                $scope.lastNDaySelection = 5;
                $scope.getJobsListData();
            };

            /**
             * overall configuration for the top level table
             */
            $scope.tableConfig = {
                headers: [
                    {
                        name: $translate.instant('system.backuprestore.field.backupsource'),
                        type: 'string',
                        sortfield: 'flow_name',
                        displayfield: 'flow_name',
                        highlightExpand: true
                    },
                    {
                        name: $translate.instant('system.backuprestore.field.lastbackupdate'),
                        type: 'string',
                        sortfield: 'lastbackupstring',
                        displayfield: 'lastbackupstring'
                    }
                ],


                //since these are selected by default, include them in the list
                filters: [],
                pageConfig: {
                    page: 1,
                    pageSize: 1000 //temp for now
                },
                methods: [],

                actionMenuConfigFunction: $scope.actionMenuPermissionsCheck,
                actionMenuConfig: [
                    {
                        label: $translate.instant('system.backuprestore.menu.configure'),
                        name: 'configure',
                        action: function (data) {
                            $scope.showConfigurationModal = true;
                            $scope.currentBackupConfig = data;
                            $scope.configTableSelectionCount = 0;

                            var configParameters = [];
                            var i = 0, j = 0;
                            var placeHolder;
                            for(i = 0; i < data.configs.length; i++){
                                if (isUndefined(data.configs[i].parameters)) {
                                    continue;
                                }
                                for(j = 0; j < data.configs[i].parameters.length; j++){
                                    placeHolder = {};
                                    placeHolder = data.configs[i].parameters[j];
                                    placeHolder.type = data.configs[i].type;
                                    configParameters.push(placeHolder);
                                }
                            }

                            $scope.configParams = configParameters;
                        }
                    },
                    {
                        label: $translate.instant('system.backuprestore.menu.dobackup'),
                        name: 'dobackup',
                        action: function (data) {
                            $scope.showBackupConfirmation = true;
                            $scope.currentBackupConfig = data;
                        }
                    },
                    {
                        label: $translate.instant('system.backuprestore.global.menu.viewbackuplog'),
                        name: 'viewbackuplog',
                        action: function (data) {
                            $scope.currentBackupConfig = data;
                            $scope.showBackupLogsModal(data);
                        }
                    },
                    {
                        label: $translate.instant('system.backuprestore.menu.dorestore'),
                        name: 'dorestore',
                        action: function (data) {
                            $scope.currentBackupConfig = data;
                            $scope.showRestoreTriggerModal(data);
                        }
                    },
                    {
                        label: $translate.instant('system.backuprestore.menu.runresyncreport'),
                        name: 'runresyncreport',
                        action: function (data) {
                            console.log('runresyncreport triggered on:' + data);
                            //resync report behavior has changed
                            //now needs to trigger the report, then show the jobs modal,
                            //show loading mask while jobs modal loads, then show jobs modal unblocked
                            var report_config, i = 0;
                            for(i = 0; i < data.configs.length; i++){
                                if(data.configs[i].type === 'report'){
                                    report_config = data.configs[i];
                                    break;
                                }
                            }

                            if(angular.isDefined(report_config)) {
                                $scope.sendBllReportRequest(data.flow_name, report_config);
                            } else {
                                addNotification('error', $translate.instant('system.backuprestore.report.errortriggering', data));
                            }

                        }
                    },
                    {
                        label: $translate.instant('system.backuprestore.menu.runresync'),
                        name: 'runresync',
                        action: function (data) {
                            console.log('runresync modal opened on:' + data);

                            //find the matching report config, resync depends on it
                            var report_config, i = 0;
                            for(i = 0; i < data.configs.length; i++){
                                if(data.configs[i].type === 'report'){
                                    report_config = data.configs[i];
                                    break;
                                }
                            }

                            //find the matching resync config, without it we can't do the resync operation
                            var resync_config;
                            for(i = 0; i < data.configs.length; i++){
                                if(data.configs[i].type === 'recover'){
                                    resync_config = data.configs[i];
                                    break;
                                }
                            }

                            //if both configs were found, get the reports to find the latest recovery report
                            if(angular.isDefined(report_config) && angular.isDefined(resync_config)) {
                                $scope.sendBllGetReportsRequest(data.flow_name, report_config, function(report_data){
                                    var most_recent_report;
                                    if(angular.isDefined(report_data) && angular.isDefined(report_data.data) &&
                                        angular.isDefined(report_data.data.recovery_reports)){

                                        // find the most recent report
                                        var last_time_epoch = 0;
                                        for (var idx in report_data.data.recovery_reports) {
                                            var rep = report_data.data.recovery_reports[idx];
                                            if (rep.date_created_epoch > last_time_epoch) {
                                                last_time_epoch = rep.date_created_epoch;
                                                most_recent_report = report_data.data.recovery_reports[idx];
                                            }
                                        }

                                        // check if need to show the warning message if the report timestamp at server
                                        // side shows it is older than 48 hours from now at the client side
                                        // can not use epoch time to compare with utc...difference shows incorrect
                                        // hours
                                        if (angular.isDefined(most_recent_report)) {
                                            if ($scope.checkTimeOlderThan(most_recent_report.date_created, 48)) {
                                                $scope.oldresync = true;
                                            }
                                            else {
                                                $scope.oldresync = false;
                                            }

                                            $scope.currentResyncConfig = {
                                                flow_name: data.flow_name,
                                                config: resync_config,
                                                "report-id": most_recent_report.id,
                                                date_created: most_recent_report.date_created
                                            };
                                            $scope.showResyncActionModal = true;
                                        } else {
                                            addNotification('error', $translate.instant('system.backuprestore.recovery.errortriggering', data));
                                        }
                                    } else {
                                        addNotification('error', $translate.instant('system.backuprestore.recovery.errortriggering', data));
                                    }
                                });
                            } else {
                                addNotification('error', $translate.instant('system.backuprestore.recovery.errortriggering', data));
                            }
                        }
                    }
                ],

                globalActionsConfig: [
                    {
                        label: $translate.instant('system.backuprestore.global.menu.viewjoblist'),
                        name: 'viewjoblist',
                        action: function () {
                            $scope.showJobListModal();
                        }
                    }
                ]
            };

            /**
             * check if the time string is <hours> older
             * @param date_string  formatted date string like "2015-07-30 00:03:51"
             * @param hours the hours to compare
             * @returns {boolean} true if it is older
             */
            $scope.checkTimeOlderThan = function (date_string, hours) {
                var date = new Date();
                var now_sec = date.getTime() / 1000;
                var report_date_string = date_string;
                var report_date = new Date(report_date_string);
                var report_utc_sec = report_date.getTime() / 1000;

                if ( ((now_sec - report_utc_sec) / (60 * 60)) > hours) {
                    return true;
                }
                else {
                    return false;
                }
            };

            $scope.translateJobTypeFilter = function(data) {
                var val = $scope.jobTypes[data.type];
                return (angular.isDefined(val)) ? $translate.instant(val) : data.type;
            };

            $scope.translateJobStateFilter = function(data) {
                var val = $scope.jobStates[data.state];
                return (angular.isDefined(val)) ? $translate.instant(val) : data.state;
            };

            $scope.translateConfigFilter = function(data) {
                var val = $scope.bkrstConfig[(data.label).toLowerCase()];
                return (angular.isDefined(val)) ? $translate.instant(val) : data.label;
            };

            $scope.sanitizedDataFilter = function(data){
                if(data.confidential){
                    return "********";
                } else {
                    return data.value;
                }
            };

            /**
             * config for the configurations table
             */
            $scope.bkrstConfigTableConfig = {
                headers: [
                    {
                        name: $translate.instant('system.backuprestore.config.editsetting.type'),
                        type: 'string',
                        sortfield: 'type',
                        displayfield: 'type',
                        specialColumnType: 'custom',
                        customDisplayFilter: $scope.translateJobTypeFilter
                    },
                    {
                        name: $translate.instant('common.table.headers.name'),
                        type: 'string',
                        sortfield: 'label',
                        displayfield: 'label',
                        specialColumnType: 'custom',
                        customDisplayFilter: $scope.translateConfigFilter
                    },
                    {
                        name: $translate.instant('common.table.headers.value'),
                        type: 'string',
                        sortfield: 'value',
                        displayfield: 'value',
                        specialColumnType: 'custom',
                        customDisplayFilter: $scope.sanitizedDataFilter,
                        isNotHtmlSafe: true
                    }
                ],
                filters: [],
                methods: [],

                multiSelectActionMenuConfig: [
                    {
                        label: $translate.instant('system.backuprestore.config.editsetting'),
                        name: 'editConfig',
                        action: function () {
                            $scope.showEditSettingModal();
                        }
                    }
                ],

                pageConfig: {
                    page: 1,
                    pageSize: 1000 //temp for now
                }
            };

            /**
             * configuration for the jobs table
             */
            $scope.bkrstJobTableConfig = {
                headers: [
                    {
                        name: $translate.instant('system.backuprestore.joblist.jobname'),
                        type: 'string',
                        sortfield: 'name',
                        displayfield: 'name',
                        specialColumnType: 'link',
                        linkAction: $scope.viewTasks
                    },
                    {
                        name: $translate.instant('system.backuprestore.joblist.jobtype'),
                        type: 'string',
                        sortfield: 'type',
                        displayfield: 'type',
                        specialColumnType: 'custom',
                        customDisplayFilter: $scope.translateJobTypeFilter,
                        filterOptions: [
                            {
                                displayLabel: $translate.instant('system.filter.backup.backup'),
                                value: 'backup'
                            },
                            {
                                displayLabel: $translate.instant('system.filter.backup.restore'),
                                value: 'restore'
                            }
                        ]
                    },
                    {
                        name: $translate.instant('system.backuprestore.joblist.jobstate'),
                        type: 'number',
                        sortfield: 'state',
                        displayfield: 'state',
                        specialColumnType: 'custom',
                        customDisplayFilter: $scope.translateJobStateFilter,
                        filterOptions: [
                            {
                                displayLabel: $translate.instant('system.filter.state.completed'),
                                value: 'Completed'
                            },
                            {
                                displayLabel: $translate.instant('system.filter.state.failed'),
                                value: 'Failed'
                            }
                        ]
                    },
                    {
                        name: $translate.instant('system.backuprestore.joblist.jobdate'),
                        //type: 'number',
                        //sortfield: 'date',
                        //displayfield: 'date',
                        //filter: 'simpleDateTimeFilter'
                        type: 'string',
                        sortfield: 'date_modified',
                        displayfield: 'date_modified'
                    }
                ],
                filters: [],
                methods: [],

                pageConfig: {
                    page: 1,
                    pageSize: 1000 //temp for now
                }
            };

            /**
             * configuration for the resync report table
             */
            $scope.bkrstResyncReportTableConfig = {
                headers: [
                    {
                        name: $translate.instant('system.backuprestore.resync.resourcename'),
                        type: 'string',
                        sortfield: 'name',
                        displayfield: 'name',
                        specialColumnType: 'link',
                        linkAction: $scope.viewResourceTasks
                    },
                    {
                        name: $translate.instant('system.backuprestore.resync.operation'),
                        type: 'string',
                        sortfield: 'action',
                        displayfield: 'action'
                    },
                    {
                        name: $translate.instant('system.backuprestore.resync.servicename'),
                        type: 'string',
                        sortfield: 'hypervisor',
                        displayfield: 'hypervisor'
                    }
                ],
                filters: [],
                methods: [],

                pageConfig: {
                    page: 1,
                    pageSize: 25
                }
            };

            /**
             * configuration for the backup logs table
             */
            $scope.bkrstLogsTableConfig = {
                headers: [
                    {
                        name: $translate.instant('system.backuprestore.backuplist.name'),
                        type: 'string',
                        sortfield: 'name',
                        displayfield: 'name'
                    },
                    {
                        name: $translate.instant('system.backuprestore.startbackup.typeheader'),
                        type: 'string',
                        sortfield: 'type',
                        displayfield: 'type',
                        filterOptions: [
                            {
                                displayLabel: $translate.instant('system.backuprestore.backuptype.full.short'),
                                value: 'full'//TO-DO ? might have to localize this
                            },
                            {
                                displayLabel: $translate.instant('system.backuprestore.backuptype.incremental.short'),
                                value: 'incremental'//TO-DO ? might have to localize this
                            }
                        ]
                    },
                    /*{
                        name: $translate.instant('system.backuprestore.backuplist.incrementalnumber'),
                        type: 'number',
                        sortfield: 'last_incremental_ref',
                        displayfield: 'last_incremental_ref'
                    },*/
                    {
                        name: $translate.instant('system.backuprestore.joblist.jobdate'),
                        //type: 'number',
                        //sortfield: 'date',
                        //displayfield: 'date',
                        //filter: 'simpleDateTimeFilter'
                        type: 'string',
                        sortfield: 'date_created',
                        displayfield: 'date_created'
                    }
                ],
                filters: [],
                methods: [],

                pageConfig: {
                    page: 1,
                    pageSize: 1000 //temp for now
                }
            };

            /**
             * load the backup and restore top level table data
             */
            $scope.getBackupRestoreTableData = function(){
                $scope.backuplistloading = true;

                var req = {
                    'operation': 'config'
                };

                bllApiRequest.get("attis", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        $scope.bkrstdata = [];

                        //
                        // data.data.configs;
                        var i = 0, j = 0;
                        var match = false;
                        var bkuprestoreflow;

                        for(i = 0; i < data.data.configs.length; i++){
                            //ignore anything that is not backup,restore,recover,report
                            //ignore flow_name managmentappliancedb with type of restore
                            if ((data.data.configs[i].type &&
                                !(data.data.configs[i].type === 'backup' || data.data.configs[i].type === 'restore' ||
                                  data.data.configs[i].type === 'recover' || data.data.configs[i].type === 'report')) ||
                                (data.data.configs[i].flow_name &&
                                 data.data.configs[i].flow_name === 'managementappliancedb' &&
                                 data.data.configs[i].type && data.data.configs[i].type === 'restore')
                            ){
                                continue;
                            }
                            match = false;
                            for(j = 0; j < $scope.bkrstdata.length; j++){
                                if($scope.bkrstdata[j].flow_name === data.data.configs[i].flow_name){
                                    //add this config to an existing entry
                                    $scope.bkrstdata[j].configs.push(data.data.configs[i]);

                                    //set match to true
                                    match = true;
                                }
                            }

                            if(!match){
                                bkuprestoreflow = {
                                    flow_name: data.data.configs[i].flow_name,
                                    configs: []
                                };

                                bkuprestoreflow.configs.push(data.data.configs[i]);

                                //no match found, add new entry
                                $scope.bkrstdata.push(bkuprestoreflow);
                            }
                        }


                        //don't clear load flag, need to get details
                        //need to iterate through the configs and get details for each
                        $scope.detailsWaitingCount = data.data.configs.length;
                        i = 0;
                        for(i = 0; i < data.data.configs.length; i++){
                            $scope.getConfigDetailsData(data.data.configs[i].id);
                            if(data.data.configs[i].type === 'backup') {
                                $scope.getLastBackupDate(data.data.configs[i].id, data.data.configs[i].flow_name);
                            }
                        }
                    },
                    function (error) {//this is the method called when the bll call fails with error
                        console.log("-------BackupRestore List get-----------------  ERROR" + JSON.stringify(error));
                        addNotification('error', $translate.instant('system.backuprestore.data.error'));
                    },
                    function (progress_data) {//this is the method called when the bll call updates status
                        console.log("-------BackupRestore List get----------------- IN PROGRESS: " + progress_data.progress.percentComplete);
                    }
                );
            };


            /**
             * query for configuration details
             * @param configId
             */
            $scope.getConfigDetailsData = function(configId){
                var req = {
                    'operation': 'config',
                    'request_id' : configId
                };

                bllApiRequest.get("attis", req).then(
                    function (data) {//this is the method called when the bll call is successful

                        //merge the details data into the configuration data
                        var i = 0, j = 0;
                        for(i = 0; i < $scope.bkrstdata.length; i++){
                            for(j = 0; j < $scope.bkrstdata[i].configs.length; j++) {
                                //find the matching ID in the table data
                                if (configId === $scope.bkrstdata[i].configs[j].id) {
                                    for (var attrname in data.data) {
                                        //copy the configs into the table data
                                        $scope.bkrstdata[i].configs[j][attrname] = data.data[attrname];
                                    }
                                }
                            }
                        }

                        //after each details config is loaded, decrement the query count
                        $scope.decrementAndCheckLoadingCount();
                    },
                    function (error) {//this is the method called when the bll call fails with error
                        console.log("-------BackupRestore config get-----------------  ERROR" + JSON.stringify(error));

                        //after each details config is loaded, decrement the query count
                        $scope.decrementAndCheckLoadingCount();
                        addNotification('error', $translate.instant('system.backuprestore.data.error'));
                    },
                    function (progress_data) {//this is the method called when the bll call updates status
                        console.log("-------BackupRestore config get----------------- IN PROGRESS: " + progress_data.progress.percentComplete);
                    }
                );
            };

            /**
             * query for most recent backup date
             * @param configId
             */
            $scope.getLastBackupDate = function(configId, flow_name){
                var req = {
                    'operation': 'backuplog',
                    'request_parameters': []
                };

                // get only the latest backup of the flow_name
                if (angular.isDefined(flow_name)) {
                    req.request_parameters.push('name=' + flow_name);
                    req.request_parameters.push('latest=True');
                }

                bllApiRequest.get("attis", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        var backupLogs = data.data.backuplogs;
                        if (angular.isDefined(backupLogs)) {
                            //merge the details data into the configuration data
                            var i = 0, j = 0;
                            //walk through the data in the table and match it to the most recent log entry
                            for(i = 0; i < $scope.bkrstdata.length; i++){
                                if($scope.bkrstdata[i].flow_name === flow_name) {
                                    for (j = 0; j < backupLogs.length; j++) {
                                        if (flow_name === backupLogs[j].name) {
                                            $scope.bkrstdata[i].lastbackupstring = backupLogs[j].date_created;
                                            break;
                                        }
                                    }
                                }

                                if (angular.isUndefined($scope.bkrstdata[i].lastbackupstring)) {
                                    $scope.bkrstdata[i].lastbackupstring = $translate.instant('system.backuprestore.backuplog.nobackupcreated');
                                }
                            }
                        }
                    },
                    function (error) {//this is the method called when the bll call fails with error
                        //TODO - add this back in once there is a valid system for it
                        //console.log("-------BackupRestore config get-----------------  ERROR" + JSON.stringify(error));
                        //addNotification('error', $translate.instant('system.backuprestore.data.error'));

                        //TODO - removed section below once the backuplog for a single service is there
                        //right now this generates a 404 from ATTIS
                        var i = 0, j = 0;
                        for(i = 0; i < $scope.bkrstdata.length; i++){
                            for(j = 0; j < $scope.bkrstdata[j].configs.length; j++) {
                                //find the matching ID in the table data
                                if (configId === $scope.bkrstdata[i].configs[j].id) {
                                    $scope.bkrstdata[i].lastbackupstring = $translate.instant('system.backuprestore.backuplog.nobackupcreated');
                                }
                            }
                        }
                    },
                    function (progress_data) {//this is the method called when the bll call updates status
                        console.log("-------BackupRestore config get----------------- IN PROGRESS: " + progress_data.progress.percentComplete);
                    }
                );
            };

            //reload data when change days selection
            $scope.$watch('lastNDaySelection', function() {
                if($scope.showJobList) {
                    $scope.jobListDataLoading = true;
                    $scope.getJobsListData();
                }
                else if ($scope.showBackupLogs) {
                    $scope.backupLogsDataLoading = true;
                    $scope.getBackupLogData($scope.currentBackupConfig);
                }
            });

            /**
             * query for the overall jobs list
             */
            $scope.getJobsListData = function(){
                $scope.jobListDataLoading = true;
                
                var req = {
                    'operation': 'job'
                };

                //pick days selection
                if($scope.lastNDaySelection <= 30) {
                    req.request_parameters = ['last=' + $scope.lastNDaySelection];
                }

                bllApiRequest.get("attis", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        $scope.jobListData = data.data.jobs;
                        $scope.jobListDataLoading = false;
                    },
                    function (error) {//this is the method called when the bll call fails with error
                        $scope.jobListDataLoading = false;

                        addNotification('error', $translate.instant('system.backuprestore.data.error'));
                        log('error', 'Failed to get BackupRestore jobList data');
                        log('error', 'error data = ' + JSON.stringify(error));
                    },
                    function (progress_data) {//this is the method called when the bll call updates status
                        log('info',
                             'BackupRestore getting jobList data in progress...... ' +
                             progress_data.progress.percentComplete);
                    }
                );
            };


            /**
             * request task data for a particular job based on job id
             * @param input a job
             */
            $scope.getJobTaskData = function(input){
                $scope.jobTaskLoading = true;
                var req = {
                    'operation': 'job',
                    'request_id': input.id
                };

                bllApiRequest.get("attis", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        $scope.taskListData = [];
                        var i = 0;

                        console.log('got back list of tasks of length:' + data.data.tasks.length);
                        for(i = 0; i < data.data.tasks.length; i++){
                            $scope.taskListData.push(data.data.tasks[i]);
                        }

                        $scope.showTaskName = input.name;
                        $scope.joblistloading = false;
                        $scope.jobTaskLoading = false;
                    },
                    function (error) {//this is the method called when the bll call fails with error
                        $scope.joblistloading = false;
                        $scope.jobTaskLoading = false;
                        console.log("-------BackupRestore Task List get-----------------  ERROR" + JSON.stringify(error));

                        addNotification('error', $translate.instant('system.backuprestore.data.error'));
                    },
                    function (progress_data) {//this is the method called when the bll call updates status
                        console.log("-------BackupRestore Task List get----------------- IN PROGRESS: " + progress_data.progress.percentComplete);
                    }
                );
            };

            /**
             * query for resync job task data
             * @param input
             */
            $scope.getResyncJobTaskData = function(input){
                var req = {
                    'operation': 'task'
                };

                bllApiRequest.get("attis", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        //uncomment once actually available
                        //$scope.jobListData = data.data.jobs;
                        $scope.taskListData = [];
                        var i = 0;

                        //TODO - replace with data.data.tasks
                        for(i = 0; i < $scope.tasksForJobData.length; i++){
                            if($scope.tasksForJobData[i].job_id === input.id){
                                $scope.taskListData.push($scope.tasksForJobData[i]);
                            }
                        }

                        $scope.showResourceTasksDrawer($scope.taskListData, input);
                        $scope.joblistloading = false;
                    },
                    function (error) {//this is the method called when the bll call fails with error
                        $scope.joblistloading = false;
                        console.log("-------BackupRestore Task List get-----------------  ERROR" + JSON.stringify(error));

                        addNotification('error', $translate.instant('system.backuprestore.data.error'));
                    },
                    function (progress_data) {//this is the method called when the bll call updates status
                        console.log("-------BackupRestore Task List get----------------- IN PROGRESS: " + progress_data.progress.percentComplete);
                    }
                );
            };

            /**
             * query for backup log data
             * @param input flow with configs
             */

            $scope.getBackupLogData = function(input){
                $scope.backupLogDataLoading = true;
                $scope.backupLogDataError = false;

                var req = {
                    'operation': 'backuplog',
                    'request_parameters' : []
                };

                if($scope.lastNDaySelection <= 30) {
                    req.request_parameters.push('last=' + $scope.lastNDaySelection);
                }

                if(angular.isDefined(input) && angular.isDefined(input.flow_name)){
                    req.request_parameters.push('name=' + input.flow_name);
                }

                return bllApiRequest.get("attis", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        $scope.backupLogsList = data.data.backuplogs;

                        //filter just the logs for this input, need to attach those entries to the input
                        //in order for multi-restore to work
                        $scope.filterBackupLogOnInput(input);
                        $scope.backupLogDataLoading = false;
                    },
                    function (error) {//this is the method called when the bll call fails with error
                        $scope.backupLogDataLoading = false;
                        $scope.backupLogDataError = true;
                        addNotification('error', $translate.instant('system.backuprestore.data.error'));
                        log('error', 'Failed to get BackupRestore backupLog data');
                        log('error', 'error data = ' + JSON.stringify(error));
                    },
                    function (progress_data) {//this is the method called when the bll call updates status
                        log('info',
                            "BackupRestore getting backupLog data in progress......" +
                            progress_data.progress.percentComplete);
                    }
                );
            };

            /**
             * each time a details config is loaded, decrement the "waiting" count
             * if the count hits 0, the loading is finished
             */
            $scope.decrementAndCheckLoadingCount = function(){
                //decrement the count of configs loading
                if($scope.detailsWaitingCount > 0){
                    $scope.detailsWaitingCount--;
                }

                //if the waiting count is 0, clear the loading flag
                if($scope.detailsWaitingCount === 0) {
                    $scope.backuplistloading = false;
                }
            };

            /**
             * load up the task drawer within the resource list modal
             * @param tableData
             * @param input
             */
            $scope.showResourceTasksDrawer = function(tableData, input){
                var jobListModalDrawer = angular.element('#resyncReportModalWindow').find('modal-drawer');
                // Show task drawer
                jobListModalDrawer.scope().modalDrawer.show({
                    template: 'system/templates/backup_restore/resync_taskdrawer.html',
                    cancel: "common.cancel",
                    hidecommit: true,
                    disablecommit: false,
                    disablecancel: false,
                    titleKey: $translate.instant("system.backuprestore.resync.drawerheader", {name: input.name}),
                    data: {
                        tabledata: tableData
                    }
                });
            };

            /**
             * trigger the modal drawer to edit configurations within the config list
             */
            $scope.showEditSettingModal = function(){
                var i = 0;
                for(i = 0; i < $scope.configParams.length; i++) {
                    if ($scope.configParams[i].$rowSelected) {
                        break;
                    }
                }

                if(i < $scope.configParams.length && $scope.configParams[i].$rowSelected){
                    $scope.currentConfigIndex = i;
                    $scope.selectedConfig = angular.copy($scope.configParams[i]);
                    if ($scope.selectedConfig.confidential === true) {
                        $scope.selectedConfig.value = '';
                    }
                    $scope.showConfiguration.addStack("system/templates/backup_restore/config_edit_drawer.html");
                }
            };

            $scope.updateSetting = function() {
                if ($scope.selectedConfig.value !== $scope.configParams[$scope.currentConfigIndex].value) {
                    $scope.configParams[$scope.currentConfigIndex] = $scope.selectedConfig;
                    var req_data = {};
                    req_data.parameters = [];
                    var one_param = {};
                    one_param[$scope.selectedConfig.parameter_name] = $scope.selectedConfig.value;
                    req_data.parameters.push(one_param);

                    var req = {
                        'operation': 'config',
                        'request_id': $scope.selectedConfig.config_id,
                        'request_data': req_data
                    };

                    bllApiRequest.put("attis", req).then(
                        function (data) {//this is the method called when the bll call is successful
                            log('info', 'successfully updated configuration parameter, reloading base data');
                            $scope.showConfiguration.closeModal();
                            $scope.getBackupRestoreTableData();
                        },
                        function (error) {//this is the method called when the bll call fails with error
                            log('error',"-------BackupRestore change config -----------------  ERROR" + JSON.stringify(error));
                            addNotification('error', $translate.instant('system.backuprestore.config.update.error', data));
                        },
                        function (progress_data) {//this is the method called when the bll call updates status
                            log('info',"-------BackupRestore change config----------------- IN PROGRESS: " + progress_data.progress.percentComplete);
                        }
                    );
                }
            };


            /**
             * we may have to pull the types from attis, for now they're hard coded
             */
            $scope.backupTypes = [{
                label: "system.backuprestore.backuptype.incremental",
                value: "incremental"
            },
            {
                label: "system.backuprestore.backuptype.full",
                value: "full"
            }];


            /**
             * default backup type is incremental
             */
            $scope.backupType = "incremental";

            /**
             * once the single backup modal has closed, parse the data object, match up the request config
             * and send off the request to the BLL calling function to launch the backup
             */
            $scope.startBackup = function(){
                console.log('launch backup:' + $scope.currentBackupConfig.flow_name + ' of type:' + $scope.backupType);
                var backupConfig;
                var i = 0;
                var translation_data = {
                    flow_name: $scope.currentBackupConfig.flow_name
                };

                for(i = 0; i < $scope.currentBackupConfig.configs.length; i++){
                    if($scope.currentBackupConfig.configs[i].type === 'backup'){
                        backupConfig = $scope.currentBackupConfig.configs[i];
                        break;
                    }
                }

                if(angular.isUndefined(backupConfig)){
                    addNotification('error', $translate.instant('system.backuprestore.config.error', translation_data));
                    //close the modal
                    $scope.showBackupConfirmation = false;

                    //clear the backupId
                    $scope.currentBackupConfig = undefined;
                    return;
                }

                $scope.sendBllBackupRequest($scope.currentBackupConfig.flow_name, $scope.backupType, backupConfig.id);

                //close the modal
                $scope.showBackupConfirmation = false;

                //clear the backupId
                $scope.currentBackupConfig = undefined;
            };

            /**
             * launch the backup once triggered
             * @param flow_name
             * @param type
             * @param configId
             */
            $scope.sendBllBackupRequest = function(flow_name, type, configId){
                var translation_data = {
                    flow_name: flow_name
                };

                var backupRequest = {
                    config: {
                        id: configId
                    }
                };


                var req = {
                    'operation': 'backup',
                    'request_data' : backupRequest,
                    'request_parameters' : ['type=' + type ]
                };

                bllApiRequest.post("attis", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        addNotification('info', $translate.instant('system.backuprestore.dobackup.success', translation_data));
                    },
                    function (error) {//this is the method called when the bll call fails with error
                        console.log("-------BackupRestore List get-----------------  ERROR" + JSON.stringify(error));
                        addNotification('error', $translate.instant('system.backuprestore.data.error'));
                    },
                    function (progress_data) {//this is the method called when the bll call updates status
                        console.log("-------BackupRestore List get----------------- IN PROGRESS: " + progress_data.progress.percentComplete);
                    }
                );
            };

            /**
             * flag the item as ok to go
             * @param item
             */
            $scope.queueForBackup = function(item){
                item.statusClass = 'listViewStatusOk';
            };

            /**
             * flag the item as skip status
             * @param item
             */
            $scope.skipBackup = function(item){
                item.statusClass = 'listViewStatusSkip';
            };

            /**
             * flag the item as ok to go
             * this is separate from the queue for backup
             * call even though both behave the same for now
             * in case additional logic needs to be added later
             * @param item
             */
            $scope.queueForRestore = function(item){
                item.statusClass = 'listViewStatusOk';
            };

            /**
             * flag the item as skip status
             * this is separate from the skipbackup
             * call even though both behave the same for now
             * in case additional logic needs to be added later
             * @param item
             */
            $scope.skipRestore = function(item){
                item.statusClass = 'listViewStatusSkip';
            };



            /**
             * launch the backup once triggered
             * @param flow_name
             * @param config
             * @param backup_id the backup_id to be used for the restore
             */
            $scope.sendBllRestoreRequest = function(flow_name, config, backup_id){
                var translation_data = {
                    flow_name: flow_name
                };

                var restoreRequest = {
                    config: {
                        id: config.id
                    },
                    "backup_id": backup_id
                };


                var req = {
                    'operation': 'restore',
                    'request_data' : restoreRequest
                };

                //NOTE!! This will actually kick off a restore... which can be very disruptive
                //TODO - remove once restore success confirmed
                console.log('kicking off restore request of:' + JSON.stringify(req));

                bllApiRequest.post("attis", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        addNotification('info', $translate.instant('system.backuprestore.dorestore.success', translation_data));
                    },
                    function (error) {//this is the method called when the bll call fails with error
                        console.log("-------BackupRestore List get-----------------  ERROR" + JSON.stringify(error));
                        addNotification('error', $translate.instant('system.backuprestore.data.error'));
                    },
                    function (progress_data) {//this is the method called when the bll call updates status
                        console.log("-------BackupRestore List get----------------- IN PROGRESS: " + progress_data.progress.percentComplete);
                    }
                );
            };

            /**
             * launch the restore once triggered
             */
            $scope.startRestore = function(){
                var restoreConfig;
                var i = 0;
                var translation_data = {
                    flow_name: $scope.currentBackupConfig.flow_name
                };

                for(i = 0; i < $scope.currentBackupConfig.configs.length; i++){
                    if($scope.currentBackupConfig.configs[i].type === 'restore'){
                        restoreConfig = $scope.currentBackupConfig.configs[i];
                        break;
                    }
                }

                if(angular.isUndefined(restoreConfig)){
                    addNotification('error', $translate.instant('system.backuprestore.restore.config.error', translation_data));
                    //close the modal
                    $scope.showRestoreConfirmation = false;

                    //clear the backupId
                    $scope.currentBackupConfig = undefined;
                    return;
                }

                $scope.sendBllRestoreRequest($scope.currentBackupConfig.flow_name, restoreConfig,
                    $scope.backupInstanceSelection);

                //close the modal
                $scope.showRestoreConfirmation = false;

                //clear the backupId
                $scope.currentBackupConfig = undefined;
            };

            $scope.showBackupLogsModal = function(input){
                $scope.lastNDaySelection = 5; //init
                $scope.backupLogDataLoading = true;
                $scope.showBackupLogs = true;
                $scope.getBackupLogData(input);
            };

            $scope.showRestoreTriggerModal = function(input){
                $scope.backupInstanceSelection = undefined;
                $scope.backupInstanceOptions = [];
                $scope.singleItemRestoreInput = input;

                $scope.backupLogDataLoading = true;
                //only start restore when there is no error and there are backup instances
                $scope.getBackupLogData(input).then(function() {
                    $scope.backupLogDataLoading = false;
                    if(!$scope.backupLogDataError) {
                        var backupData = input.logsForBackupData;
                        if(angular.isDefined(backupData) && backupData.length > 0) {
                            $scope.backupInstanceSelection = backupData[0].backup_id;
                            for (var i=0; i<backupData.length; i++) {
                                $scope.backupInstanceOptions.push({
                                    label: backupData[i].date_created + ' (' + backupData[i].type + ')',
                                    value: backupData[i].backup_id
                                });
                            }
                        }
                        $scope.showRestoreConfirmation = true;
                    }
                });
            };

            /**
             * kicks off the resync for a particular database configuration
             * is called when the resync action modal "initiate resync" is called
             */
            $scope.startResync = function(){
                $scope.maskResyncModal = true;
                $scope.sendBllResyncRequest($scope.currentResyncConfig.flow_name, $scope.currentResyncConfig.config, $scope.currentResyncConfig["report-id"]);
                $scope.currentResyncConfig = undefined;
            };

            /**
             * launch the Resync/Recovery once triggered
             * @param flow_name
             * @param config
             */
            $scope.sendBllResyncRequest = function(flow_name, config, report_id){
                var translation_data = {
                    flow_name: flow_name
                };

                var recoverRequest = {
                    config: {
                        id: config.id
                    },
                    "report_id": report_id
                };


                var req = {
                    'operation': 'recover',
                    'request_data' : recoverRequest
                };

                //TODO - remove once report success confirmed
                console.log('kicking off recover request of:' + JSON.stringify(req));

                bllApiRequest.post("attis", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        addNotification('info', $translate.instant('system.backuprestore.recovery.recoverytriggered', translation_data));
                        //load the jobs modal

                        $scope.maskResyncModal = false;
                        $scope.showResyncActionModal = false;
                    },
                    function (error) {//this is the method called when the bll call fails with error
                        console.log("-------BackupRestore Recovery -----------------  ERROR" + JSON.stringify(error));
                        addNotification('error', $translate.instant('system.backuprestore.recovery.error', translation_data));
                        $scope.maskResyncModal = false;
                        $scope.showResyncActionModal = false;
                    },
                    function (progress_data) {//this is the method called when the bll call updates status
                        console.log("-------BackupRestore Recovery----------------- IN PROGRESS: " + progress_data.progress.percentComplete);
                    }
                );
            };


            /**
             * launch the Report request for the specified flow_name and config
             * @param flow_name
             * @param config
             */
            $scope.sendBllReportRequest = function(flow_name, config){
                var translation_data = {
                    flow_name: flow_name
                };

                var reportRequest = {
                    config: {
                        id: config.id
                    }
                };

                var req = {
                    'operation': 'report',
                    'request_data' : reportRequest
                };

                //TODO - remove once report success confirmed
                console.log('kicking off report request of:' + JSON.stringify(req));

                bllApiRequest.post("attis", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        addNotification('info', $translate.instant('system.backuprestore.report.reporttriggered', translation_data));
                        //load the job list modal
                        $scope.showJobListModal();
                    },
                    function (error) {//this is the method called when the bll call fails with error
                        addNotification('error', $translate.instant('system.backuprestore.report.error', translation_data));
                        $scope.jobListLoading = false;
                        log('error', 'Failed to launch BackupRestore report request');
                        log('error', 'error data = ' + JSON.stringify(error));
                    },
                    function (progress_data) {//this is the method called when the bll call updates status
                        log('info',
                            "BackupRestore launch report request in progress...." +
                            progress_data.progress.percentComplete);
                    }
                );
            };

            /**
             * request the recovery reports list
             * @param flow_name
             * @param config
             * @param callback the function called when the report data comes back successfully
             */
            $scope.sendBllGetReportsRequest = function(flow_name, config, callback){
                var translation_data = {
                    flow_name: flow_name
                };

                var reportRequest = {
                    config: {
                        id: config.id
                    }
                };

                var req = {
                    'operation': 'report',
                    'request_data' : reportRequest
                };

                //TODO - remove once report success confirmed
                console.log('kicking off report request of:' + JSON.stringify(req));

                bllApiRequest.get("attis", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        callback(data);
                    },
                    function (error) {//this is the method called when the bll call fails with error
                        console.log("-------BackupRestore Report get-----------------  ERROR" + JSON.stringify(error));
                        addNotification('error', $translate.instant('system.backuprestore.report.get.error', translation_data));
                    },
                    function (progress_data) {//this is the method called when the bll call updates status
                        console.log("-------BackupRestore Report get----------------- IN PROGRESS: " + progress_data.progress.percentComplete);
                    }
                );
            };


            $scope.multiRestoreErrorState = false;
            $scope.multiBackupDataCountRemaining = 0;
            /**
             * check if all restore queries have been made, if so show the modal
             */
            $scope.showMultiRestoreTriggerModal = function(input, errorState, data){
                $scope.multiBackupDataCountRemaining--;
                if(errorState){
                    $scope.multiRestoreErrorState = true;
                }

                if(angular.isDefined(input) &&
                    angular.isDefined(input.logsForBackupData) &&
                    input.logsForBackupData.length > 0) {
                    input.backupInstanceSelection = input.logsForBackupData[0];
                }

                //need a conditional here to check if the count of backlog log queries is done
                if($scope.multiBackupDataCountRemaining === 0) {
                    //only open the modal if there was not an error
                    //TODO - uncomment the if below once pulling real data
                    //if(!$scope.multiRestoreErrorState) {
                        $scope.showMultiRestoreModal = true;
                    //}
                }
            };

            $scope.configTableSelectionCount = 0;
            //this event could fire from several sub tables, need to
            //check the datamodels directly
            $scope.$on('tableSelectionChanged', function(){
                $scope.configTableSelectionCount = 0;
                if(angular.isDefined($scope.configParams)) {
                    for (var i = 0; i < $scope.configParams.length; i++) {
                        if ($scope.configParams[i].$rowSelected) {
                            $scope.configTableSelectionCount++;
                        }
                    }
                }
            });

            $scope.filterBackupLogOnInput = function(input){
                var i = 0;
                $scope.logsForBackupData = [];

                if(angular.isDefined($scope.backupLogsList) && $scope.backupLogsList.length > 0) {
                    input.logsForBackupData = $scope.backupLogsList.filter(function (element, index, array) {
                        return (element.name === input.flow_name);
                    });

                    //handles the single selection case
                    //TODO - clean this up later
                    $scope.logsForBackupData = input.logsForBackupData;
                } else {
                    input.logsForBackupData = [];
                }
            };


            //load the initial dataset
            $scope.getBackupRestoreTableData();

        }
    ]);
})(angular);
