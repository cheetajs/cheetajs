$cheeta.directive.add({
  name: 'model',
  order: 200,
  makeUpdateFn: function(model) {
    return function (val) {
      model.valueChange(model.value = model.interceptAllChildren(val));
      if ($cheeta.debug) {
        (window.M = window.M || {})[model.name] = model.value;
      }
    };
  },
  link: function (elem, attr) {
    elem._ooScope_ = {models: {}, parent: elem._ooScope_, elem: elem,
      last: elem._ooScope_  && elem._ooScope_.last, values: {}};
    if ($cheeta.debug) {
      elem._ooScope_.id = this.id = ++this.id || 1;
    }
    //TODO handle app1['myapp,yourapp']
    var modelDefs = attr.value.split(/ *[;] */g);

    for (var i = 0; i < modelDefs.length; i++) {
      var modelDef = modelDefs[i];
      if (modelDef === '') continue;
      var index = modelDef.indexOf(':'),
        ref = modelDef.substring(index + 1).trim(),
        as = modelDef.substring(0, index).trim() || '';

      var model = new $cheeta.Model(as);
      var parseRes = attr.parseModels(ref);
      if (parseRes[0] && parseRes[0].isSingleModel) {
        var refModel = parseRes[0].model;
        model.refModel = refModel;
        refModel.refs = refModel.refs || [];
        refModel.refs.push(model);
      } else {
        attr.watch(this.makeUpdateFn(model), ref);
        // if (model.value && model.value.__template__) {
        //   $cheeta.templates[attr.value] = model.value.__template__;
        //   model.value.__templateUrl__ = attr.value;
        // }
        // if (model.value && model.value.__templateUrl__) {
        //   $cheeta.compiler.linkDirectives(elem, 'view', '\'' + attr.value + '\'');
        // }
      }
      elem._ooScope_.last = as;
      elem._ooScope_.models[as] = model;
    }
    return elem._ooScope_.models;
  }
});
