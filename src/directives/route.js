$cheeta.futureEvals = [];

$cheeta.directive('route.', function(elem, attr, parentModels) {
	$cheeta.route.binding = {
		elem: elem,
		parentModels: parentModels
	}
}, 900);
