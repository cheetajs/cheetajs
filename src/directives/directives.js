document.addCssStyle('.oo-invisible { visibility: hidden; } .hidden {display: none!important}');
$cheeta.directive.add({
  name: 'watch*',
  link: function (elem, attr) {
    function makeEval(fn) {
      return function () {
        attr.evaluate(fn);
      };
    }

    var split = attr.value.split(';'), len = split.length;
    while (len--) {
      var modelFn = split[len].split(':');
      attr.watch(makeEval(modelFn[1]), modelFn[0]);
    }
  }
});
$cheeta.directive.add({
  name: 'value',
  link: function (elem, attr) {
    attr.watch(function (val) {
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
    $cheeta.compiler.linkDirective(elem, 'value.', modelExpr.split(',')[0], attr.scope);
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
    elem.on('change keydown keyup', function () {
      attr.setModelValue(elemValue(), modelExpr);
      if (split.length > 1) {
        attr.evaluate(split[1]);
      }
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
        attr.setValue(over);
      }
    });
    elem.addEventListener('mouseleave', function () {
      if (over) {
        over = false;
        attr.setValue(over);
      }
    });
  }
});

$cheeta.directive.add({
  name: 'onaction',
  link: function (elem, attr) {
    $cheeta.compiler.linkDirective(elem, 'onclick.onkeydown-space-enter.', attr.value);
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

$cheeta.directive.add({
  name: '',
  link: function (elem, attr) {
    var baseAttrName = attr.key;
    attr.watch(function (val, prevVal) {
      if (baseAttrName === 'class' || baseAttrName === 'style') {
        var delimiter = baseAttrName === 'class' ? ' ' : ';';
        var attrVal = elem.getAttribute(baseAttrName);
        if (attrVal && prevVal) {
          elem.setAttribute(baseAttrName, attrVal.replace(prevVal, val));
        } else {
          elem.setAttribute(baseAttrName, attrVal + (attrVal ? delimiter : '') + val);
        }
      } else if ((baseAttrName === 'disabled' || baseAttrName === 'multiple' || baseAttrName === 'required') &&
        val === false) {
        elem.removeAttribute(baseAttrName);
      } else if (val == null) {
        elem.removeAttribute(baseAttrName);
      } else {
        elem.setAttribute(baseAttrName, val);
      }
    });
  }
});