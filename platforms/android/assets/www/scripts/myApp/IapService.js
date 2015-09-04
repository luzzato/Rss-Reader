"use strict";

/* Services */
angular.module("myApp")
    .run([
        "$rootScope", "PaymentSettingService", "AuthService", "StorageService",
        function ($rootScope, PaymentSettingService, AuthService, StorageService) {
            console.log("run - IapService.init ", myprjplatformstore());
            if (AuthService.isLoggedIn() === true) {
                PaymentSettingService.initPaymentSettings(StorageService.get("PaymentSettings"));
            }; //else init after login or register

        }
    ])
    .factory("PaymentSettingService", [
        "StorageService", "$http", "baseUrl", "validateUrl", "RestExeptionHelper", "$q", "NotificationService", "$translate", "paymentAliases", "ClientVer", "PluginSettingService",
        function (StorageService, $http, baseUrl, validateUrl, RestExeptionHelper, $q, NotificationService, $translate, paymentAliases, ClientVer, PluginSettingService) {
            var firstrun = true;

            var iaplog = function(arg) {
                try {
                    if (typeof arg !== "string")
                        arg = JSON.stringify(arg);
                    console.log(arg);
                } catch (e) {
                }
            };

            var iapItems = null; //null mean what payments not available

            var loadIds = function() {
                iaplog("PaymentSettingService loadIds");
                var paymentSettings = StorageService.get("PaymentSettings") || [];

                try {
                    var mystore = myprjplatformstore();
                    switch (mystore) {
                    case "Google":
                        iapItems = paymentSettings["iapalias"]["Google"];
                        break;
                    case "Apple":
                        iapItems = paymentSettings["iapalias"]["Apple"];
                        break;
                    case "Web":
                    default:
                        iapItems = null;
                        break;
                    }
                } catch (e) {
                    iaplog("Error iapalias");
                    iaplog(e);
                    iaplog(paymentSettings);
                }

                iaplog("IapService initialize");

                if (!window.store) {
                    iaplog("Store not available");
                    iapItems = null;
                    return;
                }
                store.verbosity = store.INFO;
                //store.verbosity = store.DEBUG;

                var aliases = paymentAliases; //this items used by js and mapped by iapItems to IAP-items in different stores

                iaplog(aliases);
                iaplog(iapItems);

                if (iapItems != null)
                    aliases.forEach(function(item) {
                        iaplog(item);
                        if (undefined === iapItems[item] || null === iapItems[item] || iapItems[item].length <= 1) {
                            NotificationService.alert($translate.instant("IAPitem_Fail") + " " + item, function() {}, $translate.instant("IAPitem_Fail_Title"), $translate.instant("Ok"));
                        } else {
                            if (store.get(item)) {
                                //вообще надо сделать deregister но этот плагин этого не позволяет, надо будет переделать в нативном приложении
                                iaplog("IAP already registered " + item);
                            } else {
                                store.register({
                                    id: iapItems[item],
                                    alias: item,
                                    type: store.PAID_SUBSCRIPTION
                                });
                                console.log("IAP registered", item, iapItems[item]);
                            }
                        }
                    });


                if (firstrun) {
                    firstrun = false;
                    iaplog("IAP init firstrun");
                    //-------------
                    store.when("order").approved(function(p) {
                        iaplog("verify all orders, now for ");
                        iaplog(p);

                        $http({
                            method: "POST",
                            url: validateUrl,
                            data: p
                        }).success(function(data, status, headers, config) {
                            if (typeof (data) !== "undefined" && typeof (data.ok) !== "undefined" && data.ok) {
                                p.finish();
                                return data;
                            } else {
                                //RestExeptionHelper.fail("Login", data);
                                iaplog("invalid --");
                                iaplog(p);
                                iaplog(data);
                                iaplog("------------");
                            };
                        }).error(function(data, status, headers, config, statusText) {
                            //RestExeptionHelper.fail("Login", data);
                            iaplog("invalid --");
                            iaplog(p);
                            iaplog(data);
                            iaplog("------------");
                        });
                    });

                    store.when("order").updated(function(p) {
                        iaplog("updated ");
                        iaplog(p);
                    });

                    //-----------------
                    // Log all errors
                    store.error(function(error) {
                        iaplog("ERROR " + error.code + ": " + error.message);
                    });
                    store.ready(function() {
                        iaplog("store ready");
                    });
                }
                store.refresh();

                iaplog("end init");
            };

            return {
                initPaymentSettings: function(newdata) {
                    iaplog("initPaymentSettings");
                    StorageService.set("PaymentSettings", newdata);
                    loadIds();
                },
                clean: function() {
                    StorageService.del("PaymentSettings");
                    loadIds();
                },
                refresh: function() {
                    if (iapItems !== null && iapItems !== undefined) store.refresh();
                },
                
                getMaxFeeds: function() { return StorageService.get("PaymentSettings")["feedsmax"]; },
                getRefreshFeeds: function() { return StorageService.get("PaymentSettings")["feedsrefresh"]; },
                isOwned: function(alias) {
                    if (!StorageService.get("PaymentSettings")) return false;
                    if (!StorageService.get("PaymentSettings")["paymentstatus"]) return false;
                    return StorageService.get("PaymentSettings")["paymentstatus"][alias]; //we trust only our server
                },
                isAvailable: function(alias) {
                    return (iapItems !== null && iapItems !== undefined) && (undefined !== iapItems[alias] && null !== iapItems[alias] && iapItems[alias].length > 1);
                },
                isStoreAvailable: function() {
                    return (iapItems !== null && iapItems !== undefined);
                },
                getItemForPayment: function() {
                    iaplog("getItemForPayment");
                    var obj = this;
                    if (iapItems !== null && iapItems !== undefined) {
                        var ret = [];

                        if (!StorageService.get("PaymentSettings")) return ret;
                        var payments = StorageService.get("PaymentSettings");
                        if (!payments["paymentstatus"]) return ret;

                        iaplog("payments", payments);
                        paymentAliases.forEach(function(item) {
                            iaplog(item);
                            var p = new Object();
                            p["key"] = item;
                            p["isAvailable"] = obj.isAvailable(item) && obj.get(item) !== null;
                            p["isOwned"] = obj.isOwned(item);
                            p["Title"] = p["isAvailable"] ? obj.get(item).title : item;
                            p["Description"] = p["isAvailable"] ? obj.get(item).description : "not loaded";
                            p["Price"] = p["isAvailable"] ? obj.get(item).price : "$";
                            ret.push(p);
                        });

                        return ret;
                    } else return [];
                },
                order: function(alias) {
                    //iaplog("order ");
                    //iaplog(alias);
                    if (iapItems !== null && iapItems !== undefined) store.order(alias);
                },
                get: function(alias) {
                    //iaplog("get ");
                    //iaplog(alias);
                    if (iapItems !== null && iapItems !== undefined) return store.get(alias);
                    else return null;
                }
            };
        }
    ]);