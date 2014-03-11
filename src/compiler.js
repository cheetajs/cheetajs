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
					elem.removeAttribute(attr.name);
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
			if (Array.isArray(expr)) {
				expr[0].call(expr.slice(1));
			} else {
				eval(expr);
			}
		}
	}
};