var _tab;
var hasInjected = false;
var time_sync_millis = 0;
var live = true;

window.onload = function () {
    setup();
};

function dataModel(local) {
    return {
        sender: local ? 'local' : 'remote',
        data: {
            params: {
            }
        }
    };
}

function isLive() {
    return live;
}

function setup() {
    document.getElementById('host').disabled=true;
    document.getElementById('join').disabled=true;

    chrome.management.getSelf((res) => {
        var isDev = false;
        var versionId = `Version ${res.version}`;
        if (res.installType == "development") {
            isDev = true;
            document.getElementById('host').disabled=false;
            document.getElementById('join').disabled=false;
            versionId += `-dev`;
        }
        document.getElementById('version-view').innerText = versionId;
        if (isDev) return;
        const http = new XMLHttpRequest();
        const url = "https://netflix-social.com/version.php";
        http.open("GET", url);
        http.send();
        http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var version = http.responseText;
                if (version != versionId) {
                    document.getElementById('version-view').style.color="red";
                    document.getElementById('version-view').innerText = `${versionId} (NOT UP TO DATE)`;
                    document.getElementById('host').disabled=true;
                    document.getElementById('join').disabled=true;
                } else {
                    document.getElementById('version-view').style.color="green";
                    document.getElementById('version-view').innerText = `${versionId} (UP TO DATE)`;
                    document.getElementById('host').disabled=false;
                    document.getElementById('join').disabled=false;
                }
            }
        };
    });

    var wakeMessage = dataModel(true);
    wakeMessage.data.action = "wake";
    sendMessageToBackgroundScript(wakeMessage);

    document.getElementById("play").addEventListener("click", () => {
        var message = dataModel(false);
        message.data.action = "play";
        sendMessageToBackgroundScript(message);
    });

    document.getElementById("pause").addEventListener("click", () => {
        var message = dataModel(false);
        message.data.action = "pause";
        sendMessageToBackgroundScript(message);
    });

    document.getElementById("host").addEventListener("click", () => {
        var groupId = document.getElementById("group_id").value;
        var displayName = document.getElementById("display_name").value;

        var message = dataModel(true);
        message.data.action = "connect";
        message.data.params.groupId = groupId;
        message.data.params.displayName = displayName;
        message.data.params.host = true;
        message.data.params.live = isLive();    // debug
        sendMessageToBackgroundScript(message);
    });

    document.getElementById("join").addEventListener("click", () => {
        var groupId = document.getElementById("group_id").value;
        var displayName = document.getElementById("display_name").value;

        var message = dataModel(true);
        message.data.action = "connect";
        message.data.params.groupId = groupId;
        message.data.params.displayName = displayName;
        message.data.params.host = false;
        message.data.params.live = isLive();    // debug
        sendMessageToBackgroundScript(message);
    });

    document.getElementById("sync").addEventListener("click", () => {
        var message = dataModel(false);
        message.data.action = "sync";
        sendMessageToBackgroundScript(message);
    });

    document.getElementById("close").addEventListener("click", () => {
        var message = dataModel(true);
        message.data.action = "close";
        sendMessageToBackgroundScript(message);
    });

    document.getElementById("support_us").addEventListener("click", () => {
        window.open("https://www.patreon.com/netflixsocial", '_blank');
    });
}

function sendMessageToBackgroundScript(message) {
    chrome.runtime.sendMessage(message, (resp) => {
        if(resp)
            console.log(resp);
    });
}