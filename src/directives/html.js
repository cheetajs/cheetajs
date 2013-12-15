$cheeta.directive.add(new $cheeta.Directive('html.').onValueChange(function(val, elem, attrName, parentModels) {
	if (val != elem.innerHTML) {
		elem.innerHTML = val || '';
	}
}));
