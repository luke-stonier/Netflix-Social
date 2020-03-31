var _tab;
var hasInjected = false;
var time_sync_millis = 0;
var live = true;

window.onload = function () {
    setup();
};

function _dataModel(local) {
    return {
        sender: local ? 'local' : 'remote',
        data: {
            time: Date.now(),
            params: {}
        }
    };
}

function isLive() {
    return live;
}

function setup() {
    var wakeMessage = _dataModel(true);
    wakeMessage.data.action = "wake";
    sendMessageToBackgroundScript(wakeMessage);

    document.getElementById("play").addEventListener("click", () => {
        var message = _dataModel(false);
        message.data.action = "play";
        sendMessageToBackgroundScript(message);
    });

    document.getElementById("pause").addEventListener("click", () => {
        var message = _dataModel(false);
        message.data.action = "pause";
        sendMessageToBackgroundScript(message);
    });

    document.getElementById("host").addEventListener("click", () => {
        var groupId = document.getElementById("group_id").value;

        var message = _dataModel(true);
        message.data.action = "connect";
        message.data.params.groupId = groupId;
        message.data.params.host = true;
        message.data.params.live = isLive();    // debug
        sendMessageToBackgroundScript(message);
    });

    document.getElementById("join").addEventListener("click", () => {
        var groupId = document.getElementById("group_id").value;

        var message = _dataModel(true);
        message.data.action = "connect";
        message.data.params.groupId = groupId;
        message.data.params.host = false;
        message.data.params.live = isLive();    // debug
        sendMessageToBackgroundScript(message);
    });

    // add sync method here (Return last message)

    document.getElementById("close").addEventListener("click", () => {
        var message = _dataModel(true);
        message.data.action = "close";
        sendMessageToBackgroundScript(message);
    })
}

function sendMessageToBackgroundScript(message) {
    chrome.runtime.sendMessage(message, (resp) => {
        if(resp)
            console.log(resp);
    });
}