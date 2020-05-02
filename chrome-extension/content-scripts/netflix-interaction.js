console.log("netflix-interacion.js");
var portConnected = false;
var portMessage = "start";
var openPort;
var NETFLIX_SOCIAL_CHAT_CONTAINER = "netflix_social_message_box";
var loadingLoop;

function setup() {
    startCheckLoadingLoop();
    createMessageButtons();
}

function dataModel() {
    return { data: {} };
}

chrome.runtime.onConnect.addListener((port) => {
    portConnected = true;
    portMessage = "open";
    openPort = port;
    clearInterval(loadingLoop);
    setup();
    if (port.onMessage.hasListeners()) { return; }
    port.onDisconnect.addListener((port) => {
        UnregisterChat();
        clearInterval(loadingLoop);
        portMessage = "closed";
        openPort = null;
        portConnected = false;
    });
    port.onMessage.addListener(function (message) {
        if (!message) return;

        if (message.data.action == "added")
            ConnectedToGroup(message);

        if (message.data.action == "remove")
            DisconnectedFromGroup(message);

        if (message.data.action == "left_group")
            HideChat();

        if (message.data.action == "message")
            ProcessChatMessage(message);

        if (message.data.action == "get_sync_time")
            returnCurrentTime((responseObject) => port.postMessage(responseObject));

        if (message.data.action == "play_video")
            PlayVideo(message)

        if (message.data.action == "pause_video")
            PauseVideo(message);

        if (message.data.action == "sync_time")
            seekToPoint(message.data.sync_time);
    });
});

// INTERACTION
function ConnectedToGroup(message) {
    AddMessageToChat(`${message.data.displayName} has joined the group`, 'Server', false, true);
    OpenChat();
}

function DisconnectedFromGroup(message) {
    AddMessageToChat(`${message.data.displayName} has left the group`, 'Server', false, true);
}

function ProcessChatMessage(message) {
    AddMessageToChat(message.data.message, message.data.displayName, message.data.isClient, false);
}

function PlayVideo(message) {
    AddMessageToChat(`Host started the video`, 'Server', false, true);
    if (!message.data.isSender)
        seekToPoint(message.data.sync_time);

    setTimeout(() => {
        var playButton = document.getElementById("netflix_social_play");
        if (playButton)
            playButton.click();
    }, 250);
}

function PauseVideo(message) {
    AddMessageToChat(`Host paused the video`, 'Server', false, true);
    if (!message.data.isSender)
        seekToPoint(message.data.sync_time);

    setTimeout(() => {
        var pauseButton = document.getElementById("netflix_social_pause");
        if (pauseButton)
            pauseButton.click();
    }, 250);
}

function seekToPoint(time) {
    var sync_button = document.getElementById("netflix_social_seek");
    if (!sync_button) return;
    sync_button.innerText = time;
    sync_button.click();
}

function returnCurrentTime(callback) {
    var playbackTime = document.getElementById("netflix_social_playback_time");
    if (!playbackTime) return;
    playbackTime.click();
    var responseObject = dataModel();
    responseObject.data.action = "return_sync_time";
    responseObject.data.sync_time = playbackTime.innerText;
    callback(responseObject);
}

function startCheckLoadingLoop() {
    loadingLoop = setInterval(() => {
        var x = document.getElementById("netflix_social_loading");
        if (!x) { console.log("nothing to check"); return; }
        x.click();
        var isLoading = x.innerText;
        if (isLoading == "false") {
            clearInterval(loadingLoop);
            if (portConnected)
                openPort.postMessage({ data: { action: 'loaded' } });
        }
    }, 500);
}

// CHAT
function AddMessageToChat(message, senderName, isClient, serverMessage) {
    OpenChat();
    var container = document.getElementById("netflix_social_chat");
    if (!container) return;
    var player_container = document.getElementsByClassName("NFPlayer")[0];
    if (!player_container) return;
    player_container.style.right = "15%";
    player_container.style.width = "auto";

    if (serverMessage) {
        var serverChatMessage = document.createElement("div");
        serverChatMessage.innerHTML = `<p style="color: gray; width: 100%; text-align: center; font-size: 12px;">${message}</p>`;
        container.append(serverChatMessage);
        return;
    }

    var chatMessageContainer = document.createElement("div");
    chatMessageContainer.style.margin = "10px 5px";
    chatMessageContainer.style.overflow = "auto";

    var chatMessage = document.createElement("div");
    chatMessage.style.borderRadius = "8px";
    chatMessage.style.padding = "10px";
    chatMessage.style.width = "70%";
    chatMessage.style.background = "red";
    chatMessage.style.fontSize="15px";
    if (isClient)
        chatMessage.style.marginLeft = "auto";
    chatMessage.innerText = message;

    var chatMessageSender = document.createElement("div");
    chatMessageSender.innerText = senderName;
    chatMessageSender.style.fontSize="12px";
    chatMessageSender.style.margin = "0";
    chatMessageSender.style.padding = "2px 2px 0 2px";
    chatMessageSender.style.color = "gray";
    if (isClient)
        chatMessageSender.style.float = "right";
    chatMessageSender.style.overflow = "hidden";

    chatMessageContainer.append(chatMessage);
    chatMessageContainer.append(chatMessageSender);

    container.append(chatMessageContainer);

    // auto scroll
    var chatContainer = document.getElementById('netflix_social_chat_container');
    chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight;
}

function UnregisterChat() {
    var messageTrigger = document.getElementById("netflix_social_message_sync");
    if (!messageTrigger) return;
    messageTrigger.removeEventListener("click", sendChatMessage);
    messageTrigger.parentNode.removeChild(messageTrigger);
}

function createMessageButtons() {
    var messageTrigger = document.getElementById("netflix_social_message_sync");
    if (messageTrigger) {
        messageTrigger.removeEventListener("click", sendChatMessage);
        messageTrigger.parentNode.removeChild(messageTrigger);
    }

    messageTrigger = document.createElement("button");
    messageTrigger.id = "netflix_social_message_sync";
    messageTrigger.style.display = "none";
    messageTrigger.addEventListener("click", sendChatMessage);

    document.body.append(messageTrigger);
}

function sendChatMessage(event) {
    var chatToSend = event.toElement.innerText;
    var message = {
        data: {
            action: 'message',
            message: chatToSend
        }
    };

    if (portConnected) {
        openPort.postMessage(message);
    } else {
        console.warn("Port is not connected, cant send chat message");
    }
}

function HideChat() {
    var container = document.getElementsByClassName("NFPlayer")[0];
    if (!container) return;
    container.style.width = "100%";
    container.style.right = "0";
    var chatContainer = document.getElementById(NETFLIX_SOCIAL_CHAT_CONTAINER);
    if (!chatContainer) return;
    chatContainer.style.display = "none";
    var chat_message_container = document.getElementById("netflix_social_chat");
    if (!chat_message_container) return;
    chat_message_container.innerHTML = "";
}

function OpenChat() {
    var container = document.getElementsByClassName("NFPlayer")[0];
    if (!container) return;
    container.style.width = "auto";
    container.style.right = "15%";
    var chatContainer = document.getElementById(NETFLIX_SOCIAL_CHAT_CONTAINER);
    if (!chatContainer) return;
    chatContainer.style.display = "flex";
}