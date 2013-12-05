$cheeta.directives = {
	'*': []
};

$cheeta.directive = function(name, fn, order) {
	if (fn == null) {
		var directive = $cheeta.directives[name];
		if (directive == null) {
			var wildcards = $cheeta.directives['*']
			for (var i = 0; i < wildcards.length; i++) {
				if (name.indexOf(wildcards[i].name) == 0) {
					directive = wildcards[i];
					break;
				}
			}
		}
		return directive || (name.indexOf('.', name.length - 1) > -1 ? $cheeta.directive('') : null); 
	}
	var index = name.indexOf('*', name.length - 1);
	if (index > -1) {
		name = name.substring(0, name.length - 1);
		$cheeta.directives['*'].push({name: 'data-' + name, fn: fn, order: order}, {name: name, fn: fn, order: order});
		return $cheeta.directives['*'][1]; 
	} else {
		return $cheeta.directives['data-' + name] = $cheeta.directives[name] = {name: name, fn: fn, order: order || 10000};
	}
}

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
		for (var k = 0; k < elem.attributes.length; k++) {
			var attr = elem.attributes[k];
			if (attr.specified) {
				attribs.push(attr);
			}
		}
		//ordering the directives 'bind'/'ctrl' > 'for' > 'template'
		attribs = attribs.sort(function(a, b) {
			function order(d) {
				return d == null ? $cheeta.directive('').order : d.order;  
			}
			return order($cheeta.directive(a.name)) - order($cheeta.directive(b.name));
		});
		for (var k = 0; k < attribs.length; k++) {
			var attr = attribs[k];
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