$cheeta.directives = {
	directives: {},
	globals: [],
	defaults: [],
	add: function(directive) {
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
	get: function(name) {
		var dirs = [], i;
		name = name.toLowerCase();
		var split = name.split('.');
		if (split[split.length - 1] === '') {
			split.pop();
		}
		for (i = 0; i < split.length; i++) {
			var n = split[i];
			dirs = dirs.concat(this.directives[split[i]] || []);
			for (var j = 0; j < this.globals.length; j++) {
				var g = this.globals[j].name;
				if (n.replace(/^data-/, '').indexOf(0, g.substring(g.length - 1)) === 0) {
					dirs.push(this.globals[i]);
				}
			}
		}

		return dirs.length ? dirs : this.defaults;
	},
	modelVarRegExp: /(((((\. *)?[^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+)|\[ *([^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+|'(\\'|[^'])*') *\]) *)+\(?)|('(\\'|[^'])*')/g,
	reservedWords: '(abstract|else|instanceof|super|boolean|enum|int|switch|break|export|interface|synchronized|byte|extends|let|this|case|false|long|' +
		'throw|catch|final|native|throws|char|finally|new|transient|class|float|null|true|const|for|package|try|continue|function|private|typeof|debugger|goto|' +
		'protected|var|default|if|public|void|delete|implements|return|volatile|do|import|short|while|double|in|static|with)',
	parse: function(ref, modelRefs) {
		var _this = this, models = [];
		ref.replace(this.modelVarRegExp, function (match) {
			if (match.charAt(0) === '\'' || match.charAt(0) === '"' || match === 'true' || match === 'false' ||
				match === 'undefined' || match === 'null' || match === 'NaN' || !isNaN(match)) {
				return match;
			} else {
				match = match.replace(/\[ *([^0-9'"].*?)\]/g, function (m, $1) {
					var r = _this.parse($1);
					models = models.concat(r.models);
					return '[' + r.ref + ']';
				});
				var reserved = '';
				match = match.replace(new RegExp('(^|\\W)' + _this.reservedWords +
					'(\\W|$)', 'g'),
					function (m, $1, $2, $3) {
						reserved += $2 + '|';
						return $1 + '\'' + $2 + '\'' + $3;
					}
				);
				if (reserved.length > 0) {
					var r = _this.parse(match);
					models = models.concat(r.models);
					return r.ref.replace(new RegExp('\'\(' + reserved.slice(0, -1) + '\)\'', 'g'),
						function (m) {
							return m.slice(1, -1);
						}
					);
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

		return models;
	},
	modelAttr: function (elem, modelRefs) {
		return function (name) {
			var attr = elem.attributes[name];
			if (attr == null) {
				return {modelValue: function(){return undefined;}};
			}
			attr.key = attr.name.replace(/^data-/, '').replace(/\.$/, '');
			attr.remove = function() {
				elem.removeAttribute(name);
			};
			attr.parsedModels = null;
			function ensureParsed() {
				attr.parsedModels = attr.parsedModels || $cheeta.directives.parse(
												elem.getAttribute(name), modelRefs);
			}
			function listen(model, callback) {
				document.addEventListener('Oo-model-change-' + model.ref(), callback, false);
				elem.addEventListener('removed', function() {
					document.removeEventListener('Oo-model-change-' + model.ref(), callback);
				}, false);
			}
			function makeWatch(values) {
				return function (fn) {
					function makeCallback(model, values) {
						return function() {
							values.val = attr.eval();
							fn.call(model, values.val, values.oldVal);
							values.oldVal = values.val;
						};
					}
					ensureParsed();
					for (var i = 0; i < attr.parsedModels.length; i++) {
						var m = attr.parsedModels[i];
						var callback = makeCallback(m, values);
						listen(m, callback, callback);
						callback(m, values);
					}
				};
			}
			attr.watch = makeWatch({});

			attr.eval = function (params) {
				function keyList(params) {
					var str = '';
					for (var key in params) {
						if (params.hasOwnProperty(key)) {
							str += ',' + key;
						}
					}
					return str.length ? str.substring(1) : str;
				}
				function valueList(params) {
					var list = [];
					for (var key in params) {
						if (params.hasOwnProperty(key)) {
							list.push(params[key]);
						}
					}
					return list;
				}
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
							params[key] = modelRefs[key].value;
						}
					}
					var rootChildren = $cheeta.model.root.children;
					for (key in rootChildren) {
						if (params[key] === undefined && rootChildren.hasOwnProperty(key)) {
							params[key] = rootChildren[key].value;
						}
					}
					params[$cheeta.model.root.names[0]] = $cheeta.model.root;
					return params;
				}

				ensureParsed();
				params = addModelParams(params);
				var fn;
				//todo try to define only the vars that are used in this model ref
				//todo have more descriptive error in case script is failing
				var escapedVal = attr.value.replace(/'/g, '\\\'');
				eval('var fn = function(' + keyList(params) + '){return eval(\'' + escapedVal + '\')};');
				return fn.apply(elem, valueList(params));
			};

			attr.models = function() {
				ensureParsed();
				return attr.parsedModels;
			};
			return attr;
		};
	}

};

$cheeta.directive = function(def) {
	def.linkFn =  function (elem, attrName, modelRefs) {
		var allAttr = $cheeta.directives.modelAttr(elem, modelRefs);
		return def.link.call(this, elem, allAttr(attrName), allAttr, modelRefs);
	};

	$cheeta.directives.add(def);

	return def;
};

new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
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