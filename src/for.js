$cheeta.directives['for'] = function(def, elem, parentModels) {
	var split = def.split(/ +in +/g), name, arrayVar, as;
	name = split[1];
	arrayVar = split[0];
	split = name.split(/ +as +/g);
	name = split[0];
	as = split.length > 1 ? split[1] : null;
	$cheeta.model.bind(parentModels, name, {
		elem: elem, 
		arrayVar: arrayVar,
		arrayName: name,
		as: as,
		update: function(model, val, oldVal) {
			if (oldVal.length > val.length) {
				for (var i = oldVal.length - 1; i >= val.length; i--) {
					$cheeta.model.forEachElem(model.__children[i], function(elem) {
						elem.parentNode.removeChild(elem);
						delete this.__parent.__children[i];
						delete this.__parent[i];
					});
				}
			} else if (oldVal.length < val.length) {
				var arrayVar = this.arrayVar;
				var arrayName = this.arrayName;
				var oldBind = this.elem.getAttribute('bind.') ? this.elem.getAttribute('bind.').value : '';
				oldBind += this.elem.getAttribute('data-bind.') ? this.elem.getAttribute('data-bind.').value : '';
				for (var i = oldVal.length; i < val.length; i++) {
					$cheeta.model.forEachElem(model, function(elem) {
						var clone = elem.cloneNode();
						clone.removeAttribute('bind.');
						clone.removeAttribute('data-bind.');
						clone.setAttribute('bind.', arrayName + '.' + i + ' as ' + arrayVar + (oldBind.length > 0 ? ';' + oldBind : ''));
						clone.style.display = '';
						elem.parentNode.insertBefore(clone, elem);
						$cheeta.compiler.recursiveCompile(this.__parentModels, clone, true);
					});
				}
			}
		}
	});
};
