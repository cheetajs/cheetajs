$cheeta.templates = {};

$cheeta.directives.push({
	name: 'template',
	fn: function(def, elem, parentModels) {
		elem.innerHTML = $cheeta.templates[def] || elem.innerHTML;
		var children = elem.childNodes;
		for (var i = 0; i < children.length; i++) {
			$cheeta.compiler.recursiveCompile(parentModels, children[i]);
		}
	}
});