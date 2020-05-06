console.log("netflix-interacion.js");
var portConnected = false;
var portMessage = "start";
var openPort;
var NETFLIX_SOCIAL_CHAT_CONTAINER = "netflix_social_message_box";
var loadingLoop;

function setup() {
    startCheckLoadingLoop();
    createMessageButtons();
    createAvatarButtons();
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
        UnregisterAvatar();
        clearInterval(loadingLoop);
        portMessage = "closed";
        openPort = null;
        portConnected = false;
    });
    port.onMessage.addListener(function (message) {
        if (!message) return;
        if (message.data.action == "wake")
            WakeMessage(message);

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

        if (message.data.action == "avatar-changed")
            UpdateAvatarInChat(message);
    });
});

// INTERACTION
function WakeMessage(message) {
    var avatarImage = document.getElementById('icon-select-image');
    if (avatarImage && message.data.displayImage)
        avatarImage.setAttribute('src', message.data.displayImage);
}

function JoinedGroup(message) {
    var avatarImage = document.getElementById('icon-select-image');
    if (avatarImage)
        avatarImage.setAttribute('src', message.data.displayImage);
}

function ConnectedToGroup(message) {
    OpenChat();
    if (message.data.forClient) {
        JoinedGroup(message);
        return;
    }
    AddServerMessage(`${message.data.displayName} has joined the group`, null);
}

function DisconnectedFromGroup(message) {
    AddServerMessage(`${message.data.displayName} has left the group`, null);
}

function ProcessChatMessage(message) {
    AddMessageToChat(message);
}

function PlayVideo(message) {
    AddServerMessage(`Host started the video`, null);
    if (!message.data.isSender)
        seekToPoint(message.data.sync_time);

    setTimeout(() => {
        var playButton = document.getElementById("netflix_social_play");
        if (playButton)
            playButton.click();
    }, 250);
}

function PauseVideo(message) {
    AddServerMessage(`Host paused the video`, null);
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
function AddServerMessage(message, imageUrl) {
    OpenChat();
    var container = document.getElementById("netflix_social_chat");
    if (!container) return;
    var player_container = document.getElementsByClassName("NFPlayer")[0];
    if (!player_container) return;
    player_container.style.right = "15%";
    player_container.style.width = "auto";

    var serverChatMessage = document.createElement("div");
    var padding = imageUrl ? 0 : 10;
    serverChatMessage.innerHTML = `<p style="font-family: 'Baloo Thambi 2', cursive; color: gray; width: 100%; text-align: center; margin: 0; font-size: 12px; padding: 15px 0 ${padding}px;">${message}</p>`;
    if (imageUrl) {
        serverChatMessage.innerHTML += `<div style="text-align: center; padding: 10px 0 5px;">
            <img style="width: 15%;" src="${imageUrl}"/>
        </div>`;
    }
    container.append(serverChatMessage);

    // auto scroll
    setTimeout(() => {
        var chatContainer = document.getElementById('netflix_social_chat_container');
        chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight;
    }, 100);
}

function AddMessageToChat(message) {
    if (message.data.isClient) {
        var avatarImage = document.getElementById('icon-select-image');
        if (avatarImage)
            avatarImage.setAttribute('src', message.data.displayImage);
    }

    OpenChat();
    var container = document.getElementById("netflix_social_chat");
    if (!container) return;
    var player_container = document.getElementsByClassName("NFPlayer")[0];
    if (!player_container) return;
    player_container.style.right = "15%";
    player_container.style.width = "auto";

    // message container
    var messageContainer = document.createElement("div");

    // icon container
    var chatMessageContainer = document.createElement("div");
    chatMessageContainer.style.padding = "10px 5px";
    chatMessageContainer.style.display = "flex";
    chatMessageContainer.innerHTML = `
    <div style="width: 15%; padding-right: 10px;">
        <img class="${message.data.user_id}" style="width: 100%; vertical-align: middle;" src="${message.data.displayImage}"/>
    </div>`;


    // actual message
    var chatMessage = document.createElement("div");
    chatMessage.style.padding = "5px 0";
    var fontSize = "15px"
    var regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
    var emojiCount = message.data.message.match(regex);
    if (emojiCount && emojiCount.length == (message.data.message.length / 2))
        fontSize = "25px";
    chatMessage.innerHTML = `<div style="word-break: break-word; color: white; font-size: ${fontSize}">${message.data.message}</div>`;

    // sender name
    var chatMessageSender = document.createElement("div");
    chatMessageSender.innerText = message.data.displayName;
    chatMessageSender.style.fontSize = "12px";
    chatMessageSender.style.margin = "0";
    chatMessageSender.style.color = "gray";
    chatMessageSender.style.overflow = "hidden";

    // add to dom
    chatMessageContainer.append(chatMessageSender);
    chatMessageSender.append(chatMessage);
    messageContainer.append(chatMessageContainer);
    container.append(messageContainer);

    // auto scroll
    setTimeout(() => {
        var chatContainer = document.getElementById('netflix_social_chat_container');
        chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight;
    }, 100);
}

function UnregisterChat() {
    var messageTrigger = document.getElementById("netflix_social_message_sync");
    if (!messageTrigger) return;
    messageTrigger.removeEventListener("click", sendChatMessage);
    messageTrigger.parentNode.removeChild(messageTrigger);
}

function UnregisterAvatar() {
    var avatarTrigger = document.getElementById("netflix_social_avatar_change");
    if (!avatarTrigger) return;
    avatarTrigger.removeEventListener("click", sendChatMessage);
    avatarTrigger.parentNode.removeChild(avatarTrigger);
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

function createAvatarButtons() {
    var avatarTrigger = document.getElementById("netflix_social_avatar_change");
    if (avatarTrigger) {
        avatarTrigger.parentNode.removeChild(avatarTrigger);
    }

    avatarTrigger = document.createElement("button");
    avatarTrigger.id = "netflix_social_avatar_change";
    avatarTrigger.style.display = "none";
    avatarTrigger.addEventListener("click", (event) => {
        sendChangeAvatarMessage(event.target.innerText);
    });

    document.body.append(avatarTrigger);
}

function sendChangeAvatarMessage(avatarUrl) {
    var message = {
        data: {
            action: 'update-avatar',
            displayImage: avatarUrl
        }
    };

    if (portConnected) {
        openPort.postMessage(message);
    } else {
        console.warn("Port is not connected, cant send avatar change message");
    }
}

function UpdateAvatarInChat(message) {
    AddServerMessage(`${message.data.displayName} updated their avatar`, message.data.displayImage);
    var previousMessageAvatars = document.getElementsByClassName(message.data.user_id);

    var avatarImage = document.getElementById('icon-select-image');
    if (avatarImage && message.data.forClient)
        avatarImage.setAttribute('src', message.data.displayImage);

    for (var i = 0; i < previousMessageAvatars.length; i++) {
        var avatar = previousMessageAvatars[i];
        avatar.setAttribute('src', message.data.displayImage);
    }
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
    container.style.right = "calc(100% - 300px)";
    var chatContainer = document.getElementById(NETFLIX_SOCIAL_CHAT_CONTAINER);
    if (!chatContainer) return;
    chatContainer.style.display = "flex";
}