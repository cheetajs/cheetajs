new $cheeta.Directive('value.').onModelValueChange(function(val, elem) {
	if (elem.value != val) {
		elem.value = val || null;
	}
});