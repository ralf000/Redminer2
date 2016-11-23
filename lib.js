/**
 * переводит первый символ в верхний регистр
 * @param string
 * @returns {string}
 */
function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getActiveTabIdByHPSM() {
    var tabActive = $('ul.x-tab-strip-top li.x-tab-strip-active');
    if (tabActive.length === 0)
        return false;
    var id = tabActive.attr('id');
    id = id.split('__');
    return id[id.length-1];
}

function getActiveWindowByHPSM() {
    var tabId = getActiveTabIdByHPSM();
    return (tabId) ? $('.x-tab-panel-bwrap').find('#'+tabId) : false;
}

function getActiveFrameByHPSM() {
    var w = getActiveWindowByHPSM();
    return (w) ? w.find('iframe').contents() : false;
}

function getActiveFormByHPSM() {
    var frame = getActiveFrameByHPSM();
    return (frame) ? frame.find('form#topaz') : false;
}
