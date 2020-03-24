var activeInject = false;
setupListener();

chrome.webNavigation.onCompleted.addListener( function (e) {
    activeInject = false;
    // inject our netflix-sync
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        _tab = tabs[0];
        chrome.tabs.executeScript(_tab.id, { file: '/scripts/inject.js' }, () => {
            activeInject = true;
        });
    });
}, {url: [{hostSuffix : 'netflix.com'}]});


function setupListener() {
    chrome.extension.onConnect.addListener(function(port) {
        port.onMessage.addListener(function(msg) {
            port.postMessage({active: activeInject});
            if (msg == "startup") { activeInject = true; }
        });
    });
}