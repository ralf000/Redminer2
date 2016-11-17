function initForm(form) {
    chrome.storage.local.get('surname', function (result) {
        var surname = result.surname;
        if (surname) {
            $('#create').removeAttr('disabled');
            $('#surnameToggle').html('<span class="glyphicon glyphicon-remove"></span>');
            $('#surname').attr('value', surname).attr('disabled', 'disable');
        } else {
            $('#create').attr('disabled', 'disable');
            $('#surname').removeAttr('disabled');
            $('#surnameToggle').html('<span class="glyphicon glyphicon-ok"></span>');
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

function addHandlers() {

    $('#create').on('click', function () {
        $(this).attr('disabled', 'disable');
        var block = $('#projects');
        var url = 'projects.json';
        var btn;

        saveCurrentTab();

        $.getJSON(url, function (data, status, jqXHR) {
            if (status === 'success') {
                for (var key in data) {
                    btn = block.append('<button class="btn btn-default btn-block" id="' + data[key].link + '">' + data[key].name + '</button>');
                }
                for (var key in data) {
                    $('#' + data[key].link).on('click', function () {
                        chrome.storage.local.set({project: $(this).attr('id')});
                        chrome.tabs.executeScript(null, {file: 'taskCreator.js'});
                    });
                }
                block.slideDown();
            }
        });

    });
    $('.cfg').on('click', function () {
        $(this).next().slideToggle();
    });

    $('#surnameToggle').on('click', function () {
        var surnameInput = $('#surname');
        chrome.storage.local.get('surname', function (result) {
            var surname = result.surname;
            if (surname) {
                chrome.storage.local.remove('surname');
                surnameInput.removeAttr('disabled');
                surnameInput.focus();
                $('#surnameToggle').html('<span class="glyphicon glyphicon-ok"></span>');
                $('#create').attr('disabled', 'disable');
            } else {
                if (surnameInput.val()) {
                    surnameInput.attr('disabled', 'disable');
                    surnameInput.parent().removeClass('has-error').addClass('has-success');
                    chrome.storage.local.set({surname: surnameInput.val()});
                    $('#surnameToggle').html('<span class="glyphicon glyphicon-remove"></span>');
                    $('#create').removeAttr('disabled');
                } else {
                    surnameInput.parent().addClass('has-error');
                }
            }
        });
    });
}

$(function () {
    
    initForm($('#form1'));
    
    $('#box2').hide();

    addHandlers();
});