(function() {
    if (!('RtkWidget' in window)) window.RtkWidget = {};
    var r = RtkWidget;
    var d;
    $.get('/data/bookchars.csv').then(function(res) { d = res; });
    var $w = $('.rtk-widget');
    var $i = $('.rtk-input');
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
    $i.autocomplete({
        delay: 0,
        minLength: 2,
        source: autocomplete_source,
        select: autocomplete_select
    });

    var Suggestion = RtkWidget.Suggestion = {};
    (function() {
        var fs = Suggestion;

        function get_matching_records(sample, haystack) {
            var lines = get_matching_lines(sample, haystack);
            if (!lines) { return [] }
            return $.map(lines, function(l) {
                var cols = l.split("\t");
                return {keyword: cols[0], kanji: cols[1], number: +cols[2]};
            });
        }
        fs.get_matching_records = get_matching_records;

        function get_matching_lines(sample, haystack, start_pos, end_pos) {
            if (sample.length == 0) {
                return undefined;
            }
            if (start_pos === undefined) {
                start_pos = 0;
            }
            if (end_pos === undefined) {
                end_pos = haystack.length-1;
            }
            start_pos = haystack.lastIndexOf("\n", start_pos) + 1;
            end_pos   = haystack.    indexOf("\n", end_pos  ) - 1;
            if (end_pos < 0) {
                end_pos = haystack.length-1
            }
            if (start_pos >= end_pos) {
                throw 'start_pos must be less than end_pos';
            }
            
            var first_entry = _read_word(start_pos, haystack);
            if (first_entry.substr(0,sample.length) > sample) {
                return false;
            }
            if (_matches(first_entry, sample)) {
                return _get_adjacent_matches(start_pos, sample, haystack);
            }
            var last_entry = _read_word_backwards(end_pos, haystack);
            if (last_entry < sample) {
                return false;
            }
            if (_matches(last_entry, sample)) {
                var last_entry_pos = end_pos - last_entry.length + 1
                return _get_adjacent_matches(last_entry_pos, sample, haystack);
            }
            
            // end condition of recursion is two or less lines in haystack
            if (haystack.indexOf("\n", haystack.indexOf("\n", start_pos)+1) > end_pos) {
                return false;
            }
            
            var middle_pos = Math.floor((start_pos + end_pos) / 2);
            var match = get_matching_lines(sample, haystack, start_pos, middle_pos);
            if (match) {
                return match;
            }
            else {
                return get_matching_lines(sample, haystack, middle_pos, end_pos);
            }
        }
        fs.get_matching_lines = get_matching_lines;

        function _read_word(pos, haystack) {
            var left_cut = haystack.substr(pos);
            var newline_pos = left_cut.indexOf("\n");
            if (newline_pos <= 0) {
                newline_pos = left_cut.length;
            }
            var rv = left_cut.substr(0, newline_pos);
            return rv;
        }
        fs._read_word = _read_word;

        function _read_word_backwards(pos, haystack) {
            var newline_pos = haystack.lastIndexOf("\n", pos);
            var rv = haystack.substring(newline_pos+1, pos+1);
            return rv;
        }
        fs._read_word_backwards = _read_word_backwards;

        function _get_adjacent_matches(pos, sample, haystack) {
            var start_pos = pos, end_pos = pos, new_start_pos, new_end_pos, word;
            while (_matches((word = _read_word_backwards(start_pos-2, haystack)), sample)) {
                start_pos -= (word.length + 1);
            }
            while (_matches((word = _read_word(end_pos, haystack)), sample)) {
                end_pos += (word.length+1);
            }
            var chunk = haystack.substring(start_pos, end_pos-1);
            if (chunk.length == 0) {
                return [];
            }
            var records = chunk.split("\n");
            return records;
        }
        fs._get_adjacent_matches = _get_adjacent_matches;

        function _matches(word, sample) {
            if (word.substr(0, sample.length) == sample) {
                return true;
            }
            else {
                return false;
            }
        }
        fs._matches = _matches;

    })();
    
    function autocomplete_source(req,res) {
        var matches = Suggestion.get_matching_records(req.term, d);
        var rv = $.map(matches, function(rec) {
            var l = rec.keyword + ' (' + rec.kanji + '/' + rec.number + ')';
            return {label: l, value: rec.keyword, record: rec};
        });
        res(rv);
    }
    function autocomplete_select(evt, ui) {
        var rec = ui.item.record;
        var kanji = rec.kanji;
        var $f = r.last_focused;
        $f.focus();
        $w.hide();
        var old = $f.val();
        var prefix = old.substr(0,r.selection_start);
        var suffix = old.substr(r.selection_end);
        var new_val = prefix + kanji + suffix;
        $f.val(new_val);
        var f = $f.get(0);
        f.selectionStart = f.selectionEnd = r.selection_start+1;
        $i.val('');
        return false;
    }

})();
