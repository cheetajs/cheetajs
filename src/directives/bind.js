$cheeta.futureUpdates = []

$cheeta.directive('bind.', function(elem, attr, parentModels) {
	$cheeta.directive('value.').fn(elem, attr, parentModels);
	$cheeta.on('keyup change', elem, function(e) {
		setTimeout(function() {
			eval(elem.getAttribute(attr.name) + '=\'' + elem.value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\'');
//			eval(elem.getAttribute(attr.name) + '=\'34334\'');
		}, 0);
	});
}, 800);