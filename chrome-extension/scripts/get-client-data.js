console.log("get-client-data.js running");
var data = getData();

//var port = chrome.runtime.connect({name: 'background-netflix-sync'});
chrome.runtime.onConnect.addListener((port) => {
    if(port.onMessage.hasListeners()) { return; }
    port.onMessage.addListener(function(message) {
        if (!message) { return; }

        var embedded_play = document.getElementById("netflix_party_play");
        var embedded_pause = document.getElementById("netflix_party_pause");
        if (!embedded_play || !embedded_pause) { return; }
        if (message.data) {
            console.log(message.data.action);
            if (message.data.action == "play")
                embedded_play.click();
        
            if (message.data.action == "pause")
                embedded_pause.click();

            if (message.data.action == "sync") {
                // for now nada
            }

            if(message.data.action == "sync_time") {
                console.log(message);
                set_sync_time(message.data.seek_time);
            }
        }

        port.postMessage(getData());
    });
});

function set_sync_time(time) {
    document.getElementById("netflix_party_sync").innerText = time;
    document.getElementById("netflix_party_sync").click();
}

function getData() {
    var embedded_get_data = document.getElementById("netflix_party_get_data");
    if (!embedded_get_data) { return; }
    embedded_get_data.click();
    var current_time = document.getElementById("current_time").innerText;

    return {
        data: {
            seek_time: current_time
        }
    };
}

data;