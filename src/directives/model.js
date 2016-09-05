$cheeta.directive.add({
  name: 'model',
  order: 200,
  modelWatchFn: function(model, attr) {
    return function (val) {
      if (model.value !== val) {
        model.value = model.intercept(val);
        if (model.value !== val) {
          attr.setModelValue(model.value, model.ref);
        } else {
          model.valueChange();
        }
        // console.log('set model value' + model.name, model.value);
        // var fn;
        // eval('var fn = function(v){' + model.ref + '=v;};');
        // fn.call(this, model.value);
      }
    };
  },
  link: function (elem, attr) {
    //TODO handle app1['myapp,yourapp']
    var modelDef = attr.value.split(/ *[;] */g);

    elem.ooScope = {models: {}, parent: elem.ooScope};

    for (var i = 0; i < modelDef.length; i++) {
      if (modelDef[i] === '') continue;
      var index = modelDef[i].indexOf(':');
      var ref = (modelDef[i].substring(index + 1) || modelDef[i].substring(0, index)).trim();
      var as = index > -1 ? modelDef[i].substring(0, index).trim() : ref;

      elem.ooScope.__last__ = as;
      var model = new $cheeta.Model(as);
      elem.ooScope.models[as] = model;
      model.ref = ref;
      var modelWatchFn = this.modelWatchFn(model, attr);
      attr.watch(modelWatchFn, ref);
      var val = attr.evaluate(ref);
      if (val != null) {
        modelWatchFn(val);
      }
    }
  }
});
