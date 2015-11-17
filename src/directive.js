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
    result.ref = ref.replace(this.modelVarRegExp, function (match) {
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

    if (result.models.length === 1) {
      result.model = result.models[0];
    } else {
      result.model = $cheeta.Model.root.child(ref, false, result.ref);
      result.isMultiModel = true;
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
          attr.parseResult[parseRef] = $cheeta.directives.parse(
            parseRef, mRefs || modelRefs);
          if (attr.parseResult[parseRef].isMultiModel) {
            $cheeta.future(function() {$cheeta.Model.root[ref] = attr.evaluate(ref);});
          }
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
          return fn.apply(elem, paramValues);
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