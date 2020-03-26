var _tab;
var hasInjected = false;
var time_sync_millis = 0;
var live = false;

window.onload = function () {
    setup();
};

function _dataModel(local) {
    return {
        sender: local ? 'local' : 'remote',
        data: {}
    };
}

function setup() {
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

    document.getElementById("sync").addEventListener("click", () => {
        var message = _dataModel(false);
        message.data.action = "sync";
        sendMessageToBackgroundScript(message);
    });

    document.getElementById("connect").addEventListener("click", () => {
        var groupId = document.getElementById("group_id").value;

        var message = _dataModel(true);
        message.data.action = "connect";
        message.data.params = [];
        message.data.params[0] = groupId;
        message.data.params[1] = live;
        sendMessageToBackgroundScript(message);
    });

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