new $cheeta.Directive('html.').onModelChange(function(val, elem, attrName, parentModels) {
	if (val != elem.innerHTML) {
		elem.innerHTML = val || '';
	}
});
