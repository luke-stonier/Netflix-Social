console.log("CLIENT-DATA.JS");
var openPort;
var data = getData();
createMessageButtons();

//var port = chrome.runtime.connect({name: 'background-netflix-sync'});
chrome.runtime.onConnect.addListener((port) => {
    if (port.onMessage.hasListeners()) { return; }
    openPort = port;
    port.onMessage.addListener(function (message) {
        if (!message) { return; }

        var embedded_play = document.getElementById("netflix_party_play");
        var embedded_pause = document.getElementById("netflix_party_pause");
        if (!embedded_play || !embedded_pause) { return; }
        if (message.data) {
            if (message.data.action == "play") {
                embedded_play.click();
                AddMessageToChat(`Host started the video`, "Server", false, true);
            }

            if (message.data.action == "pause") {
                embedded_pause.click();
                AddMessageToChat(`Host paused the video`, "Server", false, true);
            }

            if (message.data.action == "message")
                AddMessageToChat(message.data.message, message.data.displayName, message.data.isClient, false);

            if (message.data.action == "added") {
                var addedMessage = `${message.data.displayName} joined the group`;
                AddMessageToChat(addedMessage, "Server", false, true);
            }

            // if (message.data.action == "sync")
            //     console.log("sync");

            if (message.data.action == "disconnect") {
                var x = document.getElementById('netflix_party_disconnect');
                if (!x) { return; }
                x.click();
                AddMessageToChat(`Disconnected from party`, "Server", false, true);
                return;
            }

            if (message.data.action == "sync_time")
                set_sync_time(message.data.seek_time);
        }

        port.postMessage(getData());
    });
});

function createMessageButtons() {
    var messageSync = document.getElementById("netflix_party_message_sync");
    if(messageSync) return;

    console.log("Create message sync button.");
    var messageTrigger = document.createElement("button");
    messageTrigger.id = "netflix_party_message_sync";
    messageTrigger.style.display = "none";
    messageTrigger.addEventListener("click", (event) => {
        var chatToSend = event.toElement.innerText;        
        var data = {
            action: 'message',
            message: chatToSend
        };

        if (openPort)
            openPort.postMessage(data);
    });

    document.body.append(messageTrigger);
}

function AddMessageToChat(message, senderName, isClient, serverMessage) {
    var container = document.getElementById("netflix_party_chat");

    if (serverMessage) {
        var serverChatMessage = document.createElement("div");
        serverChatMessage.innerHTML = `<p style="color: gray; width: 100%; text-align: center;">${message}</p>`;
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
    if (isClient)
        chatMessage.style.marginLeft = "auto";
    chatMessage.innerText = message;

    var chatMessageSender = document.createElement("div");
    chatMessageSender.innerText = senderName;
    chatMessageSender.style.margin = "0";
    chatMessageSender.style.padding = "2px 2px 0 2px";
    chatMessageSender.style.color = "gray";
    if (isClient)
        chatMessageSender.style.float = "right";
    chatMessageSender.style.overflow = "hidden";

    chatMessageContainer.append(chatMessage);
    chatMessageContainer.append(chatMessageSender);

    container.append(chatMessageContainer);
}

function set_sync_time(time) {
    document.getElementById("netflix_party_sync").innerText = time;
    document.getElementById("netflix_party_sync").click();
}

function getData() {
    var embedded_get_data = document.getElementById("netflix_party_get_data");
    if (!embedded_get_data) { return; }
    embedded_get_data.click();
    var current_time = document.getElementById("current_time").innerText;

    return {
        data: {
            action: 'sync',
            seek_time: current_time,
        }
    };
}

data;