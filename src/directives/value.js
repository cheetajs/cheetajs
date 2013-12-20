new $cheeta.Directive('value.').onModelChange(function(val, elem, attrName, parentModels) {
	if (elem.value != val) {
		elem.value = val || null;
	}
});