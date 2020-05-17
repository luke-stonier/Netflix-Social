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
var heartbeatRunning = false;

var isConnected = false;
var lastServerMessage;
var lastUrl = "";
var groupId;
var groupKey;
var displayName;
var user_id;
var socket;
var peerConnection;

var mediaStream;

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
        netflixTabLoading = false;
        DisconnectFromSocket();
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    // if (netflixTab && tabId == netflixTab.id)
    //     if (info.status == "loading" || tab.status == "loading") {

    //     }

    if (info.status && info.status == "complete" || tab.status == "complete") {
        if (netflixTab && tab.id == netflixTab.id) {
            netflixTab = tab;
            netflixTabLoading = false;
            InjectBasicScripts();
        }
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    processPopupMessage(message);
    sendResponse();
});

function InjectBasicScripts() {
    if (getCurrentWatchUrl(true)) {
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

            if (mediaStream)
                getPopupElement('local-video').srcObject = mediaStream;
        });
    }

    // Connection types
    if (message.data.action == "connect") {
        DisableJoinButtons();
        groupId = message.data.params.groupId;
        groupKey = message.data.params.groupKey;
        displayName = message.data.params.displayName;
        var host = message.data.params.host;

        if (!groupId) { showPopupError("Group Id can not be empty."); EnableJoinButtons(); return; }
        if (!groupKey) { showPopupError("Group password can not be empty."); EnableJoinButtons(); return; }
        if (!displayName) { showPopupError("Display name can not be empty."); EnableJoinButtons(); return; }
        if (host && !getCurrentWatchUrl(true)) {
            showPopupError("Not a valid netflix page, please ensure you are watching a title.");
            return;
        }
        getGroupConnectionAddress(groupId, groupKey, (resp) => {
            if (host)
                getSyncTime((response) => connectToGroup(resp.server, resp.groupid, displayName, getCurrentWatchUrl(true), response.data.sync_time));
            else
                connectToGroup(resp.server, resp.groupid, displayName, "", 0);

        });
    }

    if (message.data.action == "close") {
        DisconnectFromSocket();
    }


    // Connected Messages
    if (message.data.action == "sync") {
        var message = dataModel({ action: 'sync' });
        SendSocketMessageToEndpoint('sync', message);
    }

    if (message.data.action == "play") {
        var message = dataModel({ action: 'play_video' });
        getSyncTime((response) => {
            message.data.sync_time = response.data.sync_time;
            SendSocketMessageToEndpoint('player-method', message);
            var netflixMessage = Object.assign({}, message);
            netflixMessage.data.isSender = true;
            // sendMessageToNetflixPage(netflixMessage);
        });
    }

    if (message.data.action == "pause") {
        var message = dataModel({ action: 'pause_video' });
        getSyncTime((response) => {
            message.data.sync_time = response.data.sync_time;
            SendSocketMessageToEndpoint('player-method', message);
            var netflixMessage = Object.assign({}, message);
            netflixMessage.data.isSender = true;
            // sendMessageToNetflixPage(netflixMessage);
        });
    }
}

// SOCKET CONNECTION
function connectToGroup(address, groupId, displayName, watch_url, current_time) {
    var _address = true ? `https://${address}` : 'http://localhost:3000';
    var queryString = `groupId=${groupId}&displayName=${displayName}&watchUrl=${watch_url}&seekTime=${current_time}&version=${version}`;
    if (socket && socket.connected) { showPopupError('Already connected to group'); return;}

    try {
        socket = io(`${_address}`, {
            reconnection: false,
            forceNew: false,
            query: queryString
        });
    } catch (ex) {
        EnableJoinButtons();
        DisconnectFromSocket();
        DisconnectProcess();
        console.log(ex);
    } 

    socket.on('connect', async (data) => {
        console.log(`Connected to socket ${address} group -> ${groupId}`);
        ConnectedToSocket();
        AddChatWindow();
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
        socket.emit("start-video", offer);
    });

    socket.on('client-connected', (data) => {
        console.log(data);
        sendMessageToNetflixPage(dataModel({ action: 'client-connected', client: data }));
    });

    socket.on('client-disconnected', (data) => {
        console.log(data);
        sendMessageToNetflixPage(dataModel({ action: 'client-disconnected', client: data }));
    });

    socket.on('start-video', async (data) => {
        if (data.sender == user_id) return;
        console.log(data);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
        socket.emit('answer-video', {
            answer: answer,
            to: data.sender
        });
    });

    socket.on('user-data', (data) => {
        console.log(data);
        lastServerMessage = data;

        sendMessageToNetflixPage(dataModel({ action: 'client-created', client: data.client }))

        // Register data locally
        user_id = (user_id || data.client.id);
        if (data.client.host && !heartbeatRunning)
            StartHeartbeat();

        setPopupScreen();
        SyncUrl(data.group.url);
        SyncTime(data.group.seek_time);
    });

    socket.on('client-updated', (client) => {
        var localClient = client.id == user_id;
        sendMessageToNetflixPage(dataModel({ action: 'client-updated', client: client, localClient: localClient }))
    });

    socket.on('chat', (data) => {
        sendMessageToNetflixPage(dataModel({ action: 'chat', message: data.chat, client: data.client }));
    });

    socket.on('player-method', (data) => {
        console.log(data);
        sendMessageToNetflixPage(dataModel({ action: data.action }));
        SyncUrl(data.group.url);
        SyncTime(data.group.seek_time);
    });

    socket.on('disconnect', (reason) => {
        console.log(reason);
        DisconnectedFromSocket();
        DisconnectProcess();

        if (reason === 'io server disconnect') {
            console.log('Server disconnect');
            showPopupError("Server kicked from group");
        } else if (reason === 'io client disconnect') {
            console.log('Client disconnected');
            showPopupError("Disconnected from group");
        } else {
            console.log('Group connection lost');
            showPopupError("Group connection lost");
        }
    });

    socket.on('error', (error) => {
        showPopupError("Couldn't connect to group.");
        console.log(error);
    });

    socket.on('message', (data) => {
        // JSON.parse(event.data); No need to parse as messages are received as objects
        processSocketMessage(data);
    });
}

function StartHeartbeat() {
    heartbeatRunning = true;
    heartbeat = setInterval(() => {
        getSyncTime((response) => {
            var url = getCurrentWatchUrl(false);
            if (url != lastUrl) response.data.sync_time = 0;
            lastUrl = url;
            var message = dataModel({
                action: 'set_sync_time',
                sync_time: response.data.sync_time,
                url: url
            });
            SendSocketMessageToEndpoint('heartbeat', message);
        });
    }, 500);
}

function sendSocketMessage(data) {
    if (!socket || !socket.connected) return;
    //data = JSON.stringify(data);
    socket.emit('message', data);
}

function SendSocketMessageToEndpoint(endpoint, data) {
    if (!socket || !socket.connected) return;
    socket.emit(endpoint, data);
}

function sendGroupChatMessage(message) {
    var chatMessage = dataModel({ action: 'chat', message: message });
    SendSocketMessageToEndpoint('chat', chatMessage);
}

function processSocketMessage(message) {
    if (!message) return;
    var isServerMessage = message.sender == "server";
    isServerMessage ? processServerMessage(message) : processClientMessage(message);
}

function processServerMessage(message) {
    if (!user_id)
        lastServerMessage = message;

    var forClient = message.data.user_id == user_id;

    var action = message.data.action;
    message.data.forClient = forClient;
    if (action == "added" || action == "remove" || action == "avatar-changed") {
        sendMessageToNetflixPage(message);
    }

    if (message.data.user_id != user_id) { return; }
    lastServerMessage = message;

    setPopupScreen();

    if (message.data.isHost) return;
    if (message.data.url)
        SyncUrl(message.data.url);
    if (message.data.seek_time)
        SyncTime(message.data.seek_time);
}

function processClientMessage(message) {
    var isClient = message.sender == user_id;
    if (message.data.action == "message") {
        message.data.isClient = isClient;
        sendMessageToNetflixPage(message);
        return;
    }
    if (isClient) return;
    sendMessageToNetflixPage(message);
}

function DisconnectProcess() {
    var message = dataModel({ action: 'left_group' });
    sendMessageToNetflixPage(message);
}

function DisconnectFromSocket() {
    if (!socket) return;
    clearInterval(heartbeat);
    heartbeatRunning = false;
    user_id = null;
    lastServerMessage = null;
    socket.close();
}

function SyncTime(time) {
    console.log(`Sync time ${time}`);
    var message = dataModel({ action: 'sync_time', sync_time: time });
    sendMessageToNetflixPage(message);
}

function SyncUrl(url) {
    console.log(`Sync url ${url}`);
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
    EnableJoinButtons();
    getPopupElement("status_icon").style.color = "lime";
    getPopupElement("connection_container").style.display = "none";
    getPopupElement("message_container").style.display = "block";
    getPopupElement("group_id").disabled = true;
    getPopupElement("group_pass").disabled = true;
    getPopupElement("display_name").disabled = true;
    getPopupElement("group_id").value = groupId;
    getPopupElement("group_pass").value = groupKey;
    getPopupElement("display_name").value = displayName;
}

function DisconnectedFromSocket() {
    isConnected = false;
    EnableJoinButtons();
    getPopupElement("status_icon").style.color = "red";
    getPopupElement("connection_container").style.display = "block";
    getPopupElement("message_container").style.display = "none";
    getPopupElement("group_id").disabled = false;
    getPopupElement("group_pass").disabled = false;
    getPopupElement("display_name").disabled = false;
    getPopupElement("group_id").value = "";
    getPopupElement("group_pass").value = "";
    getPopupElement("display_name").value = "";
    lastServerMessage = null;
    user_id = null;
}

// CORE REQUESTS
function getGroupConnectionAddress(groupId, groupKey, callback) {
    const http = new XMLHttpRequest();
    const url = `${CORE_NETFLIX_SOCIAL}/group/${groupId}`;
    http.open("GET", url);
    if (isDev)
        http.setRequestHeader("develop_key", "develop");
    http.setRequestHeader("group-key", groupKey);
    http.send();
    http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var resp = JSON.parse(http.responseText);
            callback(resp);
        } else if (this.status == 403) {
            showPopupError("Group password was not correct");
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

function getCurrentWatchUrl(query) {
    if (!netflixTab) { showPopupError("No netflix page open."); return; }
    if (!netflixTab.url) { return; }
    netflixURL = new URL(netflixTab.url);
    var watchId = netflixURL.pathname.replace('/watch', '');
    var trackId = netflixURL.searchParams.get("trackId");
    if (!trackId) return;
    watchUrl = `${watchId}${query ? '&' : '?'}trackId=${trackId}`;
    return watchUrl;
}

function InjectContentScripts(callback) {
    if (!netflixTab) return;
    chrome.tabs.executeScript(netflixTab.id, { file: '/content-scripts/inject.js' }, function (result) {
        createVideoConnection()
        setTimeout(() => { callback(); }, 100);
    });
}

function createVideoConnection() {
    chrome.tabs.executeScript(netflixTab.id, { file: '/content-scripts/inject-stream.js' }, async function (result) {
        console.log("do inject");
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            ConnectVideoStream();
            getPopupElement('local-video').srcObject = mediaStream;
        } catch (err) {
            console.error(err);
        }
    });
}

function ConnectVideoStream() {
    peerConnection = new RTCPeerConnection();
    mediaStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, mediaStream);
    });
    console.log(mediaStream);
    console.log(peerConnection);
}

function InjectInteractionScript(callback) {
    if (!netflixTab) return;
    chrome.tabs.executeScript(netflixTab.id, { file: '/content-scripts/netflix-interaction.js' }, function (result) {
        chrome.tabs.insertCSS(netflixTab.id, { file: 'netflix-social.css' }, () => { });
        createNetflixPagePortConnection();
        callback(result);
    });
}

function AddChatWindow() {
    if (!netflixTab) return;
    chrome.tabs.executeScript(netflixTab.id, { file: '/content-scripts/netflix-social-chat.js' }, function (result) {
        if (!lastServerMessage) return;
        var message = dataModel({ action: 'wake', client: lastServerMessage.client });
        sendMessageToNetflixPage(message);
    });
}

function createNetflixPagePortConnection() {
    if (!netflixTab) return
    netflixPort = chrome.tabs.connect(netflixTab.id, { name: 'background-netflix-sync' });
    netflixPortConnected = true;
    netflixPort.onMessage.addListener(function (message) {
        if (message.data.action != "return_sync_time") {
            if (message.data.action == "message")
                sendGroupChatMessage(message.data.message);

            if (message.data.action == "update-avatar")
                SendSocketMessageToEndpoint('update-client', message);

            if (message.data.action == "loaded")
                videoLoaded();
        }


        // Process other messages
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

function videoLoaded() {
    if (isConnected) {
        // sync to host
        var message = dataModel({ action: 'sync' });
        SendSocketMessageToEndpoint('sync', message);
        AddChatWindow();
    }
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
function DisableJoinButtons() {
    getPopupElement("host").disabled = true;
    getPopupElement("join").disabled = true;
}

function EnableJoinButtons() {
    getPopupElement("host").disabled = false;
    getPopupElement("join").disabled = false;
}

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
            getPopupElement("play").style.display = lastServerMessage.client.host ? "block" : "none";
            getPopupElement("pause").style.display = lastServerMessage.client.host ? "block" : "none";
            getPopupElement("sync").style.display = lastServerMessage.client.host ? "none" : "block";
            setPopupText("live_users", lastServerMessage.group.clientCount);
        } else {
            getPopupElement("play").style.display = "none";
            getPopupElement("pause").style.display = "none";
            getPopupElement("sync").style.display = "none";
            setPopupText("live_users", "No Data");
        }
    } else {
        DisconnectedFromSocket();
    }
}