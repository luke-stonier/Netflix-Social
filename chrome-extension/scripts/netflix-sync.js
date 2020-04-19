console.log("NETFLIX-SYNC INJECT");
var player = null;
var lastMessage;
var connected = false;
setup();

function setup() {
    getPlayer();
    createGetDataButton();
    createSyncButton();
    createPlayButton();
    createPauseButton();
    createDisconnectButton();
    createConnectButton();
    createMessageBox();
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


function setHiddenDetails(id, text) {
    var x = document.getElementById(id);
    if (!x)
        x = document.createElement("div");
    x.id = id;
    x.innerText = text;
    x.style.display = "none";
    document.body.append(x);
}

function createMessageBox() {
    if (document.getElementsByClassName("nf-kb-nav-wrapper").length == 0)
        return;

    var wrapper = document.getElementsByClassName("nf-kb-nav-wrapper")[0];
    wrapper.style.display = "flex";
    var container = document.getElementsByClassName("sizing-wrapper")[0];
    container.style.right = "15%";

    var x = document.getElementById("netflix_party_message_box");
    if (x) return;
    x = document.createElement("div");
    x.id = "netflix_party_message_box";
    x.style.position = "absolute";
    x.style.top = "0px";
    x.style.bottom = "0px";
    x.style.right = "0px";
    x.style.left = "85%";
    x.style.zIndex = 1;
    x.style.overflow = "hidden";
    x.style.display = "flex";
    x.style.flexDirection = "column";
    x.style.background = "#1a1a1a";
    x.innerHTML = `<div style="width: 100%;"><img style="width: 100%;" src="https://netflix-social.com/images/promo_large.png" /></div>`;
    wrapper.append(x);

    var container = document.createElement("div");
    container.id = "netflix_party_chat_container";
    container.style.width = "100%";
    container.style.display = "flex";
    container.style.flex = "1 1";
    container.style.flexDirection = "column";
    container.style.overflowY = "auto";
    container.style.overflowX = "hidden";
    container.innerHTML = `<div id="netflix_party_chat" style="width: 100%; flex: 1 1;">
    </div>`;

    var message_input = document.createElement("div");
    message_input.innerHTML = `<div style="width: 100%; display: flex; justify-content: space-between;">
        <input id="netflix_party_chat_message" type="text" placeholder="Your message..." style="width: 100%; font-size: 15px; border: none; padding: 10px; background: rgb(228, 228, 228); color: black;" />
        <button disabled id="netflix_party_send_message_button" style="position: relative;
        text-align: center;
        background: #db4d48;
        border: none;
        color: white;
        outline: none;
        padding: 5px 10px;
        margin: 0;">SEND</button>
    </div>`;

    x.append(container);
    x.append(message_input);

    document.getElementById("netflix_party_send_message_button").addEventListener("click", (event) => {
        var x = document.getElementById("netflix_party_message_sync");
        var y = document.getElementById("netflix_party_chat_message");
        if (!x || !y) return;
        if (y.value == "" || !y.value) {
            // show error.
            return;
        }
        x.innerText = y.value;
        y.value = "";
        x.click();
    });
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

function createConnectButton() {
    var x = document.getElementById("netflix_party_connect");
    if (x) return;
    x = document.createElement("button");
    x.id = "netflix_party_connect";
    x.style.display = "none";
    document.body.append(x);
    document.getElementById("netflix_party_connect").addEventListener("click", () => {
        console.log("connected");
        document.getElementById("netflix_party_send_message_button").disabled = false;
        document.getElementById("netflix_party_send_message_button").style.opacity = 1;
        connected = true;
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
        document.getElementById("netflix_party_send_message_button").disabled = true;
        document.getElementById("netflix_party_send_message_button").style.opacity = 0.5;
        connected = false;
    });
}