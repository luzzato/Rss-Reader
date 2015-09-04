"use strict";

angular.module("myApp.mySharedElements", [
    //"ngCordova.plugins.file" plugin unstalled, ng-wrapper unlinked
    "LocalForageModule"
])
.constant("baseUrl", "http://synrss.net/api") // http://synrss.net
.constant("validateUrl", "http://synrss.net/validate")
.config(['$localForageProvider', function ($localForageProvider) {
    localforage.defineDriver(window.cordovaSQLiteDriver).then(function() {
        $localForageProvider.config({
            driver: window.cordovaSQLiteDriver._driver,
            name: 'myApp' // name of the database and prefix for your data
        });
    });
    
}]);

angular.module("myApp" /*, []  must only specify the dependency-array on the first call to module as you would otherwise redefine the module's dependency list instead of adding additional parts to an existing module. 
    http://henriquat.re/modularizing-angularjs/modularizing-angular-applications/modularizing-angular-applications.html
*/)
    .factory("ArticleServiceWebStorage", [
        "$localForage", function($localForage) {
            var keyPrefix = "art-";
            //console.log("device ArticleServiceWebStorage");
            return {
                save: function(publicId, data) {
                    var fullkey = keyPrefix + publicId;
                    //console.log("art save " + fullkey + " data " + data);
                    //console.log("art save " + fullkey);
                    //var ua2b64 = btoa(String.fromCharCode.apply(null, data));
                    //var ua2b64 = btoa(_arrayBufferToBase64(data));
                    var ua2b64 = (_arrayBufferToBase64(data));
                    //console.log("art save " + fullkey + " ua2b64 " + ua2b64);
                    return $localForage.setItem(fullkey, ua2b64); //promise
                },
                getArticle: function(publicId) {
                    var fullkey = keyPrefix + publicId;
                    //console.log("art getArticle " +fullkey);
                    return $localForage.getItem(fullkey).then(function (data) {
                        if (data == null)
                            return "";
                        //console.log("art data " +fullkey + " data " +data);
                        //var b642ua = new Uint8Array(atob(data).split("").map(function(c) {return c.charCodeAt(0);}));
                        var b642ua = new Uint8Array((data).split("").map(function(c) {return c.charCodeAt(0);}));
                        //console.log("art data " + fullkey + " " + b642ua);
                        //console.log("art data " + fullkey + " ok " );
                        return b642ua;
                    }, function(err) {
                        console.log("art data " +fullkey + " fail " +err);
                    }).finally(function() {
                        //console.log("art data " + fullkey + " finally ");
                    }); //promise
                },
                clean: function() {
                    $localForage.iterate(function(value, key) {
                        if (key.lastIndexOf(keyPrefix, 0) === 0)
                            $localForage.removeItem(key);
                    });

                },
                countAlreadyDownloaded: function() {
                    return $localForage.keys().then(function(keys) {
                        return (keys || []).filter(function(item) { return item.lastIndexOf(keyPrefix, 0) === 0 }).length;
                    });
                },
                removeNotUsedArticles: function(feedItems) {
                    return $localForage.keys().then(function(keys) {
                        var existArticles = (keys || []).filter(function(item) { return item.lastIndexOf(keyPrefix, 0) === 0 });
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
                                $localForage.removeItem(item);
                        });
                    });
                }
            };
        }
    ])
    /*.factory("ArticleServiceMobileStorage", [
        "$cordovaFile", "NotificationService",
        function($cordovaFile, NotificationService) {
            var keyPrefix = "art-";
            var path = cordova.file.dataDirectory;
            //http://ngcordova.com/docs/plugins/file/
            return {
                save: function(publicId, data) {
                    var fullkey = keyPrefix + publicId;

                    //var ua2b64 = btoa(String.fromCharCode.apply(null, data));
                    var ua2b64 = btoa(_arrayBufferToBase64(data));

                    return $cordovaFile.writeFile(path, fullkey, ua2b64, true)
                        .then(function(success) {
                            // success
                        }, function(error) {
                            NotificationService.alert("Error: file save ", function() {}, "Alert", "Close");
                        });
                },
                getArticle: function(publicId) {
                    var fullkey = keyPrefix + publicId;

                    return $cordovaFile.readAsText(path, fullkey, ua2b64, true)
                        .then(function(data) {
                            // success
                            var b642ua = new Uint8Array(atob(data).split("").map(function(c) {
                                return c.charCodeAt(0);
                            }));
                            return b642ua;
                        }, function(error) {
                            NotificationService.alert("Error: file load ", function() {}, "Alert", "Close");
                        });
                    //promise
                },
                clean: function() {
                    $cordovaFile.removeRecursively(cordova.file.dataDirectory, "")
                        .then(function(success) {
                            // success
                        }, function(error) {
                            // error
                            console.log("error clear files - " + error);
                        });

                },
                countAlreadyDownloaded: function () {
                    //not implemented
                    var deferred = $q.defer();
                    deferred.resolve(-1);
                    return deferred.promise;
                },
                removeNotUsedArticles: function (feedItems) {
                    //not implemented
                    var deferred = $q.defer();
                    deferred.resolve(-1);
                    return deferred.promise;
                }
            };
        }
    ])*/
    .controller("OnlMobOPMLCtrl", [
        "$scope", "AuthService", "FeedService", "baseUrl", "RestExeptionHelper", "NetworkStateService",
        function($scope, AuthService, FeedService, baseUrl, RestExeptionHelper, NetworkStateService) {

        }
    ])
    .directive("scrollup", function($document) {
        return {
            restrict: "A",
            link: function(scope, elm, attrs) {
                elm.bind("click", function(mouseEvent) {
                    console.log("scrollup");

// Maybe abstract this out in an animation service:
                    // Ofcourse you can replace all this with the jQ 
                    // syntax you have above if you are using jQ
                    function scrollToTop(element, to, duration) {
                        if (duration < 0) return;
                        var difference = to - element.scrollTop;
                        var perTick = difference / duration * 10;

                        setTimeout(function() {
                            element.scrollTop = element.scrollTop + perTick;
                            scrollToTop(element, to, duration - 10);
                        }, 10);
                    }

                    // then just add dependency and call it
                    var obj = angular.element(document.querySelectorAll(".content"));
                    for (var i = 0; i < obj.length; i++) {
                        //expected 1 item
                        scrollToTop(obj[i], 0, 400);
                    }
                });
            }
        };
    })
    .directive("actionSheetFeed", [
        "$translate", function($translate) {
            return {
                restrict: "A",
                scope: {
                    feeditem: "=",
                    feededit: "&",
                    feeddelete: "&"
                },
                link: function(scope, element, attrs) {
                    element.bind("click", function() {
                        console.log("actionSheetFeed ", scope);

                        function scrollToTop(element, to, duration) {
                            if (duration < 0) return;
                            var difference = to - element.scrollTop;
                            var perTick = difference / duration * 10;

                            setTimeout(function() {
                                element.scrollTop = element.scrollTop + perTick;
                                scrollToTop(element, to, duration - 10);
                            }, 10);
                        }

                        var options = {
                            //'androidTheme': window.plugins.actionsheet.ANDROID_THEMES.THEME_HOLO_LIGHT, // default is THEME_TRADITIONAL
                            'title': $translate.instant("Feed_Action") + scope.feeditem.Url + "?",
                            'addDestructiveButtonWithLabel': $translate.instant("Feed_Delete"), //always index = 1, only one button
                            'buttonLabels': [$translate.instant("Feed_Edit")], //index++
                            'addCancelButtonWithLabel': $translate.instant("Cancel") //always last, index++
                            ,
                            'androidEnableCancelButton': true // default false
                            ,
                            'winphoneEnableCancelButton': true // default false
                        };

                        var callback = function(buttonIndex) {
                            setTimeout(function() {
                                // like other Cordova plugins (prompt, confirm) the buttonIndex is 1-based (first button is index 1)
                                console.log("button index clicked: " + buttonIndex);
                                switch (buttonIndex) {
                                case 1:
                                    //delete
                                    scope.feeddelete(); //call with saved param from template
                                    break;
                                case 2:
                                    //edit
                                    scope.feededit();

                                    // then just add dependency and call it
                                    var obj = angular.element(document.querySelectorAll(".content"));
                                    for (var i = 0; i < obj.length; i++) {
                                        //expected 1 item
                                        scrollToTop(obj[i], 0, 400);
                                    }
                                    break;
                                case 3:
                                    //cancel
                                    break;

                                default:
                                    alert("actionSheetFeed button index clicked: " + buttonIndex);
                                }
                            });
                        };

                        if (window.plugins.actionsheet)
                            window.plugins.actionsheet.show(options, callback);
                        else
                            alert("actionsheet plugin not supported");

                    });
                }
            };
        }
    ])
    .directive("actionSheetLenta", [
        "$translate", "FeedService", "SyncService", function($translate, FeedService, SyncService) {
            return {
                restrict: "A",
                scope: {
                    selecteditems: "&"
                },
                link: function(scope, element, attrs) {
                    element.bind("click", function() {
                        console.log("actionSheetLenta ", scope);
                        //todo
                        var options = {
                            //'androidTheme': window.plugins.actionsheet.ANDROID_THEMES.THEME_HOLO_LIGHT, // default is THEME_TRADITIONAL
                            'title': $translate.instant("Lenta_Action_1") + scope.selecteditems().length + $translate.instant("Lenta_Action_2"),
                            'addDestructiveButtonWithLabel': $translate.instant("Lenta_Mark_Delete"), //always index = 1, only one button
                            'buttonLabels': [
                                $translate.instant("Lenta_Mark_Unread"),
                                $translate.instant("Lenta_Mark_Read"),
                                $translate.instant("Lenta_Mark_Unfave"),
                                $translate.instant("Lenta_Mark_Fave")
                            ], //index++
                            'addCancelButtonWithLabel': $translate.instant("Cancel") //always last, index++
                            ,
                            'androidEnableCancelButton': true // default false
                            ,
                            'winphoneEnableCancelButton': true // default false
                        };

                        var callback = function(buttonIndex) {
                            setTimeout(function() {
                                // like other Cordova plugins (prompt, confirm) the buttonIndex is 1-based (first button is index 1)
                                console.log("button index clicked: " + buttonIndex);
                                switch (buttonIndex) {
                                case 1:
                                    //delete
                                    console.log("delete actionSheetLenta", scope.selecteditems());
                                    scope.selecteditems().forEach(function(item) {
                                        FeedService.deleteItem(item);
                                        SyncService.deleteItem(item);
                                    });
                                    break;
                                case 2:
                                    //Lenta_Mark_Unread
                                    console.log("unread actionSheetLenta", scope.selecteditems());
                                    scope.selecteditems().forEach(function(item) {
                                        FeedService.unread(item);
                                        SyncService.unread(item);
                                    });
                                    break;
                                case 3:
                                    //Lenta_Mark_Read
                                    console.log("read actionSheetLenta", scope.selecteditems());
                                    scope.selecteditems().forEach(function(item) {
                                        FeedService.read(item);
                                        SyncService.read(item);
                                    });
                                    break;
                                case 4:
                                    //Lenta_Mark_Unfave
                                    console.log("unfave actionSheetLenta", scope.selecteditems());
                                    scope.selecteditems().forEach(function(item) {
                                        FeedService.unfave(item);
                                        SyncService.unfave(item);
                                    });
                                    break;
                                case 5:
                                    //Lenta_Mark_Fave
                                    console.log("fave actionSheetLenta", scope.selecteditems());
                                    scope.selecteditems().forEach(function(item) {
                                        FeedService.fave(item);
                                        SyncService.fave(item);
                                    });
                                    break;
                                case 6:
                                    //cancel
                                    break;

                                default:
                                    alert("actionSheetLenta button index clicked: " + buttonIndex);
                                }
                            });
                        };

                        if (window.plugins.actionsheet)
                            window.plugins.actionsheet.show(options, callback);
                        else
                            alert("actionsheet plugin not supported");

                    });
                }
            };
        }
    ]);;