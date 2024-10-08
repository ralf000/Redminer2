CREATOR = {
    async parseTaskFromHPSM() {
        return new Promise((resolve, reject) => {
            let form = LIB.getActiveFormByHPSM();
            if (!form) return reject(false);

            //Код инцидента/обращения
            let taskId = form.find('[ref="instance/incident.id"] span').text()
                || form.find('span[ref="instance/number"]').children('span').text()
                || form.find('input[name="instance/number"]').val();
            if (!taskId) return reject(false);
            //заголовок
            let title = form.find('input[name="instance/title"]').val()
                || form.find('input[name="instance/brief.description"]').val()
                || 'Ошибка';
            title = LIB.ucFirst(title);
            //контактное лицо
            let contact = form.find('input[alias="instance/contact.name"]').val()
                || '';
            if (contact) {
                contact = '*Контактное лицо*: ' + contact + "\n";
            }
            //email
            let email = form.find('input[name="instance/contact.email"]').val()
                || '';
            if (email) {
                email = '*E-mail контактного лица*: ' + email + "\n";
            }
            let period = '';
            //предельный срок
            if (LIB.isOldHPSM()) {
                period = form.find('input[name="instance/hpc.time.registred"]').val();
            } else {
                period = form.find('span[ref="instance/next.ola.breach"]').children('span').text()
                    || form.find('input[name="instance/next.ola.breach"]').val()
                    || form.find('input[name="instance/hpc.next.breach"]').val();
            }
            if (period) {
                period = this.handlePeriod(period);
            }
            //приоритет
            let priority = form.find('span[ref="instance/priority.code"]').children('span').text()
                || form.find('input[name="instance/priority.code"]').val()
                || form.find('input[alias="instance/priority.code"]').val();

            if (priority) {
                priority = priority.match(/\d+/)[0];
            }

            let body = form.find('textarea[name="instance/description/description"]').text()
                || form.find('textarea[name="instance/action/action"]').text()
                || form.find('textarea[ref="instance/action/action"]').text()
                || '';

            let company = form.find('input[alias="instance/company.full.name"]').val() || '';
            if (company) company = '*Имя компании*: ' + LIB.ucFirst(company.trim()) + "\n";
            let companyInn = form.find('input[alias="instance/company"]').val() || '';
            if (companyInn) companyInn = '*ИНН компании*: ' + companyInn.trim() + "\n";
            let companyKpp = form.find('input[name="instance/company.kpp"]').val() || '';
            if (companyKpp) companyKpp = '*КПП компании*: ' + companyKpp.trim() + "\n";
            let region = '';
            if (form.find('input[alias="instance/company.region.okato"]').length) {
                region = form.find('input[alias="instance/company.region.okato"]').val().trim();
            } else if (form.find('#X42Readonly').length) {
                region = form.find('#X42Readonly').val().trim();
            }

            let links = '';
            $.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function (index, fieldNum) {
                var link = form.find('input[name="instance/link.to.system/link.to.system[' + fieldNum + ']"]');
                if (link.length && link.val().length) {
                    links += link.val() + "\n";
                }
            });
            if (links) links = '*Ссылки на системы*: ' + "\n" + links;

            let createdFromIncidentId = form.find('input[alias="instance/incident.id"]').val() || '';
            if (createdFromIncidentId) createdFromIncidentId = '*Создано из обращения*: ' + createdFromIncidentId + "\n";

            let additionalInfo = '';
            if (contact || email) {
                additionalInfo += "\n\n" + contact + email;
            }
            if (company || companyInn || companyKpp || region || links) {
                additionalInfo += "\n\n" + company + companyInn + companyKpp + links + createdFromIncidentId
            }

            return resolve({
                taskId: taskId ? taskId : '',
                title: title,
                email: email,
                period: period,
                priority: priority,
                body: body + additionalInfo,
                region: region,
            })
        });
    },

    getHeaderInfoFrom4me(name) {
        return $(`.header_bar_label:contains('${name}')`).closest('.header_bar_section').find('.data').text().trim();
    },

    getSectionDataFrom4me(name) {
        return $.unique($(`.section-title:contains('${name}')`).closest('.section').find('.more_section > .row').find('*').map((i, el) => el.textContent.trim()).toArray()).join('\n').replaceAll('  ', '')
    },

    getDataByTitleAttrFrom4me(name) {
        return $.unique($(`[title='${name}']`).closest('.row').find('*').map((i, el) => el.textContent.trim()).toArray()).join('\n');
    },

    getBodyFrom4me() {
        let bodyBlock = $('.paging-collection').first().find('.list li').first();
        let body = '';
        if (bodyBlock.find('.email-fragment').length) {
            body = bodyBlock.find('.email-fragment').text().trim().split('\n').filter(el => el);
        } else {
            body = bodyBlock.find('.note-content-container').text().trim().split('\n').filter(el => el);
        }
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
    },

    parseTaskFrom4me() {
        return new Promise(resolve => {
            let taskId = this.getHeaderInfoFrom4me('Запрос #');
            let title = $('.title').find('[dir="ltr"]').text();
            let body = this.getBodyFrom4me();
            /*let category = `*Категория*\n` + getHeaderInfoFrom4me('Категория');
            let influence = `*Влияние*\n` + getHeaderInfoFrom4me('Влияние');
            let purpose = `*Назначение*\n` + getSectionDataFrom4me('Назначение');
            let initiator = getDataByTitleAttrFrom4me('Инициатор');
            let serviceComponent = getDataByTitleAttrFrom4me('Компонент услуги');
            let additionalInfo = [category, influence, purpose, initiator, serviceComponent].join('\n\n');*/

            resolve({
                taskId: taskId ? taskId : '',
                title: title,
                body: body,
            })
        });
    },

    async addFilesFromOldHPSMToMessage() {
        return new Promise(async (resolve, reject) => {
            await LIB.wait(() => LIB.getActiveFormByHPSM().find('label:contains("Информация о вложениях")').closest('.Frame').find('iframe').contents().find('.listTable a').length);
            let files = LIB.getActiveFormByHPSM().find('label:contains("Информация о вложениях")').closest('.Frame').find('iframe').contents().find('.listTable a');
            if (!files.length) {
                return reject();
            }
            files.each((i, file) => {
                $(file).attr('download', '');
                setTimeout(() => file.click() && $(file).removeAttr('download'), 500 * i);
            });
            return resolve();
        });
    },

//инциденты
    addFilesFromFirstTabToMessage() {
        return new Promise(async (resolve, reject) => {
            //если нет вложений
            if (LIB.getActiveFormByHPSM().find('a:contains("Вложения инцидента — (0)")').length) {
                return reject();
            }
            //скачиваем файлы инцидента
            LIB.getActiveFormByHPSM().find('a:contains("Вложения инцидента")')[0].click();
            await LIB.wait(() => LIB.getActiveFormByHPSM().find('.MultipleAttachment').find('.x-grid3-row').length)
            let files = LIB.getActiveFormByHPSM().find('.MultipleAttachment').find('.x-grid3-row a');
            files.each((i, file) => {
                setTimeout(() => file.click(), 500 * i);
            });
            return resolve();
        });
    },

//обращения
    addFilesFromSecondTabToMessage() {
        return new Promise(async (resolve, reject) => {
            //если нет вложений
            if (LIB.getActiveFormByHPSM().find('a:contains("Вложения обращения — (0)")').length) {
                return reject();
            }
            LIB.getActiveFormByHPSM().find('a:contains("Вложения обращения")')[0].click();
            await LIB.wait(() => LIB.getActiveFormByHPSM().find('[title="Вложения обращения"]').contents().find('a.shadowFocus').length);
            let files = LIB.getActiveFormByHPSM().find('[title="Вложения обращения"]').contents().find('a.shadowFocus');
            let urls = await Promise.all(
                files.toArray().map(function (file) {
                    file = $(file);
                    let name = file.find('.xTableCell').text();
                    if (!name) return true;//continue
                    return location.origin + '/' + location.pathname.split('/')[1] + '/servlet/' + file.attr('href');
                })
            );
            urls = urls.slice(0, 30);
            await MESSAGES.send({files: urls});
            resolve();
        });
    },

//парсит файлы и добавляет к сообщению
    async addFilesFromHPSMToMessage(message) {
        return new Promise(async (resolve, reject) => {
            try {
                let form = LIB.getActiveFormByHPSM();

                //если вложений нет, выходим
                if (form.find('a:contains("Вложения (0)")').length) {
                    return resolve(message);
                }

                form.find('a:contains("Вложения (")')[0].click();

                if (LIB.isOldHPSM()) {
                    await LIB.wait(() => LIB.getActiveFormByHPSM().find('label:contains("Информация о вложениях")').length);
                    await this.addFilesFromOldHPSMToMessage();
                    await resolve(message);
                } else {
                    await LIB.wait(() => LIB.getActiveFormByHPSM().find('a:contains("Вложения инцидента")').length);
                    await this.addFilesFromFirstTabToMessage();
                    await this.addFilesFromSecondTabToMessage();
                    await resolve(message);
                }
            } catch (e) {
                LOGGER.error(e);
                return resolve(message)
            }
        });
    },

//парсит файлы и добавляет к сообщению
    async addFilesFrom4meToMessage(message) {
        await Promise.all(
            $('.attachment-info a').map((i, file) => {
                return new Promise(resolve => setTimeout(() => {
                    $(file).attr('download', '');
                    file.click();
                    resolve();
                }, 100 * i))
            }).toArray()
        );
        return new Promise(resolve => resolve(message));
    },

    parseTaskFromOldOutlook() {
        var all = $('.allowTextSelection.customScrollBar.scrollContainer').children().eq(1);
        var title = all.find('.rpHighlightSubjectClass').text();
        var body = $($('.conductorContent div[role=document] #Item\\.MessageUniqueBody')[0])
            .text()
            .trim()
            .replace(/(\n\r*){2,}/g, '\n')
            .replace(/<!--(.\n*\r*)+-->/g, '');
        return {title: title, body: body};
    },

    parseTaskFromNewOutlook() {
        let bodyBlock = $('[role=main]');
        let title = bodyBlock.children().first().find('span').first().text().trim();
        let textDivs = $('.wide-content-host .allowTextSelection > div > div > div').children().filter((i, el) => $(el).attr('id') !== 'x_Signature' && $(el).attr('id') !== 'x_divtagdefaultwrapper' && !$(el).find('#x_divtagdefaultwrapper').length && !$(el).find('#x_Signature').length && !$(el).find('#x_x_Signature').length);
        if (!textDivs.length) {
            textDivs = $('.wide-content-host .allowTextSelection > div > div > div').children().children().filter((i, el) => $(el).attr('id') !== 'x_Signature' && $(el).attr('id') !== 'x_divtagdefaultwrapper' && !$(el).find('#x_divtagdefaultwrapper').length && !$(el).find('#x_Signature').length && !$(el).find('#x_x_Signature').length);
        }
        let text = textDivs.map((i, div) => $(div).text().trim());
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
    },


    parseTaskFromOutlook() {
        return new Promise(resolve => resolve(LIB.isOldOutlook() ? this.parseTaskFromOldOutlook() : this.parseTaskFromNewOutlook()));
    },

    /**
     * Получает объект с данными задачи, проверяет установлен ли заголовок
     */
    async getTaskData() {
        const message = await STORAGE.getParam('message');
        if (message && message.title) {
            const project = await STORAGE.getParam('project');
            await this.createTask(project, message)
        }
    },

    handlePeriod(period) {
        let separator = period.match(/\//) ? '/' : '.';
        period = period.split(' ')[0];
        period = period.split(separator);
        period = new Date('20' + period[2], period[1] - 1, period[0]);
        let date = LIB.isOldHPSM() ? period.getDate() + 1 : period.getDate() - 1;
        period.setDate(date);
        let year = period.getFullYear();
        let month = period.getMonth() + 1;
        month = ('0' + month).slice(-2);
        let day = period.getDate();
        day = ('0' + day).slice(-2);
        return year + '-' + month + '-' + day;
    },

    setProject(project) {
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
    },

    setTracker(project) {
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
    },

    /**
     * Заполняет поля и создает новую задачу в redmine
     */
    async createTask(project, message) {
        await this.setProject(project);
        await this.setTracker(project);

        let title = message.taskId ? message.taskId + '. ' + message.title : message.title;
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
        STORAGE.removeParam('message');

        //если таск из hpsm, то переменная firstTab не пустая
        const firstTab = await STORAGE.getParam('firstTab');
        if (firstTab) {
            await MESSAGES.send({getRedmineTaskId: "on"});
        } else {
            this.clean();
        }
    },

    /**
     * @param message
     * должна возвращать объект задачи вида {title: 'title', body: 'body', [ taskId: taskId]}
     */
    async send(message) {
        if (!message) {
            console.error('Попытка передачи пустых данных');
            return false;
        }
        STORAGE.setParam({message: message});
        await MESSAGES.send({create: "on"});
    },

    clean() {
        STORAGE.removeParam('firstTab');
        STORAGE.removeParam('project');
        STORAGE.removeParam('redmineTab');
        STORAGE.removeParam('redmineUrl');
        STORAGE.removeParam('notSave');
    },

    async setRedmineTaskId() {
        const redmineUrl = await STORAGE.getParam('redmineUrl');
        if (!redmineUrl) return;
        this.clean();
        let form = LIB.getActiveFormByHPSM();
        let fieldForRedmineUrl;
        if (LIB.isNewHPSMUrl()) {
            fieldForRedmineUrl = form.find('input[name="instance/link.to.system/link.to.system[5]"]');
            if (!fieldForRedmineUrl.length) return;
            fieldForRedmineUrl.val(redmineUrl);
            let redmineId = redmineUrl.match(/\d+/)[0];
            if (!redmineId) return;
            form.find('input[name="instance/external.link.tp3"]').val(redmineId);
        } else {
            fieldForRedmineUrl = form.find('input[name="instance/hpc.additional.field.2"]');
            if (!fieldForRedmineUrl.length) return;
            fieldForRedmineUrl.val(redmineUrl);
        }

        let w = LIB.getActiveWindowByHPSM();
        if (!w)
            throw new Error('Не удалось получить текущее окно');
        let btn = w.find('button:contains("Сохранить")');
        if (!btn)
            throw new Error('Не удалось получить кнопку "Сохранить"');
        if (btn[1]) {
            return btn[1].click();
        }
        return btn[0].click();
    },

    async run() {
        this.init();

        if (LIB.isOutlookUrl()) {
            let message = await this.parseTaskFromOutlook();
            await this.send(message);
        } else if (LIB.isHPSMUrl()) {
            let message = await this.parseTaskFromHPSM();
            message = await this.addFilesFromHPSMToMessage(message);
            await this.send(message);
        } else if (LIB.is4meUrl()) {
            let message = await this.parseTaskFrom4me();
            message = await this.addFilesFrom4meToMessage(message);
            await this.send(message);
        } else if (LIB.isRedmineUrl()) {
            if (LIB.checkRedmineUrlTask()) {
                //сохраняем ссылку на задачу в redmine
                STORAGE.setParam({redmineUrl: location.href});
                //можно переходить обратно в hpsm
                await MESSAGES.send({return: "on"});
            } else {
                await this.getTaskData();
            }
        }
    },

    handlers() {
        MESSAGES.get(async ({action}) => {
            if (action === "editHPSMTask" && LIB.isHPSMUrl()) {
                try {
                    return await this.setRedmineTaskId();
                } catch (e) {
                    console.log('Ошибка ' + e.name + ":" + e.message + "\n" + e.stack);
                }
            }
        });
    },

    init() {
        this.handlers();
    }
}

try {
    CREATOR.run();
} catch (e) {
    typeof LOGGER === 'undefined' ? console.error(e) : LOGGER.log(e);
}