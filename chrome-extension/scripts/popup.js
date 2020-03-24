var _tab;
var hasInjected = false;
var time_sync_millis = 0;

window.onload = function() {
    setup();
};

function clientSyncInject() {
    chrome.tabs.executeScript(_tab.id, { file: '/scripts/get-client-data.js' }, (result) => {
        parseServerData(result[0])
    });
}

function setup() {
    var port = chrome.extension.connect({
        name: "Sample Communication"
    });
    port.onMessage.addListener(function(msg) {
        clientSyncInject();
    });

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
        port.postMessage("startup");
        _tab = tabs[0];
    });
}

function sendMessage(state) {
    chrome.tabs.sendMessage(_tab.id, {message: state}, function(response) {
        parseServerData(response);
    });
}

function parseServerData(response) {
    console.log(response);
    if (!response) { return; }
    time_sync_millis = response.data.time_stamp;
    document.getElementById('time_stamp').innerText = millisecondsToClient(time_sync_millis);
}

function millisecondsToClient(duration) {
    var milliseconds = parseInt((duration%1000))
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    return `${hours}:${minutes}:${seconds}`;
}