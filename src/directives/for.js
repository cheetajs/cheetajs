// for maps you can do for.="key: Object.keys(obj)"
$cheeta.directive.add({
  name: 'for',
  isTemplate: true,
  order: 100,
  link: function (elem, attr, all, modelRefs) {
    var refElem = document.createComment(elem.outerHTML);
    elem.addAfter(refElem);
    var parsed = this.parse(attr.value);
    elem.removeAttr('for.');
    elem.attr('model.', parsed.variable + ':<M>;' + (elem.attr('model.') || ''));
    elem.cheetaNotCompiled = true;
    elem.addClass('hidden');

    function repeatElements(val, oldVal, isRange) {
      oldVal = oldVal || 0;
      var i;
      if (val > oldVal) {
        for (i = oldVal; i < val; i++) {
          var el = elem.cloneNode(true);
          el.removeClass('hidden');
          el.attr('model.', el.attr('model.').replace('<M>',
            isRange ? i + 1 : parsed.ref + '[' + i + ']'));
          refElem.addBefore(el);
          if (parsed.index) {
            modelRefs[parsed.index] = i;
          }
          $cheeta.compiler.compile(el, modelRefs);
        }
      } else if (val < oldVal) {
        for (i = val; i < oldVal; i++) {
          var toBeRemoved = refElem.prev();
          toBeRemoved.remove();
          // attr.fireElemRemoved(toBeRemoved);
        }
      }
    }

    var oldLen;
    attr.watch(function (val) {
      var isRange = val != null && !isNaN(parseFloat(val));
      var len = isRange ? val : (val ? val.length : 0);
      repeatElements(len, oldLen, isRange);
      oldLen = len;
    }, parsed.ref);
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