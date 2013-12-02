$cheeta.directives['for'] = function(elem, attr, parentModels, baseAttrName) {
	var split = attr.value.split(/ +in +/g), name, arrayVar, as;
	name = split[1];
	arrayVar = split[0];
	split = name.split(/ +as +/g);
	name = split[0];
	as = split.length > 1 ? split[1] : null;
	var binding = {
		elem: elem, 
		arrayVar: arrayVar,
		arrayName: name,
		as: as,
		update: function(newLen, oldLen) {
			if (newLen instanceof Object || oldLen instanceof Object) {
				newLen = newLen == null ? 0 : newLen.length;
				oldLen = oldLen == null ? 0 : oldLen.length;
			}
			if (oldLen > newLen) { 
				for (var i = oldLen - 1; i >= newLen; i--) { 
					model[i] = null;
					delete model[i];
					delete model.__children[i];
				}
			} else if (oldLen < newLen) {
				var arrayVar = this.arrayVar;
				var arrayName = this.arrayName; 
				var oldBind = this.elem.getAttribute('bind.') ? this.elem.getAttribute('bind.').value : '';
				oldBind += this.elem.getAttribute('data-bind.') ? this.elem.getAttribute('data-bind.').value : '';
				for (var i = oldLen; i < newLen; i++) {
					var clone = this.elem.cloneNode();
					clone.removeAttribute('for.');
					clone.removeAttribute('data-for.');
					clone.setAttribute('data-__for.');
					clone.setAttribute('bind.', arrayName + '.' + i + ' as ' + arrayVar + (oldBind.length > 0 ? ';' + oldBind : ''));
					clone.style.display = '';
					elem.parentNode.insertBefore(clone, this.elem);
					$cheeta.compiler.compileElem(this.__parentModels, clone, true);
				}
			} 
			//TODO splice with the same size
		}
	}
	var model = $cheeta.model.bind(parentModels, name, binding);
	model = $cheeta.model.extendArray(model);
	binding.__parentModels = [model.__parent].concat(parentModels);

	elem.style.display = 'none';

	return [model];
};
