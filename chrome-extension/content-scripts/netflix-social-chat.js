console.log("netflix-social-chat.js");
setup();
var usingOptions = false;
var pickingIcon = false;

function setup() {
    createMessageBox();
    window.onresize = FitChatToScreen();
}

function FitChatToScreen() {
    var container = document.getElementsByClassName("NFPlayer")[0];
    if (container) {
        container.style.width = "auto";
        container.style.right = "300px";
    }
    var chatWindow = document.getElementById("netflix_social_message_box");
    if (chatWindow)
        chatWindow.style.left = "calc(100% - 300px)";
}

function createMessageBox() {
    var googleScripts = document.createElement("link");
    googleScripts.href = "https://fonts.googleapis.com/css?family=Baloo+Thambi+2&display=swap";
    googleScripts.rel = "stylesheet";
    document.head.append(googleScripts);

    var materialIconScript = document.createElement("link");
    materialIconScript.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    materialIconScript.rel = "stylesheet";
    document.head.append(materialIconScript);

    if (document.getElementsByClassName("AkiraPlayer").length == 0)
        return;

    var wrapper = document.getElementsByClassName("AkiraPlayer")[0];
    var container = document.getElementsByClassName("NFPlayer")[0];
    if (!container) return;
    container.style.width = "auto";
    container.style.right = "300px"; // 15%
    attachWindowToElement(wrapper);;
}

function attachWindowToElement(wrapper) {
    var x = document.getElementById("netflix_social_message_box");
    if (x) {
        x.style.display = "flex";
        return;
    }
    x = document.createElement("div");
    x.id = "netflix_social_message_box";
    x.style.position = "absolute";
    x.style.top = "0px";
    x.style.bottom = "0px";
    x.style.right = "0px";
    x.style.left = "calc(100% - 300px)"; // 15%
    x.style.zIndex = 1;
    x.style.overflow = "hidden";
    x.style.display = "flex";
    x.style.flexDirection = "column";
    x.style.background = "#1a1a1a";
    x.style.boxShadow = "-8px 8px 8px rgba(0, 0, 0, 0.8)";
    x.style.padding = "0";
    x.innerHTML = `
    <div style="width: 100%; position: relative;">
        <div style="padding: 10px; font-family: 'Baloo Thambi 2', cursive; display: flex; justify-content: space-between;">
            <img style="width: 25%; align-self: center;" src="https://www.netflix-social.com/images/NS-Logo-Transparent.png" />
            <div style="align-self: center; width: 25%;">
                <button id="icon-select-button" style="width: 100%;">
                    <img style="width: auto; height: 40px; margin: auto;" id="icon-select-image" src="https://www.netflix-social.com/images/NS-Logo-Transparent.png" />
                </button>
            </div>
        </div>
    </div>`;
    wrapper.append(x);

    var iconContainer = document.createElement("div");
    iconContainer.id = "netflix_social_icon_select_container";
    iconContainer.style.scrollBehavior = "smooth";
    iconContainer.style.display = "none";
    iconContainer.style.flex = "1 1";
    iconContainer.style.flexDirection = "column";
    iconContainer.style.overflowY = "auto";
    iconContainer.style.overflowX = "hidden";
    iconContainer.style.padding = "10px";
    iconContainer.innerHTML = `<div>
        <p style="font-size: 20px; margin: 0;">Select an avatar</p>
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between;">
            <!-- AVAILABLE AVATARS -->
            <button class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Catwoman.png?t=1" /></button>
            <button class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Colossus.png?t=1" /></button>
            <button class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Cyclops.png?t=1" /></button>
            <button class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Hellboy.png?t=1" /></button>
            <button class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Raphael.png?t=1" /></button>
            <button class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Leonardo.png?t=1" /></button>
            <button class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Robocop.png?t=1" /></button>
            <button class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Storm.png?t=1" /></button>
        </div>

        <p style="font-size: 20px; margin: 10px 0 0;">Donator avatars (coming soon)</p>
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between;">
            <!-- DISABLED AVATARS -->
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Batman.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Baymax.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/CaptainAmerica.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Deadpool.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Flash.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Groot.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/HarleyQuin.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Hulk.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Ironman.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Joker.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Spiderman.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Superman.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Thor.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Wolverine.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/WolverinePlain.png?t=1" /></button>
            <button disabled class="avatar-icon"><img src="https://netflix-social.com/images/User_Icons/Wonderwoman.png?t=1" /></button>
        </div>
        
        <div style="font-family: 'Baloo Thambi 2', cursive; user-select: none; background: white; color: black; border: 1px solid grey; border-radius: 25px; padding: 15px; text-align: center; cursor: pointer; margin: 10px 5px 0px;" id="support_us">
            <img style="height: 15px; vertical-align: middle;" src="https://netflix-social.com/images/patreon.png" /> 
            <span style="vertical-align: middle; margin: 0 5px; font-size: 15px;">Support us on Patreon</span>
        </div>
    </div>`;

    var container = document.createElement("div");
    container.id = "netflix_social_chat_container";
    container.style.scrollBehavior = "smooth";
    container.style.width = "100%";
    container.style.display = "flex";
    container.style.flex = "1 1";
    container.style.flexDirection = "column";
    container.style.overflowY = "auto";
    container.style.overflowX = "hidden";
    container.innerHTML = `<div id="netflix_social_chat" style="width: 100%; flex: 1 1; box-shadow: inset 0px -7px 9px -7px rgba(0,0,0,0.5); padding: 5px 0 20px;">
    </div>`;

    var message_input = document.createElement("div");
    message_input.style.boxShadow = "0px -20px 30px -10px rgba(0,0,0,0.4)";
    message_input.style.zIndex = "100";
    message_input.id = "netflix_social_message_input";
    message_input.innerHTML = `
    <div style="width: 100%;">
        <div style="width: 100%; display: flex; margin: auto; background: rgb(14, 14, 14); position: relative;">
            <div id="option-menu" style="display: none; position: absolute; z-index: 100; bottom: 100%; width: 100%; background: rgb(14, 14, 14); border-bottom: 1px solid gray; color: grey;">
                <div style="display: flex; padding: 5px; justify-content: space-between; overflow-x: auto;">
                    <button class="add-emoji-button">😂</button>
                    <button class="add-emoji-button">🥰</button>
                    <button class="add-emoji-button">😖</button>
                    <button class="add-emoji-button">🤯</button>
                    <button class="add-emoji-button">💩</button>
                </div>
            </div>
            <div style="display: flex; align-items: center; padding: 10px; border-right: 1px solid grey;" id="option-menu-action">
                <i style="margin: auto; pointer-events: none;" class="material-icons">sentiment_satisfied_alt</i>
            </div>
            <input id="netflix_social_chat_message" type="text" placeholder="Your message..." style="font-family: 'Baloo Thambi 2', cursive; width: 100%; font-size: 20px;
            border: none; padding: 10px 5px 5px; background: rgb(14, 14, 14); color: white; outline: none;" autocomplete="off" />
        </div>
    </div>`;

    /*
    SEND BUTTON
    <button id="netflix_social_send_message_button" style="position: relative;
        text-align: center;
        background: #db4d48;
        border: none;
        color: white;
        outline: none;
        padding: 5px 10px;
        margin: 0;">SEND</button>

    OPTIONS
    <div class="option-menu-button">
                        <i class="material-icons">sentiment_satisfied_alt</i>
                    </div>
                    <div class="option-menu-button">
                        <i class="material-icons">group</i>
                    </div>

    DONATE
        <div style="font-family: 'Baloo Thambi 2', cursive; user-select: none; background: white; color: black; border: 1px solid grey; border-radius: 25px; padding: 15px; text-align: center; cursor: pointer; margin: 10px 5px 0px;" id="support_us">
            <img style="height: 15px; vertical-align: middle;" src="https://netflix-social.com/images/patreon.png" /> 
            <span style="vertical-align: middle; margin: 0 5px; font-size: 15px;">Support us on Patreon</span>
        </div>
  */

    x.append(iconContainer);
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

    document.getElementById("support_us").addEventListener('click', () => {
        window.open("https://www.patreon.com/netflixsocial", '_blank');
    });

    //Avatar

    var iconSelect = document.getElementById('icon-select-button');
    if (iconSelect) {
        iconSelect.addEventListener('click', () => {
            if (pickingIcon) {
                hideIconSelectMenu();
            } else {
                openIconSelectMenu();
            }
        });
    }

    var avatars = document.getElementsByClassName("avatar-icon");
    for (var i = 0; i < avatars.length; i++) {
        var button = avatars[i];
        button.addEventListener('click', (event) => {
            if (!event || !event.srcElement) return;
            changeAvatar(event.srcElement.getAttribute("src"));
        });
    }

    // Emojis

    var optionButton = document.getElementById("option-menu-action");
    var optionMenu = document.getElementById("option-menu");
    var chatBar = document.getElementById("netflix_social_chat_message");
    if (optionButton && optionMenu) {
        chatBar.addEventListener("mouseover", (event) => {
            optionButton.style.background = 'rgb(14, 14, 14)';
        });

        optionMenu.addEventListener("mouseover", (event) => {
            openOptionMenu();
        });

        optionMenu.addEventListener("mouseout", (event) => {
            usingOptions = false;
            if(!event.toElement) return;
            if ((event.toElement.id != "option-menu-action" && event.toElement.id != "netflix_social_chat_message"))
                    document.getElementById('option-menu').style.display = "none";
        });

        optionButton.addEventListener("mouseenter", (event) => {
            optionMenuHover(event.srcElement);
        });

        optionButton.addEventListener("mouseout", (event) => {
            console.log('out');
            optionButton.style.background = 'rgb(14, 14, 14)';
            if(!event.toElement) return;
            if ((event.toElement.id != "option-menu-action" && event.toElement.id != "netflix_social_chat_message"))
                    optionMenuHoverLeave(event.srcElement);
        });

        var emojis = document.getElementsByClassName("add-emoji-button");
        for (var i = 0; i < emojis.length; i++) {
            var button = emojis[i];
            button.addEventListener('click', (event) => {
                if (!event || !event.srcElement) return;
                addEmoji(event.srcElement.innerText);
            });
        }

        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
        .add-emoji-button {
            margin: 5px;
            outline: none;
            background: none;
            font-size: 30px;
            padding: 0;
            border: none;
            cursor: pointer;
            width: 20%;
        }
        
        #icon-select-button {
            outline: none;
            background: none;
            padding: 0;
            border: none;
            cursor: pointer;
        }
        
        #icon-select-button:hover img{
            filter: contrast(50%);
        }
        
        .avatar-icon {
            outline: none;
            background: none;
            padding: 0;
            border: none;
            cursor: pointer;
            flex: 1 0 21%;
            margin: 5px;
        }
        
        .avatar-icon img {
            width: 100%;
            flex: 1 0 21%; /* explanation below */
        }
        
        .avatar-icon:disabled {
            opacity: 0.3;
        }`;
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    var chatBar = document.getElementById("netflix_social_chat_message");
    chatBar.focus();

    var sendButton = document.getElementById("netflix_social_send_message_button");
    if (!sendButton) return;
    sendButton.addEventListener("click", (event) => {
        sendMessage();
    });
}

function addEmoji(emoji) {
    var chatBar = document.getElementById("netflix_social_chat_message");
    if (!chatBar) return;
    chatBar.value += emoji;
    chatBar.focus();
}

function optionMenuHover(element) {
    element.style.background = 'red';
    usingOptions = true;
    openOptionMenu();
}

function optionMenuHoverLeave(element) {
    element.style.background = 'rgb(14, 14, 14)';
    if (usingOptions)
        document.getElementById('option-menu').style.display = "none";
}

function openOptionMenu() {
    usingOptions = true;
    document.getElementById('option-menu').style.display = "block";
}

function openIconSelectMenu() {
    pickingIcon = true;
    var chatContainer = document.getElementById('netflix_social_chat_container');
    if (chatContainer)
        chatContainer.style.display = "none";

    var chatBar = document.getElementById("netflix_social_message_input");
    chatBar.style.display = "none";

    var iconSelectContainer = document.getElementById('netflix_social_icon_select_container');
    if (iconSelectContainer)
        iconSelectContainer.style.display = "flex";
}

function hideIconSelectMenu() {
    pickingIcon = false;
    var iconSelectContainer = document.getElementById('netflix_social_icon_select_container');
    if (iconSelectContainer)
        iconSelectContainer.style.display = "none";

    var chatBar = document.getElementById("netflix_social_message_input");
    chatBar.style.display = "block";
    chatBar.focus();

    var chatContainer = document.getElementById('netflix_social_chat_container');
    if (chatContainer)
        chatContainer.style.display = "flex";
}

function changeAvatar(avatarSrc) {
    var avatarSync = document.getElementById('netflix_social_avatar_change');
    if (!avatarSync) return;
    avatarSync.innerText = avatarSrc;
    avatarSync.click();
    hideIconSelectMenu();
    var chatBar = document.getElementById("netflix_social_chat_message");
    chatBar.focus();
}

function sendMessage() {
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
