new $cheeta.Directive('onaction.').onPreAttach(function(elem, attrName) {
	elem.setAttribute('onclick.onkeydown-space-enter.', elem.getAttribute(attrName));
}).onPostAttach(function(elem, attrName) {
	elem.removeAttribute(attrName);
});
