new $cheeta.Directive('onaction.').onPreAttach(function(elem, attrName, parentModels) {
	elem.setAttribute('onclick.onkeydown-space-enter.', elem.getAttribute(attrName));
	elem.removeAttribute(attrName);
});
