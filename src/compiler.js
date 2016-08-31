var elHead = document.getElementsByTagName('head')[0], elStyle = document.createElement('style');
elStyle.type = 'text/css';
elHead.appendChild(elStyle);
elStyle.innerHTML = '.oo-invisible { visibility: hidden; } .hidden {display: none!important}';

$cheeta.compiler = {
  recursiveCompile: function (node, modelsRefs, runInlineScripts, skipSiblings, skipNode) {
    if (node) {
      var skip = false;
      if (!skipNode) {
        if (node.nodeType === 1) {
          if (node.tagName.toLowerCase() === 'script') {
            if (runInlineScripts && (node.parentNode == null ||
              node.parentNode.tagName.toLowerCase() !== 'head') &&
              (node.type == null || node.type === '' || node.type === 'text/javascript')) {
              var content = node.innerHTML || '';
              var head = document.getElementsByTagName('head')[0] || document.documentElement;
              var script = document.createElement('script');
              script.type = 'text/javascript';
              script.appendChild(document.createTextNode(content));
              head.insertBefore(script, head.firstChild);
              head.removeChild(script);
            } else if (node.getAttribute('id')) {
              $cheeta.templates[node.getAttribute('id')] = node.innerHTML || '';
            }
          }
          var result = this.compileAllDirectives(node, modelsRefs);
          skip = result.skip;
          modelsRefs = result.refs;
        } else if (node.nodeType === 3) {
          var txt = node.textContent;
          while (txt.indexOf('{{') > -1) {
            var resultNode = [];
            txt = txt.replace(/(.*)\{\{(.*)\}\}(.*)/, this.replaceTextCurly(node, modelsRefs, resultNode));
            node = resultNode[0];
          }
        }
      }
      if (!skip) {
        this.recursiveCompile(node.firstChild, modelsRefs, runInlineScripts);
      }
      if (!skipSiblings) {
        this.recursiveCompile(node.nextSibling, modelsRefs, runInlineScripts);
      }
    }
  },
  replaceTextCurly: function (node, modelsRefs, resultNode) {
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
  compileAllDirectives: function (elem, modelRefs) {
    var directives = this.getAllDirectivesWithAttr(elem);
    return this.compileDirectives(elem, directives, modelRefs);
  },
  compileDirectives: function (elem, directives, modelRefs) {
    var isTemplate = false;
    for (var k = 0; k < directives.length; k++) {
      var dir = directives[k];
      var refs = dir.directive.linkFn(elem, {name: dir.name, value: dir.value}, modelRefs);
      if (refs) {
        modelRefs = Object.copy(modelRefs);
        Object.copy(refs, modelRefs);
      }
      isTemplate = isTemplate || dir.directive.isTemplate;
    }
    return {'refs': modelRefs, skip: isTemplate};
  },
  compileAttr: function (elem, attr, modelRefs) {
    return this.compileDirectives(elem, this.getDirectives(elem, attr), modelRefs);
  },
  getDirectives: function (elem, attr) {
    var directives = [];
    if (attr.name.indexOf('.', attr.name.length - 1) > -1) {
      var dirs = $cheeta.directives.get(attr.name);
      for (var i = 0; i < dirs.length; i++) {
        dirs[i].value = attr.value;
        directives.push(dirs[i]);
      }
    }
    return directives;
  },
  getAllDirectivesWithAttr: function (elem) {
    var attr, k, directives = [];
    var attributes = elem.attributes;
    attributes[-1] = {name: elem.tagName};
    for (k = -1; k < attributes.length; k++) {
      attr = attributes[k];
      directives = directives.concat(this.getDirectives(elem, attr));
    }
    directives.sort(function (a, b) {
      return (a.directive.order || 1000) - (b.directive.order || 1000);
    });
    return directives;
  },
  doCompile: function () {
    var el = arguments[0];
    el.addClass('oo-invisible');
    this.recursiveCompile.apply(this, arguments);
    $cheeta.runFutures(function () {
      el.removeClass('oo-invisible');
    });
  },
  compile: function (elem, modelRefs, runInlineScripts) {
    this.doCompile(elem, modelRefs, runInlineScripts, true);
  },
  compileChildren: function (elem, modelRefs, runInlineScripts) {
    this.doCompile(elem, modelRefs, runInlineScripts, true, true);
  }
};