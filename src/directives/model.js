$cheeta.directive.add({
  name: 'model',
  order: 200,
  lastId: 0,
  root: {},
  link: function (elem, attr) {
    //TODO handle app1['myapp,yourapp']
    var modelDef = attr.value.split(/ *[;] */g);

    function watchFn(as) {
      return function (val) {
        elem.ooScope.values[as] = val;
        var list = elem.ooScope.getPrefixes(as + '.');
        for (var i = 0; i < list.length; i++) {
          var entry = list[i];
          $cheeta.objectModel.interceptAndListen(val, entry.key, entry.value);
        }
      };
    }

    var prevScope = elem.ooScope;
    elem.ooScope = new $cheeta.MapList();
    elem.ooScope.parent = prevScope;
    elem.ooScope.values = {};

    for (var i = 0; i < modelDef.length; i++) {
      if (modelDef[i] === '') continue;
      var index = modelDef[i].indexOf(':');
      var ref = (modelDef[i].substring(index + 1) || modelDef[i].substring(0, index)).trim();
      var as = index > -1 ? modelDef[i].substring(0, index).trim() : ref;

      elem.ooScope.__last__ = as;
      elem.ooScope.put(as, undefined);
      attr.watch(watchFn(as), ref);
    }
  }
});
