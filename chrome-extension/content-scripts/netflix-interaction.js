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
            PlayVideo(message)

        if (message.data.action == "pause_video")
            PauseVideo(message);

        if (message.data.action == "sync_time")
            seekToPoint(message.data.sync_time);
    });
});

function PlayVideo(message) {
    if (!message.data.isSender)
        seekToPoint(message.data.sync_time);

    setTimeout(() => {
        var playButton = document.getElementById("netflix_social_play");
        if (playButton)
            playButton.click();
    }, 250);
}

function PauseVideo(message) {
    if (!message.data.isSender)
        seekToPoint(message.data.sync_time);

    setTimeout(() => {
        var pauseButton = document.getElementById("netflix_social_pause");
        if (pauseButton)
            pauseButton.click();
    }, 250);
}

function seekToPoint(time) {
    var sync_button = document.getElementById("netflix_social_seek");
    if (!sync_button) return;
    sync_button.innerText = time;
    sync_button.click();
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