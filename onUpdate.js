function getHPSMForm() {
    try {
        var frame = parent.frames[0].frames[1].document;
    } catch (e) {
        try {
            var frame = parent.frames[1].frames[1].document;
        } catch (e) {
            return false;
        }
    }

    var form = frame.getElementById('topaz');
    return (form) ? $(form) : false;
}

function showRedmineUrl() {
    var intval = setInterval(function () {
        if (location.href.indexOf('sm.mos') === -1)
            clearInterval(intval);
        
        var form = getHPSMForm();
        if (!form)
            return false;
        var url = form.find('input[name="instance/hpc.additional.field.2"]').val();
        if (url) {
            $('body')
                .append('<a id="redmine" target="_blank" href="' + url + '"><button style="position: fixed; bottom: 0; left: 0; width: 60px; height: 30px; background-color: #0096D6; color: white; font-size: 10px;">Redmine</button></a>');
        } else if ($('body a#redmine')) {
            $('body a#redmine').empty();
        }
    }, 1000);
}

showRedmineUrl();