/*jshint -W020 */
$cheeta = Oo = {};

$cheeta.Model = function (name, parent, modelRef) {
  this.value = undefined;
  this.prevValue = undefined;
  this.parent = parent;
  this.names = [name];
  this.children = {};
  this.modelRef = modelRef;
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
    return this.parent ? this.parent.value[this.names[0]] : this.value;
  };
  this.setValue = function (value) {
    if (this.value !== value) {
      this.parent.value[this.names[0]] = value;
    }
  };
  this.child = function (name, skip, modelRef) {
    name = name.trim ? name.trim() : name;
    if (this.value == null) {
      this.value = {};
    }
    var model = this.children[name];
    if (model === undefined) {
      model = new $cheeta.Model(name, this, modelRef);
      if (!skip) {
        model.interceptProp(this.value, name);
      }
      this.children[name] = model;
      model.value = this.value == null ? undefined : this.value[name];
    }
    return model;
  };
  this.valueChange = function () {
    document.dispatchEvent(new CustomEvent('Oo-model-change-' + this.ref() + (this.refId || ''),
      {'detail': {value: this.value, prevValue: this.prevValue, target: this}}));
    return this;
  };
  this.watch = function (elem, callback) {
    var listener, modelRef = this.ref() + (this.refId || '');
    document.addEventListener('Oo-model-change-' + modelRef, (listener = function (e) {
      callback.call(elem, e.detail.value, e.detail.prevValue);
    }), false);
    elem.addEventListener('removed', function () {
      document.removeEventListener('Oo-model-change-' + modelRef, listener);
    }, false);
  };
  this.interceptArray = function () {
    if (this.value != null) {
      var interceptor = new this.ArrayInterceptor(this);
      for (var key in interceptor) {
        if (interceptor.hasOwnProperty(key)) {
          if (this.value[key] === interceptor[key]) {
            break;
          }
          this.value[key] = interceptor[key];
        }
      }
      this.child('length', false, true);
    }
  };
  this.interceptProp = function (value, name, skipDefine) {
    if (value != null) {
      var model = this;
      var beforeValue = value[name];
      var isCheetaIntercepted = model.parent.children && model.parent.children[name] != null;
      // avoid infinite loop to redefine prop
      var prevProp = isCheetaIntercepted ? null : Object.getOwnPropertyDescriptor(value, name);
      try {
        if (!skipDefine) {
          this.redefineProp(value, name, prevProp);
        }
      } catch (e) {
        if (!(e instanceof TypeError)) {
          throw e;
        }
        return;
      }
      value[name] = beforeValue;
    }
  };
  this.redefineProp = function (value, name, prevProp) {
    var model = this;
    Object.defineProperty(value, name, {
      set: function (val) {
        if (prevProp && prevProp.set) {
          prevProp.set.apply(value, arguments);
        }
        val = (prevProp && prevProp.get && prevProp.get.apply(value)) || val;
        var prevVal = model.prevValue = model.value;
        if (prevVal !== val) {
          model.value = val;
          if (Object.isArray(val)) {
            model.interceptArray();
          }
          model.valueChange();
          if (val instanceof Object) {
            for (var key in model.children) {
              if (model.children.hasOwnProperty(key)) {
                var origVal = val[key];
                // cleanup the previous value's child interceptors.
                if (prevVal != null) {
                  var pval = prevVal[key];
                  delete prevVal[key];
                  prevVal[key] = pval;
                }
                model.children[key].interceptProp(val, key);
                val[key] = origVal;
              }
            }
          }
        }
      },
      get: function () {
        return (prevProp && prevProp.get && prevProp.get.apply(value)) || model.value;
      },
      enumerable: true,
      configurable: true
    });
  };

  this.ArrayInterceptor = function (model) {
    function arrayChange(newLen, oldLen) {
      var i;
      for (i = 0; i < model.value.length; i++) {
        var m = model.child(i);
        if (m.value !== model.value[i]) {
          model.redefineProp(model.value, i);
        }
      }
      if (newLen !== oldLen) {
        if (newLen < oldLen) {
          for (i = newLen; i < oldLen; i++) {
            var child = model.child(i);
            child.prevValue = child.value;
            child.value = undefined;
            child.valueChange();
          }
        }
        var lengthModel = model.child('length');
        lengthModel.prevValue = oldLen;
        lengthModel.value = newLen;
        lengthModel.valueChange();
      }
      model.valueChange();
    }

    return {
      push: function () {
        var len = this.length;
        var result = Array.prototype.push.apply(this, arguments);
        var newLen = this.length;
        arrayChange(newLen, len);
        return result;
      },
      pop: function () {
        var len = this.length;
        var result = Array.prototype.pop.apply(this, arguments);
        var newLen = this.length;
        arrayChange(newLen, len);
        return result;
      },
      shift: function () {
        return this.splice(0, 1)[0];
      },
      unshift: function () {
        var args = [].slice.apply(arguments);
        args.unshift(0, 0);
        this.splice.apply(this, args);
        return this.length;
      },
      splice: function () {
        var len = this.length;
        var result = Array.prototype.splice.apply(this, arguments);
        var newLen = this.length;
        arrayChange(newLen, len);
        return result;
      }
    };
  };
};

//$cheeta.refresh = function(modelRef) {
//	var model = $cheeta.model.createOrGetModel(null, modelRef);
//	model.valueChange(model.getValue(), null);
//};
(function () {
  var windowModel = new $cheeta.Model('');
  windowModel.value = window;
  //$cheeta.Model.root = $cheeta.Model.root || new $cheeta.Model('M');
  $cheeta.Model.root = windowModel.child('M');
  $cheeta.Model.root.modelRef = 'M';
  window.M = window.M || {};
})();

$cheeta.watchFns = [];
$cheeta.watch = function (modelExpr, fn) {
  $cheeta.watchFns.push(fn);
  var elem = document.createElement('div');
  elem.setAttribute('style', 'display:none !important');
  elem.setAttribute('watch.', modelExpr + ':' + '$cheeta.watchFns[' + ($cheeta.watchFns.length - 1) + ']()');
  document.body.appendChild(elem);
  $cheeta.compiler.compile(elem, [$cheeta.Model.root]);
};

$cheeta.future = function (future, delay) {
  $cheeta.future.evals.push(delay ? function () {
    setTimeout(future, delay);
  } : future);
};
$cheeta.future.evals = $cheeta.future.evals || [];

window.addEventListener('load', function () {
  if (!$cheeta.isInitialized) {
    $cheeta.isInitialized = true;
    $cheeta.hash.init();
    $cheeta.compiler.compile(document.documentElement, {});
  }
}, false);