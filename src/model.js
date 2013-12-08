var $cheeta = {};
window['$cheeta'] = $cheeta;

$cheeta.model = {
	Model: function(parent, name) {
		this.value = undefined;
		this.bindings = {};
		this.parent = parent;
		this.name = name;
		this.children = {};
	},
	ArrayInterceptor: function(model) {
		var model = model;
		return {
			push: function() {
				var len = this.length;
				var result = Array.prototype.push.apply(this, arguments);
				var newLen = this.length;
				$cheeta.model.update(model, newLen, len);
				for (var i = len; i < newLen; i++) {
					model.children[i].value = this[i];
					$cheeta.model.interceptProp(model.children[i], this, i);
				}
				return result;
			},
			pop: function() {
				var len = this.length;
				var result = Array.prototype.pop.apply(this, arguments);
				var newLen = this.length;
				$cheeta.model.update(model, newLen, len);
				return result;
			},
			shift: function() {
				var len = this.length;
				var result = Array.prototype.shift.apply(this, arguments);
				model.parent.value[model.name] = this;
				var newLen = this.length;
				$cheeta.model.update(model, newLen, len);
				return result;
			},
			unshift: function() {
				var len = this.length;
				var result = Array.prototype.unshift.apply(this, arguments);
				model.parent.value[model.name] = this;
				var newLen = this.length;
				$cheeta.model.update(model, newLen, len);
				return result;
			},
			splice: function(index, howmany) {
				var len = this.length;
				var result = Array.prototype.splice.apply(this, arguments);
				var newLen = this.length;
				$cheeta.model.update(model, newLen, len);
				for (var i = len; i < newLen; i++) {
					model.children[i].value = this[i];
					$cheeta.model.interceptProp(model.children[i], this, i);
				}
				return result;
			}
		}
	},
	interceptArray: function(model) {
		var interceptor = new this.ArrayInterceptor(model);
		for (var key in interceptor) {
			if (model.value[key] == interceptor[key]) {
				break;
			}
			model.value[key] = interceptor[key];
		}
	},
	update: function(model, val, oldVal) {
		for (var name in model.bindings) {
			var bindings = model.bindings[name];
			for (var i = 0; i < bindings.length; i++) {
				var binding = bindings[i];
				if (binding.update) {
					binding.update(val, oldVal);
				}
			}
		}
	},
	bindElement: function(parent, name, binding, isFn) {
//		console.log('bind element: ', parent, name, binding);
		var model = parent.children[name];
		if (model === undefined) {
			model = new $cheeta.model.Model();
			model.name = name;
			model.parent = parent;
			if (isFn) {
				return model;
			}
			if (parent === this.root) {
				if (window[name] !== undefined) {
					parent.children[name] = undefined;
					return null;
				}
				this.interceptProp(model, window, name);
			}
			parent.children[name] = model;
		}
		if (binding != null) {
			var bindName = binding.as || name;
			if (model.bindings[bindName] == null) {
				model.bindings[bindName] = [];
			}
			model.bindings[bindName].push(binding);
		}
		return model;
	},
	interceptProp: function(model, value, name) {
		console.log('intercepting: ', value, name);
		if (value != null) {
			//model.value = value[name];
			Object.defineProperty(value, name, {
		        set: function(val) {
		        	var prevVal = model.value;
		        	if (prevVal != val) {
		        		model.value = val;
		        		if (model.__isArray) {
		        			$cheeta.model.interceptArray(model);
		        		}
		        	}
	        		$cheeta.model.update(model, val, prevVal);
		        	if (val instanceof Object) {
						for (var key in model.children) {
							var origVal = val[key];
							$cheeta.model.interceptProp(model.children[key], val, key);
							val[key] = origVal;
						}
		        	}
				}, 
				get: function() {
		        	return model.value;
				},
				enumerable: true,
				configurable: true
			});
		}
	},
	toExpr: function(model) {
		var expr = '';
		while (model.parent != null && model.name != null) {
			var ch = model.name.charAt(0);
			expr = (ch >= '0' &&  ch <= '9' ? '[' + model.name + ']' : '.' + model.name) + expr;
			model = model.parent;
		}
		
		return expr.substring(1);
	},
	bind: function(parentModels, name, binding, isFn) {
		console.log('binding: ', name, binding);
		if (name.charAt(0) === '.') {
			// bind dot-starting to the first parent
			for (key in parentModels[0].bindings) {
				name = key + name;
				break;
			}
		}
		if (parentModels == null) {
			parentModels = [$cheeta.model.root];
		}
		var split = name.split(/\./g);
		name = split[split.length - 1];
		var rootName = split[0];
		var parentModel = $cheeta.model.root;
		for (var j = 0; j < parentModels.length; j++) {
			parentModel = parentModels[j];
			parentModel = (function findParentModel(model, rootName) {
				while (model != $cheeta.model.root) {
					if (rootName == model.name || model.bindings[rootName] != null) {
						return model;
					}
					model = model.parent;
				}
				return model;
			})(parentModel, rootName);
			
			if (parentModel != $cheeta.model.root) {
				break;
			}
		}
		if (split.length == 1 && parentModel !== $cheeta.model.root) {
			name = parentModel.name;
			parentModel = parentModel.parent;
		} else {
			for (var i = parentModel === $cheeta.model.root ? 0 : 1; i < split.length - 1; i++) {
				if (parentModel.children[split[i]] == null) {
					if (this.bindElement(parentModel, split[i], binding == null ? null : {
							elem: binding.elem, 
							attr: 'bind'
						}) == null) {
						return null;
					}
				}
				parentModel = parentModel.children[split[i]];
			}
		}
		return this.bindElement(parentModel, name, binding, isFn);
	}
};

$cheeta.model.root = new $cheeta.model.Model(null);
$cheeta.model.root.value = window;

$cheeta.onload = function() {
	$cheeta.compiler.compile();
	$cheeta.location.init();
};

$cheeta.init = function() {
}

$cheeta.on = function(events, elem, fn) {
	var split = events.split(' ');
	for (var i = 0; i < split.length; i++) {
		if (split[i].length > 0) {
			elem.addEventListener(split[i], fn, false);
		}
	}
}

window.addEventListener('load', $cheeta.onload, false);