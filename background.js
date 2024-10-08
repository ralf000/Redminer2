async function getParam(name, defaultValue) {
    defaultValue = defaultValue || null;
    const result = await chrome.storage.sync.get(name);
    return result[name] || defaultValue;
}

function setParam(data) {
    chrome.storage.sync.set(data);
}

function removeParam(name) {
    chrome.storage.sync.remove(name);
}

async function getRedmineTabIdAndRunScript() {
    const redmineTab = await getParam('redmineTab');
    if (redmineTab) {
        chrome.tabs.onUpdated.addListener((tabId, info) => {
            if (tabId == redmineTab && info.status === "complete") {
                chrome.scripting.executeScript({
                    target: {tabId: redmineTab, allFrames: true},
                    files: ['taskCreator.js'],
                });
                removeParam('redmineTab')
            }
        });
    }
}

/**
 * создает новую вкладку в redmine для создания новой задачи
 */
async function createTabForNewTask(project) {
    const tab = await chrome.tabs.create({url: `https://rmine.net/projects/${project.id}/issues/new`, active: true});
    chrome.scripting.executeScript({
        target: {tabId: tab.id, allFrames: true},
        files: ['taskCreator.js'],
    });
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.session.setAccessLevel({accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS'});
});

/**
 * Обработчик сообщений от скрипта taskCreator.js
 */
chrome.runtime.onMessage.addListener(
    async ({files, create, getRedmineTaskId, return: returnToHPSM}) => {
        //если это прикрепленные к инциденту файлы, то скачиваем
        if (files) {
            setParam({hasFiles: true});
            files.map(
                url => chrome.downloads.download({url: url, saveAs: false})
            );
        } else if (create === "on") {
            //Получает объект с данными задачи, проверяет установлен ли заголовок
            const message = await getParam('message');
            if (message.title) {
                //получает данные проекта
                const project = await getParam('project');
                await createTabForNewTask(project);
            }
        } else if (getRedmineTaskId === "on") {
            await getRedmineTabIdAndRunScript();
        } else if (returnToHPSM === "on") {
            const firstTab = await getParam('firstTab');
            if (firstTab) {
                chrome.tabs.get(firstTab, tab => {
                    chrome.tabs.sendMessage(tab.id, {action: "editHPSMTask"})
                });
            }
        }
    });


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab && tab.url
        && (tab.url.indexOf('sm.mos') === -1
            && tab.url.indexOf('sm.eaist.mos') === -1
            && tab.url.indexOf('sm.tender.mos') === -1
            && tab.url.indexOf('212.11.152.7') === -1)
    ) {
        return false;
    }
    chrome.scripting.executeScript({
        target: {tabId: tabId, allFrames: true},
        files: ['onUpdate.js'],
    });
});