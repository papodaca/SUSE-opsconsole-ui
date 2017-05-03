// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
(function (ng) {
    'use strict';
    var p = ng.module('plugins');
    p.controller('SystemNetworkingController', [
        '$scope', '$translate', 'log', '$q', 'bllApiRequest', 'addNotification',
        'removeDuplicateInArray', 'checkIpRangesValid', 'checkIpRangesNoOverlapValid',
        'convertIp4ToInt', 'ocValidators', 'HLMUXService',
        function ($scope, $translate, log, $q, bllApiRequest, addNotification,
                  removeDuplicateInArray, checkIpRangesValid, checkIpRangesNoOverlapValid,
                  convertIp4ToInt, ocValidators, HLMUXService) {
            $scope.networkTableData = [];
            $scope.networkDataLoading = true;
            $scope.showEditNetworkModalFlag = false;
            $scope.sysNetworkDataUpdating = false;
            $scope.showConfirmUpdateNetworkModalFlag = false;
            $scope.updateNetworkConfirmMsg = '';

            var showEditNetworkModal = function(data) {
                 $scope.showEditNetworkModalFlag = true;
                 $scope.oneNetworkData = angular.copy(data);
                 if(angular.isDefined($scope.systemNetworkingEditForm)) {
                     $scope.systemNetworkingEditForm.$setPristine();
                 }
            };

            //if data is readonly, show details action
            //if data is editable, show edit action
            var showEditOrDetailsMenuItem = function(data, name) {
                if(name === 'showNetworkDetails' && !data.readonly) {
                    return {hidden: true, enabled: true};
                }
                else if (name === 'editNetwork' && data.readonly) {
                    return {hidden: true, enabled: true};
                }
                else {
                    return {hidden: false, enabled: true};
                }
            };

            //table definition
            $scope.networkTableConfig = {
                headers: [{
                    name: $translate.instant("common.name"),
                    type: "string",
                    displayfield: "name",
                    sortfield: 'name',
                    highlightExpand: true
                },{
                    name: $translate.instant("common.type"),
                    type: "string",
                    displayfield: "type",
                    sortfield: 'type',
                    hidden: true
                },{
                    name: $translate.instant("system.networking.vlanid"),
                    type: "string",
                    displayfield: "vlanid",
                    sortfield: 'vlanid'
                },{
                    name: $translate.instant("system.networking.cidr"),
                    type: "string",
                    displayfield: "cidr",
                    sortfield: 'cidr'
                },{
                    name: $translate.instant("system.networking.gatewayip"),
                    type: "string",
                    displayfield: "gatewayip",
                    sortfield: 'gatewayip'
                }],

                pageConfig: {
                    pageSize: 20
                },

                expandAction: showEditNetworkModal,

                actionMenuConfigFunction: showEditOrDetailsMenuItem,

                actionMenuConfig: [{
                    label: 'table.expandSelection',
                    name: 'showNetworkDetails',
                    action: function (data) {
                        showEditNetworkModal(data);
                    }
                },{
                    label: 'common.edit',
                    name: 'editNetwork',
                    action: function (data) {
                        showEditNetworkModal(data);
                    }
                }],

                globalActionsConfig: []
            };

            $scope.loadNetworkData = function() {
                getAllNetworkData().then (function() {
                    $scope.networkDataLoading = false;
                });
            };

            var getAllNetworkData = function() {
                $scope.networkDataLoading = true;
                $scope.networkTableData = [];

                var defer = $q.defer();
                var promises = [];
                promises.push(callBLLForNetworkData());
                //promises.push(callBLLForNetworkTypeData()); TODO
                $q.all(promises).then(defer.resolve, defer.reject);
                return defer.promise;
            };

            var getRangesForEdit = function(ranges) {
                if (!angular.isDefined(ranges)) {
                    return [];
                }

                //if not readonly need fill the iprange input
                var inputRanges = removeDuplicateInArray(angular.copy(ranges));

                var retRanges = [];
                inputRanges.forEach(function(range) {
                    var uiRange = {
                        'range': range,
                        'readonly': true //user won't be able to delete it
                    };
                    retRanges.push(uiRange);
                });

                return retRanges;
            };

            var getRangesForReadonly = function(ranges) {
                if (!angular.isDefined(ranges)) {
                    return [];
                }
                //if not readonly need fill the iprange input
                var retRanges = removeDuplicateInArray(angular.copy(ranges));

                return retRanges;
            };

            var getGatewayIp = function(gatewayIp) {
                if(angular.isUndefined(gatewayIp) || gatewayIp === '0.0.0.0'){
                    return '';
                }

                return gatewayIp;
            };

            var callBLLForNetworkData = function(type) {
                var req = {
                    'operation': 'get_network_data'
                };

                return bllApiRequest.get('hlm_ux', req).then(
                    function(response) {
                        var nData = response.data || [];
                        for(var idx in nData) {
                            var datum = nData[idx];
                            //if the cidr is empty, make the data readonly
                            var isReadonly = datum.cidr ? false : true;
                            var obj = {
                                'id': datum.name,
                                'name': datum['network-group'],
                                'vlanid': datum['vlan-id'] ? datum['vlan-id'] : '',
                                'cidr': datum.cidr,
                                'gatewayip': getGatewayIp(datum['gateway-ip']),
                                'ranges': getRangesForEdit(datum.addresses),
                                'rangesDisabled': datum['network-group'] === 'CONF'? true : false, //disable ranges field for CONF
                                //for display in readonly mode
                                'ranges_readonly': getRangesForReadonly(datum.addresses),
                                'readonly': isReadonly,
                                //gateway is required if it is there can not remove for DCM
                                'gatewayIpRequired': datum['gateway-ip'] && datum['network-group'] === 'DCM'? true : false
                            };
                            $scope.networkTableData.push(obj);
                        }
                    },function(error_data) {
                        addNotification(
                            "error",
                            $translate.instant("system.networking.table.data.error"));
                        log('error', 'Failed to get network table data');
                        log('error', 'error data = ' + JSON.stringify(error_data));
                    }
                );
            };

            var findOriginNetworkData = function (data) {
                for(var idx in $scope.networkTableData) {
                    var id = $scope.networkTableData[idx].id;
                    if (id === data.id) {
                        return  $scope.networkTableData[idx];
                    }
                }
            };

            $scope.isDataChanged = function(data) {
                if(angular.isUndefined(data)) {
                    return false;
                }

                var originNt = findOriginNetworkData(data);
                if(angular.isDefined(originNt)) {
                    if (data.ranges.length !== originNt.ranges.length ||
                        data.gatewayip !== originNt.gatewayip) {
                        return true;
                    }
                }

                return false;
            };

            $scope.addIpRange = function() {
                if (angular.isDefined($scope.newIpRange)) {
                    var obj = {
                        'range': angular.copy($scope.newIpRange).replace(/ /g, ''),
                        'isreadonly': false
                    };

                    if (angular.isDefined($scope.currentRanges)) {
                        $scope.currentRanges.push(obj);
                    }
                }
            };

            $scope.cancelAddIpRangeModal = function() {
                $scope.newIpRange = undefined;
                $scope.currentRanges = undefined;
            };

            $scope.showAddIpRangeModal = function(ranges) {
                $scope.newIpRange = undefined;
                $scope.currentRanges = ranges;
                $scope.systemEditNetworkModal.addStack(
                    'system/templates/sys_networking/add_iprange.html',
                    $scope.cancelAddIpRangeModal
                );
            };

            $scope.cancelEditNetworkModal = function() {
                $scope.showEditNetworkModalFlag = false;
                $scope.oneNetworkData = undefined;
            };

            //
            //deal with ipranges and gateway validation
            //
            var isIpRangeReversed = function(ipRange) {
                var ips1 = ipRange.replace(/\s/g, '').split('-');
                var s_ip = ips1[0];
                var e_ip = ips1[1];
                var s_ip_num = convertIp4ToInt(s_ip);
                var e_ip_num = convertIp4ToInt(e_ip);

                if (e_ip_num <  s_ip_num) {
                    return true;
                }
                return false;
            };

            var checkIpRange = function(ipRange) {

                //at this point ipRange is defined
                var existingRanges = [];
                for (var idx in $scope.oneNetworkData.ranges) {
                    existingRanges.push($scope.oneNetworkData.ranges[idx].range);
                }

                if(existingRanges.length === 0) {
                    return true;
                }

                var cidr = $scope.oneNetworkData.cidr;
                if (angular.isUndefined(cidr) || cidr === '-' || cidr === '') {
                    return true; //nothing to check against
                }

                //check syntax first
                var isValid = ocValidators.ipRange.test(ipRange);
                if(!isValid) {
                    $scope.invalidIpRangeMsg = $translate.instant('hpvalidate.ipRange');
                    return isValid;
                }
                else {
                    //result will be
                    // {'is_valid' : true, invalid_message : 'bla'}
                    var result = checkIpRangesValid([ipRange], cidr);
                    if(!result.is_valid) {
                        $scope.invalidIpRangeMsg =  $translate.instant(
                            'system.networking.iprange.cidr.error',
                            {'iprange': ipRange, 'cidr': $scope.oneNetworkData.cidr}
                        );
                        return result.is_valid;
                    }
                    else {
                        isValid = checkIpRangesNoOverlapValid([ipRange], existingRanges);
                        if(!isValid) {
                            $scope.invalidIpRangeMsg =  $translate.instant(
                                'system.networking.iprange.overlap.error',
                                {'iprange': ipRange, 'existingranges': existingRanges.join(',')}
                            );
                            return isValid;
                        }
                        else {
                            if (ipRange.indexOf('-') !== -1) {
                                isValid = !isIpRangeReversed(ipRange);
                            }

                            if(!isValid) {
                                $scope.invalidIpRangeMsg =  $translate.instant(
                                    'system.networking.iprange.upsidedown.error',
                                    {'iprange': ipRange}
                                );
                                return isValid;
                            }

                            var gateway = $scope.oneNetworkData.gatewayip;
                            if(angular.isUndefined(gateway)) {
                                return true;
                            }
                            isValid = checkIpRangesNoOverlapValid([gateway], [ipRange]);
                            if(!isValid) {
                                $scope.invalidIpRangeMsg =  $translate.instant(
                                    'system.networking.iprange.gateway.overlap.error',
                                    {'gatewayip': gateway, 'iprange': ipRange}
                                );
                            }
                            return isValid;
                        }
                    }
                }
            };

            $scope.validateIpRange = function(ipRange) {
                //ipRange passed must be defined
                $scope.invalidIpRangeMsg = undefined;
                var isValid = checkIpRange(ipRange);
                return isValid;
            };

            var checkGatewayIp = function(gatewayIp) {
                var originNk = findOriginNetworkData($scope.oneNetworkData);

                if((angular.isUndefined(gatewayIp)  &&
                    angular.isUndefined(originNk.gatewayip)) ||
                    originNk.gatewayip === gatewayIp) {
                    return true;
                }

                //at this point gatwayIp is defined
                var isValid = ocValidators.ipAddress.test(gatewayIp);
                if(!isValid) {
                    $scope.invalidGatewayIpMsg = $translate.instant('hpvalidate.ipAddress');
                    return isValid;
                }
                else {
                    var cidr = $scope.oneNetworkData.cidr;
                    if (angular.isUndefined(cidr) || cidr === '-' || cidr === '') {
                         return true; //nothing to check against
                    }
                    //result will be
                    // {'is_valid' : true, invalid_message : 'bla'}
                    var result = checkIpRangesValid([gatewayIp], cidr);
                    if(!result.is_valid) {
                        $scope.invalidGatewayIpMsg = $translate.instant(
                            'system.networking.gatewayip.cidr.error',
                            {'gatewayip': gatewayIp, 'cidr': $scope.oneNetworkData.cidr}
                        );
                        return result.is_valid;
                    }
                    else {
                        var existingRanges = [];
                        for (var idx in $scope.oneNetworkData.ranges) {
                            existingRanges.push($scope.oneNetworkData.ranges[idx].range);
                        }

                        if(existingRanges.length === 0) {
                            return true;
                        }

                        var isValid2 = checkIpRangesNoOverlapValid([gatewayIp], existingRanges);
                        if(!isValid2) {
                            $scope.invalidGatewayIpMsg =  $translate.instant(
                                'system.networking.gateway.iprange.overlap.error',
                                {'gatewayip': gatewayIp, 'existingranges': existingRanges.join(',')}
                            );
                        }
                        return isValid2;
                    }
                }
            };

            $scope.validateGatewayIp = function(gatewayIp) {
                $scope.invalidGatewayIpMsg = undefined;
                var isValid = checkGatewayIp(gatewayIp);
                return isValid;
            };

            //workaround to deal with angular js won't
            //update the model when empty the value
            $scope.removeGatewayIp = function(data) {
                data.gatewayip = '';
            };

            //
            //deal with network update
            //
            var getNetworkChanges = function(data, updateReq) {

                //at this point, I should have either gateway ip change or
                //ip ranges change or both
                updateReq.request_data.extraVars.network = data.name;

                var addresses = [];
                for (var idx in data.ranges) {
                    if (!data.ranges[idx].readonly) {
                        var range = data.ranges[idx].range;
                        range = range.replace(/ /g, '');
                        addresses.push(range);
                    }
                }
                if(addresses.length > 0) {
                    updateReq.request_data.extraVars.addresses = addresses.join(',');
                }

                var originNk = findOriginNetworkData(data);
                if (data.gatewayip !== originNk.gatewayip) {
                    //case of removing gatewayip
                    if(originNk.gatewayip !== '' &&
                      (data.gatewayip === ''  || angular.isUndefined(data.gatewayip))) {
                        updateReq.request_data.extraVars.gateway = '0.0.0.0';
                    }
                    else {
                        updateReq.request_data.extraVars.gateway = angular.copy(data.gatewayip).replace(/ /g, '');
                    }
                }

                return updateReq;
            };

            var base_req = {
                'request_data': {
                    'inventoryFile': null,
                    'extraVars' :{
                        'encrypt':'',
                        'rekey': ''
                    }
                }
            };

            var callBLLToUpdateGateway = function(network, gatewayIp) {
                var req = angular.copy(base_req);
                req.path = 'playbooks/network_interface-reconfigure';

                var networkMsg = network + ' gateway=' + gatewayIp;
                bllApiRequest.post('hlm_ux', req).then(
                    function(response) {
                        var data = response.data;
                        if (angular.isDefined(data) && data.alive === true) {
                            var processRef = data.pRef;
                            log('info',
                                'Successfully started step 2 updating network ' +
                                networkMsg + ' processRef = ' + processRef);
                            addNotification(
                                "info",
                                $translate.instant(
                                    "system.networking.update.gateway.start.success",
                                    {'network': networkMsg, 'processRef': processRef}
                                )
                            );
                            pollProcessStatus(processRef, network, networkMsg);
                        }
                    },
                    function (error_data) {
                        $scope.sysNetworkDataUpdating = false;
                        addNotification(
                            "error",
                            $translate.instant(
                                "system.networking.update.start.error_2",
                                {'network': networkMsg}
                            )
                        );
                        log('error', 'Failed to start step 2 updating network ' +  networkMsg);
                        log('error', 'error data = ' + JSON.stringify(error_data));
                    }
                );
            };

            var pollProcessStatus = function(processRef, network, networkMsg, gatewayIp) {
                if (angular.isUndefined(processRef)) {
                    addNotification(
                        "error",
                        $translate.instant(
                            "system.networking.update.pref.error",
                            {'network': networkMsg}
                        )
                    );
                    log('error', 'Failed getting process ref for updating network ' + networkMsg);
                    cancelConfirmUpdateNetworkModal();
                    return;
                }

                HLMUXService.poll(processRef, '').then(
                    function () {
                        addNotification(
                            "info",
                            $translate.instant(
                                "system.networking.update.process.finish",
                                {'processRef': processRef,
                                 'network': networkMsg}
                            )
                        );
                        log('info',
                            'Finished updating network ' + networkMsg +
                            ' processRef = ' + processRef
                        );
                        if (angular.isDefined(gatewayIp)) {
                            //continue to update gateway
                            callBLLToUpdateGateway(network, gatewayIp);
                        }
                        else {
                            cancelConfirmUpdateNetworkModal();
                        }
                    }
                )
                .catch(
                    function (data) {
                        var code = data.data.code ? data.data.code : -1;
                        if (code > 0) {
                            // Deploy failed
                            addNotification(
                                "error",
                                $translate.instant(
                                    "system.networking.update.process.error",
                                    {'processRef': processRef,
                                     'network': networkMsg}
                                )
                            );
                            log('error',
                                'Failed to poll the process for updating network ' +  networkMsg +
                                ' processRef = ' + processRef
                            );
                        } else {
                            //poll failed
                            addNotification(
                                "error",
                                $translate.instant(
                                    "system.networking.update.process.poll.error",
                                    {'processRef': processRef,
                                     'network': networkMsg}
                                )
                            );
                            log('error',
                                'Failed to poll the process for updating network ' +  networkMsg +
                                ' processRef = ' + processRef
                            );
                        }
                        log('error', 'error data = ' + JSON.stringify(data));
                        cancelConfirmUpdateNetworkModal();
                    }
                );
            };

            var getUpdateNetworkMsg = function(req) {
                var updateAddresses = '';
                var updateGateway = '';

                if (angular.isDefined(req.request_data.extraVars.addresses)) {
                    updateAddresses = $translate.instant('system.networking.update.confirm.addresses', {
                        addresses: req.request_data.extraVars.addresses
                    });
                }

                if (angular.isDefined(req.request_data.extraVars.gateway)) {
                    if (req.request_data.extraVars.gateway === '0.0.0.0') {
                        updateGateway = $translate.instant('system.networking.update.confirm.remove.gateway');
                    } else {
                        updateGateway = $translate.instant('system.networking.update.confirm.gateway', {
                            gateway: req.request_data.extraVars.gateway
                        });
                    }
                }

                return $translate.instant('system.networking.update.confirm.network', {
                    network: req.request_data.extraVars.network,
                    addresses: updateAddresses,
                    gateway: updateGateway
                });
            };

            $scope.showConfirmUpdateNetworkModal = function(data) {
                $scope.showConfirmUpdateNetworkModalFlag = true;
                $scope.updateNetworkConfirmMsg = '';
                var req = angular.copy(base_req);
                req = getNetworkChanges(data, req);
                $scope.updateNetworkConfirmMsg = getUpdateNetworkMsg(req);
            };

            var cancelConfirmUpdateNetworkModal = function() {
                $scope.sysNetworkDataUpdating = false;
                $scope.showConfirmUpdateNetworkModalFlag = false;
                $scope.showEditNetworkModalFlag = false;
                $scope.systemEditNetworkModal.closeModal();
                //refresh data table
                $scope.loadNetworkData();
            };

            $scope.commitEditNetwork = function() {
                var data = $scope.oneNetworkData;
                var req = angular.copy(base_req);
                req.path = 'playbooks/network_reconfig_network';

                req = getNetworkChanges(data, req);

                $scope.sysNetworkDataUpdating = true;

                var extraVarsMsg = getUpdateNetworkMsg(req);
                log('debug', 'update network request = ' + extraVarsMsg);

                bllApiRequest.post('hlm_ux', req).then(
                    function(response) {
                        var data = response.data;
                        if (angular.isDefined(data) && data.alive === true) {
                            var processRef = data.pRef;
                            log('info',
                                'Successfully started updating network ' +
                                extraVarsMsg + ' processRef= ' + processRef
                            );
                            addNotification(
                                "info",
                                $translate.instant(
                                    "system.networking.update.start.success",
                                    {'network': extraVarsMsg, 'processRef': processRef}
                                )
                            );
                            pollProcessStatus(
                                processRef, req.request_data.extraVars.network,
                                extraVarsMsg, req.request_data.extraVars.gateway
                            );
                        }
                    },
                    function(error_data) {
                        cancelConfirmUpdateNetworkModal();
                        addNotification(
                            "error",
                            $translate.instant(
                                "system.networking.update.start.error",
                                {'network': extraVarsMsg}
                            )
                        );
                        log('error', 'Failed to start updating network ' +  extraVarsMsg);
                        log('error', 'error data = ' + JSON.stringify(error_data));
                    }
                );
            };

            $scope.loadNetworkData();
        }
    ]);
})(angular);
