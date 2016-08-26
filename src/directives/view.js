$cheeta.directive({
  name: 'view,template',
  order: 900,
  baseURL: window.location.protocol + '//' + window.location.hostname +
  (window.location.port && ':' + window.location.port) + window.location.pathname,
  loadView: function (elem, content, modelRefs) {
    if (elem.parentElement) {
      elem.innerHTML = content;
      $cheeta.compiler.compileChildren(elem, modelRefs, true);
    }
  },
  loadingElements: {},
  link: function (elem, attr, all, modelRefs) {
    var dir = this;
    attr.watch(function (val) {
      console.log('view', elem, elem.compiled);
      elem.compiled = true;
      if (!dir.loadingElements[elem] && val != null) {
        // to avoid infinite loop
        dir.loadingElements[elem] = true;
        try {
          var content = $cheeta.templates[val];
          if (content != null) {
            dir.loadView(elem, content, modelRefs);
          } else {
            var url = val.indexOf('/') === 0 ? dir.baseURL + val : val;
            $cheeta.http.get(url).send().after(function (data) {
              dir.loadView(elem, data, modelRefs);
              $cheeta.templates[val] = data;
            });
          }
        } finally {
          delete dir.loadingElements[elem];
        }
      }
    });
  }
});