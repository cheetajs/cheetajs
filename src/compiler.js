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
					var directive = $cheeta.directives[attrName];
					if (directive != null) {
						parentModels = (directive(attr.value, elem, parentModels) || []).concat(parentModels);
					} else {
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
									if (ch == '\'' || ch == '"' || ch == '/') {
										quote = ch;
									}
									if (index > -1) {
										var name = val.substring(index, i);
										result += $cheeta.directives['bind'].bindModel(parentModels, name, elem).__toExpr(); 
										index = -1;
									}
									result += ch;
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
		}
		return parentModels;
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