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
		this.addChild = function(name) {
			var model = this.children[name];
			if (model === undefined) {
				model = new $cheeta.model.Model();
				model.name = name;
				model.parent = this;
				$cheeta.model.interceptProp(model, this.value, name);
				this.children[name] = model;
				model.value = this.value == null ? undefined : this.value[name];
			}
			if (this.value == null) {
				this.value = this.isArray ? [] : {};
			}
			return model;
		};
		this.bind = function(binding) {
			if (binding != null) {
				var bindName = binding.as || this.name;
				if (this.bindings[bindName] == null) {
					this.bindings[bindName] = [];
				}
				this.bindings[bindName].push(binding);
			}
			return this;
		};
		this.valueChange = function(val, oldVal) {
			if (val != oldVal) {
				for (var name in this.bindings) {
					var bindings = this.bindings[name];
					for (var i = 0; i < bindings.length; i++) {
						var binding = bindings[i];
						if (binding.onChange) {
							binding.onChange(val, oldVal);
						}
					}
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
//				for (var i = len; i < newLen; i++) {
//					model.children[i].value = this[i];
//					$cheeta.model.interceptProp(model.children[i], this, i);
//				}
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
//				for (var i = len; i < newLen; i++) {
//					model.children[i].value = this[i];
//					$cheeta.model.interceptProp(model.children[i], this, i);
//				}
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
			if (value[name] != null) {
				$cheeta.future.evals.push(function() {
	//				$cheeta.model.update(model, val, prevVal);
					model.valueChange(value[name], null);
	//				if (value != null) {
	//					value[name] = beforeValue;
	//				} 
				});
			}
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
	define: function(parentModels, name) {
		return this.get(parentModels, name, true);
	},
	get: function(parentModels, name, defineIfNotExists) {
		if (parentModels == null) {
			parentModels = [$cheeta.model.root];
		}
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
				if (!defineIfNotExists && parentModel.children(split[i]) == null) {
					return null;
				}
				parentModel.addChild(split[i])
				parentModel = parentModel.children[split[i]];
			}
		}
		return defineIfNotExists ? parentModel.addChild(name) : parentModel.children[name];
	}
};

$cheeta.model.root = $cheeta.model.root || new $cheeta.model.Model(null);
$cheeta.model.root.value = window;
$cheeta.root = $cheeta.model.root;

window.addEventListener('load', function() {
	if (!$cheeta.isInitialized) {
		$cheeta.isInitialized = true;
		$cheeta.future = {evals: []};
		$cheeta.hash.init();
		$cheeta.compiler.compile([$cheeta.model.root], document.documentElement);
	}
}, false);
$cheeta.Directive = function(name) {
	this.name = name;
	this.isGlobal = function() {
		return this.name.indexOf('*', this.name.length - 1) > -1; 
	};
	this.orderVal = 1000;
	this.order = function(val) {
		this.orderVal = val;
		return this;
	};
	this.onBind = function(fn) {
		if (fn != null) {
			this.bindFn = fn;
			return this;
		} else {
			return this.bindFn;
		}
	};
	this.bind = function(elem, attrName, parentModels) {
		return this.bindFn ? this.bindFn.apply(this, arguments) : null;
	};
	this.onUnbind = function(fn) {
		if (fn != null) {
			this.unbindFn = fn;
			return this;
		} else {
			return this.unbindFn;
		}
	};
	this.unbind = function(elem, attrName, parentModels) {
		return this.unbindFn ? this.unbindFn.apply(this, arguments) : null;
	};
	this.resolveModelNames = function(elem, attrName, parentModels, onModel, skipSetAttribute) {
		var resolvedVal = '';
		var models = [];
		this.tokenizeAttrVal(elem.getAttribute(attrName), {
			onVar: function(t) {
				var model = $cheeta.model.get(parentModels, t, true)
				models.push(model);
				resolvedVal += model.toExpr();
				onModel && onModel(model);
			},
			onLiteral: function(t) {
				resolvedVal += t;
			}
		});
		skipSetAttribute || elem.setAttribute(attrName, resolvedVal);
		return resolvedVal;
	};
	this.tokenizeAttrVal = function(val, onToken) {
		var quote = null, regexpMod = false, index = -1;
		val += '\x1a';
		for (var i = 0; i < val.length; i++) {
			var ch = val.charAt(i);
			if (quote != null) {
				if (ch == quote && val.charAt(i - 1) != '\\') {
					if (quote == '/') {
						regexpMod = true;
					}
					quote = null;
				}
				onToken.onLiteral(ch);
			} else {
				if (regexpMod) {
					if (ch < 'a' && ch > 'z') {
						regexpMod = false;
					}
					onToken.onLiteral(ch);
				} else if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === '!' || ch === '"' || ch === '[' || ch === ']' || 
						(ch >= '%' && ch <= '/' && ch != '.') || (ch >= ':' && ch <= '?') || (ch >= '{' && ch <= '~') || ch === '^' || ch == '\x1a') {
					if (ch === '\'' || ch === '"' || ch === '/') {
						quote = ch;
					}
					if (index > -1) {
						var name = val.substring(index, i);
						if (name === 'true' || name === 'false' || name === 'undefined' || name === 'null' || 
							name === 'NaN' || !isNaN(name)) {
							onToken.onLiteral(name);
						} else {
							var ii = i;
							while (val.charAt(ii) == ' ') {
								ii++;
							}
							if (val.charAt(ii) == '(') {
								var fnIndex = name.lastIndexOf('.');
								if (fnIndex > -1) {
									onToken.onVar(name.substring(0, fnIndex));
									onToken.onLiteral(name.substring(fnIndex));
								} else {
									onToken.onLiteral(name);
								}
							} else {
								onToken.onVar(name);
							}
						}
						index = -1;
					}
					if (ch !== '\x1a') {
						onToken.onLiteral(ch);
					}
				} else {
					if (index == -1) {
						index = i;
					}
				}
			}
		}
	};
	
	this.onValueChange = function(fn) {
		var origBind = this.bindFn;
		this.bindFn = function(elem, attrName, parentModels) {
			if (origBind) origBind();
			var baseAttrName = attrName.substring(attrName.indexOf('data-') == 0 ? 5 : 0, attrName.length - 1);
			this.resolveModelNames(elem, attrName, parentModels, function(model) {
				var binding = { 
					elem: elem, 
					attrName: attrName,
					baseAttrName: baseAttrName,
					onChange: function() {
						var val = eval(elem.getAttribute(this.attrName));
						fn.apply(this, [val, elem, attrName, parentModels]);
					}
				};
				model.bind(binding);
			});
		}
		return this;
	};
};
$cheeta.directive = {
	add: function(directive) {
		$cheeta.root.addDirective(directive);
	},
	get: function(name, parentModels) {
		if (name.indexOf('data-') == 0) {
			name = name.substring(5);
		}
		var endsWithDot = name.indexOf('.', name.length - 1) > -1;
		var directives = [];
		parentModels = parentModels || [$cheeta.model.root];
		for (var i = 0; i < parentModels.length; i++) {
			var model = parentModels[i];
			var directive = model.getDirective(name);
			if (directive == null && model.directives != null && model.directives['/'] != null && endsWithDot) {
				var indices = model.directives['/'];
				for (var k = 0; k < indices.length; k++) {
					directive = model.directives[name.substring(0, indices[k]) + '*'];
					if (directive != null) {
						directives.push(directive);
					}
				}
			} else {
				if (directive != null) {
					directives.push(directive);
				}
			}
		}
		return directives.length == 0 ? $cheeta.directive.get('') : directives;
	}
}
$cheeta.compiler = {
	recursiveCompile: function(parentModels, node, isAjaxLoaded, erase, skipSiblings, skipNode) {
		if (node) {
			var models = parentModels;
			if (!skipNode) {
				if (node.nodeType === 1) {
					if (node.tagName.toLowerCase() == 'script' && !erase) {
						var script = node;
						if (isAjaxLoaded && (script.parentNode == null || script.parentNode.tagName.toLowerCase() != 'head') && 
								(script.type == null || script.type == '' || script.type === 'text/javascript')) {
							var content = script.innerHTML || "";
							var head = document.getElementsByTagName("head")[0] || document.documentElement;
						    script = document.createElement("script");
						    script.type = "text/javascript";
						    script.appendChild(document.createTextNode(content));
						    head.insertBefore(script, head.firstChild);
						    head.removeChild(script);
						} else if (script.type === 'text/cheeta-template') {
							$cheeta.templates[script.getAttribute('id')] = script.innerHTML || "";
						}
					}
					models = this.compileDirectives(parentModels, node, erase);
				}
			}
			if (!node.__isFor_) {
				this.recursiveCompile(models, node.firstChild, isAjaxLoaded, erase);
			} else {
				node.__isFor_ = undefined;
			}
			if (!skipSiblings) {
				this.recursiveCompile(parentModels, node.nextSibling, isAjaxLoaded, erase);
			}
		}
	},
	compile: function(parentModels, elem, isAjaxLoaded) {
		$cheeta.future.evals = [];
		this.recursiveCompile(parentModels, elem, isAjaxLoaded, false, true);
		this.runFutures();
	},
	compileChildren: function(parentModels, elem, isAjaxLoaded) {
		$cheeta.future.evals = [];
		this.recursiveCompile(parentModels, elem, isAjaxLoaded, false, true, true);
		this.runFutures();
	},
	uncompile: function(parentModels, elem) {
		$cheeta.future.evals = [];
		this.recursiveCompile(parentModels, elem, false, true, true);
		this.runFutures();
	},
	uncompileChildren: function(parentModels, elem) {
		$cheeta.future.evals = [];
		this.recursiveCompile(parentModels, elem, false, true, true, true);
		this.runFutures();
	},
	compileDirectives: function(parentModels, elem, erase) {		
		var attrDirectives = this.getAttrDirectives(elem, erase, parentModels);
		for (var k = 0; k < attrDirectives.length; k++) {
			var attrDirective = attrDirectives[k];
			var models = [];
			if (erase) {
				attrDirective.directive.unbind(elem, attrDirective.name, parentModels);
				attrDirective.directive.resolveModelNames(elem, attrDirective.name, parentModels, function(model) {
					console.log('directive unbind: ', elem, attrDirective.name);
					models.push(model);
					for (var name in model.bindings) {
						var bindings = model.bindings[name];
						for (var i = 0; i < bindings.length; i++) {
							var binding = bindings[i];
							if (binding.elem == elem) {
								bindings.splice(i, 1);
							}
						}
					}
				});
			} else {
				console.log('directive bind: ', elem, attrDirective.name);
				var models = attrDirective.directive.bind(elem, attrDirective.name, parentModels);
			}
			parentModels = (models || []).concat(parentModels);
			
			if (elem.__isFor_) {
				break;
			}
		}
		return parentModels;
	},
	getAttrDirectives: function(elem, erase, parentModels) {
		var attrDirectives = [];
		var additionalAttribs = [];
		function addDirectiveToList(name) {
			var directives = $cheeta.directive.get(name, parentModels);
			for (var i = 0; i < directives.length; i++) {
				var attrDirective = {name: name, directive: directives[i]}
				var index = attrDirectives.length;
				for (var j = attrDirectives.length - 1; j >= 0; j--) {
					if (attrDirective.order > attrDirectives[j].directive.order) {
						index = j + 1;
					}
				}
			}
			attrDirectives.splice(index, 0, attrDirective);
		};
		for (var k = 0; k < elem.attributes.length; k++) {
			var attr = elem.attributes[k];
			if (attr.specified) {
				var split = attr.name.split('.');
				if (split[split.length - 1] == '') {
					split.pop();
				} else {
					continue;
				}
				if (split.length > 1) {
					for (var i = 0; i < split.length - 1; i++) {
						addDirectiveToList(split[i] + '.');
						additionalAttribs.push({name: split[i] + '.', value: attr.value});
					}
//					elem.removeAttribute(attr.name)
				} else {
					addDirectiveToList(attr.name);
				}
			}
		}
		if (!erase) {
			while (additionalAttribs.length) {
				var attr = additionalAttribs.pop();
				elem.setAttribute(attr.name, attr.value);
			}
		}
		return attrDirectives;
	},
	runFutures: function() {
		for (var i = 0; i < $cheeta.future.evals.length; i++) {
			var expr = $cheeta.future.evals[i];
			if (expr instanceof Function) {
				expr();
			} else {
				eval(expr);
			}
		}
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
(function() {
	$cheeta.root.addDirective(new $cheeta.Directive('bind.').onBind(function(elem, attrName, parentModels) {
		this.fn = this.fn || {};
		this.fn[elem] = function(e) {
			setTimeout(function() {
				eval(elem.getAttribute(attrName) + '=\'' + elem.value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\'');
			}, 0);
		}
		$cheeta.directive.get('value.')[0].bind(elem, attrName, parentModels);
		$cheeta(elem).on('keydown keyup change', this.fn[elem]);
	}).onUnbind(function(elem, attrName, parentModels) {
		if (this.fn[elem]) {
			$cheeta(elem).off('keydown keyup change', this.fn[elem]);
		}
	}).order(800));
})();

(function() {
	var fn = function(elem, attrName, parentModels) {
		var defs = elem.getAttribute(attrName).split(/ *; */g);
		var models = [];
		
		for (var i = 0; i < defs.length; i++) {
			var def = defs[i];
			split = def.split(/ +as +/g);
			var name = split[0];
			var as = split.length > 1 ? split[1] : null;

			var binding = {
				elem: elem,
				attrName: 'ctrl', 
				as: as, 
			};
			models.push($cheeta.model.define(parentModels, name).bind(binding));
		}
		return models;
	};
	$cheeta.directive.add(new $cheeta.Directive('ctrl.').order(200).onBind(fn));
	$cheeta.directive.add(new $cheeta.Directive('model.').order(200).onBind(fn));
})();

$cheeta.directive.add(new $cheeta.Directive('').onValueChange(function(val, elem, attrName) {
	elem.setAttribute(this.baseAttrName, val);
}));


$cheeta.directive.add(new $cheeta.Directive('for.').order(100).onBind(function(elem, attrName, parentModels) {
	elem.__isFor_ = true;
	var split = elem.getAttribute(attrName).split(/ +in +/g), name, arrayVar, as;
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
		onChange: function(newLen, oldLen) {
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
					$cheeta.compiler.compile(this.parentModels.concat(arrayIndexModel), clone);
				}
			}
		}
	}
	var model = $cheeta.model.define(parentModels, name).bind(binding);
//	binding.parentModels = [model.parent].concat(parentModels);
	binding.parentModels = parentModels;

	elem.style.display = 'none';
	model.isArray = true;
	return [model];
}));

$cheeta.directive.add(new $cheeta.Directive('html.').onValueChange(function(val, elem, attrName, parentModels) {
	if (val != elem.innerHTML) {
		elem.innerHTML = val || '';
	}
}));

$cheeta.directive.add(new $cheeta.Directive('init.').onBind(function(elem, attrName, parentModels) {
	var expr = this.resolveModelNames(elem, attrName, parentModels);
	$cheeta.future.evals.push(expr);
}));

$cheeta.keyconsts = {
	'backspace':8,'tab':9,'enter':13,'shift':16,'ctrl':17,'alt':18,'space':32,'pause':19,'break':19,'capslock':20,'escape':27,'pageup':33,'pagedown':34,'end':35,
	'home':36,'left':37,'up':38,'right':39,'down arrow':40,'insert':45,	'delete':46,'colon':58, 'f1':112,'f2':113,'f3':114,'f4':115,'f5':116,'f6':117,'f7':118,
	'f8':119,'f9':120,'f10':121,'f11':122,'f12':123,'numlock':144,'scrolllock':145,'semicolon':186,'comma':188,'dash':189,'dot':190
};
$cheeta.directive.add(new $cheeta.Directive('on*').onBind(function(elem, attrName, parentModels) {
	this.listeners = [];
	var _listeners = this.listeners; 
	this.resolveModelNames(elem, attrName, parentModels);
	
	var baseAttrName = attrName.substring(attrName.indexOf('data-') == 0 ? 7 : 2, attrName.length - 1);
	var split = baseAttrName.split('-');
	(function bindEvent(event, key, attrName) {
		var fn = function(e) {
			eval(elem.getAttribute(attrName));
		};
		if (event.indexOf('key') == 0) {
			var keyFn = function(e) {
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
			};
			_listeners.push({event: event, fn: keyFn});
			elem.addEventListener(event, keyFn, false);			
		} else {
			var listenerFn = function(e) {
				fn.apply(elem, [e]);
			};
			_listeners.push({event: event, fn: listenerFn});
			elem.addEventListener(event, listenerFn, false);
		}
	})(split[0], split[1], attrName);
}).onUnbind(function(elem, attrName, parentModels) {
	for (var i = 0; i < this.listeners; i++) {
		var listener = this.listener[i];
		elem.removeEventListener(listener.event, listener.fn, false)
	}
}));

$cheeta.directive.add(new $cheeta.Directive('text.').onValueChange(function(val, elem, attrName, parentModels) {
	elem.innerHTML = '';
	elem.appendChild(document.createTextNode(val || ''));
	console.log('innerhtml after: ' +  elem.innerHTML);
}));

$cheeta.directive.add(new $cheeta.Directive('value.').onValueChange(function(val, elem, attrName, parentModels) {
	if (elem.value != val) {
		elem.value = val || null;
	}
}));
(function() {
	$cheeta.templates = $cheeta.templates || {}; 
	var _this = new $cheeta.Directive('view.').onValueChange(function(val, elem, attrName, parentModels) {
		if (!elem.__$cheeta_view_is_loading && val != null) {
			// to avoid infinite loop
			elem.__$cheeta_view_is_loading = true;
			try {
				var content = $cheeta.templates[val];
				if (content != null) {
					_this.loadView(elem, content, parentModels);
				} else {
					var url = val.indexOf('/') === 0 ? _this.baseURL + val : val;
					if (_this.cache[url] != null) {
						_this.loadView(elem, _this.cache[url], parentModels);
					} else {
						new $cheeta.XHR().open('get', url).onSuccess(function(xhr) {
							_this.cache[url] = xhr.data;
							_this.loadView(elem, xhr.data, parentModels);
						}).send();
					}
				}
			} finally {
				elem.__$cheeta_view_is_loading = false;
			}
		}
	}).order(900);
	_this.baseURL = window.location.protocol + "//" + window.location.hostname + 
		(window.location.port && ":" + window.location.port) + window.location.pathname;
	_this.loadView = function(elem, content, parentModels) {
		$cheeta.compiler.uncompileChildren(parentModels, elem);
		elem.innerHTML = content;
		$cheeta.compiler.compileChildren(parentModels, elem, true);
	};
	_this.cache = {};
	$cheeta.directive.add(_this);
})();
$cheeta.hash = {
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
		var toHash = function() {
			var hash = this.keyval[''] || '';
			for (var key in this.keyval) {
				if (key.length > 0) {
					hash += (hash.length > 0 ? '&' : '') + key + "=" + this.keyval[key];
				}
			}
			return hash;
		};
		window.location.hash = toHash();
		this.notify(key, val, oldVal);
	},
	init: function() {
		var loc = this;
		window.addEventListener('hashchange', function () {
			var hash = window.location.hash, index = 0, key = '', val, allKeys = {};
			try {
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
			} finally {
				loc.path = hash;
			}
		}, false);
	},
	get value() {
		return window.location.hash.length > 0 ? window.location.hash.substring(1) : window.location.hash;
	},
	set value(h) {		
		return window.location.hash = '#' + h;
	}
};
$cheeta.route = $cheeta.route || function(map, hashVal) {
	if (map == null) {
		return null;
	}
	var len = 0;
	var url = null;
	for (var key in map) {
		if (hashVal.indexOf(key) == 0 && len < key.length) {
			len = key.length;
			url = map[key];
		}
	}
	return url;
}