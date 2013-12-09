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
		$cheeta.future.evals = [];
		this.recursiveCompile(parentModels, elem, skipSiblings);
		this.runFutures();
	},
	cleanUpFromModel: function(elem) {
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
		}
	},
	compileDirectives: function(parentModels, elem) {
		this.cleanUpFromModel(elem);
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
		attribs = attribs.sort(function(a, b) {
			function order(d) {
				return d == null ? $cheeta.directive('').order : d.order;  
			}
			return order($cheeta.directive(a.name)) - order($cheeta.directive(b.name));
		});
//		console.log('compiling attibutes', attribs);
		for (var k = 0; k < attribs.length; k++) {
			var attr = attribs[k];
//			console.log('compiling attr', attr);
			var directive = $cheeta.directive(attr.name);
			if (directive != null) {
				var models = directive.fn(elem, attr, parentModels);
				if (models != null) {
					if (elem.__$cheeta_models_ == null) elem.__$cheeta_models_ = [];
					elem.__$cheeta_models_ = elem.__$cheeta_models_.concat(models);
				}
				parentModels = (models || []).concat(parentModels);				
			}
			if (elem.__isFor_) {
				break;
			}
		}
		return parentModels;
	},
	compile: function() {
		$cheeta.model.init();
		
		$cheeta.future = $cheeta.future || {};
		$cheeta.future.evals = [];
		
		$cheeta.location.initRoute();
		
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
		for (var i = 0; i < $cheeta.future.evals.length; i++) {
			eval($cheeta.future.evals[i]);
		}
//		for (var i = 0; i < $cheeta.futureUpdates.length; i++) {
//			var binding = $cheeta.futureUpdates[i];
//			binding.binding.update(binding.model);
//		}
	}
};