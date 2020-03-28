var _tab;
var port;
var time_sync_millis;
var client_count;
var globalCallback = () => {};
console.log("background.js started");

// Inject netflix-sync into netflix page using inject.js
chrome.runtime.onInstalled.addListener(function() {
    setup();
});

chrome.tabs.onActivated.addListener(function () {
    setup();
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
    if(info.status && info.status == "complete")
        setup();
});

function setup() {
    getTab((tab) => {
        if (tab.url.indexOf("netflix.com") == -1)
            return;

        injectClientListener(tab, () => {
            createPortConnection();
        });
    });
}

function injectClientListener(tab, callback) {
    console.log("inject client scripts");
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
            if (globalCallback)
                globalCallback();
        });
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
    if (response.data.user_id != user_id) return;
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

        views[i].document.getElementById('is_host').innerText = response.data.isHost;
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
        sendNetflixMessage(data);
        globalCallback = () => {
            data.data.seek_time = time_sync_millis;
            sendClientMessage(data);
            globalCallback = () => {};
        };
        if (!port)
            globalCallback();

        return;
    }

    // do something locally, eg. connect to server
    var result;
    switch (message.data.action) {
        case "wake":
            setup();
            break;

        case "connect":
            if (port)
                port.postMessage({});
            result = setupWebSocket(message.data.params.groupId,
                message.data.params.host,
                message.data.params.live);
            break;

        case "close":
            closeWebSocket();
            break;
    }

    console.log(result);
}

// Interact with netflix window
function sendNetflixMessage(data) {
    if (!chrome.tabs || !_tab) {
        console.log(`${chrome.tabs ? 'chrome tabs exist' : 'no chrome tabs object'} | ${_tab ? 'tab exists' : 'no tab object'}`);
        return;
    }

    if(port)
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

function setupWebSocket(groupId, isHost, live) {
    // return if were already connected
    if (socket && socket.readyState == 1) {
        return { code: 1, message: 'Already connected' };
    }

    // get url for netflix watching link
    var watchUrl;
    if (_tab && isHost) {
        console.log(_tab.url);
        netflixURL = new URL(_tab.url);
        var trackId = netflixURL.searchParams.get("trackId");
        watchUrl = `${netflixURL.pathname}?trackId=${trackId}`;
        if (!trackId) return { code: 1, message: 'Not a valid netflix page' };
    } else {
        console.log('No tab or not host');
    }

    // connect
    var host = live ? "watch-hub.herokuapp.com" : "localhost:3000";
    socket = new WebSocket(`ws://${host}/?groupId=${groupId}&watchUrl=${watchUrl}`, 'echo-protocol');

    socket.addEventListener('open', function (event) {
        console.log(`Connected to socket ${host} group -> ${groupId}`);
    });

    socket.addEventListener('message', function (event) {
        processSocketMessage(event.data, false);
    });

    socket.addEventListener('close', function (event) {
        console.log('disconnected from server');
    });
    return { code: 0, message: 'success' };
}

function sendClientMessage(data) {
    if (!socket || socket.readyState != 1) { return; }
    data = JSON.stringify(data);
    lastMessage = data;
    socket.send(data);
}

function processSocketMessage(message) {
    message = JSON.parse(message);
    if (message.sender == user_id) { return; }

    if (message.sender == "server") {
        console.log(message);
        user_id = user_id ? user_id : message.data.user_id;
        url = url ? url : message.data.url;
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
            seek_time: 'Not Connected',
            isHost: 'Not Connected'
        }
    }
    user_id = undefined;
    url = undefined;
    parseNetflixData(resetUIMessage);
    socket.close();
}