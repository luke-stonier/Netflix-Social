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
            if (message.data.action == "play")
                embedded_play.click();
        
            if (message.data.action == "pause")
                embedded_pause.click();

            if (message.data.action == "sync") {}

            if(message.data.action == "sync_time") {
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
    var watching = document.getElementsByClassName("ellipsize-text");
    var seriesName;
    var episodeIndicator;
    var episodeName;
    if (watching && watching.length > 0) {
        watching = watching[0].children;
        seriesName = watching[0].innerText;
        episodeIndicator = watching[1].innerText;
        episodeName = watching[2].innerText;
    } else {
        console.log("couldn't find watching info");
    }

    if (!embedded_get_data) { return; }
    embedded_get_data.click();
    var current_time = document.getElementById("current_time").innerText;

    return {
        data: {
            seek_time: current_time,
            seriesName: seriesName,
            episodeIndicator: episodeIndicator,
            episodeName: episodeName
        }
    };
}

data;