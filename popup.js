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
                    '<button class="btn btn-default ' + data[key].link + ' not-save" type="button" id="' + data[key].link + '"><span class="glyphicon glyphicon-remove"></span></button>' +
                    '</span>' +
                    '</div>'
                );
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
        chrome.tabs.getSelected(null, function (tab) {
            if (tab.url.indexOf('sm.mos') === -1)
                return false;
            tab = tab.id;
            chrome.storage.local.set({firstTab: tab});
        });
}

$(function () {
    init();
});