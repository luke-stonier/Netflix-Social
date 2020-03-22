var _tab;
window.onload = function() {
    setup();
};

function setup() {
    document.getElementById("play").addEventListener("click", () => {
        sendMessage("play")
    });

    document.getElementById("pause").addEventListener("click", () => {
        sendMessage("pause")
    });

    document.getElementById("sync").addEventListener("click", () => {
        sendMessage("sync")
    });

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        _tab = tabs[0];
        chrome.tabs.executeScript(_tab.id, { file: '/scripts/inject.js' });
        chrome.tabs.executeScript(_tab.id, { file: '/scripts/get-client-data.js' });
    });
}

function sendMessage(state) {
    chrome.tabs.sendMessage(_tab.id, {message: state}, function(response) {
        console.log(response);
    });
}