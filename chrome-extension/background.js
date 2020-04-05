var _tab;
var port;
var time_sync_millis;
var client_count;
var navigating;
var lastServerMessage;
var isConnected;
var portConnected = false;
var lastError;
var live = true;
var heartbeat;
var hostSync;
var coreEndpoint = live ? 'https://netflix-party-core.herokuapp.com' : 'http://localhost:3001';
var globalCallback = () => { };
console.log("background.js started");

// Inject netflix-sync into netflix page using inject.js
chrome.runtime.onInstalled.addListener(function () {
    setup();
});

chrome.tabs.onActivated.addListener(function () {
    setup();
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    if (info.status && info.status == "complete")
        setup();
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (!_tab) return;
    if (tabId == _tab.id) {
        console.log("disconnect port connection");
        portConnected = false;
        _tab = undefined;
        port = undefined;
    }
});

function setup() {
    getTab((tab) => {
        if (!tab) return;
        if (tab.url.indexOf("netflix.com") == -1)
            return;

        injectClientListener(tab, () => {
            createPortConnection();
        });
    });
}

function injectClientListener(tab, callback) {
    chrome.tabs.executeScript(tab.id, { file: '/scripts/get-client-data.js' }, function (result) {
        chrome.tabs.executeScript(tab.id, { file: '/scripts/inject.js' }, function (result) {
            callback();
        });
    });
}

function createPortConnection() {
    setTimeout(() => {
        port = chrome.tabs.connect(_tab.id, { name: 'background-netflix-sync' });
        portConnected = true;
        port.onMessage.addListener(function (message) {
            // response from netflix page (data for popup)
            parseNetflixData(message);
            if (globalCallback)
                globalCallback();
        });
    }, 10);
}

function getTab(callback) {
    chrome.tabs.query({ url: "https://www.netflix.com/*" }, function (tabs) {
        if (!tabs || tabs.length == 0) return;
        if (tabs[0].url.indexOf("netflix.com") == -1) { return; }
        _tab = tabs[0];
        callback(_tab);
    });
}

// message to interact with the popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    sendResponse();
    processPopupMessage(message);
    setPopupScreen(isConnected);
});

// apply details to our window from netflix
function parseNetflixData(response) {
    if (!response) { return; }
    time_sync_millis = response.data.seek_time;
    client_count = response.data.client_count;
    applyNetflixData(response, false);
}

// apply details to our window from netflix
function applyNetflixData(response, force) {
    if (!response) return;
    if (response.data.user_id != user_id && !force) return;
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        if (response.data.seek_time != undefined)
            views[i].document.getElementById('time_stamp').innerText = millisecondsToClient(response.data.seek_time);
        if (response.data.client_count != undefined)
            views[i].document.getElementById('live_users').innerText = response.data.client_count;

        views[i].document.getElementById('is_host').innerText = response.data.isHost;
        views[i].document.getElementById('watch_url').innerText = response.data.url;
        views[i].document.getElementById('user_id').innerText = response.data.user_id;

        //disable play and pause if not host
        views[i].document.getElementById('play').style.display = response.data.isHost ? 'block' : 'none';
        views[i].document.getElementById('pause').style.display = response.data.isHost ? 'block' : 'none';

        //disable sync if is host
        // views[i].document.getElementById('sync').style.display = response.data.isHost ? 'none' : 'block';
    }
}

function setPopupScreen(connected) {
    isConnected = connected;
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        views[i].document.getElementById('connection_container').style.display = connected ? 'none' : 'block';
        views[i].document.getElementById('message_container').style.display = connected ? 'block' : 'none';
        views[i].document.getElementById('status_icon').style.color = connected ? 'lime' : 'red';
        views[i].document.getElementById('group_id').disabled = connected;
    }
}

function setPopupError(error) {
    var lastError = error;
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        views[i].document.getElementById('error_tag').innerText = error;
    }
    if (!error) return;
    setTimeout(() => {
        if (error == lastError)
            setPopupError("");
    }, 3000);
}

function setPopupLoading(loading) {
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        views[i].document.getElementById('loading_tag').innerText = loading ? "Connecting" : "";
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
    setup();

    if (message.sender != 'local') {
        // send message to the server
        var data = dataModel(message.data);
        sendNetflixMessage(data);
        globalCallback = () => {
            data.data.seek_time = time_sync_millis;
            sendClientMessage(data);
            globalCallback = () => { };
        };
        if (!portConnected)
            globalCallback();

        return;
    }

    // do something locally, eg. connect to server
    var result;
    applyNetflixData(lastServerMessage);
    switch (message.data.action) {
        case "connect":
            if (portConnected)
                port.postMessage({});
            setupWebSocket(message.data.params.groupId,
                message.data.params.host,
                message.data.params.live);
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

    if (portConnected)
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
        setPopupError('Already connected');
        return;
    }

    if (isHost && !_tab) {
        setPopupError('No netflix page found.');
        return;
    }

    setPopupLoading(true);
    // find which server to send the request to
    const http = new XMLHttpRequest();
    const url = `${coreEndpoint}/${groupId}`;
    http.open("GET", url);
    http.send();
    http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var resp = JSON.parse(http.responseText);
            connectToSocket(resp.server, groupId, isHost, live);
        }
    };
}

function connectToSocket(address, groupId, isHost, live) {
    // get url for netflix watching link
    var watchUrl = "";
    if (isHost) {
        if (!_tab) {
            setPopupError('No netflix page found.');
            return;
        }
        netflixURL = new URL(_tab.url);
        var watchId = netflixURL.pathname.replace('/watch', '');
        var trackId = netflixURL.searchParams.get("trackId");
        watchUrl = `${watchId}?trackId=${trackId}`;
        if (!trackId) {
            setPopupError('Not a valid netflix page.');
            return;
        }
    } else {
        console.log('No tab or not host');
    }

    // connect
    var host = live ? address : "localhost:3000";
    socket = new WebSocket(`ws://${host}/?groupId=${groupId}&watchUrl=${watchUrl}&seek_time=${time_sync_millis}`, 'echo-protocol');

    socket.addEventListener('open', function (event) {
        console.log(`Connected to socket ${host} group -> ${groupId}`);
        setPopupScreen(true);
        setPopupError("");
        setPopupLoading(false);
        heartbeat = setInterval(() => {
            socket.send("heartbeat");
        }, 60000);
    });

    socket.addEventListener('message', function (event) {
        processSocketMessage(event.data, false);
    });

    socket.addEventListener('error', function (event) {
        setPopupError("Couldn't connect to group.");
        resetHeartbeat();
    });

    socket.addEventListener('close', function (event) {
        resetHeartbeat();
        setPopupLoading(false);
        if (event.code != 1006) { setPopupError("Disconnected from group"); }
        console.log('disconnected from server');
        setPopupScreen(false);
        setTimeout(() => {
            resetData();
        }, 100);
    });
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
        lastServerMessage = message;
        user_id = user_id ? user_id : message.data.user_id;
        url = url ? url : message.data.url;
        applyNetflixData(message, false);
        if (navigating) { return; }

        if (!_tab || _tab.url.indexOf(url) == -1) {
            console.log("navigate to page");
            navigating = true;
            chrome.tabs.create({ url: `https://www.netflix.com/watch${url}` }, function (tab) {
                navigating = false;
                _tab = tab;
            });
        }

        if (!message.data.isHost) {
            var syncTimeMessage = new dataModel({
                action: 'sync_time',
                seek_time: message.data.seek_time
            });
            sendNetflixMessage(syncTimeMessage);
        } else {
            // is host
            if (!hostSync) {
                hostSync = setInterval(() => {
                    // sync time
                    var data = dataModel({});
                    globalCallback = () => {
                        data.data.action = "set_sync_time";
                        data.data.seek_time = time_sync_millis;
                        sendClientMessage(data);
                        globalCallback = () => { };
                    };
                    sendNetflixMessage({});
                }, 2000);
            }
        }
        return;
    }

    sendNetflixMessage(message);
}

function resetHeartbeat() {
    clearInterval(heartbeat);
    clearInterval(hostSync);
    heartbeat = undefined;
    hostSync = undefined;
}

function closeWebSocket() {
    if (!socket || socket.readyState != 1) {
        console.log('not connected');
        return;
    }
    console.log("close socket");
    setTimeout(() => {
        resetData();
    }, 100);
    socket.close();
}

function resetData() {
    var resetUIMessage = {
        sender: "server",
        data: {
            client_count: 'Not Connected',
            seek_time: 'Not Connected',
            isHost: 'Not Connected',
            url: 'Not Connected',
            user_id: 'Not Connected'
        }
    }
    user_id = undefined;
    url = undefined;
    if (port)
        port.disconnect();

    portConnected = false;
    applyNetflixData(resetUIMessage, true);
}