$cheeta.directive.define({
	name: 'value.', 
	bind: function(elem, attrName, parentModels) {
		$cheeta.directive.onModelUpdate(elem, attrName, parentModels, function(val) {
			if (elem.value != val) {
				elem.value = val || null;
			}
		});
	}, 
	order: 600
});

