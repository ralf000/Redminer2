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
                        chrome.storage.sync.set({notSave: 'on'});
                    else
                        chrome.storage.sync.set({notSave: 'off'});

                    chrome.storage.sync.set({project: $(this).attr('id')});
                    chrome.tabs.executeScript(null, {file: 'taskCreator.js'});
                });
            }
        }
    });
}

function saveCurrentTab() {
        chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
            var activeTab = arrayOfTabs[0];
            if (activeTab.url.indexOf('sm.mos') === -1)
                return false;
            var activeTabId = activeTab.id;
            chrome.storage.sync.set({firstTab: activeTabId});
        });
}

$(function () {
    init();
});