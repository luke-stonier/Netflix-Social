console.log("get-client-data.js running");
var data = getData();

//var port = chrome.runtime.connect({name: 'background-netflix-sync'});
chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(function(message){
        if (!message) { return; }

        var embedded_play = document.getElementById("netflix_party_play");
        var embedded_pause = document.getElementById("netflix_party_pause");
        if (!embedded_play || !embedded_pause) { return; }
        if (message.data) {
            if (message.data.action == "play")
                embedded_play.click();
        
            if (message.data.action == "pause")
                embedded_pause.click();
        }

        port.postMessage(getData());
    });
});

function getData() {
    var embedded_sync = document.getElementById("netflix_party_sync");
    if (!embedded_sync) { return; }
    embedded_sync.click();
    var current_time = document.getElementById("current_time").innerText;

    return {
        data: {
            seek_time: current_time
        }
    }
}

data;