$cheeta.directive.define({
	name: '',
	bind: function(elem, attrName, parentModels) {
		$cheeta.directive.onModelUpdate(elem, attrName, parentModels, function(val) {
			elem.setAttribute(this.baseAttrName, val);
		});
	},
	order: 700
});		

