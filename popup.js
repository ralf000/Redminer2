function init() {
    var block = $('#projects');
    var url = 'projects.json';
    var btn;

    saveCurrentTab();

    $.getJSON(url, function (data, status, jqXHR) {
        if (status === 'success') {
            for (var key in data) {
                btn = block.append('<button class="btn btn-default btn-block" id="' + data[key].link + '">' + data[key].name + '</button>');
            }
            for (key in data) {
                $('#' + data[key].link).on('click', function () {
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