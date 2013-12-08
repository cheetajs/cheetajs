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
	compileDirectives: function(parentModels, elem) {
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
		//ordering the directives 'bind'/'ctrl' > 'for' > 'template'
		attribs = attribs.sort(function(a, b) {
			function order(d) {
				return d == null ? $cheeta.directive('').order : d.order;  
			}
			return order($cheeta.directive(a.name)) - order($cheeta.directive(b.name));
		});
		console.log('compiling attibutes', attribs);
		for (var k = 0; k < attribs.length; k++) {
			var attr = attribs[k];
			console.log('compiling attr', attr);
			var directive = $cheeta.directive(attr.name);
			if (directive != null) {
				parentModels = (directive.fn(elem, attr, parentModels) || []).concat(parentModels);				
			}
			if (elem.__isFor_) {
				break;
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