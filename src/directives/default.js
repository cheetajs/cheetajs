$cheeta.directive('', function(elem, attr, parentModels) {
	$cheeta.directive.onModelUpdate(elem, attr, parentModels, function(val) {
		elem.setAttribute(this.baseAttrName, val);
	});
}, 700);		

