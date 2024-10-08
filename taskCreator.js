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
        || 'Ошибка';
    title = ucFirst(title);
    //контактное лицо
    var contact = form.find('input[alias="instance/contact.name"]').val()
        || '';
    if (contact) {
        contact = '*Контактное лицо*: ' + contact + "\n";
    }
    //email
    var email = form.find('input[name="instance/contact.email"]').val()
        || '';
    if (email) {
        email = '*E-mail контактного лица*: ' + email + "\n";
    }
    //предельный срок
    if (isOldHPSM()) {
        var period = form.find('input[name="instance/hpc.time.registred"]').val();
    } else {
        var period = form.find('span[ref="instance/next.ola.breach"]').children('span').text()
            || form.find('input[name="instance/next.ola.breach"]').val()
            || form.find('input[name="instance/hpc.next.breach"]').val();
    }
    if (period) {
        period = handlePeriod(period);
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
    if (company) company = '*Имя компании*: ' + ucFirst(company.trim()) + "\n";
    var companyInn = form.find('input[alias="instance/company"]').val() || '';
    if (companyInn) companyInn = '*ИНН компании*: ' + companyInn.trim() + "\n";
    var companyKpp = form.find('input[name="instance/company.kpp"]').val() || '';
    if (companyKpp) companyKpp = '*КПП компании*: ' + companyKpp.trim() + "\n";
    var region = '';
    if (form.find('input[alias="instance/company.region.okato"]').length) {
        region = form.find('input[alias="instance/company.region.okato"]').val().trim();
    } else if (form.find('#X42Readonly').length) {
        region = form.find('#X42Readonly').val().trim();
    }

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

    var additionalInfo = '';
    if (contact || email) {
        additionalInfo += "\n\n" + contact + email;
    }
    if (company || companyInn || companyKpp || region || links) {
        additionalInfo += "\n\n" + company + companyInn + companyKpp + links + createdFromIncidentId
    }

    return new Promise(function (resolve, reject) {
        resolve({
            taskId: taskId ? taskId : '',
            title: title,
            email: email,
            period: period,
            priority: priority,
            body: body + additionalInfo,
            region: region,
        })
    });
}

function getHeaderInfoFrom4me(name) {
    return $(`.header_bar_label:contains('${name}')`).closest('.header_bar_section').find('.data').text().trim();
}

function getSectionDataFrom4me(name) {
    return $.unique($(`.section-title:contains('${name}')`).closest('.section').find('.more_section > .row').find('*').map((i, el) => el.textContent.trim()).toArray()).join('\n').replaceAll('  ', '')
}

function getDataByTitleAttrFrom4me(name) {
    return $.unique($(`[title='${name}']`).closest('.row').find('*').map((i, el) => el.textContent.trim()).toArray()).join('\n');
}

function getBodyFrom4me() {
    let body = $('.paging-collection').first().find('.list li').first().find('.email-fragment').text().trim().split('\n').filter(el => el);
    let startPoint = 0;
    let stop = false;
    ['Cc:', 'To:', 'Subject:'].forEach(needed => {
        let result = body.findIndex(el => el.indexOf(needed) === 0);
        if (!stop && result !== -1) {
            startPoint = result + 1;
            stop = true;
        }
    });
    body = body.slice(startPoint).join('\n');

    let addBody = $('.email-hidden-reply').first().find('.email-quoted-reply').text().trim().split('\n').filter(el => el);
    let filteredPhrases = ['Cc:', 'To:', 'Subject:', 'Sent:', 'ВНЕШНЯЯ ПОЧТА:', 'не запускайте вложения и сообщите'];
    addBody = addBody.filter(el => !filteredPhrases.map(needed => el.indexOf(needed) === 0).reduce((result, item) => item || result)).join('\n');
    return body + '\n\n' + addBody;
}

function parseTaskFrom4me() {
    let taskId = getHeaderInfoFrom4me('Запрос #');
    let title = $('.title').find('[dir="ltr"]').text();
    let body = getBodyFrom4me();
    /*let category = `*Категория*\n` + getHeaderInfoFrom4me('Категория');
    let influence = `*Влияние*\n` + getHeaderInfoFrom4me('Влияние');
    let purpose = `*Назначение*\n` + getSectionDataFrom4me('Назначение');
    let initiator = getDataByTitleAttrFrom4me('Инициатор');
    let serviceComponent = getDataByTitleAttrFrom4me('Компонент услуги');
    let additionalInfo = [category, influence, purpose, initiator, serviceComponent].join('\n\n');*/

    return new Promise(resolve => {
        resolve({
            taskId: taskId ? taskId : '',
            title: title,
            body: body,
        })
    });
}

function addFilesFromOldHPSMToMessage() {
    wait(() => getActiveFormByHPSM().find('label:contains("Информация о вложениях")').closest('.Frame').find('iframe').contents().find('.listTable a').length)
        .then(() => {
            return new Promise((resolve, reject) => {
                var files = getActiveFormByHPSM().find('label:contains("Информация о вложениях")').closest('.Frame').find('iframe').contents().find('.listTable a');
                if (!files.length) {
                    return reject();
                }
                files.each((i, file) => {
                    $(file).attr('download', '');
                    setTimeout(() => file.click() && $(file).removeAttr('download'), 500 * i);
                });
                return resolve();
            });
        })
}

//инциденты
function addFilesFromFirstTabToMessage() {
    return new Promise((resolve, reject) => {
        //если нет вложений
        if (getActiveFormByHPSM().find('a:contains("Вложения инцидента — (0)")').length) {
            return reject();
        }
        //скачиваем файлы инцидента
        getActiveFormByHPSM().find('a:contains("Вложения инцидента")')[0].click();
        wait(() => getActiveFormByHPSM().find('.MultipleAttachment').find('.x-grid3-row').length)
            .then(() => {
                /*var files = getActiveFormByHPSM().find('#X203_p').contents().find('.x-grid3-row a');
                Promise.all(files.toArray().map(function (file) {
                    var href = $(file).attr('href');
                    var start = href.indexOf("('");
                    var end = href.indexOf("')");
                    var data = href.substr(start + "('".length, end - start - "')".length).split("','");

                    return `${location.origin}/${location.pathname.split('/')[1]}/detail.do?ctx=attachment&action=open&name=${data[0]}&id=${data[1]}&type=${data[2]}&len=${data[3]}&thread=1`;
                })).then(urls => {
                    urls = urls.slice(0, 30);
                    console.log(urls);
                    chrome.extension.sendMessage({files: urls});
                    resolve();
                });*/

                var files = getActiveFormByHPSM().find('.MultipleAttachment').find('.x-grid3-row a');
                files.each((i, file) => {
                    setTimeout(() => file.click(), 500 * i);
                });
            });
        return resolve();
    });
}

//обращения
function addFilesFromSecondTabToMessage() {
    return new Promise((resolve, reject) => {
        //если нет вложений
        if (getActiveFormByHPSM().find('a:contains("Вложения обращения — (0)")').length) {
            return reject();
        }
        getActiveFormByHPSM().find('a:contains("Вложения обращения")')[0].click();
        wait(() => getActiveFormByHPSM().find('[title="Вложения обращения"]').contents().find('a.shadowFocus').length)
            .then(() => {
                var files = getActiveFormByHPSM().find('[title="Вложения обращения"]').contents().find('a.shadowFocus');
                Promise.all(files.toArray().map(function (file) {
                    file = $(file);
                    var name = file.find('.xTableCell').text();
                    if (!name) return true;//continue
                    return location.origin + '/' + location.pathname.split('/')[1] + '/servlet/' + file.attr('href');
                })).then(urls => {
                    urls = urls.slice(0, 30);
                    chrome.extension.sendMessage({files: urls});
                    resolve();
                });
            });
    });
}

//парсит файлы и добавляет к сообщению
function addFilesFromHPSMToMessage(message) {
    return new Promise((resolve, reject) => {
        var form = getActiveFormByHPSM();

        //если вложений нет, выходим
        if (form.find('a:contains("Вложения (0)")').length) {
            return resolve(message);
        }

        form.find('a:contains("Вложения (")')[0].click();

        if (isOldHPSM()) {
            wait(() => getActiveFormByHPSM().find('label:contains("Информация о вложениях")').length)
            .then(() => addFilesFromOldHPSMToMessage())
            .then(() => resolve(message));
        } else {
            wait(() => getActiveFormByHPSM().find('a:contains("Вложения инцидента")').length)
                .then(() => addFilesFromFirstTabToMessage())
                .then(resolve => addFilesFromSecondTabToMessage(), reject => addFilesFromSecondTabToMessage())
                .then(() => resolve(message));
        }
    });
}

//парсит файлы и добавляет к сообщению
function addFilesFrom4meToMessage(message) {
    return Promise.all(
        $('.attachment-info a').map((i, file) => {
            return new Promise(resolve => setTimeout(() => {
                $(file).attr('download', '');
                file.click();
                resolve();
            }, 100 * i))
        }).toArray()
    ).then(() => new Promise(resolve => resolve(message)))
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
    var title = bodyBlock.children().first().find('span').first().text().trim();
    var textDivs = $('.wide-content-host').find('.allowTextSelection').eq(1).children().children().children().children().filter((i, el) => $(el).attr('id') !== 'x_Signature' && $(el).attr('id') !== 'x_divtagdefaultwrapper' && !$(el).find('#x_divtagdefaultwrapper').length && !$(el).find('#x_Signature').length && !$(el).find('#x_x_Signature').length);
    if (!textDivs.length) {
        textDivs = $('.wide-content-host .allowTextSelection > div > div > div').children().children().filter((i, el) => $(el).attr('id') !== 'x_Signature' && $(el).attr('id') !== 'x_divtagdefaultwrapper' && !$(el).find('#x_divtagdefaultwrapper').length && !$(el).find('#x_Signature').length && !$(el).find('#x_x_Signature').length);
    }
    var text = textDivs.map((i, div) => $(div).text().trim());
    if (text.length) {
        text = text.toArray().join('\n').replaceAll(/(\n){2,}/g, "\n");
    }

    //дата завершения
    let period = new Date();
    let periodInDays = text.match('срочн') ? 2 : 7;
    period.setDate(period.getDate() + periodInDays)
    let year = period.getFullYear().toString().substr(2);
    let month = period.getMonth() + 1;
    let day = period.getDate();
    return {title: title, body: text, period: [day, month, year]};
}


function parseTaskFromOutlook() {
    return new Promise(function (resolve, reject) {
        resolve(isOldOutlook() ? parseTaskFromOldOutlook() : parseTaskFromNewOutlook());
    });
}

/**
 * Получает объект с данными задачи, проверяет установлен ли заголовок
 */
function getTaskData() {
    chrome.storage.local.get('message', function (result) {
        var message = result.message;
        if (message && message.title) {
            getProject((project) => createTask(project, message))
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

function handlePeriod(period) {
    let separator = period.match(/\//) ? '/' : '.';
    period = period.split(' ')[0];
    period = period.split(separator);
    period = new Date('20' + period[2], period[1] - 1, period[0]);
    let date = isOldHPSM() ? period.getDate() + 1 : period.getDate() - 1;
    period.setDate(date);
    let year = period.getFullYear();
    let month = period.getMonth() + 1;
    month = ('0' + month).slice(-2);
    let day = period.getDate();
    day = ('0' + day).slice(-2);
    return year + '-' + month + '-' + day;
}

function setProject(project) {
    return new Promise(resolve => {
        const projectSelect = $('select#issue_project_id');
        const delay = project.redmine_project ? 500 : 0;
        if (projectSelect.length && project.redmine_project) {
            const option = projectSelect.find(`option[value=${project.redmine_project}]`);
            if (option.length) {
                option.attr('selected', 'selected').click();
                //сработало только так
                projectSelect[0].dispatchEvent(new Event('change'));
            }
        }
        setTimeout(resolve, delay);
    });
}

function setTracker(project) {
    return new Promise(resolve => {
        const trackerSelect = $('select#issue_tracker_id');
        const supportTracker = trackerSelect.find('option:contains("Поддержка")');
        const delay = project.redmine_tracker || supportTracker ? 500 : 0;
        if (trackerSelect.length && project.redmine_tracker) {
            const option = trackerSelect.find(`option[value=${project.redmine_tracker}]`);
            if (option.length) {
                option.attr('selected', 'selected').click();
                //сработало только так
                trackerSelect[0].dispatchEvent(new Event('change'));
            }
        } else {
            const option = trackerSelect.find('option:contains("Поддержка")');
            if (option.length) {
                option.attr('selected', 'selected').change().click();
            }
        }
        setTimeout(resolve, delay);
    });
}

/**
 * Заполняет поля и создает новую задачу в redmine
 * @param project object
 * @param message object
 */
async function createTask(project, message) {
    await setProject(project);
    await setTracker(project);

    var title = message.taskId ? message.taskId + '. ' + message.title : message.title;
    $('input#issue_subject').val(title);
    if (message.period) {
        $('input#issue_due_date').val(message.period);
    }
    if (message.priority) {
        var rmPriority = 2;
        if (message.priority == 3) {
            rmPriority = 4;
        } else if (message.priority == 1 || message.priority == 2) {
            rmPriority = 5;
        }
        $('select#issue_priority_id option[value=' + rmPriority + ']').prop('selected', true);
    }
    if (message.region) {
        let regionInput = $('label:contains("Регион")').length ? $('label:contains("Регион")').next('input') : $('input#issue_custom_field_values_17');
        if (regionInput.length) {
            regionInput.val(message.region);
        }
    }

    $('textarea#issue_description').val(message.body);
    //$('input#issue_estimated_hours').val(1);
    $('select#issue_assigned_to_id option:contains("<< мне >>")').attr('selected', 'selected');

    $('#attributes').append('<div class="splitcontent">\n\
            <div class="splitcontentleft">\n\
            <p><label for="issue_custom_field_values_11"><span title="Указывается номер связанной задачи например из HPSM">Номер из внешней системы</span></label><input type="text" name="issue[custom_field_values][11]" id="issue_custom_field_values_11" value="" class="string_cf"></p>\n\
            </div><div class="splitcontentright">\n\
            </div>\n\
            </div>');
    $('input#issue_custom_field_values_11').val(message.taskId ? message.taskId : '');
    chrome.storage.local.remove('message');

    //если скачивались файлы то нажимаем "выбрать файлы"
    /*chrome.storage.local.get('hasFiles', function (result) {
        var hasFiles = result.hasFiles;
        if (hasFiles === true) {
            chrome.storage.local.remove('hasFiles');
            $('[name="attachments[dummy][file]"]').click();
        }
    });*/

    //если таск из hpsm, то переменная firstTab не пустая
    chrome.storage.local.get('firstTab', function (result) {
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
 * @param message
 * должна возвращать объект задачи вида {title: 'title', body: 'body', [ taskId: taskId]}
 */
function send(message) {
    if (!message) {
        console.error('Попытка передачи пустых данных');
        return false;
    }
    chrome.storage.local.set({message: message});
    chrome.extension.sendMessage({create: "on"});
}

function clean() {
    chrome.storage.local.remove('firstTab');
    chrome.storage.local.remove('project');
    chrome.storage.local.remove('redmineTab');
    chrome.storage.local.remove('redmineUrl');
    chrome.storage.local.remove('notSave');
}

function setRedmineTaskId() {
    chrome.storage.local.get('redmineUrl', function (result) {
        var redmineUrl = result.redmineUrl;
        if (redmineUrl) {
            clean();
            var form = getActiveFormByHPSM();
            var fieldForRedmineUrl;
            if (isNewHPSMUrl()) {
                fieldForRedmineUrl = form.find('input[name="instance/link.to.system/link.to.system[5]"]');
                if (!fieldForRedmineUrl.length) return;
                fieldForRedmineUrl.val(redmineUrl);
                var redmineId = redmineUrl.match(/\d+/)[0];
                if (!redmineId) return;
                form.find('input[name="instance/external.link.tp3"]').val(redmineId);
            } else {
                fieldForRedmineUrl = form.find('input[name="instance/hpc.additional.field.2"]');
                if (!fieldForRedmineUrl.length) return;
                fieldForRedmineUrl.val(redmineUrl);
            }

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
                return setRedmineTaskId();
            } catch (e) {
                console.log('Ошибка ' + e.name + ":" + e.message + "\n" + e.stack);
            }
        }
    });


if (isOutlookUrl()) {
    parseTaskFromOutlook()
        .then(message => send(message));
} else if (isHPSMUrl()) {
    parseTaskFromHPSM()
        .then(message => addFilesFromHPSMToMessage(message))
        .then(message => send(message));
} else if (is4meUrl()) {
    parseTaskFrom4me()
        .then(message => addFilesFrom4meToMessage(message))
        .then(message => send(message));
} else if (isRedmineUrl()) {
    if (checkRedmineUrlTask()) {
        //сохраняем ссылку на задачу в redmine
        chrome.storage.local.set({redmineUrl: location.href});
        //можно переходить обратно в hpsm
        chrome.extension.sendMessage({return: "on"});
    } else {
        getTaskData();
    }
}