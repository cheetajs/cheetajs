new $cheeta.Directive('show.').onModelValueChange(function(val, elem) {
	if (val) {
		elem.style.display = '';
	} else {
		elem.style.display = 'none';
	}
});
