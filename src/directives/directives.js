$cheeta.directive({
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
$cheeta.directive({
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
$cheeta.directive({
  name: 'bind',
  order: 800,
  link: function (elem, attr, allAttr, modelRefs) {
    var split = attr.value.split(':');
    $cheeta.compiler.compileAttr(elem,
      {name: 'value.', value: split[0].split(',')[0]}, modelRefs);
    // $cheeta.directives.get('value')[0].directive.link(elem, allAttr({name: attr.name, value: split[0].split(',')[0]}));
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

    function listen(models) {
      //todo exclude keys that don't edit like arrow keys
      elem.on('change keydown keyup', function () {
        for (var i = 0; i < models.length; i++) {
          models[i].setValue(elemValue());
        }
        if (split.length > 1) {
          attr.evaluate(split[1]);
        }
      });
    }

    listen(attr.models(split[0]));
  }
});
$cheeta.directive({
  name: 'text',
  link: function (elem, attr) {
    attr.watch(function (val) {
      elem.innerHTML = '';
      elem.appendChild(document.createTextNode(val == null ? '' : val));
    });
  }
});
$cheeta.directive({
  name: 'html',
  link: function (elem, attr) {
    attr.watch(function (val) {
      if (val !== elem.innerHTML) {
        elem.innerHTML = val == null ? '' : val;
      }
    });
  }
});

$cheeta.directive({
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

$cheeta.directive({
  name: 'onaction',
  link: function (elem, attr, allAttr, modelRefs) {
    $cheeta.compiler.compileAttr(elem,
      {name: 'onclick.onkeydown-space-enter.', value: attr.value}, modelRefs);
  }
});

$cheeta.directive({
  name: 'init',
  link: function (elem, attr) {
    $cheeta.future(attr.evaluate);
  }
});

$cheeta.directive({
  name: 'focus',
  link: function (elem, attr) {
    attr.watch(function (val) {
      elem.focus(val);
    });
  }
});

$cheeta.directive({
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

$cheeta.directive({
  name: 'model',
  order: 200,
  lastId: 0,
  link: function (elem, attr, allAttr, modelRefs) {
    //TODO handle app1['myapp,yourapp']
    var modelDef = attr.value.split(/ *[;] */g);
    var models = {};

    //function makeWatch(m, ref) {
    //	return function() {
    //		m.value = attr.evaluate(ref);
    //		m.valueChange();
    //	};
    //}

    for (var i = 0; i < modelDef.length; i++) {
      if (modelDef[i] === '') continue;
      //TODO handle app1['123 as 123']
      var index = modelDef[i].indexOf(':');
      var ref = (modelDef[i].substring(index + 1) || modelDef[i].substring(0, index)).trim();
      var as = index > -1 ? modelDef[i].substring(0, index).trim() : null;
      //if (as) {
      //var m = new $cheeta.Model(as, null);
      //m.refId = this.lastId++;
      //m.value = attr.evaluate(ref);
      //attr.watch(makeWatch(m, ref), ref);
      //models[as] = m;
      //models.$$last$$ = m;
      //} else {
      var model = attr.model(ref, modelRefs);
      models[as || model.names[0]] = model;
      models.$$last$$ = model;
      //}
//			eval(model.ref() + '=' + model.ref() + '|{}');
    }
    return models;
  }
});
