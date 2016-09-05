$cheeta.compiler = {
  recursiveCompile: function (node, scope, skipSiblings) {
    if (node) {
      var skip = false;
      if (node.nodeType === 1) {
        if (node.tagName.toLowerCase() === 'script') {
          if (node.getAttribute('id') && node.getAttribute('type').indexOf('template') > -1) {
            $cheeta.templates[node.getAttribute('id')] = node.innerHTML || '';
            skip = true;
          }
        }
        this.linkDirectives(node, scope);
      } else if (node.nodeType === 3) {
        var txt = node.textContent;
        while (txt.indexOf('{{') > -1) {
          var resultNode = [];
          txt = txt.replace(/(.*)\{\{(.*)\}\}(.*)/, this.replaceTextCurly(node, resultNode));
          node = resultNode[0];
        }
      }
      if (!skip) {
        this.recursiveCompile(node.firstChild, node.ooScope || scope);
      }
      if (!skipSiblings) {
        this.recursiveCompile(node.nextSibling, node.ooScope || scope);
      }
    }
  },
  replaceTextCurly: function (node, resultNode) {
    return function (h, b, c, a) {
      var before = document.createTextNode(b);
      var after = document.createTextNode(a);
      var span = document.createElement('span');
      span.setAttribute('text.', c);
      node.parentNode.replaceChild(after, node);
      after.parentNode.insertBefore(span, after);
      span.parentNode.insertBefore(before, span);
      resultNode.push(before);
      return before.textContent;
    };
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
      return (a.directive.order || 1000) - (b.directive.order || 1000);
    });
    return directivs;
  },
  linkDirectives: function (elem, scope) {
    var directives = this.getDirectives(elem);
    if (!directives) return false;
    elem.ooScope = scope;
    directives.forEach(function (dir) {
      dir.link(elem, new $cheeta.Attribute(elem, dir.currAttr.name, dir.currAttr.value));
    });
  },
  linkDirective: function (elem, name, value) {
    var dir = $cheeta.directive.get(name);
    return dir.link(elem, new $cheeta.Attribute(elem, name, value));
  },
  doCompile: function (elem, skipSiblings) {
    elem.addClass('oo-invisible');
    this.recursiveCompile(elem, this.getScope(elem), skipSiblings);
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
    window.M = {};
    $cheeta.directive.get('model').link(window, new $cheeta.Attribute(window, 'model', 'M'));
    $cheeta.compiler.compile(document.documentElement);
  }
}, false);