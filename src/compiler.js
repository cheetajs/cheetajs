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
	compileDirectives: function(parentModels, elem, erase) {
		var attrDirectives = [];
		var additionalAttribs = [];
		function addDirectiveToList(name) {
			//TODO start from here
			var directive = {name: name + '.', directives: $cheeta.directive.get(name)};
			for (var j = attrDirectives.length - 1; j >= 0; j--) {
				if (directive.order > attrDirectives[j].directive.order) {
					attrDirectives.splice(j + 1, 0, directive);
				}
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
		while (additionalAttribs.length) {
			var attr = additionalAttribs.pop();
			elem.setAttribute(attr.name, attr.value);
		}
		
		for (var k = 0; k < attrDirectives.length; k++) {
			var attrDirective = attrDirectives[k];
			if (attrDirective.directives != null) {
				for (var i = 0; i < attrDirective.directives.length; i++) {
					var directive = attrDirective.directives[i];
					var models = directive.bind(elem, directive.name, parentModels);
					parentModels = (models || []).concat(parentModels);
				}
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