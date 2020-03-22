chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    // switch on message

    var currentTime = document.getElementById("current_time").innerText;
    sendResponse({data: currentTime});
});