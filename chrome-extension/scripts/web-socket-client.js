window.onload = function() {
    setup();
};

// WEBSOCKET
var socket;
var lastMessage;
var user_id;

function dataModel() {
    return {
        sender: user_id ? user_id : 'local',
        data: {}
    };
}

function setupWebSocket(groupId, live) {
    // return if were already connected
    if (socket && socket.readyState == 1) { return; }

    // connect
    var host = live ? "watch-hub.herokuapp.com" : "localhost:3000";
    socket = new WebSocket(`ws://${host}/${groupId}`, 'echo-protocol');

    socket.addEventListener('open', function(event) {
        console.log(`Connected to socket ${host} group -> ${groupId}`);
    });

    socket.addEventListener('message', function (event) {
        console.log("socket listener");
        processSocketMessage(event.data);
    });

    socket.addEventListener('close', function(event) {
        console.log(event);
        console.log('disconnected from server');
    });
}

function sendClientMessage(data) {
    data = JSON.stringify(data);
    console.log(data);
    lastMessage = data;
    socket.send(data);
}

function processSocketMessage(message) {
    if (lastMessage == message) {
        return;
    }
    message = JSON.parse(message);

    if (message.sender == "server") {
        user_id = message.data.user_id;
        console.log(`user id -> ${user_id}`);
        return;
    }

    console.log(message);
    sendNetflixMessage(message);
}

function closeWebSocket() {
    if(!socket) { return; }
    socket.close();
}