var _tab;
var port;
var time_sync_millis;
var client_count;
var navigating = false;
var _navigating = false;
var lastServerMessage;
var isConnected;
var portConnected = false;
var lastError;
var live = true;
var hostSync;
var currentGroup = "";
var displayName = "";
var hasWoken = false;
var createdTabId;
var coreEndpoint = live ? 'https://netflix-party-core.herokuapp.com' : 'http://localhost:3001';
var globalCallback = () => { };
console.log("background.js started");

// Inject netflix-sync into netflix page using inject.js
chrome.runtime.onInstalled.addListener(function () {
    setup(() => { });
});

chrome.tabs.onActivated.addListener(function () {
    setup(() => { });
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    if (info.status == "loading" && tab.url.indexOf("netflix.com") > -1) { navigating = true; }
    if (info.status && info.status == "complete") {
        if (isConnected) {
            var openChatMessage = dataModel({
                action: 'open-chat',
            });
            sendNetflixMessage(openChatMessage);
        }

        setup(() => {
            if (tab.id == createdTabId)
                navigating = false;
        });
    }
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (!_tab) return;
    if (tabId == _tab.id) {
        closeWebSocket();
        resetHeartbeat();
        console.log("disconnect port connection");
        portConnected = false;
        _tab = undefined;
        port = undefined;
    }
});

function setup(callback) {
    if (!hasWoken) return;

    getTab((tab) => {
        if (!tab) return;
        if (tab.url.indexOf("netflix.com") == -1)
            return;

        injectClientListener(tab, () => {
            createPortConnection();
            callback();
        });
    });
}

function injectClientListener(tab, callback) {
    chrome.tabs.executeScript(tab.id, { file: '/scripts/get-client-data.js' }, function (result) {
        chrome.tabs.executeScript(tab.id, { file: '/scripts/inject.js' }, function (result) {
            chrome.tabs.insertCSS(tab.id, { file: 'netflix-social.css' }, function (result) {
                callback();
            });
        });
    });
}

function createPortConnection() {
    setTimeout(() => {
        port = chrome.tabs.connect(_tab.id, { name: 'background-netflix-sync' });
        portConnected = true;
        port.onMessage.addListener(function (message) {
            if (message.action == "message") {
                sendGroupChatMessage(message.message);
                return;
            }
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
    hasWoken = true;
    setup(() => { });
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
    setDataForPopup(response);
}

createWatchingName = (seriesName, episodeName) => `${seriesName} - ${episodeName}`;

function setDataForPopup(response) {
    return;
    if (!response) return;
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        if (response.data.seriesName) {
            views[i].document.getElementById('currently_watching').innerText = createWatchingName(response.data.seriesName,
                response.data.episodeName);
        }
    }
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
        views[i].document.getElementById('group_id').value = currentGroup;
        views[i].document.getElementById('display_name').value = displayName;

        //disable play and pause if not host
        views[i].document.getElementById('play').style.display = response.data.isHost ? 'block' : 'none';
        views[i].document.getElementById('pause').style.display = response.data.isHost ? 'block' : 'none';

        //disable sync if is host
        views[i].document.getElementById('sync').style.display = response.data.isHost ? 'none' : 'block';
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
        views[i].document.getElementById('display_name').disabled = connected;

        views[i].document.getElementById('group_id').value = currentGroup;
        views[i].document.getElementById('display_name').value = displayName;
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
    }, 5000);
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
    setup(() => { });
    openNetflixIfNotOpen('https://www.netflix.com/browse');

    if (message.sender != 'local') {
        // send message to the server        
        var data = dataModel(message.data);
        globalCallback = () => {
            data.data.seek_time = time_sync_millis;
            var _watchUrl = getWatchUrl();
            if (_watchUrl)
                data.data.url = _watchUrl;
            sendClientMessage(data);
            globalCallback = () => { };
        };
        sendNetflixMessage(data);
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
            if (!message.data.params.groupId ||
                message.data.params.groupId == "") {
                setPopupError("A group name is required");
                break;
            }

            if (!message.data.params.displayName ||
                message.data.params.displayName == "") {
                setPopupError("A display name is required");
                break;
            }

            displayName = message.data.params.displayName;
            currentGroup = message.data.params.groupId;

            setupWebSocket(message.data.params.groupId,
                message.data.params.displayName,
                message.data.params.host,
                message.data.params.live);
            break;

        case "wake":
            if (hasWoken)
                openNetflixIfNotOpen('https://www.netflix.com/browse');
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
    if (portConnected && port)
        port.postMessage(data);
}

function sendGroupChatMessage(message) {
    var data = dataModel({});
    data.data.action = "message";
    data.data.message = message;
    console.log(data);
    sendClientMessage(data);
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

function setupWebSocket(groupId, displayName, isHost, live) {
    // return if were already connected
    if (socket && socket.readyState == 1) {
        setPopupError('Already connected');
        return;
    }

    if (isHost && !_tab) {
        setPopupError('No netflix page found, please ensure you are watching something before creating a group.');
        return;
    }

    setPopupLoading(true);
    // find which server to send the request to
    const http = new XMLHttpRequest();
    chrome.management.getSelf((res) => {
        const url = `${coreEndpoint}/group/${groupId}`;
        http.open("GET", url);
        if (res.installType == "development")
            http.setRequestHeader('develop_key', 'develop');

        var versionId = `Version ${res.version}`;
        if (res.installType == "development")
            versionId += `-dev`;

        http.send();
        http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var resp = JSON.parse(http.responseText);
                connectToSocket(resp.server, groupId, displayName, isHost, live, versionId);
            }
        };
    });
}

function openNetflixIfNotOpen(_url) {
    if (navigating) {
        console.log("not opening url because tab is navigating");
        return;
    }
    console.log(_tab);
    if (_tab && _tab.url.indexOf(_url) > -1) {
        console.log("netflix is open dont open tab");
        return;
    }
    navigating = true;
    console.log(`create tab at url ${_url}`);
    chrome.tabs.create({ url: _url }, function (tab) {
        navigating = false;
        createdTabId = tab.id;
    });
}

function getWatchUrl() {
    if (!_tab) {
        setPopupError('No netflix page found.');
        return;
    }
    netflixURL = new URL(_tab.url);
    var watchId = netflixURL.pathname.replace('/watch', '');
    var trackId = netflixURL.searchParams.get("trackId");
    watchUrl = `${watchId}?trackId=${trackId}`;
    if (!trackId) {
        setPopupError('Not a valid netflix page, please ensure you are watching something before creating a group.');
        return;
    }
    return watchUrl;
}

function connectToSocket(address, groupId, displayName, isHost, live, version) {
    // get url for netflix watching link
    var watchUrl = "";
    if (isHost) {
        watchUrl = getWatchUrl();
        if (!watchUrl)
            return;
    } else {
        console.log('No tab or not host');
    }

    // connect
    var host = live ? address : "localhost:3000";
    socket = new WebSocket(`ws://${host}/?groupId=${groupId}&displayName=${displayName}&watchUrl=${watchUrl}&seek_time=${time_sync_millis}&version=${version}`,
        'echo-protocol');

    socket.addEventListener('open', function (event) {
        console.log(`Connected to socket ${host} group -> ${groupId}`);
        setPopupScreen(true);
        setPopupError("");
        setPopupLoading(false);
    });

    socket.addEventListener('message', function (event) {
        processSocketMessage(event.data, false);
    });

    socket.addEventListener('error', function (event) {
        setPopupError("Couldn't connect to group.");
        resetHeartbeat();
    });

    socket.addEventListener('close', function (event) {
        var data = dataModel({});
        data.data.action = "disconnect";
        sendNetflixMessage(data);
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
    if (message.data.action == "message") {
        message.data.isClient = (message.sender == user_id);
        sendNetflixMessage(message);
        return;
    }

    if (message.data.action == "added" || message.data.action == "remove") {
        var addedMessage = dataModel(message.data);
        sendNetflixMessage(addedMessage);
        return;
    }

    if (message.sender == user_id) { return; }

    if (message.sender == "server") {
        lastServerMessage = message;
        user_id = user_id ? user_id : message.data.user_id;
        url = message.data.url;
        applyNetflixData(message, false);
        if (_navigating) { return; }
        if (url != undefined && url && url != "") {
            var _url = `https://www.netflix.com/watch${url}`;
            if (!_tab) {
                console.log("tab not open");
                openNetflixIfNotOpen(_url);
            } else {
                console.log(`checking urls ${_tab.url.indexOf(_url)}`);
                if (_tab.url.indexOf(_url) == -1) {
                    if (_tab.url.indexOf('https://www.netflix.com') > -1) {
                        if (_navigating) return;
                        _navigating = true;
                        chrome.tabs.update(_tab.id, { url: _url }, function (tab) {
                            _navigating = false;
                            _tab = tab;
                        });
                        return;
                    } else {
                        console.log("create new tab");
                        openNetflixIfNotOpen(_url);
                    }
                }
            }
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
                        data.time = new Date().getTime();
                        data.data.action = "set_sync_time";
                        var _watchUrl = getWatchUrl();
                        if (_watchUrl)
                            data.data.url = _watchUrl;
                        data.data.seek_time = time_sync_millis;
                        sendClientMessage(data);
                        globalCallback = () => { };
                    };
                    sendNetflixMessage({});
                }, 1000);
            }
        }
        return;
    }

    sendNetflixMessage(message);
}

function resetHeartbeat() {
    clearInterval(hostSync);
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
    displayName = "";
    currentGroup = "";
    user_id = undefined;
    url = undefined;
    if (port)
        port.disconnect();

    portConnected = false;
    applyNetflixData(resetUIMessage, true);
}