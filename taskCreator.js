function parseTaskFromHPSM() {
    var form = getActiveFormByHPSM();
    if (!form) return false;

    //Код инцидента/обращения
    var taskId = form.find('[ref="instance/incident.id"] span').text()
        || form.find('span[ref="instance/number"]').children('span').text()
        || form.find('input[name="instance/number"]').val();
    if (!taskId) return false;
    //заголовок
    var title = form.find('input[name="instance/title"]').val()
        || form.find('input[name="instance/brief.description"]').val()
        || '';
    title = ucFirst(title);
    //предельный срок
    var period = form.find('span[ref="instance/next.ola.breach"]').children('span').text()
        || form.find('input[name="instance/next.ola.breach"]').val();
    if (period) {
        period = period.split(' ')[0].split('.');
    }
    //приоритет
    var priority = form.find('span[ref="instance/priority.code"]').children('span').text()
        || form.find('input[name="instance/priority.code"]').val()
        || form.find('input[alias="instance/priority.code"]').val();

    if (priority) {
        priority = priority.match(/\d+/)[0];
    }

    var body = form.find('textarea[name="instance/description/description"]').text()
        || form.find('textarea[name="instance/action/action"]').text()
        || form.find('textarea[ref="instance/action/action"]').text()
        || '';

    var company = form.find('input[alias="instance/company.full.name"]').val() || '';
    if (company) company = '*Имя компании*: ' + ucFirst(company) + "\n";
    var companyInn = form.find('input[alias="instance/company"]').val() || '';
    if (companyInn) companyInn = '*ИНН компании*: ' + companyInn + "\n";
    var companyKpp = form.find('input[name="instance/company.kpp"]').val() || '';
    if (companyKpp) companyKpp = '*КПП компании*: ' + companyKpp + "\n";

    var links = '';
    $.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function (index, fieldNum) {
        var link = form.find('input[name="instance/link.to.system/link.to.system[' + fieldNum + ']"]');
        if (link.length && link.val().length) {
            links += link.val() + "\n";
        }
    });
    if (links) links = '*Ссылки на системы*: ' + "\n" + links;

    var createdFromIncidentId = form.find('input[alias="instance/incident.id"]').val() || '';
    if (createdFromIncidentId) createdFromIncidentId = '*Создано из обращения*: ' + createdFromIncidentId + "\n";

    if (company || companyInn || companyKpp || links) {
        var additionalInfo = "\n\n" + company + companyInn + companyKpp + links + createdFromIncidentId
    }

    return {
        taskId: taskId ? taskId : '',
        title: title,
        period: period,
        priority: priority,
        body: body + additionalInfo
    };
}

//парсит файлы
function addFilesToMessage() {
    var form = getActiveFormByHPSM();
    var filesFrame = form.find('[title="Вложения обращения"]');
    if (filesFrame.length) {
        var files = filesFrame.contents().find('a.shadowFocus');
        var parsedFiles = {};
        files.each(function (id, file) {
            file = $(file);
            var name = file.find('.xTableCell');
            if (!name) return true;//continue
            var url = location.origin + '/' + location.pathname.split('/')[1] + '/servlet/' + file.attr('href');
            fetch(url)
                .then(response => response.blob())
                .then(data => {
                    parsedFiles[name] = data;
                    var message = parseTaskFromHPSM();
                    message['files'] = parsedFiles;
                    return message;
                });
        });
    }
}

function isOldOutlook() {
    return $('.allowTextSelection.customScrollBar.scrollContainer').children().eq(1).length;
}

function parseTaskFromOldOutlook() {
    var all = $('.allowTextSelection.customScrollBar.scrollContainer').children().eq(1);
    var title = all.find('.rpHighlightSubjectClass').text();
    var body = $($('.conductorContent div[role=document] #Item\\.MessageUniqueBody')[0])
        .text()
        .trim()
        .replace(/(\n\r*){2,}/g, '\n')
        .replace(/<!--(.\n*\r*)+-->/g, '');
    return {title: title, body: body};
}

function parseTaskFromNewOutlook() {
    var bodyBlock = $('[role=main]');
    var title = bodyBlock.children().first().text();
    var text = bodyBlock.children().eq(1).find('.allowTextSelection').eq(1).text();
    return {title: title, body: text};
}


function parseTaskFromOutlook() {
    return isOldOutlook() ? parseTaskFromOldOutlook() : parseTaskFromNewOutlook();
}

/**
 * Получает объект с данными задачи, проверяет установлен ли заголовок
 */
function getTaskData() {
    chrome.storage.sync.get('message', function (result) {
        var message = result.message;
        if (message.title) {
            createTask(message);
        } else {
            throw new Error('Отсутствует заголовок для создаваемой задачи');
        }
    });
}

function getNotSaveVar(callback) {
    chrome.storage.sync.get('notSave', function (result) {
        var notSave = result.notSave;
        if (notSave === 'off') {
            chrome.storage.sync.remove('notSave');
            callback();
        }
    });
}

/**
 * Заполняет поля и создает новую задачу в redmine
 * @param message object
 */
function createTask(message) {
    console.log(message);
    $('select#issue_tracker_id option:contains("Поддержка")').attr('selected', 'selected').change().click();
    $('input#issue_subject').val(message.taskId + '. ' + message.title);
    if (message.period) {
        $('input#issue_due_date').val('20' + message.period[2] + '-' + message.period[1] + '-' + (message.period[0] - 1));
    }
    if (message.priority) {
        var rmPriority = 2;
        if (message.priority == 3) {
            rmPriority = 4;
        } else if (message.priority == 1 || message.priority == 2) {
            rmPriority = 5;
        }
        $('select#issue_priority_id option[value='+rmPriority+']').prop('selected', true);
    }

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
    chrome.storage.sync.remove('message');

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
    console.log(msg);
    if (!msg) {
        console.error('Попытка передачи пустый данных');
        return false;
    }
    chrome.storage.sync.set({message: msg});
    chrome.extension.sendMessage({create: "on"});
}

function clean() {
    chrome.storage.sync.remove('firstTab');
    chrome.storage.sync.remove('project');
    chrome.storage.sync.remove('redmineTab');
    chrome.storage.sync.remove('redmineUrl');
    chrome.storage.sync.remove('notSave');
}

function setRedmineTaskId() {
    chrome.storage.sync.get('redmineUrl', function (result) {
        var redmineUrl = result.redmineUrl;
        if (redmineUrl) {
            var form = getActiveFormByHPSM();
            if (isNewHPSMUrl()) {
                form.find('input[name="instance/link.to.system/link.to.system[5]"]').val(redmineUrl);
                var redmineId = redmineUrl.match(/\d+/)[0];
                form.find('input[name="instance/external.link.tp3"]').val(redmineId);
            } else {
                form.find('input[name="instance/hpc.additional.field.2"]').val(redmineUrl);
            }
            clean();

            var w = getActiveWindowByHPSM();
            if (!w)
                throw new Error('Не удалось получить текущее окно');
            var btn = w.find('button:contains("Сохранить")');
            if (!btn)
                throw new Error('Не удалось получить кнопку "Сохранить"');
            if (btn[1]) {
                return btn[1].click();
            }
            return btn[0].click();
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
        if (request.action === "editHPSMTask" && isHPSMUrl()) {
            try {
                setRedmineTaskId();
            } catch (e) {
                console.log('Ошибка ' + e.name + ":" + e.message + "\n" + e.stack);
            }
        }
    });


if (isOutlookUrl()) {
    parseAndSend(parseTaskFromOutlook);
} else if (isHPSMUrl()) {
    parseAndSend(parseTaskFromHPSM);
} else if (isRedmineUrl()) {
    if (checkRedmineUrlTask()) {
        //сохраняем ссылку на задачу в redmine
        chrome.storage.sync.set({redmineUrl: location.href});
        //можно переходить обратно в hpsm
        chrome.extension.sendMessage({return: "on"});
    } else {
        getTaskData();
    }
}

