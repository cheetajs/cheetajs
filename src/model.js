/*jshint -W020 */
window.$cheeta = window.Oo = window.$cheeta || {};

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
    // console.log('child defined: ', name);
    // var val = this.getValue();
    name = name.trim ? name.trim() : name;
    var model = this.children[name];
    if (model === undefined) {
      model = new $cheeta.Model(name, this, modelRef);
      this.children[name] = model;
      // if (val == null) {
      //   this.setValue({});
      // }
      if (!skipIntercept) $cheeta.objectModel.interceptProp(this.getValue(), name, model);
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
  // this.watch = function (callback) {
  //   var model = this;
  //   model.listeners.push(callback);
  //   return function () {
  //     model.listeners.remove(callback);
  //     if (!model.listeners.length) {
  //       // model.delete();
  //       // var m = model;
  //       // while (!Object.keys(m.children).length) {
  //       //   m.delete();
  //       //   m = m.parent;
  //       // }
  //     }
  //   };
  // };
  this.delete = function () {
    if (!this.deleted) {
      console.log('deleted', this.ref());
      this.deleted = true;
      if (this.parent.getValue() && this.parent.getValue().__cheetaModels__) {
        this.parent.getValue().__cheetaModels__.isIntercepted(this.names[0], false);
      }
      delete this.parent.children[this.names[0]];
    }
  };
  this.interceptAndListen = function () {
    return $cheeta.objectModel.interceptAndListen(this);
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
  arrayMethodNames: ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse'],
  modelStoreFn: function () {
    var models, intercepted;
    var fn = function (propName, fns) {
      if (fns) {
        models = models || {};
        var hasModelProp = models[propName];
        models[propName] = models[propName] || [];
        models[propName] = models[propName].concat(fns);
        return hasModelProp;
      } else {
        return models && models[propName];
      }
    };
    fn.isIntercepted = function (prop, b) {
      intercepted = intercepted || {};
      if (b !== undefined) {
        if (!b) {
          delete intercepted[prop];
        } else {
          intercepted[prop] = b;
        }
      }
      return intercepted[prop];
    };
    return fn;
  },
  registerModelForObject: function (obj, propName, fns) {
    if (Object.isObject(obj)) {
      if (!obj.__cheetaModels__) {
        obj.__cheetaModels__ = this.modelStoreFn();
      }
      return obj.__cheetaModels__(propName, fns);
    }
  },
  fireValueChanges: function (obj, propName, val) {
    if (obj && obj.__cheetaModels__) {
      var model = obj.__cheetaModels__(propName);
      if (model) {
        for (var i = 0; i < model.length; i++) {
          for (var j = 0; j < model[i].fns.length; j++) {
            model[i].fns[j](val, model.expr);
          }
          // if (Object.isArray(val)) {
          //   for (var j = 0; j < this.arrayMethodNames.length; j++) {
          //     var methodName = this.arrayMethodNames[j];
          //     val[methodName] = this.interceptArrayFn(m, val[methodName]);
          //   }
          // }
        }
      }
    }
  },
  interceptProp: function (obj, prop, model) {
    // console.log('intercepting', obj, prop, model.ref());
    if (Object.isObject(obj)) {
      var propDesc = Object.getOwnPropertyDescriptor(obj, prop);
      if (propDesc && !propDesc.configurable) {
        if (prop !== 'length') {
          if (console.warn) {
            console.warn('WARNING: property is not configurable. Cannot listen to model changes.', obj, prop);
          }
        }
        return false;
      } else {
        var origVal = obj[prop];
        this.registerModelForObject(obj, prop, model);
        if (!obj.__cheetaModels__.isIntercepted(prop)) {
          Object.defineProperty(obj, prop, this.objectPropertyInterceptor(obj, prop));
          obj.__cheetaModels__.isIntercepted(prop, true);
        }
        obj[prop] = origVal;
      }
    }
  },
  interceptAndListen: function (obj, propPath, fns) {
    var split = propPath.split('.'), path;
    for (var j = 0; j < split.length; j++) {
      var prop = split[j];
      path += (path ? '.' : '') + prop;
      if (!this.interceptProp(obj, prop, {fns: fns, path: path})) break;
      obj = obj[prop];
    }
  },
  objectPropertyInterceptor: function (obj, prop) {
    var value, objModel = this;
    return {
      get: function () {
        return value;
      },
      set: function (val) {
        value = val;
        objModel.fireValueChanges(obj, prop, val);
      },
      enumerable: true,
      configurable: true
    };
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
              model.children[i].delete();
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
};

// (function () {
//   var windowModel = new $cheeta.Model('');
//   windowModel.value = window;
//   window.$$cheetaId = 1;
//   $cheeta.Model.root = windowModel.child('M');
//   $cheeta.Model.root.modelRef = 'M';
//   window.M = window.M || {};
//   // $cheeta.Model.root = windowModel;
//   // $cheeta.Model.root.modelRef = 'window';
// })();

$cheeta.model = function (name, value) {
  if (name === undefined) {
    return window.M;
  } else {
    var model = $cheeta.parser.parse(name, {}).models[0];
    if (value === undefined) {
      var val = model.getValue();
      if (val === undefined) {
        val = {};
        model.setValue(val);
      }
      return val;
    } else {
      model.setValue(value);
      return value;
    }
  }
};

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
        } catch (e) {
          if (console.error) {
            console.error(e.message, e);
          }
          results.push(e);
        } finally {
          // console.log('one future complete', self.fns.length, results.length);
          if (results.length === self.fns.length) {
            // console.log('All futures complete');
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
  $cheeta.future.evals.push(new $cheeta.Future(future, delay || 0));
  // $cheeta.future.evals.push(delay ? new $cheeta.Future(future, delay) : future);
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