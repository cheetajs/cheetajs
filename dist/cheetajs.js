/*jshint -W020 */
window.$cheeta = window.$cheeta || {};
$cheeta.MapList = function () {
  this.list = [];
};

$cheeta.MapList.prototype = {
  sortedIndex: function (list, key) {
    var low = 0,
      high = list.length;

    while (low < high) {
      var mid = (low + high) >>> 1;
      if (list[mid].key < key) low = mid + 1;
      else high = mid;
    }
    return low;
  },
  put: function (key, val) {
    var index = this.sortedIndex(this.list, key);
    if (index < this.list.length && this.list[index].key === key) {
      this.list[index].value.push(val);
    } else {
      this.list.splice(index, 0, {key: key, value: [val]});
    }
    return this;
  },
  get: function (key) {
    var index = this.sortedIndex(this.list, key);
    return this.list[index] !== undefined && this.list[index].key === key ?
      this.list[index].value : undefined;
  },
  getPrefixes: function(key) {
    var entries = [];
    if (!this.list.length) return entries;
    var index = this.sortedIndex(this.list, key);
    for (var i = index; i < this.list.length; i++) {
      if (!this.list[index].key.startsWith(key)) break;
      entries.push(this.list[i]);
    }
    return entries;
  }
};


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

Array.prototype.remove = function(item) {
    var index = this.indexOf(item);
    if (index > -1) {
        return this.splice(index, 1);
    }
};

Object.extend = function(superClass, clazz) {
    clazz.prototype = Object.create(superClass.prototype);
    clazz.prototype.constructor = clazz;
};

// String.prototype.capitalize = function() {
//     if (this.length) {
//         return this.charAt(0).toUpperCase() + this.substring(1);
//     }
//     return this;
// };

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

	document.addCssStyle = function (style) {
		var elHead = document.getElementsByTagName('head')[0], elStyle = document.createElement('style');
		elStyle.type = 'text/css';
		elHead.appendChild(elStyle);
		elStyle.innerHTML = style;
	};
})();
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
$cheeta.parser = {
  jsonRegExp: /\{(.*)\}/g,
  modelVarRegExp: /(((((\. *)?[^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+)|\[ *([^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+|'(\\'|[^'])*') *\]) *)+\(?)|('(\\'|[^'])*')/g,
  reservedWords: (function () {
    var map = [];
    ('abstract|else|instanceof|super|boolean|enum|int|switch|break|export|interface|synchronized|byte|extends|let|this|case|false|long|' +
    'throw|catch|final|native|throws|char|finally|new|transient|class|float|null|true|const|for|package|try|continue|function|private|typeof|debugger|goto|' +
    'protected|var|default|if|public|void|delete|implements|return|volatile|do|import|short|while|double|in|static|with|window|document')
      .split('|').forEach(function (r) {
      map[r] = true;
    });
    return map;
  })(),
  reservedWordsRegExp: new RegExp('(^|\\W)(' + this.reservedWords + ')(\\W|$)', 'g'),
  parse: function (ref, fn) {
    function hasReserved(ref) {
      var c = ref.charAt(0);
      if (c === '.') {
        return false;
      }
      // if (c.toUpperCase() === c || c === '$' || c === '_' || name === 'window' || name === 'document') {
      //   return true;
      // }
      var i = ref.indexOf('.');
      i = i === -1 ? ref.length : i;
      return _this.reservedWords[ref.substring(0, i)] != null;
    }

    function functionPos(ref) {
      // TODO handle a[1.2]
      return ref.search(/\( *$/) > -1 ?
        Math.max(ref.lastIndexOf('.'), ref.lastIndexOf('[')) : ref.length;
    }

    var _this = this;
    var jsonObjs = [];
    ref = ref.replace(this.jsonRegExp, function (match) {
      jsonObjs.push(match);
      return '$J';
    });
    ref.replace(this.modelVarRegExp, function (match) {
      if (match.charAt(0) === '\'' || match.charAt(0) === '"' || match === 'true' || match === 'false' ||
        match === 'undefined' || match === 'null' || match === 'NaN' || !isNaN(match)) {
        return match;
      } else {
        var bracketIndex = match.length;

        match = match.replace(/\[ *([^0-9'"].*?)\]/g, function (m, $1, index) {
          _this.parse($1, fn);
          if (bracketIndex === match.length) {
            bracketIndex = index;
          }
        });
        if (hasReserved(match)) {
          return match;
        } else {
          var index = functionPos(match.substring(0, bracketIndex));
          var mRef = match.substring(0, index);
          fn(mRef);
        }
      }
    });
  }
};

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
$cheeta.directive = {
  directives: {},
  globals: [],
  defaults: [],
  removeEventName: 'cheeta-removed',
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
    var all = this.getAll(name);
    return all.length ? all[0] : undefined;
  },
  getAll: function (name) {
    var dirs = [], i;
    var split = name.toLowerCase().split('.');
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
          ds.push(directives[j]);
        }
      }
      if (!ds.length) {
        for (j = 0; j < this.globals.length; j++) {
          var g = this.globals[j].name;
          if (n.replace(/^data-/, '').indexOf(g.substring(0, g.length - 1)) === 0) {
            ds.push(this.globals[j]);
          }
        }
      }
      dirs = dirs.concat(ds);
    }
    if (!dirs.length) {
      for (i = 0; i < this.defaults.length; i++) {
        dirs.push(this.defaults[i]);
      }
    }
    return dirs;
  }
};
$cheeta.Attribute = function (elem, name, value) {
  this.name = name;
  this.value = value;
  this.elem = elem;
};
$cheeta.Attribute.prototype = {
  get key() {
    return this.name.replace(/^data-/, '').replace(/\.$/, '');
  },
  watch: function (fn, expr) {
    var attr = this;
    expr = expr || this.value;
    if (expr.startsWith('.') && this.elem.ooScope.__last__) {
      expr = this.elem.ooScope.__last__ + expr;
    }
    var updateFn = function () {
      fn.call(this, attr.evaluate(expr, updateFn.referredScopes));
    };
    updateFn.referredScopes = [];
    $cheeta.parser.parse(expr, function (expr) {
      var scope = attr.findReferredScope(attr.elem.ooScope, expr.substring(0, expr.search(/[\.\[]/)));
      updateFn.referredScopes.push(scope);
      scope.put(expr, updateFn);
      // $cheeta.objectModel.interceptAndListen(refEl.oo.values[prop], this);
    });
    // updateFn();
  },
  findReferredScope: function (scope, prop) {
    return scope ? ((scope.get(prop) && scope) || this.findReferredScope(scope.parent, prop))
      : window.ooScope;
  },
  // valueChanged: function (val, path) {
  //   var entries = this.elem.ooScope.getPrefixes(path);
  //   if (entries) {
  //     for (var i = 0; i < entries.length; i++) {
  //       var expr = entries[i].key, list = entries[i].value;
  //       $cheeta.objectModel.interceptAndListen(val, expr, this);
  //       for (var j = 0; j < list.length; j++) {
  //         list[j]();
  //       }
  //     }
  //   }
  // },
  getExprValue: function (obj, expr) {
    var split = (expr || this.value).split(/ *\. *| *\[ *| *\] */g);
    for (var i = 1; i < split.length - 1; i++) {
      if (obj === undefined) {
        return;
      }
      obj = obj[split[i]];
    }
    return {val: obj, prop: split[split.length - 1]};
  },
  attr: function (name) {
    return new $cheeta.Attribute(this.elem, name, this.getAttribute(name) || this.getAttribute(name + '.') || this.getAttribute('data-' + name + '.'));
  },
  evaluate: function (ref, scopes) {
    var params = {};
    for (var i = 0; i < scopes.length; i++) {
      var scope = scopes[i];
      Object.copy(scope.values, params);
    }
    var fn;
    //todo try to define only the vars that are used in this model ref
    //todo have more descriptive error in case script is failing
    var escapedVal = (ref || this.value).replace(/'/g, '\\\'');
    var keys = Object.keys(params);
    eval('var fn = function(' + keys.join(',') + '){return eval(\'' + escapedVal + '\');};');
    var paramValues = keys.map(function (k) {
      return params[k];
    });
    try {
      var val = fn.apply(this.elem, paramValues);
      // console.log(escapedVal + ': ' + val);
      return val;
    } catch (e) {
      // console[e.message && e.message.indexOf('Cannot read property ') > -1 ? 'warn' : 'error'](
      console.error(e.constructor.prototype.toString(), e.message || e, this.name, this.value, this.elem);
      // console.error(e.constructor.prototype.toString(), e.message || e,
      //   '"' + resolvedRef + '"', attr, elem, params);
      // throw e;
      return undefined;
    }
  }
};

$cheeta.future(function () {
  function fireRemove(el, removeSiblings) {
    if (el) {
      if (el.hasDirective) {
        el.dispatchEvent(new CustomEvent($cheeta.directive.removeEventName, {'detail': {target: el}}));
      }
      fireRemove(el.firstElementChild, true);
      if (removeSiblings) fireRemove(el.nextElementSibling, true);
    }
  }

  var whatToObserve = {childList: true, subtree: true};
  var mutationObserver = new MutationObserver(function (mutationRecords) {
    for (var i = 0; i < mutationRecords.length; i++) {
      var mutationRecord = mutationRecords[i];
      if (mutationRecord.type === 'childList') {
        if (mutationRecord.removedNodes.length > 0) {
          for (var j = 0; j < mutationRecord.removedNodes.length; j++) {
            fireRemove(mutationRecord.removedNodes[j]);
          }
        }
      }
    }
  });
  mutationObserver.observe(document.body, whatToObserve);
});

// attr.setValueForRef = function (val, ref) {
//   var split = (ref || attr.value).split(/ *\. *| *\[ *| *\] */g);
//   var obj = modelRefs[split[0]].value;
//   for (var i = 1; i < split.length - 1; i++) {
//     if (obj === undefined) {
//       return;
//     }
//     obj = obj[split[i]];
//   }
//   obj[split[split.length - 1]] = val;
// };
//
// attr.evaluate = function (ref, additionalModelRefs) {
//   function addModelParams() {
//     var params = {};
//     Object.copy(additionalModelRefs, params);
//     Object.copy(modelRefs, params);
//     for (var key in params) {
//       if (params.hasOwnProperty(key)) {
//         var m = params[key];
//         params[key] = m instanceof $cheeta.Model ? m.value : m;
//       }
//     }
//     return params;
//   }
//
//   var params = addModelParams();
//   params.$elem = elem;
//   var fn;
//   //todo try to define only the vars that are used in this model ref
//   //todo have more descriptive error in case script is failing
//   var escapedVal = attr.value.replace(/'/g, '\\\'');
//   var keys = Object.keys(params);
//   eval('var fn = function(' + keys.join(',') + '){return eval(\'' + escapedVal + '\');};');
//   var paramValues = keys.map(function (k) {
//     return params[k];
//   });
//   try {
//     var val = fn.apply(elem, paramValues);
//     // console.log(escapedVal + ': ' + val);
//     return val;
//   } catch (e) {
//     // console[e.message && e.message.indexOf('Cannot read property ') > -1 ? 'warn' : 'error'](
//     console.error(e.constructor.prototype.toString(), e.message || e, attr.name, attr.value, elem);
//     // console.error(e.constructor.prototype.toString(), e.message || e,
//     //   '"' + resolvedRef + '"', attr, elem, params);
//     throw e;
//     // return undefined;
//   }
// };


$cheeta.compiler = {
  recursiveCompile: function (node, scope, skipSiblings) {
    if (node) {
      var skip = false;
      if (node.nodeType === 1) {
        if (node.tagName.toLowerCase() === 'script') {
          if (node.getAttribute('id') && node.getAttribute('type').indexOf('template') > -1) {
            $cheeta.templates[node.getAttribute('id')] = node.innerHTML || '';
            skip = true;
          }
        }
        this.linkDirectives(node, scope);
      } else if (node.nodeType === 3) {
        var txt = node.textContent;
        while (txt.indexOf('{{') > -1) {
          var resultNode = [];
          txt = txt.replace(/(.*)\{\{(.*)\}\}(.*)/, this.replaceTextCurly(node, resultNode));
          node = resultNode[0];
        }
      }
      if (!skip) {
        this.recursiveCompile(node.firstChild, node.ooScope || scope);
      }
      if (!skipSiblings) {
        this.recursiveCompile(node.nextSibling, node.ooScope || scope);
      }
    }
  },
  replaceTextCurly: function (node, resultNode) {
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
  getDirectives: function (elem) {
    var directivs = [];
    for (var i = 0; i < elem.attributes.length; i++) {
      var attr = elem.attributes[i];
      if (attr.name.endsWith('.')) {
        var dirs = $cheeta.directive.getAll(attr.name);
        for (var j = 0; j < dirs.length; j++) {
          var dir = dirs[j];
          dir.currAttr = attr;
        }
        directivs = directivs.concat(dirs);
      }
    }
    directivs.sort(function (a, b) {
      return (a.directive.order || 1000) - (b.directive.order || 1000);
    });
    return directivs;
  },
  linkDirectives: function (elem, scope) {
    var directives = this.getDirectives(elem);
    if (!directives) return false;
    elem.ooScope = scope;
    directives.forEach(function (dir) {
      dir.link(elem, new $cheeta.Attribute(elem, dir.currAttr.name, dir.currAttr.value));
    });
  },
  linkDirective: function (elem, name, value) {
    var dir = $cheeta.directive.get(name);
    return dir.link(elem, new $cheeta.Attribute(elem, name, value));
  },
  doCompile: function (elem, skipSiblings) {
    elem.addClass('oo-invisible');
    this.recursiveCompile(elem, this.getScope(elem), skipSiblings);
    $cheeta.runFutures(function () {
      elem.removeClass('oo-invisible');
    });
  },
  compile: function (elem) {
    this.doCompile(elem);
  },
  compileChildren: function (elem) {
    this.doCompile(elem, true);
  },
  getScope: function (elem) {
    return (elem && (elem.ooScope || this.getScope(elem.parentElement))) || window.ooScope;
  }
};
window.addEventListener('load', function () {
  if (!$cheeta.isInitialized) {
    $cheeta.isInitialized = true;
    $cheeta.hash.init();
    window.M = {};
    $cheeta.directive.get('model').link(window, new $cheeta.Attribute(window, 'model', 'M'));
    $cheeta.compiler.compile(document.documentElement);
  }
}, false);
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
$cheeta.ServerObject = function (config) {
  if (Object.isString(config)) {
    config = {url: config};
  }
  var ServerObject = function (obj) {
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
      return ServerObject.$query(this, dataPath).after(fn).error(err);
    };
  };

  ServerObject.$query = function (params, dataPath) {
    var resp = [], after, err;
    resp.after = function (fn) {
      after = fn;
      return this;
    };

    resp.error = function (fn) {
      err = fn;
      return this;
    };

    var sample = params || params instanceof ServerObject ? params : new ServerObject();

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
          resp.push(new ServerObject(data[i]));
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

  return ServerObject;
};
//define interceptor framework to easily add interceptor to any object's method like xhr.send()
document.addCssStyle('.oo-invisible { visibility: hidden; } .hidden {display: none!important}');
$cheeta.directive.add({
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
$cheeta.directive.add({
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
$cheeta.directive.add({
  name: 'bind',
  order: 800,
  link: function (elem, attr) {
    var split = attr.value.split(':');
    $cheeta.compiler.linkDirective(elem, 'value.', split[0].split(',')[0], attr.scope);
    // $cheeta.directive.adds.get('value')[0].directive.link(elem, allAttr({name: attr.name, value: split[0].split(',')[0]}));
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

    //todo exclude keys that don't edit like arrow keys
    elem.on('change keydown keyup', function () {
      attr.setValueForRef(elemValue(), split[0]);
      if (split.length > 1) {
        attr.evaluate(split[1]);
      }
    });
  }
});
$cheeta.directive.add({
  name: 'text',
  link: function (elem, attr) {
    attr.watch(function (val) {
      elem.innerHTML = '';
      elem.appendChild(document.createTextNode(val == null ? '' : val));
    });
  }
});
$cheeta.directive.add({
  name: 'html',
  link: function (elem, attr) {
    attr.watch(function (val) {
      if (val !== elem.innerHTML) {
        elem.innerHTML = val == null ? '' : val;
      }
    });
  }
});

$cheeta.directive.add({
  name: 'show',
  link: function (elem, attr) {
    attr.watch(function (val) {
      if (val) {
        elem.removeClass('hidden');
      } else {
        elem.addClass('hidden');
      }
    });
  }
});

$cheeta.directive.add({
  name: 'hover', link: function (elem, attr) {
    var over = false;
    elem.addEventListener('mouseover', function () {
      if (!over) {
        over = true;
        attr.setValue(over);
      }
    });
    elem.addEventListener('mouseleave', function () {
      if (over) {
        over = false;
        attr.setValue(over);
      }
    });
  }
});

$cheeta.directive.add({
  name: 'onaction',
  link: function (elem, attr, scope) {
    attr.linkDirective(elem, 'onclick.onkeydown-space-enter.', attr.value, scope);
  }
});

$cheeta.directive.add({
  name: 'init',
  link: function (elem, attr) {
    $cheeta.future(attr.evaluate);
  }
});

$cheeta.directive.add({
  name: 'focus',
  link: function (elem, attr) {
    attr.watch(function (val) {
      elem.focus(val);
    });
  }
});

$cheeta.directive.add({
  name: '',
  link: function (elem, attr) {
    var baseAttrName = attr.key;
    attr.watch(function (val, prevVal) {
      if (baseAttrName === 'class' || baseAttrName === 'style') {
        var delimiter = baseAttrName === 'class' ? ' ' : ';';
        var attrVal = elem.getAttribute(baseAttrName);
        if (attrVal && prevVal) {
          elem.setAttribute(baseAttrName, attrVal.replace(prevVal, val));
        } else {
          elem.setAttribute(baseAttrName, attrVal + (attrVal ? delimiter : '') + val);
        }
      } else if ((baseAttrName === 'disabled' || baseAttrName === 'multiple' || baseAttrName === 'required') &&
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
// for maps you can do for.="key: Object.keys(obj)"
$cheeta.directive.add({
  name: 'for',
  isTemplate: true,
  order: 100,
  link: function (elem, attr, all, modelRefs) {
    var refElem = document.createComment(elem.outerHTML);
    elem.addAfter(refElem);
    var parsed = this.parse(attr.value);
    elem.removeAttr('for.');
    elem.attr('model.', parsed.variable + ':<M>;' + (elem.attr('model.') || ''));
    elem.cheetaNotCompiled = true;
    elem.addClass('hidden');

    function repeatElements(val, oldVal, isRange) {
      oldVal = oldVal || 0;
      var i;
      if (val > oldVal) {
        for (i = oldVal; i < val; i++) {
          var el = elem.cloneNode(true);
          el.removeClass('hidden');
          el.attr('model.', el.attr('model.').replace('<M>',
            isRange ? i + 1 : parsed.ref + '[' + i + ']'));
          refElem.addBefore(el);
          if (parsed.index) {
            modelRefs[parsed.index] = i;
          }
          $cheeta.compiler.compile(el, modelRefs);
        }
      } else if (val < oldVal) {
        for (i = val; i < oldVal; i++) {
          var toBeRemoved = refElem.prev();
          toBeRemoved.remove();
          // attr.fireElemRemoved(toBeRemoved);
        }
      }
    }

    var oldLen;
    attr.watch(function (val) {
      var isRange = val != null && !isNaN(parseFloat(val));
      var len = isRange ? val : (val ? val.length : 0);
      repeatElements(len, oldLen, isRange);
      oldLen = len;
    }, parsed.ref);
  },
  parse: function (val) {
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
$cheeta.directive.add({
	name: 'if',
	isTemplate: true,
	order: 50,
	link: function (elem, attr, all, modelRefs) {
		var refElem = document.createComment(elem.outerHTML);
		elem.addAfter(refElem);
		elem.removeAttr('if.');
		var addedElem;
		elem.cheetaNotCompiled = true;
		elem.addClass('hidden');

		attr.watch(function(val) {
			if (val) {
				if (!addedElem) {
					addedElem = elem.cloneNode(true);
					addedElem.removeClass('hidden');
					refElem.addBefore(addedElem);
					$cheeta.compiler.compile(addedElem, modelRefs);
				}
			} else {
				if (addedElem) {
					addedElem.remove();
					// attr.fireElemRemoved(addedElem);
					addedElem = null;
				}
			}
		});
	}
});
$cheeta.directive.add({
  name: 'model',
  order: 200,
  lastId: 0,
  root: {},
  link: function (elem, attr) {
    //TODO handle app1['myapp,yourapp']
    var modelDef = attr.value.split(/ *[;] */g);

    function watchFn(as) {
      return function (val) {
        elem.ooScope.values[as] = val;
        var list = elem.ooScope.getPrefixes(as + '.');
        for (var i = 0; i < list.length; i++) {
          var entry = list[i];
          $cheeta.objectModel.interceptAndListen(val, entry.key, entry.value);
        }
      };
    }

    var prevScope = elem.ooScope;
    elem.ooScope = new $cheeta.MapList();
    elem.ooScope.parent = prevScope;
    elem.ooScope.values = {};

    for (var i = 0; i < modelDef.length; i++) {
      if (modelDef[i] === '') continue;
      var index = modelDef[i].indexOf(':');
      var ref = (modelDef[i].substring(index + 1) || modelDef[i].substring(0, index)).trim();
      var as = index > -1 ? modelDef[i].substring(0, index).trim() : ref;

      elem.ooScope.__last__ = as;
      elem.ooScope.put(as, undefined);
      attr.watch(watchFn(as), ref);
    }
  }
});

$cheeta.directive.add({
	name: 'on*',
	keyconsts: {
		'backspace':8,'tab':9,'enter':13,'shift':16,'ctrl':17,'alt':18,'space':32,'pause':19,'break':19,'capslock':20,'escape':27,'esc':27,'pageup':33,'pagedown':34,'end':35,
		'home':36,'left':37,'up':38,'right':39,'down':40,'insert':45,	'delete':46,'colon':58, 'f1':112,'f2':113,'f3':114,'f4':115,'f5':116,'f6':117,'f7':118,
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

$cheeta.directive.add({
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
$cheeta.directive.add({
  name: 'view,template',
  order: 900,
  baseURL: window.location.protocol + '//' + window.location.hostname +
  (window.location.port && ':' + window.location.port) + window.location.pathname,
  loadView: function (elem, content) {
    if (!elem.cheetaNotCompiled) {
      elem.innerHTML = content;
      $cheeta.compiler.compileChildren(elem);
    }
  },
  loadingElements: {},
  link: function (elem, attr) {
    var dir = this;
    attr.watch(function (val) {
      elem.compiled = true;
      if (!dir.loadingElements[elem] && val != null) {
        // to avoid infinite loop
        dir.loadingElements[elem] = true;
        try {
          var content = $cheeta.templates[val];
          if (content != null) {
            dir.loadView(elem, content);
          } else {
            var url = val.indexOf('/') === 0 ? dir.baseURL + val : val;
            $cheeta.http.get(url).send().after(function (data) {
              $cheeta.templates[val] = data;
              dir.loadView(elem, data);
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
			list.remove(fn);
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
$cheeta.filter = function (array, q, options) {
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
