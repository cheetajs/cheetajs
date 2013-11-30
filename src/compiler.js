$cheeta.compiler = {
	recursiveCompile: function(parentModels, node, skipSiblings) {
		if (node) {
			var models = parentModels;
			if (node.nodeType === 1) {
				models = this.compileDirectives(parentModels, node);
			}
			this.recursiveCompile(models, node.firstChild);
			if (!skipSiblings) {
				this.recursiveCompile(parentModels, node.nextSibling);
			}
		}
	},
	findDirective: function(elem, directive) {
		return elem.getAttribute(directive + '.') || elem.getAttribute('data-' + directive + '.');
	},
	compileDirectives: function(parentModels, elem) {
		for (var k = 0; k < elem.attributes.length; k++) {
			var attr = elem.attributes[k];
			if (attr.specified) {
				if (attr.name.indexOf('.', attr.name.length - 1) !== -1) {
					var attrName = attr.name.substring(0, attr.name.length - 1);
					if (attrName.indexOf('data-') == 0) {
						attrName = attrName.substring('data-'.length);
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
		for (var i = 0; i < $cheeta.futureEvals.length; i++) {
			eval($cheeta.futureEvals[i]);
		}
	}
};