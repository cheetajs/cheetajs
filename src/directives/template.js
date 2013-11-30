$cheeta.templates = {};

$cheeta.directives['template'] = function(elem, attr, parentModels) {
	elem.innerHTML = $cheeta.templates[attr.value] || elem.innerHTML;
	var children = elem.childNodes;
	for (var i = 0; i < children.length; i++) {
		$cheeta.compiler.recursiveCompile(parentModels, children[i]);
	}
};
