(function () {
    // Append the bind() polyfill
    var scriptElem = document.createElement('script');
    scriptElem.setAttribute('src', 'scripts/android2.3-jscompat.js');
    if (document.body) {
        document.body.appendChild(scriptElem);
    } else {
        document.head.appendChild(scriptElem);
    }

    var ratchetCss = document.createElement('link');
    ratchetCss.setAttribute("rel", "stylesheet");
    ratchetCss.setAttribute("type", "text/css");
    ratchetCss.setAttribute("href", "Content/ratchet-theme-android.css");
    document.head.appendChild(ratchetCss);

    var appCss = document.createElement('link');
    appCss.setAttribute("rel", "stylesheet");
    appCss.setAttribute("type", "text/css");
    appCss.setAttribute("href", "css/app-android.css");
    document.head.appendChild(appCss);
}());