$cheeta.directive({
    name: 'test',
    link: function(elem, attr, allAttr) {
        elem.addClass('test');
        $cheeta.future(function() {
            var el = elem.previousElementSibling;
            while (el && el.hasClass('test')) {el = el.previousElementSibling;}
            if (el && !attr.eval({$elem: el})) {
                elem.addClass('error');
                elem.attr('style', 'color:red');
                elem.innerHTML = attr.value;
            }
        }, allAttr('delay').modelValue() || 1);
    }
});