var res = navigator.mediaDevices.getUserMedia({ audio: true, video: true }, (stream) => {
    console.log(stream);
}, (err) => {
    console.log(err);
});