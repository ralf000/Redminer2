function showRedmineUrl() {

    var timeout = setTimeout(function () {
        if (location.href.indexOf('sm.eaist.mos') === -1
            && location.href.indexOf('sm.mos') === -1
            && location.href.indexOf('sm.tender.mos') === -1
            && location.href.indexOf('212.11.152.7') === -1) {
            clearTimeout(timeout);
            return;
        }

        if ($('body a#redmine'))
            $('body a#redmine').remove();

        var form = getActiveFormByHPSM();//lib.js

        if (form) {
            if (isNewHPSMUrl()) {
                var url = form.find('input[name="instance/link.to.system/link.to.system[5]"]').val();
            } else {
                var url = form.find('input[name="instance/hpc.additional.field.2"]').val();
            }
            if (url) {
                $('body')
                    .append('<a id="redmine" target="_blank" href="'+url+'"><button style="position: fixed; bottom: 0; left: 0; width: 60px; height: 30px; background-color: #0096D6; color: white; font-size: 10px;cursor:pointer">Redmine</button></a>');
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
