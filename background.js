/**
 * Получает объект с данными задачи, проверяет установлен ли заголовок
 */
function getTaskData() {
    chrome.storage.local.get('message', function (result) {
        var message = result.message;
        if (message.title) {
            getProjectId();
        }
    });
}

function getFirstTabId() {
    chrome.storage.local.get('firstTab', function (result) {
        var firstTab = result.firstTab;
        if (firstTab) {
            chrome.tabs.get(firstTab, function (tab) {
                //если нужно перейти во вкладку то highlight
                // chrome.tabs.highlight({'tabs': tab.index}, function() {
                //     chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                chrome.tabs.sendMessage(tab.id, {action: "editHPSMTask"}, function (response) {
                });
                // });
                // });
            });
        }
    });
}

function getRedmineTabIdAndRunScript() {
    chrome.storage.local.get('redmineTab', function (result) {
        var redmineTab = result.redmineTab;
        if (redmineTab) {
            chrome.tabs.onUpdated.addListener(function (tabId, info) {
                if (tabId === redmineTab && info.status == "complete") {
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
 * получает id проекта для создания задачи в этом проекте
 */
function getProjectId() {
    chrome.storage.local.get('project', function (result) {
        var project = result.project;
        if (project) {
            createTabForNewTask(project);
        }
    });
}

/**
 * создает новую вкладку в redmine для создания новой задачи
 */
function createTabForNewTask(projectId) {
    chrome.tabs.create({
        url: "https://redmine.itopcase.ru/projects/" + projectId + "/issues/new"
    }, function (tab) {
        var numCurTab = tab.id;

        //сохраняем вкладку redmine
        chrome.storage.local.set({redmineTab: numCurTab});

        chrome.tabs.executeScript(null, {file: 'taskCreator.js'});
    });
    chrome.storage.local.remove('project');
}

/**
 * Обработчик сообщений от скрипта taskCreator.js
 */
chrome.extension.onMessage.addListener(
    function (request, sender, send_response) {
        if (request.create === "on") {
            getTaskData();
        } else if (request.getRedmineTaskId === "on") {
            getRedmineTabIdAndRunScript();
        } else if (request.return === "on") {
            getFirstTabId();
        }
    });


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.url.indexOf('sm.mos'))
        chrome.tabs.executeScript(null, {file: 'onUpdate.js'});
});