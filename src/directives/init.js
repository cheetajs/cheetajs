$cheeta.directive.add(new $cheeta.Directive('init.').onBind(function(elem, attrName, parentModels) {
	var expr = this.resolveModelNames(elem, attrName, parentModels);
	$cheeta.future.evals.push(expr);
}));
