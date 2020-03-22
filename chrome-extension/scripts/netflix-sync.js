// this syncs the data between the client and server

var player = null;
setup();

function setup() {
    getPlayer();
    getCurrentPlayTime();
}

function getPlayer() {
    var videoPlayer = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
    player = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
    console.log(player ? 'Got Player' : 'No player found');
}

function getVideoDetails() {
    var i = 0;
    Object.keys(netflix.falcorCache.videos).forEach((element) => {
        i++;
        var x = netflix.falcorCache.videos[element];
        console.log(x);
        setHiddenDetails('detail_' + i, x.title.value);
    });
}

function getCurrentPlayTime() {
    if (!player) { console.error("no player attached"); setHiddenDetails('current_time', player.getCurrentTime()); return; }
    setHiddenDetails('current_time', player.getCurrentTime());
}

function syncTime(time) {
    if (!player) { console.error("no player attached"); return; }
    player.seek(time);
}

function setHiddenDetails(id, text) {
    var x = document.getElementById(id);
    if (!x)
        x = document.createElement("div");
    x.id = id;
    x.innerText = text;
    x.style.display = "none";
    document.body.append(x);
}