var $cheeta = {};
window['$cheeta'] = $cheeta;

$cheeta.model = {
	Model: function(parent, name) {
		this.value = undefined;
		this.bindings = {};
		this.parent = parent;
		this.name = name;
		this.children = {};
		this.toExpr = function() {
			var expr = '';
			var model = this;
			while (model.parent != null && model.name != null) {
				var ch = model.name.charAt(0);
				expr = (ch >= '0' &&  ch <= '9' ? '[' + model.name + ']' : '.' + model.name) + expr;
				model = model.parent;
			}
			
			return expr.substring(1);
		};
	},
	ArrayInterceptor: function(model) {
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
	bindElement: function(parent, name, binding) {
//		console.log('bind element: ', parent, name, binding);
		var model = parent.children[name];
		if (model === undefined) {
			model = new $cheeta.model.Model();
			model.name = name;
			model.parent = parent;
//			if (parent === this.root) {
//				if (window[name] !== undefined) {
//					parent.children[name] = undefined;
//					return null;
//				}
				this.interceptProp(model, parent.value, name);
//			}
			parent.children[name] = model;
		}
		if (binding != null) {
			var bindName = binding.as || name;
			if (model.bindings[bindName] == null) {
				model.bindings[bindName] = [];
			}
			model.bindings[bindName].push(binding);
		}
		model.value = parent.value == undefined ? undefined : (parent.value == null ? null : parent.value[name]);
		return model;
	},
	interceptProp: function(model, value, name) {
//		console.log('intercepting: ', value, name);
		if (value != null) {
			//model.value = value[name];
			var prevVal = value[name];
			try {
				Object.defineProperty(value, name, {
			        set: function(val) {
			        	var prevVal = model.value;
			        	if (prevVal != val) {
			        		model.value = val;
			        		if (model.isArray) {
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
			} catch(e) { 
				if (!(e instanceof TypeError)) throw e;
				return;
			}
			value[name] = prevVal;
		}
	},
	findParentModel: function(model, rootName) {
		while (model != $cheeta.model.root) {
			if (rootName == model.name || (model.bindings && model.bindings[rootName] != null)) {
				return model;
			}
			model = model.parent;
		}
		return model;
	},
	bind: function(parentModels, name, binding) {
		if (name == '$i') {
			for (var i = parentModels.length - 1; i >= 0; i--) {
				if (parentModels[i].name == '$i') {
					return parentModels[i];
				}
			}
		}
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
			parentModel = this.findParentModel(parentModel, rootName);
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
		return this.bindElement(parentModel, name, binding);
	},
	init: function() {
		$cheeta.model.root = new $cheeta.model.Model(null);
		$cheeta.model.root.value = window;
	}
};

$cheeta.onload = function() {
	$cheeta.compiler.compile();
	$cheeta.location.init();
};

$cheeta.on = function(events, elem, fn) {
	var split = events.split(' ');
	for (var i = 0; i < split.length; i++) {
		if (split[i].length > 0) {
			elem.addEventListener(split[i], fn, false);
		}
	}
};

window.addEventListener('load', $cheeta.onload, false);
$cheeta.directives = {
	'*': []
};

$cheeta.directive = function(name, fn, order) {
	if (fn == null) {
		var directive = $cheeta.directives[name];
		if (directive == null && name.indexOf('.', name.length - 1) > -1) {
			var wildcards = $cheeta.directives['*']
			name = name.substring(0, name.length - 1);
			for (var i = 0; i < wildcards.length; i++) {
				if (name.indexOf(wildcards[i].name) == 0 || name.indexOf('data-' + wildcards[i].name) == 0) {
					directive = wildcards[i];
					break;
				}
			}
			return directive || $cheeta.directive(''); 
		}
		return directive;
	}
	var index = name.indexOf('*', name.length - 1);
	if (index > -1) {
		name = name.substring(0, name.length - 1);
		$cheeta.directives['*'].push({name: name, fn: fn, order: order});
		return $cheeta.directives['*'][1]; 
	} else {
		return $cheeta.directives['data-' + name] = $cheeta.directives[name] = {name: name, fn: fn, order: order || 10000};
	}
};

$cheeta.directive.resolveModelRefs = function(elem, attr, parentModels, updateFn) {
	var resolveInterceptor = function(name) {
		var binding = updateFn == null ? null : 
			{
				elem: elem, 
				attr: attr,
				baseAttrName: attr.name.substring(attr.name.indexOf('data-') == 0 ? 5 : 0, attr.name.length - 1),
				update: function() {
					updateFn.apply(this, [model]);
				}
			};
		var model = $cheeta.model.bind(parentModels, name, binding);
//		if (binding != null) {
//			$cheeta.futureUpdates.push({binding: binding, model: model});
//		}
		return model != null ? model.toExpr() : name;
	}
	var quote = null, regexpMod = false, result = '', index = -1, models = [];
	var val = attr.value + '\x1a';
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
						var ii = i;
						while (val.charAt(ii) == ' ') {
							ii++;
						}
						if (val.charAt(ii) == '(') {
							var fnIndex = name.lastIndexOf('.');
							if (fnIndex > -1) {
								result += resolveInterceptor(name.substring(0, fnIndex)) + '.';
								result += name.substring(fnIndex + 1);
							} else {
								result += name;
							}
						} else {
							result += resolveInterceptor(name);
						}
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

$cheeta.directive.onModelUpdate = function(elem, attr, parentModels, fn) {
	var expr = $cheeta.directive.resolveModelRefs(elem, attr, parentModels, function(model) {
		var val = null;
		try {
			val = eval(elem.getAttribute(this.attr.name));
		} catch (e) {}
		fn.apply(this, [val]);
	});
	elem.setAttribute(attr.name, expr);
};
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
		$cheeta.future.evals = [];
		this.recursiveCompile(parentModels, elem, skipSiblings);
		this.runFutures();
	},
	cleanUpFromModel: function(elem) {
		if (elem.__$cheeta_models_ != null) {
			for (var k = 0; k < elem.__$cheeta_models_.length; k++) {
				var model = elem.__$cheeta_models_[k];
				for (var name in model.bindings) {
					var bindings = model.bindings[name];
					for (var i = 0; i < bindings.length; i++) {
						var binding = bindings[i];
						if (binding.elem == elem) {
							bindings.splice(i, 1);
						}
					}
				}
			}
		}
	},
	compileDirectives: function(parentModels, elem) {
		this.cleanUpFromModel(elem);
		var attribs = [];
		var additionalAttribs = [];
		for (var k = 0; k < elem.attributes.length; k++) {
			var attr = elem.attributes[k];
			if (attr.specified) {
				var split = attr.name.split('.');
				if (split[split.length - 1] == '') {
					split.pop();
				}
				if (split.length > 1) {
					for (var i = 0; i < split.length - 1; i++) {
						additionalAttribs.push({name: split[i] + '.', value: attr.value});
					}
//					elem.removeAttribute(attr.name)
				} else {
					attribs.push(attr);
				}
			}
		}
		for (var k = 0; k < additionalAttribs.length; k++) {
			var attr = additionalAttribs[k];
			elem.setAttribute(attr.name, attr.value);
			attribs.push(elem.attributes[attr.name]);
		}
		attribs = attribs.sort(function(a, b) {
			function order(d) {
				return d == null ? $cheeta.directive('').order : d.order;  
			}
			return order($cheeta.directive(a.name)) - order($cheeta.directive(b.name));
		});
//		console.log('compiling attibutes', attribs);
		for (var k = 0; k < attribs.length; k++) {
			var attr = attribs[k];
//			console.log('compiling attr', attr);
			var directive = $cheeta.directive(attr.name);
			if (directive != null) {
				var models = directive.fn(elem, attr, parentModels);
				if (models != null) {
					if (elem.__$cheeta_models_ == null) elem.__$cheeta_models_ = [];
					elem.__$cheeta_models_ = elem.__$cheeta_models_.concat(models);
				}
				parentModels = (models || []).concat(parentModels);				
			}
			if (elem.__isFor_) {
				break;
			}
		}
		return parentModels;
	},
	compile: function() {
		$cheeta.model.init();
		
		$cheeta.future = $cheeta.future || {};
		$cheeta.future.evals = [];
		
		$cheeta.location.initRoute();
		
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
		for (var i = 0; i < $cheeta.future.evals.length; i++) {
			eval($cheeta.future.evals[i]);
		}
//		for (var i = 0; i < $cheeta.futureUpdates.length; i++) {
//			var binding = $cheeta.futureUpdates[i];
//			binding.binding.update(binding.model);
//		}
	}
};
$cheeta.XHR = function() {
	var origSend = this.send;
	var origOpen = this.open;
	var xhr = new XMLHttpRequest();
	xhr.open = function() {
		origOpen.apply(xhr, arguments);
		return xhr;
	};
	xhr.send = function() {
		origSend.apply(xhr, arguments);
		return xhr;
	};
	var successCallbacks = [], completeCallbacks = [], errorCallbacks = [], stateChangeCallbacks = [];
	xhr.onError = function(callback) {
		errorCallbacks.push(callback);
		return xhr;
	};
	xhr.onSuccess = function(callback) {
		successCallbacks.push(callback);
		return xhr;
	};
	xhr.onComplete = function(callback) {
		completeCallbacks.push(callback);
		return xhr;
	};
	xhr.onStateChange = function(callback) {
		stateChangeCallbacks.push(callback);
	};
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (200 <= xhr.status && xhr.status < 300) {
				for (var i = 0; i < successCallbacks.length; i++) {
					successCallbacks[i].apply(xhr, [xhr]);
				}
			} else {
				for (var i = 0; i < errorCallbacks.length; i++) {
					errorCallbacks[i].apply(xhr, [xhr]);
				}
			}
			for (var i = 0; i < completeCallbacks.length; i++) {
				completeCallbacks[i].apply(xhr, [xhr]);
			}
        }
		for (var i = 0; i < stateChangeCallbacks.length; i++) {
			stateChangeCallbacks[i].apply(xhr, [xhr]);
		}		
	};
	Object.defineProperty(xhr, 'data', {
		get: function() {
			return xhr.getResponseHeader('Content-Type') == 'application/json' ? JSON.stringify(xhr.responseText) : xhr.responseText;
		}, 
		enumerable: true,
		configurable: true
	});
	return xhr;
};
$cheeta.XHR.prototype = new XMLHttpRequest();
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
	},
	initRoute: function() {
		$cheeta.directive('route.').fn(document.body, {name: 'route.', value: '$cheeta.location.routes'}, []);
	},
	routes: {}
};
$cheeta.directive('bind.', function(elem, attr, parentModels) {
	$cheeta.directive('value.').fn(elem, attr, parentModels);
	$cheeta.on('keydown keyup change', elem, function(e) {
		setTimeout(function() {
			eval(elem.getAttribute(attr.name) + '=\'' + elem.value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\'');
//			eval(elem.getAttribute(attr.name) + '=\'34334\'');
		}, 0);
	});
}, 800);
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

$cheeta.directive('', function(elem, attr, parentModels) {
	$cheeta.directive.onModelUpdate(elem, attr, parentModels, function(val) {
		elem.setAttribute(this.baseAttrName, val);
	});
}, 700);		


$cheeta.directive('for.', function(elem, attr, parentModels) {
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
					for (var key in model.children[i].bindings) {
						var bindings = model.children[i].bindings[key];
						for (var k = 0; k < bindings.length; k++) {
							var rmElem = bindings[k].elem;
							rmElem.parentNode.removeChild(rmElem);
						}
					}
					delete model.children[i];
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
					var arrayIndexModel = new $cheeta.model.Model($cheeta.model.root, '$i');
					arrayIndexModel.toExpr = function() {
						return i;
					}; 
					$cheeta.compiler.compileElem(this.parentModels.concat(arrayIndexModel), clone, true);
				}
			}
			//TODO splice with the same size
		}
	}
	var model = $cheeta.model.bind(parentModels, name, binding);
//	binding.parentModels = [model.parent].concat(parentModels);
	binding.parentModels = parentModels;

	elem.style.display = 'none';
	model.isArray = true;
	return [model];
}, 100);

$cheeta.directive('html.', function(elem, attr, parentModels) {
	$cheeta.directive.onModelUpdate(elem, attr, parentModels, function(val) {
		if (val != elem.innerHTML) {
			elem.innerHTML = val || '';
		}
	});
}, 600);
$cheeta.directive('init.', function(elem, attr, parentModels) {
	var expr = $cheeta.directive.resolveModelRefs(elem, attr, parentModels);
	$cheeta.future.evals.push(expr);
}, 700);

$cheeta.keyconsts = {
	'backspace':8,'tab':9,'enter':13,'shift':16,'ctrl':17,'alt':18,'space':32,'pause':19,'break':19,'capslock':20,'escape':27,'pageup':33,'pagedown':34,'end':35,
	'home':36,'left':37,'up':38,'right':39,'down arrow':40,'insert':45,	'delete':46,'colon':58, 'f1':112,'f2':113,'f3':114,'f4':115,'f5':116,'f6':117,'f7':118,
	'f8':119,'f9':120,'f10':121,'f11':122,'f12':123,'numlock':144,'scrolllock':145,'semicolon':186,'comma':188,'dash':189,'dot':190
};
$cheeta.directive('on*', function(elem, attr, parentModels) {
	var expr = $cheeta.directive.resolveModelRefs(attr.value, attr, parentModels);
	elem.setAttribute(attr.name, expr);
	
	var baseAttrName = attr.name.substring(attr.name.indexOf('data-') == 0 ? 7 : 2, attr.name.length - 1);
	var split = baseAttrName.split('-');
	(function bindEvent(event, key, attrName) {
		var fn = function(e) {
			eval(elem.getAttribute(attrName));
		};
		if (event.indexOf('key') == 0) {
			elem.addEventListener(event, function(e) {
				var code = 1;
				if (key.length == 1) {
					code = key.charCodeAt(0);
				} else {
					code = $cheeta.keyconsts[key];
					if (code == null) {
						code = parseInt(key);
						if (isNaN(code)) {
							throw 'unknown key: ' + key;
						}
					}
				}
				if (e.which == code) {
					fn.apply(elem, [e]);
				}
			}, false);			
		} else {
			elem.addEventListener(event, function(e) {
				fn.apply(elem, [e]);
			}, false);
		}
	})(split[0], split[1], attr.name);
}, 800);

$cheeta.directive('route.', function(elem, attr, parentModels) {
	var _this = this;
	$cheeta.directive.onModelUpdate(elem, attr, parentModels, function(val) {
		var routes = val;
		if (_this.watchFn != null) {
			$cheeta.location.unwatch(_this.fn);
		}
		_this.watchFn = $cheeta.location.watch(function(hash) {
			var len = 0;
			var url = null;
			for (var key in routes) {
				if (hash.indexOf(key) == 0 && len < key.length) {
					len = key.length;
					url = routes[key];
				}
			}
			if (url != null) {
				new $cheeta.XHR().open('get', url).onSuccess(function(xhr) {
					elem.innerHTML = xhr.data;
					$cheeta.compiler.compileElem(parentModels, elem);
				}).send();
			}
		});
	});
}, 900);

$cheeta.templates = {};

$cheeta.directive('template.', function(elem, attr, parentModels) {
	elem.innerHTML = $cheeta.templates[attr.value] || elem.innerHTML;
	var children = elem.childNodes;
	for (var i = 0; i < children.length; i++) {
		$cheeta.compiler.compileElem(parentModels, children[i]);
	}
}, 900);

$cheeta.directive('text.', function(elem, attr, parentModels) {
	$cheeta.directive.onModelUpdate(elem, attr, parentModels, function(val) {
		elem.innerHTML = '';
		console.log(elem);
		console.log('val: ' + ' ' + val);
		console.log('innerhtml: ' +  elem.innerHTML);
		elem.appendChild(document.createTextNode(val || ''));
		console.log('innerhtml after: ' +  elem.innerHTML);
	});
}, 600);
$cheeta.directive('value.', function(elem, attr, parentModels) {
	$cheeta.directive.onModelUpdate(elem, attr, parentModels, function(val) {
		if (elem.value != val) {
			elem.value = val || null;
		}
	});
}, 600);

