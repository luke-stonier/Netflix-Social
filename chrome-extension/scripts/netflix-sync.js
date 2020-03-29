console.log("netflix-sync.js running");
var player = null;
setup();

function setup() {
    getPlayer();
    createGetDataButton();
    createSyncButton();
    createPlayButton();
    createPauseButton();
    if (!player) { console.log("no player"); return; }
    getData();
}

function getData() {
    if (!player) { getPlayer(); }
    if (!player) { return; }
    getCurrentPlayTime();
}

function play_pause(play) {
    if (!player) { getPlayer(); }
    if (!player) { return; }
    play ? player.play() : player.pause();
}

function getPlayer() {
    if (!window.netflix) { return; }
    var videoPlayer = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
    player = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
    console.log(player ? 'Got Player' : 'No player found');
}

function getVideoDetails() {
    var i = 0;
    Object.keys(netflix.falcorCache.videos).forEach((element) => {
        i++;
        var x = netflix.falcorCache.videos[element];
        setHiddenDetails('detail_' + i, x.title.value);
    });
}

function getCurrentPlayTime() {
    if (!player) { console.log("no player attached"); return; }
    setHiddenDetails('current_time', player.getCurrentTime());
}

function syncTime(time) {
    if (!player) { console.log("no player attached"); return; }
    console.log(`sync time to ${time} (current: ${player.getCurrentTime()})`);
    player.seek(time);
    console.log(`sync time to ${time} (new: ${player.getCurrentTime()})`);
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

function createGetDataButton() {
    var x = document.getElementById("netflix_party_get_data");
    if (x) return;
    x = document.createElement("button");
    x.id = "netflix_party_get_data";
    x.style.display = "none";
    document.body.append(x);
    document.getElementById("netflix_party_get_data").addEventListener("click", () => {
        getData();
    });
}

function createSyncButton() {
    var x = document.getElementById("netflix_party_sync");
    if (x) return;
    x = document.createElement("button");
    x.id = "netflix_party_sync";
    x.innerText = "0";
    x.style.display = "none";
    document.body.append(x);
    document.getElementById("netflix_party_sync").addEventListener("click", () => {
        var time = document.getElementById("netflix_party_sync").innerText;
        syncTime(time);
    });
}

function createPlayButton() {
    var x = document.getElementById("netflix_party_play");
    if (x) return;
    x = document.createElement("button");
    x.id = "netflix_party_play";
    x.style.display = "none";
    document.body.append(x);
    document.getElementById("netflix_party_play").addEventListener("click", () => {
        var timeoutPlay = document.getElementsByClassName("nf-big-play-pause-secondary");
        if (timeoutPlay) {
            timeoutPlay = timeoutPlay[0];
            if (timeoutPlay) {
                timeoutPlay.click();
            }
        }
        play_pause(true);
    });
}

function createPauseButton() {
    var x = document.getElementById("netflix_party_pause");
    if (x) return;
    x = document.createElement("button");
    x.id = "netflix_party_pause";
    x.style.display = "none";
    document.body.append(x);
    document.getElementById("netflix_party_pause").addEventListener("click", () => {
        play_pause(false);
    });
}