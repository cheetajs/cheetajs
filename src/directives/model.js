$cheeta.directive.add({
  name: 'model',
  order: 200,
  id: 1,
  linkModelToParentFn: function (model) {
    return function (baseModel, tokens, refModel) {
      model.refTokens = tokens;
      model.baseModel = baseModel;
      model.refModel = refModel;
      refModel.refs = refModel.refs || [];
      refModel.refs.push(model);
      refModel.addListener(function (obj) {
        model.intercept(obj);
        model.valueChange(obj);
      });
    };
  },
  link: function (elem, attr) {
    //TODO handle app1['myapp,yourapp']
    var modelDef = attr.value.split(/ *[;] */g);

    elem.ooScope = {models: {}, parent: elem.ooScope, id: this.id++};

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
      attr.parseModels(ref, this.linkModelToParentFn(model), true);
      elem.ooScope.__last__ = as;
      elem.ooScope.models[as] = model;
      // model.valueChange();
    }
  }
});
