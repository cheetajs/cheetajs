$cheeta.futureUpdates = []

$cheeta.directive('value.', function(elem, attr, parentModels) {
	$cheeta.directive.onModelUpdate(elem, attr, parentModels, function(val) {
		if (elem.value != val) {
			elem.value = val || null;
		}
	});
}, 600);

