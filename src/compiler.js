var $cheeta = {};
window['$cheeta'] = $cheeta;
$cheeta.rootModel = new $cheeta.Model(null, "ROOT");

$cheeta.directives = [];

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
		for (var i = 0; i < $cheeta.directives.length; i++) {
			var attrVal = this.findDirective(elem, $cheeta.directives[i].name);
			if (attrVal != null) {
				parentModels = ($cheeta.directives[i].fn(attrVal, elem, parentModels) || []).concat(parentModels);
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