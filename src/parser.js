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
  functionPos: function (ref) {
    // TODO handle a[1.2]
    return ref.search(/\( *$/) > -1 ?
      Math.max(ref.lastIndexOf('.'), ref.lastIndexOf('['), 0) : ref.length;
  },
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
      return parser.reservedWords[ref.substring(0, i)] != null;
    }

    var parser = this;
    var jsonObjs = [];
    ref = ref.replace(this.jsonRegExp, function (match) {
      jsonObjs.push(match);
      return '$J';
    });
    ref = ref.replace(this.modelVarRegExp, function (match) {
      if (match.charAt(0) === '\'' || match.charAt(0) === '"' || match === 'true' || match === 'false' ||
        match === 'undefined' || match === 'null' || match === 'NaN' || !isNaN(match) || match === '$J') {
        return match;
      } else {
        var bracketIndex = match.length;

        match = match.replace(/\[ *([^0-9'"].*?)\]/g, function (m, $1, index) {
          parser.parse($1, fn);
          if (bracketIndex === match.length) {
            bracketIndex = index;
          }
        });
        if (hasReserved(match)) {
          return match;
        } else {
          var funcIndex = parser.functionPos(match.substring(0, bracketIndex));
          var expr = match.substring(0, funcIndex);
          return (fn(parser.toTokens(expr)) || expr) + match.substring(funcIndex);
        }
      }
    });
    var i = 0;
    ref = ref.replace(/\$J/, function () {
      return jsonObjs[i++];
    });
    return ref;
  },
  toTokens: function (expr) {
    return expr.split(/ *\. *| *\[ *| *\] */g).filter(function (el) {
      return el.length !== 0;
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