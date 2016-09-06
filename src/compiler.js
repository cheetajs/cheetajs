$cheeta.compiler = {
  recursiveCompile: function (node, scope, skipSiblings, skipNode) {
    if (node) {
      var skipChildren;
      if (!skipNode && !node.isTemplatePlaceHolder) {
        if (node.nodeType === 1) {
          if (node.tagName.toLowerCase() === 'script') {
            if (node.getAttribute('id') && node.getAttribute('type').indexOf('template') > -1) {
              $cheeta.templates[node.getAttribute('id')] = node.innerHTML || '';
              skipChildren = true;
            }
          }
          this.linkDirectives(node, scope);
        } else if (node.nodeType === 3) {
          node = this.replaceCurly(node);
        }
      }
      if (!skipChildren) {
        this.recursiveCompile(node.firstChild, node.ooScope || scope);
      }
      if (!skipSiblings) {
        this.recursiveCompile(node.nextSibling, scope);
      }
    }
  },
  replaceCurly: function (node) {
    var txt = node.textContent;
    if (txt.indexOf('{{') === -1) return node;
    txt = txt.replace(/\{\{(.*?)\}\}/g, function (h, c) {
      return '<span text.="' + c + '"></span>';
    });
    var div = document.createElement('div'), firstChild;
    div.innerHTML = txt;
    firstChild = div.firstChild;
    while (div.childNodes.length > 0) {
      node.parentNode.insertBefore(div.childNodes[0], node);
    }
    node.parentNode.removeChild(node);
    return firstChild.previousSibling || firstChild.parentNode;
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
    this.recursiveCompile(elem, this.getScope(elem), true, skipNode);
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
  }
};
window.addEventListener('load', function () {
  if (!$cheeta.isInitialized) {
    $cheeta.isInitialized = true;
    $cheeta.hash.init();
    // $cheeta.rootModel = new $cheeta.Model('M');
    // $cheeta.rootModel.value = $cheeta.rootModel.intercept(window.M = {});
    // window.ooScope = {models: {'M': $cheeta.rootModel}};
    $cheeta.compiler.linkDirective(window, 'model', 'M: window.M');
    $cheeta.Model.root = window.M = window.ooScope.models.M.intercept({});
    $cheeta.compiler.compile(document.documentElement);
  }
}, false);