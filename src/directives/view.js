$cheeta.directive.add({
  name: 'view,template',
  order: 900,
  baseURL: window.location.protocol + '//' + window.location.hostname +
  (window.location.port && ':' + window.location.port) + window.location.pathname,
  loadView: function (elem, content) {
    if (!elem._ooIsTemplatePlaceHolder_) {
      elem.innerHTML = content;
      $cheeta.compiler.compileChildren(elem);
    }
  },
  loadingElements: {},
  link: function (elem, attr) {
    var dir = this;
    attr.watch(function (val) {
      elem.compiled = true;
      if (!dir.loadingElements[elem] && val != null) {
        // to avoid infinite loop
        dir.loadingElements[elem] = true;
        try {
          var content = $cheeta.templates[val];
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
          delete dir.loadingElements[elem];
        }
      }
    });
  }
});