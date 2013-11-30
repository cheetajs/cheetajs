$cheeta.futureEvals = [];

$cheeta.directives['eval'] = function(elem, attr) {
	$cheeta.futureEvals.push(attr.value);
};
