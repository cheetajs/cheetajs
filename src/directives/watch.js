new $cheeta.Directive('watch*').onModelValueChange(null, function(elem, attrName) {
	var val = elem.getAttribute(attrName);
	while (val.indexOf(';', val.length - 1) > -1 || val.indexOf(' ', val.length - 1) > -1) {
		val = val.substring(0, val.length - 1);
	}
	//TODO handle a['de;de'];fn()
	return val.substring(0, val.lastIndexOf(';'));
});
