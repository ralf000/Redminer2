function init() {
    var block = $('#projects');
    var url = 'projects.json';
    var btn;

    saveCurrentTab();

    $.getJSON(url, function (data, status, jqXHR) {
        if (status === 'success') {
            for (var key in data) {
                btn = block.append('<button class="btn btn-block ' + data[key].btn + ' ' + data[key].link + ' not-save" id="' + data[key].link + '">' + data[key].name + '</button>');
            }
            for (key in data) {
                $('.' + data[key].link).on('click', function () {
                    if ($(this).hasClass('not-save'))
                        chrome.storage.local.set({notSave: 'on'});
                    else
                        chrome.storage.local.set({notSave: 'off'});

                    chrome.storage.local.set({project: $(this).attr('id')});
                    chrome.tabs.executeScript(null, {file: 'taskCreator.js'});
                });
            }
        }
    });
}

function saveCurrentTab() {
        chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
            var activeTab = arrayOfTabs[0];
            if (activeTab.url
                && (activeTab.url.indexOf('sm.mos') === -1
                    && activeTab.url.indexOf('sm.eaist.mos') === -1
                    && activeTab.url.indexOf('sm.tender.mos') === -1
                    && activeTab.url.indexOf('212.11.152.7') === -1)
            ) {
                return false;
            }
            var activeTabId = activeTab.id;
            chrome.storage.local.set({firstTab: activeTabId});
        });
}

$(function () {
    init();
});