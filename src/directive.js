$cheeta.directives = {
	directives: {},
	globals: [],
	defaults: [],
	add: function(directive) {
		this.directives[name] = (this.directives[name] || []);
		this.directives[name].push(directive);
		if (directive.isGlobal()) {
			this.globals.push(directive);
		}
		if (directive.name == '') {
			this.defaults.push(directive);
		}
	},
	get: function(name) {
		var dirs = [], i;
		var split = name.split('.');
		if (split[split.length - 1] === '') {
			split.pop();
		}
		for (i = 0; i < split.length; i++) {
			dirs.concat(this.directives[name]);
		}
		for (i = 0; i < this.globals.length; i++) {
			if (this.globals[i].match(name)) {
				dirs.push(this.globals[i]);
			}
		}
		return dirs.length ? dirs || this.defaults;
	}
};

$cheeta.directive = function(name, linkFn, order) {
	this.modelVarRegExp = /(((((\. *)?[^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+)|\[ *([^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+|'(\\'|[^'])*') *\]) *)+\(?)|('(\\'|[^'])*')/g;
	this.reservedWords = '(abstract|else|instanceof|super|boolean|enum|int|switch|break|export|interface|synchronized|byte|extends|let|this|case|false|long|' +
	'throw|catch|final|native|throws|char|finally|new|transient|class|float|null|true|const|for|package|try|continue|function|private|typeof|debugger|goto|' +
	'protected|var|default|if|public|void|delete|implements|return|volatile|do|import|short|while|double|in|static|with)';

	this.attr = function (elem, modelRefs) {
		var d = this;
		return function (name) {
			var parse = d.parse(elem.attr(name), modelRefs);
			elem.attr(name, parse.val);
			this.value = elem.attr(name);
			this.name = name;
			this.remove = function() {
				elem.removeAttribute(name);
			};
			this.getValue = function () {
				return eval(elem.attr(name));
			};
			function makeWatch(values) {
				var _this = this;
				return function (fn) {
					for (var i = 0; i < parse.models.length; i++) {
						addEventListener('Oo-model-change-' + parse.models[i].ref(), function () {
							values.val = _this.getValue();
							fn.call(d, values.val, values.oldVal);
							values.oldVal = values.val;
						}, false);
					}
				}
			}

			this.watch = makeWatch({});
			this.fn = function () {
				return function (params) {
					for (var key in params) {
						if (params.hasOwnProperty(key)) {
							window[key] = params[key];
						}
					}
					eval(elem.attr(name));
				}
			}
		};
	};

	var directive = {
		name: name,
		order: order || 1000,
		isGlobal: function () {
			return this.name.indexOf('*', this.name.length - 1) > -1;
		},
		match: function (attrName) {
			return attrName.match(name.replace('*', '.*'));
		},
		link: function (elem, attrName, modelRefs) {
			//this.parseModelVars(elem.getAttribute(attrName));
			var allAttr = $cheeta.directive.attr(elem, modelRefs);

			linkFn.call(this, elem, allAttr[attrName], allAttr);
		},
		parse: function(val, modelRefs) {
			var models = [];
			val = val.replace($cheeta.directive.modelVarRegExp, function (match) {
				if (match.charAt(0) === '\'' || match.charAt(0) === '"' || match === 'true' || match === 'false' ||
					match === 'undefined' || match === 'null' || match === 'NaN' || !isNaN(match)) {
					return match;
				} else {
					match = match.replace(/\[ *([^0-9'"].*?)\]/g, function (m, $1) {
						return '[' + replaceModelVars($1) + ']';
					});
					var reserved = '';
					match = match.replace(new RegExp('(^|\\W)' + $cheeta.directive.reservedWords + '(\\W|$)', 'g'), function (m, $1, $2, $3) {
						reserved += $2 + '|';
						return $1 + '\'' + $2 + '\'' + $3;
					});
					if (reserved.length > 0) {
						match = replaceModelVars(match);
						return match.replace(new RegExp('\'\(' + reserved.slice(0, -1) + '\)\'', 'g'), function (m) {
							return m.slice(1, -1);
						});
					} else {
						var model = $cheeta.model(match, modelRefs);
						if (model instanceof Array) {
							var ref = model[0].ref();
							return ref + (ref.length > 0 && model[1][0] !== '[' ? '.' : '') + model[1];
						}
						models.push(model);
						return model.ref();
					}
				}
			});
			return {
				models: models,
				val: val
			}
		}
	};
	$cheeta.directives.add(directive);

	return directive;
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

$cheeta.Directive.get = function (name, parentModels) {
	if (name.indexOf('data-') === 0) {
		name = name.substring(5);
	}
	var endsWithDot = name.indexOf('.', name.length - 1) > -1;
	parentModels = parentModels || [$cheeta.model.root];
	for (var i = 0; i < parentModels.length; i++) {
		var model = parentModels[i];
		var directive = model.getDirective(name);
		if (directive == null && model.directives != null && model.directives['/'] != null && endsWithDot) {
			var indices = model.directives['/'];
			for (var k = 0; k < indices.length; k++) {
				directive = model.directives[name.substring(0, indices[k]) + '*'];
				if (directive != null) {
					return directive;
				}
			}
		} else {
			if (directive != null) {
				return directive;
			}
		}
	}
	return $cheeta.Directive.get('');
};