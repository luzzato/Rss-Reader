(function () {
  
    var ratchetCss = document.createElement('link');
    ratchetCss.setAttribute("rel", "stylesheet");
    ratchetCss.setAttribute("type", "text/css");
    ratchetCss.setAttribute("href", "Content/ratchet-theme-ios.css");
    document.head.appendChild(ratchetCss);

    var appCss = document.createElement('link');
    appCss.setAttribute("rel", "stylesheet");
    appCss.setAttribute("type", "text/css");
    appCss.setAttribute("href", "css/app-ios.css");
    document.head.appendChild(appCss);
}());