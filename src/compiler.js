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
		this.recursiveCompile(parentModels, elem, skipSiblings)
		this.runFutures();
	},
	findDirective: function(elem, directive) {
		return elem.getAttribute(directive + '.') || elem.getAttribute('data-' + directive + '.');
	},
	compileDirectives: function(parentModels, elem) {
		var attribs = [];
		for (var k = 0; k < elem.attributes.length; k++) {
			var attr = elem.attributes[k];
			attribs.push(attr);
		}
		//ordering the directives 'bind'/'ctrl' > 'for' > 'template'
		attribs = attribs.sort(function(a, b) {
			return (a.name > b.name) ? 1 : -1; 
		});
		for (var k = 0; k < attribs.length; k++) {
			var attr = attribs[k];
			if (attr.specified) {
				if (attr.name.indexOf('.', attr.name.length - 1) !== -1) {
					var attrName = attr.name.substring(0, attr.name.length - 1);
					if (attrName.indexOf('data-') == 0) {
						attrName = attrName.substring('data-'.length);
					}
					if (attrName === 'for') {
						elem.__isFor_ = true;
					}
					var directive = $cheeta.directives[attrName] || $cheeta.directives[''];
					parentModels = (directive(elem, attr, parentModels, attrName) || []).concat(parentModels);
				}
			}
		}
		return parentModels;
	},
	compile: function() {
		$cheeta.futureEvals = [];
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
		for (var i = 0; i < $cheeta.futureEvals.length; i++) {
			eval($cheeta.futureEvals[i]);
		}
		for (var i = 0; i < $cheeta.futureUpdates.length; i++) {
			var binding = $cheeta.futureUpdates[i];
			binding.binding.update(binding.model);
		}
		$cheeta.futureEvals = [];
		$cheeta.futureUpdates = [];
	}
};