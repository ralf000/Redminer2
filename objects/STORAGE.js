const STORAGE = {
    setParam(data) {
        chrome.storage.sync.set(data);
    },
    async getParam(name, defaultValue, remove) {
        defaultValue = defaultValue || null;
        const result = await chrome.storage.sync.get(name);
        if (remove) {
            this.removeParam(name);
        }
        return result[name] || defaultValue;
    },
    removeParam(name) {
        chrome.storage.sync.remove(name);
    },
    setSessionParam(data) {
        chrome.storage.session.set(data);
    },
    async getSessionParam(name, defaultValue) {
        defaultValue = defaultValue || null;
        const result = await chrome.storage.session.get(name);
        return result[name] || defaultValue;
    },
    removeSessionParam(name) {
        chrome.storage.session.remove(name);
    },
}