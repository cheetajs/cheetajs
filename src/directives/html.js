new $cheeta.Directive('html.').onModelValueChange(function(val, elem) {
	if (val != elem.innerHTML) {
		elem.innerHTML = val == null ? '' : val;
	}
});
