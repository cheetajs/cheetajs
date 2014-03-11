new $cheeta.Directive('').onModelValueChange(function(val, elem, attrName) {
	var baseAttrName = attrName.substring(attrName.indexOf('data-') == 0 ? 5 : 0, attrName.length - 1);
	if (val == null) {
		elem.removeAttribute(baseAttrName);
	} else {
		elem.setAttribute(baseAttrName, val);
	}
});

