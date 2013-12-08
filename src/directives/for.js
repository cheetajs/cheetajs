$cheeta.directive('for.', function(elem, attr, parentModels) {
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
//				$cheeta.model.interceptArray(newLen, this.update);
				newLen = newLen == null ? 0 : newLen.length;
				oldLen = oldLen == null ? 0 : oldLen.length;
			}
			if (oldLen > newLen) { 
				for (var i = oldLen - 1; i >= newLen; i--) {
					for (var key in model.children[i].bindings) {
						var bindings = model.children[i].bindings[key];
						for (var k = 0; k < bindings.length; k++) {
							var rmElem = bindings[k].elem;
							rmElem.parentNode.removeChild(rmElem);
						}
					}
					delete model.children[i];
				}
			} else if (oldLen < newLen) {
				var arrayVar = this.arrayVar;
				var arrayName = this.arrayName; 
				for (var i = oldLen; i < newLen; i++) {
					var clone = this.elem.cloneNode();
					clone.removeAttribute('for.');
					clone.removeAttribute('data-for.');
					clone.setAttribute('model.', arrayName + '.' + i + ' as ' + arrayVar + 
							(this.elem.getAttribute('model.') ? (';' + this.elem.getAttribute('model.').value) : '')); 
					clone.style.display = '';
					this.elem.parentNode.insertBefore(clone, this.elem);
					var arrayIndexModel = new $cheeta.model.Model($cheeta.model.root, '$i');
					arrayIndexModel.toExpr = function() {
						return i;
					}; 
					$cheeta.compiler.compileElem(this.parentModels.concat(arrayIndexModel), clone, true);
				}
			}
			//TODO splice with the same size
		}
	}
	var model = $cheeta.model.bind(parentModels, name, binding);
//	binding.parentModels = [model.parent].concat(parentModels);
	binding.parentModels = parentModels;

	elem.style.display = 'none';
	model.isArray = true;
	return [model];
}, 100);
