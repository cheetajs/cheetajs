new $cheeta.Directive('init.').onAttach(function(elem, attrName, parentModels) {
	var expr = this.resolveModelNames(elem, attrName, parentModels);
	$cheeta.future.evals.push(expr);
});
