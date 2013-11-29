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
	forEachElem: function(model, fn) {
		for (var name in model.__bindings) {
			var elems = model.__bindings[name];
			for (var i = 0; i < elems.length; i++) {
				var elem = elems[i].elem;
				fn.apply(model, [elem]);
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
	bind: function(parentModels, name, elem, attr, isArray) {
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
		for (var i = parentModel == $cheeta.model.root ? 0 : 1; i < split.length - 1; i++) {
			if (parentModel[split[i]] == null) {
				this.bindElement(parentModel, elem, '', split[i]);
			}
			parentModel = parentModel[split[i]];
		}
		parentModel.__bindElement(elem, attr, name, as, isArray);
		if (isArray) {
			parentModel.__children[name].__parentModels = [parentModel].concat(parentModels);
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
$cheeta.compiler = {
	recursiveCompile: function(parentModels, node, skipSiblings) {
		if (node) {
			var models = parentModels;
			if (node.nodeType === 1) {
				models = this.compileDirectives(parentModels, node);
			}
			this.recursiveCompile(models, node.firstChild);
			if (!skipSiblings) {
				this.recursiveCompile(parentModels, node.nextSibling);
			}
		}
	},
	findDirective: function(elem, directive) {
		return elem.getAttribute(directive + '.') || elem.getAttribute('data-' + directive + '.');
	},
	compileDirectives: function(parentModels, elem) {
		for (var k = 0; k < elem.attributes.length; k++) {
			var attr = elem.attributes[k];
			if (attr.specified) {
				if (attr.name.indexOf('.', attr.name.length - 1) !== -1) {
					var attrName = attr.name.substring(0, attr.name.length - 1);
					if (attrName.indexOf('data-') == 0) {
						attrName = attrName.substring('data-'.length);
					}
					var directive = $cheeta.directives[attrName] || $cheeta.directives[''];
					parentModels = (directive(attr.value, elem, parentModels) || []).concat(parentModels);
				}
			}
		}
		return parentModels;
	},
	compile: function() {
		scripts = document.getElementsByTagName('script');
		for (var i = 0; i < scripts.length; i++) {
			var script = scripts[i];
			if (script.getAttribute('type') === 'text/cj-template') {
				$cheeta.templates[script.getAttribute('id')] = script.innerHTML;
			}
		}
		var root = document.documentElement;
		this.recursiveCompile([], root);
		for (var i = 0; i < $cheeta.futureEvals.length; i++) {
			eval($cheeta.futureEvals[i]);
		}
	}
};

$cheeta.onload = function() {
	$cheeta.compiler.compile();
	$cheeta.location.init();
};

window.addEventListener('load', $cheeta.onload, false);
$cheeta.location = {
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
		this.watchers[key].push(fn);
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
		if (val == undefined) {
			val = key;
			key = '';
		}
		var oldVal = this.keyval[key]; 
		this.keyval[key] = val;
		window.location.hash = this.toHash();
		this.notify(key, val, oldVal);
	},
	toHash: function() {
		var hash = this.keyval[''] || '';
		for (var key in this.keyval) {
			if (key.length > 0) {
				hash += (hash.length > 0 ? '&' : '') + key + "=" + this.keyval[key];
			}
		}
		return hash;
	},
	init: function() {
		var loc = this;
		window.addEventListener('hashchange', function () {
			var hash = window.location.hash, index = 0, key = '', val, allKeys = {};
			hash = hash.substring(hash.length > 1 && hash.charAt(2) == '&' ? 2 : 1);
			for (var i = 0; i <= hash.length; i++) {
				if (hash.charAt(i) == '&' || i == hash.length) {
					val = hash.substring(index, i);
					if (loc.keyval[key] == null || loc.keyval[key] != val) {
						var prev = loc.keyval[key]; 
						loc.keyval[key] = val;
						loc.notify(key, val, prev);
					}
					index = i + 1;
					allKeys[key] = true;
					key = '';
				} else if (hash.charAt(i) == '=') {
					key = hash.substring(index, i);
					index = i + 1;
				}
			}
			
			for (var key in loc.keyval) {
				if (allKeys[key] == null) {
					var prev = loc.keyval[key];
					delete loc.keyval[key];
					loc.notify(key, null, prev);
				} 
			}
       }, false);
	}
};
$cheeta.directives['ctrl'] = $cheeta.directives['bind'] = function(def, elem, parentModels) {
	var defs = def.split(/ *; */g);
	var models = [];
	
	for (var i = 0; i < defs.length; i++) {
		var def = defs[i];
		split = def.split(/ +as +/g);
		var name = split[0];
		var as = split.length > 1 ? split[1] : null;

		models.push($cheeta.model.bind(parentModels, name, {
				elem: elem,
				attr: 'ctrl', 
				as: as
			}));
	}
	return models;
};

$cheeta.directives[''] = function(def, elem, parentModels, attr, attrName) {
	this.parseExpr = function(val, bindModel) {
		var qoute = null, regexpMod = false, result = '', index = -1, ch = val.charAt(i), models = [];
		for (var i = 0; i < val.length; i++) {
			if (qoute != null) {
				if (ch == quote && val.charAt(i - 1) != '\\') {
					if (quote == '/') {
						regexpMod = true;
					}
					quote = null;
				}
				result += ch;
			} else {
				if (regexpMod) {
					if (ch < 'a' && ch > 'z') {
						regexpMod = false;
					}
					result += ch;
				} else if (ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n' || ch == '!' || ch == '"' ||
						(ch >= '%' && ch <= '/') || (ch >= ':' && ch <= '?')) {
					if (ch == '\'' || ch == '"' || ch == '/') {
						quote = ch;
					}
					if (index > -1) {
						var name = val.substring(index, i);
						var modelVar = bindModel(name)
						result += m != null ? modelVar : name;
						index = -1;
					}
					result += ch;
				} else {
					if (index == -1) {
						index = i;
					}
				}
			}
		}
		return result;
	};

	var expr = this.parseExpr(def, function(name) {
		return $cheeta.model.bind(parentModels, name, 
				{
					elem: elem, 
					attr: attrName,
					bindAttr: attr.name,
					update: function(model) {
						var val = eval(this.elem.getAttribute(bindAttr));
						if (this.attr === 'text') {
							this.elem.innerHTML = '';
							this.elem.appendChild(document.createTextNode(val));
						} else if (this.attr === 'html') {
							this.elem.innerHTML = val;
						} else {
							if (this.attr === 'value') {
								if (this.elem.value !== undefined) {
									this.elem.value = val || null;
								}
							}
							this.elem.setAttribute(this.attr, val);
						}
					}
				}).__toExpr()
	});
	elem.setAttribute(attr.name, expr);
};

$cheeta.futureEvals = [];

$cheeta.directives['eval'] = function(def) {
	$cheeta.futureEvals.push(def);
};

$cheeta.directives['for'] = function(def, elem, parentModels) {
	var split = def.split(/ +in +/g), name, arrayVar, as;
	name = split[1];
	arrayVar = split[0];
	split = name.split(/ +as +/g);
	name = split[0];
	as = split.length > 1 ? split[1] : null;
	$cheeta.model.bind(parentModels, name, {
		elem: elem, 
		arrayVar: arrayVar,
		arrayName: name,
		as: as,
		update: function(model, val, oldVal) {
			if (oldVal.length > val.length) {
				for (var i = oldVal.length - 1; i >= val.length; i--) {
					$cheeta.model.forEachElem(model.__children[i], function(elem) {
						elem.parentNode.removeChild(elem);
						delete this.__parent.__children[i];
						delete this.__parent[i];
					});
				}
			} else if (oldVal.length < val.length) {
				var arrayVar = this.arrayVar;
				var arrayName = this.arrayName;
				var oldBind = this.elem.getAttribute('bind.') ? this.elem.getAttribute('bind.').value : '';
				oldBind += this.elem.getAttribute('data-bind.') ? this.elem.getAttribute('data-bind.').value : '';
				for (var i = oldVal.length; i < val.length; i++) {
					$cheeta.model.forEachElem(model, function(elem) {
						var clone = elem.cloneNode();
						clone.removeAttribute('bind.');
						clone.removeAttribute('data-bind.');
						clone.setAttribute('bind.', arrayName + '.' + i + ' as ' + arrayVar + (oldBind.length > 0 ? ';' + oldBind : ''));
						clone.style.display = '';
						elem.parentNode.insertBefore(clone, elem);
						$cheeta.compiler.recursiveCompile(this.__parentModels, clone, true);
					});
				}
			}
		}
	});
};

$cheeta.templates = {};

$cheeta.directives['template'] = function(def, elem, parentModels) {
	elem.innerHTML = $cheeta.templates[def] || elem.innerHTML;
	var children = elem.childNodes;
	for (var i = 0; i < children.length; i++) {
		$cheeta.compiler.recursiveCompile(parentModels, children[i]);
	}
};
