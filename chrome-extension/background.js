var _tab;
var port;
var portConnection = false;
console.log("background.js started");

// Inject netflix-sync into netflix page using inject.js
chrome.tabs.onActivated.addListener(function (e) {
    getTab((tab) => {
        if (tab.url.indexOf("netflix.com") == -1)
            return;

        injectClientListener(tab, () => {
            if (!portConnection)
                createPortConnection();
        });
    });
});

function injectClientListener(tab, callback) {
    chrome.tabs.executeScript(tab.id, { file: '/scripts/get-client-data.js' }, function (result) {
        chrome.tabs.executeScript(tab.id, { file: '/scripts/inject.js' }, function (result) {
            callback();
        });
    });
}

function createPortConnection() {
    setTimeout(() => {
        console.log('create port connection');
        port = chrome.tabs.connect(_tab.id, { name: 'background-netflix-sync' });
        port.onMessage.addListener(function (message) {
            // response from netflix page (data for popup)
            parseNetflixData(message);
        });
        portConnection = true;
    }, 10);
}

function getTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        _tab = tabs[0];
        callback(_tab);
    });
}

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
        if (time_sync_millis != undefined)
            views[i].document.getElementById('time_stamp').innerText = millisecondsToClient(time_sync_millis);
        if (client_count != undefined)
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
        processSocketMessage(JSON.stringify(data));
        sendClientMessage(data);
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
    if (!chrome.tabs || !_tab) {
        console.log(`${chrome.tabs ? 'chrome tabs exist' : 'no chrome tabs object'} | ${_tab ? 'tab exists' : 'no tab object'}`);
        return;
    }

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
    if (socket && socket.readyState == 1) {
        console.log('already connected');
        return;
    }
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
        user_id = user_id | message.data.user_id;
        url = url | message.data.url;
        parseNetflixData(message);
        return;
    }

    sendNetflixMessage(message);
}

function closeWebSocket() {
    if (!socket || socket.readyState != 1) {
        console.log('not connected');
        return;
    }
    console.log("close socket");
    var resetUIMessage = {
        sender: "server",
        data: {
            client_count: 'Not Connected',
            seek_time: 'Not Connected'
        }
    }
    user_id = undefined;
    url = undefined;
    parseNetflixData(resetUIMessage);
    socket.close();
}