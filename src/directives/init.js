$cheeta.directive('init.', function(elem, attr, parentModels) {
	var expr = $cheeta.directive.resolveModelRefs(elem, attr, parentModels);
	$cheeta.future.evals.push(expr);
}, 700);
