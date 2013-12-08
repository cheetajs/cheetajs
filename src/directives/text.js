$cheeta.futureUpdates = []

$cheeta.directive('', function(elem, attr, parentModels) {
	$cheeta.directive.onModelUpdate(elem, attr, parentModels, function(val) {
		elem.innerHTML = '';
		elem.appendChild(document.createTextNode(val || ''));
	});
}, 600);