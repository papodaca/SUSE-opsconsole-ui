// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('IntegratedToolsController', [
        '$scope', '$rootScope', '$translate', '$http', '$cookieStore', 'isUndefined', 'addNotification', 'bllApiRequest',
        '$window', '$location', 'log', 'ToastNotifications',
        function ($scope, $rootScope, $translate, $http, $cookieStore, isUndefined, addNotification, bllApiRequest,
                  $window, $location, log, ToastNotifications) {

            $scope.registervcentersFlag = false;
            $scope.managevcentersFlag = false;
            $scope.connectoneviewFlag = false;
            $scope.manageoneviewFlag = false;
            $scope.connecticspFlag = false;
            $scope.manageicspFlag = false;
            $scope.oneviewActionFlag = false;
            $scope.icspActionFlag = false;
            $scope.icspPanelControl = true;
            $scope.removeModelDilogue = false;
            $scope.oneviewcountdata = 0;
            $scope.oneviewcount = 0;
            $scope.icspCount = 0;
            $scope.vcentercount = 0;
            $scope.confirm_oneview_count = 0;
            $scope.ManageVcenterLoading = false;
            $scope.editVcenterPassword = "password";
            $scope.disableRemoveIfClusterActivated = false;
            $scope.vcenterActionFlag = false;
            $scope.networkLoading = false;
            $scope.vcenterRegisterActionFlag = false;
            $scope.esx_network_driver = '';
            $scope.cmc_dcm_vip = '';
            $scope.ma_vip = '';
            $scope.deploy_enterprise_vip_can = '';
            $scope.showItRegisterModalOverlayFlag = false;
            $scope.showItEditModalOverlayFlag = false;
            $scope.edit_vcenter = {
                edit_name: '', edit_ip_address: '', edit_port: 443, edit_username: '',
                edit_password: '', edit_id: ''
            };
            $scope.showPassword = {
                show_vcenter_password: false
            };
            $scope.isOpenstackPortalBtnDisabled = true;

            $scope.removeOneViewOverlayFlag = false;//to show the loading mask for removing oneview
            $scope.removeIcspOverlayFlag = false; //to show the loading mask for removing icsp
            $scope.removeVcenterOverlayFlag = false;  //to show the loading mask for removing vcenter

            //whether need to show vcenter, oneview or icsp sections
            $scope.showvCenterReg = true;
            $scope.showOneviewReg = false;

            //"is_foundation_installed":true in cloud_system.json
            //show vcenter registration
            $scope.is_CS_foundation  = angular.isDefined($rootScope.appConfig.is_foundation_installed) && (
                $rootScope.appConfig.is_foundation_installed === "true"  ||
                $rootScope.appConfig.is_foundation_installed === "True"  ||
                $rootScope.appConfig.is_foundation_installed === true);

            if($scope.is_CS_foundation) {
                $scope.showvCenterReg = true;
            }

            $scope.$watch(
                function() {
                    return $rootScope.available_bllplugins;
                },
                function() {
                    if (angular.isDefined($rootScope.available_bllplugins) &&
                        $rootScope.available_bllplugins.indexOf('ace') !== -1) {
                        $scope.showOneviewReg = true;

                    }
                }
            );

            function resetPasswordCheckboxes() {
                $scope.showPassword.show_vcenter_password = false;
            }

            $scope.namePortDisplayFunction = function (data) {
                var statusHtml = data.ip_address + ":" + data.port;
                return statusHtml;
            };

            $scope.statusDisplayFunction = function (data) {
                return $translate.instant('system.vcenter.status.' + data.state);
            };

            $scope.hideShowVCenterPassword = function (name) {
                if (name === 'change_edit_vcenter_password') {
                    if ($scope.editVcenterPassword == 'password')
                        $scope.editVcenterPassword = 'text';
                    else
                        $scope.editVcenterPassword = 'password';
                }
            };
            $scope.vcentercountloading = true;
            $scope.vcenter_panel_config = {

                header: {
                    label: $translate.instant("system.VMwarevCenterServerslabel"),
                    description: $translate.instant("system.vmwaredescriptionlabel")
                },
                count: {
                    count: $scope.vcentercount,
                    label: $translate.instant("system.registervcenterdescription")
                },
                actionConfig: [{
                    label: $translate.instant("system.integratedtools.menu.registervcenterlabel"),
                    action: function () {
                        $scope.showRegisterVcenterModal();
                    }
                }, {
                    label: $translate.instant("system.integratedtools.menu.managevcenterlabel"),
                    action: function () {
                        $scope.showManageVcentersModal();
                    }
                }
                ],
                setflag: $scope.vcentercountloading,
                dropOneDisable: false,
                paneldisable: true
            };

            var manageVcenteractionMenuPermissionsCheck = function (data, actionName) {
                var actionPermissions = {
                    enabled: true,
                    hidden: false
                };

                if (!angular.isDefined(data)) {
                    actionPermissions.enabled = false;
                }
                else if (actionName === 'editServerManageVcenter') {
                    if (data.state.toLowerCase() != 'registered') {
                        actionPermissions.enabled = false;
                    }
                }
                else if (actionName === 'removeServerManageVcenter') {
                    var permission = data.state.toLowerCase() != 'registered' || data.activated_clusters > 0;
                    if (!$scope.is_CS_foundation){
                        permission = data.state.toLowerCase() != 'registered';
                    }
                    if (permission) {
                        actionPermissions.enabled = false;
                    }
                }

                return actionPermissions;
            };

            var manageVcenterMultiSelectActionButtonsPermissionCheck = function (data, actionName) {
                var actionPermissions = {
                    enabled: true,
                    hidden: false
                };

                if (!angular.isDefined(data) || data.length === 0 ) {
                    actionPermissions.enabled = false;
                }
                else if (actionName === 'removeServerManageVcenterMultiSelect') {
                    data.forEach(function(datum) {
                        //don't allow any selected vcenter which either is NOT in
                        //registered state or has cluster
                        var permission = datum.state.toLowerCase() != 'registered' || datum.activated_clusters > 0;
                        if (!$scope.is_CS_foundation){
                            permission = datum.state.toLowerCase() != 'registered';
                        }
                        if (permission) {
                            actionPermissions.enabled = false;
                        }
                    });
                }
                return actionPermissions;
            };

            $scope.vcenter_table_config = {
                headers: [
                    {
                        name: $translate.instant('system.vcenter.table.header.address'),
                        type: "string",
                        displayfield: "ip_address",
                        sortfield: 'ip_address',
                        specialColumnType: 'custom',
                        customDisplayFilter: $scope.namePortDisplayFunction
                    },
                    {
                        name: $translate.instant('system.vcenter.table.header.port'),
                        type: "string",
                        displayfield: "port",
                        sortfield: 'port',
                        hidden: true
                    },
                    {
                        name: $translate.instant('system.vcenter.table.header.state'),
                        type: "caselessString",
                        displayfield: "state",
                        sortfield: 'state',
                        specialColumnType: 'custom',
                        customDisplayFilter: $scope.statusDisplayFunction
                    },
                    {
                        name: $translate.instant('system.vcenter.table.header.admin'),
                        type: "string",
                        displayfield: "username",
                        sortfield: 'username',
                        isNotHtmlSafe: true
                    }
                ],

                actionMenuConfigFunction: manageVcenteractionMenuPermissionsCheck,
                actionMenuConfig: [{
                    label: "system.managevcenter.editserverbuttonlabel",
                    name: "editServerManageVcenter",
                    action: function(data) {
                        $scope.showEditVcenterModal(data);
                    }
                }, {
                    label: "system.managevcenter.removeserverbuttonlabel",
                    name: "removeServerManageVcenter",
                    action: function (data) {
                        $scope.showRemoveVcenterModal(data);
                    }
                }],

                multiSelectActionMenuConfigFunction: manageVcenterMultiSelectActionButtonsPermissionCheck,

                //allow multiple deleting vcenter server
                multiSelectActionMenuConfig: [
                    {
                        label: 'system.managevcenter.removeserverbuttonlabel',
                        name: 'removeServerManageVcenterMultiSelect',
                        action: function(data) {
                            $scope.showRemoveVcenterModal(data);
                        }
                    }],

                filters: [],
                pageConfig: {
                    page: 1,
                    pageSize: 10
                }
            };
            if ($scope.is_CS_foundation) {
                var foundationTableConf = [
                    {
                        name: $translate.instant('system.vcenter.table.header.server'),
                        type: "string",
                        displayfield: "name",
                        sortfield: 'name',
                        isNotHtmlSafe: true
                    },
                    {
                        name: $translate.instant('system.vcenter.table.header.clusters'),
                        type: "string",
                        displayfield: "activated_clusters",
                        sortfield: 'activated_clusters'
                    }
                ];
                var count = 0;
                angular.forEach(foundationTableConf, function(tableConf) {
                    if (count === 0){
                        $scope.vcenter_table_config.headers.unshift(tableConf);
                        count++;
                    } else {
                        $scope.vcenter_table_config.headers.push(tableConf);
                    }
               });
            }

            $scope.setIntegratedUIs = function () {
                bllApiRequest.get('catalog', {operation: 'get_enterprise_app_endpoints'}).then(
                    function (data) {
                        if (data.status === 'complete') {
                            var config = [];
                            if (angular.isDefined(data.data)) {
                                if (data.data.horizon !== null) {
                                    config.push({
                                        label: $translate.instant("system.integrated.dropdown.openstack.portal"),
                                        action: function () {
                                            $window.open(data.data.horizon, "_blank");
                                        }
                                    });
                                }
                                if (data.data.csa !== null) {
                                    config.push({
                                        label: $translate.instant("system.integrated.dropdown.csaconsole.portal"),
                                        action: function () {
                                            $window.open(data.data.csa, "_blank");
                                        }
                                    });
                                }
                                if (data.data.mpp !== null) {
                                    config.push({
                                        label: $translate.instant("system.integrated.dropdown.marketplace.portal"),
                                        action: function () {
                                            $window.open(data.data.mpp, "_blank");
                                        }
                                    });
                                }
                                if (data.data.oo !== null) {
                                    config.push({
                                        label: $translate.instant("system.integrated.dropdown.operationsorchestration.portal"),
                                        action: function () {
                                            $window.open(data.data.oo, "_blank");
                                        }
                                    });
                                }
                            }
                            config.push({
                                label: $translate.instant("masthead.drilldown.doc.logging_console"),
                                action: function () {
                                    var kibana_url = $rootScope.appConfig.integerated_logging_url;
                                    $window.open(kibana_url, "_blank");
                                }
                            });
                            $scope.integrated_uis_config = {actionConfig: config};
                        } else {
                            addNotification('error', $translate.instant("system.applianceslist.enterprise_error_message"));
                            $scope.integrated_uis_config = {};
                        }
                    },
                    function (error_data) {
                        addNotification(
                            'error',
                            $translate.instant(
                                "system.applianceslist.enterprise_error_message",
                                {'reason': error_data.data ? error_data.data[0].data : ''}
                            ));
                        $scope.integrated_uis_config = {};
                        log('error', 'error_data=' + JSON.stringify(error_data));
                    }
                );
            };

            //init call
            $scope.setIntegratedUIs();

            var initRegisterObject = function () {
                $scope.registerObject = {
                    'name': '',
                    'host': '',
                    'username': '',
                    'password': '',
                    'showPass': false,
                    'port': '443',
                    'portShow': false
                };
                if ($scope.is_CS_foundation){
                    $scope.registerObject.portShow = true;
                }
            };

            $scope.showRegisterVcenterModal = function () {
                $scope.registervcentersFlag = true;
                $scope.showItRegisterModalOverlayFlag = false;
                initRegisterObject();
                //clean the form
                if (angular.isDefined($scope.itRegisterVcenterForm)) {
                    $scope.itRegisterVcenterForm.$setPristine();
                }
            };

            $scope.toggleRegisterShowPass = function () {
                $scope.registerObject.showPass = !$scope.registerObject.showPass;
            };

            $scope.cancelRegisterVcenter = function () {
                $scope.itRegisterVcenterModal.closeModal();
            };

            $scope.commitRegisterVcenter = function () {
                $scope.showItRegisterModalOverlayFlag = true;
                $scope.vcenterRegisterActionFlag = true;
                $scope.vcenter_panel_config.setflag = true;
                var req_data = {
                    'type': 'vcenter',
                    'ip_address': $scope.registerObject.host,
                    'username': $scope.registerObject.username,
                    'password': $scope.registerObject.password,
                    'port': $scope.registerObject.port
                };
                if ($scope.is_CS_foundation) {
                    req_data.name = $scope.registerObject.name;
                }
                var req = {
                    'operation': 'vcenters',
                    'data': req_data
                };

                bllApiRequest.post('vcenters', req).then(
                    function (data) {
                        addNotification(
                            'info',
                            $translate.instant("system.vcenter.register.message.success", {
                                'vcenter': req.data.ip_address,
                                'name': req.data.name !== isUndefined ? req.data.name : ""
                            })
                        );

                        $scope.vcenterRegisterActionFlag = false;
                        $scope.showItRegisterModalOverlayFlag = false;
                        $scope.registervcentersFlag = false;
                        $scope.vcenter_panel_config.setflag = false;
                        $scope.managevcentercount();
                        //update the list in case user opens the manage vcenter modal
                        $scope.getVCenter_List();
                    },
                    function (error_data) {
                        $scope.managevcentercount();
                        //update the list in case user opens the manage vcenter modal
                        $scope.getVCenter_List();
                        var error_msg = error_data.data[0].data;
                        addNotification(
                            'error',
                            $translate.instant('system.vcenter.register.message.error', {
                                'vcenter': req.data.ip_address,
                                'name': req.data.name !== isUndefined ? req.data.name : ""
                            }) + ": " + error_msg
                        );
                        log('error', 'Failed to register vcenter ' + req.data.ip_address + ' ' + req.data.name !== isUndefined ? req.data.name : "");
                        log('error', JSON.stringify(error_data));
                        $scope.vcenterRegisterActionFlag = false;
                        $scope.showItRegisterModalOverlayFlag = false;
                        $scope.registervcentersFlag = false;
                        $scope.vcenter_panel_config.setflag = false;
                    },
                    function () {
                        $scope.registervcentersFlag = false;
                        log('info', 'Registering vcenter in progress for ' + req.data.ip_address + ' ' + req.data.name !== isUndefined ? req.data.name : "");
                    }
                );
            };

            //This method will return the count of vcenters from LEIA
            $scope.managevcentercount = function () {
                $scope.vcenter_panel_config.setflag = true;
                $scope.vcenterActionFlag = true;
                var request = {
                    'operation': 'count_vcenters'
                };
                bllApiRequest.get("vcenters", request).then(
                    function (data) {
                        //this is the method called when the bll call is successful
                        if (data.status == 'complete') {
                            $scope.vcentercount = data.data;
                            $scope.vcenter_panel_config.count.count = $scope.vcentercount;
                            $scope.vcenter_panel_config.setflag = false;
                            $scope.vcentercountlist();
                        } else {
                            $scope.vcenter_panel_config.setflag = false;
                            $scope.vcentercount = 0;
                            $scope.vcentercountlist();
                            addNotification('error',
                                $translate.instant("system.vcenter.count.message.info"));
                        }
                        $scope.vcenterActionFlag = false;
                    },
                    function (error_data) {//this is the method called when the bll call fails with error
                        $scope.vcenterActionFlag = false;
                        $scope.vcenter_panel_config.setflag = false;
                        addNotification('error', $translate.instant("system.vcenter.count.message.error", {details: error_data.data[0].data}));
                        $scope.vcentercount = 0;
                        $scope.vcentercountlist();
                    }
                );

            };

            $scope.vcentercountlist = function () {
                if ($scope.vcentercount === 0) {
                    $scope.vcenter_panel_config.paneldisable = true;
                } else {
                    $scope.vcenter_panel_config.paneldisable = false;
                }
            };

            $scope.vcenterRegisterControl = function () {
                $scope.vcenter_panel_config.dropOneDisable = false;
                if (!$scope.is_CS_foundation && $scope.oneviewcount === 0){
                    $scope.vcenter_panel_config.dropOneDisable = true; 
                }
            };

            //only init vcenter related data loading when it is ok to show vcenter
            //init calls
            if ($scope.showvCenterReg === true) {
                $scope.vcentercountlist();
                //This function to get the count of vcenters.
                $scope.managevcentercount();
            }

            $scope.$on('tableSelectionChanged', function ($event, selections, table_id) {
                $scope.selectedDatas = selections;
                $scope.selected_rows = $translate.instant('system.manage.modal.table.selected.count',
                    {num: selections.length});
            });

            $scope.cancelManagerVcenterModal = function () {
                $scope.managevcentersFlag = false;
            };

            $scope.getVCenter_List = function () {
                $scope.ManageVcenterLoading = true;
                var request = {
                    'operation': 'vcenters'
                };
                bllApiRequest.get("vcenters", request).then(
                    function (data) {
                        //this is the method called when the bll call is successful
                        if (data.status == 'complete') {
                            if (angular.isDefined(data.data)) {
                                var centerList = data.data;
                                centerList.forEach(function(datum) {
                                    //in enterprise environment, the data comes back
                                    //with user_name key while in non-enterprise environment
                                    //data comes back with username key
                                    datum.username = datum.username ? datum.username : datum.user_name;
                                });

                                $scope.vcenter_data = centerList;
                            }
                        } else {
                            addNotification('error',
                                $translate.instant('system.vcenter.list.message.error'));
                        }
                        $scope.ManageVcenterLoading = false;
                    },
                    function (error_data) {
                        //this is the method called when the bll call fails with error
                        $scope.ManageVcenterLoading = false;
                        addNotification('error', $translate.instant("system.vcenter.list.message.error", {details: error_data.data[0].data}));
                    });
            };

            $scope.showManageVcentersModal = function () {
                $scope.vcenter_data = [];
                $scope.managevcentersFlag = true;
                $scope.getVCenter_List();
            };

            $scope.commitRemoveVcenter = function() {
                var progress_count = 0;
                $scope.vcenterActionFlag = true;
                $scope.vcenter_panel_config.setflag = true;
                var selected_rows = {};
                angular.forEach($scope.toRemoveVcenter, function (vc) {
                    if (!angular.isUndefined(vc.name)) {
                        selected_rows[vc.id] = vc.name;
                    } else {
                        selected_rows[vc.id] = vc.ip_address;
                    }
                });

                var request = {
                    operation: 'vcenters',
                    ids: selected_rows
                };

                $scope.removeVcenterOverlayFlag = true;

                bllApiRequest.delete("vcenters", request).then(
                    function (data) {
                        if (data.status === "complete") {
                            angular.forEach(data.data, function (api_reply) {
                                if (api_reply.status === "error") {
                                    addNotification("error",
                                        $translate.instant("system.delete_vcenter.messages.delete.error",
                                            {
                                                name: api_reply.name,
                                                details: api_reply.data
                                            }));
                                } else {
                                    addNotification("info",
                                        $translate.instant("system.delete_vcenter.messages.delete.success",
                                            {name: api_reply.name}));
                                    $scope.selected_rows = 0;
                                }
                            });
                        } else {
                            addNotification("error",
                                $translate.instant("system.delete_vcenter.messages.delete.common_error", {details: data.data[0].data}));
                        }
                        $scope.removeVcenterConfirmationModalFlag = false;
                        $scope.vcenterActionFlag = false;
                        $scope.vcenter_panel_config.setflag = false;
                        $scope.removeVcenterOverlayFlag = false;
                        $scope.getVCenter_List();
                        $scope.managevcentercount();
                    },
                    function (error_data) {
                        //this is the method called when the bll call fails with error
                        $scope.vcenterActionFlag = false;
                        $scope.vcenter_panel_config.setflag = false;
                        angular.forEach(error_data.data, function (api_reply) {
                            if (api_reply.status === "complete") {
                                addNotification("info",
                                    $translate.instant("system.delete_vcenter.messages.delete.success",
                                        {name: api_reply.name}));
                                $scope.selected_rows = 0;
                            } else {
                                addNotification("error",
                                    $translate.instant("system.delete_vcenter.messages.delete.error",
                                        {
                                          name: api_reply.name,
                                          details: api_reply.data
                                        }));
                            }
                        });
                        $scope.getVCenter_List();
                        $scope.managevcentercount();
                        $scope.removeVcenterConfirmationModalFlag = false;
                        $scope.removeVcenterOverlayFlag = false;
                        //close the manage modal so we can see the error notification
                        $scope.cancelManagerVcenterModal();
                    },
                    function (progress) {

                        if(progress_count === 0) {
                            //just update the list once during progress
                            //it should show it is unregistering
                            $scope.getVCenter_List();
                            progress_count++;
                        }
                        $scope.removeVcenterOverlayFlag = false;
                        $scope.removeVcenterConfirmationModalFlag = false;
                        log('info', 'Removing vcenter registration in progress....');
                    }
                );
            };

            $scope.showRemoveVcenterModal = function (data) {
                if (!angular.isDefined(data)) {
                    return;
                }

                $scope.toRemoveVcenter = [];

                //we will only show selected data in the table
                if (!Array.isArray(data)) {
                    $scope.toRemoveVcenter = [data];
                }
                else {
                    $scope.toRemoveVcenter = $scope.selectedDatas;
                }

                $scope.removeVcenterConfirmationModalFlag = !$scope.removeVcenterConfirmationModalFlag;
                var selected_rows = {};
                $scope.toRemoveVcenter.forEach(function(datum) {
                    if ($scope.is_CS_foundation) {
                        selected_rows[datum.name] = datum.name;
                    }else{
                        selected_rows[datum.ip_address] = datum.ip_address;
                    }
                });

                $scope.toRemoveVcenterNames = Object.keys(selected_rows).join(',');
            };

            var initEditVcenterObject = function (data) {
                var toUpdate = angular.copy(data);
                $scope.editVcenterObject = {
                    'id': toUpdate.id,
                    'host': toUpdate.ip_address,
                    'username': toUpdate.username,
                    'password': "",
                    'showPass': false,
                    'port': toUpdate.port,
                    'portShow': false

                };
                if ($scope.is_CS_foundation) {
                    $scope.editVcenterObject.name = toUpdate.name;
                    $scope.editVcenterObject.portShow = true;
                }
            };

            $scope.showEditVcenterModal = function (data) {
                initEditVcenterObject(data);
                $scope.showItEditModalOverlayFlag = false;
                if ($scope.is_CS_foundation){
                    $scope.editVcenterName = $scope.editVcenterObject.name;
                } else{
                    $scope.editVcenterName = $scope.editVcenterObject.host;
                }
                $scope.itManageVcenterModal.addStack("system/templates/integrated_tools/edit_vcenter.html");
            };

            $scope.toggleEditShowPass = function () {
                $scope.editVcenterObject.showPass = !$scope.editVcenterObject.showPass;
            };

            $scope.cancelEditVcenter = function (closeModal) {
                closeModal();
            };

            $scope.commitEditVcenter = function () {
                $scope.showItEditModalOverlayFlag = true;
                $scope.vcenter_panel_config.setflag = true;
                $scope.vcenterActionFlag = true;
                var progress_count = 0;

                var req_data = {
                    ip_address: $scope.editVcenterObject.host,
                    username: $scope.editVcenterObject.username,
                    password: $scope.editVcenterObject.password,
                    port: $scope.editVcenterObject.port,
                    type: 'vcenter',
                    id: $scope.editVcenterObject.id
                };
                if ($scope.is_CS_foundation) {
                    req_data.name = $scope.editVcenterObject.name;
                }
                var req = {
                    'operation': 'edit_vcenter',
                    'data': req_data
                };

                bllApiRequest.put('vcenters', req).then(
                    function (data) {
                        addNotification('info', $translate.instant("system.vcenter.edit.message.success",
                            {name: $scope.editVcenterObject.name !== isUndefined ? $scope.editVcenterObject.name : $scope.editVcenterObject.host}));

                        $scope.vcenterActionFlag = false;
                        $scope.showItEditModalOverlayFlag = false;
                        $scope.vcenter_panel_config.setflag = false;
                        $scope.getVCenter_List();
                    },
                    function (error_data) {
                        $scope.vcenterActionFlag = false;
                        $scope.showItEditModalOverlayFlag = false;
                        $scope.vcenter_panel_config.setflag = false;
                        $scope.getVCenter_List();
                        var error_msg = error_data.data[0].data;
                        addNotification('error', $translate.instant("system.vcenter.edit.message.error", {
                            name: $scope.editVcenterObject.name !== isUndefined ? $scope.editVcenterObject.name : $scope.editVcenterObject.host,
                            details: error_msg
                        }));
                        //close the manage modal so we can see the errors.
                        $scope.cancelManagerVcenterModal();
                    },
                    function (progress) {
                        if(progress_count === 0) {
                            $scope.getVCenter_List();
                            progress_count++;
                        }
                        log('debug', "Updating Vcenter in progress " + $scope.editVcenterObject.name !== isUndefined ? $scope.editVcenterObject.name : $scope.editVcenterObject.host);
                    }
                );
            };

            $scope.openOpenstackPortal = function () {
                var protocol = $location.protocol();
                var host = $scope.cmc_dcm_vip;
                var delimeter = ":";
                var separator = "//";
                var new_url = protocol + delimeter + separator + host;
                $window.open(new_url, "_blank");
            };

            function getAbsUrl(protocol, port, path) {
                var ret_url = protocol + "://" + $scope.deploy_enterprise_vip_can + ":" + port;
                if (!angular.isUndefined(path)) {
                    ret_url = ret_url + "/" + path;
                }
                return ret_url;
            }

            $scope.openCSAConsole = function () {
                $window.open(getAbsUrl("https", "8444", "csa"), "_blank");
            };

            $scope.openMarketPortal = function () {
                $window.open(getAbsUrl("https", "8089"), "_blank");
            };

            $scope.openOperationsOrchestration = function () {
                $window.open(getAbsUrl("https", "9090"), "_blank");
            };


            //
            //OneView
            //
            $scope.oneview_panel_config = {

                header: {
                    label: $translate.instant("system.HPEoneviewlabel"),
                    description: $translate.instant("system.HPEoneview.header")
                },
                count: {
                    count: $scope.oneviewcount,
                    label: $translate.instant("system.HPEoneview.appliances")
                },
                actionConfig: [{
                    label: $translate.instant("system.HPEoneview.connectoneview"),
                    action: function () {
                        $scope.connectoneview();
                    }
                }, {
                    label: $translate.instant("system.HPEoneview.manageoneview"),
                    action: function () {
                        $scope.manageoneview();
                    }
                }
                ],
                paneldisable: $scope.icspPanelControl,
                setflag: $scope.oneviewActionFlag
            };
            $scope.icsp_panel_config = {

                header: {
                    label: $translate.instant("system.icsplabel"),
                    description: $translate.instant("system.icsplabel.header")
                },
                count: {
                    count: $scope.icspcount,
                    label: $translate.instant("system.icsplabel.server")
                },
                actionConfig: [{
                    label: $translate.instant("system.icsplabel.connecticsp"),
                    action: function () {
                        $scope.connecticsp();
                    }
                }, {
                    label: $translate.instant("system.icsplabel.manageicsp"),
                    action: function () {
                        $scope.manageicsp();
                    }
                }
                ],
                paneldisable: true,
                setflag: $scope.icspActionFlag
            };
            $scope.infoOneViewModalFlag = false;//used to show error messages
            $scope.closeInfoOneViewmodal = function () {
                $scope.infoOneViewModalFlag = false;
            };
            $scope.manageOneViewPage = "system/templates/integrated_tools/manageoneview_content.html";
            $scope.manageoneview = function () {
                $scope.selectedDatas = [];
                $scope.manageoneviewFlag = !$scope.manageoneviewFlag;
                $scope.connectOneViewEnable = true;
                $scope.getOneView_List();

            };
            $scope.connectOneViewPage = "system/templates/integrated_tools/registeroneview_content.html";
            $scope.connectoneview = function () {
                $scope.HPEoneviewname = "";
                $scope.HPEoneviewhost = "";
                $scope.HPEoneviewdetails = "";
                $scope.HPEoneviewappliancedomainname = "";
                $scope.HPEoneviewapplianceusername = "";
                $scope.HPEoneviewappliancepassword = "";
                $scope.connectOneViewEnable = true;
                $scope.connectTestOneViewEnable = false;
                $scope.conectInputDataField = false;
                $scope.connectoneviewFlag = !$scope.connectoneviewFlag;
                //clean the form
                if (angular.isDefined($scope.registerOneViewFormInput)) {
                    $scope.registerOneViewFormInput.$setPristine();
                }
            };
            $scope.inputPass = false;
            $scope.toggleShowPassword = function () {
                $scope.inputPass = !$scope.inputPass;
            };

            $scope.checkregisterOneviewTestConnection = function () {
                $scope.connectOneViewEnable = true;
                $scope.connectTestOneViewEnable = true;
                $scope.conectInputDataField = true; //used to disable inputs
                var request = {
                    'operation': 'oneviews.verify',
                    "username": $scope.HPEoneviewapplianceusername,
                    "password": $scope.HPEoneviewappliancepassword,
                    "host": $scope.HPEoneviewhost
                };
                if(angular.isDefined($scope.HPEoneviewappliancedomainname) &&
                    $scope.HPEoneviewappliancedomainname !== null && $scope.HPEoneviewappliancedomainname !== "" ){
                    request.domain = $scope.HPEoneviewappliancedomainname;
                }
                bllApiRequest.get("ace", request).then(
                    function (data) {
                        var msg = $translate.instant("system.oneview.verifyconnection.message.success",
                            {'oneview': request.host});
                        ToastNotifications.addToast('success', msg);
                        addNotification('info', msg);
                        log('info', 'Successuflly tested HPE OneView connection for ' + request.host);
                        $scope.connectOneViewEnable = false;
                        $scope.connectTestOneViewEnable = false;
                        $scope.conectInputDataField = false;
                        $scope.newdataonetwo = true;
                    },
                    function (error_data) {
                        if(error_data.status === 'error') {
                            var errorMsgs = $translate.instant("system.oneview.verifyconnection.message.error", {
                                'oneview': request.host,
                                'details': error_data.data[0].data
                            });
                            addNotification('error', errorMsgs);
                            //will pop an error dialog for the problem
                            $scope.infoModalDetails = {
                                header: $translate.instant("system.modal.header.error.checktestconnection"),
                                content: errorMsgs
                            };
                            $scope.infoOneViewModalFlag = true;
                        } else if(error_data.status === 'warning') {
                            var warnMesg = $translate.instant("system.oneview.verifyconnection.message.warning", {
                                'oneview': request.host,
                                'details': error_data.data
                            });
                            addNotification('warning', warnMesg);
                            //will pop an error dialog for the problem
                            $scope.infoModalDetails = {
                                header: $translate.instant("system.modal.header.warning.checktestconnection"),
                                content: warnMesg
                            };
                            $scope.infoOneViewWarningModalFlag = true;
                        }
                        $scope.connectOneViewEnable = true;
                        $scope.conectInputDataField = false;
                        $scope.connectTestOneViewEnable = false;
                    },
                    function (progress_data) {
                        log('info', "Testing HPE OneView connection in progress for " + request.host);
                    }
                );
            };

            $scope.connectToOneView = function () {
                $scope.conectInputDataField = true;
                $scope.connectOneViewEnable = true;
                $scope.connectTestOneViewEnable = true;
                $scope.connectoneviewFlag = false;
                $scope.oneview_panel_config.setflag = true;
                var request = {
                    'operation': 'oneviews.add',
                    "username": $scope.HPEoneviewapplianceusername,
                    "password": $scope.HPEoneviewappliancepassword,
                    "host": $scope.HPEoneviewhost,
                    "description": $scope.HPEoneviewdetails,
                    "name": $scope.HPEoneviewname
                };
                if(angular.isDefined($scope.HPEoneviewappliancedomainname) &&
                    $scope.HPEoneviewappliancedomainname !== null && $scope.HPEoneviewappliancedomainname !== ""){
                    request.domain = $scope.HPEoneviewappliancedomainname;
                }
                bllApiRequest.post("ace", request).then(
                    function (data) {
                        $scope.manageoneviewcount();
                        addNotification(
                            'info',
                            $translate.instant("system.oneview.connection.message.success", {'oneview': request.host})
                        );
                        log('info', 'Successfully added HPE OneView registration ' + request.host);

                        $scope.conectInputDataField = false;
                        $scope.connectOneViewEnable = true;
                        $scope.connectTestOneViewEnable = false;
                        $scope.oneview_panel_config.setflag =false;
                    },
                    function (error_data) {
                        $scope.manageoneviewcount();
                        if(error_data.status === 'error') {
                            addNotification(
                                'error',
                                $translate.instant("system.oneview.connection.message.error", {
                                    'oneview': request.host,
                                    'details': error_data.data[0].data
                                }));
                            log('error', 'Failed to add HPE OneView registration ' + request.host);
                            log('error', JSON.stringify(error_data));
                        } else if(error_data.status === 'warning') {
                            addNotification(
                                'warning',
                                $translate.instant("system.oneview.connection.message.warning", {
                                    'oneview': request.host,
                                    'details': error_data.data
                                }));
                            log('warn', 'Warning on add HPE OneView registration ' + request.host);
                            log('warn', JSON.stringify(error_data));
                        }
                        $scope.conectInputDataField = false;
                        $scope.connectOneViewEnable = true;
                        $scope.connectTestOneViewEnable = false;
                        $scope.oneview_panel_config.setflag =false;
                    },
                    function (progress_data) {
                        log('info', "Connecting to HPE OneView in progress for " + request.host);
                    }
                );
            };
            $scope.oneviewmanageselectiondone = true;

            $scope.oneviewcountlist = function () {
                if ($scope.oneviewcount === 0) {
                    $scope.icspPanelControl = true;
                    $scope.oneview_panel_config.paneldisable = $scope.icspPanelControl;
                    $scope.icsp_panel_config.dropOneDisable = $scope.icspPanelControl;
                } else {
                    $scope.icspPanelControl = false;
                    $scope.oneview_panel_config.count.count = $scope.oneviewcount;
                    $scope.oneview_panel_config.paneldisable = $scope.icspPanelControl;
                    $scope.oneview_panel_config.setflag = $scope.oneviewActionFlag;
                    $scope.icsp_panel_config.dropOneDisable = false;
                }
                $scope.vcenterRegisterControl();
            };

            $scope.oneview_panel_config.setflag = true;
            $scope.manageoneviewcount = function () {
                $scope.oneview_panel_config.setflag = true;
                var request = {
                    'operation': 'oneviews.count'
                };
                bllApiRequest.get("ace", request).then(
                    function (data) {
                        //this is the method called when the bll call is successful
                        $scope.oneviewcount = data.data;
                        $scope.oneview_panel_config.count.count = data.data;
                        $scope.oneview_panel_config.setflag = false;
                        $scope.oneviewcountlist();
                        $scope.vcenterRegisterControl();
                    },
                    function (error_data) {//this is the method called when the bll call fails with error
                        $scope.oneview_panel_config.setflag = false;
                        addNotification('error', $translate.instant("system.oneview.count.error", {data: error_data.data[0].data}));
                        $scope.oneviewcount = 0;
                    }
                );

            };

            $scope.getOneView_List = function () {
                $scope.oneviewlist = [];
                $scope.ManageOneviewLoading = true;
                var request = {
                    'operation': 'oneviews.list'
                };
                return bllApiRequest.get("ace", request).then(
                    function (data) {
                        //this is the method called when the bll call is successful
                        if (data.status == 'complete') {
                            $scope.oneviewlist = data.data;
                        } else {
                            addNotification('error',
                                $translate.instant('system.oneview.manage.message.list_error', {data: data.data[0].data}));
                        }
                        $scope.ManageOneviewLoading = false;
                    },
                    function (error_data) {
                        //this is the method called when the bll call fails with error
                        $scope.ManageOneviewLoading = false;
                        addNotification('error', $translate.instant("system.oneview.manage.message.list_error", {data: error_data.data[0].data}));
                    }
                );
            };

            $scope.multiSelectActionMenuPermissionsCheckICSP = function (data, actionName) {
                if (data.length > 1 && (actionName === 'editICspServer' || actionName === "editICspConnection" || actionName === "removeICspConnection")) {
                    return {
                        hidden: false,
                        enabled: false
                    };
                }

                return {
                    hidden: false,
                    enabled: true
                };
            };

            $scope.actionMenuPermissionsCheck = function (data, actionName) {//rename and document this
                var actionPermissions = {
                    enabled: true,
                    hidden: false
                };
                if ($scope.selectedDatas === undefined) {
                    $scope.selectedDatas = [];
                }
                if ($scope.selectedDatas.length > 1 && actionName === 'edit') {
                    return {
                        hidden: false,
                        enabled: false
                    };
                }
                if (actionName === 'edit' && data.status === 'discovery') {
                    return {
                        hidden: false,
                        enabled: false
                    };
                }
                if ($scope.selectedDatas.length > 1 && actionName === 'console') {
                    return {
                        hidden: false,
                        enabled: false
                    };
                }
                if ($scope.selectedDatas.length > 1 && (actionName === 'remove' || actionName === 'refresh')) {
                    return {
                        hidden: false,
                        enabled: false
                    };
                }
                if ($scope.selectedDatas.length > 1 && (actionName === 'editServer' || actionName === "editConnection")) {
                    return {
                        hidden: false,
                        enabled: false
                    };
                }

                return actionPermissions;
            };
            $scope.oneViewStatusDisplayFunction = function (data) {
                //TODO: Will fix it after this Jira bug CLDSYS-13545 gets resolved.
                if (angular.isDefined(data.status)) {
                    return $translate.instant('system.HPEoneview.manage.table.status.' + data.status.toLowerCase());
                } else {
                    return "NA";
                }
            };

            $scope.multiSelectActionMenuPermissionsCheckOneView = function (data, actionName) {
                if (data.length > 1 && (actionName === 'removeOneViewAppliance' || actionName === 'refreshOneViewAppliance')) {
                    return {
                        hidden: false,
                        enabled: false
                    };
                }

                return {
                    hidden: false,
                    enabled: true
                };
            };
            $scope.oneViewRowSelectionCheck = function (data) {
                if (data.status.toLowerCase() === 'discovery') {
                    return false;
                }
                return true;
            };

            $scope.manageoneview_table_config = {
                headers: [
                    {
                        name: $translate.instant('system.HPEoneview.connect.table.header.appliances'),
                        displayfield: "name",
                        sortfield: 'name',
                        isNotHtmlSafe: true
                    },
                    {
                        name: $translate.instant('system.HPEoneview.manage.table.header.appliances'),
                        displayfield: "status",
                        sortfield: 'status',
                        specialColumnType: 'custom',
                        customDisplayFilter: $scope.oneViewStatusDisplayFunction
                    },
                    {
                        name: $translate.instant('system.HPEoneview.connect.table.header.address'),
                        type: "string",
                        displayfield: "host",
                        sortfield: 'host'
                    },
                    {
                        name: $translate.instant('system.HPEoneview.manage.table.header.user'),
                        type: "string",
                        displayfield: "username",
                        sortfield: 'username',
                        isNotHtmlSafe: true
                    },
                    {
                        name: $translate.instant('system.HPEoneview.manage.table.header.description'),
                        type: "string",
                        displayfield: "description",
                        sortfield: 'description',
                        isNotHtmlSafe: true
                    }
                ],
                multiSelectActionMenuConfigFunction: $scope.multiSelectActionMenuPermissionsCheckOneView,
                multiSelectActionMenuConfig: [{
                    label: $translate.instant('system.HPEoneview.manage.removeappliance'),
                    name: 'removeOneViewAppliance',
                    action: function (data) {
                        data.forEach($scope.removeOneViewAppliance);
                    }
                }, {
                    label: $translate.instant("system.HPEoneview.manage.refresh"),
                    name: "refreshOneViewAppliance",
                    action: function (data) {
                        $scope.currentRefreshOneViewAppliance = data;
                        $scope.showCommitRefresh = true;
                    }
                }],

                globalActionsConfig: [{
                    label: $translate.instant('system.HPEoneview.manage.editappliance'),
                    name: 'editOneViewAppliance',
                    action: function (data) {
                        $scope.editOneViewModal($scope.selectedDatas[0]);
                    },
                    disable: $scope.disableCreate
                }],
                globalActionsConfigFunction: function (data, name) {
                    if ($scope.selectedDatas === undefined) {
                        $scope.selectedDatas = [];
                    }
                    if (name === 'editOneViewAppliance' && $scope.selectedDatas.length !== 1) {
                        return true;
                    } else {
                        return false;
                    }
                },

                pageConfig: {
                    page: 1,
                    pageSize: 20
                },
                rowSelectionCheck: $scope.oneViewRowSelectionCheck,
                actionMenuConfigFunction: $scope.actionMenuPermissionsCheck,
                actionMenuConfig: [{
                    label: $translate.instant("system.HPEoneview.manage.editappliance"),
                    name: "edit",
                    action: function (data) {
                        $scope.editOneViewModal(data);
                    }
                }, {
                    label: $translate.instant("system.HPEoneview.manage.refresh"),
                    name: "refresh",
                    action: function (data) {
                        $scope.currentRefreshOneViewAppliance = data;
                        $scope.showCommitRefresh = true;
                    }
                }, {
                    label: $translate.instant("system.HPEoneview.manage.oneviewconsole"),
                    name: "console",
                    action: function (data) {
                        $window.open("http://" + data.host, '_blank');
                    }
                }, {
                    label: $translate.instant("system.HPEoneview.manage.removeappliance"),
                    name: "remove",
                    action: function (data) {
                        $scope.removeOneViewAppliance(data);
                    }
                }]
            };

            $scope.$watch('selectedDatas', function (newValue, oldValue) {
                if ($scope.selectedDatas === undefined) {
                    $scope.editOneViewAppliance = [];
                } else {
                    $scope.editOneViewAppliance = $scope.selectedDatas[0];
                }
            });

            $scope.editOneViewModal = function (data) {
                $scope.editOneViewAppliance = {
                    "id": data.id,
                    "name": data.name,
                    "description": data.description,
                    "host": data.host,
                    "domainname": data.domain,
                    "user_name": data.username,
                    "password": ""
                };
                //while the action menu is using the $parent scope to put the data in edit modal input fields
                $scope.$parent.$parent.$parent.$parent.editOneViewAppliance = {
                    "id": data.id,
                    "name": data.name,
                    "description": data.description,
                    "host": data.host,
                    "domainname": data.domain,
                    "user_name": data.username,
                    "password": ""
                };
                $scope.connectTestOneViewEnable = false;
                $scope.conectInputDataField = false;
                //while the action menu is using the $parent scope to put the data in edit modal input fields
                $scope.$parent.$parent.$parent.$parent.connectTestOneViewEnable = false;
                $scope.$parent.$parent.$parent.$parent.conectInputDataField = false;
                $scope.addStack("system/templates/integrated_tools/editoneview_content.html");
            };

            $scope.checkEditOneviewTestConnection = function () {
                $scope.connectOneViewEnable = true;
                $scope.connectTestOneViewEnable = true;
                $scope.conectInputDataField = true; //used to disable input field
                var request = {
                    'operation': 'oneviews.verify',
                    "username": $scope.editOneViewAppliance.user_name,
                    "password": $scope.editOneViewAppliance.password,
                    "host": $scope.editOneViewAppliance.host
                };
                if(angular.isDefined($scope.editOneViewAppliance.domainname) &&
                    $scope.editOneViewAppliance.domainname !== null && $scope.editOneViewAppliance.domainname !== ""){
                    request.domain = $scope.editOneViewAppliance.domainname;
                }
                bllApiRequest.get("ace", request).then(
                    function (data) {
                        var msg =  $translate.instant("system.oneview.verifyconnection.message.success",
                            {'oneview': request.host});
                        ToastNotifications.addToast('success', msg);
                        addNotification('info', msg);
                        $scope.connectOneViewEnable = false;
                        $scope.connectTestOneViewEnable = false;
                        $scope.conectInputDataField = false;
                        $scope.newdataonetwo = true;
                        log('info', "Successfully tested HPE OneView connection for " + request.host);
                    },
                    function (error_data) {
                        if(error_data.status === 'error') {
                            var errorMsgs =
                                $translate.instant("system.oneview.verifyconnection.message.error", {
                                    'oneview': request.host,
                                    'details': error_data.data[0].data
                                });
                            addNotification('error', errorMsgs);
                            $scope.infoModalDetails = {
                                header: $translate.instant("system.modal.header.error.checktestconnection"),
                                content: errorMsgs
                            };
                            $scope.infoOneViewModalFlag = true;
                        } else if(error_data.status === 'warning') {
                            var warningMsg =
                                $translate.instant("system.oneview.verifyconnection.message.warning", {
                                    'oneview': request.host,
                                    'details': error_data.data ? error_data.data : error_data.data[0].data
                                });
                            addNotification('error', warningMsg);
                            $scope.infoModalDetails = {
                                header: $translate.instant("system.modal.header.warning.checktestconnection"),
                                content: warningMsg
                            };
                            $scope.infoOneViewWarningModalFlag = true;
                        }
                        $scope.connectOneViewEnable = true;
                        $scope.conectInputDataField = false;
                        $scope.connectTestOneViewEnable = false;
                    },
                    function (progress_data) {
                        log('info', "Testing HPE OneView connection in progress for " + request.host);
                    }
                );
            };
            $scope.updateToOneView = function () {
                $scope.connectTestOneViewEnable = true;
                $scope.connectOneViewEnable = true;
                $scope.ManageOneviewLoading = true;//used it indicate there is a updating for now
                var request = {
                    'operation': 'oneviews.update',
                    "ov_id": $scope.editOneViewAppliance.id ? $scope.editOneViewAppliance.id : $scope.editOneViewAppliance.uuid,
                    "username": $scope.editOneViewAppliance.user_name,
                    "password": $scope.editOneViewAppliance.password,
                    "host": $scope.editOneViewAppliance.host,
                    "description": $scope.editOneViewAppliance.description,
                    "name": $scope.editOneViewAppliance.name
                };
                if(angular.isDefined($scope.editOneViewAppliance.domainname) &&
                    $scope.editOneViewAppliance.domainname !== null && $scope.editOneViewAppliance.domainname !== ""){
                    request.domain = $scope.editOneViewAppliance.domainname;
                }
                bllApiRequest.post("ace", request).then(
                    function (data) {
                        $scope.connectTestOneViewEnable = false;
                        $scope.connectOneViewEnable = true;
                        $scope.getOneView_List();
                        addNotification(
                            'info',
                            $translate.instant("system.HPEoneview.update.message.success", {'oneview': request.host})
                        );
                        log('info', "Successfully updated HPE OneView registration " + request.host);
                        $scope.ManageOneviewLoading = false;
                        $scope.oneview_panel_config.setflag = false;
                    },
                    function (error_data) {
                        if(error_data.status === 'error') {
                            addNotification(
                                'error',
                                $translate.instant("system.HPEoneview.update.message.error", {
                                    'oneview': request.host,
                                    'details': error_data.data[0].data
                                })
                            );

                            log('error', "Failed to update HPE OneView registration " + request.host);
                            log('error', JSON.stringify(error_data));
                        } else if(error_data.status === 'warning') {
                            addNotification(
                                'warning',
                                $translate.instant("system.HPEoneview.update.message.waring", {
                                    'oneview': request.host,
                                    'details': error_data.data
                                })
                            );

                            log('warn', "Warning on update HPE OneView registration " + request.host);
                            log('warn', JSON.stringify(error_data));
                        }
                        $scope.getOneView_List();
                        $scope.connectTestOneViewEnable = false;
                        $scope.connectOneViewEnable = true;
                        $scope.ManageOneviewLoading = false;
                        $scope.oneview_panel_config.setflag =false;
                    },
                    function (progress_data) {
                        $scope.getOneView_List();
                        log('info', "Updating HPE OneView registration in progress for " + request.host);
                    });
            };
            $scope.removeoneviewbuttondisable = false;
            $scope.removeOneViewModalFlag = false;
            //show the remove oneview modal
            $scope.removeOneViewAppliance = function (data) {
                $scope.removeOneViewData = data;
                if ($scope.selectedDatas === undefined) {
                    $scope.selectedDatas = [];
                }
                $scope.oneViewMsgShow = !$scope.is_CS_foundation && ($scope.selectedDatas.length === $scope.oneviewcount);
                $scope.$parent.$parent.$parent.$parent.removeOneViewData = data;
                $scope.$parent.$parent.$parent.$parent.removeOneViewModalFlag = true;
            };

            $scope.closeRemoveOneViewmodal = function () {
                $scope.removeOneViewModalFlag = false;
            };

            $scope.commitRemoveOneviewAppliance = function () {
                $scope.removeoneviewbuttondisable = true;
                $scope.removeOneViewOverlayFlag = true;
                $scope.manageoneviewFlag = false;
                $scope.oneview_panel_config.setflag =true;
                var request = {
                    'operation': 'oneviews.delete',
                    "ov_id": $scope.removeOneViewData.id ? $scope.removeOneViewData.id : $scope.removeOneViewData.uuid
                };
                var host = $scope.removeOneViewData.host;
                bllApiRequest.delete("ace", request).then(
                    function (data) {
                        $scope.removeoneviewbuttondisable = false;
                        $scope.removeOneViewModalFlag = false;
                        $scope.getOneView_List();
                        $scope.manageoneviewcount();
                        addNotification(
                            'info',
                            $translate.instant("system.HPEoneview.delete.message.success", {'oneview': host})
                        );
                        log('info', "Successfully deleted HPE OneView registration " + host);
                        $scope.removeOneViewOverlayFlag = false;
                        $scope.oneview_panel_config.setflag = false;
                    },
                    function (error_data) {
                        $scope.getOneView_List();
                        $scope.manageoneviewcount();
                        if(error_data.status === 'error') {
                            addNotification(
                                'error',
                                $translate.instant("system.HPEoneview.delete.message.error", {
                                    'oneview': host,
                                    'details': error_data.data[0].data
                                }));
                            log('error', "Failed to delete HPE OneView registration " + host);
                            log('error', JSON.stringify(error_data));
                        } else if(error_data.status === 'warning') {
                            addNotification(
                                'warning',
                                $translate.instant("system.HPEoneview.delete.message.warning", {
                                    'oneview': host,
                                    'details': error_data.data
                                }));
                            log('warn', "warning on delete HPE OneView registration " + host);
                            log('warn', JSON.stringify(error_data));
                        }
                        $scope.removeOneViewModalFlag = false;
                        //$scope.$parent.$parent.$parent.$parent.removeOneViewModalFlag = false;
                        $scope.removeoneviewbuttondisable = false;
                        $scope.removeOneViewOverlayFlag = false;
                        $scope.oneview_panel_config.setflag = false;
                    },
                    function (progress_data) {
                        $scope.removeOneViewModalFlag = false;
                        $scope.removeOneViewOverlayFlag = false;
                        log('info', 'Deleting HPE OneView registration in progress for ' + host);
                    }
                );
            };

            $scope.commitRefresh = function() {
                $scope.showCommitRefresh = false;
                if(Array.isArray($scope.currentRefreshOneViewAppliance)) {
                    $scope.currentRefreshOneViewAppliance.forEach($scope.refreshOneViewAppliance);
                } else {
                    $scope.refreshOneViewAppliance($scope.currentRefreshOneViewAppliance);
                }
            };

            $scope.setoneviewStatusRefreshing = function(host){
                var i = 0;
                var oneviewList = $scope.$parent.$parent.$parent.$parent.oneviewlist;
                for(i = 0; i < oneviewList.length; i++){
                    if(oneviewList[i].host === host && angular.isUndefined(oneviewList[i].prevStatus)){
                        oneviewList[i].prevStatus = oneviewList[i].status;
                        oneviewList[i].status = "refreshing";//localized by default to system.HPEoneview.manage.table.status.refreshing
                    }
                }
            };

            $scope.updateOneviewStatusInTable = function(host, hasError){
                var status;
                $scope.oneviewlist.forEach(function(datum) {
                    if (datum.host === host) {
                        status = datum.status;
                    }
                });
                var i = 0;
                //this is the existing table oneviewlist
                var oneviewList = $scope.$parent.$parent.$parent.$parent.oneviewlist;
                for(i = 0; i < oneviewList.length; i++){
                    if(oneviewList[i].host === host) {
                        if (angular.isDefined(status)) {
                            oneviewList[i].status = status;
                            oneviewList[i].prevStatus = undefined;
                        }
                        else if (!hasError) {
                            //for some reason don't have status
                            if(angular.isDefined(oneviewList[i].prevStatus)) {
                                oneviewList[i].status = oneviewList[i].prevStatus;
                                oneviewList[i].prevStatus = undefined;
                            }
                            else {
                                //guess status for a good refresh
                                oneviewList[i].status = 'Connected';
                            }
                        }
                        else { //has error, has no status
                            //should not get here...just guess a status
                            oneviewList[i].status = 'Error';
                            oneviewList[i].prevStatus = undefined;
                        }
                    }
                }
            };

            $scope.refreshOneViewAppliance = function (data) {
                var request = {
                    'operation': 'oneviews.refresh_hardware',
                    "ov_id": data.id ? data.id : data.uuid
                };
                var host = data.host;
                $scope.setoneviewStatusRefreshing(host);

                bllApiRequest.post("ace", request).then(
                    function (data) {
                        var msg = $translate.instant("system.HPEoneview.refresh.success", {
                            'host': host
                        });
                        addNotification('info', msg);
                        ToastNotifications.addToast('success', msg);
                        log('info', "Successfully Refreshed HPE OneView " + host);

                        //get list and update the status in the table
                        $scope.getOneView_List().then(function() {
                            $scope.updateOneviewStatusInTable(host);
                        });
                    },
                    function (error_data) {
                        var msg = $translate.instant("system.HPEoneview.refresh.error", {
                            'host': host,
                            'details': error_data.data[0].data
                        });
                        addNotification('error', msg);
                        ToastNotifications.addToast('error', msg);

                        log('error', "Failed to refresh HPE OneView " + host);
                        log('error', JSON.stringify(error_data));

                        //get list and update the status in the table
                        $scope.getOneView_List().then(function() {
                            $scope.updateOneviewStatusInTable(host, true);
                        });
                    },
                    function (progress_data) {
                        log('info', 'Refreshing HPE OneView is in progress for ' + host);
                    }
                );
            };

            $scope.manageICSPPageTemplate = "system/templates/integrated_tools/manageicsp_content.html";
            $scope.manageicsp = function () {
                $scope.selectedDatas = [];
                $scope.getICsp_List();
                $scope.manageIcspFlag = !$scope.manageIcspFlag;
                $scope.connectOneViewEnable = true;

            };

            $scope.iscpProgressFlasg = false;
            $scope.connectICSPPageTemplate = "system/templates/integrated_tools/connecticsp_content.html";
            $scope.connecticsp = function () {
                $scope.closeConnectIcspModal();
                $scope.connectIcspFlag = !$scope.connectIcspFlag;
                $scope.applianceOneViewlist = [];
                $scope.connectOneViewEnable = true;
                //clean the form
                if (angular.isDefined($scope.connectIcspFormInput)) {
                    $scope.connectIcspFormInput.$setPristine();
                }
            };

            $scope.closeConnectIcspModal = function () {
                $scope.HPEicspServerAddress = "";
                $scope.HPEicspServerUsername = "";
                $scope.HPEicspServerPassword = "";
            };

            $scope.manageicsp_table_config = {
                headers: [
                    {
                        name: $translate.instant('system.icsp.table.header.address'),
                        type: "string",
                        displayfield: "icsp_host",
                        sortfield: 'icsp_host'
                    },
                    {
                        name: $translate.instant('system.icsp.table.header.user'),
                        type: "string",
                        displayfield: "icsp_username",
                        sortfield: 'icsp_username'
                    },
                    {
                        name: $translate.instant('system.icsp.table.header.oneviewapp'),
                        type: "string",
                        displayfield: "oneview_appliances",
                        sortfield: 'oneview_appliances'


                    }
                ],
                multiSelectActionMenuConfigFunction: $scope.multiSelectActionMenuPermissionsCheckICSP,
                multiSelectActionMenuConfig: [{
                    label: $translate.instant('system.icsp.manage.editconnection'),
                    name: 'editICspConnection',
                    action: function (data) {
                        $scope.editIcspConnectionModal($scope.selectedDatas[0]);
                    }
                }, {
                    label: $translate.instant('system.icsp.manage.removeserver'),
                    name: 'removeICspConnection',
                    action: function (data) {
                        $scope.removeICSPServerModal($scope.selectedDatas[0]);
                    }
                }],

                globalActionsConfig: [{
                    label: $translate.instant('system.icsp.manage.editserver'),
                    name: 'editICspServer',
                    action: function (data) {
                        $scope.editIcspServerModal($scope.selectedDatas[0]);
                    },
                    disable: $scope.disableCreate
                }],
                globalActionsConfigFunction: function (data, name) {
                    if ($scope.selectedDatas === undefined) {
                        $scope.selectedDatas = [];
                    }
                    if (name === 'editICspServer' && $scope.selectedDatas.length !== 1) {
                        return true;
                    } else {
                        return false;
                    }
                },

                pageConfig: {
                    page: 1,
                    pageSize: 20
                },
                actionMenuConfigFunction: $scope.actionMenuPermissionsCheck,
                actionMenuConfig: [{
                    label: $translate.instant('system.icsp.manage.editconnection'),
                    name: 'editConnection',
                    action: function (data) {
                        $scope.editIcspConnectionModal(data);
                    }
                }, {
                    label: $translate.instant("system.icsp.manage.editserver"),
                    name: "editServer",
                    action: function (data) {
                        $scope.editIcspServerModal(data);
                    }
                }, {
                    label: $translate.instant("system.icsp.manage.removeserver"),
                    name: "remove",
                    action: function (data) {
                        $scope.removeICSPServerModal(data);
                    }
                }]
            };

            $scope.editIcspServerModal = function (data) {
                $scope.$parent.$parent.$parent.$parent.editicspServer = {
                    "data": data,
                    "icsp_username": data.icsp_username,
                    "icsp_name": data.icsp_name,
                    "icsp_host": data.icsp_host
                };
                $scope.addStack("system/templates/integrated_tools/editicsp_server_content.html");
            };

            $scope.editIcspConnectionModal = function (data) {
                $scope.$parent.$parent.$parent.$parent.editicspConnection = {
                    "icsp_username": data.icsp_username,
                    "data": data
                };

                $scope.$parent.$parent.$parent.$parent.editicspConnectionOvData = data.ov_registrations;
                $scope.addStack("system/templates/integrated_tools/editicsp_connection_content.html");
            };

            $scope.updateOneViewToICsp = function () {
                if (angular.isUndefined($scope.selectedDatas)) {
                    $scope.editicspConnectionOvData = [];
                } else {
                    $scope.editicspConnectionOvData = $scope.selectedDatas;
                }
            };

            $scope.minUpdateOneViewAddedForICSP = function () {
                if (angular.isUndefined($scope.editicspConnectionOvData) ||
                    $scope.editicspConnectionOvData.length === 0) {
                    return false;
                }
                return true;
            };

            $scope.minOneViewSelectionForICSP = function () {
                if (angular.isUndefined($scope.selectedDatas) ||
                    $scope.selectedDatas.length === 0) {
                    return false;
                }
                return true;
            };

            $scope.inputShowPassIcsp = false;
            $scope.toggleEditIcspShowPassword = function () {
                $scope.inputShowPassIcsp = !$scope.inputShowPassIcsp;
            };

            $scope.closeEditIcspModal = function () {
                $scope.editicspConnection = {};
                $scope.editicspServer = {};
                //clean the form
                if (angular.isDefined($scope.editIcspFormInput)) {
                    $scope.editIcspFormInput.$setPristine();
                }
            };
            $scope.icspCountList = function () {
                if ($scope.icspCount === 0) {
                    $scope.icspPanelControl = true;
                    $scope.icsp_panel_config.count.count = $scope.icspCount;
                    $scope.icsp_panel_config.paneldisable = $scope.icspPanelControl;
                } else {
                    $scope.icspPanelControl = false;
                    $scope.icsp_panel_config.count.count = $scope.icspCount;
                    $scope.icsp_panel_config.paneldisable = $scope.icspPanelControl;
                }
            };

            $scope.manageICSPcount = function () {
                $scope.icsp_panel_config.setflag = true;
                $scope.icsp_count_list = [];
                $scope.icspCount = 0;
                var request = {
                    "operation": "icsps.list"
                };
                bllApiRequest.get("ace", request).then(
                    function (data) {
                        if (angular.isDefined(data.data.icsps)) {
                            //only count the one with oneview registration
                            for (var idx in data.data.icsps) {
                                if (angular.isDefined(data.data.icsps[idx].ov_registrations) &&
                                    data.data.icsps[idx].ov_registrations.length > 0)
                                    $scope.icspCount++;
                            }
                            $scope.icsp_panel_config.setflag = false;
                            $scope.icspCountList();
                        }
                    },
                    function (error_data) {
                        addNotification('error', $translate.instant("system.icsp.error.getIcspCount", {'details': error_data.data[0].data}));
                        $scope.icspCount = 0;
                        $scope.icsp_panel_config.setflag = false;
                        $scope.icspCountList();
                    });
            };

            $scope.getICsp_List = function () {
                $scope.ManageIcspLoading = true;
                $scope.icsp_list = [];
                var request = {
                    "operation": "icsps.list"
                };
                bllApiRequest.get("ace", request).then(
                    function (data) {
                        //this is the method called when the bll call is successful
                        angular.forEach(data.data.icsps, function (icsp_list_data) {
                            var ov_data = icsp_list_data.ov_registrations.length;
                            icsp_list_data.oneview_appliances = ov_data;
                            $scope.icsp_list.push(icsp_list_data);
                        });
                        $scope.ManageIcspLoading = false;
                    },
                    function (error_data) {
                        //this is the method called when the bll call fails with error
                        addNotification('error', $translate.instant("system.icsp.error.getIcspList", {'details': error_data.data[0].data}));
                        $scope.ManageIcspLoading = false;
                    });
            };

            $scope.inputShowPass = false;
            $scope.toggleIcspShowPassword = function () {
                $scope.inputShowPass = !$scope.inputShowPass;
            };
            $scope.inputShowPassPass = false;
            $scope.toggleShowPassPassword = function () {
                $scope.inputShowPassPass = true;
            };
            $scope.ICSPInputDataField = false;

            $scope.addConnection_oneview_table_config = {
                headers: [
                    {
                        name: $translate.instant('system.icsp.addOneViewConnection.tabel.name'),
                        displayfield: "name",
                        sortfield: 'name',
                        isNotHtmlSafe: true
                    }
                ],
                pageConfig: {
                    page: 1,
                    pageSize: 20
                }
            };

            $scope.icspAddConnectionBtn = function () {
                $scope.addConnectionToIcspButtonVisible = false;
            };

            $scope.getICspConnectionOneView_List = function (icspOVlist) {
                $scope.oneviewConnectionList = [];
                $scope.addConnectionToIcspButtonVisible = true;
                $scope.ICspOneviewConnectionListLoading = true;
                var request = {
                    'operation': 'oneviews.list'
                };
                bllApiRequest.get("ace", request).then(
                    function (data) {
                        //this is the method called when the bll call is successful
                        if (data.status == 'complete') {
                            if(icspOVlist.length !== 0){
                                angular.forEach(data.data, function (ovData) {
                                    angular.forEach(icspOVlist, function (selectData) {
                                        var selectedOVData = selectData.oneview_id ? selectData.oneview_id : selectData.id;
                                        if(ovData.id === selectedOVData){
                                            ovData.$rowSelected = true;
                                        }
                                    });
                                    $scope.selectedDatas.push(ovData);
                                    $scope.oneviewConnectionList.push(ovData);
                                });
                            }else{
                                $scope.oneviewConnectionList = data.data;
                            }
                        } else {
                            addNotification('error',
                                $translate.instant('system.icsp.oneview.message.list_error', {'details': data.data[0].data}));
                        }
                        $scope.ICspOneviewConnectionListLoading = false;
                    },
                    function (error_data) {
                        //this is the method called when the bll call fails with error
                        $scope.ICspOneviewConnectionListLoading = false;
                        addNotification('error', $translate.instant("system.icsp.oneview.message.list_error", {'details': error_data.data[0].data}));
                    });
            };

            $scope.addOneViewToICsp = function () {
                $scope.applianceOneViewlist = $scope.selectedDatas;
            };

            $scope.hasOneViewAddedForICSP = function () {

                if (angular.isUndefined($scope.applianceOneViewlist) ||
                    $scope.applianceOneViewlist.length === 0) {
                    return false;
                }
                return true;
            };

            $scope.confirmConnectICSP = function () {
                $scope.connectICSPEnable = true;
                $scope.ICSPInputDataField = true;
                $scope.connectIcspFlag = false;
                $scope.icspActionFlag = true;
                $scope.add_ov_ids = [];
                $scope.icsp_panel_config.setflag = true;
                angular.forEach($scope.applianceOneViewlist, function (ov_data) {
                    //dealing with api changes so we can handle both id and uuid
                    if (angular.isDefined(ov_data.id)) {
                        $scope.add_ov_ids.push(ov_data.id);
                    }
                    else {
                        $scope.add_ov_ids.push(ov_data.uuid);
                    }
                });
                var req = {
                    "operation": "icsps.add",
                    "host": $scope.HPEicspServerAddress,
                    "ov_ids": $scope.add_ov_ids,
                    "password": $scope.HPEicspServerPassword,
                    "username": $scope.HPEicspServerUsername
                };
                bllApiRequest.post("ace", req).then(
                    function (data) {
                        addNotification(
                            'info',
                            $translate.instant("system.icsp.info.register.ICsp.success", {'icsp': req.host})
                        );
                        log('log', 'Successfully registered ICSP ' + req.host);
                        $scope.getICsp_List();
                        $scope.manageICSPcount();

                        $scope.ICSPInputDataField = false;
                        $scope.connectICSPEnable = false;
                        $scope.icspActionFlag = false;
                        $scope.closeConnectIcspModal();
                        $scope.icsp_panel_config.setflag = false;
                    },
                    function (error_data) {
                        if(error_data.status === 'error') {
                            addNotification(
                                'error',
                                $translate.instant("system.icsp.error.register.ICsp.failure", {
                                    'icsp': req.host,
                                    'details': error_data.data[0].data
                                }));
                            log('error', 'Failed to register ICSP ' + $scope.HPEicspServerAddress);
                            log('error', JSON.stringify(error_data));
                        } else if(error_data === 'warning') {
                            addNotification(
                                'warning',
                                $translate.instant("system.icsp.warning.register.ICsp", {
                                    'icsp': req.host,
                                    'details': error_data.data
                                }));
                            log('warn', 'Warning on register ICSP ' + $scope.HPEicspServerAddress);
                            log('warn', JSON.stringify(error_data));
                        }
                        $scope.getICsp_List();
                        $scope.ICSPInputDataField = false;
                        $scope.connectICSPEnable = false;
                        $scope.icspActionFlag = false;
                        $scope.icsp_panel_config.setflag = false;
                    },
                    function (progress) {
                        log('info', 'Registering ICSP in progress for ' + $scope.HPEicspServerAddress);
                    });
            };
            $scope.conectInputDataField = false;

            $scope.confirmUpdateIcspServer = function () {
                $scope.conectInputDataField = true;
                $scope.connectICSPEnable = true;
                $scope.ManageIcspLoading = true;
                $scope.icsp_panel_config.setflag = true;
                var host = $scope.editicspServer.icsp_host;

                var request = {
                    'operation': 'icsps.update',
                    "icsp_id": $scope.editicspServer.data.id,
                    'username': $scope.editicspServer.icsp_username,
                    "password": $scope.editicspServer.password,
                    "host": $scope.editicspServer.icsp_host
                    /*"name": $scope.editicspServer.icsp_name*/
                };

                bllApiRequest.put("ace", request).then(
                    function (data) {
                        addNotification(
                            'info',
                            $translate.instant("system.icsp.update.message.success", {'name': host})
                        );

                        $scope.getICsp_List();
                        $scope.ManageIcspLoading = false;
                        $scope.conectInputDataField = false;
                        $scope.connectICSPEnable = false;
                        $scope.icsp_panel_config.setflag = false;
                    },
                    function (error_data) {
                        if(error_data.status === 'error') {
                            addNotification(
                                'error',
                                $translate.instant("system.icsp.update.message.error", {
                                    'name': host,
                                    'details': error_data.data[0].data
                                }));
                            log('error', "Failed to update  ICsp: " + host);
                            log('error', JSON.stringify(error_data));
                        } else if(error_data === 'warning') {
                            addNotification(
                                'warning',
                                $translate.instant("system.icsp.update.message.warning", {
                                    'name': host,
                                    'details': error_data.data
                                }));
                            log('warn', "Failed to update  ICsp: " + host);
                            log('warn', JSON.stringify(error_data));
                        }
                        $scope.ManageIcspLoading = false;
                        $scope.conectInputDataField = false;
                        $scope.connectICSPEnable = false;
                        $scope.getICsp_List();
                        $scope.icsp_panel_config.setflag = false;
                    },
                    function (progress_data) {
                        log('info', 'Updating ICsp in progress for ' + host);
                    }
                );
            };

            $scope.confirmUpdateIcspConnection = function () {
                $scope.conectInputDataField = true;
                $scope.connectICSPEnable = true;
                $scope.add_ov_ids = [];
                $scope.icsp_panel_config.setflag = true;
                angular.forEach($scope.editicspConnectionOvData, function (ov_data) {
                    //dealing with api changes so we can handle both id and uuid
                    if (angular.isDefined(ov_data.id)) {
                        $scope.add_ov_ids.push(ov_data.id);
                    }
                    else {
                        $scope.add_ov_ids.push(ov_data.uuid);
                    }
                });
                var req = {
                    'operation': 'icsps.updateconnections',
                    "icsp_id": $scope.editicspConnection.data.id,
                    "username": $scope.editicspConnection.icsp_username,
                    "password": $scope.editicspConnection.password,
                    "ov_ids": $scope.add_ov_ids
                };

                var icsp_details = angular.copy($scope.editicspConnection.data);

                ToastNotifications.addToast('success', $translate.instant("system.icsp.update.message.started",
                    {'name': icsp_details.icsp_host}));
                bllApiRequest.put("ace", req).then(
                    function (data) {
                        addNotification(
                            'info',
                            $translate.instant("system.icsp.update.message.success", {'name': icsp_details.icsp_host})
                        );

                        ToastNotifications.addToast('success',
                            $translate.instant("system.icsp.update.message.success", {'name': icsp_details.icsp_host}));

                        $scope.icsp_panel_config.setflag = false;
                        $scope.conectInputDataField = false;
                        $scope.connectICSPEnable = false;
                        $scope.getICsp_List();
                    },
                    function (error_data) {
                        if(error_data.status === 'error') {
                            addNotification(
                                'error',
                                $translate.instant("system.icsp.update.message.error", {
                                    'name': icsp_details.icsp_host,
                                    'details': error_data.data[0].data
                                }));
                            ToastNotifications.addToast('error',
                                $translate.instant("system.icsp.update.message.error", {
                                    'name': icsp_details.icsp_host,
                                    'details': error_data.data[0].data
                                }));
                            log('error', "Failed to update  ICsp: " + icsp_details.icsp_host);
                            log('error', JSON.stringify(error_data));
                        } else if(error_data === 'warning') {
                            addNotification(
                                'warning',
                                $translate.instant("system.icsp.update.message.warning", {
                                    'name': $scope.editicspConnection.data.icsp_host,
                                    'details': error_data.data
                                }));
                            log('warn', "Failed to update  ICsp: " + icsp_details.icsp_host);
                            log('warn', JSON.stringify(error_data));
                        }
                        $scope.icsp_panel_config.setflag = false;
                        $scope.conectInputDataField = false;
                        $scope.connectICSPEnable = false;
                        $scope.getICsp_List();
                    },
                    function (progress_data) {
                        log('info', 'Updating ICsp connection in progress');
                    }
                );
            };

            $scope.removeICSPModalFlag = false;

            $scope.removeICSPServerModal = function (data) {
                $scope.removeIcspData = data;
                $scope.$parent.$parent.$parent.$parent.removeIcspData = data;
                $scope.$parent.$parent.$parent.$parent.removeICSPModalFlag = true;
            };

            $scope.commitRemoveIcspServer = function () {
                $scope.removeIcspOverlayFlag = true;
                $scope.icsp_panel_config.setflag = true;
                $scope.ov_ids = [];
                angular.forEach($scope.removeIcspData.ov_registrations, function (ov_data) {
                    $scope.ov_ids.push(ov_data.oneview_id);
                });
                $scope.removeDataName = $scope.removeIcspData.name;//??
                var req = {
                    "icsp_id": $scope.removeIcspData.id ? $scope.removeIcspData.id : $scope.removeIcspData.icsp_id,
                    "operation": "icsps.delete",
                    "ov_ids": $scope.ov_ids
                };
                bllApiRequest.post("ace", req).then(
                    function (data) {
                        addNotification(
                            'info',
                            $translate.instant("system.icsp.info.remove.ICsp.success", {'icsp': $scope.removeIcspData.icsp_host})
                        );
                        log('info', 'Successfully removed ICSP ' + $scope.removeIcspData.icsp_host);
                        $scope.removeICSPModalFlag = false;
                        $scope.getICsp_List();
                        $scope.manageICSPcount();
                        $scope.removeIcspOverlayFlag = false;
                        $scope.icsp_panel_config.setflag = false;
                    },
                    function (error_data) {
                        //this is the method called when the bll call fails with error
                        if(error_data.status === 'error') {
                            addNotification(
                                'error',
                                $translate.instant("system.icsp.error.remove.ICsp.failure", {
                                    'icsp': $scope.removeIcspData.icsp_host,
                                    'details': error_data.data[0].data
                                })
                            );
                            log('error', 'Failed to remove ICSP ' + $scope.removeIcspData.icsp_host);
                            log('error', JSON.stringify(error_data));
                            //$scope.infoModalDetails = {
                            //    header: $translate.instant("system.modal.header.error.ICsp"),
                            //    content: $translate.instant("system.icsp.error.remove.ICsp.failure") + ": " + error_data.data[0].data
                            //};
                        } else if(error_data.status === 'warning') {
                            addNotification(
                                'waring',
                                $translate.instant("system.icsp.waring.remove.ICsp", {
                                    'icsp': $scope.removeIcspData.icsp_host,
                                    'details': error_data.data
                                })
                            );
                            log('warn', 'Waring on remove ICSP ' + $scope.removeIcspData.icsp_host);
                            log('warn', JSON.stringify(error_data));
                        }
                        $scope.getICsp_List();
                        $scope.removeICSPModalFlag = false;
                        $scope.removeIcspOverlayFlag = false;
                        $scope.icsp_panel_config.setflag = false;
                    },
                    function (progress) {
                        log('info', 'Removing ICSP in progress for ' + $scope.removeIcspData.icsp_host);
                    }
                );
            };

            //This function to get the count of oneview and icsp
            //init call
            $scope.$watch('showOneviewReg', function() {
                if($scope.showOneviewReg === true) {
                    $scope.oneviewcountlist();
                    $scope.manageoneviewcount();
                    $scope.icspCountList();
                    $scope.manageICSPcount();
                }
            });
        }
    ]);
})(angular);
