console.log("netflix-interacion.js");
var portConnected = false;

function dataModel() {
    return { data: {} };
}

chrome.runtime.onConnect.addListener((port) => {
    portConnected = true;
    if (port.onMessage.hasListeners()) { return; }
    port.onDisconnect.addListener((port) => {
        portConnected = false;
    });
    port.onMessage.addListener(function (message) {
        if (!message) return;

        if (message.data.action == "get_sync_time")
            returnCurrentTime((responseObject) => port.postMessage(responseObject));

        if (message.data.action == "play_video")
            PlayVideo()

        if (message.data.action == "pause_video")
            PauseVideo();
        
        if (message.data.action == "seek_time")
            console.log(`sync to time ${message.data.seek_time}`);
    });
});

function PlayVideo() {
    var playButton = document.getElementById("netflix_social_play");
    if (!playButton) return;
    playButton.click();
}

function PauseVideo() {
    var pauseButton = document.getElementById("netflix_social_pause");
    if (!pauseButton) return;
    pauseButton.click();
}

function returnCurrentTime(callback) {
    var playbackTime = document.getElementById("netflix_social_playback_time");
    if (!playbackTime) return;
    playbackTime.click();
    var responseObject = dataModel();
    responseObject.data.action = "return_sync_time";
    responseObject.data.sync_time = playbackTime.innerText;
    callback(responseObject);
}