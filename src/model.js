var $cheeta = {};
window['$cheeta'] = $cheeta;

$cheeta.model = { 
	Model: function(parent, name) {
		return {
			__children: {},
			__value: null,
			__bindings: {},
			__name: name,
			__parent: parent,
			get length() {
				return this.__value == null ? 0 : this.__value.length;
			},
		};
	},
	ArrayModel: function(parent, name) {
		var arrayModel = {
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
		};
		
		var model = new $cheeta.Model(parent, name);
		for (var key in arrayModel) {
			model[key] = arrayModel[key];
		}
		return model;
	},
	forEachBinding: function(model, fn) {
		for (var name in model.__bindings) {
			var props = model.__bindings[name];
			for (var i = 0; i < props.length; i++) {
				var prop = props[i];
				fn.apply(model, [prop]);
			}
		}
	},
	hasChildren: function(model) {
		for (var key in model.__children) {
			return true || key;
		}
		return false;
	},
	bindElement: function(parent, elem, attr, modelName, as, isArray) {
		var model = parent.__children[modelName];
		if (model == null) {
			model = isArray ? new this.ArrayModel(parent, name) : new this.Model(parent, name);
			if (isArray) {
				elem.style.display = 'none';
			}
			parent.__children[modelName] = model;
			model.__name = modelName;
		}
		if (model.__bindings[as || modelName] == null) {
			model.__bindings[as || modelName] = [];
		}
		model.__bindings[as || modelName].push({elem: elem, attr: attr});
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
	        		if (!(val instanceof Object) && m.__hasChildren() && val != null) {
	        			throw 'Cannot set primitive value for model ' + modelName;
	        		}
		        	if (isArray) {
		        		var prevLen = m.__value.length;
		        		m.__value = val;
		        		var newLen = m.__value.length;
		        		$cheeta.model.updateArray(m, prevLen, newLen);
		        	} else {
		        		m.__value = val;
		        		$cheeta.model.update(m);
		        	}
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
		var expr = model.name, m = model.__parent;
		while (m != null && m.name != null) {
			expr = name + '.' + expr;
			m = m.__parent;
		}
		return expr;
	},
	bind: function(parentModels, name, prop) {
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
					for (var key in model.__bindings) {
						if (key == rootName) {
							return model;
						}
					}
					model = model.__parent;
				}
				return model;
			})(parentModel, rootName);
			
			if (parentModel != $cheeta.model.root) {
				break;
			}
		}
		var cloneProp = prop.clone();
		cloneProp.attr = 'bind';
		cloneProp.update = undefined;
		for (var i = parentModel == $cheeta.model.root ? 0 : 1; i < split.length - 1; i++) {
			if (parentModel[split[i]] == null) {
				this.bindElement(parentModel, split[i], {
					elem: prop.elem, 
					attr: 'bind');
				}
			}
			parentModel = parentModel[split[i]];
		}
		this.bindElement(parentModel, name, prop);
		if (isArray) {
			prop.__parentModels = [parentModel].concat(parentModels);
		}
		return parentModel.__children[name];
	}
};

$cheeta.model.root = new $cheeta.model.Model(null, "ROOT");


$cheeta.directives = [];

$cheeta.onload = function() {
	$cheeta.compiler.compile();
	$cheeta.location.init();
};

window.addEventListener('load', $cheeta.onload, false);