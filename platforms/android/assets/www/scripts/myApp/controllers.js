"use strict";

/* Controllers */

angular.module("myApp.controllers", [])
    .controller("HeaderCtrl", [
        "$scope", "AuthService", "$window", "FeedService", "SyncService", "$translate", "sharedProperties", "$location",
        function($scope, AuthService, $window, FeedService, SyncService, $translate, sharedProperties, $location) {
            $scope.username = AuthService.getUsername();
            $scope.$watch(AuthService.isLoggedIn, function(value, oldValue) {
                $scope.username = AuthService.getUsername();
            }, true);


            $scope.$on("$routeChangeStart", function(event, newUrl, oldUrl) {
                $scope.obj = new Object();
                $scope.item = new Object();
                $scope.obj.isArticle = false;
                $scope.obj.isLenta = false;
                $scope.obj.canBack = $location.path() !== "/login";
                $scope.back = function() {
                    console.log("history back ");
                    $window.history.back();
                };

                var artId = newUrl.pathParams.artId;
                var lentId = newUrl.pathParams.lentId;

                console.log("HeaderCtrl $routeChangeStart", artId, lentId);

                if (artId !== undefined) {
                    $scope.obj.isArticle = true;
                    $scope.item = FeedService.getFeedArticleInfo(artId);

                    //duplicated code
                    $scope.fave = function(feedItem) {
                        console.log("fave ", feedItem);
                        FeedService.fave(feedItem);
                        SyncService.fave(feedItem);
                    };

                    $scope.unfave = function(feedItem) {
                        console.log("unfave ", feedItem);
                        FeedService.unfave(feedItem);
                        SyncService.unfave(feedItem);
                    };

                    $scope.read = function(feedItem) {
                        console.log("read ", feedItem);
                        FeedService.read(feedItem);
                        SyncService.read(feedItem);
                    };

                    $scope.unread = function(feedItem) {
                        console.log("unread ", feedItem);
                        FeedService.unread(feedItem);
                        SyncService.unread(feedItem);
                    };

                    $scope.obj.title = null;
                    console.log("HeaderCtrl title", $scope.obj.title);
                }

                if (lentId !== undefined) {
                    $scope.obj.isLenta = true;
                    var newTitle = "";
                    switch (lentId) {
                    case "system":
                    case "System":
                    case "SystemFeed":
                        newTitle = "SynRSS";
                        break;
                    case "unread":
                        newTitle = $translate.instant("LeftMenu_Unreaded").replace("LeftMenu_Unreaded", ""); //$translate not ready for first-time load page
                        break;
                    case "fave":
                        newTitle = $translate.instant("LeftMenu_Favourites").replace("LeftMenu_Favourites", "");
                        break;
                    default:
                        newTitle = FeedService.getFeeds().filter(function(element) {
                            return element.LentaPublicId === lentId;
                        })[0].Title;
                        break;
                    }
                    if ($scope.obj.title !== newTitle) $scope.obj.title = newTitle;
                    console.log("HeaderCtrl title", $scope.obj.title);

                    sharedProperties.setLentaChecked([]);
                    $scope.sharedProperties = sharedProperties;
                }


            });


        }
    ])
    .controller("LeftMenuCtrl", [
        "$scope", "$timeout", "FeedService", "NetworkStateService", function($scope, $timeout, FeedService, NetworkStateService) {
            $scope.FeedService = FeedService;

            $scope.intervalFunction = function() {
                $timeout(function() {
                    //console.log("timer resync", NetworkStateService.status);
                    try {
                        var updated = NetworkStateService.sendData();
                    } catch (e) {
                        console.log("resync error: " + e);
                    }

                    $scope.intervalFunction();
                }, 1000);
            };

            // Kick off the interval
            $scope.intervalFunction();

        }
    ])
    .controller("LoginCtrl", [
        "$scope", "AuthService", "$location", "$http", "LanguageService", "FeedService", "SyncService", "PaymentSettingService", "$routeParams", "PluginSettingService",
        function ($scope, AuthService, $location, $http, LanguageService, FeedService, SyncService, PaymentSettingService, $routeParams, PluginSettingService) {
            var email = $routeParams.email;
            $scope.username = email || "";

            $scope.switchLang = function(lang) {
                LanguageService.set(lang);
            };

            $scope.currentLang = LanguageService.getCurrent();

            $scope.languages = LanguageService.getAll();

            $scope.loading = false;

            $scope.trylogin = function() {
                console.log("login");
                $scope.loading = true;
                AuthService.login($scope.username, $scope.password, $scope.currentLang, $http)
                    .then(function(response) {

                       try {
                            FeedService.initFeeds(response.data.FeedLents);
                            FeedService.initFeedItems(response.data.FeedItems);
                            SyncService.setSyncDate(response.data.syncDate);
                            PaymentSettingService.initPaymentSettings(response.data.Settings);
                            PluginSettingService.init(response.data.Plugins);
                            SyncService.loadAll();

                        } catch (e) {
                            console.log(e.message);
                        }

                        if (AuthService.isLoggedIn()) {
                            LanguageService.set(AuthService.getLanguage());
                            console.log("redirect");
                            $location.path("#/1");
                        }
                    })
                    .finally(function() {
                        $scope.loading = false; // Always execute this on both error and success
                    });
            };
            $scope.gotoRegistration = function() {
                console.log("gotoRegistration");
                $location.path("/register/" + ($scope.username || ""));
            };
            $scope.gotoPasswordRecovery = function() {
                console.log("gotoPasswordRecovery");
                $location.path("/recovery/" + ($scope.username || ""));
            };
            $scope.$watch(AuthService.isLoggedIn, function(value, oldValue) {
                if (!value && oldValue) {
                    console.log("Disconnect");
                }

                if (value) {
                    console.log("Connect");
                    $location.path("#/2");
                }
            }, true);
        }
    ])
    .controller("RegisterCtrl", [
        "$scope", "AuthService", "$location", "$http", "LanguageService", "FeedService", "SyncService", "PaymentSettingService", "$routeParams", "PluginSettingService",
        function ($scope, AuthService, $location, $http, LanguageService, FeedService, SyncService, PaymentSettingService, $routeParams, PluginSettingService) {
            var email = $routeParams.email;
            $scope.email = email || "";

            $scope.switchLang = function(lang) {
                LanguageService.set(lang);
            };

            $scope.currentLang = LanguageService.getCurrent();

            $scope.languages = LanguageService.getAll();

            $scope.loading = false;

            $scope.tryRegister = function() {
                console.log("register");
                $scope.loading = true;
                AuthService.register($scope.username, $scope.email, $scope.password, $scope.currentLang, $http)
                    .then(function(response) {
                        FeedService.initFeeds(response.data.FeedLents);
                        FeedService.initFeedItems(response.data.FeedItems);
                        SyncService.setSyncDate(response.data.syncDate);
                        PaymentSettingService.initPaymentSettings(response.data.Settings);
                        PluginSettingService.init(response.data.Plugins);
                        SyncService.loadAll();
                        if (AuthService.isLoggedIn()) {
                            console.log("redirect");
                            $location.path("#/1");
                        }
                    })
                    .finally(function() {
                        $scope.loading = false; // Always execute this on both error and success
                    });
            };
            $scope.gotoLogin = function() {
                console.log("gotoLogin");
                $location.path("/login/" + ($scope.email || ""));
            };
            $scope.$watch(AuthService.isLoggedIn, function(value, oldValue) {
                if (!value && oldValue) {
                    console.log("Disconnect");
                }

                if (value) {
                    console.log("Connect");
                    $location.path("#/2");
                }
            }, true);
        }
    ])
    .controller("RecoveryCtrl", [
        "$scope", "AuthService", "$location", "$http", "LanguageService", "NotificationService", "$translate", "$routeParams",
        function($scope, AuthService, $location, $http, LanguageService, NotificationService, $translate, $routeParams) {
            var email = $routeParams.email;
            $scope.email = email || "";

            $scope.switchLang = function(lang) {
                LanguageService.set(lang);
            };

            $scope.currentLang = LanguageService.getCurrent();

            $scope.languages = LanguageService.getAll();

            $scope.loading = false;

            $scope.tryRecovery = function() {
                console.log("recovery");
                $scope.loading = true;
                AuthService.recovery($scope.email, $http) 
                    .then(function(response) {
                        //show message
                        NotificationService.alert($translate.instant("Recovery_CheckMailbox"), function(feed) {
                            console.log("delete ", feed);
                            $scope.deleteFeedNoConfirm(feed);
                        }, $translate.instant("Recovery_Title"), $translate.instant("Ok"));

                        if (true) {
                            console.log("redirect");
                            $location.path("/login/" + ($scope.email || ""));
                        }
                    })
                    .finally(function() {
                        $scope.loading = false; // Always execute this on both error and success
                    });
            };
            $scope.gotoLogin = function() {
                console.log("gotoLogin");
                $location.path("/login/" + ($scope.email || ""));
            };
            $scope.$watch(AuthService.isLoggedIn, function(value, oldValue) {
                if (!value && oldValue) {
                    console.log("Disconnect");
                }

                if (value) {
                    console.log("Connect");
                    $location.path("#/2");
                }
            }, true);
        }
    ])
    .controller("ProfileCtrl", [
        "$scope", "AuthService", "$location", "$http", "LanguageService", "SyncService", function($scope, AuthService, $location, $http, LanguageService, SyncService) {
            $scope.username = AuthService.getUsername();
            $scope.email = AuthService.getEmail();

            $scope.logout = function() {
                console.log("logout");
                SyncService.clean();
                AuthService.logout($http).finally(function() {
                    $location.path("/login");
                });
            };
            $scope.changePassword = function() {
                console.log("changePassword");
                AuthService.changePassword($scope.oldPassword, $scope.newPassword, $http)
                    .then(function(response) {
                        if (!!response.data.result)
                            $location.path("/settings");
                    });
            };
        }
    ])
    .controller("LentaCtrl", [
        "$scope", "$routeParams", "$http", "FeedService", "$location", "SyncService", "sharedProperties",
        function($scope, $routeParams, $http, FeedService, $location, SyncService, sharedProperties) {
            var lentId = $routeParams.lentId;

            var getItems = function() {
                //var feedItems = FeedService.getFeedItems();
                switch (lentId) {
                case "unread":
                    return FeedService.getFeedItems().filter(function(element) {
                        return element.Readed === false;
                    });
                    break;
                case "fave":
                    return FeedService.getFeedItems().filter(function(element) {
                        return element.Starred === true;
                    });
                    break;
                default:
                    return FeedService.getFeedItems().filter(function(element) {
                        return element.LentaPublicId === lentId;
                    });
                    break;
                }
            };
            $scope.articles = getItems(lentId);

            var oldValue = -1;
            $scope.$watch(function () {
                var newValue = FeedService.getFeedItems().length;
                if (oldValue !== newValue) {
                    oldValue = newValue;
                    $scope.articles = getItems(lentId);
                }
                return newValue;
            }, function(oldValue, newValue) {
                $scope.articles = getItems(lentId);
            });


            $scope.filterFn = function(element) {
                switch (lentId) {
                case "unread":
                    return element.Readed === false;
                    break;
                case "fave":
                    return element.Starred === true;
                default:
                    return element.LentaPublicId === lentId;
                    break;
                }

                return false; // otherwise it won't be within the results
            };

            $scope.fave = function(feedItem) {
                //console.log("fave ", feedItem);
                FeedService.fave(feedItem);
                SyncService.fave(feedItem);
            };

            $scope.unfave = function(feedItem) {
                //console.log("unfave ", feedItem);
                FeedService.unfave(feedItem);
                SyncService.unfave(feedItem);
            };

            $scope.read = function(feedItem) {
                //console.log("read ", feedItem);
                FeedService.read(feedItem);
                SyncService.read(feedItem);
            };

            $scope.unread = function(feedItem) {
                //console.log("unread ", feedItem);
                FeedService.unread(feedItem);
                SyncService.unread(feedItem);
            };

            $scope.delete = function(feedItem) {
                //console.log("delete ", feedItem);
                FeedService.deleteItem(feedItem);
                SyncService.deleteItem(feedItem);
            };

            $scope.open = function(feedItem) {
                //console.log("open ", feedItem);
                $location.path("/article/" + feedItem.ArticlePublicId);
            };

            $scope.checkedItems = [];
            $scope.allSelected = false;
            $scope.toggleSeleted = function() {
                $scope.allSelected = !$scope.allSelected;

                /*Change the text*/
                if ($scope.allSelected) {
                    console.log("all selected");
                    $scope.filteredArticles.forEach(function(item) {
                        var exists = $scope.checkedItems.filter(function(datum) {
                            return datum.ArticlePublicId === item.ArticlePublicId;
                        });
                        if (!exists.length)
                            $scope.checkedItems.push(item);
                    });
                } else {
                    console.log("all deselected");
                    $scope.filteredArticles.forEach(function(item) {
                        for (var n = 0; n < $scope.checkedItems.length; n++) {
                            if ($scope.checkedItems[n].ArticlePublicId === item.ArticlePublicId) {
                                //console.log($scope.checkedItems[n].ArticlePublicId === item.ArticlePublicId, item.ArticlePublicId, $scope.checkedItems.length);
                                var removedObject = $scope.checkedItems.splice(n, 1);
                                //console.log(removedObject.ArticlePublicId === item.ArticlePublicId, item.ArticlePublicId, removedObject, $scope.checkedItems.length);
                                removedObject = null;
                                break;
                            }
                        }
                    });
                }
            };

            $scope.faveSelected = function() {
                console.log("fave Selected", $scope.checkedItems);
                $scope.checkedItems.forEach(function(item) { $scope.fave(item); });
            };

            $scope.unfaveSelected = function() {
                console.log("unfave Selected", $scope.checkedItems);
                $scope.checkedItems.forEach(function(item) { $scope.unfave(item); });
            };

            $scope.readSelected = function() {
                console.log("read Selected", $scope.checkedItems);
                $scope.checkedItems.forEach(function(item) { $scope.read(item); });
            };

            $scope.unreadSelected = function() {
                console.log("unread Selected", $scope.checkedItems);
                $scope.checkedItems.forEach(function(item) { $scope.unread(item); });
            };

            $scope.deleteSelected = function() {
                console.log("delete Selected", $scope.checkedItems);
                $scope.checkedItems.forEach(function(item) { $scope.delete(item); });
                $scope.checkedItems = [];
                $scope.articles = getItems(lentId);
            };

            $scope.checkListChanged = function() { //for mobile
                console.log("checkListChanged", $scope.checkedItems);
                sharedProperties.setLentaChecked($scope.checkedItems);
            };
        }
    ])
    .controller("StatusCtrl", [
        "$scope", "SyncService", "$timeout", "$location", "PaymentSettingService", function($scope, SyncService, $timeout, $location) {
            $scope.status = SyncService.getStatus;
            //SyncService.loadAll();

            $scope.timeToRedirect = 1;

            var promise;

            $scope.intervalFunction = function() {
                promise = $timeout(function() {
                    if ($scope.status.countAlreadyDownloaded >= $scope.status.countMustDownload)
                        //$scope.timeToRedirect--;
                        $location.path("/lenta/unread");


                    else
                        $scope.intervalFunction();
                }, 50);
            };

            // Kick off the interval
            $scope.intervalFunction();

            $scope.$on("$locationChangeStart", function() {
                console.log("$timeout cancel - $locationChangeStart");
                $timeout.cancel(promise);
            });
            $scope.$on("$destroy", function() {
                console.log("$timeout cancel - $destroy");
                $timeout.cancel(promise);
            });

        }
    ])
    .controller("ArticleCtrl", [
        "$scope", "$routeParams", "$http", "FeedService", "$location", "$sce", "$translate",
        function ($scope, $routeParams, $http, FeedService, $location, $sce, $translate) {
            var artId = $routeParams.artId;

            //console.log("show article", artId);

            $scope.ArticleInfo = FeedService.getFeedArticleInfo(artId);

            $scope.ArticleData = $sce.trustAsHtml("<div><div class='spinner'><div class='rect1'></div><div class='rect2'></div><div class='rect3'></div><div class='rect4'></div><div class='rect5'></div></div><div class='text-spinner'>"
                + $translate.instant("Loading") + "</div></div>");

            FeedService.getFeedArticleData(artId).then(function(data) {
                $scope.ArticleData = $sce.trustAsHtml(data);
            });

            $scope.$broadcast("showArticle", artId);
        }
    ])
    .controller("SettingsFeedCtrl", [
        "$scope", "FeedService", "$routeParams", "SyncService", "ArticleService", "NetworkStateService", "$timeout", "PaymentSettingService", "NotificationService", "$translate", "$location", 
        function ($scope, FeedService, $routeParams, SyncService, ArticleService, NetworkStateService, $timeout, PaymentSettingService, NotificationService, $translate, $location) {

            var feedId = $routeParams.lentId;
            $scope.editFeed = {};

            var init = function() {
                $scope.allFeeds = FeedService.getFeeds().filter(function(element) {
                    return element.LentaType !== "system";
                });

                $scope.usedFeeds = $scope.allFeeds.length;
                $scope.maxFeeds = PaymentSettingService.getMaxFeeds();

                $scope.isStoreAvailable = PaymentSettingService.isStoreAvailable();

                $scope.editMode = feedId !== null && feedId !== undefined;
                if ($scope.editMode) {
                    var elem = $scope.allFeeds.filter(function(element) {
                        return element.LentaPublicId === feedId;
                    })[0];
                    $scope.editFeed = {};
                    $scope.editFeed.LentaPublicId = elem.LentaPublicId;
                    $scope.editFeed.Title = elem.Title;
                    $scope.editFeed.Url = elem.Url;
                } else
                    $scope.editFeed = {}; //new feed
            };
            init();

            $scope.$on("feedUpdated", function(event, args) {
                //listen data from OnlWebOPMLCtrl in web-version 
                console.log("feedUpdated", FeedService.getFeeds());
                init(); //refresh ng-repeat
                $timeout(function() {
                    init();
                }, 1000); //wait NetworkStateService.sendData

            });

            $scope.isLoading = false;

            $scope.saveFeed = function(feed) {
                console.log("saveFeed ", feed);
                $scope.isLoading = true;

                if ($scope.editMode) {
                    FeedService.updateFeed(feed.LentaPublicId, feed.Title, feed.Url);
                    SyncService.updateFeed(feed.LentaPublicId, feed.Title, feed.Url);
                    $scope.isLoading = false;
                } else {
                    FeedService
                        .tryAddFeed(feed.Title, feed.Url)
                        .then(function(data) {
                            feedId = data.NewPulicId;
                            init();
                        })
                        .finally(function(data) {
                            $scope.isLoading = false;
                        });

                }
            };

            $scope.createFeedAction = function() {
                console.log("createFeed");
                //$location.path("/configfeeds/");
                feedId = null;
                init();
            };

            $scope.editFeedAction = function(feed) {
                console.log("editFeed", feed);
                //$location.path("/configfeeds/" + feed.LentaPublicId);
                feedId = feed.LentaPublicId;
                init();
            };

            $scope.deleteFeed = function(feed) {
                NotificationService.confirm($translate.instant("Feed_Delete") + " " + feed.Url + "?", function(feed) {
                    console.log("delete ", feed);
                    $scope.deleteFeedNoConfirm(feed);
                }, $translate.instant("Feed_Delete"), $translate.instant("Cancel"));
            };

            $scope.deleteFeedNoConfirm = function(feed) {
                console.log("delete no confirm", feed);
                $scope.isLoading = true;
                FeedService.deleteFeed(feed.LentaPublicId);
                SyncService.deleteFeed(feed.LentaPublicId);
                ArticleService.removeNotUsedArticles(FeedService.getFeedItems());
                NetworkStateService.sendData(true);
                SyncService.loadAll();
                $scope.isLoading = false;
                init();
            };


        }
    ])
    .controller("SettingsMainCtrl", [
        "$scope", "PluginSettingService",
        function ($scope, PluginSettingService) {
            $scope.plugins = PluginSettingService.get();
        }
    ])

     .controller("PluginCtrl", [
        "$scope", "PluginSettingService", "$routeParams", "PaymentSettingService",
        function ($scope, PluginSettingService, $routeParams, PaymentSettingService) {
            var pluginId = $routeParams.pluginId;
            $scope.plugin = PluginSettingService.getPlugin(pluginId);

            //$scope.storeIsAvailable = PaymentSettingService.isStoreAvailable();
            $scope.order = function (BuyId) {
                PaymentSettingService.order(BuyId);
            };
        }
     ])

    .controller("StoreCtrl", [
        "$scope", "PaymentSettingService",
        function ($scope, PaymentSettingService) {
            PaymentSettingService.refresh();

            $scope.isStoreAvailable = PaymentSettingService.isStoreAvailable();
            $scope.Items = PaymentSettingService.getItemForPayment();
            console.log("StoreCtrl ", $scope.Items);

            $scope.typestore = myprjplatformstore();
            $scope.MaxFeeds = PaymentSettingService.getMaxFeeds();
            $scope.RefreshFeeds = PaymentSettingService.getRefreshFeeds();

            $scope.order = function(key) {
                PaymentSettingService.order(key);
            }
        }
    ])

     .controller("PromocodeCtrl", [
        "$scope", "PromocodeService", "$location",
        function ($scope, PromocodeService, $location) {
            $scope.promocode = "";
            $scope.promocodeAdd = function () {
                var data = PromocodeService.addcode($scope.promocode);
                data.success(function (data) {
                    if(typeof (data.result) !== "undefined" && data.result === true)
                        $location.path("#/1");
                    //console.log("promo result ok ", data.result);
                });
            }
        }
     ])

;