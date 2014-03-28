new $cheeta.Directive('watch*').onModelValueChange(function(v, elem, attrName) {
	eval(elem.getAttribute('onwatch.') || elem.getAttribute('data-onwatch.'));
});
