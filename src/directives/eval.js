$cheeta.futureEvals = [];

$cheeta.directive('eval.', function(elem, attr) {
	$cheeta.futureEvals.push(attr.value);
}, 700);
