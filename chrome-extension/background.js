var _tab;
var port;
console.log("background.js started");

// Inject netflix-sync into netflix page using inject.js
chrome.webNavigation.onCompleted.addListener(function (e) {
    console.log('on completed');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        _tab = tabs[0];
        chrome.tabs.executeScript(_tab.id, { file: '/scripts/inject.js' }, function () {
            port = chrome.tabs.connect(_tab.id, {name: 'background-netflix-sync'});
            port.onMessage.addListener(function(message){
                // response from netflix page (data for popup)
                console.log(message);
                parseNetflixData(message);
            });
        });
    });
}, { url: [{ hostSuffix: 'netflix.com' }] });

// message to interact with the popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    sendResponse();
    processPopupMessage(message);
});

// apply details to our window from netflix
function parseNetflixData(response) {
    if (!response) { return; }
    time_sync_millis = response.data.seek_time;
    client_count = response.data.client_count;
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        views[i].document.getElementById('time_stamp').innerText = millisecondsToClient(time_sync_millis);
        views[i].document.getElementById('live_users').innerText = client_count;
    }
}

// convert milliseconds to user readable time
function millisecondsToClient(duration) {
    if (isNaN(duration))
        return duration;
    var milliseconds = parseInt((duration % 1000))
        , seconds = parseInt((duration / 1000) % 60)
        , minutes = parseInt((duration / (1000 * 60)) % 60)
        , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    return `${hours}:${minutes}:${seconds}`;
}

function processPopupMessage(message) {
    if (message.sender != 'local') {
        // send message to the server
        var data = dataModel(message.data);
        sendClientMessage(data);
        processSocketMessage(data);
    }

    // do something locally, eg. connect to server
    switch (message.data.action) {
        case "connect":
            setupWebSocket(message.data.params[0], message.data.params[1]);
            break;

        case "close":
            closeWebSocket();
            break;
    }
}

// Interact with netflix window
function sendNetflixMessage(data) {
    if (!chrome.tabs || !_tab) { return; }
    port.postMessage(data);
}

// WEBSOCKET
var socket;
var lastMessage;
var user_id;
var url;

function dataModel(_data) {
    return {
        sender: user_id,
        data: _data
    };
}

function setupWebSocket(groupId, live) {
    // return if were already connected
    if (socket && socket.readyState == 1) { return; }
    console.log("open socket");

    // connect
    var host = live ? "watch-hub.herokuapp.com" : "localhost:3000";
    socket = new WebSocket(`ws://${host}/${groupId}`, 'echo-protocol');

    socket.addEventListener('open', function (event) {
        console.log(`Connected to socket ${host} group -> ${groupId}`);
    });

    socket.addEventListener('message', function (event) {
        processSocketMessage(event.data);
    });

    socket.addEventListener('close', function (event) {
        console.log('disconnected from server');
    });
}

function sendClientMessage(data) {
    if (!socket || socket.readyState != 1) { return; }
    data = JSON.stringify(data);
    lastMessage = data;
    socket.send(data);
}

function processSocketMessage(message) {
    if (lastMessage == message) { return; }
    message = JSON.parse(message);

    if (message.sender == "server") {
        user_id = message.data.user_id;
        url = message.data.url;
        console.log(message);
        parseNetflixData(message);
        return;
    }

    console.log(message);
    sendNetflixMessage(message);
}

function closeWebSocket() {
    if (!socket || socket.readyState != 1) { return; }
    console.log("close socket");
    var resetUIMessage = {
        sender: "server",
        data: {
            client_count: 'Not Connected',
            seek_time: 'Not Connected'
        }
    }
    parseNetflixData(resetUIMessage);
    socket.close();
}