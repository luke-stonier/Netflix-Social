console.log("netflix-social-chat.js");
setup();

function setup() {
    createMessageBox();
}

function createMessageBox() {
    if (document.getElementsByClassName("AkiraPlayer").length == 0)
        return;

    var wrapper = document.getElementsByClassName("AkiraPlayer")[0];
    var container = document.getElementsByClassName("NFPlayer")[0];
    if (!container) return;
    container.style.width = "auto";
    container.style.right = "15%";
    attachWindowToElement(wrapper);;
}

function attachWindowToElement(wrapper) {
    var x = document.getElementById("netflix_social_message_box");
    if (x) {
        x.style.display="flex";
        return;
    }
    x = document.createElement("div");
    x.id = "netflix_social_message_box";
    x.style.position = "absolute";
    x.style.top = "0px";
    x.style.bottom = "0px";
    x.style.right = "0px";
    x.style.left = "85%";
    x.style.zIndex = 1;
    x.style.overflow = "hidden";
    x.style.display = "flex";
    x.style.flexDirection = "column";
    x.style.background = "#1a1a1a";
    x.innerHTML = `<div style="width: 100%;"><img style="width: 100%;" src="https://netflix-social.com/images/promo_large.png" /></div>`;
    wrapper.append(x);

    var container = document.createElement("div");
    container.id = "netflix_party_chat_container";
    container.style.width = "100%";
    container.style.display = "flex";
    container.style.flex = "1 1";
    container.style.flexDirection = "column";
    container.style.overflowY = "auto";
    container.style.overflowX = "hidden";
    container.innerHTML = `<div id="netflix_social_chat" style="width: 100%; flex: 1 1;">
    </div>`;

    var message_input = document.createElement("div");
    message_input.innerHTML = `<div style="width: 100%; display: flex; justify-content: space-between;">
        <input id="netflix_social_chat_message" type="text" placeholder="Your message..." style="width: 100%; font-size: 15px; border: none; padding: 10px; background: rgb(228, 228, 228); color: black;" />
        <button id="netflix_social_send_message_button" style="position: relative;
        text-align: center;
        background: #db4d48;
        border: none;
        color: white;
        outline: none;
        padding: 5px 10px;
        margin: 0;">SEND</button>
    </div>`;

    x.append(container);
    x.append(message_input);

    document.onkeydown = function (e) {
        e = e || window.event;
        switch (e.which || e.keyCode) {
            case 13:
                sendMessage();
                break;
        }
    }

    document.getElementById("netflix_social_send_message_button").addEventListener("click", (event) => {
        sendMessage();
    });
}

function sendMessage() {
    console.log("Send message");
    var x = document.getElementById("netflix_social_message_sync");
    var y = document.getElementById("netflix_social_chat_message");
    if (!x || !y) return;
    if (y.value == "" || !y.value) {
        // show error.
        return;
    }
    x.innerText = y.value;
    y.value = "";
    x.click();
}
