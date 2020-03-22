var player = null;
setup();

function setup() {
    window.addEventListener('locationchange', function(){
        console.log('location changed!');
    });
    window.addEventListener('popstate',()=>{
        window.dispatchEvent(new Event('locationchange'))
    });
    console.log("embedded");
}

function getPlayer() {
    var videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
    player = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
    console.log(player ? 'Got Player' : 'No player found');
}

function getCurrentPlayTime() {
    if (!player) { console.error("no player attached"); return; }
    console.log(player.getCurrentTime());
}