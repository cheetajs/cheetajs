var $cheeta = {};
window['$cheeta'] = $cheeta;

$cheeta.model = { 
	Model: function(parent, name) {
		this.__children = {};
		this.__value = undefined;
		this.__bindings = {};
		this.__name = name;
		this.__parent = parent;
	},
	arrayModel: {
		push: function() {
			var len = this.__value.length;
			this.__value.push.apply(this.__value, arguments);
			var newLen = this.__value.length;
			$cheeta.model.update(this, newLen, len);
			for (var i = len; i < newLen; i++) {
				this[i] = this.__value[i];
			}
		},
		pop: function() {
			var len = this.__value.length;
			this.__value.pop.apply(this.__value, arguments);
			var newLen = this.__value.length;
			$cheeta.model.update(this, newLen, len);
		},
		splice: function() {
			var len = this.__value.length;
			this.__value.splice.apply(this.__value, arguments);
			var newLen = this.__value.length;
			$cheeta.model.update(this, newLen, len);
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
		Object.defineProperty(model, 'length', {get: function() {return this.__value.length}});
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
				if (window[modelName] !== undefined) {
					parent.__children[modelName] = undefined;
					return null;
				} else {
					window[modelName] = model;
				}
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
				if (this.bindElement(parentModel, split[i], binding == null ? null : {
						elem: binding.elem, 
						attr: 'bind'
					}) == null) {
					return null;
				}
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
$cheeta.compiler = {
	recursiveCompile: function(parentModels, node, skipSiblings) {
		if (node) {
			var models = parentModels;
			if (node.nodeType === 1) {
				models = this.compileDirectives(parentModels, node);
			}
			if (!node.__isFor_) {
				this.recursiveCompile(models, node.firstChild);
			} else {
				node.__isFor_ = undefined;
			}
			if (!skipSiblings) {
				this.recursiveCompile(parentModels, node.nextSibling);
			}
		}
	},
	compileElem: function(parentModels, elem, skipSiblings) {
		this.recursiveCompile(parentModels, elem, skipSiblings)
		this.runFutures();
	},
	findDirective: function(elem, directive) {
		return elem.getAttribute(directive + '.') || elem.getAttribute('data-' + directive + '.');
	},
	compileDirectives: function(parentModels, elem) {
		var attribs = [];
		for (var k = 0; k < elem.attributes.length; k++) {
			var attr = elem.attributes[k];
			attribs.push(attr);
		}
		//ordering the directives 'bind'/'ctrl' > 'for' > 'template'
		attribs = attribs.sort(function(a, b) {
			return (a.name > b.name) ? 1 : -1; 
		});
		for (var k = 0; k < attribs.length; k++) {
			var attr = attribs[k];
			if (attr.specified) {
				var index = attr.name.indexOf('.', attr.name.length - 1);
				if (index !== -1) {
					var attrName = attr.name.substring(0, attr.name.length - 1);
					if (attrName.indexOf('data-') == 0) {
						attrName = attrName.substring('data-'.length);
					}
					if (attrName === 'for') {
						elem.__isFor_ = true;
					}
					var directive = $cheeta.directives[attrName] || $cheeta.directives[''];
					parentModels = (directive(elem, attr, parentModels, attrName) || []).concat(parentModels);
				}
			}
		}
		return parentModels;
	},
	compile: function() {
		$cheeta.futureEvals = [];
		scripts = document.getElementsByTagName('script');
		for (var i = 0; i < scripts.length; i++) {
			var script = scripts[i];
			if (script.getAttribute('type') === 'text/cj-template') {
				$cheeta.templates[script.getAttribute('id')] = script.innerHTML;
			}
		}
		var root = document.documentElement;
		this.recursiveCompile([], root);
		this.runFutures();
	},
	runFutures: function() {
		for (var i = 0; i < $cheeta.futureEvals.length; i++) {
			eval($cheeta.futureEvals[i]);
		}
		for (var i = 0; i < $cheeta.futureUpdates.length; i++) {
			var binding = $cheeta.futureUpdates[i];
			binding.binding.update(binding.model);
		}
		$cheeta.futureEvals = [];
		$cheeta.futureUpdates = [];
	}
};
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
$cheeta.directives['ctrl'] = $cheeta.directives['bind'] = function(elem, attr, parentModels) {
	var defs = attr.value.split(/ *; */g);
	var models = [];
	
	for (var i = 0; i < defs.length; i++) {
		var def = defs[i];
		split = def.split(/ +as +/g);
		var name = split[0];
		var as = split.length > 1 ? split[1] : null;

		var binding = {
			elem: elem,
			attr: 'ctrl', 
			as: as, 
		};
		if (elem.getAttribute('data-__for.') != null) {
			binding.update = function(val) {
				if (val == undefined) {
					this.elem.parentNode.removeChild(this.elem);
				}
			}
		}
		models.push($cheeta.model.bind(parentModels, name, binding));
	}
	return models;
};

$cheeta.futureEvals = [];
$cheeta.futureUpdates = []

$cheeta.directives[''] = function(elem, attr, parentModels, baseAttrName) {
	this.parseExpr = function(val, bindAndResolve) {
		var quote = null, regexpMod = false, result = '', index = -1, models = [];
		val = val + '\x1a';
		for (var i = 0; i < val.length; i++) {
			var ch = val.charAt(i);
			if (quote != null) {
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
						(ch >= '%' && ch <= '/' && ch != '.') || (ch >= ':' && ch <= '?') || ch == '\x1a') {
					if (ch == '\'' || ch == '"' || ch == '/') {
						quote = ch;
					}
					if (index > -1) {
						var name = val.substring(index, i);
						var isLiteral = false;
						if (name === 'true' || name === 'false' || name === 'undefined' || name === 'null' || 
							name === 'NaN' || !isNaN(name)) {
							result += name;
						} else {
							result += bindAndResolve(name);
						}
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
		return result.substring(0, result.length - 1);
	};
	
	var expr = this.parseExpr(attr.value, function(name) {
		var binding = baseAttrName === 'init' ? null : 
			{
				elem: elem, 
				attr: attr,
				baseAttrName: baseAttrName,
				update: function(model) {
					var val = eval(this.elem.getAttribute(this.attr.name));
					if (this.baseAttrName === 'text') {
						this.elem.innerHTML = '';
						this.elem.appendChild(document.createTextNode(val));
					} else if (this.baseAttrName === 'html') {
						this.elem.innerHTML = val;
					} else {
						if (this.baseAttrName === 'value') {
							if (this.elem.value !== undefined) {
								this.elem.value = val || null;
							}
						}
						this.elem.setAttribute(this.baseAttrName, val);
					}
				}
			};
		var model = $cheeta.model.bind(parentModels, name, binding);
		if (model != null && model.__value != undefined && binding != null) {
			$cheeta.futureUpdates.push({binding: binding, model: model});
		}
		return model != null ? $cheeta.model.toExpr(model) : name;
	});
	
	if (baseAttrName === 'init') {
		$cheeta.futureEvals.push(expr);
	}
	
	elem.setAttribute(attr.name, expr);
};

$cheeta.futureEvals = [];

$cheeta.directives['eval'] = function(elem, attr) {
	$cheeta.futureEvals.push(attr.value);
};

$cheeta.directives['for'] = function(elem, attr, parentModels, baseAttrName) {
	var split = attr.value.split(/ +in +/g), name, arrayVar, as;
	name = split[1];
	arrayVar = split[0];
	split = name.split(/ +as +/g);
	name = split[0];
	as = split.length > 1 ? split[1] : null;
	var binding = {
		elem: elem, 
		arrayVar: arrayVar,
		arrayName: name,
		as: as,
		update: function(newLen, oldLen) {
			if (newLen instanceof Object || oldLen instanceof Object) {
				newLen = newLen == null ? 0 : newLen.length;
				oldLen = oldLen == null ? 0 : oldLen.length;
			}
			if (oldLen > newLen) { 
				for (var i = oldLen - 1; i >= newLen; i--) { 
					model[i] = null;
					delete model[i];
					delete model.__children[i];
				}
			} else if (oldLen < newLen) {
				var arrayVar = this.arrayVar;
				var arrayName = this.arrayName; 
				var oldBind = this.elem.getAttribute('bind.') ? this.elem.getAttribute('bind.').value : '';
				oldBind += this.elem.getAttribute('data-bind.') ? this.elem.getAttribute('data-bind.').value : '';
				for (var i = oldLen; i < newLen; i++) {
					var clone = this.elem.cloneNode();
					clone.removeAttribute('for.');
					clone.removeAttribute('data-for.');
					clone.setAttribute('data-__for.');
					clone.setAttribute('bind.', arrayName + '.' + i + ' as ' + arrayVar + (oldBind.length > 0 ? ';' + oldBind : ''));
					clone.style.display = '';
					elem.parentNode.insertBefore(clone, this.elem);
					$cheeta.compiler.compileElem(this.__parentModels, clone, true);
				}
			} 
			//TODO splice with the same size
		}
	}
	var model = $cheeta.model.bind(parentModels, name, binding);
	model = $cheeta.model.extendArray(model);
	binding.__parentModels = [model.__parent].concat(parentModels);

	elem.style.display = 'none';

	return [model];
};

$cheeta.templates = {};

$cheeta.directives['template'] = function(elem, attr, parentModels) {
	elem.innerHTML = $cheeta.templates[attr.value] || elem.innerHTML;
	var children = elem.childNodes;
	for (var i = 0; i < children.length; i++) {
		$cheeta.compiler.compileElem(parentModels, children[i]);
	}
};
