$cheeta.Model = function (name, parent) {
  this.parent = parent;
  this.name = name;
  this.children = {};
  this.listeners = [];
  if ($cheeta.debug) {
    this.id = $cheeta.Model.id = ++$cheeta.Model.id || 1;
  }
};

$cheeta.Model.prototype = {
  iterateChildren: function (fn) {
    for (var key in this.children) {
      if (this.children.hasOwnProperty(key)) {
        fn.call(this, this.children[key], key);
      }
    }
  },
  child: function (name) {
    name = name.trim();
    var model = this.children[name], isNewModelCreated;
    if (model === undefined) {
      model = new $cheeta.Model(name, this);
      this.children[name] = model;
      // this.interceptChild(this.getModelValue(), name);
      isNewModelCreated = true;
      // set value to it's own value to make sure it is intercepted
      // console.log('timeout value set', name, this.fullRef());
      // if ((model.prevVal = model.getModelValue()) != null) {
      //   $cheeta.future(function (model) {
      //     // console.log('timeout called', model.fullRef());
      //     var value = model.getModelValue();
      //     if (Object.isObject(value)) {
      //       model.setModelValue(value);
      //     }
      //   }, 0, model);
      // }
    }
    if (isNewModelCreated) this.interceptAllChildren(this.getModelValue(), name);
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
      var val = parentVal && parentVal[this.name];
      if (val === undefined && parentVal === window) {
        //to accomodate class A{} when window.A is undefined but eval(A) is function in chrome
        val = this.evalIgnore(this.name);
      }
      return val;
    } else if (this.refModel) {
      return this.refModel.getModelValue();
    } else {
      return this.value;
    }
  },
  evalIgnore: function (expr) {
    try {
      return eval(expr);
    } catch (e) {
      return undefined;
    }
  },
  setModelValue: function (val) {
    if (this.hasOwnProperty('value')) {
      this.valueChange(this.value = this.interceptAllChildren(val));
    } else if (this.parent) {
      var parentVal = this.parent.getModelValue();
      if (parentVal) parentVal[this.name] = val;
    } else if (this.refModel) {
      this.refModel.setModelValue(val);
    }
  },
  prevVal: undefined,
  valueChange: function (obj) {
    if (this.prevVal !== obj) {
      for (var i = 0; i < this.listeners.length; i++) {
        var listener = this.listeners[i];
        listener.call(this, obj);
      }
      this.iterateChildren(function (child, key) {
        child.valueChange(obj && obj.hasOwnProperty(key) && obj[key]);
      });
      if (this.refs) {
        for (var j = 0; j < this.refs.length; j++) {
          this.refs[j].valueChange(obj);
        }
      }
      this.prevVal = obj;
    }
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
      this.iterateChildren(function (child) {
        child.delete();
      });
      if (this.refs) {
        for (var i = 0; i < this.refs.length; i++) {
          this.refs[i].delete();
        }
      }
    }
  },
  intercept: function (obj) {
    if (obj) {
      if (obj === window) {
      } else if (obj.__ooProxy__) {
        obj = obj.__ooProxy__();
      } else {
        // if (Object.isArray(obj)) {
        // for (var j = 0; j < this.arrayMethodNames.length; j++) {
        //   var methodName = this.arrayMethodNames[j];
        //   val[methodName] = this.interceptArrayFn(m, val[methodName]);
        // }
        // }
        var origObj = obj;
        obj = new Proxy(obj, new $cheeta.Model.ProxyHandler());
        origObj.__ooProxy__ = function () {
          return obj;
        };
        obj.__ooOrigObj__ = function () {
          return origObj;
        };
      }
      obj.__ooModel__ = this;
    }
    return obj;
  },
  interceptChild: function (obj, key) {
    if (!Object.isObject(obj)) return;
    var value = obj[key], child = this.children[key];
    if (obj.hasOwnProperty(key)) {
      value = child.interceptAllChildren(obj[key]);
      if (value !== obj[key]) {
        obj[key] = {value: value, __ooUpdateInterceptedVal__: true};
      }
    }
    var origObj = (obj.__ooOrigObj__ && obj.__ooOrigObj__()) || obj;
    var desc = Object.getOwnPropertyDescriptor(origObj, key);
    if (!desc || desc.configurable) {
      Object.defineProperty(origObj, key, {
        get: function () {
          return value;
        },
        set: function (val) {
          if (origObj === window) {
            child.valueChange(value = child.value = child.interceptAllChildren(val));
          } else {
            if ($cheeta.proxyValueSet) {
              value = val;
            } else {
              obj[key] = val;
            }
          }
        },
        enumerable: (desc && desc.enumerable || true),
        configurable: (desc && desc.configurable || true)
      });
      if (origObj === window) {
        child.value = value;
      }
    }
  },
  interceptAllChildren: function (obj, newChildKey) {
    if (Object.isObject(obj)) {
      obj = this.intercept(obj);
      if (newChildKey) {
        this.interceptChild(obj, newChildKey);
      } else {
        for (var key in this.children) {
          if (this.children.hasOwnProperty(key)) {
            this.interceptChild(obj, key);
          }
        }
      }
      if (this.refs) {
        for (var i = 0; i < this.refs.length; i++) {
          var refModel = this.refs[i];
          refModel.interceptAllChildren(obj);
        }
      }
    }
    return obj;
  },
  allChildren: function () {
    var models = [];
    this.iterateChildren(function (child) {
      models = models.concat(child.allChildren());
      if (!Object.keys(child.children).length) {
        models.push(child);
      }
    });
    return models;
  },
  printHierarchy: function (prefix) {
    prefix = prefix || '';
    console.log(prefix + (this.parent ? '' : '*') + this.name + ': ' + this.fullRef());
    this.iterateChildren(function (child) {
      child.printHierarchy(prefix + '   ');
    });
    if (this.refs) {
      for (var j = 0; j < this.refs.length; j++) {
        this.refs[j].printHierarchy(prefix);
      }
    }
  }
};
$cheeta.Model.root = new $cheeta.Model('window');
$cheeta.Model.root.value = window;

$cheeta.Model.ProxyHandler = function () {
  this.models = [];
};
$cheeta.Model.surpressValueChange = false;
$cheeta.Model.ProxyHandler.prototype = {
  get: function (base, prop) {
    // needed for accessing not hasOwnProperty values like attribute.name
    return base[prop];
  },
  setBaseValue: function (base, prop, val) {
    $cheeta.proxyValueSet = true;
    base[prop] = val;
    $cheeta.proxyValueSet = false;
  },
  set: function (base, prop, value) {
    if (prop === '__ooModel__') {
      if (this.models.indexOf(value) === -1) this.models.push(value);
    } else if (prop !== '__ooOrigObj__') {
      if (value && value.__ooUpdateInterceptedVal__) {
        this.setBaseValue(base, prop, value.value);
        return true;
      }
      for (var i = 0; i < this.models.length; i++) {
        var m = this.models[i];
        if (m.deleted) {
          this.models.splice(i--, 1);
          continue;
        }
        var child = m.children[prop];
        if (child) {
          value = child.interceptAllChildren(value);
          this.setBaseValue(base, prop, value);
          child.valueChange(value);
        }
      }
      this.setBaseValue(base, prop, value);
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
};

$cheeta.watchFns = [];
$cheeta.watch = function (modelExpr, fn) {
  $cheeta.watchFns.push(fn);
  var elem = document.createElement('div');
  elem.setAttribute('style', 'display:none !important');
  elem.setAttribute('watch.', modelExpr + ':' + '$cheeta.watchFns[' + ($cheeta.watchFns.length - 1) + ']()');
  document.body.appendChild(elem);
  $cheeta.compiler.compile(elem, [$cheeta.Model.root]);
};

// todo swap the childs in case for. array is sorted or spliced or shift/unshift
// arrayMethodNames: ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse'],
// interceptArrayFn: function (model, fn) {
//   return function () {
//     var oldLen = model.getValue().length;
//     try {
//       return fn.apply(this, arguments);
//     } finally {
//       model.valueChange();
//       var newLen = model.getValue().length;
//       if (newLen !== oldLen) {
//         if (newLen < oldLen) {
//           for (var i = newLen; i < oldLen; i++) {
//             model.children[i].delete();
//           }
//         }
//         var lengthModel = model.child('length', null, true);
//         lengthModel.prevValue = oldLen;
//         lengthModel.value = newLen;
//         lengthModel.valueChange();
//       }
//     }
//   };
// },
