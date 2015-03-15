$cheeta.compiler = {
	recursiveCompile: function (node, modelsRefs, runInlineScripts, skipSiblings, skipNode) {
		if (node) {
			var skip = false;
			if (!skipNode) {
				if (node.nodeType === 1) {
					if (node.tagName.toLowerCase() === 'script' && !erase) {
						if (runInlineScripts && (node.parentNode == null ||
							node.parentNode.tagName.toLowerCase() !== 'head') &&
							(node.type == null || node.type === '' || node.type === 'text/javascript')) {
							var content = node.innerHTML || '';
							var head = document.getElementsByTagName('head')[0] || document.documentElement;
							var script = document.createElement('script');
							script.type = 'text/javascript';
							script.appendChild(document.createTextNode(content));
							head.insertBefore(script, head.firstChild);
							head.removeChild(script);
						} else if (node.type === 'text/cheeta-template') {
							$cheeta.templates[node.getAttribute('id')] = node.innerHTML || '';
						}
					}
					var dir = this.compileDirectives(node, modelsRefs);
					skip = dir.skip;
					modelsRefs = dir.refs;
				}
			}
			if (!skip) {
				this.recursiveCompile(node.firstChild, modelsRefs, runInlineScripts);
			}
			if (!skipSiblings) {
				this.recursiveCompile(node.nextSibling, modelsRefs, runInlineScripts);
			}
		}
	},
	compileDirectives: function (elem, modelRefs) {
		var attr, k;
		for (k = 0; k < elem.attributes.length; k++) {
			attr = elem.attributes[k];
			var directives = $cheeta.directives.get(attr.name);
			for (k = 0; k < directives.length; k++) {
				var dir = directives[k];
				var refs = dir.link(elem, attr.name, modelRefs);
				if (refs) {
					modelRefs = Object.copy(modelRefs);
					Object.copy(refs, modelRefs);
				}
			}
		}
		return {'refs': modelRefs, skip: directives.isTemplate};
	},
	doCompile: function () {
		this.recursiveCompile.apply(this, arguments);
		this.runFutures();
	},
	compile: function (elem, modelRefs, runInlineScripts) {
		this.doCompile(elem, modelRefs, runInlineScripts, true);
	},
	compileChildren: function (elem, modelRefs, runInlineScripts) {
		this.doCompile(elem, modelRefs, runInlineScripts, true, true);
	},
	runFutures: function () {
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