$cheeta.directive('text.', function(elem, attr, parentModels) {
	$cheeta.directive.onModelUpdate(elem, attr, parentModels, function(val) {
		elem.innerHTML = '';
		console.log(elem);
		console.log('val: ' + ' ' + val);
		console.log('innerhtml: ' +  elem.innerHTML);
		elem.appendChild(document.createTextNode(val || ''));
		console.log('innerhtml after: ' +  elem.innerHTML);
	});
}, 600);