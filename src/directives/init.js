new $cheeta.Directive('init.').onAttach(function(elem, attrName, parentModels) {
	this.resolveModelNames(elem, attrName, parentModels);
	$cheeta.future.evals.push(elem.getAttribute(attrName));
});
