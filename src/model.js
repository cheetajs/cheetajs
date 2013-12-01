var $cheeta = {};
window['$cheeta'] = $cheeta;

$cheeta.model = { 
	Model: function(parent, name) {
		return {
			__children: {},
			__value: undefined,
			__bindings: {},
			__name: name,
			__parent: parent,
			get length() {
				return this.__value == null ? 0 : this.__value.length;
			},
		};
	},
	arrayModel: {
		push: function() {
			var len = this.__value.length;
			this.__value.push.apply(this.__value, arguments);
			var newLen = this.__value.length;
			$cheeta.model.update(this, len, newLen);
			for (var i = len; i < newLen; i++) {
				this[i] = this.__value[i];
			}
		},
		pop: function() {
			var len = this.__value.length;
			this.__value.pop.apply(this.__value, arguments);
			var newLen = this.__value.length;
			$cheeta.model.update(this, len, newLen);
		},
		splice: function() {
			var len = this.__value.length;
			this.__value.splice.apply(this.__value, arguments);
			var newLen = this.__value.length;
			$cheeta.model.update(this, len, newLen);
			for (var i = 0; i < this.__value.length; i++) {
				if (this[i] != this.__value[i])
				this[i] = this.__value[i];
			}
		}
	},
	extendArray: function(model) {
		for (var key in this.arrayModel) {
			model[key] = this.arrayModel[key];
		}
		return model;
	},
	update: function(model, val, oldVal) {
		for (var name in model.__bindings) {
			var bindings = model.__bindings[name];
			for (var i = 0; i < bindings.length; i++) {
				var binding = bindings[i];
				binding.update(val, oldVal);
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
	hasChildren: function(model) {
		for (var key in model.__children) {
			return true || key;
		}
		return false;
	},
	bindElement: function(parent, modelName, binding) {
		var model = parent.__children[modelName];
		if (model == null) {
			model = new this.Model(parent, modelName);
			parent.__children[modelName] = model;
		}
		if (binding != null) {
			var bindName = binding.as || modelName;
			if (model.__bindings[bindName] == null) {
				model.__bindings[bindName] = [];
			}
			model.__bindings[bindName].push(binding);
		}
		if (parent[modelName] === undefined) {
			if (parent.__parent == null) {
				window[modelName] = model;
			}
			Object.defineProperty(parent, modelName, {
				get length() {
					return this.__children[modelName].__value.length;
		        },
		        set: function(val) {
		        	var m = this.__children[modelName];
	        		if (!(val instanceof Object) && $cheeta.model.hasChildren(m) && val != null) {
	        			throw 'Cannot set primitive value for model ' + modelName;
	        		}
	        		var prevVal = m.__value;
	        		m.__value = val;
	        		$cheeta.model.update(m, val, prevVal);
		        	if (val instanceof Object) {
						for (var key in val) {
							m[key] = val[key];
						}
		        	}
				}, 
				get: function() {
		        	var m = this.__children[modelName];
		        	if (m.__value == null || m.__value instanceof Object) {
		        		return m;
		        	} else {
		        		return m.__value;
		        	}
				},
				enumerable: true,
				configurable: true
			});
		}
		return model;
	},
	toExpr: function(model) {
		var expr = '.' + model.__name, m = model.__parent;
		while (m.__parent != null && m.__name != null) {
			expr = (m.__name.charAt(0) >= '0' && m.__name.charAt(0) <= '9'? '[' + m.__name + ']' : '.' + m.__name) + expr;
			m = m.__parent;
		}
		
		return expr.substring(1);
	},
	bind: function(parentModels, name, binding) {
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
		for (var i = parentModel == $cheeta.model.root ? 0 : 1; i < split.length - 1; i++) {
			if (parentModel[split[i]] == null) {
				this.bindElement(parentModel, split[i], binding == null ? null : {
					elem: binding.elem, 
					attr: 'bind'
				})
			}
			parentModel = parentModel[split[i]];
		}
		return this.bindElement(parentModel, name, binding);
	}
};

$cheeta.model.root = new $cheeta.model.Model(null, "ROOT");


$cheeta.directives = [];

$cheeta.onload = function() {
	$cheeta.compiler.compile();
	$cheeta.location.init();
};

window.addEventListener('load', $cheeta.onload, false);