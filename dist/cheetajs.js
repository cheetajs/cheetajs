/*jshint -W020 */
window.$cheeta = window.Oo = {};
// $cheeta.MapList = function () {
//   this.list = [];
// };
//
// $cheeta.MapList.prototype = {
//   sortedIndex: function (list, key) {
//     var low = 0,
//       high = list.length;
//
//     while (low < high) {
//       var mid = (low + high) >>> 1;
//       if (list[mid].key < key) low = mid + 1;
//       else high = mid;
//     }
//     return low;
//   },
//   put: function (key, val) {
//     var index = this.sortedIndex(this.list, key);
//     if (index < this.list.length && this.list[index].key === key) {
//       this.list[index].value.push(val);
//     } else {
//       this.list.splice(index, 0, {key: key, value: [val]});
//     }
//     return this;
//   },
//   get: function (key) {
//     var index = this.sortedIndex(this.list, key);
//     return this.list[index] !== undefined && this.list[index].key === key ?
//       this.list[index].value : undefined;
//   },
//   getPrefixes: function(key) {
//     var entries = [];
//     if (!this.list.length) return entries;
//     var index = this.sortedIndex(this.list, key);
//     for (var i = index; i < this.list.length; i++) {
//       if (!this.list[index].key.startsWith(key)) break;
//       entries.push(this.list[i]);
//     }
//     return entries;
//   }
// };

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
'use strict';

if (window.attachEvent) {
	window.prototype.addEventListener = window.document.prototype.addEventListener = HTMLElement.prototype.addEventListener = function(type, listener) {
		this.attachEvent('on' + type, listener);
	};
}

if (!window.console) {
  window.console = {log: function() {}, error: function() {}};
}

Array.isArray = Array.isArray || function (vArg) {
    return Object.prototype.toString.call(vArg) === '[object Array]';
};

if (!Array.prototype.forEach){
  Array.prototype.forEach = function(fun /*, thisArg */) {
    if (this === void 0 || this === null) {
      throw new TypeError();
    }

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== 'function') {
      throw new TypeError();
    }

    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++) {
      if (i in t) {
        fun.call(thisArg, t[i], i, t);
      }
    }
  };
}

$cheeta.templates = [];
$cheeta.compiler = {
  recursiveCompile: function (node, scope, skipNode) {
    if (node && (!node._ooCompiled_|| skipNode)) {
      node._ooCompiled_ = true;
      if (!skipNode) {
        if (node.nodeType === 1) {
          if (node.tagName.toLowerCase() === 'script') {
            if (node.getAttribute('id') && node.getAttribute('type').indexOf('template') > -1) {
              $cheeta.templates[node.getAttribute('id')] = node.innerHTML || '';
              node._ooIsTemplatePlaceHolder_ = true;
            }
          }
          this.linkDirectivesWithScope(node, scope);
        } else if (node.nodeType === 3) {
          this.replaceCurly(node, scope);
        }
      }
      if (!node._ooIsTemplatePlaceHolder_) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var childNode = node.childNodes[i];
          this.recursiveCompile(childNode, node._ooScope_ || scope);
        }
      }
    }
  },
  replaceCurly: function (node, scope) {
    var txt = node.textContent;
    if (txt.indexOf('{{') === -1) return node;
    txt = txt.replace(/\{\{(.*?)\}\}\}?/g, function (m, p) {
      var isConst = p.charAt(0) === '{';
      return '<span ' + (isConst ? 'const.' : 'text.') + '="' +
        (isConst ? p.substring(1) : p) + '"></span>';
    });
    var div = document.createElement('div');
    div.innerHTML = txt;
    while (div.childNodes.length > 0) {
      var childNode = div.childNodes[0];
      node.parentNode.insertBefore(childNode, node);
      this.recursiveCompile(childNode, scope);
    }
    node.parentNode.removeChild(node);
  },
  getDirectives: function (elem, attrs) {
    var directives = [];
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (attr.name.endsWith('.')) {
        var dirs = $cheeta.directive.getAll(attr);
        directives = directives.concat(dirs);
      }
    }
    directives.sort(function (a, b) {
      return (a.directive.order || 1000) - (b.directive.order || 1000);
    });
    return directives;
  },
  linkDirectivesWithScope: function (elem, scope) {
    return this.linkDirectives(elem, undefined, undefined, scope);
  },
  linkDirectives: function (elem, name, value, scope) {
    var directives = this.getDirectives(elem, name ? [{name: name + '.', value: value}] : elem.attributes),
      result = {};
    if (!directives || !directives.length) return false;
    elem._ooScope_ = elem._ooScope_ || scope;
    for (var i = 0; i < directives.length; i++) {
      if (elem._ooIsTemplatePlaceHolder_) break;
      var dir = directives[i];
      Object.copy(dir.directive.link(elem, new $cheeta.Attribute(elem, dir.name, dir.value, dir.key)), result);
    }
    return result;
  },
  doCompile: function (elem, skipNode) {
    elem.addClass('oo-invisible');
    this.recursiveCompile(elem, this.getScope(elem), skipNode);
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
    return (elem && (elem._ooScope_ || this.getScope(elem.parentElement))) || window._ooScope_;
  },
  listenToElementRemoval: function () {
    function fireRemove(el, removeSiblings) {
      if (el) {
        if (el.hasDirective) {
          el.dispatchEvent(new CustomEvent($cheeta.directive.removeEventName, {'detail': {target: el}}));
        }
        fireRemove(el.firstElementChild, true);
        if (removeSiblings) fireRemove(el.nextElementSibling, true);
      }
    }
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
    mutationObserver.observe(document.body, {childList: true, subtree: true});
  }
};

window.addEventListener('load', function () {
  if (!$cheeta.isInitialized) {
    $cheeta.isInitialized = true;
    document.addCssStyle('.oo-invisible { visibility: hidden; } .hidden {display: none!important}');
    $cheeta.hash.init();
    // window.M = function(v){console.log(v);};
    // $cheeta.compiler.linkDirectives(window, 'model', 'M: window.M');
      // .M.intercept(window.M);
    $cheeta.debugger.init($cheeta.debug);
    $cheeta.compiler.compile(document.documentElement);
    $cheeta.compiler.listenToElementRemoval();
  }
}, false);

$cheeta.debugger = {
  prevEl: null,
  capturing: false,
  init: function () {
    if ($cheeta.debug) {
      window.M = function(expr) {
        console.log(expr);
        return Array.prototype.slice.call($0.attributes, 0).filter(function (attr) {
          return attr._ooAttr_;
        })[0]._ooAttr_.evaluate(expr);
      };
      window.M.values = function() {
        return $0._ooScope_ && Object.keys($0._ooScope_.models).reduce(function(p, c) {
            p[c] = $0._ooScope_.models[c] .getModelValue();
            return p;
          }, {});
      };
      window.M.models = function() {
        return $0._ooScope_ && $0._ooScope_.models;
      };
    }
    $cheeta.templates['oo-debugger-panel'] =
      '<div model.="debug: M.ooDebugger; el: debug.elem">' +
      '<div>Click anywhere and hold down ctrl or alt to capture</div>' +
      '{{el.outerHTML.slice(0, el.outerHTML.indexOf(el.innerHTML))}}' +
      '<ul><li for.="attr: debug.attrs">{{{attr.name}}}={{{attr.value}}}' +
      '<a onclick.=".evalVal = attr._ooAttr_.evaluate()" href="javascript:">eval</a> {{JSON.stringify(.evalVal)}}</li></ul>' +
      '</div>';
    document.addCssStyle('.oo-debugger {resize: horizontal; overflow: auto; width: 300px; ' +
      'background: #F9F9F9; position: fixed; ' +
      'top: 0; right: 0; bottom: 0;transform: rotate(-180deg);}' +
      '.oo-debugger .oo-panel{transform: rotate(-180deg);position: absolute;bottom: 15px;right: 5px;' +
      'font-family: Arial,"Helvetica Neue",Helvetica,sans-serif;font-size:12px;}' +
      '.oo-hover-elem {outline: 1px solid red;}');
    // $cheeta.compiler.linkDirectives(window, 'watch', 'M.ooDebug: $cheeta.debugger.addPanel(M.ooDebug)');
  },
  keyListener: function (e) {
    if ((e.which === 17 || e.which === 18) && e.type === 'keydown') {
      this.capturing = true;
    } else {
      this.capturing = false;
    }
  },
  mouseListener: function (e) {
    if (!this.capturing) {
      return;
    }
    var elem = document.elementFromPoint(e.pageX - window.pageXOffset, e.pageY - window.pageYOffset);
    // var elem = document.elementFromPoint(e.pageX, e.pageY);
    if (!elem || elem === this.prevEl || window.ooDebugPanel === elem || window.ooDebugPanel.contains(elem)) return;
    if (this.prevEl) this.prevEl.removeClass('oo-hover-elem');
    this.prevEl = elem;
    elem.addClass('oo-hover-elem');
    window.M.ooDebugger.elem = elem;
    window.M.ooDebugger.attrs = Array.prototype.slice.call(elem.attributes, 0).filter(function (attr) {
      return !!attr._ooAttr_;
    });

    // var panel = document.getElementById('oo-debugger');
    // panel.innerText = 'Directives:\n';
    // if (!panel.contains(elem)) {
    //   for (var k = 0; k < elem.attributes.length; k++) {
    //     var attr = elem.attributes[k];
    //     if (attr.ooAttr) {
    //       panel.innerText = attr.ooAttr.key + ': ' + attr.ooAttr.value + '\n';
    //     }
    //   }
    //   if (elem.ooScope) {
    //     panel.innerText += 'Scope: ' + elem.ooScope.id + '\n';
    //     Object.keys(elem.ooScope.models).forEach(function (key) {
    //       panel.innerText += '\n' + key;
    //       var models = elem.ooScope.models[key].allChildren();
    //       for (var j = 0; j < models.length; j++) {
    //         var m = models[j];
    //         panel.innerText += '\n\t' + m.fullRef() + '(' + m.id + '): ' + JSON.stringify(m.getModelValue());
    //       }
    //     });
    //   }
    // }
  },
  addPanel: function (debug) {
    $cheeta.debug = debug;
    if (debug) {
      window.M.ooDebugger = window.M.ooDebugger || {};
      var debugEl = window.ooDebugPanel = document.createElement('div');
      debugEl.addClass('oo-debugger');
      var panel = document.createElement('div');
      panel.addClass('oo-panel');
      panel.setAttribute('id', 'oo-debugger');
      document.body.appendChild(debugEl);
      debugEl.appendChild(panel);
      panel.setAttribute('view.', '\'oo-debugger-panel\'');
      $cheeta.compiler.compile(panel);
      document.addEventListener('mousemove', this.mouseListener, false);
      document.addEventListener('keydown', this.keyListener, false);
      document.addEventListener('keyup', this.keyListener, false);
    } else {
      if (document.querySelector('oo-debugger')) document.querySelector('oo-debugger').remove();
      document.removeEventListener('mousemove', this.mouseListener);
      document.removeEventListener('keydown', this.keyListener, false);
      document.removeEventListener('keyup', this.keyListener, false);
      delete window.M.ooDebugger;
    }
  },
};

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
  getAll: function (attr) {
    var allDirs = [];
    var split = attr.name.substring(0, attr.name.length - 1).toLowerCase().split('.');
    for (var i = 0; i < split.length; i++) {
      var n = split[i], dirs = [];
      n = n.replace(/^data-/, '');
      var directives = this.directives[n];
      if (directives) {
        for (var j = 0; j < directives.length; j++) {
          dirs.push({name: attr.name, value: attr.value, key: n, directive: directives[j]});
        }
      }
      if (!dirs.length) {
        for (var k = 0; k < this.globals.length; k++) {
          var g = this.globals[k].name;
          if (n.indexOf(g.substring(0, g.length - 1)) === 0) {
            dirs.push({name: attr.name, value: attr.value, key: n, directive: this.globals[k]});
          }
        }
      }
      if (!dirs.length) {
        for (var l = 0; l < this.defaults.length; l++) {
          dirs.push({name: attr.name, value: attr.value, key: n, directive: this.defaults[l]});
        }
      }
      allDirs = allDirs.concat(dirs);
    }
    return allDirs;
  }
};
$cheeta.Attribute = function (elem, name, value, key) {
  this.name = name;
  this.value = value;
  this.key = key;
  this.elem = elem;
  this.parsedMap = {};
  if (elem.getAttribute && elem.getAttribute(name)) {
    elem.attributes[name]._ooAttr_ = this;
  }
};
$cheeta.Attribute.prototype = {
  fixExpr: function (expr) {
    return (expr || this.value).trim();
  },
  parseModels: function (expr, baseOnly) {
    if (this.parsedMap[expr]) return this.parsedMap[expr];
    var attr = this, i = 0, result = [];
    result.expr = $cheeta.parser.parse(expr, baseOnly, function (tokens, hasFn, isSingleModel) {
      if (!tokens.length) return false;
      var base = tokens[0];
      if (!base.length) base = attr.elem._ooScope_.last;
      var model = attr.findBaseModel(attr.elem._ooScope_, base);
      if (!baseOnly) {
        model = model.makeChildren(tokens);
      }
      var key = baseOnly ? base : '__oo__' + i++;
      result.push({model: model, key: key, hasFn: hasFn, isSingleModel : isSingleModel});
      return key;
    });
    this.parsedMap[expr] = result;
    return result;
  },
  findBaseModel: function (scope, prop) {
    return scope ? (scope.models[prop] || this.findBaseModel(scope.parent, prop)) :
      $cheeta.Model.root.child(prop);
  },
  watch: function (fn, expr) {
    var attr = this;
    expr = this.fixExpr(expr);
    var updateFn = function () {
      fn.call(this, attr.evaluate(expr), $cheeta.Model.currentEvent);
    };
    var modelList = this.parseModels(expr), shouldRunUpdate = false;
    for (var i = 0; i < modelList.length; i++) {
      modelList[i].model.addListener(updateFn);
      if (modelList[i].model.getModelValue() !== undefined) shouldRunUpdate = true;
    }
    //!modelList.length for view.="'hi'"
    // if (shouldRunUpdate || !modelList.length) {
      // Oo.future(function(){updateFn();});
      updateFn();
    // }
  },
  attr: function (name) {
    return new $cheeta.Attribute(this.elem, name, this.getAttribute(name) || this.getAttribute(name + '.') || this.getAttribute('data-' + name + '.'));
  },
  evaluate: function (expr, params) {
    params = params || {};
    var modelList = this.parseModels(this.fixExpr(expr), true);
    for (var j = 0; j < modelList.length; j++) {
      var entry = modelList[j];
      if (entry.model === $cheeta.Model.root) continue;
      var modelValue = entry.model.getModelValue();
      if (modelValue == null && entry.hasFn) return undefined;
      params[entry.key] = modelValue;
    }
    var fn;
    //todo try to define only the vars that are used in this model ref
    //todo have more descriptive error in case script is failing
    var escapedExpr = modelList.expr.replace(/'/g, '\\\'');
    var keys = Object.keys(params);
    eval('var fn = function(' + keys.join(',') + '){return eval(\'' + escapedExpr + '\');};');
    var paramValues = keys.map(function (k) {
      return params[k];
    });
    try {
      var val = fn.apply(this.elem, paramValues);
      // console.log(escapedExpr + ': ' + val);
      return val;
    } catch (e) {
      // console[e.message && e.message.indexOf('Cannot read property ') > -1 ? 'warn' : 'error'](
      console.error(e.constructor.prototype.toString(), e.message || e, this.name, this.value, this.elem);
      // console.error(e.constructor.prototype.toString(), e.message || e,
      //   '"' + resolvedRef + '"', attr, elem, params);
      // throw e;
      return undefined;
    }
  },
  setModelValue: function (value, expr) {
    var res = this.parseModels(this.fixExpr(expr));
    for (var i = 0; i < res.length; i++) {
      res[i].model.setModelValue(value);
    }
  }
  // getModelValue: function (model, tokens) {
  //   var val;
  //   if (model && model.baseModel) {
  //     val = this.getModelValue(model.baseModel, model.refTokens);
  //   } else {
  //     val = eval(tokens[0]);
  //   }
  //   for (var i = 1; i < tokens.length; i++) {
  //     if (!val) {
  //       return undefined;
  //     }
  //     val = val[tokens[i]];
  //   }
  //   return val;
  // },
};

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

$cheeta.Future = function (fn, args) {
  this.fn = fn;
  this.args = args;
};
$cheeta.Future.prototype = {
  run: function () {
    this.fn.apply(this, this.args);
  }
};
$cheeta.Futures = function () {
  this.list = [];
  this.afterFns = [];
};
$cheeta.Futures.prototype = {
  add: function (future) {
    this.list.push(future);
  },
  run: function () {
    if (this.isRunning) return this;
    var futures = this;
    var list = this.list;
    this.list = [];
    setTimeout(function () {
      this.isRunning = true;
      try {
        for (var i = 0; i < list.length; i++) {
          list[i].run();
        }
      } finally {
        delete this.isRunning;
      }
      if (futures.list.length) futures.run();
      for (var j = 0; j < futures.afterFns.length; j++) {
        var fn = futures.afterFns[j];
        fn.call();
      }
    }, 0);
    return this;
  },
  after: function (fn) {
    this.afterFns.push(fn);
  }
};
$cheeta.Futures.current = new $cheeta.Futures();
$cheeta.future = function (fn) {
  $cheeta.Futures.current.add(new $cheeta.Future(fn, Array.prototype.slice.call(arguments, 2)));
};

$cheeta.runFutures = function (after) {
  var f = $cheeta.Futures.current.run();
  if (after) f.after(function (result) {
    after(result);
  });
};
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
//define interceptor framework to easily add interceptor to any object's method like xhr.send()
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
        $cheeta.Model.root.proxyHandler.addModel(this);
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
            $cheeta.Model.root.proxyHandler.set(origObj, key, val);
            // child.valueChange(value = child.value = child.interceptAllChildren(val));
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
  addModel: function(m) {
    if (this.models.indexOf(m) === -1) this.models.push(m);
  },
  set: function (base, prop, value) {
    if (prop === '__ooModel__') {
      this.addModel(value);
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
$cheeta.Model.root = new $cheeta.Model('window');
$cheeta.Model.root.value = window;
$cheeta.Model.root.proxyHandler = new $cheeta.Model.ProxyHandler();

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

$cheeta.parser = {
  jsonRegExp: /\{(.*)\}/g,
  modelVarRegExp: /(((((\. *)?[^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+)|\[ *([^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+|'(\\'|[^'])*') *\]) *)+\(?)|('(\\'|[^'])*')/g,
  reservedWords: (function () {
    var map = [];
    ('abstract|else|instanceof|super|boolean|enum|int|switch|break|export|interface|synchronized|byte|extends|let|this|case|false|long|' +
    'throw|catch|final|native|throws|char|finally|new|transient|class|float|null|true|const|for|package|try|continue|function|private|typeof|debugger|goto|' +
    'protected|var|default|if|public|void|delete|implements|return|volatile|do|import|short|while|double|in|static|with|window|document|JSON|' +
    'true|false|NaN|undefined|null|' + this.jsonPlaceHolder)
      .split('|').forEach(function (r) {
      map[r] = true;
    });
    return map;
  })(),
  reservedWordsRegExp: new RegExp('(^|\\W)(' + this.reservedWords + ')(\\W|$)', 'g'),
  functionPos: function (ref) {
    // TODO handle a[1.2]
    return ref.search(/\( *$/) > -1 ?
      Math.max(ref.lastIndexOf('.'), ref.lastIndexOf('['), 0) : ref.length;
  },
  hasReserved: function (ref) {
    return this.reservedWords[ref] != null;
  },
  jsonPlaceHolder: '__oo__J_',
  parse: function (ref, baseOnly, fn) {
    var parser = this;
    var jsonObjs = [];
    ref = ref.replace(this.jsonRegExp, function (match) {
      jsonObjs.push(match);
      return parser.jsonPlaceHolder;
    });
    ref = ref.replace(this.modelVarRegExp, function (match) {
      if (match.charAt(0) === '\'' || match.charAt(0) === '"' || !isNaN(match) || match === parser.jsonPlaceHolder) {
        return match;
      } else {
        var bracketIndex = match.length;
        // parse expressions inside the brackets
        match = match.replace(/\[ *([^0-9'"].*?)\]/g, function (m, $1, index) {
          parser.parse($1, fn);
          if (bracketIndex === match.length) {
            bracketIndex = index;
          }
        });
        var funcIndex, prefix = '', expr;
        if (match.startsWith('new ')) {
          funcIndex = match.length - 1;
          prefix = 'new ';
          expr = match.substring(4, funcIndex);
        } else {
          funcIndex = parser.functionPos(match.substring(0, bracketIndex));
          expr = match.substring(0, funcIndex);
        }
        var tokens = parser.toTokens(expr, baseOnly ? 1 : -1);
        if (!tokens.length || (tokens.length === 1 && !tokens[0] && match.search(/^\./) === -1) ||
          parser.hasReserved(tokens[0])) {
          return match;
        } else {
          var callbackResult = fn(tokens, funcIndex < match.length, match === ref);
          return prefix + (callbackResult === false ? expr :
              (callbackResult + (baseOnly ? expr.substring(tokens[0].length) : ''))) +
            match.substring(funcIndex);
        }
      }
    });
    for (var i = 0; i < jsonObjs.length; i++) {
      ref = ref.replace(parser.jsonPlaceHolder, jsonObjs[i]);
    }
    return ref;
  },
  tokenizeRegExp: / *\. *| *\[ *| *\] */g,
  toTokens: function (expr, limit) {
    return expr.split(this.tokenizeRegExp, limit).filter(function (el, i) {
      return i === 0 || el.length !== 0;
    }).map(function (s) {
      return s.trim();
    });
  },
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
$cheeta.directive.add({
  name: 'watch',
  link: function (elem, attr) {
    function makeEval(fn) {
      return function () {
        attr.evaluate(fn);
      };
    }

    var split = attr.value.split(';');
    for (var i = 0; i < split.length; i++) {
      var modelFn = split[i].split(':');
      attr.watch(makeEval(modelFn[1]), modelFn[0]);
    }
  }
});
$cheeta.directive.add({
  name: 'value',
  link: function (elem, attr) {
    attr.watch(function (val, e) {
      // if same element bind event triggers this watch ignore it
      if (e && elem.ooCurrentEvent === e) return;
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
    var modelExpr = split[0];
    var onChangeFn = split[1];
    $cheeta.compiler.linkDirectives(elem, 'value', modelExpr.split(',')[0], attr.scope);
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
    elem.on('change keydown keyup', function (e) {
      Oo.Model.currentEvent = elem.ooCurrentEvent = e;
      attr.setModelValue(elemValue(), modelExpr);
      if (split.length > 1) {
        attr.evaluate(onChangeFn);
      }
      delete Oo.Model.currentEvent;
      delete elem.ooCurrentEvent;
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
  name: 'const',
  link: function (elem, attr) {
    setTimeout(function () {
      var val = attr.evaluate();
      elem.innerHTML = '';
      elem.appendChild(document.createTextNode(val == null ? '' : val));
    }, 0);
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
        attr.setModelValue(over);
      }
    });
    elem.addEventListener('mouseleave', function () {
      if (over) {
        over = false;
        attr.setModelValue(over);
      }
    });
  }
});

$cheeta.directive.add({
  name: 'onaction',
  link: function (elem, attr) {
    $cheeta.compiler.linkDirectives(elem, 'onclick.onkeydown-space-enter', attr.value);
  }
});

$cheeta.directive.add({
  name: 'init',
  link: function (elem, attr) {
    $cheeta.future(function(){attr.evaluate();});
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
//default
$cheeta.directive.add({
  name: '',
  link: function (elem, attr) {
    var baseAttrName = attr.key, prevVal;
    attr.watch(function (val) {
      if (baseAttrName === 'class' || baseAttrName === 'style') {
        var delimiter = baseAttrName === 'class' ? ' ' : ';';
        var attrVal = elem.getAttribute(baseAttrName);
        if (attrVal && prevVal) {
          elem.setAttribute(baseAttrName, attrVal.replace(prevVal, val));
        } else {
          if (val) {
            elem.setAttribute(baseAttrName, attrVal + (attrVal ? delimiter : '') + val);
          }
        }
      } else if ((baseAttrName === 'disabled' || baseAttrName === 'multiple' || baseAttrName === 'required') &&
        val === false) {
        elem.removeAttribute(baseAttrName);
      } else if (val == null) {
        elem.removeAttribute(baseAttrName);
      } else {
        elem.setAttribute(baseAttrName, val);
      }
      prevVal = val;
    });
  }
});
// for maps you can do for.="key: Object.keys(obj)"
// for range for.="index : n" will repeat n times
$cheeta.directive.add({
  name: 'for',
  isTemplate: true,
  order: 100,
  link: function (elem, attr) {
    var parsed = this.parse(attr.value);
    elem.removeAttr('for.');
    elem.attr('model.', parsed.variable + ':<M>;' + (elem.attr('model.') || ''));
    elem._ooIsTemplatePlaceHolder_ = true;
    elem.addClass('hidden');

    var isRepeating = false;
    function repeatElements(val, oldVal, isRange) {
      if (!isRepeating) {
        isRepeating = true;
        try {
          oldVal = oldVal || 0;
          var i;
          if (val > oldVal) {
            for (i = oldVal; i < val; i++) {
              var el = elem.cloneNode(true);
              el.removeClass('hidden');
              el.attr('model.', el.attr('model.').replace('<M>',
                isRange ? i + 1 : parsed.ref + '[' + i + ']'));
              elem.addBefore(el);
              if (parsed.index) {
                el._ooScope_.models[parsed.index] = i;
              }
              el._ooScope_ = elem._ooScope_;
              $cheeta.compiler.compile(el);
            }
          } else if (val < oldVal) {
            for (i = val; i < oldVal; i++) {
              var toBeRemoved = elem.prev();
              toBeRemoved.remove();
              // attr.fireElemRemoved(toBeRemoved);
            }
          }
        } finally {
          isRepeating = false;
        }
      }
    }

    var oldLen;
    attr.watch(function (val) {
      // setTimeout(function () {
        var isRange = val != null && !isNaN(parseFloat(val));
        var len = isRange ? val : (val ? val.length : 0);
        repeatElements(len, oldLen, isRange);
        oldLen = len;
      // }, 0);
    }, parsed.ref);
    attr.watch(function (val) {
      // setTimeout(function () {
        repeatElements(val, oldLen, false);
        oldLen = val;
      // }, 0);
    }, parsed.ref + '.length');
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
	link: function (elem, attr) {
		elem.removeAttr('if.');
		var addedElem;
		elem._ooIsTemplatePlaceHolder_ = true;
		elem.addClass('hidden');

		attr.watch(function(val) {
			if (val) {
				if (!addedElem) {
					addedElem = elem.cloneNode(true);
					addedElem.removeClass('hidden');
					elem.addBefore(addedElem);
					$cheeta.compiler.compile(addedElem);
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
  makeUpdateFn: function(model) {
    return function (val) {
      model.valueChange(model.value = model.interceptAllChildren(val));
      if ($cheeta.debug) {
        (window.M = window.M || {})[model.name] = model.value;
      }
    };
  },
  link: function (elem, attr) {
    elem._ooScope_ = {models: {}, parent: elem._ooScope_, elem: elem,
      last: elem._ooScope_  && elem._ooScope_.last, values: {}};
    if ($cheeta.debug) {
      elem._ooScope_.id = this.id = ++this.id || 1;
    }
    //TODO handle app1['myapp,yourapp']
    var modelDefs = attr.value.split(/ *[;] */g);

    for (var i = 0; i < modelDefs.length; i++) {
      var modelDef = modelDefs[i];
      if (modelDef === '') continue;
      var index = modelDef.indexOf(':'),
        ref = modelDef.substring(index + 1).trim(),
        as = modelDef.substring(0, index).trim() || '';

      var model = new $cheeta.Model(as);
      var parseRes = attr.parseModels(ref);
      if (parseRes[0] && parseRes[0].isSingleModel) {
        var refModel = parseRes[0].model;
        model.refModel = refModel;
        refModel.refs = refModel.refs || [];
        refModel.refs.push(model);
      } else {
        attr.watch(this.makeUpdateFn(model), ref);
        // if (model.value && model.value.__template__) {
        //   $cheeta.templates[attr.value] = model.value.__template__;
        //   model.value.__templateUrl__ = attr.value;
        // }
        // if (model.value && model.value.__templateUrl__) {
        //   $cheeta.compiler.linkDirectives(elem, 'view', '\'' + attr.value + '\'');
        // }
      }
      elem._ooScope_.last = as;
      elem._ooScope_.models[as] = model;
    }
    return elem._ooScope_.models;
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
    link: function(elem, attr) {
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
        }, attr.attr('delay').evaluate() || 0);
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
    if (!elem._ooIsTemplatePlaceHolder_) {
      elem.addClass('oo-invisible');
      elem.innerHTML = content;
      if (elem.childElementCount === 1 && elem.firstChild.tagName === 'SCRIPT') {
        elem.innerHTML = elem.firstChild.textContent;
      }
      $cheeta.compiler.compileChildren(elem);
    }
  },
  toCamelCase: function (str) {
    return str.replace(/(^|-)([a-z])/g, function (m, p1, p2) {
      return p2.toUpperCase();
    });
  },
  link: function (elem, attr) {
    // var tagClass = this.toCamelCase(elem.tagName.toLowerCase());
    // var clazz;
    // try {
    //   clazz = window[tagClass] || eval(tagClass);
    // } catch (e){}
    // if (clazz && typeof clazz === 'function') {
    //   $cheeta.compiler.linkDirectives(elem, 'model', 'new ' + tagClass + '()');
    // }
    var dir = this;
    attr.watch(function (val) {
      elem.compiled = true;
      if (!elem._ooIsTemplateLoading_ && val != null) {
        // to avoid infinite loop
        elem._ooIsTemplateLoading_ = true;
        try {
          var content = $cheeta.templates[val] ||
            (document.getElementById(val) && document.getElementById(val).innerHTML) ||
            (document.getElementById(elem.tagName.toLowerCase()) &&
            document.getElementById(elem.tagName.toLowerCase()).innerHTML);
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
          delete elem._ooIsTemplateLoading_;
        }
      }
    });
  }
});