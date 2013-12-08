$cheeta.futureEvals = [];

$cheeta.directive('init.', function(elem, attr, parentModels) {
	$cheeta.futureEvals.push(expr);
	var expr = $cheeta.directive.resolveModelRefs(elem, attr, parentModels);
	$cheeta.futureEvals.push(expr);
}, 700);
