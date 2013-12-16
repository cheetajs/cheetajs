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
				if (models) {
					models.map(function(model) {
						expr = model.toExpr()
						if (!$cheeta.future.evals[0][expr]) {
							$cheeta.future.evals[0][expr] = function() {
								if (model.value != null) {
									model.valueChange(model.value, null);
								}
							};   
						}
					});
				}
				
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
			var index;
			for (var i = 0; i < directives.length; i++) {
				var attrDirective = {name: name, directive: directives[i]};
				for (index = attrDirectives.length - 1; index >= 0; index--) {
					if (attrDirective.directive.order > attrDirectives[index].directive.order) {
						break;
					}
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
		for (var key in $cheeta.future.evals[0]) {
			var fn = $cheeta.future.evals[0][key];
			delete $cheeta.future.evals[0][key];
			fn();
		}
		while ($cheeta.future.evals.length - 1) {
			var expr = $cheeta.future.evals.splice(-1, 1)[0];
			if (expr instanceof Function) {
				expr();
			} else {
				eval(expr);
			}
		}
		$cheeta.future.evals = [{}];
	}
};