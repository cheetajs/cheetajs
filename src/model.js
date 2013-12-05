var $cheeta = {};
window['$cheeta'] = $cheeta;

$cheeta.model = {
	Model: function(parent, name) {
		this.__value = undefined;
		this.__bindings = {};
		this.__parent = parent;
		this.__name = name;
	},
	ArrayInterceptor: function() {
		var origPush = [].push;
		var origPop = [].pop;
		var origSplice = [].splice;
		var update = function(array, newLen, len) {
			for (var i = 0; i < array.__cheetaUpdateInterceptors_.length; i++) {
				array.__cheetaUpdateInterceptors_[i].apply(array, [newLen, len]);
			}
		};
		return {
			push: function() {
				this.updates = [];
				var u = [];
				var len = this.length;
				var result = origPush.apply(this, arguments);
				var newLen = this.length;
				update(this, newLen, len);
				for (var i = len; i < newLen; i++) {
					this[i] = this.__value[i];
				}
				return result;
			},
			pop: function() {
				var len = this.length;
				var result = origPop.apply(this, arguments);
				var newLen = this.length;
				update(this, newLen, len);
				return result;
			},
			splice: function() {
				var len = this.length;
				var result = origSplice.apply(this, arguments);
				var newLen = this.length;
				update(this, newLen, len);
				for (var i = 0; i < this.length; i++) {
					if (this[i] != this.__value[i])
					this[i] = this[i];
				}
				return result;
			}, 
			__cheetaUpdateInterceptors_: []
			//TODO splice with the same length
		}
	},
	interceptArray: function(array, update) {
		if (!array.__cheetaUpdateInterceptors_) {
			interceptor = new this.ArrayInterceptor();
			for (var key in interceptor) {
				array[key] = interceptor[key];
			}
		}
		array.__cheetaUpdateInterceptors_.push(update);
		return array;
	},
	update: function(model, val, oldVal) {
		for (var name in model.__bindings) {
			var bindings = model.__bindings[name];
			for (var i = 0; i < bindings.length; i++) {
				var binding = bindings[i];
				if (binding.update) {
					binding.update(val, oldVal);
				}
			}
		}
	},
	deleteChild: function(model) {
		for (var name in model.__bindings) {
			var bindings = model.__bindings[name];
			for (var i = 0; i < bindings.length; i++) {
				var binding = bindings[i];			
				this.elem.parentNode.removeChild(this.elem);
			}
		}
		delete this.__parent.__children[i];  
		delete this.__parent[i]; 
	},
	bindElement: function(parent, name, binding) {
		console.log('bind element: ', parent, name, binding);
		if (parent[name] === undefined) {
			parent[name] = new $cheeta.model.Model();
			if (parent === this.root) {
				if (window[name] !== undefined) {
					parent[name] = undefined;
					return null;
				}
				this.interceptProp(parent[name], window, name);
			}
		}
		var model = parent[name];
		var bindName = binding.as || name;
		if (model.__bindings[bindName] == null) {
			model.__bindings[bindName] = [];
		}
		model.__bindings[bindName].push(binding);
		model.__name = name;
		model.__parent = parent;
		return model;
	},
	interceptProp: function(model, value, name) {
		console.log('intercepting: ', value, name);
		if (value != null) {
			//model.__value = value[name];
			Object.defineProperty(value, name, {
		        set: function(val) {
		        	var prevVal = model.__value;
		        	if (prevVal != val) {
		        		model.__value = val;
		        	}
	        		$cheeta.model.update(model, val, prevVal);
		        	if (val instanceof Object) {
						for (var key in val) {
							if (model[key] != null) {
								var origVal = val[key];
								$cheeta.model.interceptProp(model[key], val, key);
								val[key] = origVal;
							}
						}
		        	}
				}, 
				get: function() {
		        	return model.__value;
				},
				enumerable: true,
				configurable: true
			});
		}
	},
	toExpr: function(model) {
		var expr = '';
		while (model.__parent != null && model.__name != null) {
			var ch = model.__name.charAt(0);
			expr = (ch >= '0' &&  ch <= '9' ? '[' + model.__name + ']' : '.' + model.__name) + expr;
			model = model.__parent;
		}
		
		return expr.substring(1);
	},
	bind: function(parentModels, name, binding) {
		console.log('binding: ', name, binding);
		if (name.charAt(0) === '.') {
			// bind dot-starting to the first parent
			for (key in parentModels[0].__bindings) {
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
					if (rootName == model.__name || model.__bindings[rootName] != null) {
						return model;
					}
					model = model.__parent;
				}
				return model;
			})(parentModel, rootName);
			
			if (parentModel != $cheeta.model.root) {
				break;
			}
		}
		if (split.length == 1 && parentModel !== $cheeta.model.root) {
			name = parentModel.__name;
			parentModel = parentModel.__parent;
		} else {
			for (var i = parentModel === $cheeta.model.root ? 0 : 1; i < split.length - 1; i++) {
				if (parentModel[split[i]] == null) {
					if (this.bindElement(parentModel, split[i], binding == null ? null : {
							elem: binding.elem, 
							attr: 'bind'
						}) == null) {
						return null;
					}
				}
				parentModel = parentModel[split[i]];
			}
		}
		return this.bindElement(parentModel, name, binding);
	}
};

$cheeta.model.root = new $cheeta.model.Model(null);
$cheeta.model.root.__value = window;

$cheeta.onload = function() {
	$cheeta.compiler.compile();
	$cheeta.location.init();
};

$cheeta.init = function() {
	
}

window.addEventListener('load', $cheeta.onload, false);