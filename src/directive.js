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
          attr.parseResult[parseRef] = $cheeta.parser.parse(parseRef, mRefs || modelRefs);
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
      attr.unwatches = [];
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
            attr.unwatches.push(m.watch(callback));
          }
        }
        if (!callback) {
          callback = makeCallback(null, attr.values);
        }
        $cheeta.future(callback, 1);
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
          params[$cheeta.Model.root.names[0]] = $cheeta.Model.root.getValue();
          return params;
        }

        var resolvedRef = attr.resolve(ref, modelRefs).ref;
        if ($cheeta.debug) {
          elem.setAttribute('OO-' + attr.name, resolvedRef);
        }
        var params = addModelParams(additionalModelRefs);
        params.$elem = elem;
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
          // console.log(escapedVal + ': ' + val);
          return val;
        } catch (e) {
          // console[e.message && e.message.indexOf('Cannot read property ') > -1 ? 'warn' : 'error'](
          console.error(e.constructor.prototype.toString(), e.message || e, attr.name, attr.value, elem);
              // console.error(e.constructor.prototype.toString(), e.message || e,
              //   '"' + resolvedRef + '"', attr, elem, params);
          throw e;
          // return undefined;
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
    var thisAttr = allAttr(attr);
    elem.addEventListener($cheeta.directive.removeEventName, function () {
      // console.log('removed', elem);
      for (var i = 0; i < attr.unwatches.length; i++) {
        thisAttr.unwatches[i]();
      }
    });
    elem.hasDirective = true;
    return def.link.call(this, elem, attr, allAttr, modelRefs);
  };

  $cheeta.directives.add(def);

  return def;
};
$cheeta.directive.removeEventName = 'cheeta-removed';

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