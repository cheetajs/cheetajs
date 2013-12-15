$cheeta.directive.add(new $cheeta.Directive('text.').onValueChange(function(val, elem, attrName, parentModels) {
	elem.innerHTML = '';
	elem.appendChild(document.createTextNode(val || ''));
	console.log('innerhtml after: ' +  elem.innerHTML);
}));
