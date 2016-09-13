$cheeta.templates = [];
$cheeta.compiler = {
  recursiveCompile: function (node, scope, skipNode) {
    if (node && (!node._ooCompiled_|| skipNode)) {
      node._ooCompiled_ = true;
      if (!skipNode) {
        if (node.nodeType === 1) {
          if (node.tagName.toLowerCase() === 'script') {
            if (node.getAttribute('id') && node.getAttribute('type').indexOf('template') > -1) {
              $cheeta.templates[node.getAttribute('id')] = node.innerHTML || '';
              node._ooIsTemplatePlaceHolder_ = true;
            }
          }
          this.linkDirectivesWithScope(node, scope);
        } else if (node.nodeType === 3) {
          this.replaceCurly(node, scope);
        }
      }
      if (!node._ooIsTemplatePlaceHolder_) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var childNode = node.childNodes[i];
          this.recursiveCompile(childNode, node._ooScope_ || scope);
        }
      }
    }
  },
  replaceCurly: function (node, scope) {
    var txt = node.textContent;
    if (txt.indexOf('{{') === -1) return node;
    txt = txt.replace(/\{\{(.*?)\}\}\}?/g, function (m, p) {
      var isConst = p.charAt(0) === '{';
      return '<span ' + (isConst ? 'const.' : 'text.') + '="' +
        (isConst ? p.substring(1) : p) + '"></span>';
    });
    var div = document.createElement('div');
    div.innerHTML = txt;
    while (div.childNodes.length > 0) {
      var childNode = div.childNodes[0];
      node.parentNode.insertBefore(childNode, node);
      this.recursiveCompile(childNode, scope);
    }
    node.parentNode.removeChild(node);
  },
  getDirectives: function (elem, attrs) {
    var directives = [];
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (attr.name.endsWith('.')) {
        var dirs = $cheeta.directive.getAll(attr);
        directives = directives.concat(dirs);
      }
    }
    directives.sort(function (a, b) {
      return (a.directive.order || 1000) - (b.directive.order || 1000);
    });
    return directives;
  },
  linkDirectivesWithScope: function (elem, scope) {
    return this.linkDirectives(elem, undefined, undefined, scope);
  },
  linkDirectives: function (elem, name, value, scope) {
    var directives = this.getDirectives(elem, name ? [{name: name + '.', value: value}] : elem.attributes),
      result = {};
    if (!directives || !directives.length) return false;
    elem._ooScope_ = elem._ooScope_ || scope;
    for (var i = 0; i < directives.length; i++) {
      if (elem._ooIsTemplatePlaceHolder_) break;
      var dir = directives[i];
      Object.copy(dir.directive.link(elem, new $cheeta.Attribute(elem, dir.name, dir.value, dir.key)), result);
    }
    return result;
  },
  doCompile: function (elem, skipNode) {
    elem.addClass('oo-invisible');
    this.recursiveCompile(elem, this.getScope(elem), skipNode);
    $cheeta.runFutures(function () {
      elem.removeClass('oo-invisible');
    });
  },
  compile: function (elem) {
    this.doCompile(elem);
  },
  compileChildren: function (elem) {
    this.doCompile(elem, true);
  },
  getScope: function (elem) {
    return (elem && (elem._ooScope_ || this.getScope(elem.parentElement))) || window._ooScope_;
  },
  listenToElementRemoval: function () {
    function fireRemove(el, removeSiblings) {
      if (el) {
        if (el.hasDirective) {
          el.dispatchEvent(new CustomEvent($cheeta.directive.removeEventName, {'detail': {target: el}}));
        }
        fireRemove(el.firstElementChild, true);
        if (removeSiblings) fireRemove(el.nextElementSibling, true);
      }
    }
    var mutationObserver = new MutationObserver(function (mutationRecords) {
      for (var i = 0; i < mutationRecords.length; i++) {
        var mutationRecord = mutationRecords[i];
        if (mutationRecord.type === 'childList') {
          if (mutationRecord.removedNodes.length > 0) {
            for (var j = 0; j < mutationRecord.removedNodes.length; j++) {
              fireRemove(mutationRecord.removedNodes[j]);
            }
          }
        }
      }
    });
    mutationObserver.observe(document.body, {childList: true, subtree: true});
  }
};
window.addEventListener('load', function () {
  if (!$cheeta.isInitialized) {
    $cheeta.isInitialized = true;
    document.addCssStyle('.oo-invisible { visibility: hidden; } .hidden {display: none!important}');
    $cheeta.hash.init();
    // window.M = function(v){console.log(v);};
    // $cheeta.compiler.linkDirectives(window, 'model', 'M: window.M');
      // .M.intercept(window.M);
    $cheeta.debugger.init($cheeta.debug);
    $cheeta.compiler.compile(document.documentElement);
    $cheeta.compiler.listenToElementRemoval();

    if ($cheeta.debug) {
      $cheeta.M = function(expr) {
        return Array.prototype.slice.call($0.attributes, 0).filter(function (attr) {
          return attr._ooAttr_;
        })[0]._ooAttr_.evaluate(expr);
      };
      $cheeta.M.values = function() {
        return $0._ooScope_ && Object.keys($0._ooScope_.models).reduce(function(p, c) {
            p[c] = $0._ooScope_.models[c] .getModelValue();
            return p;
          }, {});
      };
      $cheeta.M.models = function() {
        return $0._ooScope_ && $0._ooScope_.models;
      };
    }
  }
}, false);
