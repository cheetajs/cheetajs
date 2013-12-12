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
					if (erase) {
						models = (this.cleanUpBindings(node) || []).concat(parentModels);
					} else {
						models = this.compileDirectives(parentModels, node, erase);
					}
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
	compileDirectives: function(parentModels, elem, erase) {		
		var attrDirectives = this.getAttrDirectives(elem, erase);
		for (var k = 0; k < attrDirectives.length; k++) {
			var attrDirective = attrDirectives[k];
			var models;
			if (erase) {
				if (attrDirective.directive.unbind) {
					attrDirective.directive.unbind(elem, attrDirective.name, parentModels);
				} 
				$cheeta.directive.resolveModelRefs(elem, attrDirective.name, parentModels, new function(model) {
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
				var models = attrDirective.directive.bind(elem, attrDirective.name, parentModels);
			}
			parentModels = (models || []).concat(parentModels);
			
			if (elem.__isFor_) {
				break;
			}
		}
		return parentModels;
	},
	getAttrDirectives: function(elem, erase) {
		var attrDirectives = [];
		var additionalAttribs = [];
		function addDirectiveToList(name) {
			var directives = $cheeta.directive.get(name);
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