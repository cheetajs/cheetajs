var $cheeta = {};
window['$cheeta'] = $cheeta;

$cheeta.Model = function(parent, name) {
	return {
		__children: {},
		__value: null,
		__bindings: {},
		__parent: parent,
		__update: function() {
			if (!this.__hasChildren()) {
				this.__forEachElem(function(elem) {
					if (elem.tagName === 'INPUT') {
						elem.value = this.__value || null; 
					} else {
						elem.innerHTML = this.__value || null;
					}						
				});
			}
		},
		__forEachElem: function(fn) {
			for (var name in this.__bindings) {
				var elems = this.__bindings[name];
				for (var i = 0; i < elems.length; i++) {
					var elem = elems[i];
					fn.apply(this, [elem]);
				}
			}
		},
		__hasChildren: function() {
			for (var key in this.__children) {
				return true;
			}
			return false;
		},
		__bindElement: function(elem, modelName, as, isArray) {
			var model = this.__children[modelName];
			if (model == null) {
				model = isArray ? new $cheeta.ArrayModel(this, name) : new $cheeta.Model(this, name);
				if (isArray) {
					elem.style.display = 'none';
				}
				this.__children[modelName] = model;
			}
			if (model.__bindings[as || modelName] == null) {
				model.__bindings[as || modelName] = [];
			}
			model.__bindings[as || modelName].push(elem);
			if (this[modelName] === undefined) {
				if (this.__parent == null) {
					window[modelName] = model;
				}
				Object.defineProperty(this, modelName, {
					get length() {
						return this.__value.length;
			        },
			        set: function(val) {
			        	var m = this.__children[modelName];
		        		if (!(val instanceof Object) && m.__hasChildren() && val != null) {
		        			throw 'Cannot set primitive value for model ' + modelName;
		        		}
			        	m.__value = val;
			        	m.__update();
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
		get length() {
			return this.__value == null ? 0 : this.__value.length;
		},
		get __childrenLength() {
			var i = 0;
			for (var key in this.__children) {
				i++;
			}
			return i;
		}
	}
};

$cheeta.ArrayModel = function(parent, name) {
	var arrayModel = {
		__update: function() {
			if (this.__childrenLength > this.length) {
				for (var i = this.__childrenLength - 1; i >= this.length; i--) {
					this.__children[i].__forEachElem(function(elem) {
						elem.parentNode.removeChild(elem);
						delete this.__parent.__children[i];
						delete this.__parent[i];
					});
				}
			} else if (this.__childrenLength < this.length) {
				for (var i = this.__childrenLength; i < this.length; i++) {
					this.__forEachElem(function(elem) {
						var clone = elem.cloneNode();
						var directive = $cheeta.compiler.findDirective(elem, 'bind');
						clone.removeAttribute('bind.');
						clone.removeAttribute('data-bind.');
						var split = directive.split(/ +in +/g);
						clone.setAttribute('bind.', split[1] + '.' + i + ' as ' + split[0]);
						clone.style.display = '';
						elem.parentNode.insertBefore(clone, elem);
						$cheeta.compiler.recursiveCompile(this.__parentModels, clone, true);
						
					});
				}
			}
		},
		push: function() {
			var len = this.__value.length;
			this.__value.push.apply(this.__value, arguments);
			this.__update();
			var newLen = this.__value.length;
			for (var i = len; i < newLen; i++) {
				this[i] = this.__value[i];
			}
		},
		pop: function() {
			this.__value.pop.apply(this.__value, arguments);
			this.__update();
		},
		splice: function() {
			this.__value.splice.apply(this.__value, arguments);
			this.__update();
			for (var i = 0; i < this.__value.length; i++) {
				if (this[i] != this.__value[i])
				this[i] = this.__value[i];
			}
		}
	}
	
	var model = new $cheeta.Model(parent, name);
	for (var key in arrayModel) {
		model[key] = arrayModel[key];
	}		
	return model;
};

$cheeta.rootModel = new $cheeta.Model(null, "ROOT");

$cheeta.directives = [];

$cheeta.onload = function() {
	$cheeta.compiler.compile();
	$cheeta.location.init();
};

window.addEventListener('load', $cheeta.onload, false);