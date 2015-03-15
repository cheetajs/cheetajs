/*jshint -W020 */
window.$cheeta = window.Oo = {};

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
		var names = [];
		var model = this;
		while (model.parent != null && model.names[0] != null) {
			names.push(model.hasSpecialChar ? '[\'' + model.names[0] + '\']' : '.' + model.names[0]);
			model = model.parent;
		}
		var val = window;
		for (var i = names.length - 1; i >= 0; i--) {
			if (val == null) {
				break;
			}
			val = val[names[i]];
		}
		return val === null && i > 0 ? undefined : val;
	};
	this.setValue = function (value) {
		var val = window;
		for (var i = names.length - 2; i >= 0; i--) {
			if (val == null) {
				break;
			}
			val = val[names[i]];
		}
		if (val) val[names[i]] = value;
	};
	this.child = function (name, hasSpecialChar) {
		if (this.value == null) {
			this.value = this.isArray ? [] : {};
		}
		var model = this.children[name];
		if (model === undefined) {
			model = new $cheeta.model.Model(this, name);
			$cheeta.model.interceptProp(model, this.value, name);
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
		dispatchEvent(new CustomEvent('Oo-model-change-' + this.ref(),
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
	};
	this.interceptProp = function(value, name) {
		if (value != null) {
			var model = this;
			var beforeValue = value[name];
			var isCheetaIntercepted = model.parent.children && model.parent.children[name] != null;
			// avoid infinite loop to redefine prop
			var prevProp = isCheetaIntercepted ? null : Object.getOwnPropertyDescriptor(value, name);
			try {
				Object.defineProperty(value, name, {
					set: function(val) {
						if (prevProp && prevProp.set) {
							prevProp.set.apply(value, arguments);
						}
						val = (prevProp && prevProp.get && prevProp.get.apply(value)) || val;
						var prevVal = model.value;
						if (prevVal !== val) {
							model.value = val;
							if (model.isArray) {
								$cheeta.model.interceptArray(model);
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
										$cheeta.model.interceptProp(model.children[key], val, key);
										val[key] = origVal;
									}
								}
							}
						}
					},
					get: function() {
						return (prevProp && prevProp.get && prevProp.get.apply(value)) || model.value;
					},
					enumerable: true,
					configurable: true
				});
			} catch(e) {
				if (!(e instanceof TypeError)) {
					throw e;
				}
				return;
			}
			value[name] = beforeValue;
		}
	};
	this.addDirective = function (directive) {
		if (this.directives == null) {
			this.directives = {};
		}
		this.directives[directive.name] = directive;
		if (directive.isGlobal()) {
			if (this.directives['/'] == null) {
				this.directives['/'] = [];
			}
			this.directives['/'].push(directive.name.length - 1);
		}

	};
	this.getDirective = function (name) {
		return this.directives == null ? null : this.directives[name];
	};
};
$cheeta.model = function(name, modelRefs) {
	function findParentModel(model, rootName) {
		while (model !== $cheeta.model.root) {
			if (model.names.indexOf(rootName) > -1) {
				return model;
			}
			model = model.parent;
		}
		return model;
	}

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
	return {
		push: function () {
			var len = this.length;
			var result = Array.prototype.push.apply(this, arguments);
			var newLen = this.length;
			model.valueChange(newLen, len);
			return result;
		},
		pop: function () {
			var len = this.length;
			var result = Array.prototype.pop.apply(this, arguments);
			var newLen = this.length;
			model.valueChange(newLen, len);
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
			model.valueChange(newLen, len);
			return result;
		}
	}
};

$cheeta.refresh = function(modelRef) {
	var model = $cheeta.model.createOrGetModel(null, modelRef);
	model.valueChange(model.getValue(), null);
};

$cheeta.model.root = $cheeta.model.root || new $cheeta.model.Model(null);
$cheeta.model.root.value = window;
$cheeta.root = $cheeta.model.root;

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

$cheeta.future = function(future) {
	$cheeta.future.evals.push([future]);
};
$cheeta.future.evals = $cheeta.future.evals || [];

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

$cheeta.copy = function(from, to, full) {
	for (var key in from) {
		if (full === true || ($cheeta.isFunction(full) && full(key, from[key]))) {
			to[key] = from[key];
		} else if (!$cheeta.isFunction(from[key])) {
			to[key] = from[key];
		}
	}
};


window.addEventListener('load', function() {
	if (!$cheeta.isInitialized) {
		$cheeta.isInitialized = true;
		$cheeta.hash.init();
		$cheeta.compiler.compile([$cheeta.model.root], document.documentElement);
	}
}, false);