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
	reservedWords: (function() {
		var map = [];
		('abstract|else|instanceof|super|boolean|enum|int|switch|break|export|interface|synchronized|byte|extends|let|this|case|false|long|' +
		'throw|catch|final|native|throws|char|finally|new|transient|class|float|null|true|const|for|package|try|continue|function|private|typeof|debugger|goto|' +
		'protected|var|default|if|public|void|delete|implements|return|volatile|do|import|short|while|double|in|static|with')
			.split('|').forEach(function(r) {map[r] = true;});
		return map;
	})(),
	reservedWordsRegExp: new RegExp('(^|\\W)(' + this.reservedWords + ')(\\W|$)', 'g'),
	parse: function(ref, modelRefs) {
		function hasReserved(ref) {
			var c = ref.charAt(0);
			if (c.toUpperCase() === c || c === '$' || c === '_' || name === 'window') {
				return true;
			}
			var i = ref.indexOf('.');
			i = i === -1 ? ref.length : i;
			return _this.reservedWords[ref.substring(0, i)] != null;
		}
		function functionPos(ref) {
			// handle a[1.2]
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
					var append = match.substring(index);
					var mRef = match.substring(0, index);
					if (mRef.indexOf('.') === 0) {mRef = modelRefs[0].name + mRef;}
					var model = $cheeta.model(mRef, modelRefs);
					if (model != null) {
						result.models.push(model);
					}
					return model instanceof $cheeta.Model ? model.ref() + append : model;
				}
			}
		});

		return result;
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
			attr.parseResult = {};
			attr.resolve = function(ref, mRefs) {
				var parseRef = ref || attr.value;
				if (!attr.parseResult[parseRef]) {
					attr.parseResult[parseRef] = $cheeta.directives.parse(
						parseRef, mRefs || modelRefs);
				}
				return attr.parseResult[parseRef];
			};
			attr.models = function(ref, mRefs) {
				return attr.resolve(ref, mRefs).models;
			};

			function makeWatch(values) {
				return function (fn, ref) {
					function makeCallback(model, values) {
						return function() {
							values.oldVal = values.val;
							values.val = attr.evaluate({}, ref);
							fn.call(model, values.val, values.oldVal);
						};
					}
					var models = attr.models(ref);
					for (var i = 0; i < models.length; i++) {
						var m = models[i];
						if (m instanceof $cheeta.Model) {
							var callback = makeCallback(m, values);
							m.watch(elem, callback);
							callback(m, values);
						}
					}
				};
			}
			attr.watch = makeWatch({});

			attr.evaluate = function(additionalModelRefs, ref) {
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
					//var rootVal = $cheeta.model.root.value;
					//for (key in rootVal) {
					//	if (params[key] === undefined && rootVal.hasOwnProperty(key)) {
					//		params[key] = rootVal[key];
					//	}
					//}
					params[$cheeta.model.root.names[0]] = $cheeta.model.root.value;
					return params;
				}

				ref = attr.resolve(ref, modelRefs).ref;
				var params = addModelParams(additionalModelRefs);
				var fn;
				//todo try to define only the vars that are used in this model ref
				//todo have more descriptive error in case script is failing
				var escapedVal = ref.replace(/'/g, '\\\'');
				var keys = Object.keys(params);
				eval('var fn = function(' + keys.join(',') + '){return eval(\'' + escapedVal + '\');};');
				var paramValues = keys.map(function (k) {return params[k];});
				console.log('eval', ref, paramValues);
				try {
					return fn.apply(elem, paramValues);
				} catch (e) {
					if (console.error) {
						console.error(e.constructor.prototype.toString(), e.message || e,
							'"' + ref + '"', attr, elem, params);
					}
					throw e;
				}
			};

			return attr;
		};
	}

};

$cheeta.directive = function(def) {
	if (Object.isString(def)) {
		return $cheeta.directives.get(def);
	}
	def.linkFn =  function (elem, attrName, modelRefs) {
		var allAttr = $cheeta.directives.modelAttr(elem, modelRefs);
		elem.M = modelRefs;
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