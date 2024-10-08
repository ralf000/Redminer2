const LOGGER = {
    log(message, date) {
        date = date || (new Date().toLocaleString());
        console.log(`${date}: ${message}`);
        this.set(date, message);
    },

    error(message, date) {
        message = message && message.message ? message.message : message;
        date = date || (new Date().toLocaleString());
        console.error(`${date}: ${message}`);
        this.set(date, message);
    },

    async set(date, message) {
        let logs = await this.all();
        if (logs.length) {
            const {date: prevDate, message: prevMessage} = logs[logs.length - 1]
            //if the last log is equal to the new one - do not add
            if (prevMessage === message) return;
            logs.push({date, message});
        } else {
            logs = [{date, message}]
        }
        STORAGE.setSessionParam({logs});
    },

    all() {
        return STORAGE.getSessionParam('logs', []);
    },

    async download() {
        let logs = await this.all();
        let text = '';
        for (let key in logs) {
            text += `${logs[key].date} | ${logs[key].message}\n`;
        }
        const blob = new Blob([text], {type: 'text/plain'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `4me-auto-logs-${new Date().toLocaleDateString()}${new Date().toLocaleTimeString()}.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
    }
};