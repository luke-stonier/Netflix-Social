var player = null;
var lastMessage;
setup();

function setup() {
    getPlayer();
    createGetDataButton();
    createSyncButton();
    createPlayButton();
    createPauseButton();
    createMessageBubble();
    createDisconnectButton();
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
    setMessage(`Host ${play ? 'started' : 'paused'} the video.`);
}

function getPlayer() {
    if (!window.netflix) { return; }
    var videoPlayer = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
    player = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
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
    getPlayer();
    if (!player) { console.log("no player attached"); return; }
    var playTime = player.getCurrentTime();
    setHiddenDetails('current_time', playTime);
}

function syncTime(time) {
    if (!player) { console.log("no player attached"); return; }
    player.seek(time);
}

function setMessage(message) {
    lastMessage = message;
    if (message == "") {
        document.getElementById('netflix_party_message_bubble').style.display="none";
    } else {
        document.getElementById('netflix_party_message_bubble').style.display="block";
    }

    document.getElementById('netflix_party_message_bubble').innerText = message;
    if (!message) return;
    setTimeout(() => {
        if (message == lastMessage) {
            setMessage("");
        }
    }, 3000);
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

function createMessageBubble() {
    var x = document.getElementById("netflix_party_message_bubble");
    if (x) return;
    x = document.createElement("p");
    x.id = "netflix_party_message_bubble";
    x.style.color = "white";
    x.style.zIndex = 10000;
    x.style.position = "absolute";
    x.style.textAlign = "center";
    x.style.fontSize = "20px";
    x.style.background = "rgba(255,255,255,0.42)";
    x.style.padding = "5px";
    x.style.borderRadius = "8px";
    x.style.top = "90%";
    x.style.left = "0";
    x.style.right = "0";
    x.style.width = "40%";
    x.style.margin = "auto";
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

function createDisconnectButton() {
    var x = document.getElementById("netflix_party_disconnect");
    if (x) return;
    x = document.createElement("button");
    x.id = "netflix_party_disconnect";
    x.style.display = "none";
    document.body.append(x);
    document.getElementById("netflix_party_disconnect").addEventListener("click", () => {
        play_pause(false);
        setMessage("Disconnected from party");
    });
}