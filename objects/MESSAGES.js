const MESSAGES = {
    async send(data) {
        return await chrome.runtime.sendMessage(data);
    },

    get(callback) {
        chrome.runtime.onMessage.addListener(callback);
    }
};