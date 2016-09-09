$cheeta.compiler = {
  recursiveCompile: function (node, scope, skipNode) {
    if (node && !node.ooCompiled) {
      node.ooCompiled = true;
      if (!skipNode) {
        if (node.nodeType === 1) {
          if (node.tagName.toLowerCase() === 'script') {
            if (node.getAttribute('id') && node.getAttribute('type').indexOf('template') > -1) {
              $cheeta.templates[node.getAttribute('id')] = node.innerHTML || '';
              node.isTemplatePlaceHolder = true;
            }
          }
          this.linkDirectives(node, scope);
        } else if (node.nodeType === 3) {
          this.replaceCurly(node, scope);
        }
      }
      if (!node.isTemplatePlaceHolder) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var childNode = node.childNodes[i];
          this.recursiveCompile(childNode, node.ooScope || scope);
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
  getDirectives: function (elem) {
    var directivs = [];
    for (var i = 0; i < elem.attributes.length; i++) {
      var attr = elem.attributes[i];
      if (attr.name.endsWith('.')) {
        var dirs = $cheeta.directive.getAll(attr.name);
        for (var j = 0; j < dirs.length; j++) {
          var dir = dirs[j];
          dir.currAttr = attr;
        }
        directivs = directivs.concat(dirs);
      }
    }
    directivs.sort(function (a, b) {
      return (a.order || 1000) - (b.order || 1000);
    });
    return directivs;
  },
  linkDirectives: function (elem, scope) {
    var directives = this.getDirectives(elem);
    if (!directives) return false;
    elem.ooScope = scope;
    for (var i = 0; i < directives.length; i++) {
      if (elem.isTemplatePlaceHolder) break;
      var dir = directives[i];
      dir.link(elem, new $cheeta.Attribute(elem, dir.currAttr.name, dir.currAttr.value));
    }
  },
  linkDirective: function (elem, name, value) {
    var dir = $cheeta.directive.get(name);
    return dir.link(elem, new $cheeta.Attribute(elem, name, value));
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
    return (elem && (elem.ooScope || this.getScope(elem.parentElement))) || window.ooScope;
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
window.M = {};
window.addEventListener('load', function () {
  if (!$cheeta.isInitialized) {
    $cheeta.isInitialized = true;
    document.addCssStyle('.oo-invisiblee { visibility: hidden; } .hidden {display: none!important}');
    $cheeta.hash.init();
    // $cheeta.rootModel = new $cheeta.Model('M');
    // $cheeta.rootModel.value = $cheeta.rootModel.intercept(window.M = {});
    // window.ooScope = {models: {'M': $cheeta.rootModel}};
    $cheeta.compiler.linkDirective(window, 'model', 'M: window.M');
    $cheeta.Model.root = window.M = window.ooScope.models.M.intercept(window.M);
    $cheeta.debugger.init();
    $cheeta.compiler.compile(document.documentElement);
    $cheeta.compiler.listenToElementRemoval();
  }
}, false);
