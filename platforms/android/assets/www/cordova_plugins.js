cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/nl.x-services.plugins.actionsheet/www/ActionSheet.js",
        "id": "nl.x-services.plugins.actionsheet.ActionSheet",
        "clobbers": [
            "window.plugins.actionsheet"
        ]
    },
    {
        "file": "plugins/cc.fovea.cordova.purchase/www/store-android.js",
        "id": "cc.fovea.cordova.purchase.InAppBillingPlugin",
        "clobbers": [
            "store"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.statusbar/www/statusbar.js",
        "id": "org.apache.cordova.statusbar.statusbar",
        "clobbers": [
            "window.StatusBar"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.dialogs/www/notification.js",
        "id": "org.apache.cordova.dialogs.notification",
        "merges": [
            "navigator.notification"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.dialogs/www/android/notification.js",
        "id": "org.apache.cordova.dialogs.notification_android",
        "merges": [
            "navigator.notification"
        ]
    },
    {
        "file": "plugins/io.litehelpers.cordova.sqlite/www/SQLitePlugin.js",
        "id": "io.litehelpers.cordova.sqlite.SQLitePlugin",
        "clobbers": [
            "SQLitePlugin"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "nl.x-services.plugins.actionsheet": "1.1.7",
    "cc.fovea.cordova.purchase": "3.10.1",
    "org.apache.cordova.statusbar": "0.1.10",
    "org.apache.cordova.dialogs": "0.3.0",
    "io.litehelpers.cordova.sqlite": "0.7.10-pre"
}
// BOTTOM OF METADATA
});