// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function (ng) {

    'use strict';

    var p = ng.module('plugins');

    p.controller('BlockStorageController', ['$scope', '$translate', 'addNotification', '$filter', 'bllApiRequest',
        'isUndefined', 'Base64', 'clearForm', 'getVolumeStatusString',
        function ($scope, $translate, addNotification, $filter, bllApiRequest, isUndefined, Base64,
                  clearForm, getVolumeStatusString) {
            $scope.loadingData = false;
            $scope.manageCPGsFlag = false;
            $scope.editDeviceFlag = false;
            $scope.viewConfigFlag = false;
            $scope.unregisterDeviceModalFlag = false;
            $scope.block_storage_data = [];
            $scope.cpgDataLoading = false;
            $scope.showEditDeviceProgressFlag = false;
            $scope.volume_listLoadingFlag = true;
            $scope.volumeNoData = false;
            $scope.blockdeviceDataLoading = true;
            $scope.showunRegisterDeviceProgressFlag = false;
            $scope.driverListSeletedData = [];
            $scope.selectedCpgsforbackend = 0;
            $scope.backendCPGCount = 0;
            $scope.isNewVolumeTypeEmpty = false;
            $scope.addBackendConfig = "";
            $scope.ifDriverAddCalled = false;
            $scope.showRegisterDeviceProgressFlag = false;
            $scope.showUNRegisterConfirmModal = false;
            $scope.remove_cpgs_selections_len = 0;
            $scope.selectedAvailableCPGs = 0;
            $scope.volume_types = {value: "existing_vol"};
            $scope.showRemoveCPGConfirmModal = false;
            $scope.autoDiscoverSelected = false;
            $scope.usingAutoDiscoveryForFC = false;

            $scope.headers = {
                counts: $translate.instant(
                    "storage.block_storage.header2",
                    {counts: $scope.block_storage_data.length}
                )
            };


            $scope.register3PARFCDevice = {
                name: '', ipaddress: '', type: '', portnumber: '8080', username: '', password: '', sanipaddress: '',
                sanusername: '', sanpassword: '', showPass1: false, showPass2: false, copyDataToSANConf: false
            };
            $scope.$watchGroup(
                ['register3PARFCDevice.copyDataToSANConf', 'register3PARFCDevice.ipaddress', 'register3PARFCDevice.username', 'register3PARFCDevice.password'],
                function() {
                    if($scope.register3PARFCDevice.copyDataToSANConf){
                        $scope.register3PARFCDevice.sanipaddress = $scope.register3PARFCDevice.ipaddress;
                        $scope.register3PARFCDevice.sanusername = $scope.register3PARFCDevice.username;
                        $scope.register3PARFCDevice.sanpassword = $scope.register3PARFCDevice.password;
                    }
                });
            $scope.register3PARISCSIDevice = {
                name: '', ipaddress: '', type: '', portnumber: '8080', username: '', password: '', sanipaddress: '',
                sanusername: '', sanpassword: '', iscsi_ipaddress: '', showPass1: false, showPass2: false, copyDataToSANConf: false
            };
            $scope.$watchGroup(
                ['register3PARISCSIDevice.copyDataToSANConf', 'register3PARISCSIDevice.ipaddress', 'register3PARISCSIDevice.username', 'register3PARISCSIDevice.password'],
                function() {
                    if($scope.register3PARISCSIDevice.copyDataToSANConf){
                        $scope.register3PARISCSIDevice.sanipaddress = $scope.register3PARISCSIDevice.ipaddress;
                        $scope.register3PARISCSIDevice.sanusername = $scope.register3PARISCSIDevice.username;
                        $scope.register3PARISCSIDevice.sanpassword = $scope.register3PARISCSIDevice.password;
                    }
            });
            $scope.registerVSADevice = {
                name: '', clustername: '', ipaddress: '', type: '', portnumber: '8081', username: '', password: '',
                showPass: false
            };

            $scope.toggleRegisterShowPass = function (type) {
                if (type === '3ParFC') {
                    $scope.register3PARFCDevice.showPass1 = !$scope.register3PARFCDevice.showPass1;
                } else if (type === '3ParISCSI') {
                    $scope.register3PARISCSIDevice.showPass1 = !$scope.register3PARISCSIDevice.showPass1;
                } else if (type === 'vsa') {
                    $scope.registerVSADevice.showPass = !$scope.registerVSADevice.showPass;
                } else if (type === '3ParFCSan') {
                    $scope.register3PARFCDevice.showPass2 = !$scope.register3PARFCDevice.showPass2;
                } else if (type === '3ParISCSISan') {
                    $scope.register3PARISCSIDevice.showPass2 = !$scope.register3PARISCSIDevice.showPass2;
                }
            };

            $scope.counts = 0;
            $scope.headers = {
                counts: $translate.instant(
                    "storage.block_storage.header2",
                    {counts: $scope.block_storage_data.length}
                )
            };

            // Set table headers and pagging
            $scope.block_storage_table_config = {
                headers: [
                    {
                        name: $translate.instant("common.name_prompt"),
                        type: "string",
                        displayfield: "name",
                        sortfield: "name",
                        highlightExpand: true
                    },
                    {
                        name: $translate.instant("common.type"),
                        type: "string",
                        displayfield: "display_type",
                        sortfield: "display_type"
                    },
                    {
                        name: $translate.instant("common.ip_address_prompt"),
                        type: "string",
                        displayfield: "ipaddress",
                        sortfield: "ipaddress"
                    },
                    {
                        name: $translate.instant("storage.block_storage.table.header.backend_count"),
                        type: "number",
                        displayfield: "backend_count",
                        sortfield: "backend_count"
                    },
                    {
                        name: $translate.instant("common.created"),
                        type: "string",
                        displayfield: "created_at",
                        sortfield: "created_at"
                    }
                ],
                pageConfig: {
                    pageSize: 20
                },
                rowSelectionCheck: function (data) {
                    if (data.type === 'vmdk') {
                        return false;
                    }
                    return true;
                },
                actionMenuConfigFunction: function (data, actionName) {
                    var actionPermissions = {enabled: true, hidden: false};

                    if (data.type === "hp_storevirtual" && actionName === "manage_cpgs") {
                        actionPermissions = {
                            enabled: false,
                            hidden: false
                        };
                    }

                    if (data.type === "vmdk") {
                        actionPermissions = {
                            enabled: false,
                            hidden: false
                        };
                    }
                    return actionPermissions;
                },

                actionMenuConfig: [{
                    label: $translate.instant("common.edit"),
                    name: "edit",
                    action: function (data) {
                        editDevice(angular.copy(data));
                    }
                },
                    {
                        label: $translate.instant("storage.block_storage.action.manage_cpgs"),
                        name: "manage_cpgs",
                        action: function (data) {
                            manageCPGs(data);
                        }
                    },
                    //{
                    //    label: $translate.instant("storage.block_storage.action.view_config"),
                    //    name: "view_config",
                    //    action: function (data) {
                    //        viewConfig(data);
                    //    }
                    //},
                    {
                        label: $translate.instant("storage.block_storage.action.row.unregister"),
                        name: 'unregister',
                        action: function (data) {
                            $scope.unregisterDeviceModalFlag = true;
                            unregisterDevices([angular.copy(data)]);
                        }
                    }
                ],
                multiSelectActionMenuConfig: [{
                    label: $translate.instant("storage.block_storage.action.unregister"),
                    name: 'unregister',
                    action: function (data) {
                        $scope.unregisterDeviceModalFlag = true;
                        unregisterDevices(angular.copy(data));
                    }
                }
                ],
                globalActionsConfig: [
                    {
                        label: $translate.instant('storage.block_storage.global.action.registerdevice'),
                        name: 'registerdeviceaction',
                        action: function () {
                            $scope.showRegisterDeviceModal = true;
                        }
                    },

                    {
                        label: $translate.instant('storage.block_storage.global.action.managecinderbackends'),
                        name: 'managecinderbackends',
                        action: function () {
                            $scope.showManageCinderModal = true;
                            getDriverList();
                        }
                    }
                ]

            };

            $scope.manage_cpgs_table_config = {
                headers: [
                    {
                        name: $translate.instant("common.name_prompt"),
                        type: "string",
                        displayfield: "name",
                        sortfield: "name",
                        highlightExpand: true
                    },
                    {
                        name: $translate.instant("common.status"),
                        type: "string",
                        displayfield: "status",
                        sortfield: "status"
                    },
                    {
                        name: $translate.instant("storage.block_storage.cpgs.table.header.created_at"),
                        type: "string",
                        displayfield: "created_at",
                        sortfield: "created_at"
                    }
                ]
            };

            $scope.disableRowIfInProgress = function (data) {
                if (data.status === 'activating' || data.status === 'deleting') {
                    return false;
                }
                return true;
            };

            $scope.manage_cinder_table_config = {
                headers: [
                    {
                        name: $translate.instant("common.name_prompt"),
                        type: "string",
                        displayfield: "volume_backend_name",
                        sortfield: "volume_backend_name",
                        highlightExpand: true
                    },
                    {
                        name: $translate.instant("storage.block_storage.backend.hp3par_cpg.table.header.status"),
                        type: "string",
                        displayfield: "status",
                        sortfield: "status",
                        specialColumnType: 'custom',
                        customDisplayFilter: getVolumeStatusString,
                        filter: 'uppercase'
                    },
                    {
                        name: $translate.instant("common.type"),
                        type: "string",
                        displayfield: "type",
                        sortfield: "type"
                    },
                    {
                        name: $translate.instant("storage.block_storage.manage_cinder.table.header.mappings"),
                        type: "number",
                        displayfield: "mappings_list",
                        sortfield: "mappings_list"
                    }],
                rowSelectionCheck: $scope.disableRowIfInProgress
            };

            $scope.auto_discover_table_config = {
                headers: [
                    {
                        name: $translate.instant("storage.block_storage.backend.hp3par_cpg.table.header.device_name"),
                        type: "string",
                        displayfield: "name",
                        sortfield: "name",
                        highlightExpand: true
                    },
                    {
                        name: $translate.instant("storage.register.content.blockstoragedevice.general.ipaddress"),
                        type: "string",
                        displayfield: "ip_hostname",
                        sortfield: "ip_hostname"
                    },
                    {
                        name: $translate.instant("storage.register.content.blockstoragedevice.general.username"),
                        type: "number",
                        displayfield: "username",
                        sortfield: "username"
                    }],
                pageConfig: {
                    pageSize: 5
                }
            };

            function getBlockDeviceData() {
                $scope.blockdeviceDataLoading = true;
                var req = {operation: 'device_list'};
                bllApiRequest.get("block_device", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        if (data.status == 'complete') {
                            $scope.blockdeviceDataLoading = false;
                            $scope.block_storage_data = data.data;
                            angular.forEach($scope.block_storage_data, function (driver) {
                                if (driver.type === 'hp_3par_iscsi') {
                                    driver.display_type = "HP 3PAR StoreServ ISCSI";
                                } else if (driver.type === 'hp_3par_fc') {
                                    driver.display_type = "HP 3PAR StoreServ Fibre Channel";
                                } else if (driver.type === 'hp_storevirtual') {
                                    driver.display_type = "HP StoreVirtual VSA";
                                } else if (driver.type === 'vmdk') {
                                    driver.display_type = "VMware VMFS";
                                } else {
                                    driver.display_type = driver.type;
                                }
                            });
                            $scope.headers = {
                                counts: $translate.instant(
                                    "storage.block_storage.header2", {counts: $scope.block_storage_data.length})
                            };
                        } else {
                            $scope.blockdeviceDataLoading = false;
                            addNotification('error',
                                $translate.instant("storage.block_device.messages.device_list.error",
                                    {details: data.data[0].data}));
                        }
                    },
                    function (error_data) {//this is the method called when the bll call fails with error
                        $scope.blockdeviceDataLoading = false;
                        addNotification('error',
                            $translate.instant("storage.block_device.messages.device_list.error",
                                {details: "Error connecting the backend."}));
                    });
            }

            getBlockDeviceData();

            $scope.autoDiscoverTableData = [];
            $scope.autoDiscoverLoadFlag = false;
            $scope.autoDiscoverBllCall = function () {
                if ($scope.autoDiscoverSelected) {
                    var req = {operation: 'storage_systems.list'};
                    bllApiRequest.get("ace", req).then(
                        function (data) {
                            if (data.status == 'complete') {
                                $scope.autoDiscoverTableData = data.data;
                            } else {
                                addNotification('error',
                                    $translate.instant("storage.block_device.messages.auto_discover.error",
                                        {details: data.data[0].data}));
                            }
                        },
                        function (error_data) {
                            addNotification('error',
                                $translate.instant("storage.block_device.messages.auto_discover.error",
                                    {details: "Error connecting the backend."}));
                        });
                }
            };

            $scope.manage_cinder = [];
            $scope.manageCinderDataLoading = false;

            $scope.getRegisteredCPGsList = function (id) {
                $scope.cpgDataLoading = true;
                var req = {
                    operation: 'cpg_list',
                    data: {
                        device_id: id
                    }
                };

                bllApiRequest.get("block_device", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        if (data.status == 'complete') {
                            $scope.cpgDataLoading = false;
                            $scope.manage_cpgs = data.data;
                        } else {
                            $scope.cpgDataLoading = false;
                            addNotification('error',
                                $translate.instant("storage.block_device.messages.device_list.error",
                                    {details: data.data[0].data}));
                        }
                    },
                    function (error_data) {//this is the method called when the bll call fails with error
                        $scope.cpgDataLoading = false;
                        addNotification('error',
                            $translate.instant("storage.block_device.messages.device_list.error",
                                {details: error_data.data[0].data}));
                    }
                );
            };

            function manageCPGs(data) {
                $scope.manageCPGsFlag = !$scope.manageCPGsFlag;
                $scope.manage_cpgs = [];
                $scope.available_cpgs = [];
                $scope.selected_cpgs_list = [];
                $scope.device_id = data.id;

                $scope.close_manage_cpgs_modal = function () {
                    $scope.manageCPGsFlag = false;
                    $scope.remove_cpgs_selections_len = [];
                };

                $scope.getRegisteredCPGsList(data.id);

                var req = {
                    operation: 'available_cpgs',
                    data: {
                        device_id: data.id
                    }
                };

                bllApiRequest.get("block_device", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        if (data.status == 'complete') {
                            angular.forEach(data.data.devices, function (cpg) {
                                $scope.available_cpgs.push({name: cpg, val: false});
                            });
                        } else {
                            addNotification('error',
                                $translate.instant("storage.block_device.messages.device_list.error",
                                    {details: data.data[0].data}));
                        }
                    },
                    function (error_data) {//this is the method called when the bll call fails with error
                        addNotification('error',
                            $translate.instant("storage.block_device.messages.device_list.error",
                                {details: error_data.data[0].data}));
                    },
                    function (progress_data) {
                        //this is the method called when the bll call updates status
                        getBlockDeviceData();
                    });

                $scope.addCPGs = function (name, val) {
                    if (val) {
                        $scope.selected_cpgs_list.push(name);
                    } else {
                        var index = $scope.selected_cpgs_list.indexOf(name);
                        if (index != -1) {
                            $scope.selected_cpgs_list.splice(index, 1);
                        }
                    }
                };

                $scope.addCPGToBll = function () {
                    $scope.showCPGOverlay = true;
                    var add_req = {
                        operation: 'add_cpgs',
                        data: {
                            device_id: data.id,
                            cpgs: $scope.selected_cpgs_list
                        }
                    };

                    bllApiRequest.post("block_device", add_req).then(
                        function (data) {//this is the method called when the bll call is successful
                            if (data.status == 'complete') {
                                angular.forEach(data.data, function (cpg) {
                                    if (cpg.status !== 'error') {
                                        addNotification("info", $translate.instant(
                                            "storage.block_storage.manage_cpgs.messages.add_success", {name: cpg.element_metadata.hp3par_cpg}));
                                    } else {
                                        addNotification("error", $translate.instant(
                                            "storage.block_storage.manage_cpgs.messages.error.registered", {name: cpg.cpg}));
                                    }
                                });
                                $scope.getRegisteredCPGsList($scope.device_id);
                            } else {
                                addNotification('error',
                                    $translate.instant("storage.block_device.messages.device_list.error",
                                        {details: data.data[0].data}));
                            }
                            $scope.showCPGOverlay = false;
                            getBlockDeviceData();
                        },
                        function (error_data) {//this is the method called when the bll call fails with error
                            $scope.showCPGOverlay = false;
                            addNotification('error',
                                $translate.instant("storage.block_device.messages.device_list.error",
                                    {details: error_data.data[0].data}));
                        }
                    );
                };

                $scope.loadAddCPGsModel = function (addstack) {
                    addstack('storage/templates/block_storage/cpgs/add_cpgs_modal.html');
                };

                $scope.onCPGRemoveCommit = function () {
                    $scope.onCPGRemoveCancel();
                    $scope.showCPGOverlay = true;
                    var element_ids = [];
                    angular.forEach($scope.remove_cpgs_selections, function (cpg) {
                        element_ids.push(cpg.id);
                    });
                    var remove_req = {
                        operation: 'remove_cpgs',
                        data: {
                            device_id: $scope.device_id,
                            element_ids: element_ids
                        }
                    };

                    bllApiRequest.post("block_device", remove_req).then(
                        function (data) {//this is the method called when the bll call is successful
                            if (data.status == 'complete') {
                                angular.forEach(data.data, function (cpg) {
                                    if (cpg.status !== 'error') {
                                        addNotification("info", $translate.instant(
                                            "storage.block_storage.manage_cpgs.messages.remove_success", {name: cpg.element_metadata.hp3par_cpg}));
                                    } else if (cpg.status === "error") {
                                        addNotification("error", $translate.instant(cpg.id + ": " + cpg.data));
                                    }
                                });
                                $scope.getRegisteredCPGsList($scope.device_id);
                            } else {
                                addNotification('error',
                                    $translate.instant("storage.block_device.messages.device_list.error",
                                        {details: data.data[0].data}));
                            }
                            $scope.showCPGOverlay = false;
                            $scope.remove_cpgs_selections_len = [];
                            getBlockDeviceData();
                        },
                        function (error_data) {//this is the method called when the bll call fails with error
                            $scope.showCPGOverlay = false;
                            addNotification('error',
                                $translate.instant("storage.block_device.messages.device_list.error",
                                    {details: error_data.data[0].data}));
                        });
                    return true;
                };

                $scope.onCPGRemoveCancel = function () {
                    $scope.showRemoveCPGConfirmModal = false;
                };

                $scope.loadRemoveCPGsModel = function () {
                    $scope.showRemoveCPGConfirmModal = !$scope.showRemoveCPGConfirmModal;
                };
            }

            $scope.downloadConfigFile = function (config_data_json) {
                var data = Base64.encode(config_data_json);
                window.location.href = "data:text/csv;base64," + data;

            };

            $scope.deviceTypeItem = {};
            $scope.deviceTypeItem.items = [
                {
                    value: "select",
                    label: $translate.instant('storage.register.content.blockstoragedevice.selectstoragedevice')
                },
                {
                    value: "hp_3par_fc",
                    label: $translate.instant("storage.register.content.blockstoragedevice.hp3parStoreServFC"),
                    disabled: false
                },
                {
                    value: "hp_3par_iscsi",
                    label: $translate.instant("storage.register.content.blockstoragedevice.hp3parStoreServiscsi"),
                    disabled: false
                },
                {
                    value: "hp_storevirtual",
                    label: $translate.instant("storage.register.content.blockstoragedevice.hpstorevirtualVSA"),
                    disabled: false
                }
            ];

            $scope.deviceTypeItem.item = $scope.deviceTypeItem.items[0].value;

            $scope.hasSelectedDevice = function (data) {
                if ($scope.deviceTypeItem.name.toLowerCase() == data) {
                    return true;
                }
                return false;
            };

            function clearFC() {
                $scope.register3PARFCDevice = {
                    name: '',
                    ipaddress: '',
                    type: '',
                    portnumber: '8080',
                    username: '',
                    password: '',
                    sanipaddress: '',
                    sanusername: '',
                    sanpassword: '',
                    showPass1: false,
                    showPass2: false
                };
                $scope.autoDiscoverSelected = false;
            }

            function clearIscsi() {
                $scope.register3PARISCSIDevice = {
                    name: '',
                    ipaddress: '',
                    type: '',
                    portnumber: '8080',
                    username: '',
                    password: '',
                    sanipaddress: '',
                    sanusername: '',
                    sanpassword: '',
                    iscsi_ipaddress: '',
                    showPass1: false,
                    showPass2: false
                };
            }

            function clearVSA() {
                $scope.registerVSADevice = {
                    name: '',
                    clustername: '',
                    ipaddress: '',
                    type: '',
                    portnumber: '8081',
                    username: '',
                    password: '',
                    showPass: false
                };
            }

            $scope.register_device_modal_close = function () {
                $scope.bsRegisterBSForm.$setPristine();
                clearform();
                $scope.showRegisterDeviceModal = false;
            };

            var clearform = function () {
                if ($scope.deviceTypeItem.item === 'select') {
                    clearFC();
                    clearIscsi();
                    clearVSA();
                } else if ($scope.deviceTypeItem.item === 'hp_3par_fc') {
                    clearFC();
                } else if ($scope.deviceTypeItem.item === 'hp_3par_iscsi') {
                    clearIscsi();
                } else if ($scope.deviceTypeItem.item === 'hp_storevirtual') {
                    clearVSA();
                }
                $scope.deviceTypeItem.item = $scope.deviceTypeItem.items[0].value;
            };

            //This function to handle the functionality of Register button from Register device screen
            $scope.registerDevice = function () {
                var req = null;
                if ($scope.deviceTypeItem.item === 'hp_3par_fc') {
                    req = {
                        operation: 'register_device',
                        data: {
                            san_username: $scope.register3PARFCDevice.sanusername,
                            san_password: $scope.register3PARFCDevice.sanpassword,
                            san_ip: $scope.register3PARFCDevice.sanipaddress,
                            username: $scope.register3PARFCDevice.username,
                            password: $scope.register3PARFCDevice.password,
                            name: $scope.register3PARFCDevice.name,
                            ipaddress: $scope.register3PARFCDevice.ipaddress,
                            port: $scope.register3PARFCDevice.portnumber,
                            type: 'hp_3par_fc'
                        }
                    };

                } else if ($scope.deviceTypeItem.item === 'hp_3par_iscsi') {
                    req = {
                        operation: 'register_device',
                        data: {
                            san_username: $scope.register3PARISCSIDevice.sanusername,
                            san_password: $scope.register3PARISCSIDevice.sanpassword,
                            san_ip: $scope.register3PARISCSIDevice.sanipaddress,
                            username: $scope.register3PARISCSIDevice.username,
                            password: $scope.register3PARISCSIDevice.password,
                            name: $scope.register3PARISCSIDevice.name,
                            ipaddress: $scope.register3PARISCSIDevice.ipaddress,
                            port: $scope.register3PARISCSIDevice.portnumber,
                            type: 'hp_3par_iscsi'
                        }
                    };

                    if ($scope.register3PARISCSIDevice.iscsi_ipaddress.split(",").length === 1) {
                        req.data.iscsi_ip_address = $scope.register3PARISCSIDevice.iscsi_ipaddress;
                    } else {
                        req.data.hp3par_iscsi_ips = $scope.register3PARISCSIDevice.iscsi_ipaddress;
                    }

                } else if ($scope.deviceTypeItem.item === 'hp_storevirtual') {
                    req = {
                        operation: 'register_device',
                        data: {
                            cluster_name: $scope.registerVSADevice.clustername,
                            ipaddress: $scope.registerVSADevice.ipaddress,
                            port: $scope.registerVSADevice.portnumber,
                            username: $scope.registerVSADevice.username,
                            password: $scope.registerVSADevice.password,
                            name: $scope.registerVSADevice.name,
                            type: 'hp_storevirtual'
                        }
                    };
                }

                $scope.showRegisterDeviceProgressFlag = true;
                bllApiRequest.post("block_device", req).then(
                    function (data) {
                        if (data.status === 'complete') {
                            var device = data.data.devices[0];
                            var name = "";
                            if (device.type === 'hp_storevirtual') {
                                name = data.data.devices[0].device_metadata.hplefthand_clustername;
                            } else {
                                name = data.data.devices[0].device_metadata.name;
                            }

                            if (device.status !== 'error') {
                                addNotification('info',
                                    $translate.instant("storage.block_device.register.message.success",
                                        {name: name}));
                            } else {
                                addNotification('error',
                                    $translate.instant("storage.block_device.register.message.error",
                                        {name: data.data[0].data}));
                            }
                        } else {
                            addNotification('error',
                                $translate.instant("storage.block_device.register.message.error",
                                    {details: data.data[0].data}));
                        }
                        $scope.bsRegisterBSForm.$setPristine();
                        clearform();
                        $scope.showRegisterDeviceProgressFlag = false;
                        $scope.showRegisterDeviceModal = false;
                        getBlockDeviceData();
                    },
                    function (error_data) {
                        $scope.bsRegisterBSForm.$setPristine();
                        clearform();
                        $scope.showRegisterDeviceProgressFlag = false;
                        $scope.showRegisterDeviceModal = false;
                        addNotification('error',
                            $translate.instant("storage.block_device.register.message.error",
                                {name: error_data.data[0].data}));
                    },
                    function (progress_data) {
                        //this is the method called when the bll call updates status
                        getBlockDeviceData();
                    });
            };

            $scope.close_edit_device_modal = function () {
                $scope.bsEditBSForm.$setPristine();
                clearform();
                $scope.editDeviceFlag = false;
            };

            $scope.updateDevice = function (data) {
                var req = null;
                $scope.showEditDeviceProgressFlag = true;
                if (data.type == 'hp_3par_fc') {
                    req = {
                        operation: 'edit_device',
                        data: {
                            san_username: $scope.register3PARFCDevice.sanusername,
                            san_password: $scope.register3PARFCDevice.sanpassword,
                            san_ip: $scope.register3PARFCDevice.sanipaddress,
                            username: $scope.register3PARFCDevice.username,
                            password: $scope.register3PARFCDevice.password,
                            name: $scope.register3PARFCDevice.name,
                            ipaddress: $scope.register3PARFCDevice.ipaddress,
                            port: $scope.register3PARFCDevice.portnumber,
                            type: 'hp_3par_fc',
                            id: data.id
                        }
                    };
                } else if (data.type == 'hp_3par_iscsi') {
                    req = {
                        operation: 'edit_device',
                        data: {
                            san_username: $scope.register3PARISCSIDevice.sanusername,
                            san_password: $scope.register3PARISCSIDevice.sanpassword,
                            san_ip: $scope.register3PARISCSIDevice.sanipaddress,
                            username: $scope.register3PARISCSIDevice.username,
                            password: $scope.register3PARISCSIDevice.password,
                            name: $scope.register3PARISCSIDevice.name,
                            ipaddress: $scope.register3PARISCSIDevice.ipaddress,
                            port: $scope.register3PARISCSIDevice.portnumber,
                            type: 'hp_3par_iscsi',
                            id: data.id
                        }
                    };

                    if ($scope.register3PARISCSIDevice.iscsi_ipaddress.split(",").length === 1) {
                        req.data.iscsi_ip_address = $scope.register3PARISCSIDevice.iscsi_ipaddress;
                    } else {
                        req.data.hp3par_iscsi_ips = $scope.register3PARISCSIDevice.iscsi_ipaddress;
                    }

                } else if (data.type == 'hp_storevirtual') {
                    req = {
                        operation: 'edit_device',
                        data: {
                            cluster_name: $scope.registerVSADevice.clustername,
                            ipaddress: $scope.registerVSADevice.ipaddress,
                            port: $scope.registerVSADevice.portnumber,
                            username: $scope.registerVSADevice.username,
                            password: $scope.registerVSADevice.password,
                            name: $scope.registerVSADevice.clustername,
                            type: 'hp_storevirtual',
                            id: data.id
                        }
                    };
                }
                bllApiRequest.get("block_device", req).then(
                    function (data) {
                        if (data.status === 'complete') {
                            var device = data.data.device_metadata;
                            var name = "";
                            if (device.hasOwnProperty('hplefthand_clustername')) {
                                name = device.hplefthand_clustername;
                            } else {
                                name = device.name;
                            }
                            addNotification('info',
                                $translate.instant("storage.block_device.edit.message.success",
                                    {details: name}));
                        } else {
                            addNotification('error',
                                $translate.instant("storage.block_device.edit.message.error",
                                    {details: data.data[0].data}));
                        }
                        $scope.showEditDeviceProgressFlag = false;
                        $scope.close_edit_device_modal();
                        getBlockDeviceData();
                    },
                    function (error_data) {
                        $scope.showEditDeviceProgressFlag = false;
                        $scope.close_edit_device_modal();
                        addNotification('error',
                            $translate.instant("storage.block_device.edit.message.error",
                                {details: error_data.data[0].data}));
                    },
                    function () {
                        getBlockDeviceData();
                    });
            };

            function editDevice(data) {
                $scope.editDeviceFlag = true;
                if (data.type === 'hp_3par_fc') {
                    $scope.deviceTypeItem.item = $scope.deviceTypeItem.items[1].value;
                    $scope.register3PARFCDevice.sanusername = data.san_username;
                    $scope.register3PARFCDevice.sanpassword = "";
                    $scope.register3PARFCDevice.sanipaddress = data.san_ip;
                    $scope.register3PARFCDevice.username = data.username;
                    $scope.register3PARFCDevice.password = "";
                    $scope.register3PARFCDevice.name = data.name;
                    $scope.register3PARFCDevice.ipaddress = data.ipaddress;
                    $scope.register3PARFCDevice.portnumber = data.port;
                    $scope.register3PARFCDevice.type = 'hp_3par_fc';

                } else if (data.type === 'hp_3par_iscsi') {
                    $scope.deviceTypeItem.item = $scope.deviceTypeItem.items[2].value;
                    $scope.register3PARISCSIDevice.sanusername = data.san_username;
                    $scope.register3PARISCSIDevice.sanpassword = "";
                    $scope.register3PARISCSIDevice.sanipaddress = data.san_ip;
                    $scope.register3PARISCSIDevice.username = data.username;
                    $scope.register3PARISCSIDevice.password = "";
                    $scope.register3PARISCSIDevice.name = data.name;
                    $scope.register3PARISCSIDevice.ipaddress = data.ipaddress;
                    $scope.register3PARISCSIDevice.portnumber = data.port;
                    $scope.register3PARISCSIDevice.type = 'hp_3par_iscsi';

                    if (data.hasOwnProperty('iscsi_ip_address')) {
                        $scope.register3PARISCSIDevice.iscsi_ipaddress = data.iscsi_ip_address;
                    } else if (data.hasOwnProperty('hp3par_iscsi_ips')) {
                        $scope.register3PARISCSIDevice.iscsi_ipaddress = data.hp3par_iscsi_ips;
                    }

                } else if (data.type === 'hp_storevirtual') {
                    $scope.deviceTypeItem.item = $scope.deviceTypeItem.items[3].value;
                    $scope.registerVSADevice.clustername = data.name;
                    $scope.registerVSADevice.ipaddress = data.ipaddress;
                    $scope.registerVSADevice.portnumber = data.port;
                    $scope.registerVSADevice.username = data.username;
                    $scope.registerVSADevice.password = "";
                    $scope.registerVSADevice.name = data.name;
                    $scope.registerVSADevice.type = 'hp_storevirtual';
                }

                $scope.callEditForBll = function () {
                    $scope.updateDevice(data);
                };
            }

            function selectRows(selectedDatas) {
                var selected_rows = {};
                angular.forEach(selectedDatas, function (selectData) {
                    selectData.$rowSelected = true;
                    selected_rows[selectData.id] = selectData;
                });
                return selected_rows;
            }


            $scope.disableRowSelectionCheck = function (data) {
                if (data.data > 0) {
                    return false;
                }
                return true;
            };

            $scope.unregister_devices_table_config = {
                headers: [
                    {
                        name: $translate.instant("storage.unregister.modal.table.row.label.name"),
                        type: "string",
                        displayfield: "name",
                        sortfield: 'name'
                    },
                    {
                        name: $translate.instant("storage.unregister.modal.table.row.label.type"),
                        type: "string",
                        displayfield: "type",
                        sortfield: 'type',
                        filter: "uppercase"
                    },
                    {
                        name: $translate.instant("storage.unregister.modal.table.row.label.ipaddress"),
                        type: "string",
                        displayfield: "ipaddress",
                        sortfield: 'ipaddress'
                    },
                    {
                        name: $translate.instant("storage.unregister.modal.table.row.label.created"),
                        type: "string",
                        displayfield: "created_at",
                        sortfield: 'created_at'

                    }],
                pageConfig: {
                    pageSize: 20
                },
                rowSelectionCheck: $scope.disableRowSelectionCheck
            };

            $scope.cancelModal = function () {
                $scope.showUNRegisterConfirmModal = false;
                $scope.selected_data_unregistered = [];
            };

            $scope.CallUnRegisterBlockStorage = function () {

                var selectedDeviceList = selectRows($scope.selected_data_unregistered);
                $scope.unregister_confirm_message = $translate.instant('storage.unregister.modal.table.confirm.warning.top',
                    {num: Object.keys(selectedDeviceList).length});

                var request = {
                    operation: 'unregister_device',
                    ids: Object.keys(selectedDeviceList)
                };

                if (request.ids.length === 0) {
                    $scope.cancelModal();
                    return;
                }

                $scope.showUNRegisterConfirmModal = false;
                $scope.showunRegisterDeviceProgressFlag = true;
                bllApiRequest.delete("block_device", request).then(
                    function (data) {
                        //this is the method called when the bll call is successful
                        if (data.status === "complete") {
                            angular.forEach(data.data, function (api_reply) {
                                if (api_reply.status !== "error") {
                                    addNotification("info",
                                        $translate.instant("storage.block_device.messages.unregister.success",
                                            {
                                                name: selectedDeviceList[api_reply.id].name
                                            }));
                                } else if (api_reply.status === "error") {
                                    addNotification("error",
                                        $translate.instant("storage.block_device.messages.unregister.error",
                                            {
                                                name: selectedDeviceList[api_reply.id].name,
                                                details: api_reply.data
                                            }));
                                }
                            });
                        } else {
                            addNotification("error",
                                $translate.instant("storage.block_device.messages.unregister.common_error", {reason: data.data[0].data}));
                        }
                        $scope.unregisterDeviceModalFlag = false;
                        $scope.showunRegisterDeviceProgressFlag = false;
                        getBlockDeviceData();
                    }, function (error_data) {//this is the method called when the bll call fails with error
                        $scope.unregisterDeviceModalFlag = false;
                        $scope.showunRegisterDeviceProgressFlag = false;
                        addNotification("error",
                            $translate.instant("storage.block_device.messages.unregister.common_error", {reason: error_data.data[0].data}));
                        getBlockDeviceData();
                    }, function (progress_data) {//this is the method called when the bll call fails with error
                        getBlockDeviceData();
                    });
            };

            $scope.closeUnRegisterModal = function () {
                $scope.unregisterDeviceModalFlag = false;
                $scope.selected_data_unregistered = [];
            };

            function unregisterDevices(data) {
                $scope.unregisterDeviceModalFlag = true;
                $scope.unregisterDevices_data = data;
                $scope.selected_data_unregistered = data;

                $scope.modal_unregister_confirm_message_top = $translate.instant('storage.unregister.modal.table.confirm.title');
                $scope.modal_unregister_confirm_warning_message = $translate.instant('storage.unregister.modal.confirm.warning.bottom');

                $scope.loadConfirmationModal = function () {
                    $scope.showUNRegisterConfirmModal = !$scope.showUNRegisterConfirmModal;

                };
            }

            $scope.driver_cpg_list = [];
            $scope.showVolBackendBottomPanel = false;
            $scope.enableRegisterBackendFlag = true;
            $scope.hp3par_cpg_config = {
                headers: [
                    {
                        name: $translate.instant("storage.block_storage.backend.hp3par_cpg.table.header.cpg_name"),
                        type: "string",
                        displayfield: "name",
                        sortfield: 'name'
                    },
                    {
                        name: $translate.instant("storage.block_storage.backend.hp3par_cpg.table.header.status"),
                        type: "string",
                        displayfield: "status",
                        sortfield: 'status',
                        filter: 'caseFilter'
                    },
                    {
                        name: $translate.instant("storage.block_storage.backend.hp3par_cpg.table.header.device_name"),
                        type: "string",
                        displayfield: "device_name",
                        sortfield: 'device_name'
                    },
                    {
                        name: $translate.instant("storage.block_storage.backend.hp3par_cpg.table.header.raid"),
                        type: "string",
                        displayfield: "raid",
                        sortfield: 'raid'
                    },
                    {
                        name: $translate.instant("storage.block_storage.backend.hp3par_cpg.table.header.total_space"),
                        type: "string",
                        displayfield: "total_capacity",
                        sortfield: 'total_capacity'
                    }],
                pageConfig: {
                    pageSize: 10
                }
            };

            $scope.vsa_config = {
                headers: [
                    {
                        name: $translate.instant("storage.block_storage.backend.hp3par_cpg.table.header.cpg_name"),
                        type: "string",
                        displayfield: "name",
                        sortfield: 'name'
                    },
                    {
                        name: $translate.instant("storage.block_storage.backend.hp3par_cpg.table.header.available_space"),
                        type: "string",
                        displayfield: "spaceAvailable",
                        sortfield: 'spaceAvailable'
                    },
                    {
                        name: $translate.instant("storage.block_storage.backend.hp3par_cpg.table.header.total_space"),
                        type: "string",
                        displayfield: "spaceTotal",
                        sortfield: 'spaceTotal'
                    }],
                pageConfig: {
                    pageSize: 10
                }
            };

            function getCpgDataForDrivers(operation, device_type) {
                $scope.driverCPGLoadingFlag = true;
                $scope.driver_cpg_list = [];
                var req = {
                    operation: operation,
                    data: {device_type: device_type}
                };

                bllApiRequest.get("block_device", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        if (data.status == 'complete') {
                            $scope.driver_cpg_list = data.data[device_type];
                        } else {
                            addNotification('error',
                                $translate.instant("storage.block_device.messages.device_list.error",
                                    {details: data.data}));
                        }
                        $scope.driverCPGLoadingFlag = false;

                    },
                    function (error_data) {//this is the method called when the bll call fails with error
                        addNotification('error',
                            $translate.instant("storage.block_device.messages.device_list.error",
                                {details: error_data.data}));
                        $scope.driverCPGLoadingFlag = false;
                    });
            }

            function getMappingsList(mappings) {
                var mappings_list = "";
                angular.forEach(mappings, function (cpg) {
                    mappings_list += cpg + ", ";
                });
                return mappings_list.replace(/,\s*$/, "");
            }

            function getDriverList() {
                $scope.driverListSeletedData = [];
                $scope.manageCinderDataLoading = true;
                var req = {
                    operation: "driver_list"
                };

                function setDriverType(driver_type) {
                    var type = driver_type.split('.')[driver_type.split('.').length - 1];
                    var driverTypes = {
                        "HP3PARFCDriver": $translate.instant("storage.block_storage.backend.create.backendconfiguration.storeserv3parFC"),
                        "HP3PARISCSIDriver": $translate.instant("storage.block_storage.backend.create.backendconfiguration.storeserv3pariSCSI"),
                        "HPLeftHandISCSIDriver": $translate.instant("storage.block_storage.backend.create.backendconfiguration.storeservsa")
                    };

                    for (var key in driverTypes) {
                        if (driver_type.indexOf(key) > -1) {
                            type = driverTypes[key];
                            break;
                        }
                    }
                    return type;
                }

                bllApiRequest.get("block_device", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        $scope.manage_cinder = [];
                        if (data.status == 'complete') {
                            angular.forEach(data.data, function (value) {
                                value.mappings_list = getMappingsList(value.mappings);
                                value.type = setDriverType(value.driver_type);
                                $scope.manage_cinder.push(value);
                            });
                            $scope.manageCinderDataLoading = false;
                        } else {
                            $scope.manageCinderDataLoading = false;
                            addNotification('error',
                                $translate.instant("storage.block_device.messages.device_list.error",
                                    {details: data.data[0].data}));
                        }
                    },
                    function (error_data) {//this is the method called when the bll call fails with error
                        $scope.manageCinderDataLoading = false;
                        addNotification('error',
                            $translate.instant("storage.block_device.messages.device_list.error",
                                {details: error_data.data[0].data}));
                    });
            }

            function getVolumeTypesData() {
                var req = {
                    operation: 'volume_type_list'
                };

                bllApiRequest.get("cinder", req).then(
                    function (data) {//this is the method called when the bll call is successful
                        if (data.status == 'complete') {
                            $scope.existing_volume_types = [{
                                name: $translate.instant("storage.block_storage.backend.create.volumetype.select"),
                                value: ""
                            }];
                            angular.forEach(data.data, function (key, value) {
                                $scope.existing_volume_types.push({name: key, value: value});
                            });

                            if ($scope.existing_volume_types.length === 0) {
                                $scope.existing_volume_types.push({
                                    name: $translate.instant("storage.block_storage.backend.create.volumetype.no_data"),
                                    value: ""
                                });
                                $scope.volumeNoData = true;
                            } else {
                                $scope.volumeNoData = false;
                            }
                        } else {
                            $scope.existing_volume_types.push({
                                name: $translate.instant("storage.block_storage.backend.create.volumetype.error"),
                                value: ""
                            });
                            $scope.volumeNoData = true;
                            addNotification('error',
                                $translate.instant("storage.block_device.messages.device_list.error",
                                    {details: data.data}));
                        }
                        $scope.volume_type_choice = $scope.existing_volume_types[0];
                        $scope.volume_listLoadingFlag = false;
                    },
                    function (error_data) {//this is the method called when the bll call fails with error
                        $scope.existing_volume_types.push({
                            name: $translate.instant("storage.block_storage.backend.create.volumetype.error"),
                            value: ""
                        });
                        $scope.volume_type_choice = $scope.existing_volume_types[0];
                        $scope.volume_listLoadingFlag = false;
                        $scope.volumeNoData = true;
                        addNotification('error',
                            $translate.instant("storage.block_device.messages.device_list.error",
                                {details: error_data.data[0].data}));
                    });
            }

            $scope.driverCPGLoadingFlag = false;
            $scope.addCinderBackend = function (addStack) {
                $scope.volume_listLoadingFlag = true;
                $scope.volume_type_choice = "";
                $scope.existing_volume_types = [];
                $scope.VolumeTypeDuplicate = false;
                $scope.new_volume_type = {value: ""};
                $scope.extra_specs = [
                    {snapshot_retention: ""},
                    {snapshot_expiration: ""},
                    {snap_cpg: ""},
                    {reserved_percentage: ""},
                    {over_subscription: ""}
                ];
                $scope.ifDriverAddCalled = true;
                $scope.driver_type_choices = [{
                    name: $translate.instant("storage.block_storage.backend.create.backendconfiguration.options"),
                    value: "select"
                },
                    {
                        name: $translate.instant("storage.block_storage.backend.create.backendconfiguration.storeserv3parFC"),
                        value: "hp_3par_fc"
                    },
                    {
                        name: $translate.instant("storage.block_storage.backend.create.backendconfiguration.storeserv3pariSCSI"),
                        value: "hp_3par_iscsi"
                    },
                    {
                        name: $translate.instant("storage.block_storage.backend.create.backendconfiguration.storeservsa"),
                        value: "vsa"
                    }];

                $scope.driver_type = $scope.driver_type_choices[0];

                $scope.driverTypeOnChange = function () {
                    $scope.onDriverCancel();
                    getVolumeTypesData();

                    if ($scope.driver_type.value === 'hp_3par_fc') {
                        getCpgDataForDrivers('available_registered_cpgs', "hp_3par_fc");
                    } else if ($scope.driver_type.value === 'hp_3par_iscsi') {
                        getCpgDataForDrivers('available_registered_cpgs', "hp_3par_iscsi");
                    } else if ($scope.driver_type.value === 'vsa') {
                        getCpgDataForDrivers('available_registered_cpgs', "vsa");
                    }
                };

                $scope.onDriverCancel = function () {
                    $scope.showVolBackendBottomPanel = false;
                    $scope.enableRegisterBackendFlag = true;
                    $scope.selectedCpgsforbackend = 0;
                    $scope.volume_listLoadingFlag = true;
                    $scope.ifDriverAddCalled = false;
                    $scope.isNewVolumeTypeEmpty = false;

                    $scope.volume_types = {value: "existing_vol"};
                };

                $scope.onDriverCommit = function () {
                    $scope.showVolBackendBottomPanel = false;
                    var req = {
                        operation: "add_backend",
                        data: {
                            volume_type: "",
                            is_new: false,
                            volume_type_id: "",
                            device_type: "",
                            elements: []
                            /*extra_spec: $scope.extra_specs*/
                        }
                    };

                    if ($scope.volume_types.value === 'existing_vol') {
                        req.data.is_new = false;
                        req.data.volume_type = $scope.volume_type_choice.name;
                        req.data.volume_type_id = $scope.volume_type_choice.value;
                    } else {
                        req.data.volume_type = $scope.new_volume_type.value;
                        req.data.is_new = true;
                    }

                    if ($scope.driver_type.value === 'hp_3par_fc') {
                        req.data.device_type = "hp_3par_fc";
                        angular.forEach($scope.selectedDatas, function (node) {
                            req.data.elements.push({device_id: node.device_id, element_id: node.id});
                        });

                    } else if ($scope.driver_type.value === 'hp_3par_iscsi') {
                        req.data.device_type = "hp_3par_iscsi";
                        angular.forEach($scope.selectedDatas, function (node) {
                            req.data.elements.push({device_id: node.device_id, element_id: node.id});
                        });

                    } else if ($scope.driver_type.value === 'vsa') {
                        req.data.device_type = "hp_storevirtual";
                        angular.forEach($scope.selectedDatas, function (node) {
                            req.data.elements.push({device_id: node.device_id, element_id: ""});
                        });
                    }

                    bllApiRequest.put("block_device", req).then(
                        function (data) {//this is the method called when the bll call is successful
                            if (data.status == 'complete') {
                                angular.forEach(data.data, function (driver) {
                                    if (driver.status !== 'error') {
                                        addNotification("info", $translate.instant(
                                            "storage.block_storage.manage_cinder.messages.add_success",
                                            {
                                                name: driver.driver_spec.volume_backend_name,
                                            }));
                                    } else if (driver.status === "error") {
                                        addNotification("error", $translate.instant(driver.id + ": " + driver.data));
                                    }
                                });
                                getDriverList();
                            } else {
                                addNotification('error',
                                    $translate.instant("storage.block_device.messages.device_list.error",
                                        {details: data.data[0].data}));
                            }
                            $scope.showCPGOverlay = false;
                        },
                        function (error_data) {//this is the method called when the bll call fails with error
                            $scope.showCPGOverlay = false;
                            addNotification('error',
                                $translate.instant("storage.block_device.messages.device_list.error",
                                    {details: error_data.data[0].data}));
                        }, function (progress) {//this is the method called when the bll call fails with error
                            getDriverList();
                        });
                    getDriverList();
                    $scope.volume_listLoadingFlag = true;
                    $scope.ifDriverAddCalled = false;
                    return true;
                };

                addStack('storage/templates/block_storage/volume_backend/add_cinder_backend.html', $scope.onDriverCancel());
            };

            function getDeviceIds(data) {
                var ids = [];
                angular.forEach(data, function (d) {
                    ids = angular.copy(ids.concat(d.driver_ids));
                });
                return ids;
            }

            $scope.removeBackendCancel = function () {
                $scope.driverListSeletedData = [];
                $scope.removeBackendModalFlag = false;
            };

            $scope.removeDrivers = function () {
                $scope.manageCinderDataLoading = true;
                var remove_req = {
                    operation: 'remove_backend',
                    data: {
                        driver_ids: getDeviceIds($scope.driverListSeletedData)
                    }
                };

                $scope.driverListSeletedData = [];
                bllApiRequest.delete("block_device", remove_req).then(
                    function (data) {//this is the method called when the bll call is successful
                        if (data.status == 'complete') {
                            angular.forEach(data.data, function (driver) {
                                if (driver.status === 'deleted') {
                                    addNotification("info", $translate.instant(
                                        "storage.block_storage.manage_cinder.messages.remove_success",
                                        {
                                            name: driver.driver_spec.volume_backend_name,
                                        }));
                                } else if (driver.status === "error" || driver.status === "activated") {
                                    addNotification("error", $translate.instant(
                                        "storage.block_storage.manage_cinder.messages.remove_error",
                                        {
                                            name: driver.driver_spec.volume_backend_name,
                                        }));
                                }
                            });
                            getDriverList();
                        } else {
                            addNotification('error',
                                $translate.instant("storage.block_device.messages.device_list.error",
                                    {details: data.data[0].data}));
                        }
                        $scope.manageCinderDataLoading = false;
                    },
                    function (error_data) {//this is the method called when the bll call fails with error
                        $scope.manageCinderDataLoading = false;
                        addNotification('error',
                            $translate.instant("storage.block_device.messages.device_list.error",
                                {details: error_data.data[0].data}));
                    }, function (progress) {//this is the method called when the bll call fails with error
                        getDriverList();
                    });
                getDriverList();
                $scope.removeBackendModalFlag = false;
            };

            $scope.removeBackendModalFlag = false;
            $scope.removeCinderBackend = function () {
                $scope.removeBackendModalFlag = !$scope.removeBackendModalFlag;
            };


            function addDriverBackendValidation(count) {
                if (count === 0 || ($scope.volumeNoData && $scope.new_volume_type.value.length === 0)) {
                    $scope.enableRegisterBackendFlag = true;
                } else {
                    $scope.checkDriverBackendValidation();
                }
            }

            $scope.checkDriverBackendValidation = function () {
                if ($scope.volume_types.value === 'existing_vol') {
                    $scope.new_volume_type.value = '';
                    $scope.isNewVolumeTypeEmpty = false;
                    $scope.addBackendForm.$setPristine();
                    $scope.enableRegisterBackendFlag = true;
                } else if ($scope.volume_types.value === 'new_vol') {
                    $scope.volume_type_choice = $scope.existing_volume_types[0];
                    $scope.enableRegisterBackendFlag = true;
                }

                if (($scope.volume_types.value === 'new_vol' && ($scope.new_volume_type.value.length === 0 || $scope.VolumeTypeDuplicate)) ||
                    ($scope.volume_types.value === 'existing_vol' && ($scope.volumeNoData || $scope.volume_type_choice.value === ""))) {
                    $scope.enableRegisterBackendFlag = true;
                } else if (($scope.volume_types.value === 'existing_vol' && (!$scope.volumeNoData || $scope.volume_type_choice.value !== "")) ||
                    ($scope.volume_types.value === 'new_vol' && ($scope.new_volume_type.value.length !== 0 || !$scope.VolumeTypeDuplicate))) {
                    $scope.enableRegisterBackendFlag = false;
                    $scope.isNewVolumeTypeEmpty = false;
                    $scope.addBackendForm.$setPristine();
                }
            };

            $scope.checkDuplicateVolumeType = function () {
                if ($scope.new_volume_type.value === undefined) {
                    $scope.new_volume_type.value = '';
                }
                for (var i = 0; i < $scope.existing_volume_types.length; i++) {
                    if ($scope.existing_volume_types[i].name.toLowerCase() === $scope.new_volume_type.value.toLowerCase()) {
                        $scope.VolumeTypeDuplicate = true;
                        break;
                    } else {
                        $scope.VolumeTypeDuplicate = false;
                    }
                }

                if ($scope.new_volume_type.value.length === 0) {
                    $scope.isNewVolumeTypeEmpty = true;
                } else {
                    $scope.isNewVolumeTypeEmpty = false;
                }

                $scope.checkDriverBackendValidation();
            };

            function setFCdataOnAutoDiscoverySelection(data) {
                if (data.length !== 0) {
                    data = data[0];

                    $scope.register3PARFCDevice = {
                        name: data.name,
                        ipaddress: data.ip_hostname,
                        type: data.type,
                        portnumber: '8080',
                        username: data.username,
                        password: '',
                        sanipaddress: '',
                        sanusername: data.username,
                        sanpassword: '',
                        showPass1: false,
                        showPass2: false
                    };
                } else {
                    $scope.register3PARFCDevice = {
                        name: '',
                        ipaddress: '',
                        type: '',
                        portnumber: '8080',
                        username: '',
                        password: '',
                        sanipaddress: '',
                        sanusername: '',
                        sanpassword: '',
                        showPass1: false,
                        showPass2: false
                    };
                }
            }

            $scope.$on('tableSelectionChanged', function ($event, selections, tableId) {
                $scope.selectedDatas = selections;
                $scope.driverListSeletedData = selections;
                $scope.remove_cpgs_selections = [];
                $scope.remove_cpgs_selections_len = 0;
                var table_id = angular.isDefined(tableId) ? tableId.toString() : "";

                if (table_id === 'unRegisterTable') {
                    $scope.selected_data_unregistered = selections;
                } else if (table_id === 'volumeBackendAddTable' && selections.length > 0) {
                    $scope.showVolBackendBottomPanel = true;
                } else if (table_id === 'volumeBackendAddTable' && selections.length === 0) {
                    $scope.showVolBackendBottomPanel = false;
                } else if (table_id === 'autoDiscoverTable' && selections.length === 1) {
                    $scope.usingAutoDiscoveryForFC = true;
                    setFCdataOnAutoDiscoverySelection(selections);
                } else if (table_id === 'autoDiscoverTable' && selections.length === 0) {
                    $scope.usingAutoDiscoveryForFC = false;
                    setFCdataOnAutoDiscoverySelection([]);
                } else if (table_id === 'manageCPGTable') {
                    $scope.remove_cpgs_selections = selections;
                    $scope.remove_cpgs_selections_len = selections.length;
                }
                $scope.selectedCpgsforbackend = selections.length;
                $scope.selectedAvailableCPGs = selections.length;

                if ($scope.ifDriverAddCalled) {
                    addDriverBackendValidation(selections.length);
                }
            });

            $scope.useSameCredentialsForFC = function (name) {
                if ($scope.register3PARFCDevice.hp_3par_fc_san_same_credentials == "YES") {
                    $scope.register3PARFCDevice.sanusername = $scope.register3PARFCDevice.username;
                    $scope.register3PARFCDevice.sanpassword = $scope.register3PARFCDevice.password;
                } else {
                    $scope.register3PARFCDevice.sanusername = "";
                    $scope.register3PARFCDevice.sanpassword = "";
                }
            };

            $scope.useSameCredentialsForiSCSI = function (name) {
                if ($scope.register3PARISCSIDevice.hp_3par_iscsi_san_same_credentials == "YES") {
                    $scope.register3PARISCSIDevice.sanusername = $scope.register3PARISCSIDevice.username;
                    $scope.register3PARISCSIDevice.sanpassword = $scope.register3PARISCSIDevice.password;
                } else {
                    $scope.register3PARISCSIDevice.sanusername = "";
                    $scope.register3PARISCSIDevice.sanpassword = "";
                }
            };

            $scope.cloneData = function (from) {
                if ($scope.register3PARFCDevice.hp_3par_fc_san_same_credentials == "YES" && from.indexOf('Fc') > -1) {
                    if (from === 'fromFcUsername') {
                        $scope.register3PARFCDevice.sanusername = $scope.register3PARFCDevice.username;
                    } else if (from === 'fromFcSanUsername') {
                        $scope.register3PARFCDevice.username = $scope.register3PARFCDevice.sanusername;
                    } else if (from === 'fromFcPassword') {
                        $scope.register3PARFCDevice.sanpassword = $scope.register3PARFCDevice.password;
                    } else if (from === 'fromFcSanPassword') {
                        $scope.register3PARFCDevice.password = $scope.register3PARFCDevice.sanpassword;
                    }
                } else if ($scope.register3PARISCSIDevice.hp_3par_iscsi_san_same_credentials == "YES" && from.indexOf('Iscsi') > -1) {
                    if (from === 'fromIscsiUsername') {
                        $scope.register3PARISCSIDevice.sanusername = $scope.register3PARISCSIDevice.username;
                    } else if (from === 'fromIscsiSanUsername') {
                        $scope.register3PARISCSIDevice.username = $scope.register3PARISCSIDevice.sanusername;
                    } else if (from === 'fromIscsiPassword') {
                        $scope.register3PARISCSIDevice.sanpassword = $scope.register3PARISCSIDevice.password;
                    } else if (from === 'fromIscsiSanPassword') {
                        $scope.register3PARISCSIDevice.password = $scope.register3PARISCSIDevice.sanpassword;
                    }
                }
            };

        }
    ]);
})(angular);
