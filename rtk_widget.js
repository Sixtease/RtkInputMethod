(function() {
    if (!('RtkWidget' in window)) window.RtkWidget = {};
    var r = RtkWidget;
    var d = r.data;
    var kwi = RtkWidget.keyword_index = {};
    var kji = RtkWidget.  kanji_index = {};
    var $w = $('.rtk-widget');
    var $i = $('.rtk-input');
    for (var i = 0; i < d.length; i++) {
        var rec = d[i];
        kwi[rec.kw]  = rec;
        kji[rec.chr] = rec;
    }
    $(document).on('keyup.rtk', function(evt) {
        if (evt.keyCode === 32 && evt.ctrlKey) {
            if ($i.is(':focus')) return;
            var $last_focused = $(':focus');
            if ($last_focused.length === 0) return;
            var last_focused = $last_focused.get(0);
            $w.show();
            r.last_focused = $last_focused
            r.selection_start = last_focused.selectionStart;
            r.selection_end   = last_focused.selectionEnd;
            $i.focus();
        }
    });
    $i.on('keypress.rtk', function(evt) {
        if (evt.keyCode === 10 || evt.keyCode === 13) {
            var $f = r.last_focused;
            var kanji = kwi[$(evt.target).val()];
            $f.focus();
            $w.hide();
            if (kanji) {
                var old = $f.val();
                var prefix = old.substr(0,r.selection_start);
                var suffix = old.substr(r.selection_end);
                var new_val = prefix + kanji.chr + suffix;
                $f.val(new_val);
                var f = $f.get(0);
                f.selectionStart = f.selectionEnd = r.selection_start+1;
            }
            $i.val('');
        }
    });
})();
