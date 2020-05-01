console.log("netflix-sync.js");

var player;

var playback_id = "netflix_social_playback_time";
var play_id = "netflix_social_play";
var pause_id = "netflix_social_pause";
var seek_id = "netflix_social_seek";
var loading_id = "netflix_social_loading";

setup();

function setup() {
    getPlayer();
    createInteractableComponents();
}

function getPlayer() {
    if (!window.netflix) { console.log("no netflix api"); return; }
    var videoPlayer = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
    player = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
    var warning = document.getElementById("netflix_social_player_warning");
    if (player) {
        if (!warning) return;
        warning.parentNode.removeChild(warning);
        return;
    }
    warning = document.createElement("p");
    warning.id = "netflix_social_player_warning";
    warning.innerText = "Netflix player couldnt be found, please try refreshing the window";
    warning.style.color="red";
    warning.style.fontSize="15px";
    warning.style.zIndex="1000";
    warning.style.position="absolute";
    document.body.append(warning);
}

function createInteractableComponents() {
    createPlaybackTimeComponent();
    createSeekComponent();
    createPlayComponent();
    createPauseComponent();
    createIsLoadingComponent();

    AddListeners();
}

function AddListeners() {
    // remove old listeners
    document.getElementById(play_id).removeEventListener("click", PlayVideo);
    document.getElementById(pause_id).removeEventListener("click", PauseVideo);
    document.getElementById(playback_id).removeEventListener("click", GetPlaybackTime);
    document.getElementById(seek_id).removeEventListener("click", SeekToPoint);
    document.getElementById(loading_id).removeEventListener("click", checkLoading);

    // add new listeners
    document.getElementById(play_id).addEventListener("click", PlayVideo);
    document.getElementById(pause_id).addEventListener("click", PauseVideo);
    document.getElementById(playback_id).addEventListener("click", GetPlaybackTime);
    document.getElementById(seek_id).addEventListener("click", SeekToPoint);
    document.getElementById(loading_id).addEventListener("click", checkLoading);
}

function PlayVideo() {
    getPlayer();
    var timeoutPlay = document.getElementsByClassName("nf-big-play-pause-secondary");
    if (timeoutPlay)
        timeoutPlay = timeoutPlay[0];
    if (timeoutPlay)
        timeoutPlay.click();

    getPlayer();
    if (!player) return;
    player.play();
}

function PauseVideo() {
    getPlayer();
    if (!player) return;
    player.pause();
}

function GetPlaybackTime() {
    getPlayer();
    if (!player) return;
    var comp = document.getElementById(playback_id);
    comp.innerText = player.getCurrentTime();
}

function SeekToPoint() {
    getPlayer();
    if (!player) return;
    var comp = document.getElementById(seek_id);
    player.seek(comp.innerText);
}

function checkLoading() {
    getPlayer();
    var isLoading = true;
    if (!player)
        isLoading = true;
     else
        isLoading = player.isLoading();
    document.getElementById(loading_id).innerText = isLoading;
}

function createPlayComponent() {
    var comp = document.getElementById(play_id);
    if (comp) return;
    comp = document.createElement("button");
    comp.style.display = "none";
    comp.id = play_id;
    document.body.append(comp);
}

function createPauseComponent() {
    var comp = document.getElementById(pause_id);
    if (comp) return;
    comp = document.createElement("button");
    comp.style.display = "none";
    comp.id = pause_id;
    document.body.append(comp);
}

function createPlaybackTimeComponent() {
    var comp = document.getElementById(playback_id);
    if (comp) return;
    comp = document.createElement("button");
    comp.style.display = "none";
    comp.id = playback_id;
    document.body.append(comp);
}

function createSeekComponent() {
    var comp = document.getElementById(seek_id);
    if (comp) return;
    comp = document.createElement("button");
    comp.style.display = "none";
    comp.id = seek_id;
    document.body.append(comp);
}

function createIsLoadingComponent() {
    var comp = document.getElementById(loading_id);
    if (comp) return;
    comp = document.createElement("button");
    comp.style.display = "none";
    comp.id = loading_id;
    document.body.append(comp);
}