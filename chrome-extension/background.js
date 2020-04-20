// OPEN NETFLIX WINDOW WHEN POPUP OPENS
// INJECT CONTENT SCRIPTS
// CONNECT TO CONTENT SCRIPTS THROUGH PORT
// ACCEPT MESSAGES FROM POPUP
// CONNECT TO SERVER
// ACCEPT REQUESTS FROM SERVER

var popup_view;

chrome.runtime.onInstalled.addListener(function () {

});

chrome.tabs.onActivated.addListener(function () {

});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    // if (info.status == "loading")
    // if (info.status && info.status == "complete")
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    getPopupView();
    console.log("STARTED");
});


function getPopupView(response) {
    if (!response) return;
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
            popup_view = views[i];
    }
}