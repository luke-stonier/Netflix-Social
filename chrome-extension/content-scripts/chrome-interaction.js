console.log('chrome-interaction.js');
var portConnected = false;
var openPort;

chrome.runtime.onConnect.addListener(port =>  onPortConnected(port));

function onPortConnected(port) {
    portConnected = true;
    openPort = port;

    if (port.onMessage.hasListeners()) { return; }
    port.onDisconnect.addListener(_ => onPortDisconnected());
    port.onMessage.addListener(message => handlePortMessage(message));
}

function onPortDisconnected() {
    openPort = null;
    portConnected = false;
}

function handlePortMessage(message) {
    if (!message) return;
    console.log(message);

    if (message.data.action == "connect")
        connectToGroup(message.data.connectionAddress);
}

// SOCKET CONNECTION
// `ws://${address}/?groupId=${groupId}&displayName=${displayName}&watchUrl=${watch_url}&seek_time=${current_time}&version=${version}`
function connectToGroup(connectionAddress) {
    socket = new WebSocket(connectionAddress, 'echo-protocol');

    socket.addEventListener('open', function (event) {
        console.log(`Connected to socket`);
        connectedToSocket();
    });

    socket.addEventListener('message', function (event) {
        processSocketMessage(JSON.parse(event.data));
    });

    socket.addEventListener('error', function (event) {
        showPopupError("Couldn't connect to group.");
    });

    socket.addEventListener('close', function (event) {
        console.log("Disconnected from socket");
        DisconnectedFromSocket();
        DisconnectProcess();
        if (event.code != 1006) showPopupError("Disconnected from group");
    });
}

function processSocketMessage(message) {
    if (!message) return;
    var isServerMessage = message.sender == "server";
    isServerMessage ? processServerMessage(message) : processClientMessage(message);
}

function processServerMessage(message) {
    console.log(message);
}

function processClientMessage(message) {
    console.log(message);
}

function connectedToSocket() {
    sendMessageToBackground({ data: { action: 'connected' }});
}

function sendMessageToBackground(message) {
    if (!portConnected || !message) return;
    openPort.postMessage(message);
}