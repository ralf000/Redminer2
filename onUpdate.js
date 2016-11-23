function showRedmineUrl() {

    var intval = setInterval(function () {
        if (location.href.indexOf('sm.mos') === -1) {
            clearInterval(intval);
            return;
        }

        if ($('body a#redmine'))
            $('body a#redmine').empty();

        var form = getActiveFormByHPSM();//lib.js

        if (form) {
            var url = form.find('input[name="instance/hpc.additional.field.2"]').val();
            if (url) {
                $('body')
                    .append('<a id="redmine" target="_blank" href="' + url + '"><button style="position: fixed; bottom: 0; left: 0; width: 60px; height: 30px; background-color: #0096D6; color: white; font-size: 10px;">Redmine</button></a>');
            }
        }

    }, 1000);
}

try {
    showRedmineUrl();
} catch (e) {
    false;
}
