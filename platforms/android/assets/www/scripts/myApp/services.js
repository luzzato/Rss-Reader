"use strict";

/* Services */
angular.module("myApp.services", [])
    .factory("NotificationService", [
        "$rootScope", function($rootScope) {

            if (typeof (navigator.notification) != "undefined") {
                //http://tech.pro/tutorial/1349/phonegap-and-angularjs-notification-service
                return {
                    alert: function(message, alertCallback, title, buttonName) {
                        navigator.notification.alert(message, function() {
                            var that = this,
                                args = arguments;

                            $rootScope.$apply(function() {
                                alertCallback.apply(that, args);
                            });
                        }, title, buttonName);
                    },
                    confirm: function(message, confirmCallback, title, buttonLabels) {
                        navigator.notification.confirm(message, function() {
                            var that = this,
                                args = arguments;

                            //$rootScope.$apply(function() {
                            confirmCallback.apply(that, args);
                            //});
                        }, title, buttonLabels);
                    },
                    beep: function(times) {
                        navigator.notification.beep(times);
                    },
                    vibrate: function(milliseconds) {
                        navigator.notification.vibrate(milliseconds);
                    }
                };
            } else {
                return {
                    alert: function(message, alertCallback, title, buttonName) {
                        alert(message);
                    },
                    confirm: function(message, confirmCallback, title, buttonLabels) {
                        var that = this,
                            args = arguments;
                        if (confirm(message)) {
                            //$rootScope.$apply(function () {
                            confirmCallback.apply(that, args);
                            //});
                        }
                    },
                    beep: function(times) {

                    },
                    vibrate: function(milliseconds) {

                    }
                };
            }
        }
    ])
    .factory("AuthService", [
        "StorageService", "NotificationService", "baseUrl", "RestExeptionHelper", "ClientVer",
        function(StorageService, NotificationService, baseUrl, RestExeptionHelper, ClientVer) {
            var user = null; //for watching isLoggedIn

            var initFeeds = function(response) {
                user = {};
                user["SessionId"] = response.SessionId;
                user["Lang"] = response.Lang;
                user["Username"] = response.Username;
                user["Email"] = response.Email;
                StorageService.set("user", user);
            };

            return {
                login: function(nUser, nPwd, nLang, $http) {
                    //console.log("AuthService login ", nUser, " ", nPwd);

                    var responsePromise = $http({
                        method: "POST",
                        url: baseUrl + "/account/auth",
                        data: {
                            Login: nUser,
                            Password: nPwd,
                            Lang: nLang,
                            ClientVer: ClientVer
                        }
                    });
                    responsePromise.success(function(data, status, headers, config) {
                        if (RestExeptionHelper.success("Login", data) && typeof (data.SessionId) !== "undefined") {
                            initFeeds(data);
                            return data;
                        } else {
                            RestExeptionHelper.fail("Login", data);
                        };
                    });
                    responsePromise.error(function(data, status, headers, config, statusText) {
                        RestExeptionHelper.fail("Login", data);
                    });
                    return responsePromise;

                },
                register: function(nUser, nEmail, nPwd, nLang, $http) {
                    //console.log("AuthService register ", nUser, nEmail, nPwd);

                    var responsePromise = $http({
                        method: "POST",
                        url: baseUrl + "/account/register",
                        data: {
                        Login: nUser,
                            Password: nPwd,
                            Email: nEmail,
                            Lang: nLang,
                            ClientVer: ClientVer
                    }
                });
                    responsePromise.success(function(data, status, headers, config) {
                        if (RestExeptionHelper.success("Registration", data) && typeof (data.SessionId) !== "undefined") {
                            initFeeds(data);
                            return data;
                        } else {
                            RestExeptionHelper.fail("Registration", data);
                        };
                    });
                    responsePromise.error(function(data, status, headers, config, statusText) {
                        RestExeptionHelper.fail("Registration", data);
                    });
                    return responsePromise;

                },
                recovery: function(nEmail, $http) {
                    console.log("recovery");
                    var promise = $http({
                        method: "POST",
                        url: baseUrl + "/account/recovery",
                        data: {
                            Email: nEmail
                        },
                        async: true,
                        cache: false
                    }).finally(function() {

                    });
                    return promise;
                },
                changePassword: function(oldPwd, newPwd, $http) {
                    console.log("recovery");
                    var promise = $http({
                        method: "POST",
                        url: baseUrl + "/account/changepassword",
                        data: {
                            oldPwd: oldPwd,
                            newPwd: newPwd
                        },
                        async: true,
                        cache: false
                    }).success(function(data, status, headers, config) {
                        if (RestExeptionHelper.success("ChangePassword", data) && typeof (data.result) !== "undefined") {
                            return data;
                        } else {
                            RestExeptionHelper.fail("ChangePassword", data);
                        };
                    }).error(function(data, status, headers, config, statusText) {
                        RestExeptionHelper.fail("ChangePassword", data);
                    }).finally(function() {

                    });
                    return promise;
                },
                logout: function($http) {
                    console.log("Logout");
                    var promise = $http({
                        method: "POST",
                        url: baseUrl + "/account/logout",
                        data: {},
                        async: true,
                        cache: false
                        //,headers: { 'SessionId': getSessionId() }
                    }).finally(function() {
                        StorageService.del("user"); //force logout can be called from authInterceptor
                        user = null;
                        //location.reload();
                    });
                    return promise;
                },
                getUser: function() {
                    user = StorageService.get("user");
                    return user;
                },
                getSessionId: function() {
                    return this.getUser() ? this.getUser()["SessionId"] : null;
                },
                getLanguage: function() {
                    return this.getUser() ? this.getUser()["Lang"] : "en";
                },
                getUsername: function() {
                    return this.getUser() ? this.getUser()["Username"] : null;
                },
                getEmail: function() {
                    return this.getUser() ? this.getUser()["Email"] : null;
                },
                isLoggedIn: function() {
                    user = StorageService.get("user");
                    return (user) ? (!!user) : false;
                }
            };
        }
    ])
    .factory("authInterceptor", [
        "$rootScope", "$q", "$location", "AuthService", "StorageService", function($rootScope, $q, $location, AuthService, StorageService) {
            return {
                'request': function(config) {
                    config.headers = config.headers || {};
                    if (AuthService.getSessionId() != null) config.headers.SessionId = AuthService.getSessionId();

                    return config;
                },
                'response': function(response) {
                    if (response.status === 401) {
                        // handle the case where the user is not authenticated
                        $location.path("#/login");
                    }
                    if (response.data.RestException !== undefined && response.data.RestException.Code !== undefined && response.data.RestException.Code === 22 /*Access Denied*/) {
                        StorageService.del("user"); //force logout
                        $location.path("#/login");
                    }
                    return response || $q.when(response);
                }
            };
        }
    ])
    .factory("StorageService", function() {
        return {
            set: function(name, value) {
                if (value === undefined) this.del(name);
                else window.localStorage.setItem(name, JSON.stringify(value));
            },
            get: function(name) {
                return JSON.parse(window.localStorage.getItem(name));
            },
            del: function(name) {
                window.localStorage.removeItem(name);
            },
            keys: function() {
                return Object.keys(window.localStorage);
            },
            setBinary: function(name, value) {
                if (value === undefined) this.del(name);
                else window.localStorage.setItem(name, value);
            },
            getBinary: function(name) {
                return (window.localStorage.getItem(name));
            }
        };
    })
    .factory("LanguageService", [
        "$translate", "AvailableLanguages", "amMoment", function($translate, AvailableLanguages, amMoment) {
            return {
                set: function(lang) {
                    $translate.use(lang);
                    amMoment.changeLocale(lang);
                },
                getCurrent: function() {
                    return $translate.use();
                },
                getAll: function() {
                    return AvailableLanguages; //$translate.getAvailableLanguageKeys(); https://github.com/angular-translate/angular-translate/pull/618
                    //return Object.keys(AvailableLanguages); //$translate.getAvailableLanguageKeys(); https://github.com/angular-translate/angular-translate/pull/618
                }
            };
        }
    ])
    .factory("RRLangLoader", [
        "$http", "$q", "baseUrl", "NotificationService", function($http, $q, baseUrl, NotificationService) {
            return function(options) {
                var deferred = $q.defer();
                console.log("load translation", options);

                $http({
                    method: "GET",
                    url: myprjplatformprefix + "translation/" + options.key.toLowerCase() + ".js"
                }).success(function(data) {
                    deferred.resolve(data);
                }).error(function() {
                    NotificationService.alert("can`t load language " + options.key.toLowerCase(), function() {}, "Alert", "Close");
                    deferred.reject(options.key);
                });

                return deferred.promise;
            };
        }
    ])
    .factory("RestExeptionHelper", [
        "NotificationService", function(NotificationService) {
            return {
                success: function(name, data) {
                    if (typeof (data.RestException) === "undefined") {
                        return true;
                    } else {
                        return false;
                    }
                },
                fail: function(name, data) {
                    console.log(name + " FAIL server error ", " data=", data);
                    if (data === null || data === undefined)
                        NotificationService.alert(name + " unknown error ", function() {}, "Alert", "Close");
                    else if (typeof (data.RestException) !== "undefined")
                        NotificationService.alert(name + " fail (" + data.RestException.Code + ") " + data.RestException.Message, function() {}, "Alert", "Close");
                    else
                        NotificationService.alert(name + " fail no data from server", function() {}, "Alert", "Close");
                }
            };
        }
    ])
    .factory("FeedService", [
        "StorageService", "NotificationService", "RestExeptionHelper", "ArticleService", "$http", "$q", "baseUrl",
        function(StorageService, NotificationService, RestExeptionHelper, ArticleService, $http, $q, baseUrl) {
            var feeds = StorageService.get("FeedLents");
            var feedItems = StorageService.get("FeedItems");

            var calcUnreaded = function(feedItems) {
                var cnt = 0;
                try {
                    feedItems
                        .map(function(v, i) { return v.Readed === false ? 1 : 0; }) //convert to int
                        .map(function(v) { return cnt += v; }); //sum 
                } catch (e) {

                }
                return cnt;
            };
            var totalUnreaded = calcUnreaded(feedItems);

            var calcFave = function(feedItems) {
                var cnt = 0;
                try {
                    feedItems
                        .map(function(v, i) { return v.Starred === false ? 0 : 1; }) //convert to int
                        .map(function(v) { return cnt += v; }); //sum 
                } catch (e) {

                }
                return cnt;
            };
            var totalFave = calcFave(feedItems);

            var changeReaded = function(feeds, feedItems, feedItem, value) {
                var changed = false;
                for (var i in feedItems) {
                    if (feedItems.hasOwnProperty(i)) {
                        if (feedItems[i].ArticlePublicId === feedItem.ArticlePublicId) {
                            if (feedItems[i].Readed !== value) changed = true; //prevent double calculation unreaded
                            feedItems[i].Readed = value;
                            break; //Stop this loop, we found it!
                        }
                    }
                }
                for (var i in feeds) {
                    if (feeds.hasOwnProperty(i)) {
                        if (changed && feeds[i].LentaPublicId === feedItem.LentaPublicId) {
                            feeds[i].Unreaded += value ? -1 : +1;
                            break; //Stop this loop, we found it!
                        }
                    }
                }
            };
            var changeFave = function(feedItems, publicId, value) {
                for (var i in feedItems) {
                    if (feedItems.hasOwnProperty(i)) {
                        if (feedItems[i].ArticlePublicId === publicId) {
                            feedItems[i].Starred = value;
                            break; //Stop this loop, we found it!
                        }
                    }
                }
            }; //todo update feed title (make new sync type in history)
            return {
                initFeeds: function(newFeeds) {
                    feeds = newFeeds;
                    StorageService.set("FeedLents", feeds);
                },
                initFeedItems: function(newFeedItems) {
                    feedItems = newFeedItems;

                    StorageService.set("FeedItems", feedItems);
                    totalUnreaded = calcUnreaded(feedItems);
                    totalFave = calcFave(feedItems);
                },
                clean: function() {
                    StorageService.del("FeedLents");
                    StorageService.del("FeedItems");
                },
                getFeeds: function() {
                    return feeds;
                },
                getFeedItems: function() {
                    return feedItems;
                },
                getFeedArticleInfo: function(publicId) {
                    return feedItems.filter(function(item) {
                        return item.ArticlePublicId === publicId;
                    })[0];
                },
                getFeedArticleData: function(publicId) {
                    return ArticleService.getArticle(publicId).then(function (ziped) {
                        if (ziped === null || ziped === undefined || ziped.length === 0)
                            return null;

                        try {
                            var zipManager = new JSZip(ziped);
                            var html = zipManager.file("c").asText();
                            return html;
                        } catch (e) {
                            return "unzip error" + e;
                        }
                    });

                },
                getTotalUnreaded: function() {
                    return totalUnreaded;
                },
                getTotalFave: function() {
                    return totalFave;
                },
                fave: function(feedItem) {
                    changeFave(feedItems, feedItem.ArticlePublicId, true);
                    totalFave = calcFave(feedItems);
                    this.initFeedItems(feedItems); //save to StorageService
                },
                unfave: function(feedItem) {
                    changeFave(feedItems, feedItem.ArticlePublicId, false);
                    totalFave = calcFave(feedItems);
                    this.initFeedItems(feedItems); //save to StorageService
                },
                read: function(feedItem) {
                    changeReaded(feeds, feedItems, feedItem, true);
                    totalUnreaded = calcUnreaded(feedItems);
                    this.initFeedItems(feedItems); //save to StorageService
                    this.initFeeds(feeds); //save to StorageService
                },
                unread: function(feedItem) {
                    changeReaded(feeds, feedItems, feedItem, false);
                    totalUnreaded = calcUnreaded(feedItems);
                    this.initFeedItems(feedItems); //save to StorageService
                    this.initFeeds(feeds); //save to StorageService
                },
                deleteItem: function(feedItem) {
                    for (var n = 0; n < feedItems.length; n++) {
                        if (feedItems[n].ArticlePublicId === feedItem.ArticlePublicId) {
                            var removedObject = feedItems.splice(n, 1);
                            removedObject = null;
                            break;
                        }
                    }
                    for (var i in feeds) {
                        if (feeds.hasOwnProperty(i)) {
                            if (feedItem.Readed === false && feeds[i].LentaPublicId === feedItem.LentaPublicId) {
                                feeds[i].Unreaded += -1;
                                break;
                            }
                        }
                    }
                    totalFave = calcFave(feedItems);
                    totalUnreaded = calcUnreaded(feedItems);
                    this.initFeeds(feeds);
                    this.initFeedItems(feedItems); //save to StorageService
                },
                tryAddFeed: function(title, url) {

                    var deferred = $q.defer();
                    console.log("tryAddFeed", url);

                    $http({
                        method: "POST",
                        url: baseUrl + "/feed/add",
                        data: {
                            url: url,
                            title: title
                        }
                    }).success(function(data) {
                        if (RestExeptionHelper.success("Add feed", data) && typeof (data.Ok) !== "undefined" && data.Ok === true) {

                            feeds.push({
                                Title: title,
                                Url: url,
                                LentaPublicId: data.NewPulicId
                            });
                            StorageService.set("FeedLents", feeds);
                            deferred.resolve(data);
                            return data;
                        } else {
                            RestExeptionHelper.fail("Add feed", data);
                            deferred.reject();
                        };

                    }).error(function(data) {
                        RestExeptionHelper.fail("Add feed", data);
                        deferred.reject();
                    });

                    return deferred.promise;
                },
                deleteFeed: function(lentaPublicId) {
                    for (var n = 0; n < feeds.length; n++) {
                        if (feeds[n].LentaPublicId === lentaPublicId) {
                            var removedObject = feeds.splice(n, 1);
                            removedObject = null;
                            break;
                        }
                    }
                    //feedItems must be cleaned before call removeNotUsedArticles 
                    feedItems = feedItems.filter(function(element) {
                        return element.LentaPublicId !== lentaPublicId;
                    });

                    totalFave = calcFave(feedItems);
                    totalUnreaded = calcUnreaded(feedItems);
                    this.initFeeds(feeds);
                    this.initFeedItems(feedItems);
                },
                updateFeed: function(lentaPublicId, title, url) {
                    var elem = feeds.filter(function(element) {
                        return element.LentaPublicId === lentaPublicId;
                    })[0];
                    elem.Title = title;
                    elem.Url = url;
                    this.initFeeds(feeds);
                }

            };
        }
    ])
    .factory("SyncService", [
        "StorageService", "NotificationService", "baseUrl", "RestExeptionHelper", "$http", "$q", "ArticleService", "FeedService", "PaymentSettingService",
        function(StorageService, NotificationService, baseUrl, RestExeptionHelper, $http, $q, ArticleService, FeedService, PaymentSettingService) {

            var historyItems = StorageService.get("HistoryItems") || [];
            var counter = historyItems.length;

            var DeviceLastSync = Date.now();

            var status = {
                countMustDownload: (StorageService.get("FeedItems") || []).length,
                countAlreadyDownloaded: 0,//ArticleService.countAlreadyDownloaded(),
                syncDate: DeviceLastSync
            };
            ArticleService.countAlreadyDownloaded().then(function(val) {
                status.countAlreadyDownloaded = val;
            });
            console.log("*** SyncService init");
            var downloadStarted = false;

            return {
                setSyncDate: function(newSyncDate) {
                    status.syncDate = newSyncDate;
                    StorageService.set("SyncDate", status.syncDate);
                },
                updateDeviceLastSync: function() {
                    DeviceLastSync = Date.now();
                },
                getDeviceLastSync: function() {
                    return DeviceLastSync;
                },
                clean: function() {
                    FeedService.clean();
                    StorageService.del("SyncDate");
                    StorageService.del("HistoryItems");
                    ArticleService.clean();
                    PaymentSettingService.clean();
                },
                add: function(action, publicId) {
                    historyItems.push({ c: ++counter, a: action, i: publicId });
                    StorageService.set("HistoryItems", historyItems);
                },
                addP: function(action, publicId, param) {
                    historyItems.push({ c: ++counter, a: action, i: publicId, p: param });
                    StorageService.set("HistoryItems", historyItems);
                },
                fave: function(feedItem) {
                    this.add("f", feedItem.ArticlePublicId);
                },
                unfave: function(feedItem) {
                    this.add("g", feedItem.ArticlePublicId);
                },
                read: function(feedItem) {
                    this.add("r", feedItem.ArticlePublicId);
                },
                unread: function(feedItem) {
                    this.add("t", feedItem.ArticlePublicId);
                },
                deleteItem: function(feedItem) {
                    this.add("k", feedItem.ArticlePublicId);
                },
                deleteFeed: function(lentaPublicId) {
                    this.add("fd", lentaPublicId);
                },
                updateFeed: function(lentaPublicId, title, url) {
                    this.addP("fut", lentaPublicId, title);
                    this.addP("fuu", lentaPublicId, url);
                },
                loadAll: function () {
                    console.log("loadAll check");
                    if (downloadStarted) {
                        return;
                    }
                    downloadStarted = true;

                    var feedItems = (StorageService.get("FeedItems") || []);

                    status.countMustDownload = feedItems.length;
                    status.countAlreadyDownloaded = 0;

                    var promisesArray = [];

                    feedItems.forEach(function(item) {
                        var publicId = item.ArticlePublicId;

                        var promise = ArticleService.getArticle(publicId).then(function (data) {
                            if (data !== null && data !== undefined && data.length > 3) {
                                status.countAlreadyDownloaded++;
                            } else {

                                var responsePromise = $http({
                                    method: "GET",
                                    responseType: "arraybuffer", //case sensitive
                                    url: baseUrl + "/article/get/" + publicId
                                });
                                responsePromise.success(function (data, statusRequset, headers, config) {
                                    status.countAlreadyDownloaded++;
                                    console.log("loadAll loaded " + publicId);
                                    ArticleService.save(publicId, new Uint8Array(data));
                                });
                                responsePromise.error(function (data, status, headers, config, statusText) {
                                    //var text = String.fromCharCode.apply(null, new Uint8Array(data));
                                    //var text = _arrayBufferToBase64(new Uint8Array(data));
                                    console.log("error /article/get/" + publicId);//+ " " + JSON.parse(text).error);
                                });

                                //promisesArray.push(responsePromise);
                            }
                        });

                        promisesArray.push(promise);
                    });
                    $q.all(promisesArray).finally(function () {
                        console.log("loadAll finished");
                        downloadStarted = false;
                    });
                },
                getStatus: status,
                getHistoryItems: function() {
                    return angular.copy(historyItems);
                },
                clearHistoryItems: function(syncDate) {
                    this.setSyncDate(syncDate);
                    historyItems = [];
                    counter = 0;
                    StorageService.set("HistoryItems", historyItems);
                },
                syncMethodChange: function(newSyncDate, newFeedItems) {
                    this.clearHistoryItems(newSyncDate);

                    var changedItemsId = new Array();
                    newFeedItems.forEach(function(item) {
                        //changedItemsId.push(item.ArticlePublicId);
                        changedItemsId[item.ArticlePublicId] = item;
                    });

                    var origItems = FeedService.getFeedItems();
                    origItems.forEach(function(item) {
                        var publicId = item.ArticlePublicId;
                        var newItem = changedItemsId[publicId];
                        if (newItem === undefined || newItem === null)
                            return item;
                        else {
                            if (item.Readed !== newItem.Readed) {
                                if (newItem.Readed)
                                    FeedService.read(newItem);
                                else
                                    FeedService.unread(newItem);
                            }
                            if (item.Starred !== newItem.Starred) {
                                if (newItem.Starred)
                                    FeedService.fave(newItem);
                                else
                                    FeedService.unfave(newItem);
                            }
                            if (item.Deleted !== newItem.Deleted) {
                                if (newItem.Deleted)
                                    FeedService.deleteItem(newItem);
                            }
                        }
                    });
                    this.setSyncDate(newSyncDate);

                },
                syncMethodFull: function(newSyncDate, newFeedItems, newFeedLents) {
                    this.clearHistoryItems(newSyncDate);
                    FeedService.initFeeds(newFeedLents);
                    FeedService.initFeedItems(newFeedItems);
                    this.setSyncDate(newSyncDate);

                }
            };
        }
    ])
    .factory("ArticleService", [
        "ArticleServiceWebStorage",
        //"ArticleServiceMobileStorage",
        function (ArticleServiceWebStorage
                   //, ArticleServiceMobileStorage
        ) {
            //if (typeof (cordova) != "undefined") {
            //    return ArticleServiceMobileStorage;
            //} else
            return ArticleServiceWebStorage;
        }
    ])
    /*.factory("ArticleServiceLocalStorage", [
        "StorageService", function(StorageService) {
            var keyPrefix = "art-";

            return {
                save: function(publicId, dataUint8Array) {
                    var fullkey = keyPrefix + publicId;

                    var dv1 = new Uint8Array(dataUint8Array);
                    //var text = String.fromCharCode.apply(null, dv1);
                    var text = _arrayBufferToBase64(dv1);
                    var ua2b64 = btoa(text);

                    StorageService.setBinary(fullkey, ua2b64);
                },
                getArticle: function(publicId) {
                    var fullkey = keyPrefix + publicId;

                    var base64EncodedString = StorageService.getBinary(fullkey);
                    if (base64EncodedString === null || base64EncodedString === undefined)
                        return base64EncodedString;

                    var b642ua = new Uint8Array(atob(base64EncodedString).split("").map(function(c) {
                        return c.charCodeAt(0);
                    }));
                    return b642ua;
                },
                clean: function() {
                    (StorageService.keys() || []).forEach(function(item) {
                        if (item.lastIndexOf(keyPrefix, 0) === 0)
                            StorageService.del(item);
                    });
                },
                countAlreadyDownloaded: function() {
                    return (StorageService.keys() || []).filter(function(item) { return item.lastIndexOf(keyPrefix, 0) === 0 }).length;
                },
                removeNotUsedArticles: function(feedItems) {
                    var existArticles = (StorageService.keys() || []).filter(function(item) { return item.lastIndexOf(keyPrefix, 0) === 0 });
                    var requiredArticles = feedItems.map(function(item) {
                        return item.ArticlePublicId;
                    });

                    existArticles.forEach(function(item) {
                        var del = true;
                        for (var n = 0; n < requiredArticles.length; n++) {
                            var fullkey = keyPrefix + requiredArticles[n];
                            if (fullkey === item) {
                                del = false;
                                break;
                            }
                        }
                        if (del)
                            StorageService.del(item);
                    });
                }
            };
        }
    ])*/
    .factory("NetworkStateService", [
        "$http", "SyncService", "baseUrl", "AuthService", "PaymentSettingService", "PluginSettingService",
        function ($http, SyncService, baseUrl, AuthService, PaymentSettingService, PluginSettingService) {
            var downloadStarted = false;

            if (!navigator.connection)
                console.log("NetworkStateService: NetworkInformation API is not available.");

            //todo remove
            //copy from cordova-plugin-network-information/master/www/Connection.js
            var Connection = {
                UNKNOWN: "unknown",
                ETHERNET: "ethernet",
                WIFI: "wifi",
                CELL_2G: "2g",
                CELL_3G: "3g",
                CELL_4G: "4g",
                CELL: "cellular",
                NONE: "none"
            };

            var lastTimeFullData = Math.floor(Date.now() / 1000);
            var lastTimeMobileData = Math.floor(Date.now() / 1000);

            var sendFullData = function() {
                //console.log('NetworkStateService sendFullData');

                var syncLastDate = SyncService.getStatus.syncDate;
                var syncHistory = SyncService.getHistoryItems();

                if (syncHistory !== null && syncHistory !== undefined) {

                    try {
                        var responsePromise = $http({
                                method: "POST",
                                url: baseUrl + "/sync/full/",
                                data: {
                                    date: syncLastDate,
                                    history: syncHistory
                                }
                            })
                            .success(function(data, statusRequset, headers, config) {
                                //console.log('NetworkStateService sendFullData - success');
                                try {
                                    switch (data.Method) {
                                    case "change":
                                        SyncService.syncMethodChange(data.syncDate, data.FeedItems);
                                        break;
                                    case "full":
                                        SyncService.syncMethodFull(data.syncDate, data.FeedItems, data.FeedLents);
                                        break;
                                    default:
                                    }
                                    if (data.SettingsWasChanged) {
                                        PaymentSettingService.initPaymentSettings(data.Settings);
                                        PluginSettingService.init(data.Plugins);
                                    }
                                    SyncService.updateDeviceLastSync();
                                } catch (e) {
                                    console.log("NetworkStateService sendFullData - result proceed error - " + e);
                                }
                                downloadStarted = false;

                            })
                            .error(function(data, status, headers, config, statusText) {
                                downloadStarted = false;

                                console.log("NetworkStateService sendFullData - error1 send data -" + data);
                                if (data.RestException.Code == 25) /*not auth*/
                                    AuthService.logout($http);
                            });
                    } catch (e) {
                        downloadStarted = false;
                        console.log("NetworkStateService sendFullData - exception -" + e);
                    }
                } else {
                    downloadStarted = false;
                    console.log("NetworkStateService sendFullData - no data to send");
                }

               // SyncService.loadAll();
            };


            return {
                status: downloadStarted,
                sendData: function(force) {

                    force = !!force;
                    if (force === true) {
                        console.log("NetworkStateService sendFullData forced");
                        sendFullData();
                    }

                    if (downloadStarted)
                        return;

                    if (!AuthService.isLoggedIn())
                        return;

                    downloadStarted = true;


                    try {
                        if (!navigator.connection) {
                            var timeNow = Math.floor(Date.now() / 1000);
                            var delta = 10;
                            if (timeNow - lastTimeFullData < delta) {
                                //skip
                                downloadStarted = false;
                                return;
                            }
                            lastTimeFullData = timeNow;
                            console.log("NetworkStateService sendFullData delta", delta);

                            sendFullData();
                        } else {
                            var networkState = navigator.connection.type;
                            if (networkState === Connection.NONE) {

                            }
                            if (networkState === Connection.WIFI || networkState === Connection.ETHERNET) {
                                var timeNow2 = Math.floor(Date.now() / 1000);
                                var delta2 = 10;
                                if (timeNow2 - lastTimeFullData < delta2) {
                                    //skip
                                    downloadStarted = false;
                                    return;
                                }
                                lastTimeFullData = timeNow2;
                                console.log("NetworkStateService sendFullData delta", delta2);

                                sendFullData();
                            }

                            var timeNow3 = Math.floor(Date.now() / 1000);
                            var delta3 = 5 * 60;
                            if (timeNow3 - lastTimeMobileData < delta3) {
                                //skip
                                downloadStarted = false;
                                return;
                            }
                            lastTimeMobileData = timeNow3;
                            console.log("NetworkStateService sendMobileData delta", delta3);
                            sendFullData();
                        }

                    } catch (e) {
                        downloadStarted = false;
                    }

                }
            };
        }
    ])

    .factory("PluginSettingService", [
        "StorageService", "NotificationService", "$translate", "paymentAliases", 
        function(StorageService, NotificationService, $translate, paymentAliases) {
            var plugins = StorageService.get("Plugins") || [];

            return {
                init: function(newdata) {
                    StorageService.set("Plugins", newdata);
                    plugins = StorageService.get("Plugins") || [];
                },
                clean: function() {
                    StorageService.del("Plugins");
                },
                get: function () {
                    return plugins;
                },
                getPlugin: function (pluginId) {
                    for (var i in plugins) {
                        if (plugins.hasOwnProperty(i)) {
                            if (plugins[i].BuyId.toLowerCase() === pluginId.toLowerCase()) {
                                return plugins[i];
                            }
                        }
                    }
                    return null;
                },
            };
        }
    ])

    .service("sharedProperties", function() {
        var lentaChecked = null;

        return {
            getLentaChecked: function() {
                return lentaChecked;
            },
            setLentaChecked: function(value) {
                lentaChecked = value;
            }
        };
    })

    .factory("PromocodeService", [
            "$http", "$q", "baseUrl", "RestExeptionHelper", function ($http, $q, baseUrl, RestExeptionHelper) {
                return {
                    addcode: function (code) {

                        var responsePromise = $http({
                            method: "POST",
                            url: baseUrl + "/sync/promo",
                            data: {
                                Promocode: code
                            }
                        });
                        responsePromise.success(function (data, status, headers, config) {
                            if (RestExeptionHelper.success("Promocode", data) && typeof (data.result) !== "undefined" && data.result === true) {
                                return data;
                            } else {
                                RestExeptionHelper.fail("Promocode", data);
                            };
                        });
                        responsePromise.error(function (data, status, headers, config, statusText) {
                            RestExeptionHelper.fail("Promocode", data);
                        });

                        return responsePromise;
                    }
                };
            }
    ])

;;


function _arrayBufferToBase64(uarr) {
    var strings = [], chunksize = 0xffff;
    var len = uarr.length;

    for (var i = 0; i * chunksize < len; i++){
        strings.push(String.fromCharCode.apply(null, uarr.subarray(i * chunksize, (i + 1) * chunksize)));
    }

    return strings.join("");
}