$cheeta.futureEvals = [];

$cheeta.directive('init.', function(elem, attr) {
	$cheeta.futureEvals.push(expr);
	var expr = $cheeta.compiler.resolveModelRefs(elem, attr);
	$cheeta.futureEvals.push(expr);
}, 700);
