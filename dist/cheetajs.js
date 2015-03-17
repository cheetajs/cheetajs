
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
'use strict';
if (!Element.prototype.attr) {
	Element.prototype.attr = function (n, v) {
		if (v != null) {
			this.setAttribute(n, v);
			return this;
		} else {
			return this.getAttribute(n) || this.getAttribute('data-' + n) ||
				(n.indexOf('.', n.length - 1) > -1 &&this.getAttribute(n.substring(n.length - 1)));
		}
	};
}
if (!Element.prototype.removeAttr) {
	Element.prototype.removeAttr = function (n) {
		return this.removeAttribute(n) || this.removeAttribute('data-' + n);
	};
}
if (!Element.prototype.addClass) {
	Element.prototype.addClass = function (c) {
		if (c != null) {
			if (!this.hasClass(c)) {
				this.setAttribute('class', (this.getAttribute('class') ? this.getAttribute('class') + ' ' : '') + c);
			}
		}
		return this;
	};
}
if (!Element.prototype.removeClass) {
	Element.prototype.removeClass = function (c) {
		if (c != null) {
			if (this.hasClass(c)) {
				this.setAttribute('class', this.getAttribute('class').replace(new RegExp('(' + c + '$)|( ' + c + ')', 'g'), ''));
			}
		}
		return this;
	};
}
if (!Element.prototype.hasClass) {
	Element.prototype.hasClass = function (c) {
		return this.getAttribute('class') && this.getAttribute('class').split(' ').indexOf(c) > -1;
	};
}
if (!Element.prototype.add) {
	Element.prototype.add = function (e, index) {
		if (e && e.length != null && e[0] != null) {
			for (var i = 0; i < e.length; i++) {
				this.add(e[i], index);
			}
		} else {
			this.insertBefore(e, index && this.childNodes[index]);
		}
		e.remove();
		return this;
	};
}
if (!Element.prototype.addBefore) {
	Element.prototype.addBefore = function (e) {
		if (e && e.length != null && e[0] != null) {
			for (var i = 0; i < e.length; i++) {
				this.addBefore(e[i]);
			}
		} else {
			this.parentNode.insertBefore(e, this);
		}
		return this;
	};
}
if (!Element.prototype.addAfter) {
	Element.prototype.addAfter = function (e) {
		if (e && e.length != null && e[0] != null) {
			for (var i = 0; i < e.length; i++) {
				this.addAfter(e[i]);
			}
		} else {
			this.parentNode.insertBefore(e, this.nextSibling);
		}
		return this;
	};
}
if (!Element.prototype.remove) {
	Element.prototype.remove = function () {
		if (this.parentNode) {this.parentNode.removeChild(this);}
		return this;
	};
}
if (!Element.prototype.html) {
	Element.prototype.html = function (h) {
		this.innerHTML = h;
		return this;
	};
}
if (!Element.prototype.wrap) {
	Element.prototype.wrap = function (e) {
		this.addAfter(e);
		this.remove();
		e.add(this);
		return this;
	};
}
if (!document.create) {
	document.create = function (s) {
		if (s.charAt(0) === '<') {
			var div = document.createElement('div');
			div.innerHTML = s;
			return div.removeChild(div.firstChild);
		} else {
			return document.createElement(s);
		}
	};
}
window.El = document.create;

(function() {
	var args = Array.prototype.slice.call(arguments);
	for (var i = 0; i < args.length; i++) {
		(args[i].prototype ? args[i].prototype : args[i]).on = (args[i].prototype ? args[i].prototype : args[i]).on ||
			function(events, fn) {
				var split = events.split(' ');
				for (var i = 0; i < split.length; i++) {
					if (split[i].length > 0) {
						this.addEventListener(split[i], fn, false);
					}
				}
			};
	}
})(Element, window, document);
(function() {
	var args = Array.prototype.slice.call(arguments);
	for (var i = 0; i < args.length; i++) {
		(args[i].prototype ? args[i].prototype : args[i]).off = (args[i].prototype ? args[i].prototype : args[i]).off || 
			function(events, fn) {
				var split = events.split(' ');
				for (var i = 0; i < split.length; i++) {
					if (split[i].length > 0) {
						this.removeEventListener(split[i], fn, false);
					}
				}
			};
	}
})(Element, window, document);
/*jshint -W020 */
$cheeta = Oo = {};

$cheeta.Model = function(name, parent) {
	this.value = undefined;
	this.parent = parent;
	this.names = [name];
	this.children = {};
	this.ref = function () {
		var expr = '';
		var model = this;
		while (model.parent != null && model.names[0] != null) {
			expr = (model.hasSpecialChar ? '[\'' + model.names[0] + '\']' : '.' + model.names[0]) + expr;
			model = model.parent;
		}

		return expr.substring(1);
	};
	this.getValue = function () {
		return this.parent.value[this.names[0]];
	};
	this.setValue = function (value) {
		if (this.value !== value) {
			this.parent.value[this.names[0]] = value;
		}
	};
	this.child = function (name, hasSpecialChar) {
		if (this.value == null) {
			this.value = this.isArray ? [] : {};
		}
		var model = this.children[name];
		if (model === undefined) {
			model = new $cheeta.Model(name, this);
			model.interceptProp(this.value, name, hasSpecialChar);
			this.children[name] = model;
			model.value = this.value == null ? undefined : this.value[name];
		}
		model.hasSpecialChar = hasSpecialChar;
		return model;
	};
	this.alias = function (alias) {
		if (alias != null && alias !== this.names[0]) {
			this.names.push(alias);
		}
	};
	this.valueChange = function (val, oldVal) {
		document.dispatchEvent(new CustomEvent('Oo-model-change-' + this.ref(),
			{'detail': {value: val, oldValue: oldVal, target: this}}));
		return this;
	};
	this.interceptArray = function() {
		if (this.value != null) {
			var interceptor = new this.ArrayInterceptor(this);
			for (var key in interceptor) {
				if (interceptor.hasOwnProperty(key)) {
					if (this.value[key] === interceptor[key]) {
						break;
					}
					this.value[key] = interceptor[key];
				}
			}
		}
		this.child('length', this.value.length, true);
	};
	this.interceptProp = function(value, name, skipDefine) {
		console.log('intercepting', name);
		if (value != null) {
			var model = this;
			var beforeValue = value[name];
			var isCheetaIntercepted = model.parent.children && model.parent.children[name] != null;
			// avoid infinite loop to redefine prop
			var prevProp = isCheetaIntercepted ? null : Object.getOwnPropertyDescriptor(value, name);
			try {
				if (!skipDefine) {
					this.redefineProp(value, name, prevProp);
				}
			} catch(e) {
				if (!(e instanceof TypeError)) {
					throw e;
				}
				return;
			}
			value[name] = beforeValue;
		}
	};
	this.redefineProp = function(value, name, prevProp) {
		var model = this;
		Object.defineProperty(value, name, {
			set: function (val) {
				if (prevProp && prevProp.set) {
					prevProp.set.apply(value, arguments);
				}
				val = (prevProp && prevProp.get && prevProp.get.apply(value)) || val;
				var prevVal = model.value;
				if (prevVal !== val) {
					model.value = val;
					if (Object.isArray(val)) {
						model.interceptArray();
					}
					model.valueChange(val, prevVal);
					if (val instanceof Object) {
						for (var key in model.children) {
							if (model.children.hasOwnProperty(key)) {
								var origVal = val[key];
								// cleanup the previous value's child interceptors.
								if (prevVal != null) {
									var pval = prevVal[key];
									delete prevVal[key];
									prevVal[key] = pval;
								}
								model.children[key].interceptProp(val, key);
								val[key] = origVal;
							}
						}
					}
				}
			},
			get: function () {
				return (prevProp && prevProp.get && prevProp.get.apply(value)) || model.value;
			},
			enumerable: true,
			configurable: true
		});
	};
};
$cheeta.model = function(name, modelRefs) {
	//function findParentModel(model, rootName) {
	//	while (model !== $cheeta.model.root) {
	//		if (model.names.indexOf(rootName) > -1) {
	//			return model;
	//		}
	//		model = model.parent;
	//	}
	//	return model;
	//}

	if (name == null) {
		return $cheeta.model.root;
	}

	var split = name.split(/ *\. *| *\[ */g);
	var parentModel = modelRefs[split[0]] || $cheeta.model.root;

	//if (parentModels == null) {
	//	parentModels = [$cheeta.model.root];
	//}
	//if (name === '$i') {
	//	for (var i = parentModels.length - 1; i >= 0; i--) {
	//		if (parentModels[i].names[0] === '$i') {
	//			return parentModels[i];
	//		}
	//	}
	//}
	//if (name.search(/^ *\./) === 0) {
	//	// bind dot-starting to the first parent
	//	name = parentModels[0].names[0] + name;
	//}

	//var parentModel = $cheeta.model.root;
	//var rootName = split[0];
	//for (var j = 0; j < parentModels.length; j++) {
	//	parentModel = parentModels[j];
	//	parentModel = this.findParentModel(parentModel, rootName);
	//	if (parentModel !== $cheeta.model.root) {
	//		break;
	//	}
	//}
	for (var k = parentModel === $cheeta.model.root ? 0 : 1; k < split.length; k++) {
		var hasSpecialChar = false, modelName = split[k];
		if (modelName.search(/\( *$/) > -1) {
			if (modelName.search(/\] */) > -1) {
				modelName = '[' + modelName;
			}
			break;
			//return [parentModel, modelName];
		} else if (modelName.search(/\] *$/) > -1) {
			modelName = modelName.replace(/^ *'|'? *] *$/g, '');
			hasSpecialChar = true;
		}
		parentModel = parentModel.children[modelName] || parentModel.child(modelName, hasSpecialChar);
	}
	return parentModel;
};

$cheeta.model.ArrayInterceptor = function(model) {
	function arrayChange(newLen, oldLen) {
		if (newLen !== oldLen) {
			if (newLen < oldLen) {
				for (var i = newLen; i < oldLen; i--) {
					model.child(i).valueChange();
				}
			}
			model.child('length').valueChange(newLen, oldLen);
		}
	}
	return {
		push: function () {
			var len = this.length;
			var result = Array.prototype.push.apply(this, arguments);
			var newLen = this.length;
			arrayChange(newLen, len);
			return result;
		},
		pop: function () {
			var len = this.length;
			var result = Array.prototype.pop.apply(this, arguments);
			var newLen = this.length;
			arrayChange(newLen, len);
			return result;
		},
		shift: function () {
			return this.splice(0, 1)[0];
		},
		unshift: function () {
			var args = [].slice.apply(arguments);
			args.unshift(0, 0);
			this.splice.apply(this, args);
			return this.length;
		},
		splice: function () {
			var len = this.length;
			var result = Array.prototype.splice.apply(this, arguments);
			var newLen = this.length;
			arrayChange(newLen, len);
			return result;
		}
	};
};

//$cheeta.refresh = function(modelRef) {
//	var model = $cheeta.model.createOrGetModel(null, modelRef);
//	model.valueChange(model.getValue(), null);
//};
(function() {
	var windowModel = new $cheeta.Model('');
	windowModel.value = window;
	//$cheeta.model.root = $cheeta.model.root || new $cheeta.Model('$model');
	$cheeta.model.root = windowModel.child('$model');
	window.$model = window.$model || {};
})();

$cheeta.watchFns = [];
$cheeta.watch = function(modelExpr, fn) {
	$cheeta.watchFns.push(fn);
	var elem = document.createElement('div');
	elem.setAttribute('style', 'display:none');
	elem.setAttribute('watch.', modelExpr);
	elem.setAttribute('onwatch.', '$cheeta.watchFns[' + ($cheeta.watchFns.length - 1) + ']()');
	document.body.appendChild(elem);
	$cheeta.compiler.compile([$cheeta.model.root], elem);
};

$cheeta.future = function(future, delay) {
	$cheeta.future.evals.push(delay ? function() {setTimeout(future, delay);} : future);
};
$cheeta.future.evals = $cheeta.future.evals || [];

window.addEventListener('load', function() {
	if (!$cheeta.isInitialized) {
		$cheeta.isInitialized = true;
		$cheeta.hash.init();
		$cheeta.compiler.compile(document.documentElement, {});
	}
}, false);
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
$cheeta.compiler = {
	recursiveCompile: function (node, modelsRefs, runInlineScripts, skipSiblings, skipNode) {
		if (node) {
			var skip = false;
			if (!skipNode) {
				if (node.nodeType === 1) {
					if (node.tagName.toLowerCase() === 'script') {
						if (runInlineScripts && (node.parentNode == null ||
							node.parentNode.tagName.toLowerCase() !== 'head') &&
							(node.type == null || node.type === '' || node.type === 'text/javascript')) {
							var content = node.innerHTML || '';
							var head = document.getElementsByTagName('head')[0] || document.documentElement;
							var script = document.createElement('script');
							script.type = 'text/javascript';
							script.appendChild(document.createTextNode(content));
							head.insertBefore(script, head.firstChild);
							head.removeChild(script);
						} else if (node.type === 'text/cheeta-template') {
							$cheeta.templates[node.getAttribute('id')] = node.innerHTML || '';
						}
					}
					var dir = this.compileDirectives(node, modelsRefs);
					skip = dir.skip;
					modelsRefs = dir.refs;
				}
			}
			if (!skip) {
				this.recursiveCompile(node.firstChild, modelsRefs, runInlineScripts);
			}
			if (!skipSiblings) {
				this.recursiveCompile(node.nextSibling, modelsRefs, runInlineScripts);
			}
		}
	},
	compileDirectives: function (elem, modelRefs) {
		var directives = this.getAllDirectivesWithAttr(elem), isTemplate;
		for (var k = 0; k < directives.length; k++) {
			var dir = directives[k];
			var refs = dir.directive.linkFn(elem, dir.attrName, modelRefs);
			if (refs) {
				modelRefs = Object.copy(modelRefs);
				Object.copy(refs, modelRefs);
			}
			isTemplate = isTemplate || dir.directive.isTemplate;
		}
		return {'refs': modelRefs, skip: isTemplate};
	},
	getAllDirectivesWithAttr: function(elem) {
		var attr, k, directives = [];
		var attributes = elem.attributes;
		attributes[-1] = {name: elem.tagName};
		for (k = -1; k < attributes.length; k++) {
			attr = attributes[k];
			if (attr.name.indexOf('.', attr.name.length - 1) > -1) {
				var dirs = $cheeta.directives.get(attr.name);
				for (var i = 0; i < dirs.length; i++) {
					directives.push({directive:dirs[i], attrName: attr.name});
				}
			}
		}
		directives.sort(function (a, b) {
			return (a.directive.order || 1000) - (b.directive.order || 1000);
		});
		return directives;
	},
	doCompile: function () {
		this.recursiveCompile.apply(this, arguments);
		this.runFutures();
	},
	compile: function (elem, modelRefs, runInlineScripts) {
		this.doCompile(elem, modelRefs, runInlineScripts, true);
	},
	compileChildren: function (elem, modelRefs, runInlineScripts) {
		this.doCompile(elem, modelRefs, runInlineScripts, true, true);
	},
	runFutures: function () {
		var runs = $cheeta.future.evals;
		$cheeta.future.evals = [];
		for (var i = 0; i < runs.length; i++) {
			var expr = runs[i];
			if (Object.isFunction(expr)) {
				expr();
			} else {
				eval(expr);
			}
		}
	}
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
	xhr.get = function() {
		return xhr.open.apply(xhr, ['GET'].concat(Array.prototype.slice.call(arguments)));
	};
	xhr.post = function() {
		return xhr.open.apply(xhr, ['POST'].concat(Array.prototype.slice.call(arguments)));
	};
	xhr.put = function() {
		return xhr.open.apply(xhr, ['PUT'].concat(Array.prototype.slice.call(arguments)));
	};
	xhr.delete = function() {
		return xhr.open.apply(xhr, ['DELETE'].concat(Array.prototype.slice.call(arguments)));
	};
	xhr.options = function() {
		return xhr.open.apply(xhr, ['OPTIONS'].concat(Array.prototype.slice.call(arguments)));
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
			return type != null && type.indexOf('application/json') > -1 &&
					xhr.responseText != null && xhr.responseText.length ?
				JSON.parse(xhr.responseText) : xhr.responseText;
		},
		enumerable: true,
		configurable: true
	});

	return xhr;
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
//$cheeta.api = new Service({
//    url: 'api url like http://mysite.com/api/user/{id}/fans',
//    method: 'GET|POST|PUT|DELETE',
$cheeta.api = function (config){
    if ($cheeta.isString(config)) {
        config = {url: config};
    }
    var ResourceClass = function (obj) {
        $cheeta.copy(obj, this);

        var _this = this;

        function callXHR(method, obj, fn, err) {
            _this.$xhr().open(method, _this.$resolveUrl(), config.async || true).send(obj)
                .after(function (x, data) {
                    if (data != null) {
                        $cheeta.copy(data, _this);
                    }
                    fn.call(_this, data);
                }).onError(function (x, data) {
                    if (err) {
                        err.call(_this, x.status, data);
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
            return newXHR ? newXHR() : new $cheeta.XHR();
        };
        this.$create = function (fn, err) {
            callXHR('POST', null, fn, err);
            return this;
        };
        this.$post = function (fn, err) {
            callXHR('POST', this, fn, err);
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
            return ResourceClass.$query(this, dataPath).after(fn).error(err);
        };
    };

    ResourceClass.$query = function (params, dataPath) {
        var resp = [], after, err;
        resp.after = function (fn) {
            after = fn;
            return this;
        };

        resp.error = function (fn) {
            err = fn;
            return this;
        };

        var sample = params || params instanceof ResourceClass ? params : new ResourceClass();

        var isStringDataPath = dataPath && $cheeta.isString(dataPath);

        sample.$xhr().open('GET', $cheeta.url(sample.$resolveUrl(config.url)).params(params).toString(),
            config.async || true).send().after(function (x, data) {
                if (after) {
                    if (dataPath == null) {
                    } else if (isStringDataPath) {
                        var split = dataPath.split('.');
                        for (var j = 0; j < split.length; j++) {
                            data = data[split[j]];
                        }
                    }
                    for (var i = 0; i < data.length; i++) {
                        resp[i] = new ResourceClass(data[i]);
                    }
                    after.call(this, data, resp);
                }
            }).onError(function (x, data) {
                if (err) {
                    err.call(this, x.status, data);
                }
            });
        return resp;
    };

    return ResourceClass;
};
//define interceptor framework to easily add interceptor to any object's method like xhr.send()
$cheeta.directive({
	name: 'watch*',
	link: function(elem, attr) {
		attr.watch(function() {
			eval(elem.attr('onwatch'));
		});
	}
});
$cheeta.directive({
	name: 'value',
	link: function (elem, attr) {
		attr.watch(function (val) {
			if (elem.type && elem.type.toLowerCase() === 'checkbox') {
				elem.checked = val;
			} else if (elem.value !== val) {
				elem.value = val || null;
			}
		});
	}
});
$cheeta.directive({
	name: 'bind',
	order: 800,
	link: function (elem, attr) {
		$cheeta.directives.get('value')[0].link(elem, attr);
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
		function listen (models) {
			elem.on('change keydown keyup', function () {
				for(var i = 0; i < models.length; i++) {
					models[i].setValue(elemValue());
				}
			});
		}
		listen(attr.models());
	}
});
$cheeta.directive({
	name: 'text',
	link: function (elem, attr) {
		attr.watch(function (val) {
			elem.innerHTML = '';
			elem.appendChild(document.createTextNode(val == null ? '' : val));
		});
	}
});
$cheeta.directive({
	name: 'html',
	link: function (elem, attr) {
		attr.watch(function (val) {
			if (val !== elem.innerHTML) {
				elem.innerHTML = val == null ? '' : val;
			}
		});
	}
});

$cheeta.directive({
	name: 'show',
	isTemplate: true,
	link: function (elem, attr, modelRefs) {
		attr.watch(function (val) {
			if (val) {
				elem.style.display = '';
				if (!elem.getAttribute('OoCompiled')) {
					elem.setAttribute('OoCompiled', true);
					$cheeta.compiler.compileChildren(elem, modelRefs);
				}
			} else {
				elem.style.display = 'none';
			}
		});
	}
});

$cheeta.directive({
	name: 'onaction',
	link: function (elem, attr) {
		elem.setAttribute('onclick.onkeydown-space-enter', attr.value);
		attr.remove();
	}
});

$cheeta.directive({
	name: 'init',
	link: function (elem, attr) {
		$cheeta.future.evals.push(attr.eval);
	}
});

$cheeta.directive({
	name: 'focus',
	link: function (elem, attr) {
		attr.watch(function (val) {
			elem.focus(val);
		});
	}
});

$cheeta.directive({
	name: '',
	link: function (elem, attr) {
		attr.watch(function (val) {
			var baseAttrName = attr.key;
			if (val == null) {
				elem.removeAttribute(baseAttrName);
			} else {
				elem.setAttribute(baseAttrName, val);
			}
		});
	}
});

$cheeta.directive({
	name: 'model',
	order: 200,
	link: function (elem, attr, allAttr, modelRefs) {
		//TODO handle app1['myapp,yourapp']
		var modelDef = attr.value.split(/ *, */g);
		var models = {};

		for (var i = 0; i < modelDef.length; i++) {
			//TODO handle app1['123 as 123']
			var split = modelDef[i].split(/ +: +/g);
			var name = split[1] || split[0];
			var as = split.length > 1 ? split[0] : null;
			var model = $cheeta.model(name, modelRefs);
			model.alias(as);
			models[as || model.names[0]] = model;
//			eval(model.ref() + '=' + model.ref() + '|{}');
		}
		return models;
	}
});

// for maps you can do for.="key: Object.keys(obj)"
$cheeta.directive({
	name: 'for',
	isTemplate: true,
	order: 100,
	counter: 0,
	link: function (elem, attr, all, modelRefs) {
		var refElem = document.createComment(elem.outerHTML);
		var array = this.parse(attr.value);
		elem.removeAttr('for.');
		var model = $cheeta.model(array.ref);
		var templateName;
		model.watch(function(val, oldVal) {
			templateName = this.createTemplate(val, elem, array);
			if (Object.isArray(val)) {
				model.child('length').watch(createNewElements);
				val = val.length;
			}
			createNewElements(val, oldVal);
		});
		function createNewElements(val, oldVal) {
			if (val > oldVal) {
				for (var i = oldVal; i < val; i++) {
					var el = new El(templateName).attr('model.', array.index + ':' + i);
					refElem.addBefore(el);
					$cheeta.compiler.compile(el, modelRefs);
				}
			}
		}
	},
	createTemplate: function(val, elem, array) {
		if (Object.isArray(val)) {
			elem.attr('attach.', array.ref + '[' + array.variable + ']');
			elem.attr('model.', array.variable + ':' + array.ref + '[' + array.index + ']');
		} else {
			elem.attr('attach.', array.index + ' > ' + array.ref);
		}
		var templateName = 'O.iterate.tmpl' + this.counter++;
		$cheeta.directive('template.').templates[templateName] = elem.outerHTML;
		return templateName;
	},
	parse : function(val) {
		var split = val.split(/ *: */g);
		var ref = split[1];
		var keys = split[0].split(/ *, */g);
		return {
			ref: ref,
			index: keys.length > 1 ? keys[0] : 'O.iterateIndex',
			variable: keys[keys.length - 1]
		};
	}
});
$cheeta.directive({
	name: 'on*',
	keyconsts: {
		'backspace':8,'tab':9,'enter':13,'shift':16,'ctrl':17,'alt':18,'space':32,'pause':19,'break':19,'capslock':20,'escape':27,'esc':27,'pageup':33,'pagedown':34,'end':35,
		'home':36,'left':37,'up':38,'right':39,'down arrow':40,'insert':45,	'delete':46,'colon':58, 'f1':112,'f2':113,'f3':114,'f4':115,'f5':116,'f6':117,'f7':118,
		'f8':119,'f9':120,'f10':121,'f11':122,'f12':123,'numlock':144,'scrolllock':145,'semicolon':186,'comma':188,'dash':189,'dot':190
	},
	link: function (elem, attr) {
		var split = attr.key.split('-');
		this.bindEvent(elem, attr, split[0], split.slice(1));
	},
	bindEvent: function(elem, attr, event, keys) {
		var listenerFn = function(e) {
			var result = attr.eval({$event: e});
			if (result.preventDefault !== false) {
				e.preventDefault();
			}
			if (result.stopPropagation !== false) {
				e.stopPropagation();
			}
			return Object.isObject(result) ? result.value : result;
		};
		if (event.indexOf('key') === 0) {
			var codes = this.extractKeyCodes(keys);
			if (codes.length) {
				listenerFn = function (e) {
					if (codes.indexOf(e.which) > -1) {
						listenerFn.call(this, e);
					}
				};
			}
		}
		elem.addEventListener(event, listenerFn, false);
	},
	extractKeyCodes: function(keys) {
		var codes = [];
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (key.length === 1) {
				codes[i] = key.charCodeAt(0);
			} else {
				codes[i] = $cheeta.keyconsts[key.toLowerCase()];
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

$cheeta.directive({
    name: 'test',
    link: function(elem, attr, allAttr) {
        elem.addClass('test');
        $cheeta.future(function() {
            var el = elem.previousElementSibling;
            while (el && el.hasClass('test')) {el = el.previousElementSibling;}
            if (el && !attr.eval({$elem: el})) {
                elem.addClass('error');
                elem.attr('style', 'color:red');
                elem.innerHTML = attr.value;
            }
        }, allAttr('delay').modelValue() || 1);
    }
});
$cheeta.directive({
	name: 'view,template',
	order: 900,
	baseURL: window.location.protocol + '//' + window.location.hostname +
			(window.location.port && ':' + window.location.port) + window.location.pathname,
	loadView: function(elem, content, modelRefs) {
		elem.innerHTML = content;
		$cheeta.compiler.compileChildren(elem, modelRefs, true);
	},
	cache: {},
	templates: {},
	loadingElements: {},
	link: function (elem, attr, all, modelRefs) {
		var dir = this;
		attr.watch(function(val) {
			if (!dir.loadingElements[elem] && val != null) {
				// to avoid infinite loop
				dir.loadingElements[elem] = true;
				try {
					var content = dir.templates[val];
					if (content != null) {
						dir.loadView(elem, content, modelRefs);
					} else {
						var url = val.indexOf('/') === 0 ? dir.baseURL + val : val;
						if (dir.cache[url] != null) {
							dir.loadView(elem, dir.cache[url], modelRefs);
						} else {
//						console.log('XHR: ' + url)
							$cheeta.http(this).get(url).send().after(function(data) {
								dir.cache[url] = data;
								dir.loadView(elem, data, modelRefs);
							});
						}
					}
				} finally {
					delete dir.loadingElements[elem];
				}
			}
		});
	}
});
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
			var index = list.indexOf(fn);
			if (index > -1) {
				list.splice(index, 1);
			}
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