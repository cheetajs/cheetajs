if (!$cheeta) {
	var $cheeta = $cheeta || function(obj) {
		var wrap = [obj];
		wrap.on = function(events, fn) {
			var split = events.split(' ');
			for (var i = 0; i < split.length; i++) {
				if (split[i].length > 0) {
					obj.addEventListener(split[i], fn, false);
				}
			}
		};
		wrap.off = function(events, fn) {
			var split = events.split(' ');
			for (var i = 0; i < split.length; i++) {
				if (split[i].length > 0) {
					obj.removeEventListener(split[i], fn, false);
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
		this.bindings = [];
		this.parent = parent;
		this.names = [name];
		this.children = {};
		this.toExpr = function() {
			var expr = '';
			var model = this;
			while (model.parent != null && model.names[0] != null) {
				expr = (model.hasSpecialChar ? '[\'' + model.names[0] + '\']' : '.' + model.names[0]) + expr;
				model = model.parent;
			}
			
			return expr.substring(1);
		};
		this.createOrGetChild = function(name, hasSpecialChar) {
			var model = this.children[name];
			if (model === undefined) {
				model = new $cheeta.model.Model(this, name);
				$cheeta.model.interceptProp(model, this.value, name);
				this.children[name] = model;
				model.value = this.value == null ? undefined : this.value[name];
			}
			model.hasSpecialChar = hasSpecialChar; 
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
		this.bindModelChange = function(elem, attrName, onChange) {
			if (onChange) {
				this.bindings.push({elem: elem, attrName: attrName});
				console.log('binding: ' + this.toExpr(), elem, attrName, this.bindings.length);
				elem.addEventListener('$cheetaMC-' + attrName + '-' + this.toExpr(), onChange, false);
				if (this.value != null) {
					$cheeta.future.evals.push(onChange, {type: '$cheetaMC-' + attrName + '-' + this.toExpr(), 'detail': 
						{value: this.value, oldValue: null, target: this}});
				}
			}
		};
		this.unbindModelChange = function(elem, attrName, onChange) {
			elem.removeEventListener('$cheetaMC-' + attrName, onChange, false);
			for (var i = 0; i < this.bindings.length; i++) {
				var binding = this.bindings[i];
				if (binding.elem === elem && binding.attrName === attrName) {
					this.bindings.splice(i, 1);
				}
			}
			console.log('unbind: ', this.toExpr(), elem, attrName, this.bindings.length);
		};
		this.valueChange = function(val, oldVal) {
			if (val != oldVal) {
				for (var i = 0; i < this.bindings.length; i++) {
					console.log('dispatching: ' , this.toExpr(), i, this.bindings[i].elem, this.bindings[i].attrName, val);
					this.bindings[i].elem.dispatchEvent(new CustomEvent('$cheetaMC-' + this.bindings[i].attrName + '-' + this.toExpr(), 
							{'detail': {value: val, oldValue: oldVal, target: this}}));
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
					configurable: true
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
		if (name.search(/^ *\./) === 0) {
			// bind dot-starting to the first parent
			name = parentModels[0].names[0] + name;
		}
		
		var split = name.split(/ *\. *| *\[ */g);
		var rootName = split[0];
		var parentModel = $cheeta.model.root;
		for (var j = 0; j < parentModels.length; j++) {
			parentModel = parentModels[j];
			parentModel = this.findParentModel(parentModel, rootName);
			if (parentModel != $cheeta.model.root) {
				break;
			}
		}
		for (var i = parentModel === $cheeta.model.root ? 0 : 1; i < split.length; i++) {
			var hasSpecialChar = false, modelName = split[i];
			if (modelName.search(/\( *$/) > -1) {
				return [parentModel, modelName];
			} else if (modelName.search(/\] *$/) > -1) {
				modelName = modelName.replace(/^ *'|'? *] *$/g, '');
				hasSpecialChar = true;
			}
			parentModel = parentModel.children[modelName] || parentModel.createOrGetChild(modelName, hasSpecialChar);
		}
		return parentModel;
	}
};

$cheeta.refresh = function(modelRef) {
	var model = $cheeta.model.createOrGetModel(parentModels, modelRef);
	model.valueChange(eval(model.toExpr()), null);
};

$cheeta.model.root = $cheeta.model.root || new $cheeta.model.Model(null);
$cheeta.model.root.value = window;
$cheeta.root = $cheeta.model.root;

$cheeta.future = function(future) {
	$cheeta.future.evals.push(future);
};
$cheeta.future.evals = $cheeta.future.evals || [];

window.addEventListener('load', function() {
	if (!$cheeta.isInitialized) {
		$cheeta.isInitialized = true;
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
	this.onAttach = function(attachFn) {
		this.attach = attachFn;
		return this;
	};
	this.onDetach = function(detachFn) {
		this.detach = detachFn;
		return this;
	};
	this.onModelValueChange = function(changeFn) {
		var origAttach = this.attach;
		var origDetach = this.detach;
		this.attach = function(elem, attrName, parentModels) {
			var models = []
			if (origAttach) origAttach.apply(this);			
			if (!this.resolveModelNames(elem, attrName, parentModels, function(model) {
				models.push(model);
				var _this = this; 
				model.bindModelChange(elem, attrName, function(e) {
					var val = eval(elem.getAttribute(attrName));
					changeFn.apply(_this, [val, elem, attrName, parentModels]);
				});
			})) {
				changeFn.apply(this, [eval(elem.getAttribute(attrName)), elem, attrName, parentModels]);
			}
			return models;
		}
		this.detach = function(elem, attrName, parentModels) {
			var models = []; 
			if (origDetach) origDetach.apply(this);
			this.resolveModelNames(elem, attrName, parentModels, function(model) {
				models.push(model);
				model.unbindModelChange(elem, attrName);
			}, true);
			return models;
		}
		return this;
	};
//	this.lastId = String.fromCharCode(33); 
//	this.nextId = function() {
//		if (this.lastId.charCodeAt(0) === 126) {
//			this.lastId = String.fromCharCode(33) + this.lastId;
//		}
//		this.lastId[0] = String.fromCharCode(this.lastId.charCodeAt(0) + 1);
//		return this.lastId;
//	}
//	this.id = function(elem) {
//		return elem.__$cheeta__id_ || (elem.__$cheeta__id_ = this.this.nextId());
//	}; 
	this.resolveModelNames = function(elem, attrName, parentModels, onModel, skipSetAttribute) {
		var directive = this, hasModel = false;
		resolvedVal = this.parseModelVars(elem.getAttribute(attrName), function(modelRef) {
			var model = $cheeta.model.createOrGetModel(parentModels, modelRef);
			if (model instanceof Array) {
				var mexpr = model[0].toExpr();
				return mexpr + (mexpr.length > 0 ? '.' : '') + model[1];
			} else {
				onModel && onModel.call(directive, model);
				return model.toExpr();
			}
			hasModel = true;
		});
		skipSetAttribute || elem.setAttribute(attrName, resolvedVal);
		return hasModel;
	},
	this.parseModelVars = function(val, modelCallback) {
		function replaceModelVars(val) {
			this.modelVarRegExp = /(((((\. *)?[^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+)|\[ *([^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+|'(\\'|[^'])*') *\]) *)+\(?)|('(\\'|[^'])*')/g,
			this.reservedWords = '(abstract|else|instanceof|super|boolean|enum|int|switch|break|export|interface|synchronized|byte|extends|let|this|case|false|long|' +
				'throw|catch|final|native|throws|char|finally|new|transient|class|float|null|true|const|for|package|try|continue|function|private|typeof|debugger|' +
				'goto|protected|var|default|if|public|void|delete|implements|return|volatile|do|import|short|while|double|in|static|with)';
			return val.replace(this.modelVarRegExp, function(match) {
				if (match.charAt(0) === '\'' || match.charAt(0) === '"' || match === 'true' || match === 'false' || 
						match === 'undefined' || match === 'null' || match === 'NaN' || !isNaN(match)) {
					return match;
				} else {
					match = match.replace(/\[ *([^0-9'"].*?)\]/g, function(m, $1) {
						return '[' + replaceModelVars($1) + ']';
					});
					var reserved = '';
					match = match.replace(new RegExp('(^|\\W)' + this.reservedWords + '(\\W|$)', 'g'), function(m, $1, $2, $3) {
						reserved += $2 + '|';
						return $1 + '\'' + $2 + '\'' + $3; 
					});
					if (reserved.length > 0) {
						match = replaceModelVars(match);
						return match.replace(new RegExp('\'\(' + reserved.slice(0, -1) + '\)\'', 'g'), function(m) {
							return m.slice(1, -1);
						});
					} else {
						return modelCallback.call(this, match)
					}
				}
			});
		}
		return replaceModelVars(val);
	};
//	this.tokenizeAttrVal = function(val, onToken) {
//		var quote = null, regexpMod = false, index = -1, optionsSplitIndex = val.indexOf(';');
//		if (optionsSplitIndex > -1 && optionsSplitIndex) 
//		val += '\x1a';
//		for (var i = 0; i < val.length; i++) {
//			var ch = val.charAt(i);
//			if (quote != null) {
//				if (ch == quote && val.charAt(i - 1) != '\\') {
//					if (quote == '/') {
//						regexpMod = true;
//					}
//					quote = null;
//				}
//				onToken.onLiteral(ch);
//			} else {
//				if (regexpMod) {
//					if (ch < 'a' && ch > 'z') {
//						regexpMod = false;
//					}
//					onToken.onLiteral(ch);
//				} else if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === '!' || ch === '"' || ch === '[' || ch === ']' || 
//						(ch >= '%' && ch <= '/' && ch != '.') || (ch >= ':' && ch <= '?') || (ch >= '{' && ch <= '~') || ch === '^' || ch == '\x1a') {
//					if (ch === '\'' || ch === '"' || ch === '/') {
//						quote = ch;
//					}
//					if (index > -1) {
//						var name = val.substring(index, i);
//						if (name === 'true' || name === 'false' || name === 'undefined' || name === 'null' || 
//							name === 'NaN' || !isNaN(name)) {
//							onToken.onLiteral(name);
//						} else {
//							var ii = i;
//							while (val.charAt(ii) == ' ') {
//								ii++;
//							}
//							if (val.charAt(ii) == '(') {
//								var fnIndex = name.lastIndexOf('.');
//								if (fnIndex > -1) {
//									onToken.onFnVar(name.substring(0, fnIndex));
//									onToken.onLiteral(name.substring(fnIndex));
//								} else {
//									onToken.onLiteral(name);
//								}
//							} else {
//								onToken.onVar(name);
//							}
//						}
//						index = -1;
//					}
//					if (ch !== '\x1a') {
//						onToken.onLiteral(ch);
//					}
//				} else {
//					if (index == -1) {
//						index = i;
//					}
//				}
//			}
//		}
//	};
	$cheeta.model.get(model).addDirective(this);
};
$cheeta.Directive.get = function(name, parentModels) {
	if (name.indexOf('data-') == 0) {
		name = name.substring(5);
	}
	var endsWithDot = name.indexOf('.', name.length - 1) > -1;
	parentModels = parentModels || [$cheeta.model.root];
	for (var i = 0; i < parentModels.length; i++) {
		var model = parentModels[i];
		var directive = model.getDirective(name);
		if (directive == null && model.directives != null && model.directives['/'] != null && endsWithDot) {
			var indices = model.directives['/'];
			for (var k = 0; k < indices.length; k++) {
				directive = model.directives[name.substring(0, indices[k]) + '*'];
				if (directive != null) {
					return directive;
				}
			}
		} else {
			if (directive != null) {
				return directive;
			}
		}
	}
	return $cheeta.Directive.get('');
}
$cheeta.compiler = {
	recursiveCompile: function(parentModels, node, runInlineScripts, erase, skipSiblings, skipNode) {
		if (node) {
			var models = parentModels;
			if (!skipNode) {
				if (node.nodeType === 1) {
					if (node.tagName.toLowerCase() == 'script' && !erase) {
						if (runInlineScripts && (node.parentNode == null || node.parentNode.tagName.toLowerCase() != 'head') && 
								(node.type == null || node.type == '' || node.type === 'text/javascript')) {
							var content = node.innerHTML || "";
							var head = document.getElementsByTagName("head")[0] || document.documentElement;
						    var script = document.createElement("script");
						    script.type = "text/javascript";
						    script.appendChild(document.createTextNode(content));
						    head.insertBefore(script, head.firstChild);
						    head.removeChild(script);
						} else if (node.type === 'text/cheeta-template') {
							$cheeta.templates[node.getAttribute('id')] = node.innerHTML || "";
						}
					}
					models = this.compileDirectives(parentModels, node, erase);
				}
			}
			if (!node.__shouldSkipChildren_) {
				this.recursiveCompile(models, node.firstChild, runInlineScripts, erase);
			} else {
				node.__shouldSkipChildren_ = undefined;
			}
			if (!skipSiblings) {
				this.recursiveCompile(parentModels, node.nextSibling, runInlineScripts, erase);
			}
		}
	},
	doCompile: function() {
		this.recursiveCompile.apply(this, arguments);
		this.runFutures();
	},
	compile: function(parentModels, elem, runInlineScripts) {
		this.doCompile(parentModels, elem, runInlineScripts, false, true);
	},
	compileChildren: function(parentModels, elem, runInlineScripts) {
		this.doCompile(parentModels, elem, runInlineScripts, false, true, true);
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
				models = attrDirective.directive.detach && attrDirective.directive.detach(elem, attrDirective.attrName, parentModels);
			} else {
				models = attrDirective.directive.attach(elem, attrDirective.attrName, parentModels);				
			}
			parentModels = (models || []).concat(parentModels);
			
			if (attrDirective.directive.name == 'for.' || attrDirective.directive.name == 'show.') {
				elem.__shouldSkipChildren_ = true;
				break;
			}
		}
		return parentModels;
	},
	getAttrDirectives: function(elem, erase, parentModels) {
		var attrDirectives = [];
		var additionalAttribs = [];
		function addDirectiveToList(attr) {
			var directive = $cheeta.Directive.get(attr.name, parentModels);
			var attrDirective = {attrName: attr.name, directive: directive};
			var index;
			for (index = attrDirectives.length - 1; index >= 0; index--) {
				if (attrDirective.directive.order > attrDirectives[index].directive.order) {
					break;
				}
			}
			attrDirectives.splice(index + 1, 0, attrDirective);
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
					elem.removeAttribute(attr.name)
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
		$cheeta.future.evals = [];
		for (var i = 0; i < runs.length; i++) {
			var expr = runs[i];
			if (expr instanceof Function) {
				expr(runs[++i]);
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
	this.successCallbacks = []; this.completeCallbacks = []; this.errorCallbacks = []; this.stateChangeCallbacks = [];
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
		return xhr;
	};
	
	var _this = this;
	this.onError = function(callback) {
		_this.errorCallbacks.push(callback);
		return _this;
	};
	this.onSuccess = function(callback) {
		_this.successCallbacks.push(callback);
		return _this;
	};
	this.onComplete = function(callback) {
		_this.completeCallbacks.push(callback);
		return _this;
	};
	this.onStateChange = function(callback) {
		_this.stateChangeCallbacks.push(callback);
		return this;
	};
	
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (200 <= xhr.status && xhr.status < 300) {
				for (var i = 0; i < successCallbacks.length; i++) {
					successCallbacks[i].apply(target, [xhr]);
				}
				for (var i = 0; i < _this.successCallbacks.length; i++) {
					_this.successCallbacks[i].apply(target, [xhr]);
				}
			} else {
				for (var i = 0; i < errorCallbacks.length; i++) {
					errorCallbacks[i].apply(target, [xhr]);
				}
				for (var i = 0; i < _this.errorCallbacks.length; i++) {
					_this.errorCallbacks[i].apply(target, [xhr]);
				}
			}
			for (var i = 0; i < completeCallbacks.length; i++) {
				completeCallbacks[i].apply(target, [xhr]);
			}
			for (var i = 0; i < _this.completeCallbacks.length; i++) {
				_this.completeCallbacks[i].apply(target, [xhr]);
			}
			
        }
		for (var i = 0; i < stateChangeCallbacks.length; i++) {
			stateChangeCallbacks[i].apply(target, [xhr]);
		}		
		for (var i = 0; i < _this.stateChangeCallbacks.length; i++) {
			_this.stateChangeCallbacks[i].apply(target, [xhr]);
		}
	};
	Object.defineProperty(xhr, 'data', {
		get: function() {
			return xhr.getResponseHeader('Content-Type') === 'application/json' ? JSON.parse(xhr.responseText) : xhr.responseText;
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
		$cheeta.Directive.get('value.').attach(elem, attrName, parentModels);
		$cheeta(elem).on('keydown keyup change', this.fn[elem]);
	}).onDetach(function(elem, attrName, parentModels) {
		$cheeta.Directive.get('value.').detach(elem, attrName, parentModels);
		if (this.fn[elem]) {
			$cheeta(elem).off('keydown keyup change', this.fn[elem]);
		}
	}).setOrder(800);
})();

(function() {
	var attach = function(elem, attrName, parentModels) {
		//TODO handle app1['myapp,yourapp']
		var defs = elem.getAttribute(attrName).split(/ *, */g);
		var models = [];
		
		for (var i = 0; i < defs.length; i++) {
			var def = defs[i];
			//TODO handle app1['123 as 123']
			split = def.split(/ +as +/g);
			var name = split[0];
			var as = split.length > 1 ? split[1] : null;
			var model = $cheeta.model.createOrGetModel(parentModels, name);
			model.alias(as);
			models.push(model);
		}
		return models;
	};
	new $cheeta.Directive('ctrl.').setOrder(200).onAttach(attach).onDetach(attach);
	new $cheeta.Directive('model.').setOrder(200).onAttach(attach).onDetach(attach);
})();

new $cheeta.Directive('').onModelValueChange(function(val, elem, attrName) {
	var baseAttrName = attrName.substring(attrName.indexOf('data-') == 0 ? 5 : 0, attrName.length - 1);
	elem.setAttribute(baseAttrName, val);
});


new $cheeta.Directive('for.').setOrder(100).onAttach(function(elem, attrName, parentModels) {
	var parse = this.parseAttr(elem.getAttribute(attrName));
	var name = parse.name, as = parse.as, arrayVar = parse.arrayVar;
	
	var cloneElem = function(elem) {
		var clone = elem.cloneNode(true);
		clone.removeAttribute('for.');
		clone.removeAttribute('data-for.');
		clone.style.display = '';
		return clone;
	};
	
	var onChange = function(e) {
		if (!isNaN(e.detail.value) || !isNaN(e.detail.oldValue) || Array.isArray(e.detail.value) || Array.isArray(e.detail.oldValue)) {
			var newLen = e.detail.value, oldLen = e.detail.oldValue;
			if (newLen instanceof Object || oldLen instanceof Object) {
	//				$cheeta.model.interceptArray(newLen, this.update);
				newLen = newLen == null ? 0 : newLen.length;
				oldLen = oldLen == null ? 0 : oldLen.length;
			}
			if (oldLen > newLen) {
				for (var i = oldLen - 1; i >= newLen; i--) {
					var rmElem = elem.previousSibling;
					rmElem.parentNode.removeChild(rmElem);
					delete model.children[i];
				}
			} else if (oldLen < newLen) {
				for (var i = oldLen; i < newLen; i++) {
					var clone = cloneElem(elem);
					clone.setAttribute('model.', name + '[' + i + '] as ' + arrayVar[0] + 
							(elem.getAttribute('model.') ? (';' + elem.getAttribute('model.').value) : '')); 
					clone.style.display = '';
					elem.parentNode.insertBefore(clone, elem);
					var arrayIndexModel = new $cheeta.model.Model($cheeta.model.root, '$i');
					arrayIndexModel.toExpr = function() {return i;};
					$cheeta.compiler.compile(parentModels.concat(arrayIndexModel), clone);
				}
			}
		} else {
			var newVal = e.detail.value, oldVal = e.detail.oldValue, prevKey = null;
			var newKeys = (newVal && Object.keys(newVal)) || [], oldKeys = (oldVal && Object.keys(oldVal)) || [];
			
			var refElem = elem;
			var j = newKeys.length - 1, i = oldKeys.length - 1;
			while (i >= 0 || j >= 0) {
				if (oldKeys[i] != newKeys[j]) {
					if (j >= 0) {
						var clone = cloneElem(elem);
						clone.setAttribute('model.', (arrayVar[1] ? name + '[\'' + newKeys[j] + '\'] as ' + arrayVar[1] : '') + 
								(elem.getAttribute('model.') ? (';' + elem.getAttribute('model.').value) : '')); 
						elem.parentNode.insertBefore(clone, refElem);
						var arrayIndexModel = new $cheeta.model.Model($cheeta.model.root, '$i');
						arrayIndexModel.toExpr = function() {return j;};
						var keyModel = new $cheeta.model.Model($cheeta.model.root, arrayVar[0]);
						keyModel.toExpr = function() {return '\'' + newKeys[j] + '\'';};
						$cheeta.compiler.compile(parentModels.concat(arrayIndexModel, keyModel), clone);					
						refElem = clone;
						j--;
					} else {
						var rmElem = refElem.previousSibling;
						rmElem.parentNode.removeChild(rmElem);
						delete model.children[oldKeys[i]];
						i--;
					}
				} else {
					model.children[oldKeys[i]].valueChange(newVal[newKeys[j]], oldVal[oldKeys[i]]);
					j--;
					i--;
				}
			}
//			model.isArray = true;
		}
	}
	var model = $cheeta.model.createOrGetModel(parentModels, name);
	model.bindModelChange(elem, attrName, onChange);
	model.alias(as);
	if (arrayVar.length === 1) {
		model.isArray = true;
	}
	elem.style.display = 'none';
	
	return [model];
}).onDetach(function(elem, attrName, parentModels) {
	var parse = this.parseAttr(elem.getAttribute(attrName));
	var name = parse.name;
	var model = $cheeta.model.createOrGetModel(parentModels, name);
	model.unbindModelChange(elem, attrName);
	return [model];
}).parseAttr = function(val) {
	//TODO handle app1['a in b']
	var split = val.split(/ +in +/g);
	var name = split[1];
	var arrayVar = split[0].split(',');
	//TODO handle app1['a as b']
	split = name.split(/ +as +/g);
	name = split[0];
	var as = split.length > 1 ? split[1] : null;
	return {as: as, name: name, arrayVar: arrayVar};
};

new $cheeta.Directive('html.').onModelValueChange(function(val, elem) {
	if (val != elem.innerHTML) {
		elem.innerHTML = val == null ? '' : val;
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
			elem.addEventListener(event, keyFn, false);			
		} else {
			var listenerFn = function(e) {
				fn.apply(elem, [e]);
			};
			elem.addEventListener(event, listenerFn, false);
		}
	})(split[0], split[1], attrName);
});

new $cheeta.Directive('show.').onModelValueChange(function(val, elem, attrName, parentModels) {
	if (val) {
		elem.style.display = '';
		if (!elem.__isCompiled_) {
			elem.__isCompiled_ = true;
			$cheeta.compiler.compileChildren(parentModels, elem);
		}
	} else {
		elem.style.display = 'none';
	}
});

new $cheeta.Directive('text.').onModelValueChange(function(val, elem) {
	elem.innerHTML = '';
	elem.appendChild(document.createTextNode(val == null ? '' : val));
	console.log('innerhtml after: ' +  elem.innerHTML);
});

new $cheeta.Directive('value.').onModelValueChange(function(val, elem) {
	if (elem.value != val) {
		elem.value = val || null;
	}
});
(function() {
	$cheeta.templates = $cheeta.templates || {};
	var viewDirective = new $cheeta.Directive('view.').onModelValueChange(function(val, elem, attrName, parentModels) {
		if (!elem.__$cheeta_view_is_loading && val != null) {
			// to avoid infinite loop
			elem.__$cheeta_view_is_loading = true;
			try {
				var view, cacheSize = 10; 
				var content = $cheeta.templates[val];
				if (content != null) {
					this.loadView(elem, content, parentModels);
				} else {
					var url = val.indexOf('/') === 0 ? this.baseURL + val : val;
					if (this.cache[url] != null) {
						this.loadView(elem, this.cache[url], parentModels);
					} else {
						console.log('XHR: ' + url)
						new $cheeta.XHR(this).open('get', url).onSuccess(function(xhr) {
							if (this.cache.size >= cacheSize) {
								this.cache
							}
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
		var _this = this;
		var toHash = function() {
			var hash = _this.keyval[''] || '';
			for (var key in _this.keyval) {
				if (key.length > 0) {
					hash += (hash.length > 0 ? '&' : '') + key + "=" + _this.keyval[key];
				}
			}
			return hash;
		};
		window.location.hash = toHash();
		this.notify(key, val, oldVal);
	},
	init: function() {
		var _this = this;
		var updateHash = function() {
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
		}
		updateHash();
		window.addEventListener('hashchange', function () {
			updateHash();
		}, false);
	},
	get: function(key) {
		return this.keyval[key || ''];
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