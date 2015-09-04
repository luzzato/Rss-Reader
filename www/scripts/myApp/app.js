"use strict";

angular.module("myApp", [
  "ngRoute", "snap", "pascalprecht.translate", "angularMoment", "checklist-model",
  "myApp.filters",
  "myApp.services",
  "myApp.directives",
  "myApp.controllers",
  "myApp.mySharedElements"
])
.constant("paymentAliases", [
                "FeedAdd10M",
                "FeedAdd25M",
                "FeedAdd50M",
                "FeedUpd10Min",
                "FeedUpd1H",
                "FeedUpd3H",
                "RssExport2L",
            ])
.config(["$httpProvider", function($httpProvider) {  
    $httpProvider.interceptors.push("authInterceptor");
}])
.constant("AvailableLanguages", {
    "En": "English"
, "Ru": "Русский"
, "De": "Deutsch"
, "Fr": "Français"
, "Ja": "日本語"
, "Pt": "Português"
, "Zh": "中文"
}) //check file in utf-8 w/o BOM; En, Ru - case sensetive and must equal as in server enum LanguageAvailable
.constant("ClientVer", "v0.9:MecheleGlaucoLuzzato") 
.config(["snapRemoteProvider", function (snapRemoteProvider) {
    snapRemoteProvider.globalOptions = {
        disable: "right",
        minDragDistance: 50
        // ... others options https://github.com/jakiestfu/Snap.js#settings-and-defaults
    }
}])
.run(["$rootScope", "snapRemote", function ($rootScope, snapRemote) {
    snapRemote.getSnapper().then(function (snapper) {
        window.Snapper = snapper; //for debug

        //snapper.settings({
        //    hyperextensible: true,
        //    resistance: 0.5,
        //    flickThreshold: 50,
        //    transitionSpeed: 0.3,
        //    easing: "ease",
        //    maxPosition: 266,
        //    minPosition: -266,
        //    tapToClose: true,
        //    slideIntent: 40,
        //    minDragDistance: 5
        //});

        snapper.settings({
            hyperextensible: true,
            resistance: 0.5,
            flickThreshold: 50,
            transitionSpeed: 0.8,
            easing: "cubic-bezier(0.175, 0.885, 0.320, 1.275)",
            maxPosition: 266,
            minPosition: -266,
            tapToClose: true,
            slideIntent: 40,
            minDragDistance: 5,
            addBodyClasses: true,
        });
    });
}])

.config(["$routeProvider", function($routeProvider) {
  $routeProvider.when("/login/:email?", { templateUrl: myprjplatformprefix+"partials/login.html", controller: "LoginCtrl" });  
  $routeProvider.when("/register/:email?", { templateUrl: myprjplatformprefix + "partials/register.html", controller: "RegisterCtrl" });
  $routeProvider.when("/recovery/:email?", { templateUrl: myprjplatformprefix + "partials/recovery.html", controller: "RecoveryCtrl" });
  $routeProvider.when("/main", { templateUrl: myprjplatformprefix+"partials/main.html", controller: "StatusCtrl" });  
  $routeProvider.when("/profile", { templateUrl: myprjplatformprefix+"partials/profile.html", controller: "ProfileCtrl" });
  $routeProvider.when("/lenta/:lentId", { templateUrl: myprjplatformprefix+"partials/lenta.html", controller: "LentaCtrl" });
  $routeProvider.when("/article/:artId", { templateUrl: myprjplatformprefix+"partials/article.html", controller: "ArticleCtrl" });
  $routeProvider.when("/configfeeds/:lentId?", { templateUrl: myprjplatformprefix+"partials/feeds.html", controller: "SettingsFeedCtrl" });
  $routeProvider.when("/settings", { templateUrl: myprjplatformprefix + "partials/settings.html", controller: "SettingsMainCtrl" });
  $routeProvider.when("/buy", { templateUrl: myprjplatformprefix + "partials/buy.html", controller: "StoreCtrl" });
  $routeProvider.when("/plugin/:pluginId", { templateUrl: myprjplatformprefix + "partials/plugin.html", controller: "PluginCtrl" });
  $routeProvider.when("/promocode", { templateUrl: myprjplatformprefix + "partials/promocode.html", controller: "PromocodeCtrl" });
  $routeProvider.otherwise({ redirectTo: "/main" });
}])
.run(["$rootScope", "$location", "AuthService", "LanguageService", function ($rootScope, $location, AuthService, LanguageService) {
    $rootScope.$on("$routeChangeStart", function (next, current) {

        if (AuthService.isLoggedIn() === false
            //&& $location.path() !== "/login"
            && !($location.path().startsWith("/login"))
            && !($location.path().startsWith("/register"))
            && !($location.path().startsWith("/recovery"))
            ) {
            console.log("DENY ", AuthService.getUser(), "   path ", $location.path());
            next.preventDefault();
            $location.path("/login");
        }
        else {
            //console.log('ALLOW ', AuthService.getUser(), '   path ', $location.path());
        }
        //console.log('getSessionId ', AuthService.getSessionId());
    });

    if (AuthService.isLoggedIn()) {
        LanguageService.set(AuthService.getLanguage());
    };
}])
.config(["$translateProvider","AvailableLanguages", function ($translateProvider, AvailableLanguages) {

    // http://plnkr.co/edit/n6MEMU
    $translateProvider.useLoader("RRLangLoader", {});
 
    $translateProvider.preferredLanguage("En");
    $translateProvider.fallbackLanguage("En");
    $translateProvider.registerAvailableLanguageKeys(Object.keys(AvailableLanguages),
        {
        'en' : "En", 'en_GB': "En", 'en_US': "En", 'en_AU': "En", 'en_CA': "En", 'en_IN': "En", 'en_IE': "En", 'en_MT': "En", 'en_NZ': "En", 'en_PH': "En", 'en_SG': "En", 'en_ZA': "En", 'en_UK': "En",
        'en-*': "En",
        'ru-*': "Ru", 'ru': "Ru",
        'de-*': "De", 'de': "De",
        'fr-*': "Fr", 'fr': "Fr",
        'ja-*': "Ja", 'ja': "Ja",
        'pt-*': "Pt", 'pt': "Pt",
        'zh-*': "Zh", 'zh': "Zh"
    });

}])

;


if (typeof String.prototype.startsWith != 'function') {
    // see below for better implementation!
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) === 0;
    };
}