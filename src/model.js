/*jshint -W020 */
window.$cheeta = window.Oo = window.$cheeta || {};

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
    var model = this.children[name];
    if (model === undefined) {
      model = new $cheeta.Model(name, this);
      this.children[name] = model;
      // set value to it's own value to make sure it is intercepted
      // console.log('timeout value set', name, this.fullRef());
      if (model.getModelValue() != null) {
        $cheeta.future(function (model) {
          // console.log('timeout called', model.fullRef());
          var value = model.getModelValue();
          if (Object.isObject(value)) {
            model.setModelValue(value);
          }
        }, 0, model);
      }
    }
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
    this.iterateChildren(function (child, key) {
      child.valueChange(obj && obj.hasOwnProperty(key) && obj[key]);
    });
    if (this.refs) {
      for (var j = 0; j < this.refs.length; j++) {
        this.refs[j].valueChange(obj);
      }
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
      if (!('__isOoProxy__' in obj)) {
        // if (Object.isArray(obj)) {
        // for (var j = 0; j < this.arrayMethodNames.length; j++) {
        //   var methodName = this.arrayMethodNames[j];
        //   val[methodName] = this.interceptArrayFn(m, val[methodName]);
        // }
        // }
        var origObj = obj;
        obj = obj.__ooProxy__ || new Proxy(obj, new $cheeta.Model.ProxyHandler());
        Object.defineProperty(origObj, '__ooProxy__', {value: obj});
        origObj.__ooProxy__ = obj;
      }
      obj.__ooModel__ = this;
    }
    return obj;
  },
  interceptAllChildren: function (obj) {
    if (Object.isObject(obj)) {
      obj = this.intercept(obj);
      this.iterateChildren(function (child, key) {
        if (obj.hasOwnProperty(key)) {
          var val = child.interceptAllChildren(obj[key]);
          if (val !== obj[key]) {
            obj[key] = {value: val, __ooUpdateInterceptedVal__: true};
          }
        }
      });
      if (this.refs) {
        for (var i = 0; i < this.refs.length; i++) {
          var refModel = this.refs[i];
          refModel.interceptAllChildren(obj);
        }
      }
    }
    return obj;
  },
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
  allChildren: function () {
    var models = [];
    this.iterateChildren(function (child) {
      models = models.concat(child.allChildren());
      if (!Object.keys(child.children).length) {
        models.push(child);
      }
    });
    return models;
  }
};
$cheeta.Model.ProxyHandler = function () {
  this.models = [];
};
$cheeta.Model.surpressValueChange = false;
$cheeta.Model.ProxyHandler.prototype = {
  get: function (base, prop) {
    // needed for accessing not hasOwnProperty values like attribute.name
    return base[prop];
  },
  set: function (base, prop, value) {
    if (prop === '__ooModel__') {
      if (this.models.indexOf(value) === -1) this.models.push(value);
    } else {
      if (value && value.__ooUpdateInterceptedVal__) {
        base[prop] = value.value;
        return true;
      }
      base[prop] = value;
      if (prop.indexOf('cars') > -1)
        console.log('set', prop, base[prop], value);
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

// $cheeta.Model.ArrayHandlerProto = Array.prototype;
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