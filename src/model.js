/*jshint -W020 */
window.$cheeta = window.Oo = window.$cheeta || {};

$cheeta.Model = function (name, parent) {
  this.parent = parent;
  this.name = name;
  this.children = {};
  this.listeners = [];
};

$cheeta.Model.prototype = {
  child: function (name) {
    name = name.trim();
    var model = this.children[name];
    if (model === undefined) {
      model = new $cheeta.Model(name, this);
      this.children[name] = model;
    }
    // set value to it's own value to make sure it is intercepted
    setTimeout(function (model) {
      var value = model.getModelValue();
      if (Object.isObject(value)) {
        model.setModelValue(value);
      }
    }, 0, this);
    return model;
  },
  makeChildren: function (tokens) {
    var model = this;
    for (var i = 1; i < tokens.length; i++) {
      model = model.child(tokens[i]);
    }
    return model;
  },
  fullRef: function () {
    if (this.parent == null) {
      if (this.refModel) {
        return this.refModel.fullRef();
      } else {
        return this.name;
      }
    } else {
      return this.parent.fullRef() + (!isNaN(this.name) ? '[\'' + this.name + '\']' : '.' + this.name);
    }
  },
  getModelValue: function () {
    if (this.parent) {
      var parentVal = this.parent.getModelValue();
      return parentVal && parentVal[this.name];
    } else if (this.refModel) {
      return this.refModel.getModelValue();
    } else
      return $cheeta.Model.root;
  },
  setModelValue(val) {
    if (this.parent) {
      var parentVal = this.parent.getModelValue();
      if (parentVal) parentVal[this.name] = val;
    } else if (this.refModel) {
      this.refModel.setModelValue(val);
    }
  },
  valueChange: function (obj) {
    // if (this.getModelValue() !== obj) {
    for (var i = 0; i < this.listeners.length; i++) {
      var listener = this.listeners[i];
      listener.call(this, obj);
    }
    for (var key in this.children) {
      if (this.children.hasOwnProperty(key)) {
        this.children[key].valueChange(obj && obj[key]);
      }
    }
    // }
    return this;
  },
  addListener: function (callback) {
    var model = this;
    model.listeners.push(callback);
    return function () {
      model.listeners.remove(callback);
      if (!model.listeners.length) {
        model.delete();
        var m = model;
        while (!Object.keys(m.children).length) {
          m.delete();
          m = m.parent;
        }
      }
    };
  },
  delete: function () {
    if (!this.deleted) {
      this.deleted = true;
      if (this.parent) delete this.parent.children[this.name];
      for (var key in this.children) {
        if (this.children.hasOwnProperty(key)) {
          this.children[key].delete();
        }
      }
      if (this.refs) {
        for (var i = 0; i < this.refs.length; i++) {
          this.refs[i].delete();
        }
      }
    }
  },
  intercept: function (obj) {
    if (obj) {
      if (!('__isOoProxy__' in obj)) {
        var handler = new $cheeta.Model.ProxyHandler();
        // if (Object.isArray(obj)) {
        // for (var j = 0; j < this.arrayMethodNames.length; j++) {
        //   var methodName = this.arrayMethodNames[j];
        //   val[methodName] = this.interceptArrayFn(m, val[methodName]);
        // }
        // }
        obj = new Proxy(obj, handler);
      }
      obj.__ooModel__ = this;
    }
    return obj;
  },
  interceptAllChildren: function (obj) {
    if (Object.isObject(obj)) {
      obj = this.intercept(obj);
      for (var key in this.children) {
        if (this.children.hasOwnProperty(key)) {
          obj[key] = this.children[key].interceptAllChildren(obj[key]);
        }
      }
    }
    return obj;
  },
  arrayMethodNames: ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse'],
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
  }
};
$cheeta.Model.ProxyHandler = function () {
  this.models = [];
};
$cheeta.Model.ProxyHandler.prototype = {
  set: function (base, prop, value) {
    if (prop === '__ooModel__') {
      if (this.models.indexOf(value) === -1) this.models.push(value);
    } else {
      console.log('set', prop, base[prop], value);
      base[prop] = value;
      for (var i = 0; i < this.models.length; i++) {
        var m = this.models[i];
        if (m.deleted) {
          this.models.splice(i--, 1);
          continue;
        }
        if (m.children[prop]) {
          base[prop] = m.children[prop].interceptAllChildren(base[prop]);
          m.children[prop].valueChange(base[prop]);
        }
      }
    }
    return true;
  },
  deleteProperty: function (obj, prop) {
    delete obj[prop];
    for (var i = 0; i < this.models.length; i++) {
      var m = this.models[i];
      if (m.children[prop]) {
        m.children[prop].delete();
      }
    }
    return true;
  },
  has: function (target, prop) {
    if (prop === '__isOoProxy__') {
      return true;
    }
    return prop in target;
  }
};

$cheeta.Model.ArrayHandlerProto = Array.prototype;
// $cheeta.Model.ArrayHandlerProto.push

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
//
// $cheeta.model = function (name, value) {
//   if (name === undefined) {
//     return window.M;
//   } else {
//     var model = $cheeta.parser.parse(name, {}).models[0];
//     if (value === undefined) {
//       var val = model.getValue();
//       if (val === undefined) {
//         val = {};
//         model.setValue(val);
//       }
//       return val;
//     } else {
//       model.setValue(value);
//       return value;
//     }
//   }
// };

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
          results.push(fn.apply(thisArg, arguments));
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