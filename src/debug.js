$cheeta.debugger = {
  prevEl: null,
  capturing: false,
  init: function () {
    if ($cheeta.debug) {
      window.M = function(expr) {
        console.log(expr);
        return Array.prototype.slice.call($0.attributes, 0).filter(function (attr) {
          return attr._ooAttr_;
        })[0]._ooAttr_.evaluate(expr);
      };
      window.M.values = function() {
        return $0._ooScope_ && Object.keys($0._ooScope_.models).reduce(function(p, c) {
            p[c] = $0._ooScope_.models[c] .getModelValue();
            return p;
          }, {});
      };
      window.M.models = function() {
        return $0._ooScope_ && $0._ooScope_.models;
      };
    }
    $cheeta.templates['oo-debugger-panel'] =
      '<div model.="debug: M.ooDebugger; el: debug.elem">' +
      '<div>Click anywhere and hold down ctrl or alt to capture</div>' +
      '{{el.outerHTML.slice(0, el.outerHTML.indexOf(el.innerHTML))}}' +
      '<ul><li for.="attr: debug.attrs">{{{attr.name}}}={{{attr.value}}}' +
      '<a onclick.=".evalVal = attr._ooAttr_.evaluate()" href="javascript:">eval</a> {{JSON.stringify(.evalVal)}}</li></ul>' +
      '</div>';
    document.addCssStyle('.oo-debugger {resize: horizontal; overflow: auto; width: 300px; ' +
      'background: #F9F9F9; position: fixed; ' +
      'top: 0; right: 0; bottom: 0;transform: rotate(-180deg);}' +
      '.oo-debugger .oo-panel{transform: rotate(-180deg);position: absolute;bottom: 15px;right: 5px;' +
      'font-family: Arial,"Helvetica Neue",Helvetica,sans-serif;font-size:12px;}' +
      '.oo-hover-elem {outline: 1px solid red;}');
    // $cheeta.compiler.linkDirectives(window, 'watch', 'M.ooDebug: $cheeta.debugger.addPanel(M.ooDebug)');
  },
  keyListener: function (e) {
    if ((e.which === 17 || e.which === 18) && e.type === 'keydown') {
      this.capturing = true;
    } else {
      this.capturing = false;
    }
  },
  mouseListener: function (e) {
    if (!this.capturing) {
      return;
    }
    var elem = document.elementFromPoint(e.pageX - window.pageXOffset, e.pageY - window.pageYOffset);
    // var elem = document.elementFromPoint(e.pageX, e.pageY);
    if (!elem || elem === this.prevEl || window.ooDebugPanel === elem || window.ooDebugPanel.contains(elem)) return;
    if (this.prevEl) this.prevEl.removeClass('oo-hover-elem');
    this.prevEl = elem;
    elem.addClass('oo-hover-elem');
    window.M.ooDebugger.elem = elem;
    window.M.ooDebugger.attrs = Array.prototype.slice.call(elem.attributes, 0).filter(function (attr) {
      return !!attr._ooAttr_;
    });

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
      var debugEl = window.ooDebugPanel = document.createElement('div');
      debugEl.addClass('oo-debugger');
      var panel = document.createElement('div');
      panel.addClass('oo-panel');
      panel.setAttribute('id', 'oo-debugger');
      document.body.appendChild(debugEl);
      debugEl.appendChild(panel);
      panel.setAttribute('view.', '\'oo-debugger-panel\'');
      $cheeta.compiler.compile(panel);
      document.addEventListener('mousemove', this.mouseListener, false);
      document.addEventListener('keydown', this.keyListener, false);
      document.addEventListener('keyup', this.keyListener, false);
    } else {
      if (document.querySelector('oo-debugger')) document.querySelector('oo-debugger').remove();
      document.removeEventListener('mousemove', this.mouseListener);
      document.removeEventListener('keydown', this.keyListener, false);
      document.removeEventListener('keyup', this.keyListener, false);
      delete window.M.ooDebugger;
    }
  },
};
