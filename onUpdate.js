function showRedmineUrl() {

    var timeout = setTimeout(function () {
        if (!isHPSMUrl()) {
            clearTimeout(timeout);
            return;
        }

        var redmineBtn = $('body a#redmine');
        if (redmineBtn.length) {
            redmineBtn.remove();
        }

        var form = getActiveFormByHPSM();//lib.js
        var url = '';
        if (form) {
            if (isNewHPSMUrl()) {
                url = form.find('input[name="instance/link.to.system/link.to.system[5]"]').val();
            } else {
                url = form.find('input[name="instance/hpc.additional.field.2"]').val();
            }
            if (url) {
                $('body')
                    .append('<a id="redmine" target="_blank" href="' + url + '"><button style="position: fixed; bottom: 0; left: 0; width: 60px; height: 30px; background-color: #0096D6; color: white; font-size: 10px;cursor:pointer">Redmine</button></a>');
            }
            clearTimeout(timeout);
            showRedmineUrl();
        }

    }, 3000);
}

try {
    showRedmineUrl();
} catch (e) {
    false;
}
