/*jshint -W020 */
$cheeta = Oo = {};

$cheeta.Model = function (name, parent, modelRef) {
  this.parent = parent;
  this.names = [name];
  this.children = {};
  this.modelRef = modelRef;
  this.listeners = [];
  this.ref = function () {
    if (this.modelRef == null) {
      if (this.parent == null) {
        this.modelRef = this.names[0];
      } else {
        return this.parent.ref() + (!isNaN(this.names[0]) ? '[\'' + this.names[0] + '\']' : '.' + this.names[0]);
      }
    }
    return this.modelRef;
  };

  this.getValue = function () {
    if (this.parent == null) {
      return window;
    } else {
      var parentVal = this.parent.getValue();
      return parentVal == null ? parentVal : parentVal[this.names[0]];
    }
  };
  this.setValue = function(val) {
    this.parent.getValue()[this.names[0]] = val;
  };
  this.child = function (name, modelRef, skipIntercept) {
    console.log('child defined: ', name);
    var val = this.getValue();
    name = name.trim ? name.trim() : name;
    var model = this.children[name];
    if (model === undefined) {
      model = new $cheeta.Model(name, this, modelRef);
      this.children[name] = model;
      if (val == null) {
        this.setValue({});
      }
      if (!skipIntercept) model.intercept(this.getValue());
    }
    return model;
  };

  this.addValueToModelMap = function (value) {
    if (!value.$$cheetaId) {
      value.$$cheetaId = $cheeta.Model.uid++;
    }
    if (!$cheeta.Model.objectIdModelMap[value.$$cheetaId]) {
      $cheeta.Model.objectIdModelMap[value.$$cheetaId] = [];
    }
    $cheeta.Model.objectIdModelMap[value.$$cheetaId].push(this);
  };
  function fireValueChanges(parentVal, propName, prevVal) {
    console.log('firing', parentVal, propName);
    if (parentVal.$$cheetaId) {
      var models = $cheeta.Model.objectIdModelMap[parentVal.$$cheetaId];
      if (models) {
        if (!models.length) {
          delete $cheeta.Model.objectIdModelMap[parentVal.$$cheetaId];
        } else {
          for (var i = 0; i < models.length; i++) {
            var childM = models[i].children[propName];
            //todo may not be necessary to remove from models
            if (!childM) {
              console.error('WARNING no child model exists for fire value change', models[i].ref(), parentVal.$$cheetaId);
              models.splice(i--, 1);
              continue;
            }
            console.log('firing', childM.ref());
            childM.valueChange(childM.getValue(), prevVal);
          }
        }
      }
    }
  }

  this.intercept = function (parentVal) {
    var model = this;
    if (parentVal != null) {
      var propName = this.names[0];
      var value;
      var origVal = parentVal[propName];
      console.log('intercepting: ', parentVal, propName, value);
      Object.defineProperty(parentVal, propName, {
        get: function () {
          return value;
        },
        set: function (val) {
          console.log('set: ', parentVal, propName, val);
          if (val !== value) {
            var prevVal = value;
            value = val;
            if (Object.isObject(val)) {
              model.addValueToModelMap(val);
            }
            if (val !== undefined) {
              for (var key in model.children) {
                if (model.children.hasOwnProperty(key)) {
                  // this.children[key].unintercept(this.prevValue);
                  model.children[key].intercept(val);
                }
              }
              if (Object.isArray(val)) {
                for (var i = 0; i < $cheeta.Model.arrayMethodNames.length; i++) {
                  var methodName = $cheeta.Model.arrayMethodNames[i];
                  model.origArrayMethods[methodName] = val[methodName];
                  val[methodName] = model.makeArrayFn(model, methodName);
                }
              }
            }
            fireValueChanges(parentVal, propName, prevVal);
          }
        },
        enumerable: true,
        configurable: true
      });
      model.setValue(origVal);
    }
  };

  this.origArrayMethods = {};

  this.makeArrayFn = function (model, methodName) {
    return function () {
      var oldLen = model.getValue().length, removedObjects;
      try {
        removedObjects = model.origArrayMethods[methodName].apply(this, arguments);
        return removedObjects;
      } finally {
        model.valueChange();
        if (removedObjects) {
          for (var i = 0; i < removedObjects.length; i++) {
            var obj = removedObjects[i];
            delete $cheeta.Model.objectIdModelMap[obj.$$cheetaId];
          }
        }
        var newLen = model.getValue().length;
        if (oldLen !== newLen) {
          var lengthModel = model.child('length', null, true);
          lengthModel.valueChange(newLen, oldLen);
        }
      }
    };
  };
  this.valueChange = function () {
    document.dispatchEvent(new CustomEvent('Oo-model-change-' + this.ref() + (this.refId || ''),
      {'detail': {/*value: val, prevValue: prevVal, */target: this}}));
    return this;
  };
  this.watch = function (elem, callback) {
    // var model = this;
    var listener, modelRef = this.ref();
    document.addEventListener('Oo-model-change-' + modelRef, (listener = function () {
      callback.call(elem/*, e.detail.value, e.detail.prevValue*/);
    }), false);
    elem.addEventListener('removed', function () {
      document.removeEventListener('Oo-model-change-' + modelRef, listener);
    }, false);
    this.listeners.push(listener);
  };
  this.unwatch = function(elem) {
    elem.dispatchEvent(new CustomEvent('removed', {'detail': {target: elem}}));
  };
  // this.interceptPropProxy = function (value, name, skipDefine) {
  //   if (!skipDefine) {
  //     var handler = {
  //       get: function (target, property) {
  //         return this[property];
  //       },
  //       set: function (target, property, propVal) {
  //         if (property === name) {
  //           console.log('setting ALERT');
  //           console.log('setting ', property, ' for ', this, ' with value ', value);
  //         }
  //         this[property] = propVal;
  //         // you have to return true to accept the changes
  //         return true;
  //       }
  //     };
  //     console.log('proxy ', value, name);
  //     var proxy = new Proxy(this.parent.value, handler);
  //     this.parent.setValue(proxy);
  //   }
  // };
};
$cheeta.Model.objectIdModelMap = {};
$cheeta.Model.uid = 2;
$cheeta.Model.arrayMethodNames = ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse'];

//$cheeta.refresh = function(modelRef) {
//	var model = $cheeta.model.createOrGetModel(null, modelRef);
//	model.valueChange(model.getValue(), null);
//};
(function () {
  var windowModel = new $cheeta.Model('');
  windowModel.value = window;
  window.$$cheetaId = 1;
  $cheeta.Model.root = windowModel.child('M');
  $cheeta.Model.root.modelRef = 'M';
  window.M = window.M || {};
  // $cheeta.Model.root = windowModel;
  // $cheeta.Model.root.modelRef = 'window';
  $cheeta.Model.multiModels = $cheeta.Model.root.child('$$multiModels');
})();

$cheeta.templates = [];
$cheeta.watchFns = [];
$cheeta.watch = function (modelExpr, fn) {
  $cheeta.watchFns.push(fn);
  var elem = document.createElement('div');
  elem.setAttribute('style', 'display:none !important');
  elem.setAttribute('watch.', modelExpr + ':' + '$cheeta.watchFns[' + ($cheeta.watchFns.length - 1) + ']()');
  document.body.appendChild(elem);
  $cheeta.compiler.compile(elem, [$cheeta.Model.root]);
};

$cheeta.Future = function (fn, delay, thisArg) {
  this.afterFn = null;
  this.fns = Object.isArray(fn) ? fn : (fn ? [fn] : []);
  var self = this;
  this.add = function (fn) {
    if (fn instanceof $cheeta.Future) {
      self.fns = self.fns.concat(fn.fns);
    } else {
      self.fns.push(fn);
    }
  };
  this.run = function () {
    if (!self.fns.length) {
      setTimeout(function () {
        self.afterFn.call(thisArg);
      }, 0);
      return self;
    }
    var results = [];

    function futureRun(fn) {
      return function () {
        try {
          results.push(fn.call(thisArg, arguments));
        } finally {
          if (results.length === self.fns.length) {
            self.afterFn.call(thisArg, results.length === 1 ? results[0] : results);
          }
        }
      };
    }

    for (var i = 0; i < self.fns.length; i++) {
      setTimeout(futureRun(self.fns[i]), delay || 0);
    }
    return self;
  };
  this.after = function (fn) {
    self.afterFn = fn;
  };
};

$cheeta.future = function (future, delay) {
  $cheeta.future.evals.push(delay ? new $cheeta.Future(future, delay) : future);
};

$cheeta.future.evals = $cheeta.future.evals || [];

$cheeta.runFutures = function (after) {
  var runs = $cheeta.future.evals;
  $cheeta.future.evals = [];
  var futures = new $cheeta.Future();
  for (var i = 0; i < runs.length; i++) {
    var expr = runs[i];
    if (expr instanceof $cheeta.Future) {
      futures.add(expr);
    } else if (Object.isFunction(expr)) {
      expr();
    } else {
      eval(expr);
    }
  }
  futures.run().after(function (result) {
    after(result);
  });
};

window.addEventListener('load', function () {
  if (!$cheeta.isInitialized) {
    $cheeta.isInitialized = true;
    $cheeta.hash.init();
    $cheeta.compiler.compile(document.documentElement, {});
  }
}, false);