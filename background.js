// https://stackoverflow.com/questions/19758028/chrome-extension-get-dom-content

chrome.browserAction.onClicked.addListener(function (tab) {
    if (tab.url==="https://app.cryptoblades.io/#/combat") {
        chrome.tabs.sendMessage(tab.id, {});
    }
});