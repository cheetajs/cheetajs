if (!$cheeta) {
	var $cheeta = $cheeta || function(elem) {
		var wrap = [elem];
		wrap.on = function(events, fn) {
			var split = events.split(' ');
			for (var i = 0; i < split.length; i++) {
				if (split[i].length > 0) {
					elem.addEventListener(split[i], fn, false);
				}
			}
		};
		wrap.off = function(events, fn) {
			var split = events.split(' ');
			for (var i = 0; i < split.length; i++) {
				if (split[i].length > 0) {
					elem.removeEventListener(split[i], fn, false);
				}
			}
		};
		return wrap;
	};
	window['$cheeta'] = window['Oo'] = $cheeta;
}

$cheeta.model = $cheeta.model || {
	Model: function(parent, name) {
		this.value = undefined;
		this.listeners = [];
		this.parent = parent;
		this.names = [name];
		this.children = {};
		this.toExpr = function() {
			var expr = '';
			var model = this;
			while (model.parent != null && model.names[0] != null) {
				var ch = model.names[0].charAt(0);
				expr = (ch >= '0' &&  ch <= '9' ? '[' + model.names[0] + ']' : '.' + model.names[0]) + expr;
				model = model.parent;
			}
			
			return expr.substring(1);
		};
		this.createOrGetChild = function(name) {
			var model = this.children[name];
			if (model === undefined) {
				model = new $cheeta.model.Model(this, name);
				$cheeta.model.interceptProp(model, this.value, name);
				this.children[name] = model;
				model.value = this.value == null ? undefined : this.value[name];
			}
			if (this.value == null) {
				this.value = this.isArray ? [] : {};
			}
			return model;
		};
		this.alias = function(alias) {
			if (alias != null && alias != this.names[0]) {
				this.names.push(alias);
			}			
		};
		this.addChangeListener = function(onChange, target) {
			if (onChange) {
				var fn = function() {
					onChange.apply(target, arguments);
				};
				this.listeners.push(fn);
				if (this.value != null) {
					$cheeta.future.evals.push(fn);
				}
			}
			return onChange;
		};
		this.removeChangeListener = function(onChange) {
			var index = this.listeners.indexOf(onChange);
			if (index > -1) {
				return this.listeners.splice(index, 1);
			}
			return null;
		};
		this.valueChange = function(val, oldVal) {
			if (val != oldVal) {
				for (var i = 0; i < this.listeners.length; i++) {
					this.listeners[i](val, oldVal);
				}
			}
			return this;
		};
		this.addDirective = function(directive) {
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
		this.getDirective = function(name) {
			return this.directives == null ? null : this.directives[name];
		}; 
	},
	ArrayInterceptor: function(model) {
		return {
			push: function() {
				var len = this.length;
				var result = Array.prototype.push.apply(this, arguments);
				var newLen = this.length;
				model.valueChange(newLen, len);
				return result;
			},
			pop: function() {
				var len = this.length;
				var result = Array.prototype.pop.apply(this, arguments);
				var newLen = this.length;
				model.valueChange(newLen, len);
				return result;
			},
			shift: function() {
				return this.splice(0, 1)[0];
			},
			unshift: function() {
				var args = [].slice.apply(arguments);
				args.unshift(0, 0);
				this.splice.apply(this, args);
				return this.length;
			},
			splice: function(index, howmany) {
				var len = this.length;
				var result = Array.prototype.splice.apply(this, arguments);
				var newLen = this.length;
				model.valueChange(newLen, len);
				return result;
			}
		};
	},
	interceptArray: function(model) {
		if (model.value != null) {
			var interceptor = new this.ArrayInterceptor(model);
			for (var key in interceptor) {
				if (model.value[key] == interceptor[key]) {
					break;
				}
				model.value[key] = interceptor[key];
			}
		}
	},
	interceptProp: function(model, value, name) {
		console.log('intercepting: ', value, name);
		if (value != null) {
			var beforeValue = value[name];
			var isCheetaIntercepted = model.parent.children && model.parent.children[name] != null; 
			var prevProp = isCheetaIntercepted ? null : Object.getOwnPropertyDescriptor(value, name);
			try {
				Object.defineProperty(value, name, {
			        set: function(val) {
			        	if (prevProp && prevProp.set) {
			        		prevProp.set.apply(value, arguments);
			        	}
			        	val = (prevProp && prevProp.get && prevProp.get.apply(value)) || val;
			        	var prevVal = model.value;
			        	if (prevVal != val) {
			        		model.value = val;
			        		if (model.isArray) {
			        			$cheeta.model.interceptArray(model);
			        		}
				        	model.valueChange(val, prevVal);
				        	if (val instanceof Object) {
								for (var key in model.children) {
									var origVal = val[key];
									$cheeta.model.interceptProp(model.children[key], val, key);
									val[key] = origVal;
								}
				        	}
			        	}
					}, 
					get: function() {
						return (prevProp && prevProp.get && prevProp.get.apply(value)) || model.value;
					},
					enumerable: true,
					configurable: true,
				});
			} catch(e) { 
				if (!(e instanceof TypeError)) throw e;
				return;
			}
			value[name] = beforeValue;
		}
	},
	findParentModel: function(model, rootName) {
		while (model != $cheeta.model.root) {
			if (model.names.indexOf(rootName) > -1) {
				return model;
			}
			model = model.parent;
		}
		return model;
	},
	get: function(ref) {
		return this.createOrGetModel(null, ref); 
	},
	createOrGetModel: function(parentModels, name) {
		if (name == null) {
			return $cheeta.model.root;
		}
		if (parentModels == null) {
			parentModels = [$cheeta.model.root];
		}
		if (name === '$i') {
			for (var i = parentModels.length - 1; i >= 0; i--) {
				if (parentModels[i].names[0] == '$i') {
					return parentModels[i];
				}
			}
		}		
		if (name.charAt(0) === '.') {
			// bind dot-starting to the first parent
			name = parentModels[0].names[0] + name;
		}
		
		var split = name.split(/\./g);
		name = split[split.length - 1];
		var rootName = split[0];
		var parentModel = $cheeta.model.root;
		for (var j = 0; j < parentModels.length; j++) {
			parentModel = parentModels[j];
			parentModel = this.findParentModel(parentModel, rootName);
			if (parentModel != $cheeta.model.root) {
				break;
			}
		}
		if (split.length == 1 && parentModel !== $cheeta.model.root) {
			name = parentModel.names[0];
			parentModel = parentModel.parent;
		} else {
			for (var i = parentModel === $cheeta.model.root ? 0 : 1; i < split.length - 1; i++) {
				parentModel = parentModel.children[split[i]] || parentModel.createOrGetChild(split[i]);
			}
		}
		return parentModel.createOrGetChild(name);
	}
};

$cheeta.model.root = $cheeta.model.root || new $cheeta.model.Model(null);
$cheeta.model.root.value = window;
$cheeta.root = $cheeta.model.root;

window.addEventListener('load', function() {
	if (!$cheeta.isInitialized) {
		$cheeta.isInitialized = true;
		$cheeta.future = {evals: [{}]};
		$cheeta.hash.init();
		$cheeta.compiler.compile([$cheeta.model.root], document.documentElement);
	}
}, false);