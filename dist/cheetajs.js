var $cheeta = {};
window['$cheeta'] = $cheeta;

$cheeta.model = {
	Model: function(parent, name) {
		this.__value = undefined;
		this.__bindings = {};
		this.__parent = parent;
		this.__name = name;
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
					model[i].__value = this[i];
					$cheeta.model.interceptProp(model[i], this, i);
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
				model.__parent.__value[model.__name] = this;
				var newLen = this.length;
				$cheeta.model.update(model, newLen, len);
				return result;
			},
			unshift: function() {
				var len = this.length;
				var result = Array.prototype.unshift.apply(this, arguments);
				model.__parent.__value[model.__name] = this;
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
					model[i].__value = this[i];
					$cheeta.model.interceptProp(model[i], this, i);
				}
				return result;
			}
		}
	},
	interceptArray: function(model) {
		var interceptor = new this.ArrayInterceptor(model);
		for (var key in interceptor) {
			if (model.__value[key] == interceptor[key]) {
				break;
			}
			model.__value[key] = interceptor[key];
		}
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
		        		if (model.__isArray) {
		        			$cheeta.model.interceptArray(model);
		        		}
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
$cheeta.directives = {
	'*': []
};

$cheeta.directive = function(name, fn, order) {
	if (fn == null) {
		var directive = $cheeta.directives[name];
		if (directive == null) {
			var wildcards = $cheeta.directives['*']
			for (var i = 0; i < wildcards.length; i++) {
				if (name.indexOf(wildcards[i].name) == 0) {
					directive = wildcards[i];
					break;
				}
			}
		}
		return directive || (name.indexOf('.', name.length - 1) > -1 ? $cheeta.directive('') : null); 
	}
	var index = name.indexOf('*', name.length - 1);
	if (index > -1) {
		name = name.substring(0, name.length - 1);
		$cheeta.directives['*'].push({name: 'data-' + name, fn: fn, order: order}, {name: name, fn: fn, order: order});
		return $cheeta.directives['*'][1]; 
	} else {
		return $cheeta.directives['data-' + name] = $cheeta.directives[name] = {name: name, fn: fn, order: order || 10000};
	}
}

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
	compileDirectives: function(parentModels, elem) {
		var attribs = [];
		for (var k = 0; k < elem.attributes.length; k++) {
			var attr = elem.attributes[k];
			if (attr.specified) {
				attribs.push(attr);
			}
		}
		//ordering the directives 'bind'/'ctrl' > 'for' > 'template'
		attribs = attribs.sort(function(a, b) {
			function order(d) {
				return d == null ? $cheeta.directive('').order : d.order;  
			}
			return order($cheeta.directive(a.name)) - order($cheeta.directive(b.name));
		});
		for (var k = 0; k < attribs.length; k++) {
			var attr = attribs[k];
			var directive = $cheeta.directive(attr.name);
			if (directive != null) {
				parentModels = (directive.fn(elem, attr, parentModels) || []).concat(parentModels);				
			}
			if (elem.__isFor_) {
				break;
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
(function() {
	var fn = function(elem, attr, parentModels) {
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
			models.push($cheeta.model.bind(parentModels, name, binding));
		}
		return models;
	};
	$cheeta.directive('ctrl.', fn, 200);
	$cheeta.directive('model.', fn, 201);
})();

$cheeta.futureEvals = [];
$cheeta.futureUpdates = []

$cheeta.directive('', function(elem, attr, parentModels) {
	var baseAttrName = attr.name.substring(attr.name.indexOf('data-') == 0 ? 5 : 0, attr.name.length - 1);
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
					var val = null;
					try {
						val = eval(this.elem.getAttribute(this.attr.name));
					} catch (e) {}
					if (val instanceof Object){
						return;
					}
					if (this.baseAttrName === 'text') {
						this.elem.innerHTML = '';
						this.elem.appendChild(document.createTextNode(val || ''));
					} else if (this.baseAttrName === 'html') {
						this.elem.innerHTML = val || '';
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
		if (binding != null) {
			$cheeta.futureUpdates.push({binding: binding, model: model});
		}
		return model != null ? $cheeta.model.toExpr(model) : name;
	});
	
	if (baseAttrName === 'init') {
		$cheeta.futureEvals.push(expr);
	}
	
	elem.setAttribute(attr.name, expr);
}, 600);

$cheeta.futureEvals = [];

$cheeta.directive('eval.', function(elem, attr) {
	$cheeta.futureEvals.push(attr.value);
}, 700);

$cheeta.directive('for.', function(elem, attr, parentModels, baseAttrName) {
	elem.__isFor_ = true;
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
//				$cheeta.model.interceptArray(newLen, this.update);
				newLen = newLen == null ? 0 : newLen.length;
				oldLen = oldLen == null ? 0 : oldLen.length;
			}
			if (oldLen > newLen) { 
				for (var i = oldLen - 1; i >= newLen; i--) {
					for (var key in model[i].__bindings) {
						var bindings = model[i].__bindings[key];
						for (var k = 0; k < bindings.length; k++) {
							var rmElem = bindings[k].elem;
							rmElem.parentNode.removeChild(rmElem);
						}
					}
					delete model[i];
				}
			} else if (oldLen < newLen) {
				var arrayVar = this.arrayVar;
				var arrayName = this.arrayName; 
				for (var i = oldLen; i < newLen; i++) {
					var clone = this.elem.cloneNode();
					clone.removeAttribute('for.');
					clone.removeAttribute('data-for.');
					clone.setAttribute('model.', arrayName + '.' + i + ' as ' + arrayVar + 
							(this.elem.getAttribute('model.') ? (';' + this.elem.getAttribute('model.').value) : '')); 
					clone.style.display = '';
					this.elem.parentNode.insertBefore(clone, this.elem);
					$cheeta.compiler.compileElem(this.__parentModels, clone, true);
				}
			}
			//TODO splice with the same size
		}
	}
	var model = $cheeta.model.bind(parentModels, name, binding);
//	binding.__parentModels = [model.__parent].concat(parentModels);
	binding.__parentModels = parentModels;

	elem.style.display = 'none';
	model.__isArray = true;
	return [model];
}, 100);

$cheeta.templates = {};

$cheeta.directive('template.', function(elem, attr, parentModels) {
	elem.innerHTML = $cheeta.templates[attr.value] || elem.innerHTML;
	var children = elem.childNodes;
	for (var i = 0; i < children.length; i++) {
		$cheeta.compiler.compileElem(parentModels, children[i]);
	}
}, 500);
