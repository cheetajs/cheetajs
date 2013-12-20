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
		this.listeners = [];
		this.parent = parent;
		this.names = [name];
		this.children = {};
		this.toExpr = function() {
			var expr = '';
			var model = this;
			while (model.parent != null && model.names[0] != null) {
				var ch = model.names[0].charAt(0);
				expr = (ch >= '0' &&  ch <= '9' ? '[' + model.names[0] + ']' : '.' + model.names[0]) + expr;
				model = model.parent;
			}
			
			return expr.substring(1);
		};
		this.createOrGetChild = function(name) {
			var model = this.children[name];
			if (model === undefined) {
				model = new $cheeta.model.Model(this, name);
				$cheeta.model.interceptProp(model, this.value, name);
				this.children[name] = model;
				model.value = this.value == null ? undefined : this.value[name];
			}
			if (this.value == null) {
				this.value = this.isArray ? [] : {};
			}
			return model;
		};
		this.alias = function(alias) {
			if (alias != null && alias != this.names[0]) {
				this.names.push(alias);
			}			
		};
		this.addChangeListener = function(onChange, target) {
			if (onChange) {
				var fn = function() {
					onChange.apply(target, arguments);
				};
				this.listeners.push(fn);
				if (this.value != null) {
					$cheeta.future.evals.push(fn);
				}
			}
			return onChange;
		};
		this.removeChangeListener = function(onChange) {
			var index = this.listeners.indexOf(onChange);
			if (index > -1) {
				return this.listeners.splice(index, 1);
			}
			return null;
		};
		this.valueChange = function(val, oldVal) {
			if (val != oldVal) {
				for (var i = 0; i < this.listeners.length; i++) {
					this.listeners[i](val, oldVal);
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
		}
	},
	findParentModel: function(model, rootName) {
		while (model != $cheeta.model.root) {
			if (model.names.indexOf(rootName) > -1) {
				return model;
			}
			model = model.parent;
		}
		return model;
	},
	get: function(ref) {
		return this.createOrGetModel(null, ref); 
	},
	createOrGetModel: function(parentModels, name) {
		if (name == null) {
			return $cheeta.model.root;
		}
		if (parentModels == null) {
			parentModels = [$cheeta.model.root];
		}
		if (name === '$i') {
			for (var i = parentModels.length - 1; i >= 0; i--) {
				if (parentModels[i].names[0] == '$i') {
					return parentModels[i];
				}
			}
		}		
		if (name.charAt(0) === '.') {
			// bind dot-starting to the first parent
			name = parentModels[0].names[0] + name;
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
			name = parentModel.names[0];
			parentModel = parentModel.parent;
		} else {
			for (var i = parentModel === $cheeta.model.root ? 0 : 1; i < split.length - 1; i++) {
				parentModel = parentModel.children[split[i]] || parentModel.createOrGetChild(split[i]);
			}
		}
		return parentModel.createOrGetChild(name);
	}
};

$cheeta.model.root = $cheeta.model.root || new $cheeta.model.Model(null);
$cheeta.model.root.value = window;
$cheeta.root = $cheeta.model.root;

window.addEventListener('load', function() {
	if (!$cheeta.isInitialized) {
		$cheeta.isInitialized = true;
		$cheeta.future = {evals: [{}]};
		$cheeta.hash.init();
		$cheeta.compiler.compile([$cheeta.model.root], document.documentElement);
	}
}, false);
$cheeta.Directive = function(name, model) {	 
	this.name = name;
	this.isGlobal = function() {
		return this.name.indexOf('*', this.name.length - 1) > -1; 
	};
	this.order = 1000;
	this.setOrder = function(val) {
		this.order = val;
		return this;
	};
	this.onAttach = function(fn) {
		this.attach = fn;
		return this;
	};
	this.onDetach = function(fn) {
		this.detach = fn;
		return this;
	};
	this.onModelChange = function(fn) {
		this.modelChangeListeners = this.modelChangeListeners || {};
		var origAttach = this.attach;
		this.onAttach(function(elem, attrName, parentModels) {
			var models = []
			if (origAttach) origAttach();			
			this.resolveModelNames(elem, attrName, parentModels, function(model) {
				models.push(model);
				this.modelChangeListeners[elem.] = model.addChangeListener(function() {
					var val = eval(elem.getAttribute(attrName));
					fn.apply(this, [val, elem, attrName, parentModels]);
				}, this);
			});
			return models;
		});
		this.onDetach(function(elem, attrName, parentModels) {
			var models = []; 
			this.resolveModelNames(elem, attrName, parentModels, function(model) {
				console.log('directive unbind: ', elem, attrName);
				models.push(model);
				model.removeChangeListener(modelChangeListener);
			}, true);
			return models;
		});

		return this;
	};
	this.lastId = String.fromCharCode(33); 
	this.nextId = function() {
		if (this.lastId.charCodeAt(0) === 126) {
			this.lastId = String.fromCharCode(33) + this.lastId;
		}
		this.lastId[0] = String.fromCharCode(this.lastId.charCodeAt(0) + 1);
		return this.lastId;
	}
	this.id = function(elem) {
		return elem.__$cheeta__id_ || (elem.__$cheeta__id_ = this.this.nextId());
	}; 
	this.resolveModelNames = function(elem, attrName, parentModels, onModel, skipSetAttribute) {
		var resolvedVal = '';
		var models = [], directive = this;
		this.tokenizeAttrVal(elem.getAttribute(attrName), {
			onVar: function(t) {
				var model = $cheeta.model.createOrGetModel(parentModels, t)
				models.push(model);
				resolvedVal += model.toExpr();
				onModel && onModel.apply(directive, [model]);
			},
			onLiteral: function(t) {
				resolvedVal += t;
			},
			onFnVar: function(t) {
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
									onToken.onFnVar(name.substring(0, fnIndex));
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
	$cheeta.model.get(model).addDirective(this);
};
$cheeta.Directive.get = function(name, parentModels) {
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
	return directives.length == 0 ? $cheeta.Directive.get('') : directives;
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
	doCompile: function() {
		this.recursiveCompile.apply(this, arguments);
		this.runFutures();
	},
	compile: function(parentModels, elem, isAjaxLoaded) {
		this.doCompile(parentModels, elem, isAjaxLoaded, false, true);
	},
	compileChildren: function(parentModels, elem, isAjaxLoaded) {
		this.doCompile(parentModels, elem, isAjaxLoaded, false, true, true);
	},
	uncompile: function(parentModels, elem) {
		this.doCompile(parentModels, elem, false, true, true);
	},
	uncompileChildren: function(parentModels, elem) {
		this.doCompile(parentModels, elem, false, true, true, true);
	},
	compileDirectives: function(parentModels, elem, erase) {		
		var attrDirectives = this.getAttrDirectives(elem, erase, parentModels);
		for (var k = 0; k < attrDirectives.length; k++) {
			var attrDirective = attrDirectives[k];
			var models;
			if (erase) {
				models = attrDirective.directive.detach(elem, attrDirective.attrName, parentModels);
			} else {
				models = attrDirective.directive.attach(elem, attrDirective.attrName, parentModels);				
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
		function addDirectiveToList(attr) {
			var directives = $cheeta.Directive.get(attr.name, parentModels);
			for (var i = 0; i < directives.length; i++) {
				var attrDirective = {attrName: attr.name, directive: directives[i]};
				var index;
				for (index = attrDirectives.length - 1; index >= 0; index--) {
					if (attrDirective.directive.order > attrDirectives[index].directive.order) {
						break;
					}
				}
				attrDirectives.splice(index + 1, 0, attrDirective);
			}
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
					for (var i = 0; i < split.length; i++) {
						additionalAttribs.push({name: split[i] + '.', value: attr.value});
					}
//					elem.removeAttribute(attr.name)
				} else {
					addDirectiveToList(attr);
				}
			}
		}
		while (additionalAttribs.length) {
			var attr = additionalAttribs.pop();
			if (elem.getAttribute(attr.name) == null) {
				elem.setAttribute(attr.name, attr.value);
			}
			addDirectiveToList(elem.attributes[attr.name]);
		}
		return attrDirectives;
	},
	runFutures: function() {
		var runs = $cheeta.future.evals.slice(0);
		$cheeta.future.evals = [{}];
		for (var elem in runs[0]) {
			for (var attrName in runs[0][elem]) {
				console.log('onchange ', elem, attrName);
				runs[0][elem][attrName](elem, attrName);
			}
		}
		for (var i = 0; i < runs.length; i++) {
			var expr = runs[i];
			if (expr instanceof Function) {
				expr();
			} else {
				eval(expr);
			}
		}
	}
};
$cheeta.XHR = function(target) {
	target = target || this;
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
					successCallbacks[i].apply(target, [xhr]);
				}
			} else {
				for (var i = 0; i < errorCallbacks.length; i++) {
					errorCallbacks[i].apply(target, [xhr]);
				}
			}
			for (var i = 0; i < completeCallbacks.length; i++) {
				completeCallbacks[i].apply(target, [xhr]);
			}
        }
		for (var i = 0; i < stateChangeCallbacks.length; i++) {
			stateChangeCallbacks[i].apply(target, [xhr]);
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
	new $cheeta.Directive('bind.').onAttach(function(elem, attrName, parentModels) {
		this.fn = this.fn || {};
		this.fn[elem] = function(e) {
			setTimeout(function() {
				eval(elem.getAttribute(attrName) + '=\'' + elem.value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\'');
			}, 0);
		}
		$cheeta.Directive.get('value.')[0].attach(elem, attrName, parentModels);
		$cheeta(elem).on('keydown keyup change', this.fn[elem]);
	}).onDetach(function(elem, attrName, parentModels) {
		if (this.fn[elem]) {
			$cheeta(elem).off('keydown keyup change', this.fn[elem]);
		}
	}).setOrder(800);
})();

(function() {
	var attach = function(elem, attrName, parentModels) {
		var defs = elem.getAttribute(attrName).split(/ *; */g);
		var models = [];
		
		for (var i = 0; i < defs.length; i++) {
			var def = defs[i];
			split = def.split(/ +as +/g);
			var name = split[0];
			var as = split.length > 1 ? split[1] : null;
			var model = $cheeta.model.createOrGetModel(parentModels, name);
			model.alias(as);
			models.push(model);
		}
		return models;
	};
	new $cheeta.Directive('ctrl.').setOrder(200).onAttach(attach);
	new $cheeta.Directive('model.').setOrder(200).onAttach(attach);
})();

new $cheeta.Directive('').onModelChange(function(val, elem, attrName) {
	var baseAttrName = attrName.substring(attrName.indexOf('data-') == 0 ? 5 : 0, attrName.length - 1);
	elem.setAttribute(baseAttrName, val);
});


new $cheeta.Directive('for.').setOrder(100).onAttach(function(elem, attrName, parentModels) {
	elem.__isFor_ = true;
	var split = elem.getAttribute(attrName).split(/ +in +/g);
	var name = split[1];
	var arrayVar = split[0];
	split = name.split(/ +as +/g);
	name = split[0];
	var as = split.length > 1 ? split[1] : null;
	var elems = [];
	var onChange = function(newLen, oldLen) {
		if (newLen instanceof Object || oldLen instanceof Object) {
//				$cheeta.model.interceptArray(newLen, this.update);
			newLen = newLen == null ? 0 : newLen.length;
			oldLen = oldLen == null ? 0 : oldLen.length;
		}
		if (oldLen > newLen) {
			for (var i = oldLen - 1; i >= newLen; i--) {
				var rmElem = elems.pop();
				rmElem.parentNode.removeChild(rmElem);
				delete model.children[i];
			}
		} else if (oldLen < newLen) {
			for (var i = oldLen; i < newLen; i++) {
				var clone = elem.cloneNode();
				elems.push(clone);
				clone.removeAttribute('for.');
				clone.removeAttribute('data-for.');
				clone.setAttribute('model.', name + '.' + i + ' as ' + arrayVar + 
						(elem.getAttribute('model.') ? (';' + elem.getAttribute('model.').value) : '')); 
				clone.style.display = '';
				elem.parentNode.insertBefore(clone, elem);
				var arrayIndexModel = new $cheeta.model.Model($cheeta.model.root, '$i');
				arrayIndexModel.toExpr = function() {
					return i;
				};
				$cheeta.compiler.compile(parentModels.concat(arrayIndexModel), clone);
			}
		}
	}
	var model = $cheeta.model.createOrGetModel(parentModels, name);
	model.addChangeListener(onChange, this);
	model.alias(as);
//	binding.parentModels = parentModels;

	elem.style.display = 'none';
	model.isArray = true;
	return [model];
});

new $cheeta.Directive('html.').onModelChange(function(val, elem, attrName, parentModels) {
	if (val != elem.innerHTML) {
		elem.innerHTML = val || '';
	}
});

new $cheeta.Directive('init.').onAttach(function(elem, attrName, parentModels) {
	var expr = this.resolveModelNames(elem, attrName, parentModels);
	$cheeta.future.evals.push(expr);
});

$cheeta.keyconsts = {
	'backspace':8,'tab':9,'enter':13,'shift':16,'ctrl':17,'alt':18,'space':32,'pause':19,'break':19,'capslock':20,'escape':27,'pageup':33,'pagedown':34,'end':35,
	'home':36,'left':37,'up':38,'right':39,'down arrow':40,'insert':45,	'delete':46,'colon':58, 'f1':112,'f2':113,'f3':114,'f4':115,'f5':116,'f6':117,'f7':118,
	'f8':119,'f9':120,'f10':121,'f11':122,'f12':123,'numlock':144,'scrolllock':145,'semicolon':186,'comma':188,'dash':189,'dot':190
};
new $cheeta.Directive('on*').onAttach(function(elem, attrName, parentModels) {
	this.resolveModelNames(elem, attrName, parentModels);
	
	var baseAttrName = attrName.substring(attrName.indexOf('data-') == 0 ? 7 : 2, attrName.length - 1);
	var split = baseAttrName.split('-');
	(function bindEvent(event, key, attrName) {
		var fn = function(e) {
			eval(elem.getAttribute(attrName));
		};
		elem.__$cheeta_event_listeners = elem.__$cheeta_event_listeners || [];
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
			elem.__$cheeta_event_listeners.push({event: event, fn: keyFn});
			elem.addEventListener(event, keyFn, false);			
		} else {
			var listenerFn = function(e) {
				fn.apply(elem, [e]);
			};
			elem.__$cheeta_event_listeners.push({event: event, fn: listenerFn});
			elem.addEventListener(event, listenerFn, false);
		}
	})(split[0], split[1], attrName);
}).onDetach(function(elem, attrName, parentModels) {
	var listeners = elem.__$cheeta_event_listeners;
	for (var i = 0; i < listeners.length; i++) {
		var listener = listeners[i];
		elem.removeEventListener(listener.event, listener.fn, false)
	}
});

new $cheeta.Directive('text.').onModelChange(function(val, elem, attrName, parentModels) {
	elem.innerHTML = '';
	elem.appendChild(document.createTextNode(val || ''));
	console.log('innerhtml after: ' +  elem.innerHTML);
});

new $cheeta.Directive('value.').onModelChange(function(val, elem, attrName, parentModels) {
	if (elem.value != val) {
		elem.value = val || null;
	}
});
(function() {
	$cheeta.templates = $cheeta.templates || {}; 
	var viewDirective = new $cheeta.Directive('view.').onModelChange(function(val, elem, attrName, parentModels) {
		if (!elem.__$cheeta_view_is_loading && val != null) {
			// to avoid infinite loop
			elem.__$cheeta_view_is_loading = true;
			try {
				var content = $cheeta.templates[val];
				if (content != null) {
					this.loadView(elem, content, parentModels);
				} else {
					var url = val.indexOf('/') === 0 ? this.baseURL + val : val;
					if (this.cache[url] != null) {
						this.loadView(elem, this.cache[url], parentModels);
					} else {
						new $cheeta.XHR(this).open('get', url).onSuccess(function(xhr) {
							this.cache[url] = xhr.data;
							this.loadView(elem, xhr.data, parentModels);
						}).send();
					}
				}
			} finally {
				elem.__$cheeta_view_is_loading = false;
			}
		}
	}).setOrder(900);
	viewDirective.baseURL = window.location.protocol + "//" + window.location.hostname + 
		(window.location.port && ":" + window.location.port) + window.location.pathname;
	viewDirective.loadView = function(elem, content, parentModels) {
		$cheeta.compiler.uncompileChildren(parentModels, elem);
		elem.innerHTML = content;
		$cheeta.compiler.compileChildren(parentModels, elem, true);
	};
	viewDirective.cache = {};
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
		if (this.watchers[key].indexOf(fn) === -1) {
			this.watchers[key].push(fn);
		}
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
		var _this = this;
		window.addEventListener('hashchange', function () {
			var hash = window.location.hash, index = 0, key = '', val, allKeys = {};
			try {
				hash = hash.substring(hash.length > 1 && hash.charAt(2) == '&' ? 2 : 1);
				for (var i = 0; i <= hash.length; i++) {
					if (hash.charAt(i) == '&' || i == hash.length) {
						val = hash.substring(index, i);
						if (_this.keyval[key] == null || _this.keyval[key] != val) {
							var prev = _this.keyval[key]; 
							_this.keyval[key] = val;
							_this.notify(key, val, prev);
						}
						index = i + 1;
						allKeys[key] = true;
						key = '';
					} else if (hash.charAt(i) == '=') {
						key = hash.substring(index, i);
						index = i + 1;
					}
				}
				
				for (var key in _this.keyval) {
					if (allKeys[key] == null) {
						var prev = _this.keyval[key];
						delete _this.keyval[key];
						_this.notify(key, null, prev);
					} 
				}
			} finally {
				_this.value = hash;
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