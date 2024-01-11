/**
 * Получает объект с данными задачи, проверяет установлен ли заголовок
 */
function getTaskData() {
    chrome.storage.local.get('message', function (result) {
        var message = result.message;
        if (message.title) {
            getProject(createTabForNewTask);
        }
    });
}

function getFirstTabId() {
    chrome.storage.local.get('firstTab', function (result) {
        var firstTab = result.firstTab;
        if (firstTab) {
            chrome.tabs.get(firstTab, function (tab) {
                chrome.tabs.sendMessage(tab.id, {action: "editHPSMTask"}, function (response) {
                });
            });
        }
    });
}

function getRedmineTabIdAndRunScript() {
    chrome.storage.local.get('redmineTab', function (result) {
        var redmineTab = result.redmineTab;
        if (redmineTab) {
            chrome.tabs.onUpdated.addListener(function (tabId, info) {
                if (tabId == redmineTab && info.status == "complete") {
                    chrome.tabs.executeScript(redmineTab, {
                        file: 'taskCreator.js'
                    });
                    chrome.storage.local.remove('redmineTab');
                }
            });
        }
    });
}

/**
 * получает данные проекта
 */
function getProject(callback) {
    chrome.storage.local.get('project', ({project}) => callback(project));
}

/**
 * создает новую вкладку в redmine для создания новой задачи
 */
function createTabForNewTask(project) {
    chrome.tabs.create({
        url: `https://rmine.net/projects/${project.id}/issues/new`
    }, function (tab) {
        var numCurTab = tab.id;

        //сохраняем вкладку redmine
        chrome.storage.local.set({redmineTab: numCurTab});

        chrome.tabs.executeScript(null, {file: 'taskCreator.js'});
    });
}

/**
 * Обработчик сообщений от скрипта taskCreator.js
 */
chrome.extension.onMessage.addListener(
    function (request, sender, send_response) {
        //если это прикрепленные к инциденту файлы, то скачиваем
        if (request.files) {
            chrome.storage.local.set({hasFiles: true});
            request.files.map(function (url) {
                chrome.downloads.download({
                    url: url,
                    saveAs: false
                });
            });
        } else if (request.create === "on") {
            getTaskData();
        } else if (request.getRedmineTaskId === "on") {
            getRedmineTabIdAndRunScript();
        } else if (request.return === "on") {
            getFirstTabId();
        }
    });


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab && tab.url
        && (tab.url.indexOf('sm.mos') === -1
            && tab.url.indexOf('sm.eaist.mos') === -1
            && tab.url.indexOf('sm.tender.mos') === -1
            && tab.url.indexOf('212.11.152.7') === -1)
    ) {
        return false;
    }
    chrome.tabs.executeScript(null, {file: 'onUpdate.js'});
});