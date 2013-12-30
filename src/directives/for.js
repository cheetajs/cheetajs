new $cheeta.Directive('for.').setOrder(100).onAttach(function(elem, attrName, parentModels) {
	var parse = this.parseAttr(elem.getAttribute(attrName));
	var name = parse.name, as = parse.as, arrayVar = parse.arrayVar;
	var onChange = function(e) {
		var newLen = e.detail.value, oldLen = e.detail.oldValue;
		if (newLen instanceof Object || oldLen instanceof Object) {
//				$cheeta.model.interceptArray(newLen, this.update);
			newLen = newLen == null ? 0 : newLen.length;
			oldLen = oldLen == null ? 0 : oldLen.length;
		}
		if (oldLen > newLen) {
			for (var i = oldLen - 1; i >= newLen; i--) {
				var rmElem = elem.previousSibling;
				rmElem.parentNode.removeChild(rmElem);
				delete model.children[i];
			}
		} else if (oldLen < newLen) {
			for (var i = oldLen; i < newLen; i++) {
				var clone = elem.cloneNode();
				clone.removeAttribute('for.');
				clone.removeAttribute('data-for.');
				clone.setAttribute('model.', name + '[' + i + '] as ' + arrayVar + 
						(elem.getAttribute('model.') ? (';' + elem.getAttribute('model.').value) : '')); 
				clone.style.display = '';
				elem.parentNode.insertBefore(clone, elem);
				var arrayIndexModel = new $cheeta.model.Model($cheeta.model.root, '$i');
				arrayIndexModel.toExpr = function() {
					return i;
				};
				$cheeta.compiler.compile(parentModels.concat(arrayIndexModel), clone);
			}
		}
	}
	var model = $cheeta.model.createOrGetModel(parentModels, name);
	model.bindModelChange(elem, attrName, onChange);
	model.alias(as);

	elem.style.display = 'none';
	model.isArray = true;
	return [model];
}).onDetach(function(elem, attrName, parentModels) {
	var parse = this.parseAttr(elem.getAttribute(attrName));
	var name = parse.name;
	var model = $cheeta.model.createOrGetModel(parentModels, name);
	model.unbindModelChange(elem, attrName);
	return [model];
}).parseAttr = function(val) {
	//TODO handle app1['a in b']
	var split = val.split(/ +in +/g);
	var name = split[1];
	var arrayVar = split[0];
	//TODO handle app1['a as b']
	split = name.split(/ +as +/g);
	name = split[0];
	var as = split.length > 1 ? split[1] : null;
	return {as: as, name: name, arrayVar: arrayVar};
};
