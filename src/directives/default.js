$cheeta.directive.add(new $cheeta.Directive('').onValueChange(function(val, elem, attrName) {
	elem.setAttribute(this.baseAttrName, val);
}));

