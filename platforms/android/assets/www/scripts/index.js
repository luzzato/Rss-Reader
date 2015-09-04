// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
    //"use strict";
    console.log("cordova");

    function onDeviceReady() {
        //alert(statusbar);
        //alert(statusbar);
        //alert("onDeviceReady");
        // Handle the Cordova pause and resume events
        
        
        // Cordova has been loaded. Perform any initialization that requires Cordova here.
        angular.bootstrap(document, ["myApp"]);

        if (window.StatusBar) {
            //alert("A");
            window.StatusBar.backgroundColorByHexString("#3c8dbc");
            window.StatusBar.overlaysWebView(false);
            window.StatusBar.styleBlackTranslucent();
            //alert("B");
        } else {
            //alert("C");
        }
        
        //if (typeof (navigator.notification) === "undefined") { //in iOS  fail
        //    alert("notification fail");
        //}

        try {
            document.body.className += " " + this.cordova.platformId;
        } catch (e) {
            console.error(e);
        }

    };


    function onVolumeUpKeyDown() {
        //alert("Volume Up button pressed");
        console.log("onVolumeUpKeyDown ", document.getElementsByClassName("content")[0].scrollTop);

        //var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        document.getElementsByClassName("content")[0].scrollTop -= 250;
    }
    function onVolumeDownKeyDown()
    {
        //alert("Volume Down button pressed");
        console.log("onVolumeDownKeyDown ", document.getElementsByClassName("content")[0].scrollTop);

        document.getElementsByClassName("content")[0].scrollTop += 250;
    }
    
    

    function onPause() {
        // This application has been suspended. Save application state here.
    };

    function onResume() {
        // This application has been reactivated. Restore application state here.
    };

    document.addEventListener("deviceready", onDeviceReady.bind(this), false);
    document.addEventListener("volumedownbutton", onVolumeDownKeyDown, false);
    document.addEventListener("volumeupbutton", onVolumeUpKeyDown, false);
    document.addEventListener('pause', onPause.bind(this), false);
    document.addEventListener('resume', onResume.bind(this), false);

} )();

var myprjplatformprefix = "";

var myprjplatformstore = function () {
    if ("android" === cordova.platformId)
        return "Google";
    if ("ios" === cordova.platformId)
        return "Apple";
}