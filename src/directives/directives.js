$cheeta.directive.add({
  name: 'watch',
  link: function (elem, attr) {
    function makeEval(fn) {
      return function () {
        attr.evaluate(fn);
      };
    }

    var split = attr.value.split(';');
    for (var i = 0; i < split.length; i++) {
      var modelFn = split[i].split(':');
      attr.watch(makeEval(modelFn[1]), modelFn[0]);
    }
  }
});
$cheeta.directive.add({
  name: 'value',
  link: function (elem, attr) {
    attr.watch(function (val, e) {
      // if same element bind event triggers this watch ignore it
      if (e && elem.ooCurrentEvent === e) return;
      if (elem.type && elem.type.toLowerCase() === 'checkbox') {
        elem.checked = val;
      } else if (elem.value !== val) {
        elem.value = val || null;
      }
    });
  }
});
$cheeta.directive.add({
  name: 'bind',
  order: 800,
  link: function (elem, attr) {
    var split = attr.value.split(':');
    var modelExpr = split[0];
    var onChangeFn = split[1];
    $cheeta.compiler.linkDirectives(elem, 'value', modelExpr.split(',')[0], attr.scope);
    // $cheeta.directive.adds.get('value')[0].directive.link(elem, allAttr({name: attr.name, value: split[0].split(',')[0]}));
    function elemValue() {
      if (elem.type && elem.type.toLowerCase() === 'checkbox') {
        return elem.checked;
      }
      if (elem.tagName.toLowerCase() === 'input' || elem.tagName.toLowerCase() === 'textarea') {
        return elem.value;
      } else {
        return elem.innerHTML;
      }
    }

    //todo exclude keys that don't edit like arrow keys
    elem.on('change keydown keyup', function (e) {
      Oo.Model.currentEvent = elem.ooCurrentEvent = e;
      attr.setModelValue(elemValue(), modelExpr);
      if (split.length > 1) {
        attr.evaluate(onChangeFn);
      }
      delete Oo.Model.currentEvent;
      delete elem.ooCurrentEvent;
    });
  }
});
$cheeta.directive.add({
  name: 'text',
  link: function (elem, attr) {
    attr.watch(function (val) {
      elem.innerHTML = '';
      elem.appendChild(document.createTextNode(val == null ? '' : val));
    });
  }
});
$cheeta.directive.add({
  name: 'const',
  link: function (elem, attr) {
    setTimeout(function () {
      var val = attr.evaluate();
      elem.innerHTML = '';
      elem.appendChild(document.createTextNode(val == null ? '' : val));
    }, 0);
  }
});
$cheeta.directive.add({
  name: 'html',
  link: function (elem, attr) {
    attr.watch(function (val) {
      if (val !== elem.innerHTML) {
        elem.innerHTML = val == null ? '' : val;
      }
    });
  }
});

$cheeta.directive.add({
  name: 'show',
  link: function (elem, attr) {
    attr.watch(function (val) {
      if (val) {
        elem.removeClass('hidden');
      } else {
        elem.addClass('hidden');
      }
    });
  }
});

$cheeta.directive.add({
  name: 'hover', link: function (elem, attr) {
    var over = false;
    elem.addEventListener('mouseover', function () {
      if (!over) {
        over = true;
        attr.setModelValue(over);
      }
    });
    elem.addEventListener('mouseleave', function () {
      if (over) {
        over = false;
        attr.setModelValue(over);
      }
    });
  }
});

$cheeta.directive.add({
  name: 'onaction',
  link: function (elem, attr) {
    $cheeta.compiler.linkDirectives(elem, 'onclick.onkeydown-space-enter', attr.value);
  }
});

$cheeta.directive.add({
  name: 'init',
  link: function (elem, attr) {
    $cheeta.future(function(){attr.evaluate();});
  }
});

$cheeta.directive.add({
  name: 'focus',
  link: function (elem, attr) {
    attr.watch(function (val) {
      elem.focus(val);
    });
  }
});
//default
$cheeta.directive.add({
  name: '',
  link: function (elem, attr) {
    var baseAttrName = attr.key, prevVal;
    attr.watch(function (val) {
      if (baseAttrName === 'class' || baseAttrName === 'style') {
        var delimiter = baseAttrName === 'class' ? ' ' : ';';
        var attrVal = elem.getAttribute(baseAttrName);
        if (attrVal && prevVal) {
          elem.setAttribute(baseAttrName, attrVal.replace(prevVal, val));
        } else {
          if (val) {
            elem.setAttribute(baseAttrName, attrVal + (attrVal ? delimiter : '') + val);
          }
        }
      } else if ((baseAttrName === 'disabled' || baseAttrName === 'multiple' || baseAttrName === 'required') &&
        val === false) {
        elem.removeAttribute(baseAttrName);
      } else if (val == null) {
        elem.removeAttribute(baseAttrName);
      } else {
        elem.setAttribute(baseAttrName, val);
      }
      prevVal = val;
    });
  }
});