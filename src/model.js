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
  this.setValue = function (val) {
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
      if (!skipIntercept) $cheeta.objectModel.intercept(model, this.getValue());
    }
    return model;
  };

  this.valueChange = function () {
    for (var i = 0; i < this.listeners.length; i++) {
      var listener = this.listeners[i];
      listener.call(this);
    }
    return this;
  };
  this.watch = function (callback) {
    var model = this;
    model.listeners.push(callback);
    return function() {
      model.listeners.splice(model.listeners.indexOf(callback), 1);
      if (!model.listeners.length) {
        var m = model;
        while (!Object.keys(m.children).length) {
          delete m.parent.children[m.names[0]];
          m = m.parent;
        }
      }
    };
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
$cheeta.objectModel = {
  objectIdModelMap: {},
  uid: 2,
  arrayMethodNames: ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse'],
  addValueToModelMap: function (value, model) {
    if (!value.$$cheetaId) {
      value.$$cheetaId = this.uid++;
    }
    if (!this.objectIdModelMap[value.$$cheetaId]) {
      this.objectIdModelMap[value.$$cheetaId] = [];
    }
    this.objectIdModelMap[value.$$cheetaId].push(model);
  },
  fireValueChanges: function (parentVal, propName) {
    console.log('firing', parentVal, propName);
    if (parentVal.$$cheetaId) {
      var models = this.objectIdModelMap[parentVal.$$cheetaId];
      if (models) {
        if (!models.length) {
          delete this.objectIdModelMap[parentVal.$$cheetaId];
        } else {
          for (var i = 0; i < models.length; i++) {
            var m = models[i].children[propName];
            if (m) {
              console.log('firing', m.ref());
              m.valueChange();
            // } else {
            //   models.splice(i--, 1);
            }
          }
        }
      }
    }
  },
  interceptArrayFn: function (model, fn) {
    return function () {
      var oldLen = model.getValue().length;
      try {
        return fn.apply(this, arguments);
      } finally {
        model.valueChange();
        var newLen = model.getValue().length;
        if (newLen !== oldLen) {
          if (newLen < oldLen) {
            for (var i = newLen; i < oldLen; i++) {
              var child = model.child(i);
              child.prevValue = child.value;
              child.value = undefined;
              // child.valueChange();
              delete model.children[child.names[0]];
            }
          }
          var lengthModel = model.child('length', null, true);
          lengthModel.prevValue = oldLen;
          lengthModel.value = newLen;
          lengthModel.valueChange();
        }
      }
    };
  },
  intercept: function (model, parentVal) {
    var objModel = this;
    if (parentVal != null) {
      var propName = model.names[0];
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
            value = val;
            if (Object.isObject(val)) {
              objModel.addValueToModelMap(val, model);
            }
            if (val !== undefined) {
              for (var key in model.children) {
                if (model.children.hasOwnProperty(key)) {
                  // this.children[key].unintercept(this.prevValue);
                  objModel.intercept(model.children[key], val);
                }
              }
              if (Object.isArray(val)) {
                for (var i = 0; i < objModel.arrayMethodNames.length; i++) {
                  var methodName = objModel.arrayMethodNames[i];
                  val[methodName] = objModel.interceptArrayFn(model, val[methodName]);
                }
              }
            }
            objModel.fireValueChanges(parentVal, propName);
          }
        },
        enumerable: true,
        configurable: true
      });
      model.setValue(origVal);
    }
  }
};

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