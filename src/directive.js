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
  fixExpr: function (expr) {
    expr = expr || this.value;
    if (expr.startsWith('.') && this.elem.ooScope.__last__) {
      expr = this.elem.ooScope.__last__ + expr;
    }
    return expr;
  },
  watch: function (fn, expr) {
    var attr = this;
    expr = this.fixExpr(expr);

    var updateFn = function () {
      fn.call(this, attr.evaluate(expr));
    };
    var shouldUpdate;
    $cheeta.parser.parse(expr, function (tokens) {
      if (!tokens.length) return;
      var scope = attr.findReferredScope(attr.elem.ooScope, tokens[0]);
      var baseModel = scope.models[tokens[0]];
      if (baseModel) {
        var model = scope.models[tokens[0]].makeChildren(tokens);
        model.addListener(updateFn);
        if (attr.getModelValue(baseModel, tokens) !== undefined) {
          shouldUpdate = true;
        }
      }
    });
    if (shouldUpdate) updateFn();
  },
  findReferredScope: function (scope, prop) {
    return scope ? ((scope.models[prop] && scope) || this.findReferredScope(scope.parent, prop))
      : window.ooScope;
  },
  setModelValue: function (value, expr) {
    var tokens = $cheeta.parser.toTokens(this.fixExpr(expr));
    var scope = this.findReferredScope(this.elem.ooScope, tokens[0]);
    var model = scope.models[tokens[0]];
    this.getModelValue(model, tokens.slice(0, tokens.length - 1), true)[tokens[tokens.length - 1]] = value;
  },
  getModelValue: function (model, tokens, evalIfNotFound) {
    var val = (model && model.value) || (evalIfNotFound && eval(tokens[0]));
    for (var i = 1; i < tokens.length; i++) {
      if (!val) {
        return undefined;
      }
      val = val[tokens[i]];
    }
    return val;
  },
  attr: function (name) {
    return new $cheeta.Attribute(this.elem, name, this.getAttribute(name) || this.getAttribute(name + '.') || this.getAttribute('data-' + name + '.'));
  },
  evaluate: function (expr, params) {
    params = params || {};
    expr = this.fixExpr(expr || this.value);
    var attr = this, i = 1;
    var resolvedExpr = $cheeta.parser.parse(expr, function (tokens) {
      if (!tokens.length) return false;
      var scope = attr.findReferredScope(attr.elem.ooScope, tokens[0]);
      var baseModel = scope.models[tokens[0]];
      if (!baseModel) return false;
        var key = '__oo__' + i++;
      params[key] = attr.getModelValue(baseModel, tokens);
      return key;
    });
    var fn;
    //todo try to define only the vars that are used in this model ref
    //todo have more descriptive error in case script is failing
    var escapedExpr = resolvedExpr.replace(/'/g, '\\\'');
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

