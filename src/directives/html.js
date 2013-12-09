$cheeta.directive('html.', function(elem, attr, parentModels) {
	$cheeta.directive.onModelUpdate(elem, attr, parentModels, function(val) {
		if (val != elem.innerHTML) {
			elem.innerHTML = val || '';
		}
	});
}, 600);