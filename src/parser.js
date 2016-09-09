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
      if (match.charAt(0) === '\'' || match.charAt(0) === '"' || !isNaN(match)) {
        return match;
      } else {
        var bracketIndex = match.length;
        match = match.replace(/\[ *([^0-9'"].*?)\]/g, function (m, $1, index) {
          parser.parse($1, fn);
          if (bracketIndex === match.length) {
            bracketIndex = index;
          }
        });
        var funcIndex = parser.functionPos(match.substring(0, bracketIndex));
        var expr = match.substring(0, funcIndex);
        var tokens = parser.toTokens(expr, baseOnly ? 1 : -1);
        if (!tokens.length || (tokens.length === 1 && !tokens[0]) || parser.hasReserved(tokens[0])) {
          return match;
        } else {
          var callbackResult = fn(tokens, funcIndex < match.length);
          return (callbackResult === false ? expr : (callbackResult + (baseOnly ? expr.substring(tokens[0].length) : ''))) +
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