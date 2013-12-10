$cheeta.compiler = {
	recursiveCompile: function(parentModels, node, isDynamicContent, erase, skipSiblings) {
		if (node) {
			var models = parentModels;
			if (node.nodeType === 1) {
				if (node.tagName.toLowerCase() == 'script' && !erase) {
					var script = node;
					if (isDynamicContent && (script.parentNode == null || script.parentNode.tagName.toLowerCase() != 'head') && 
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
				if (erase) {
					models = (this.cleanUpBindings(node) || []).concat(parentModels);
				} else {
					models = this.compileDirectives(parentModels, node, erase);
				}
			}
			if (!node.__isFor_) {
				this.recursiveCompile(models, node.firstChild, isDynamicContent, erase);
			} else {
				node.__isFor_ = undefined;
			}
			if (!skipSiblings) {
				this.recursiveCompile(parentModels, node.nextSibling, isDynamicContent, erase);
			}
		}
	},
	compile: function(parentModels, elem, isDynamicContent) {
		$cheeta.future.evals = [];
		this.recursiveCompile(parentModels, elem, isDynamicContent, false, true);
		this.runFutures();
	},
	uncompile: function(parentModels, elem) {
		$cheeta.future.evals = [];
		this.recursiveCompile(parentModels, elem, false, true, true);
		this.runFutures();
	},
	cleanUpBindings: function(elem) {
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
			return elem.__$cheeta_models_;
		}
	},
	compileDirectives: function(parentModels, elem) {
		this.cleanUpBindings(elem);
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
				parentModels = (models || []).concat(parentModels);				
			}
			if (elem.__isFor_) {
				break;
			}
		}
		elem.__$cheeta_models_ = parentModels;
		return parentModels;
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