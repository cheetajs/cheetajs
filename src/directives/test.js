$cheeta.directive({
    name: 'test',
    order: 10000,
    link: function(elem, attr, allAttr) {
        elem.addClass('test');
        var _this = this;
        $cheeta.future(function() {
            var el = elem.previousElementSibling;
            while (el && el.hasClass('test')) {el = el.previousElementSibling;}
            var els = [];
            while (el && !el.hasClass('test')) {els.push(el); el = el.previousElementSibling;}
            els = els.reverse();
            var $elem = els[0];
            els.forEach(function(el, i) {$elem[i] = el;});
            if ($elem) {
                try {
                    var val = attr.evaluate(null, {$elem: $elem, Is: _this.Is});
                    if (val === false || (val != null && val.length)) {
                        _this.showError(elem, attr, val);
                    }
                } catch (e) {
                    _this.showError(elem, attr, e.message || e);
                    if (!(e.message || e).search(/fail/gi)) {
                        throw e;
                    }
                }
            }
        }, allAttr('delay').modelValue() || 0);
    },
    showError: function(elem, attr, val) {
        //todo parse the test expr and eval the Is.eq params;
        var info = attr.value + ' [' + attr.models()
                .map(function(m) {
                    return m.ref();
                }).filter(function(r) {
                    return r.indexOf('Is') !== 0;
                }).map(function(r) {
                    return eval(r);
                }).join(', ') + ']';
        elem.addClass('error').attr('style', 'color: #C52121;padding-left:20px')
            .text(val).attr('title', info);
        var flip = true;
        elem.on('click', function() {
            if (flip) {
                elem.addAfter(new E('span').attr('style', 'color: #C52121;padding-left: 10px')
                    .addClass('error').text(elem.attr('title')));
            } else {
                elem.next().remove();
            }
            flip = !flip;
        });
    },
    Is: {
        eq: function() {
            this.verify('eq', Array.prototype.slice.call(arguments), function(o1, o2) {
                return o1 === o2;
            });
        },
        eql: function() {
            this.verify('eq', Array.prototype.slice.call(arguments), function(o1, o2) {
                return (o1 == null ? '' : o1) === (o2 == null ? '' : o2);
            });
        },
        verify: function(name, args, fn) {
            var obj = args[0];
            var _this = this;
            function toStr(a) {
                return _this.toStr(a);
            }
            for (var i = 1; i < args.length; i++) {
                if (!fn(obj, args[i])) {
                    throw '*Fail ' + name + ' ' + args.map(toStr).join(', ');
                }
                obj = args[i];
            }
        },
        toStr: function (obj) {
            if (obj === null) {
                return '<null>';
            } else if (obj === undefined){
                return '<undefined>';
            } else if (Object.isString(obj)) {
                return '"' + obj + '"';
            }
            return obj;
        }
    }
});