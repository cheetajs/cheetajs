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
				models = attrDirective.directive.unbind(elem, attrDirective.attrName, parentModels);
			} else {
				models = attrDirective.directive.bind(elem, attrDirective.attrName, parentModels);				
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
			var directives = $cheeta.directive.get(attr.name, parentModels);
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