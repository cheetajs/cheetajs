Object.isString = function(str) {
    return typeof str === 'string' || str instanceof String;
};

Object.isFunction = function(v) {
    return typeof v === 'function';
};

Object.isBoolean = function(v) {
    return typeof v === 'boolean';
};

Object.isObject = function(v) {
    return v instanceof Object;
};

Object.isArray = function(v) {
    return Array.isArray(v);
};

Object.copy = function(from, to) {
    to = to || {};
    for (var key in from) {
        if (from.hasOwnProperty(key)) {
            to[key] = from[key];
        }
    }
    return to;
};

//window.Service = function(input, fn, output) {
//    this.input = input;
//    this.fn = fn;
//    this.outer = output;
//
//    this.validators = {
//        boolean: function(v) {
//            return Object.isBoolean(v);
//        },
//        number: function(v) {
//            return isNaN(v);
//        }
//    };
//
//    return function(val) {
//        function makeWith(key) {
//            return function(v) {
//                if (input[key].validate) {
//                    input[key].validate(v);
//                }
//                val[key] = v;
//            };
//        }
//        if (input != null) {
//            for (var key in input) {
//                if (input.hasOwnProperty(key)) {
//                    this['with' + key.charAt(0).toUpperCase() + key.substring(1)] = makeWith(key);
//                    if (val) {
//                        if (input[key].validate) {
//                            input[key].validate(val[key]);
//                        }
//                        var defaultV = input[key].defaultVal;
//                        if (!val[key] && defaultV) {
//                            val[key] = Object.isFunction(defaultV) ? defaultV.call(this) : defaultV;
//                        }
//                    }
//                }
//            }
//        }
//
//        var _this = this;
//        this.run = function() {
//            return fn.apply(_this, val);
//        };
//    };
//};
'use strict';
(function() {
	function extend(fnName, fn) {
		return function() {
			var args = Array.prototype.slice.call(arguments);
			for (var i = 0; i < args.length; i++) {
				var obj = args[i];
				var pro = obj.prototype ? obj.prototype : obj;
				if (!pro[fnName]) {
					pro[fnName] = fn;
				}
			}
		};
	}
	extend('attr', function (n, v) {
		if (v != null) {
			this.setAttribute(n, v);
			return this;
		} else {
			return this.getAttribute(n) || this.getAttribute('data-' + n) ||
				(n.indexOf('.', n.length - 1) === -1 && this.attr(n + '.'));
		}
	})(Element);
	extend('removeAttr', function (n) {
		this.removeAttribute(n);
		this.removeAttribute('data-' + n);
		return this;
	})(Element);
	extend('addClass', function (c) {
		if (c != null) {
			if (!this.hasClass(c)) {
				this.setAttribute('class', (this.getAttribute('class') ? this.getAttribute('class') + ' ' : '') + c);
			}
		}
		return this;
	})(Element);
	extend('removeClass', function (c) {
		if (c != null) {
			if (this.hasClass(c)) {
				this.setAttribute('class', this.getAttribute('class').replace(new RegExp('(' + c + '$)|( ' + c + ')', 'g'), ''));
			}
		}
		return this;
	})(Element);
	extend('hasClass', function (c) {
		return this.getAttribute('class') && this.getAttribute('class').split(' ').indexOf(c) > -1;
	})(Element);
	extend('add', function (e, index) {
		if (e && e.length != null && e[0] != null) {
			for (var i = 0; i < e.length; i++) {
				this.add(e[i], index);
			}
		} else {
			this.insertBefore(e, index && this.childNodes[index]);
		}
		return this;
	})(Element);
	extend('addBefore', function (e) {
		if (e && e.length != null && e[0] != null) {
			for (var i = 0; i < e.length; i++) {
				this.addBefore(e[i]);
			}
		} else {
			this.parentNode.insertBefore(e, this);
		}
		return this;
	})(Element, Node, Comment, Text);
	extend('addAfter', function (e) {
		if (e && e.length != null && e[0] != null) {
			for (var i = 0; i < e.length; i++) {
				this.addAfter(e[i]);
			}
		} else {
			this.parentNode.insertBefore(e, this.nextSibling);
		}
		return this;
	})(Element, Node, Comment, Text);
	extend('parent', function () {
		return this.parentNode;
	})(Element, Node, Comment, Text);
	extend('next', function () {
		return this.nextSibling;
	})(Element, Node, Comment, Text);
	extend('prev', function () {
		return this.previousSibling;
	})(Element, Node, Comment, Text);
	extend('nextE', function () {
		return this.nextElementSibling;
	})(Element, Node, Comment, Text);
	extend('prevE', function () {
		return this.previousElementSibling;
	})(Element, Node, Comment, Text);
	extend('remove', function () {
		if (this.parentNode) {this.parentNode.removeChild(this);}
		return this;
	})(Element);
	extend('html', function (h) {
		if (h === undefined) {
			return this.innerHTML;
		}
		this.innerHTML = h;
		return this;
	})(Element);
	extend('text', function (h) {
		if (h === undefined) {
			return this.innerText;
		}
		this.innerText = h;
		return this;
	})(Element);
	extend('wrap', function (e) {
		this.addAfter(e);
		this.remove();
		e.add(this);
		return this;
	})(Element, Node, Comment, Text);
	extend('create', function (s) {
		if (s.charAt(0) === '<') {
			var div = document.createElement('div');
			div.innerHTML = s;
			return div.removeChild(div.firstChild);
		} else {
			return document.createElement(s);
		}
	})(document);

	extend('on', function(events, fn) {
		var split = events.split(' ');
		for (var i = 0; i < split.length; i++) {
			if (split[i].length > 0) {
				this.addEventListener(split[i], fn, false);
			}
		}
		return fn;
	})(Element, window, document);

	extend('off', function(events, fn) {
		var split = events.split(' ');
		for (var i = 0; i < split.length; i++) {
			if (split[i].length > 0) {
				this.removeEventListener(split[i], fn, false);
			}
		}
	})(Element, window, document);

	window.E = function(o) {
		if (o instanceof Element || o.nodeType != null) {
			return o;
		} else if (Object.isString(o)) {
			return document.create(o);
		}
	};
})();
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
      },
      sort: function () {
        var result = Array.prototype.sort.apply(this, arguments);
        arrayChange(result.length, result.length);
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
$cheeta.directives = {
  directives: {},
  globals: [],
  defaults: [],
  add: function (directive) {
    var names = directive.name.split(',');
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      this.directives[name] = this.directives[name] || [];
      this.directives[name].push(directive);
      if (name.indexOf('*', name.length - 1) > -1) {
        this.globals.push(directive);
      }
      if (name === '') {
        this.defaults.push(directive);
      }
    }
  },
  get: function (name) {
    var dirs = [], i;
    name = name.toLowerCase();
    var split = name.split('.');
    if (split[split.length - 1] === '') {
      split.pop();
    }
    for (i = 0; i < split.length; i++) {
      var n = split[i], j = 0, ds = [];
      if (n.indexOf('data-') === 0) {
        n = n.substring('data-'.length);
      }
      var directives = this.directives[n];
      if (directives) {
        for (j = 0; j < directives.length; j++) {
          ds.push({directive: directives[j], name: n});
        }
      }
      if (!ds.length) {
        for (j = 0; j < this.globals.length; j++) {
          var g = this.globals[j].name;
          if (n.replace(/^data-/, '').indexOf(g.substring(0, g.length - 1)) === 0) {
            ds.push({directive: this.globals[j], name: n});
          }
        }
      }
      dirs = dirs.concat(ds);
    }
    if (!dirs.length) {
      for (i = 0; i < this.defaults.length; i++) {
        dirs.push({directive: this.defaults[i], name: name});
      }
    }

    return dirs;
  },
  jsonRegExp: /\{(.*)\}/g,
  modelVarRegExp: /(((((\. *)?[^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+)|\[ *([^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+|'(\\'|[^'])*') *\]) *)+\(?)|('(\\'|[^'])*')/g,
  reservedWords: (function () {
    var map = [];
    ('abstract|else|instanceof|super|boolean|enum|int|switch|break|export|interface|synchronized|byte|extends|let|this|case|false|long|' +
    'throw|catch|final|native|throws|char|finally|new|transient|class|float|null|true|const|for|package|try|continue|function|private|typeof|debugger|goto|' +
    'protected|var|default|if|public|void|delete|implements|return|volatile|do|import|short|while|double|in|static|with')
      .split('|').forEach(function (r) {
      map[r] = true;
    });
    return map;
  })(),
  reservedWordsRegExp: new RegExp('(^|\\W)(' + this.reservedWords + ')(\\W|$)', 'g'),
  parse: function (ref, modelRefs) {
    function hasReserved(ref) {
      var c = ref.charAt(0);
      if (c === '.') {
        return false;
      }
      if (c.toUpperCase() === c || c === '$' || c === '_' || name === 'window' || name === 'document') {
        return true;
      }
      var i = ref.indexOf('.');
      i = i === -1 ? ref.length : i;
      return _this.reservedWords[ref.substring(0, i)] != null;
    }

    function functionPos(ref) {
      // TODO handle a[1.2]
      return ref.search(/\( *$/) > -1 ?
        Math.max(ref.lastIndexOf('.'), ref.lastIndexOf('[')) : ref.length;
    }

    var _this = this, result = {models: []};
    var jsonObjs = [];
    result.ref = ref.replace(this.jsonRegExp, function (match) {
      jsonObjs.push(match);
      return '$J';
    });
    result.ref = result.ref.replace(this.modelVarRegExp, function (match) {
      if (match.charAt(0) === '\'' || match.charAt(0) === '"' || match === 'true' || match === 'false' ||
        match === 'undefined' || match === 'null' || match === 'NaN' || !isNaN(match)) {
        return match;
      } else {
        var bracketIndex = match.length;

        match = match.replace(/\[ *([^0-9'"].*?)\]/g, function (m, $1, index) {
          var r = _this.parse($1, modelRefs);
          result.models = result.models.concat(r.models);
          if (bracketIndex === match.length && r.models.length) {
            bracketIndex = index;
          }
          return '[' + r.ref + ']';
        });
        if (hasReserved(match)) {
          return match;
        } else {
          var index = functionPos(match.substring(0, bracketIndex));
          var append = match.substring(index).trim();
          var mRef = match.substring(0, index);
          var model = $cheeta.Model.root;
          var split = mRef.split(/ *\. *| *\[ *| *\] */g);
          if (match.indexOf('.') === 0) {
            if (modelRefs.$$last$$) {
              model = modelRefs.$$last$$;
            }
          } else {
            if (modelRefs[split[0]] != null) {
              model = modelRefs[split[0]];
              split = split.slice(1);
            }
          }
          if (model instanceof $cheeta.Model) {
            for (var i = 0; i < split.length; i++) {
              var name = split[i];
              if (name.length) {
                model = model.child(name);
              }
            }
            result.models.push(model);
            return model.ref() + (!append.length || append.charAt(0) === '.' ? append : '.' + append.trim());
          } else {
            return model;
          }
        }
      }
    });

    var i = 0;
    result.ref = result.ref.replace(/\$J/, function () {
      return jsonObjs[i++];
    });

    if (result.models.length) {
      var dependents = [];
      result.models.map(function(m) {
        m = m.parent;
        while (m && m !== $cheeta.Model.root) {
          if (m.dependents) dependents = dependents.concat(m.dependents);
          m = m.parent;
        }
      });
      result.models = result.models.concat(dependents);
    }

    if (result.models.length === 1) {
      result.model = result.models[0];
    } else if (result.models.length > 1) {
      result.model = $cheeta.Model.multiModels.child(ref, false, result.ref);
      result.model.dependents = result.models;
    }

    return result;
  },
  modelAttr: function (elem, modelRefs) {
    return function (attr) {
      if (Object.isString(attr)) {
        attr = {name: attr, value: elem.attr(attr)};
      }
      if (attr == null) {
        return {
          modelValue: function () {
            return undefined;
          }
        };
      }
      attr.key = attr.name.replace(/^data-/, '').replace(/\.$/, '');
      attr.remove = function () {
        elem.removeAttribute(attr.name);
      };
      attr.parseResult = {};
      attr.resolve = function (ref, mRefs) {
        var parseRef = ref || attr.value;
        if (!attr.parseResult[parseRef]) {
          attr.parseResult[parseRef] = $cheeta.directives.parse(parseRef, mRefs || modelRefs);
        }
        return attr.parseResult[parseRef];
      };
      attr.models = function (ref, mRefs) {
        return attr.resolve(ref, mRefs).models;
      };
      attr.model = function (ref, mRefs) {
        return attr.resolve(ref, mRefs).model;
      };
      attr.values = {};
      attr.watch = function (fn, ref) {
        function makeCallback(model, values) {
          return function () {
            values.oldVal = values.val;
            values.val = attr.evaluate(ref, {});
            fn.call(model, values.val, values.oldVal);
          };
        }

        var models = attr.models(ref), callback;
        for (var i = 0; i < models.length; i++) {
          var m = models[i];
          if (m instanceof $cheeta.Model && m !== $cheeta.Model.root) {
            callback = makeCallback(m, attr.values);
            m.watch(elem, callback);
          }
        }
        if (!callback) {
          callback = makeCallback(null, attr.values);
        }
        setTimeout(function () {
          callback();
        }, 1);
      };

      attr.evaluate = function (ref, additionalModelRefs) {
        function addModelParams(params) {
          params = params || {};
          var key;
          for (key in params) {
            if (params.hasOwnProperty(key)) {
              params[key] = params[key];
            }
          }
          for (key in modelRefs) {
            if (modelRefs.hasOwnProperty(key)) {
              var m = modelRefs[key];
              params[key] = m instanceof $cheeta.Model ? m.getValue() : m;
            }
          }
          //var rootVal = $cheeta.Model.root.value;
          //for (key in rootVal) {
          //	if (params[key] === undefined && rootVal.hasOwnProperty(key)) {
          //		params[key] = rootVal[key];
          //	}
          //}
          params[$cheeta.Model.root.names[0]] = $cheeta.Model.root.value;
          return params;
        }

        var resolvedRef = attr.resolve(ref, modelRefs).ref;
        var params = addModelParams(additionalModelRefs);
        var fn;
        //todo try to define only the vars that are used in this model ref
        //todo have more descriptive error in case script is failing
        var escapedVal = resolvedRef.replace(/'/g, '\\\'');
        var keys = Object.keys(params);
        eval('var fn = function(' + keys.join(',') + '){return eval(\'' + escapedVal + '\');};');
        var paramValues = keys.map(function (k) {
          return params[k];
        });
        try {
          var val = fn.apply(elem, paramValues);
          return val;
        } catch (e) {
          if (console.error) {
            console.error(e.constructor.prototype.toString(), e.message || e,
              '"' + resolvedRef + '"', attr, elem, params);
          }
          throw e;
        }
      };

      return attr;
    };
  }

};

$cheeta.directive = function (def) {
  if (Object.isString(def)) {
    return $cheeta.directives.get(def);
  }
  def.linkFn = function (elem, attr, modelRefs) {
    var allAttr = $cheeta.directives.modelAttr(elem, modelRefs);
    elem.M = modelRefs;
    return def.link.call(this, elem, allAttr(attr), allAttr, modelRefs);
  };

  $cheeta.directives.add(def);

  return def;
};

new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    var nodes = mutation.removedNodes;
    for (var i = 0; i < nodes.length; i++) {
      mutation.target.dispatchEvent(new CustomEvent('removed',
        {'detail': {target: nodes.item(i)}}));
    }
  });
});
//	this.tokenizeAttrVal = function(val, onToken) {
//		var quote = null, regexpMod = false, index = -1, optionsSplitIndex = val.indexOf(';');
//		if (optionsSplitIndex > -1 && optionsSplitIndex) 
//		val += '\x1a';
//		for (var i = 0; i < val.length; i++) {
//			var ch = val.charAt(i);
//			if (quote != null) {
//				if (ch == quote && val.charAt(i - 1) != '\\') {
//					if (quote == '/') {
//						regexpMod = true;
//					}
//					quote = null;
//				}
//				onToken.onLiteral(ch);
//			} else {
//				if (regexpMod) {
//					if (ch < 'a' && ch > 'z') {
//						regexpMod = false;
//					}
//					onToken.onLiteral(ch);
//				} else if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === '!' || ch === '"' || ch === '[' || ch === ']' || 
//						(ch >= '%' && ch <= '/' && ch != '.') || (ch >= ':' && ch <= '?') || (ch >= '{' && ch <= '~') || ch === '^' || ch == '\x1a') {
//					if (ch === '\'' || ch === '"' || ch === '/') {
//						quote = ch;
//					}
//					if (index > -1) {
//						var name = val.substring(index, i);
//						if (name === 'true' || name === 'false' || name === 'undefined' || name === 'null' || 
//							name === 'NaN' || !isNaN(name)) {
//							onToken.onLiteral(name);
//						} else {
//							var ii = i;
//							while (val.charAt(ii) == ' ') {
//								ii++;
//							}
//							if (val.charAt(ii) == '(') {
//								var fnIndex = name.lastIndexOf('.');
//								if (fnIndex > -1) {
//									onToken.onFnVar(name.substring(0, fnIndex));
//									onToken.onLiteral(name.substring(fnIndex));
//								} else {
//									onToken.onLiteral(name);
//								}
//							} else {
//								onToken.onVar(name);
//							}
//						}
//						index = -1;
//					}
//					if (ch !== '\x1a') {
//						onToken.onLiteral(ch);
//					}
//				} else {
//					if (index == -1) {
//						index = i;
//					}
//				}
//			}
//		}
//	};
$cheeta.compiler = {
  recursiveCompile: function (node, modelsRefs, runInlineScripts, skipSiblings, skipNode) {
    if (node) {
      var skip = false;
      if (!skipNode) {
        if (node.nodeType === 1) {
          if (node.tagName.toLowerCase() === 'script') {
            if (runInlineScripts && (node.parentNode == null ||
              node.parentNode.tagName.toLowerCase() !== 'head') &&
              (node.type == null || node.type === '' || node.type === 'text/javascript')) {
              var content = node.innerHTML || '';
              var head = document.getElementsByTagName('head')[0] || document.documentElement;
              var script = document.createElement('script');
              script.type = 'text/javascript';
              script.appendChild(document.createTextNode(content));
              head.insertBefore(script, head.firstChild);
              head.removeChild(script);
            } else if (node.getAttribute('id')) {
              $cheeta.templates[node.getAttribute('id')] = node.innerHTML || '';
            }
          }
          var result = this.compileAllDirectives(node, modelsRefs);
          skip = result.skip;
          modelsRefs = result.refs;
        } else if (node.nodeType === 3) {
          var txt = node.textContent;
          while (txt.indexOf('{{') > -1) {
            var resultNode = [];
            txt = txt.replace(/(.*)\{\{(.*)\}\}(.*)/, this.replaceTextCurly(node, modelsRefs, resultNode));
            node = resultNode[0];
          }
        }
      }
      if (!skip) {
        this.recursiveCompile(node.firstChild, modelsRefs, runInlineScripts);
      }
      if (!skipSiblings) {
        this.recursiveCompile(node.nextSibling, modelsRefs, runInlineScripts);
      }
    }
  },
  replaceTextCurly: function (node, modelsRefs, resultNode) {
    return function (h, b, c, a) {
      var before = document.createTextNode(b);
      var after = document.createTextNode(a);
      var span = document.createElement('span');
      span.setAttribute('text.', c);
      node.parentNode.replaceChild(after, node);
      after.parentNode.insertBefore(span, after);
      span.parentNode.insertBefore(before, span);
      resultNode.push(before);
      return before.textContent;
    };
  },
  compileAllDirectives: function (elem, modelRefs) {
    var directives = this.getAllDirectivesWithAttr(elem);
    return this.compileDirectives(elem, directives, modelRefs);
  },
  compileDirectives: function (elem, directives, modelRefs) {
    var isTemplate = false;
    for (var k = 0; k < directives.length; k++) {
      var dir = directives[k];
      var refs = dir.directive.linkFn(elem, {name: dir.name, value: dir.value}, modelRefs);
      if (refs) {
        modelRefs = Object.copy(modelRefs);
        Object.copy(refs, modelRefs);
      }
      isTemplate = isTemplate || dir.directive.isTemplate;
    }
    return {'refs': modelRefs, skip: isTemplate};
  },
  compileAttr: function (elem, attr, modelRefs) {
    return this.compileDirectives(elem, this.getDirectives(elem, attr), modelRefs);
  },
  getDirectives: function (elem, attr) {
    var directives = [];
    if (attr.name.indexOf('.', attr.name.length - 1) > -1) {
      var dirs = $cheeta.directives.get(attr.name);
      for (var i = 0; i < dirs.length; i++) {
        dirs[i].value = attr.value;
        directives.push(dirs[i]);
      }
    }
    return directives;
  },
  getAllDirectivesWithAttr: function (elem) {
    var attr, k, directives = [];
    var attributes = elem.attributes;
    attributes[-1] = {name: elem.tagName};
    for (k = -1; k < attributes.length; k++) {
      attr = attributes[k];
      directives = directives.concat(this.getDirectives(elem, attr));
    }
    directives.sort(function (a, b) {
      return (a.directive.order || 1000) - (b.directive.order || 1000);
    });
    return directives;
  },
  doCompile: function () {
    this.recursiveCompile.apply(this, arguments);
    this.runFutures();
  },
  compile: function (elem, modelRefs, runInlineScripts) {
    this.doCompile(elem, modelRefs, runInlineScripts, true);
  },
  compileChildren: function (elem, modelRefs, runInlineScripts) {
    this.doCompile(elem, modelRefs, runInlineScripts, true, true);
  },
  runFutures: function () {
    var runs = $cheeta.future.evals;
    $cheeta.future.evals = [];
    for (var i = 0; i < runs.length; i++) {
      var expr = runs[i];
      if (Object.isFunction(expr)) {
        expr();
      } else {
        eval(expr);
      }
    }
  }
};
$cheeta.url = function(url) {
	var parser = document.createElement('a');
	parser.href = url;
	parser.param = function (k, v) {
		parser.search += (parser.search.indexOf('?') > -1 ? '&' : '?') + k + '=' + v;
		return parser;
	};
	parser.params = function (params) {
		if (params) {
			for (var key in params) {
				if (!$cheeta.isFunction(params[key])) {
					parser.param(key, params[key]);
				}
			}
		}
		return parser;
	};
	return parser;
};

$cheeta.http = function(target) {
	target = target || this;
	var xhr = new XMLHttpRequest();
	var origSend = xhr.send;
	var origOpen = xhr.open;
	var i = 0;
	xhr.open = function() {
		origOpen.apply(xhr, arguments);
		return xhr;
	};
	xhr.send = function() {
		origSend.apply(xhr, arguments);
		return xhr;
	};
	xhr.json = function(obj) {
		xhr.header('Content-Type', 'application/json');
		origSend.call(xhr, JSON.stringify(obj));
		return xhr;
	};
	xhr.header = function(h, v) {
		xhr.setRequestHeader(h, v);
	};
	var successCallbacks = [], completeCallbacks = [], errorCallbacks = [],
		stateChangeCallbacks = [], progressCallbacks = [];
	xhr.onError = function(callback) {
		if (callback) errorCallbacks.push(callback);
		return xhr;
	};
	xhr.onSuccess = function(callback) {
		if (callback) successCallbacks.push(callback);
		return xhr;
	};
	xhr.after = function(success, error, progress) {
		xhr.onSuccess(success);
		xhr.onError(error);
		xhr.onProgress(progress);
		return xhr;
	};
	xhr.onComplete = function(callback) {
		if (callback) completeCallbacks.push(callback);
		return xhr;
	};
	xhr.onStateChange = function(callback) {
		if (callback) stateChangeCallbacks.push(callback);
		return xhr;
	};
	xhr.onProgress = function(callback) {
		if (callback) progressCallbacks.push(callback);
		return xhr;
	};

	xhr.onreadystatechange = function(e) {
		if (xhr.readyState === 4) {
			var response = xhr.data;
			if (200 <= xhr.status && xhr.status < 300) {
				for (i = 0; i < successCallbacks.length; i++) {
					successCallbacks[i].call(target, response);
				}
				for (i = 0; i < $cheeta.http.successCallbacks.length; i++) {
					$cheeta.http.successCallbacks[i].call(target, response);
				}
			} else {
				response = [xhr.status, xhr.data];
				for (i = 0; i < errorCallbacks.length; i++) {
					errorCallbacks[i].apply(target, response);
				}
				for (i = 0; i < $cheeta.http.errorCallbacks.length; i++) {
					$cheeta.http.errorCallbacks[i].apply(target, response);
				}
			}
			for (i = 0; i < completeCallbacks.length; i++) {
				completeCallbacks[i].call(target, response);
			}
			for (i = 0; i < $cheeta.http.completeCallbacks.length; i++) {
				$cheeta.http.completeCallbacks[i].call(target, response);
			}

		}
		for (i = 0; i < stateChangeCallbacks.length; i++) {
			stateChangeCallbacks[i].apply(target, e);
		}
		for (i = 0; i < $cheeta.http.stateChangeCallbacks.length; i++) {
			$cheeta.http.stateChangeCallbacks[i].apply(target, e);
		}
	};

	xhr.upload.addEventListener('progress', function(e) {
		for (i = 0; i < progressCallbacks.length; i++) {
			progressCallbacks[i].apply(target, e);
		}
		for (i = 0; i < $cheeta.http.progressCallbacks.length; i++) {
			$cheeta.http.progressCallbacks[i].apply(target, e);
		}
	}, false);

	Object.defineProperty(xhr, 'data', {
		get: function() {
			var type = xhr.getResponseHeader('Content-Type');
			try {
				return type != null && type.indexOf('application/json') > -1 &&
				xhr.responseText != null && xhr.responseText.length ?
					JSON.parse(xhr.responseText) : xhr.responseText;
			} catch(e) {
				return xhr.responseText;
			}
		},
		enumerable: true,
		configurable: true
	});

	return xhr;
};
$cheeta.http.get = function() {
	return $cheeta.http().open.apply($cheeta.http(), ['GET'].concat(Array.prototype.slice.call(arguments)));
};
$cheeta.http.post = function() {
	return $cheeta.http().open.apply($cheeta.http(), ['POST'].concat(Array.prototype.slice.call(arguments)));
};
$cheeta.http.put = function() {
	return $cheeta.http().open.apply($cheeta.http(), ['PUT'].concat(Array.prototype.slice.call(arguments)));
};
$cheeta.http.delete = function() {
	return $cheeta.http().open.apply($cheeta.http(), ['DELETE'].concat(Array.prototype.slice.call(arguments)));
};
$cheeta.http.options = function() {
	return $cheeta.http().open.apply($cheeta.http(), ['OPTIONS'].concat(Array.prototype.slice.call(arguments)));
};

$cheeta.http.successCallbacks = []; $cheeta.http.completeCallbacks = []; $cheeta.http.errorCallbacks = [];
$cheeta.http.stateChangeCallbacks = []; $cheeta.http.progressCallbacks = [];
$cheeta.http.onError = function(callback) {
	if (callback) $cheeta.http.errorCallbacks.push(callback);
	return $cheeta.http;
};
$cheeta.http.onSuccess = function(callback) {
	if (callback) $cheeta.http.successCallbacks.push(callback);
	return $cheeta.http;
};
$cheeta.http.onComplete = function(callback) {
	if (callback) $cheeta.http.completeCallbacks.push(callback);
	return $cheeta.http;
};
$cheeta.http.onStateChange = function(callback) {
	if (callback) $cheeta.http.stateChangeCallbacks.push(callback);
	return $cheeta.http;
};
$cheeta.http.onProgress = function(callback) {
	if (callback) $cheeta.http.progressCallbacks.push(callback);
	return $cheeta.http;
};

$cheeta.http.prototype = new XMLHttpRequest();
//$cheeta.api = new Service({
//    url: 'api url like http://mysite.com/api/user/{id}/fans',
//    method: 'GET|POST|PUT|DELETE',
$cheeta.resource = function (config) {
  if (Object.isString(config)) {
    config = {url: config};
  }
  var ResourceClass = function (obj) {
    Object.copy(obj, this);

    var _this = this;

    function callXHR(method, obj, fn, err) {
      _this.$xhr().open(method, _this.$resolveUrl(), config.async || true).json(obj)
        .after(function (data) {
          if (data && Object.isString(data)) {
            data = JSON.parse(data);
          }
          if (fn) {
            if (data != null) {
              Object.copy(data, _this);
            }
            fn.call(_this, data);
          }
        }).onError(function (status, data) {
        if (err) {
          err.call(_this, status, data);
        }
      });
    }

    this.$resolveUrl = function () {
      var _this = this;
      return config.url.replace(/{:(\w+)}/, function (p, m) {
        var val = _this[m];
        return val ? val : '';
      });
    };
    this.$xhr = function (newXHR) {
      return newXHR ? newXHR() : new $cheeta.http();
    };
    this.$create = function (fn, err) {
      callXHR('POST', this, fn, err);
      return this;
    };
    this.$post = function (fn, err) {
      callXHR('POST', null, fn, err);
      return this;
    };
    this.$put = this.$update = function (fn, err) {
      callXHR('PUT', this, fn, err);
      return this;
    };
    this.$remove = function (fn, err) {
      callXHR('DELETE', null, fn, err);
      return this;
    };
    this.$get = function (fn, err) {
      callXHR('GET', null, fn, err);
      return this;
    };
    this.$query = function (params, dataPath, fn, err) {
      return ResourceClass.$query(this, dataPath).after(fn).error(err);
    };
  };

  ResourceClass.$query = function (params, dataPath) {
    var resp = [], after, err;
    resp.after = function (fn) {
      after = fn;
      return this;
    };

    resp.error = function (fn) {
      err = fn;
      return this;
    };

    var sample = params || params instanceof ResourceClass ? params : new ResourceClass();

    var isStringDataPath = dataPath && Object.isString(dataPath);

    sample.$xhr().open('GET', $cheeta.url(sample.$resolveUrl(config.url)).params(params).toString(),
      config.async || true).send().after(function (data) {
      if (after) {
        if (dataPath == null) {
        } else if (isStringDataPath) {
          var split = dataPath.split('.');
          for (var j = 0; j < split.length; j++) {
            data = data[split[j]];
          }
        }
        for (var i = 0; i < data.length; i++) {
          resp.push(new ResourceClass(data[i]));
        }
        after.call(this, data, resp);
      }
    }).onError(function (status, data) {
      if (err) {
        err.call(this, status, data);
      }
    });
    return resp;
  };

  return ResourceClass;
};
//define interceptor framework to easily add interceptor to any object's method like xhr.send()
$cheeta.directive({
  name: 'watch*',
  link: function (elem, attr) {
    function makeEval(fn) {
      return function () {
        attr.evaluate(fn);
      };
    }

    var split = attr.value.split(';'), len = split.length;
    while (len--) {
      var modelFn = split[len].split(':');
      attr.watch(makeEval(modelFn[1]), modelFn[0]);
    }
  }
});
$cheeta.directive({
  name: 'value',
  link: function (elem, attr) {
    attr.watch(function (val) {
      if (elem.type && elem.type.toLowerCase() === 'checkbox') {
        elem.checked = val;
      } else if (elem.value !== val) {
        elem.value = val || null;
      }
    });
  }
});
$cheeta.directive({
  name: 'bind',
  order: 800,
  link: function (elem, attr, allAttr) {
    var split = attr.value.split(':');
    $cheeta.directives.get('value')[0].directive.link(elem, allAttr({name: attr.name, value: split[0].split(',')[0]}));
    function elemValue() {
      if (elem.type && elem.type.toLowerCase() === 'checkbox') {
        return elem.checked;
      }
      if (elem.tagName.toLowerCase() === 'input' || elem.tagName.toLowerCase() === 'textarea') {
        return elem.value;
      } else {
        return elem.innerHTML;
      }
    }

    function listen(models) {
      //todo exclude keys that don't edit like arrow keys
      elem.on('change keydown keyup', function () {
        for (var i = 0; i < models.length; i++) {
          models[i].setValue(elemValue());
        }
        if (split.length > 1) {
          attr.evaluate(split[1]);
        }
      });
    }

    listen(attr.models(split[0]));
  }
});
$cheeta.directive({
  name: 'text',
  link: function (elem, attr) {
    attr.watch(function (val) {
      elem.innerHTML = '';
      elem.appendChild(document.createTextNode(val == null ? '' : val));
    });
  }
});
$cheeta.directive({
  name: 'html',
  link: function (elem, attr) {
    attr.watch(function (val) {
      if (val !== elem.innerHTML) {
        elem.innerHTML = val == null ? '' : val;
      }
    });
  }
});

$cheeta.directive({
  name: 'show',
  isTemplate: true,
  link: function (elem, attr, allAttr, modelRefs) {
    attr.watch(function (val) {
      if (val) {
        elem.style.display = '';
        if (!elem.getAttribute('OoCompiled')) {
          elem.setAttribute('OoCompiled', true);
          $cheeta.compiler.compileChildren(elem, modelRefs);
        }
      } else {
        elem.style.display = 'none';
      }
    });
  }
});

$cheeta.directive({
  name: 'onaction',
  link: function (elem, attr, allAttr, modelRefs) {
    $cheeta.compiler.compileAttr(elem,
      {name: 'onclick.onkeydown-space-enter.', value: attr.value}, modelRefs);
  }
});

$cheeta.directive({
  name: 'init',
  link: function (elem, attr) {
    $cheeta.future(attr.evaluate);
  }
});

$cheeta.directive({
  name: 'focus',
  link: function (elem, attr) {
    attr.watch(function (val) {
      elem.focus(val);
    });
  }
});

$cheeta.directive({
  name: '',
  link: function (elem, attr) {
    attr.watch(function (val) {
      var baseAttrName = attr.key;
      if ((baseAttrName === 'disabled' || baseAttrName === 'multiple' || baseAttrName === 'required') &&
        val === false) {
        elem.removeAttribute(baseAttrName);
      } else if (val == null) {
        elem.removeAttribute(baseAttrName);
      } else {
        elem.setAttribute(baseAttrName, val);
      }
    });
  }
});

$cheeta.directive({
  name: 'model',
  order: 200,
  lastId: 0,
  link: function (elem, attr, allAttr, modelRefs) {
    //TODO handle app1['myapp,yourapp']
    var modelDef = attr.value.split(/ *[;] */g);
    var models = {};

    //function makeWatch(m, ref) {
    //	return function() {
    //		m.value = attr.evaluate(ref);
    //		m.valueChange();
    //	};
    //}

    for (var i = 0; i < modelDef.length; i++) {
      if (modelDef[i] === '') continue;
      //TODO handle app1['123 as 123']
      var index = modelDef[i].indexOf(':');
      var ref = (modelDef[i].substring(index + 1) || modelDef[i].substring(0, index)).trim();
      var as = index > -1 ? modelDef[i].substring(0, index).trim() : null;
      //if (as) {
      //var m = new $cheeta.Model(as, null);
      //m.refId = this.lastId++;
      //m.value = attr.evaluate(ref);
      //attr.watch(makeWatch(m, ref), ref);
      //models[as] = m;
      //models.$$last$$ = m;
      //} else {
      var model = attr.model(ref, modelRefs);
      models[as || model.names[0]] = model;
      models.$$last$$ = model;
      //}
//			eval(model.ref() + '=' + model.ref() + '|{}');
    }
    return models;
  }
});

// for maps you can do for.="key: Object.keys(obj)"
$cheeta.directive({
	name: 'for',
	isTemplate: true,
	order: 100,
	link: function (elem, attr, all, modelRefs) {
		var refElem = document.createComment(elem.outerHTML);
		elem.addAfter(refElem);
		var parsed = this.parse(attr.value);
		elem.removeAttr('for.');
		elem.attr('model.', parsed.variable + ':<M>;' + (elem.attr('model.') || ''));

		function repeatElements(val, oldVal, isRange) {
			oldVal = oldVal || 0;
			var i;
			if (val > oldVal) {
				for (i = oldVal; i < val; i++) {
					var el = elem.cloneNode(true);
					el.attr('model.', el.attr('model.').replace('<M>',
						isRange ? i + 1 : parsed.ref + '[' + i + ']' ));
					refElem.addBefore(el);
					if (parsed.index) {modelRefs[parsed.index] = i;}
					$cheeta.compiler.compile(el, modelRefs);
				}
			} else if (val < oldVal) {
				for (i = val; i < oldVal; i++) {
					refElem.prev().remove();
				}
			}
		}

		var oldLen;
		attr.watch(function (val) {
			if (elem.parent() != null) {
				elem.remove();
			}
			var isRange = val != null && !isNaN(parseFloat(val));
			console.log('mmm', val, isRange);
			var len = isRange ? val : (val ? val.length : 0);
			repeatElements(len, oldLen, isRange);
			oldLen = len;
		}, parsed.ref);
	},
	parse : function(val) {
		var i = val.indexOf(':');
		var ref = val.substring(i + 1).trim();
		var keys = val.substring(0, i).trim().split(/ *, */g);
		return {
			ref: ref,
			index: keys.length > 1 ? keys[0] : null,
			variable: keys[keys.length - 1]
		};
	}
});
$cheeta.directive({
	name: 'on*',
	keyconsts: {
		'backspace':8,'tab':9,'enter':13,'shift':16,'ctrl':17,'alt':18,'space':32,'pause':19,'break':19,'capslock':20,'escape':27,'esc':27,'pageup':33,'pagedown':34,'end':35,
		'home':36,'left':37,'up':38,'right':39,'down arrow':40,'insert':45,	'delete':46,'colon':58, 'f1':112,'f2':113,'f3':114,'f4':115,'f5':116,'f6':117,'f7':118,
		'f8':119,'f9':120,'f10':121,'f11':122,'f12':123,'numlock':144,'scrolllock':145,'semicolon':186,'comma':188,'dash':189,'dot':190
	},
	link: function (elem, attr) {
		var split = attr.key.split('-');
		this.bindEvent(elem, attr, split[0].substring(2), split.slice(1));
	},
	bindEvent: function(elem, attr, event, keys) {
		var listenerFn = function(e) {
			var result = attr.evaluate(null, {$event: e});
			if (result != null) {
				if (result.preventDefault !== false) {
					e.preventDefault();
				}
				if (result.stopPropagation !== false) {
					e.stopPropagation();
				}
				return Object.isObject(result) ? result.value : result;
			}
		};
		var keyListenerFn;
		if (event.indexOf('key') === 0) {
			var codes = this.extractKeyCodes(keys);
			if (codes.length) {
				keyListenerFn = function (e) {
					if (codes.indexOf(e.which) > -1) {
						listenerFn.call(this, e);
					}
				};
			}
		}
		elem.addEventListener(event, keyListenerFn || listenerFn, false);
	},
	extractKeyCodes: function(keys) {
		var codes = [];
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (key.length === 1) {
				codes[i] = key.charCodeAt(0);
			} else {
				codes[i] = this.keyconsts[key.toLowerCase()];
				if (codes[i] == null) {
					codes[i] = parseInt(key);
					if (isNaN(codes[i])) {
						throw 'unknown key: ' + key;
					}
				}
			}
		}
		return codes;
	}
});

$cheeta.directive({
    name: 'test',
    order: 10000,
    link: function(elem, attr, allAttr) {
        elem.addClass('test');
        var _this = this;
        $cheeta.future(function() {
            var el = elem.previousElementSibling;
            while (el && el.hasClass('test')) {el = el.previousElementSibling;}
            var els = [];
            while (el && !el.hasClass('test')) {els.push(el); el = el.previousElementSibling;}
            els = els.reverse();
            var $elem = els[0];
            els.forEach(function(el, i) {$elem[i] = el;});
            if ($elem) {
                try {
                    var val = attr.evaluate(null, {$elem: $elem, Is: _this.Is});
                    if (val === false || (val != null && val.length)) {
                        _this.showError(elem, attr, val);
                    }
                } catch (e) {
                    _this.showError(elem, attr, e.message || e);
                    if (!(e.message || e).search(/fail/gi)) {
                        throw e;
                    }
                }
            }
        }, allAttr('delay').modelValue() || 0);
    },
    showError: function(elem, attr, val) {
        //todo parse the test expr and eval the Is.eq params;
        var info = attr.value + ' [' + attr.models()
                .map(function(m) {
                    return m.ref();
                }).filter(function(r) {
                    return r.indexOf('Is') !== 0;
                }).map(function(r) {
                    return eval(r);
                }).join(', ') + ']';
        elem.addClass('error').attr('style', 'color: #C52121;padding-left:20px')
            .text(val).attr('title', info);
        var flip = true;
        elem.on('click', function() {
            if (flip) {
                elem.addAfter(new E('span').attr('style', 'color: #C52121;padding-left: 10px')
                    .addClass('error').text(elem.attr('title')));
            } else {
                elem.next().remove();
            }
            flip = !flip;
        });
    },
    Is: {
        eq: function() {
            this.verify('eq', Array.prototype.slice.call(arguments), function(o1, o2) {
                return o1 === o2;
            });
        },
        eql: function() {
            this.verify('eq', Array.prototype.slice.call(arguments), function(o1, o2) {
                return (o1 == null ? '' : o1) === (o2 == null ? '' : o2);
            });
        },
        verify: function(name, args, fn) {
            var obj = args[0];
            var _this = this;
            function toStr(a) {
                return _this.toStr(a);
            }
            for (var i = 1; i < args.length; i++) {
                if (!fn(obj, args[i])) {
                    throw '*Fail ' + name + ' ' + args.map(toStr).join(', ');
                }
                obj = args[i];
            }
        },
        toStr: function (obj) {
            if (obj === null) {
                return '<null>';
            } else if (obj === undefined){
                return '<undefined>';
            } else if (Object.isString(obj)) {
                return '"' + obj + '"';
            }
            return obj;
        }
    }
});
$cheeta.directive({
  name: 'view,template',
  order: 900,
  baseURL: window.location.protocol + '//' + window.location.hostname +
  (window.location.port && ':' + window.location.port) + window.location.pathname,
  loadView: function (elem, content, modelRefs) {
    if (elem.parentElement) {
      elem.innerHTML = content;
      $cheeta.compiler.compileChildren(elem, modelRefs, true);
    }
  },
  loadingElements: {},
  link: function (elem, attr, all, modelRefs) {
    var dir = this;
    attr.watch(function (val) {
      console.log('view', elem, elem.compiled);
      elem.compiled = true;
      if (!dir.loadingElements[elem] && val != null) {
        // to avoid infinite loop
        dir.loadingElements[elem] = true;
        try {
          var content = $cheeta.templates[val];
          if (content != null) {
            dir.loadView(elem, content, modelRefs);
          } else {
            var url = val.indexOf('/') === 0 ? dir.baseURL + val : val;
            $cheeta.http.get(url).send().after(function (data) {
              dir.loadView(elem, data, modelRefs);
              $cheeta.templates[val] = data;
            });
          }
        } finally {
          delete dir.loadingElements[elem];
        }
      }
    });
  }
});
$cheeta.hash = {
	keyval: {},
	watchers: {},
	watch: function(key, fn) {
		if (key instanceof Function) {
			fn = key;
			key = '';
		}
		if (this.watchers[key] == null) {
			this.watchers[key] = [];
		}
		if (this.watchers[key].indexOf(fn) === -1) {
			this.watchers[key].push(fn);
		}
	},
	unwatch: function(fn, key) {
		if (key instanceof Function) {
			fn = key;
			key = '';
		}
		var list = this.watchers[key];
		if (list != null) {
			var index = list.indexOf(fn);
			if (index > -1) {
				list.splice(index, 1);
			}
		}
	},
	notify: function(key, newVal, oldVal) {
		var list = this.watchers[key];
		if (list != null) {
			for (var i = 0; i < list.length; i++) {
				list[i](newVal, oldVal);
			}
		}
	},
	set: function(key, val) {
		if (val === undefined) {
			val = key;
			key = '';
		}
		var oldVal = this.keyval[key]; 
		this.keyval[key] = val;
		var _this = this;
		var toHash = function() {
			var hash = _this.keyval[''] || '';
			for (var key in _this.keyval) {
				if (key.length) {
					hash += (hash.length > 0 ? '&' : '') + key + '=' + _this.keyval[key];
				}
			}
			return hash;
		};
		window.location.hash = toHash();
		this.notify(key, val, oldVal);
	},
	init: function() {
		var _this = this;
		var updateHash = function() {
			var hash = window.location.hash, index = 0, key = '', val, allKeys = {}, prev;
			try {
				hash = hash.substring(hash.length > 1 && hash.charAt(2) === '&' ? 2 : 1);
				for (var i = 0; i <= hash.length; i++) {
					if (hash.charAt(i) === '&' || i === hash.length) {
						val = hash.substring(index, i);
						if (_this.keyval[key] == null || _this.keyval[key] !== val) {
							prev = _this.keyval[key];
							_this.keyval[key] = val;
							_this.notify(key, val, prev);
						}
						index = i + 1;
						allKeys[key] = true;
						key = '';
					} else if (hash.charAt(i) === '=') {
						key = hash.substring(index, i);
						index = i + 1;
					}
				}
				
				for (key in _this.keyval) {
					if (allKeys[key] == null) {
						prev = _this.keyval[key];
						delete _this.keyval[key];
						_this.notify(key, null, prev);
					} 
				}
			} finally {
				_this.value = hash;
			}
		};
		updateHash();
		window.addEventListener('hashchange', function () {
			updateHash();
		}, false);
	},
	get: function(key) {
		return this.keyval[key || ''];
	}
};

$cheeta.route = $cheeta.route || function(map, hashVal) {
	if (map == null) {
		return null;
	}
	var len = 0;
	var url = null;
	for (var key in map) {
		if (hashVal.indexOf(key) === 0 && len < key.length) {
			len = key.length;
			url = map[key];
		}
	}
	return url;
};
$cheeta.Model.root.value.filter = function (array, q, options) {
  function contains(obj, q) {
    if (Object.isString(obj)) {
      var i = obj.search(q instanceof RegExp ? q : new RegExp(q, options && options.matchCase ? '' : 'i'));
      if (i > -1) {
        return (obj.length - i + 1) * 100 / obj.length;
      }
      if (!options || !options.sort) {
        return -1;
      }
      var k = 0;
      i = 0;
      while (k > -1) {
        k = obj.substring(k).indexOf(q[i++]);
      }
      return i / obj.length;
    }
    if (Object.isObject(obj)) {
      var sum = 0;
      if (options.field || options.fields) {
        options.fields = options.fields || [options.field];
        options.fields.map(function (f, i) {
          sum += contains(obj[f], q, f) * (options.fields.length - i * 100);
        });
      } else for (var key in obj) {
        if (obj.hasOwnProperty(key) && !Object.isFunction(obj[key])) {
          sum += contains(obj[key], q, key);
        }
      }
      return sum;
    } else {
      return obj === q ? 100 : 0;
    }
  }

  function filter() {
    if (array == null || q == null) {
      return array;
    }
    var result = [];
    array.forEach(function (item) {
      var score = options && options.scoreFn ? options.scoreFn(item, q) : contains(item, q);
      if (score > 0) {
        result.push({item: item, score: score});
      }
    });
    result.sort(function (a, b) {
      return b.score - a.score;
    });
    return result.map(function (obj) {
      return obj.item;
    });
  }
  if (q != null && (!Object.isString(q) || q.length)) {
    return filter();
  } else {
    return array;
  }

};