function parseTaskFromHPSM() {
    var form = getActiveFormByHPSM();//lib.js
    if (!form) return false;

    var taskId = form.find('[ref="instance/incident.id"] span').text();
    if (!taskId)
        taskId = form.find('span[ref="instance/number"]').children('span').text();

    var title = form.find('input[name="instance/title"]').val();
    if (!title) {
        title = form.find('input[name="instance/brief.description"]').val();
    }
    title = ucFirst(title);

    var body = form.find('textarea[name="instance/description/description"]').text();
    if (!body)
        body = form.find('textarea[name="instance/action/action"]').text();

    console.log(form);
    if (!taskId || !title || !body)
        return false;

    var message = {
        taskId: taskId ? taskId : '',
        title: title,
        body: body
    };
    return message;
}

function parseTaskFromOutlook() {
    var all = $('.allowTextSelection.customScrollBar.scrollContainer').children().eq(1);
    var title = all.find('.rpHighlightSubjectClass').text();
    var body = $($('.conductorContent div[role=document] #Item\\.MessageUniqueBody')[0])
        .text()
        .trim()
        .replace(/(\n\r*){2,}/g, '\n')
        .replace(/<!--(.\n*\r*)+-->/g, '');
    var message = {title: title, body: body};
    return message;
}

/**
 * Получает объект с данными задачи, проверяет установлен ли заголовок
 */
function getTaskData() {
    chrome.storage.local.get('message', function (result) {
        var message = result.message;
        if (message.title) {
            // getSurname(message);
            createTask(message);
        } else {
            throw new Error('Отсутствует заголовок для создаваемой задачи');
        }
    });
}

function getNotSaveVar(callback) {
    chrome.storage.local.get('notSave', function (result) {
        var notSave = result.notSave;
        if (notSave === 'off') {
            chrome.storage.local.remove('notSave');
            callback();
        }
    });
}

/**
 * Заполняет поля и создает новую задачу в redmine
 * @param message object
 */
function createTask(message) {
    $('select#issue_tracker_id option:contains("Поддержка")').attr('selected', 'selected').change().click();
    $('input#issue_subject').val(message.title);
    $('textarea#issue_description').val(message.body);
    $('input#issue_estimated_hours').val(1);
    $('select#issue_assigned_to_id option:contains("<< мне >>")').attr('selected', 'selected');

    $('#attributes').append('<div class="splitcontent">\n\
            <div class="splitcontentleft">\n\
            <p><label for="issue_custom_field_values_11"><span title="Указывается номер связанной задачи например из HPSM">Номер из внешней системы</span></label><input type="text" name="issue[custom_field_values][11]" id="issue_custom_field_values_11" value="" class="string_cf"></p>\n\
            </div><div class="splitcontentright">\n\
            </div>\n\
            </div>');
    $('input#issue_custom_field_values_11').val(message.taskId ? message.taskId : '');
    chrome.storage.local.remove('message');

    //если таск из hpsm, то переменная firstTab не пустая
    chrome.storage.sync.get('firstTab', function (result) {
        var firstTab = result.firstTab;
        if (firstTab) {
            chrome.extension.sendMessage({getRedmineTaskId: "on"});
        } else {
            clean();
        }
        //если переменная notSave в true то сохранять таск не нужно
        getNotSaveVar(function () {
            $('input[type=submit]')[0].click();
        });

    });

}

/**
 * @param callback function
 * должна возвращать объект задачи вида {title: 'title', body: 'body', [ taskId: taskId]}
 */
function parseAndSend(callback) {
    var msg = callback();
    if (!msg)
        return false;
    chrome.storage.local.set({message: msg});
    chrome.extension.sendMessage({create: "on"});
}

function clean() {
    chrome.storage.local.remove('firstTab');
    chrome.storage.local.remove('project');
    chrome.storage.local.remove('redmineTab');
    chrome.storage.local.remove('redmineUrl');
    chrome.storage.sync.remove('notSave');
}

function setRedmineTaskId() {
    chrome.storage.local.get('redmineUrl', function (result) {
        var redmineUrl = result.redmineUrl;
        if (redmineUrl) {
            var form = getActiveFormByHPSM();
            form.find('input[name="instance/hpc.additional.field.2"]').val(redmineUrl);
            clean();

            var w = getActiveWindowByHPSM();
            if (!w)
                throw new Error('Не удалось получить текущее окно');
            var btn = w.find('button:contains("Сохранить")');
            if (!btn)
                throw new Error('Не удалось получить кнопку "Сохранить"');
            btn.click();
        }
    });
}

function checkRedmineUrlTask() {
    return location.href.match(/\/issues\/\d{3,}/i);
}

/**
 * получает сообщения из background.js
 */
chrome.extension.onMessage.addListener(
    function (request, sender, send_response) {
        if (request.action === "editHPSMTask" && location.host.indexOf('sm.mos') > -1) {
            try {
                setRedmineTaskId();
            } catch (e) {
                console.log('Ошибка ' + e.name + ":" + e.message + "\n" + e.stack);
            }
        }
    });


if (location.host.indexOf('outlook') > -1) {
    parseAndSend(parseTaskFromOutlook);
} else if (location.host.indexOf('sm.mos') > -1) {
    parseAndSend(parseTaskFromHPSM);
} else if (location.host.indexOf('redmine') > -1) {
    if (checkRedmineUrlTask()) {
        //сохраняем ссылку на задачу в redmine
        chrome.storage.local.set({redmineUrl: location.href});
        //можно переходить обратно в hpsm
        chrome.extension.sendMessage({return: "on"});
    } else {
        getTaskData();
    }
}

