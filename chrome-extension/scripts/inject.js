console.log("inject.js running");
var s = document.createElement('script');
s.src = chrome.runtime.getURL('/scripts/netflix-sync.js');
(document.head || document.documentElement).appendChild(s);