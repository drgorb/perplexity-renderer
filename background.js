chrome.action.onClicked.addListener(() => {
    chrome.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: 480,
        height: 640
    });
});