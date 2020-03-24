console.log("get-client-data.js running");
var data = getData();

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request.message == "play")
        document.getElementById("netflix_party_play").click();

    if (request.message == "pause")
        document.getElementById("netflix_party_pause").click();

    if (request.message == "sync")
        sendResponse(getData());
});

function getData() {
    document.getElementById("netflix_party_sync").click();
    var current_time = document.getElementById("current_time").innerText;

    return {
        data: {
            time_stamp: current_time
        }
    }
}

data;