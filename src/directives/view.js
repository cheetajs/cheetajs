$cheeta.directive.add({
  name: 'view,template',
  order: 900,
  baseURL: window.location.protocol + '//' + window.location.hostname +
  (window.location.port && ':' + window.location.port) + window.location.pathname,
  loadView: function (elem, content) {
    if (!elem._ooIsTemplatePlaceHolder_) {
      elem.addClass('oo-invisible');
      elem.innerHTML = content;
      if (elem.childElementCount === 1 && elem.firstChild.tagName === 'SCRIPT') {
        elem.innerHTML = elem.firstChild.textContent;
      }
      $cheeta.compiler.compileChildren(elem);
    }
  },
  toCamelCase: function (str) {
    return str.replace(/(^|-)([a-z])/g, function (m, p1, p2) {
      return p2.toUpperCase();
    });
  },
  link: function (elem, attr) {
    // var tagClass = this.toCamelCase(elem.tagName.toLowerCase());
    // var clazz;
    // try {
    //   clazz = window[tagClass] || eval(tagClass);
    // } catch (e){}
    // if (clazz && typeof clazz === 'function') {
    //   $cheeta.compiler.linkDirectives(elem, 'model', 'new ' + tagClass + '()');
    // }
    var dir = this;
    attr.watch(function (val) {
      elem.compiled = true;
      if (!elem._ooIsTemplateLoading_ && val != null) {
        // to avoid infinite loop
        elem._ooIsTemplateLoading_ = true;
        try {
          var content = $cheeta.templates[val] ||
            (document.getElementById(val) && document.getElementById(val).innerHTML) ||
            (document.getElementById(elem.tagName.toLowerCase()) &&
            document.getElementById(elem.tagName.toLowerCase()).innerHTML);
          if (content != null) {
            dir.loadView(elem, content);
          } else {
            var url = val.indexOf('/') === 0 ? dir.baseURL + val : val;
            $cheeta.http.get(url).send().after(function (data) {
              $cheeta.templates[val] = data;
              dir.loadView(elem, data);
            });
          }
        } finally {
          delete elem._ooIsTemplateLoading_;
        }
      }
    });
  }
});