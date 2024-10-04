async function getParam(name, defaultValue) {
    defaultValue = defaultValue || null;
    const result = await chrome.storage.sync.get(name);
    return result[name] || defaultValue;
}

function setParam(data) {
    chrome.storage.sync.set(data);
}

async function saveCurrentTab() {
    const [tab] = await chrome.tabs.query({active: true});
    setParam({firstTab: tab.id});
}

async function init() {
    let block = $('#projects');
    let url = 'projects.json';

    await saveCurrentTab();

    $.getJSON(url, (data, status) => {
        if (status !== 'success') return false;
        for (let key in data) {
            block.append('<button class="btn btn-block ' + data[key].btn + ' ' + data[key].id + ' not-save" id="' + data[key].id + '">' + data[key].name + '</button>');
            $('.' + data[key].id).on('click', async ()=> {
                setParam({project: data[key]});
                const tab = await getParam('firstTab');
                chrome.scripting.executeScript({
                    target: {tabId: tab, allFrames: true},
                    files: ['taskCreator.js'],
                });
            });
        }
    });
}

$(() => init());