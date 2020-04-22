// OPEN NETFLIX WINDOW WHEN POPUP OPENS -- DONE
// INJECT CONTENT SCRIPTS
// CONNECT TO CONTENT SCRIPTS THROUGH PORT
// ACCEPT MESSAGES FROM POPUP
// CONNECT TO SERVER
// ACCEPT REQUESTS FROM SERVER

var DEFAULT_NETFLIX_PAGE = "https://www.netflix.com/browse";
var CORE_NETFLIX_SOCIAL = "https://netflix-party-core.herokuapp.com";
var isDev = false;
var version;

var popup_view;

var netflixTab;
var netflixTabLoading = false;
var netflixPort;
var netflixPortConnected;
var netflixTabCallback = () => { };
var heartbeat;

var isConnected = false;
var lastServerMessage;
var groupId;
var displayName;
var user_id;
var socket;

function dataModel(_data) {
    return {
        sender: user_id,
        data: _data
    };
}


chrome.runtime.onInstalled.addListener(function () {
    // runs when the extension has been installed
});

chrome.tabs.onActivated.addListener(function () {
    // runs when a tab is clicked
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (netflixTab && netflixTab.id == tabId) {
        // netflix tab was closed...
        netflixTab = null;
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    if (info.status && info.status == "complete" || tab.status == "complete") {
        if (netflixTab && tab.id == netflixTab.id) {
            netflixTab = tab;
            netflixTabLoading = false;
            if (getCurrentWatchUrl()) {
                InjectContentScripts(() => {
                    InjectInteractionScript(() => {
                    });
                });
            }
        }
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    processPopupMessage(message);
    sendResponse();
});

function InjectBasicScripts() {
    if (getCurrentWatchUrl()) {
        InjectContentScripts(() => {
            InjectInteractionScript(() => {
            });
        });
    }
}

function processPopupMessage(message) {
    if (!netflixTab) {
        getNetflixTab(t => {
            if (!t) {
                openNetflixTab(DEFAULT_NETFLIX_PAGE, (t) => { netflixTab = t; InjectBasicScripts(); });
            } else {
                netflixTab = t
                InjectBasicScripts();
            }
        });
    }

    if (message.data.action == "wake") {
        getExtensionSettings(() => {
            getPopupView();
            setPopupScreen();
        });
    }

    console.log(message.data);

    // Connection types
    if (message.data.action == "connect") {
        groupId = message.data.params.groupId;
        displayName = message.data.params.displayName;
        var host = message.data.params.host;

        if (!groupId) { showPopupError("Group Id can not be empty."); return; }
        if (!displayName) { showPopupError("Display name can not be empty."); return; }
        if (host && !getCurrentWatchUrl()) {
            showPopupError("Not a valid netflix page, please ensure you are watching a title.");
            return;
        }
        getGroupConnectionAddress(groupId, (resp) => {
            if (host)
                getSyncTime((response) => connectToGroup(resp.server, groupId, displayName, getCurrentWatchUrl(), response.data.sync_time));
            else
                connectToGroup(resp.server, groupId, displayName, "", 0);

        });
    }

    if (message.data.action == "close") {
        DisconnectFromSocket();
    }


    // Connected Messages
    if (message.data.action == "sync") {
    }

    if (message.data.action == "play") {
        var message = dataModel({ action: 'play_video' });
        getSyncTime((response) => {
            message.data.sync_time = response.data.sync_time;
            sendMessageToNetflixPage(message);
            sendSocketMessage(message);
        });
    }

    if (message.data.action == "pause") {
        var message = dataModel({ action: 'pause_video' });
        getSyncTime((response) => {
            message.data.sync_time = response.data.sync_time;
            sendMessageToNetflixPage(message);
            sendSocketMessage(message);
        });
    }
}

// SOCKET CONNECTION
function connectToGroup(address, groupId, displayName, watch_url, current_time) {
    socket = new WebSocket(`ws://${address}/?groupId=${groupId}&displayName=${displayName}&watchUrl=${watch_url}&seek_time=${current_time}&version=${version}`,
        'echo-protocol');

    socket.addEventListener('open', function (event) {
        console.log(`Connected to socket ${address} group -> ${groupId}`);
        StartHeartbeat();
        ConnectedToSocket();
    });

    socket.addEventListener('message', function (event) {
        processSocketMessage(JSON.parse(event.data));
    });

    socket.addEventListener('error', function (event) {
        showPopupError("Couldn't connect to group.");
    });

    socket.addEventListener('close', function (event) {
        if (event.code != 1006) showPopupError("Disconnected from group");
        DisconnectedFromSocket();
    });
}

function StartHeartbeat() {
    heartbeat = setInterval(() => {
        getSyncTime((response) => {
            var message = dataModel({
                sync_time: response.data.sync_time,
                url: getCurrentWatchUrl()
            });
            sendSocketMessage(message);
        });
    }, 500);
}

function sendSocketMessage(data) {
    if (!socket || socket.readyState != 1) { return; }
    data = JSON.stringify(data);
    socket.send(data);
}

function processSocketMessage(message) {
    if (!message) return;
    var isServerMessage = message.sender == "server";
    isServerMessage ? processServerMessage(message) : processClientMessage(message);
}

/*
SAMPLE SERVER MESSAGE
{
    "sender":"server",
    "data":{
        "user_id":"PeflhqFizmfg7BZG8RxZnA==",
        "displayName":"text",
        "isHost":true,"
        url":"/81130223?trackId=14170286",
        "client_count":1,
        "seek_time":"420691"
    }
}
*/

function processServerMessage(message) {
    user_id = (user_id || message.data.user_id);
    if (message.data.user_id != user_id) return;
    lastServerMessage = message;
    setPopupScreen();
    if (message.data.url)
        SyncUrl(message.data.url);
}

/*
SAMPLE CLIENT MESSAGE
{
    "sender":"EGEPx46/1RKdHSH6jtuIxQ==",
    "data":{
        "action":"set_sync_time",
        "url":"/81130223?trackId=14170286",
        "seek_time":"2101001"
    }
}
*/

function processClientMessage(message) {
    console.log(message);
    if (message.sender == user_id) return;
    sendMessageToNetflixPage(message);
}

function DisconnectFromSocket() {
    if (!socket || socket.readyState != 1)
        return;
    socket.close();
}

function SyncUrl(url) {
    getNetflixTab((t) => {
        var _url = `https://www.netflix.com/watch${url}`;
        if (!t)
            openNetflixTab(_url, (t) => { netflixTab = t });

        if (t && t.url.indexOf(url) == -1)
            chrome.tabs.update(netflixTab.id, { url: _url }, function (tab) { netflixTab = tab; });
    });
}

function ConnectedToSocket() {
    isConnected = true;
    getPopupElement("status_icon").style.color = "lime";
    getPopupElement("connection_container").style.display = "none";
    getPopupElement("message_container").style.display = "block";
    getPopupElement("group_id").disabled = true;
    getPopupElement("display_name").disabled = true;
    getPopupElement("group_id").value = groupId;
    getPopupElement("display_name").value = displayName;
}

function DisconnectedFromSocket() {
    isConnected = false;
    getPopupElement("status_icon").style.color = "red";
    getPopupElement("connection_container").style.display = "block";
    getPopupElement("message_container").style.display = "none";
    getPopupElement("group_id").disabled = false;
    getPopupElement("display_name").disabled = false;
    getPopupElement("group_id").value = "";
    getPopupElement("display_name").value = "";
}

// CORE REQUESTS
function getGroupConnectionAddress(groupId, callback) {
    const http = new XMLHttpRequest();
    const url = `${CORE_NETFLIX_SOCIAL}/group/${groupId}`;
    http.open("GET", url);
    if (isDev)
        http.setRequestHeader("develop_key", "develop");
    http.send();
    http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var resp = JSON.parse(http.responseText);
            callback(resp);
        }
    };
}

// NETFLIX PAGE
function getSyncTime(callback) {
    netflixTabCallback = (response) => {
        netflixTabCallback = () => { };
        if (response.data.action != "return_sync_time") return;
        callback(response);
    }
    sendMessageToNetflixPage({ data: { action: 'get_sync_time' } });
}

function getCurrentWatchUrl() {
    if (!netflixTab) { showPopupError("No netflix page open."); return; }
    if (!netflixTab.url) { return; }
    netflixURL = new URL(netflixTab.url);
    var watchId = netflixURL.pathname.replace('/watch', '');
    var trackId = netflixURL.searchParams.get("trackId");
    if (!trackId) return;
    watchUrl = `${watchId}?trackId=${trackId}`;
    return watchUrl;
}

function InjectContentScripts(callback) {
    if (!netflixTab) return;
    chrome.tabs.executeScript(netflixTab.id, { file: '/content-scripts/inject.js' }, function (result) {
        setTimeout(() => { callback(); }, 100);
    });
}

function InjectInteractionScript(callback) {
    if (!netflixTab) return;
    chrome.tabs.executeScript(netflixTab.id, { file: '/content-scripts/netflix-interaction.js' }, function (result) {
        createNetflixPagePortConnection();
        callback(result);
    });
}

function createNetflixPagePortConnection() {
    if (!netflixTab) return
    netflixPort = chrome.tabs.connect(netflixTab.id, { name: 'background-netflix-sync' });
    netflixPortConnected = true;
    netflixPort.onMessage.addListener(function (message) {
        if (netflixTabCallback)
            netflixTabCallback(message);
    });
    netflixPort.onDisconnect.addListener((port) => {
        if (port.error)
            console.log(p.error.message)
        netflixPortConnected = false;
    });
}

function sendMessageToNetflixPage(message) {
    if (!message) return;
    if (!netflixPortConnected) return;
    if (!netflixPort) return;
    netflixPort.postMessage(message);
}


// Extension Settings
function getExtensionSettings(callback) {
    chrome.management.getSelf((res) => {
        version = `v${res.version}`;
        if (res.installType == "development") {
            isDev = true;
            version += `-dev`;
        }

        callback();
    });
}

// Tab management
function getNetflixTab(callback) {
    chrome.tabs.query({ url: "https://www.netflix.com/*" }, function (tabs) {
        if (tabs.length > 0) {
            callback(tabs[0]);
        } else {
            callback(null);
        }
    });
}

function openNetflixTab(url, callback) {
    if (netflixTabLoading) return;
    netflixTabLoading = true;
    chrome.tabs.create({ url: url }, function (tab) {
        callback(tab);
    });
}

// POPUP
function showPopupError(error) {
    setPopupText("error_tag", error);
    setTimeout(() => {
        setPopupText("error_tag", "");
    }, 3000);
}

function getPopupElement(id) {
    return popup_view.getElementById(id);
}

function setPopupText(id, text) {
    popup_view.getElementById(id).innerText = text;
}

function getPopupView() {
    var views = chrome.extension.getViews({
        type: "popup"
    });
    for (var i = 0; i < views.length; i++) {
        popup_view = views[i].document;
    }
}

function setPopupScreen() {
    if (isConnected) {
        ConnectedToSocket();
        if (lastServerMessage) {
            getPopupElement("play").style.display = lastServerMessage.data.isHost ? "block" : "none";
            getPopupElement("pause").style.display = lastServerMessage.data.isHost ? "block" : "none";
            getPopupElement("sync").style.display = lastServerMessage.data.isHost ? "none" : "block";
            setPopupText("live_users", lastServerMessage.data.client_count);
        }
    } else {
        DisconnectedFromSocket();
    }
}