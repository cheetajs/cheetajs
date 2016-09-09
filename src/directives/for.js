// for maps you can do for.="key: Object.keys(obj)"
// for range for.="index : n" will repeat n times
$cheeta.directive.add({
  name: 'for',
  isTemplate: true,
  order: 100,
  link: function (elem, attr) {
    var parsed = this.parse(attr.value);
    elem.removeAttr('for.');
    elem.attr('model.', parsed.variable + ':<M>;' + (elem.attr('model.') || ''));
    elem._ooIsTemplatePlaceHolder_ = true;
    elem.addClass('hidden');

    var isRepeating = false;
    function repeatElements(val, oldVal, isRange) {
      if (!isRepeating) {
        isRepeating = true;
        try {
          oldVal = oldVal || 0;
          var i;
          if (val > oldVal) {
            for (i = oldVal; i < val; i++) {
              var el = elem.cloneNode(true);
              el.removeClass('hidden');
              el.attr('model.', el.attr('model.').replace('<M>',
                isRange ? i + 1 : parsed.ref + '[' + i + ']'));
              elem.addBefore(el);
              if (parsed.index) {
                el._ooScope_.models[parsed.index] = i;
              }
              el._ooScope_ = elem._ooScope_;
              $cheeta.compiler.compile(el);
            }
          } else if (val < oldVal) {
            for (i = val; i < oldVal; i++) {
              var toBeRemoved = elem.prev();
              toBeRemoved.remove();
              // attr.fireElemRemoved(toBeRemoved);
            }
          }
        } finally {
          isRepeating = false;
        }
      }
    }

    var oldLen;
    attr.watch(function (val) {
      // setTimeout(function () {
        var isRange = val != null && !isNaN(parseFloat(val));
        var len = isRange ? val : (val ? val.length : 0);
        repeatElements(len, oldLen, isRange);
        oldLen = len;
      // }, 0);
    }, parsed.ref);
    attr.watch(function (val) {
      // setTimeout(function () {
        repeatElements(val, oldLen, false);
        oldLen = val;
      // }, 0);
    }, parsed.ref + '.length');
  },
  parse: function (val) {
    var i = val.indexOf(':');
    var ref = val.substring(i + 1).trim();
    var keys = val.substring(0, i).trim().split(/ *, */g);
    return {
      ref: ref,
      index: keys.length > 1 ? keys[0] : null,
      variable: keys[keys.length - 1]
    };
  }
});