$cheeta.directive.add({
  name: 'model',
  order: 200,
  link: function (elem, attr) {
    //TODO handle app1['myapp,yourapp']
    var modelDef = attr.value.split(/ *[;] */g);

    elem.ooScope = {models: {}, parent: elem.ooScope, elem: elem};
    if ($cheeta.debug) {
      elem.ooScope.id = this.id = ++this.id || 1;
    }

    for (var i = 0; i < modelDef.length; i++) {
      if (modelDef[i] === '') continue;
      var index = modelDef[i].indexOf(':');
      var ref = (modelDef[i].substring(index + 1) || modelDef[i].substring(0, index)).trim();
      var as = index > -1 ? modelDef[i].substring(0, index).trim() : null;
      if (!as) {
        as = ref;
        ref = elem.ooScope.parent.__last__ + '.' + ref;
      }

      var model = new $cheeta.Model(as);
      var refModel = attr.parseModels(ref).models[0];
      if (refModel) {
        model.refModel = refModel;
        refModel.refs = refModel.refs || [];
        refModel.refs.push(model);
      }
      elem.ooScope.__last__ = as;
      elem.ooScope.models[as] = model;
    }
  }
});
