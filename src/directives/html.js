$cheeta.directive.define({
	name: 'html.', 
	bind: function(elem, attrName, parentModels) {
		$cheeta.directive.onModelUpdate(elem, attrName, parentModels, function(val) {
			if (val != elem.innerHTML) {
				elem.innerHTML = val || '';
			}
		});
	},
	order: 600
});