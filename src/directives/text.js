$cheeta.directive.define({
	name: 'text.', 
	bind: function(elem, attrName, parentModels) {
		$cheeta.directive.onModelUpdate(elem, attrName, parentModels, function(val) {
			elem.innerHTML = '';
			elem.appendChild(document.createTextNode(val || ''));
			console.log('innerhtml after: ' +  elem.innerHTML);
		});
	},
	order: 600
});