function init() {
    var block = $('#projects');
    var url = 'projects.json';
    var btn;

    saveCurrentTab();

    $.getJSON(url, function (data, status, jqXHR) {
        if (status === 'success') {
            for (var key in data) {
                btn = block.append('' +
                    '<div class="input-group">' +
                    '<button class="btn btn-block ' + data[key].btn + ' ' + data[key].link + '" id="' + data[key].link + '">'
                    + data[key].name +
                    '</button>' +
                    '<span class="input-group-btn">' +
                    '<button class="btn btn-default ' + data[key].link + ' not-save" type="button" id="' + data[key].link + '">X</button>' +
                    '</span>' +
                    '</div>'
                );
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