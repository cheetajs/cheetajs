new $cheeta.Directive('for.').setOrder(100).onAttach(function(elem, attrName, parentModels) {
	elem.__isFor_ = true;
	var split = elem.getAttribute(attrName).split(/ +in +/g);
	var name = split[1];
	var arrayVar = split[0];
	split = name.split(/ +as +/g);
	name = split[0];
	var as = split.length > 1 ? split[1] : null;
	var elems = [];
	var onChange = function(newLen, oldLen) {
		if (newLen instanceof Object || oldLen instanceof Object) {
//				$cheeta.model.interceptArray(newLen, this.update);
			newLen = newLen == null ? 0 : newLen.length;
			oldLen = oldLen == null ? 0 : oldLen.length;
		}
		if (oldLen > newLen) {
			for (var i = oldLen - 1; i >= newLen; i--) {
				var rmElem = elems.pop();
				rmElem.parentNode.removeChild(rmElem);
				delete model.children[i];
			}
		} else if (oldLen < newLen) {
			for (var i = oldLen; i < newLen; i++) {
				var clone = elem.cloneNode();
				elems.push(clone);
				clone.removeAttribute('for.');
				clone.removeAttribute('data-for.');
				clone.setAttribute('model.', name + '.' + i + ' as ' + arrayVar + 
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
	model.addChangeListener(onChange, this);
	model.alias(as);
//	binding.parentModels = parentModels;

	elem.style.display = 'none';
	model.isArray = true;
	return [model];
});
