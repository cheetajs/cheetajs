$cheeta.directive.add(new $cheeta.Directive('value.').onValueChange(function(val, elem, attrName, parentModels) {
	if (elem.value != val) {
		elem.value = val || null;
	}
}));