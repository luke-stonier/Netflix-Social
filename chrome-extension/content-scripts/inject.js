console.log("inject.js");
var s = document.createElement('script');
s.src = chrome.runtime.getURL('/content-scripts/netflix-sync.js');
(document.head || document.documentElement).appendChild(s);