console.log("inject-stream.js");

if (document.getElementById('netflix_social_stream')) {
    
}

var ifr = document.createElement('iframe');
ifr.id = "netflix_social_stream";
ifr.setAttribute('allow', 'microphone; camera'); //necessary for cross-origin frames that request permissions
ifr.style.display = 'none';
ifr.src = chrome.runtime.getURL('../pages/content-page.html');
document.body.appendChild(ifr);