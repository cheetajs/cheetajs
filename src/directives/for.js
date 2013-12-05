$cheeta.directive('for.', function(elem, attr, parentModels, baseAttrName) {
	elem.__isFor_ = true;
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
				$cheeta.model.interceptArray(newLen, this.update);
				newLen = newLen == null ? 0 : newLen.length;
				oldLen = oldLen == null ? 0 : oldLen.length;
			}
			if (oldLen > newLen) { 
				for (var i = oldLen - 1; i >= newLen; i--) { 
					delete model[i];
				}
			} else if (oldLen < newLen) {
				var arrayVar = this.arrayVar;
				var arrayName = this.arrayName; 
				for (var i = oldLen; i < newLen; i++) {
					var clone = this.elem.cloneNode();
					clone.removeAttribute('for.');
					clone.removeAttribute('data-for.');
					clone.__isForElem_ = true;
					clone.setAttribute('model.', arrayName + '.' + i + ' as ' + arrayVar + 
							(this.elem.getAttribute('model.') ? (';' + this.elem.getAttribute('model.').value) : '')); 
					clone.style.display = '';
					elem.parentNode.insertBefore(clone, this.elem);
					$cheeta.compiler.compileElem(this.__parentModels, clone, true);
				}
			}
			//TODO splice with the same size
		}
	}
	var model = $cheeta.model.bind(parentModels, name, binding);
//	binding.__parentModels = [model.__parent].concat(parentModels);
	binding.__parentModels = parentModels;

	elem.style.display = 'none';

	return [model];
}, 100);
