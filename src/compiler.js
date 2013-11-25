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
					var val = attr.value, qoute = null, regexpMod = false, result = '', index = -1, ch = val.charAt(i);
					for (var i = 0; i < val.length; i++) {
						if (qoute != null) {
							if (ch == quote && val.charAt(i - 1) != '\\') {
								if (quote == '/') {
									regexpMod = true;
								}
								quote = null;
							}
							result += ch;
						} else {
							if (regexpMod) {
								if (ch < 'a' && ch > 'z') {
									regexpMod = false;
								}
								result += ch;
							} else if (ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n' || ch == '!' || ch == '"' ||
									(ch >= '%' && ch <= '/') || (ch >= ':' && ch <= '?')) {
								if (ch == '\'' || ch == '"' || ch = '/') {
									quote = ch;
								}
								retult += ch;
								if (index > -1) {
									var name = val.substring(index, i);
									this.findOrDefineModel(parentModels, name, elem);
									index = -1;
								}
							} else {
								if (index == -1) {
									index = i;
								}
							}
						}
					}
				}
			}
		}
//		for (var i = 0; i < $cheeta.directives.length; i++) {
//			var attrVal = this.findDirective(elem, $cheeta.directives[i].name);
//			if (attrVal != null) {
//				parentModels = ($cheeta.directives[i].fn(attrVal, elem, parentModels) || []).concat(parentModels);
//			}
//		}
		return parentModels;
	},
	findOrDefineModel: function(parentModels, name, elem) {
		var split = name.split(/\./g);
		name = split[split.length - 1];
		var rootName = split[0];
		var parentModel = $cheeta.rootModel;
		for (var j = 0; j < parentModels.length; j++) {
			parentModel = parentModels[j];
			parentModel = (function findParentModel(model, rootName) {
				while (model != $cheeta.rootModel) {
					for (var key in model.__bindings) {
						if (key == rootName) {
							return model;
						}
					}
					model = model.__parent;
				}
				return model;
			})(parentModel, rootName);
			
			if (parentModel != $cheeta.rootModel) {
				break;
			}
		}
		for (var i = parentModel == $cheeta.rootModel ? 0 : 1; i < split.length - 1; i++) {
			if (parentModel[split[i]] == null) {
				parentModel.__bindElement(elem, split[i]);
			}
			parentModel = parentModel[split[i]];
		}
		
		parentModel.__bindElement(elem, name);
		return parentModel.__children[name];
	},
	compile: function() {
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

$cheeta.onload = function() {
	$cheeta.compiler.compile();
	$cheeta.location.init();
};

window.addEventListener('load', $cheeta.onload, false);