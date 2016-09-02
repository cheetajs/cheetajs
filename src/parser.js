$cheeta.parser = {
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
      result.models.map(function (m) {
        do {
          m = m.parent;
          if (m.dependents) dependents = dependents.concat(m.dependents);
        } while (m.parent && m.parent !== $cheeta.Model.root);
      });
      result.models = result.models.concat(dependents);
    }

    if (result.models.length === 1) {
      result.model = result.models[0];
    } else if (result.models.length > 1) {
      result.model = new $cheeta.Model(ref, null, result.ref);
      result.model.dependents = result.models;
    }

    return result;
  }
};
