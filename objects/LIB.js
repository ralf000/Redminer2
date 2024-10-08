const LIB = {
    wait(callback, delay, maxWaiting) {
        return new Promise((resolve, reject) => {
            delay = delay || 50;
            var timeCounter = 0;
            maxWaiting = maxWaiting || 1000 * 5;
            var interval = setInterval(function () {
                if (callback()) {
                    clearInterval(interval);
                    resolve()
                }
                timeCounter += delay;
                if (timeCounter >= maxWaiting) {
                    clearInterval(interval);
                    reject();
                }
            }, delay)
        });
    },

    async handleCounters(name, counter, type) {
        type = type || 'timeout';
        let counters = await STORAGE.getParam('counters', {});
        if (counters[name]) {
            const {id, type} = counters[name];
            type === 'timeout' ? clearTimeout(id) : clearInterval(id);
        }
        const counterId = counter(() => counterId);
        const newCounter = {};
        newCounter[name] = {id: counterId, type: type};
        STORAGE.setParam({counters: {...counters, ...newCounter}});
    },

    /**
     * переводит первый символ в верхний регистр
     * @param string
     * @returns {string}
     */
    ucFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    /**
     * Возращает id для активного окна, вычисляемый по активной вкладке
     * @returns string id
     */
    getActiveTabIdByHPSM() {
        var tabActive = $('ul.x-tab-strip-top li.x-tab-strip-active');
        if (tabActive.length === 0)
            return null;
        var id = tabActive.attr('id');
        id = id.split('__');
        return id[id.length - 1];
    },

    /**
     * Возвращает активную область
     * @returns object jquery active area
     */
    getActiveWindowByHPSM() {
        var tabId = this.getActiveTabIdByHPSM();
        return (tabId && tabId.length > 0) ? $('.x-tab-panel-bwrap').find('#' + tabId) : $('.x-tab-panel-bwrap');
    },

    /**
     * Возвращает активный iframe
     * @returns object jquery iframe
     */
    getActiveFrameByHPSM() {
        let w = this.getActiveWindowByHPSM();
        return w ? w.find('iframe').contents() : false;
    },

    /**
     * Возвращает активную форму
     * @returns object jquery active form
     */
    getActiveFormByHPSM() {
        let frame = this.getActiveFrameByHPSM();
        return (frame.find('form#topaz').length > 0)
            ? frame.find('form#topaz')
            : frame.contents().find('iframe.ux-mif').contents().find('form#topaz');
    },

    isHPSMUrl() {
        return location.href.indexOf('sm.eaist.mos') !== -1
            || location.href.indexOf('sm.mos') !== -1
            || location.href.indexOf('sm.tender.mos') !== -1
            || location.href.indexOf('212.11.152.7') !== -1;
    },

    is4meUrl() {
        return location.href.indexOf('4me.mos.ru') !== -1
    },

    isOldHPSM() {
        return location.href.indexOf('sm.mos') !== -1
    },

    isOutlookUrl() {
        return location.host.indexOf('outlook') !== -1
    },

    isRedmineUrl() {
        return location.host.indexOf('rmine') !== -1
            || location.host.indexOf('redmine') !== -1;
    },

    isNewHPSMUrl() {
        return location.href.indexOf('sm.eaist.mos.ru') !== -1
            || location.href.indexOf('sm.tender.mos.ru') !== -1
            || location.href.indexOf('212.11.152.7') !== -1;
    },

    isOldOutlook() {
        return $('.allowTextSelection.customScrollBar.scrollContainer').children().eq(1).length;
    },

    checkRedmineUrlTask() {
        return location.href.match(/\/issues\/\d{3,}/i);
    },
}