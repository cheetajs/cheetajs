document.addCssStyle('.oo-debugger {resize: horizontal; overflow: auto; width: 300px; background: #F9F9F9; position: absolute; ' +
  'top: 0; right: 0; bottom: 0;transform: rotate(-180deg);}' +
  '.oo-debugger .oo-panel{transform: rotate(-180deg);position: absolute;bottom: 15px;right: 5px;' +
  'font-family: Arial,"Helvetica Neue",Helvetica,sans-serif;font-size:12px;}');
$cheeta.Model.prototype.allChildren = function () {
  var models = [];
  this.iterateChildren(function (child) {
    models = models.concat(child.allChildren());
    if (!Object.keys(child.children).length) {
      models.push(child);
    }
  });
  return models;
};
$cheeta.debugger = {
  prevEl: null,
  listener: function (e) {
    var elem = document.elementFromPoint(e.pageX, e.pageY);
    if (!elem || elem === this.prevEl) return;
    this.prevEl = elem;
    window.M.ooDebugger.elem = elem;
    window.M.ooDebugger.attrs = Array.prototype.slice.call(elem.attributes, 0);

    // var panel = document.getElementById('oo-debugger');
    // panel.innerText = 'Directives:\n';
    // if (!panel.contains(elem)) {
    //   for (var k = 0; k < elem.attributes.length; k++) {
    //     var attr = elem.attributes[k];
    //     if (attr.ooAttr) {
    //       panel.innerText = attr.ooAttr.key + ': ' + attr.ooAttr.value + '\n';
    //     }
    //   }
    //   if (elem.ooScope) {
    //     panel.innerText += 'Scope: ' + elem.ooScope.id + '\n';
    //     Object.keys(elem.ooScope.models).forEach(function (key) {
    //       panel.innerText += '\n' + key;
    //       var models = elem.ooScope.models[key].allChildren();
    //       for (var j = 0; j < models.length; j++) {
    //         var m = models[j];
    //         panel.innerText += '\n\t' + m.fullRef() + '(' + m.id + '): ' + JSON.stringify(m.getModelValue());
    //       }
    //     });
    //   }
    // }
  },
  addPanel: function (debug) {
    $cheeta.debug = debug;
    if (debug) {
      window.M.ooDebugger = window.M.ooDebugger || {};
      var debugEl = document.createElement('div');
      debugEl.addClass('oo-debugger');
      var panel = document.createElement('div');
      panel.addClass('oo-panel');
      panel.setAttribute('id', 'oo-debugger');
      document.body.appendChild(debugEl);
      debugEl.appendChild(panel);
      panel.setAttribute('view.', '\'oo-debugger-panel\'');
      $cheeta.compiler.compile(panel);
      document.addEventListener('mousemove', this.listener, false);
    } else {
      if (document.querySelector('oo-debugger')) document.querySelector('oo-debugger').remove();
      document.removeEventListener('mousemove', this.listener);
      delete window.M.ooDebugger;
    }
  },
};
$cheeta.templates['oo-debugger-panel'] =
  '<div model.="debug: M.ooDebugger; el: debug.elem">' +
  '<ul><li for.="attr: debug.attrs">{{attr.name}}={{attr.value}}<a click.="console.log(attr)">@</a></li></ul>' +
  '</div>';
