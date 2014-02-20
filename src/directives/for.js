new $cheeta.Directive('for.').setOrder(100).onAttach(function(elem, attrName, parentModels) {
	var parse = this.parseAttr(elem.getAttribute(attrName));
	var name = parse.name, as = parse.as, arrayVar = parse.arrayVar;
	
	var cloneElem = function(elem) {
		var clone = elem.cloneNode(true);
		clone.removeAttribute('for.');
		clone.removeAttribute('data-for.');
		clone.style.display = '';
		return clone;
	};
	
	var onChange = function(e) {
		if (!isNaN(e.detail.value) || !isNaN(e.detail.oldValue) || Array.isArray(e.detail.value) || Array.isArray(e.detail.oldValue)) {
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
					var clone = cloneElem(elem);
					clone.setAttribute('model.', name + '[' + i + '] as ' + arrayVar[0] + 
							(elem.getAttribute('model.') ? (';' + elem.getAttribute('model.').value) : '')); 
					clone.style.display = '';
					elem.parentNode.insertBefore(clone, elem);
					var arrayIndexModel = new $cheeta.model.Model($cheeta.model.root, '$i');
					arrayIndexModel.toExpr = function() {return i;};
					$cheeta.compiler.compile(parentModels.concat(arrayIndexModel), clone);
				}
			}
		} else {
			var newVal = e.detail.value, oldVal = e.detail.oldValue, prevKey = null;
			var newKeys = (newVal && Object.keys(newVal)) || [], oldKeys = (oldVal && Object.keys(oldVal)) || [];
			
			var refElem = elem;
			var j = newKeys.length - 1, i = oldKeys.length - 1;
			while (i >= 0 || j >= 0) {
				if (oldKeys[i] != newKeys[j]) {
					if (j >= 0) {
						var clone = cloneElem(elem);
						clone.setAttribute('model.', (arrayVar[1] ? name + '[\'' + newKeys[j] + '\'] as ' + arrayVar[1] : '') + 
								(elem.getAttribute('model.') ? (';' + elem.getAttribute('model.').value) : '')); 
						elem.parentNode.insertBefore(clone, refElem);
						var arrayIndexModel = new $cheeta.model.Model($cheeta.model.root, '$i');
						arrayIndexModel.toExpr = function() {return j;};
						var keyModel = new $cheeta.model.Model($cheeta.model.root, arrayVar[0]);
						keyModel.toExpr = function() {return '\'' + newKeys[j] + '\'';};
						$cheeta.compiler.compile(parentModels.concat(arrayIndexModel, keyModel), clone);					
						refElem = clone;
						j--;
					} else {
						var rmElem = refElem.previousSibling;
						rmElem.parentNode.removeChild(rmElem);
						delete model.children[oldKeys[i]];
						i--;
					}
				} else {
					model.children[oldKeys[i]].valueChange(newVal[newKeys[j]], oldVal[oldKeys[i]]);
					j--;
					i--;
				}
			}
//			model.isArray = true;
		}
	}
	var model = $cheeta.model.createOrGetModel(parentModels, name);
	model.bindModelChange(elem, attrName, onChange);
	model.alias(as);
	if (arrayVar.length === 1) {
		model.isArray = true;
	}
	elem.style.display = 'none';
	
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
	var arrayVar = split[0].split(',');
	//TODO handle app1['a as b']
	split = name.split(/ +as +/g);
	name = split[0];
	var as = split.length > 1 ? split[1] : null;
	return {as: as, name: name, arrayVar: arrayVar};
};
