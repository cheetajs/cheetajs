new $cheeta.Directive('text.').onModelValueChange(function(val, elem) {
	elem.innerHTML = '';
	elem.appendChild(document.createTextNode(val == null ? '' : val));
	console.log('innerhtml after: ' +  elem.innerHTML);
});
