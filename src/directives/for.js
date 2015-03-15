isTemplate = true;
new $cheeta.Directive('for.').setOrder(100).onAttach(function(elem, attrName, parentModels) {
	var i = 0, clone, arrayIndexModel, rmElem;
	function onChange(e) {
		if (!isNaN(e.detail.value) || !isNaN(e.detail.oldValue) ||
				Array.isArray(e.detail.value) || Array.isArray(e.detail.oldValue)) {
			handleArrayChange(e.detail.value, e.detail.oldValue);
		} else {
			handleMapChange(e.detail.value, e.detail.oldValue);
//			model.isArray = true;
		}
	}

	function handleArrayChange(newLen, oldLen) {
		if (newLen instanceof Object || oldLen instanceof Object) {
			//				$cheeta.model.interceptArray(newLen, this.update);
			newLen = newLen == null ? 0 : newLen.length;
			oldLen = oldLen == null ? 0 : oldLen.length;
		}

		if (oldLen > newLen) {
			for (i = oldLen - 1; i >= newLen; i--) {
				rmElem = elem.previousSibling;
				rmElem.parentNode.removeChild(rmElem);
				delete model.children[i];
			}
		} else if (oldLen < newLen) {
			for (i = oldLen; i < newLen; i++) {
				clone = cloneElem(elem);
				var oldModelVal = elem.getAttribute('model.');
				clone.setAttribute('model.',
					name + '[' + i + '] as ' + arrayVar[0] +
					(oldModelVal ? ';' + oldModelVal.value : ''));
				var oldInitVal = elem.getAttribute('init.');
				clone.setAttribute('init.',
					name + '.$i=' + i +
					(oldInitVal ? ';' + oldInitVal.value : ''));
				clone.style.display = '';
				elem.parentNode.insertBefore(clone, elem);
				arrayIndexModel = new $cheeta.model.Model($cheeta.model.root, '$i');
				arrayIndexModel.ref = makeref(i);
				$cheeta.compiler.compile(parentModels.concat(arrayIndexModel), clone);
			}
		}
	}

	function handleMapChange(newVal, oldVal) {
		var newKeys = (newVal && Object.keys(newVal)) || [], oldKeys = (oldVal && Object.keys(oldVal)) || [];

		var refElem = elem;
		var j = newKeys.length - 1;
		i = oldKeys.length - 1;
		// key,val in map
		while (i >= 0 || j >= 0) {
			if (oldKeys[i] !== newKeys[j]) {
				if (j >= 0) {
					clone = cloneElem(elem);
					clone.setAttribute('model.', (arrayVar[1] ? name + '[\'' + newKeys[j] + '\'] as ' + arrayVar[1] : '') +
					(elem.getAttribute('model.') ? (';' + elem.getAttribute('model.').value) : ''));
					elem.parentNode.insertBefore(clone, refElem);
					arrayIndexModel = new $cheeta.model.Model($cheeta.model.root, '$i');
					arrayIndexModel.ref = makeref(i);
					var keyModel = new $cheeta.model.Model($cheeta.model.root, arrayVar[0]);
					keyModel.ref = makerefModel(newKeys[j]);
					$cheeta.compiler.compile(parentModels.concat(arrayIndexModel, keyModel), clone);
					refElem = clone;
					j--;
				} else {
					rmElem = refElem.previousSibling;
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
	}

	function makeref(i) {
		return function() {
			return i;
		};
	}
	function makerefModel(s) {
		return function() {
			return '\'' + s + '\'';
		};
	}
	function cloneElem(elem) {
		var clone = elem.cloneNode(true);
		clone.removeAttribute('for.');
		clone.removeAttribute('data-for.');
		clone.style.display = '';
		return clone;
	}
	function uniqueName() {
		return 'O' + Math.random().toString().replace('.', '');
	}

	//TODO handle app1['a in b']
	var split = elem.getAttribute(attrName).split(/ *: */g);
	var name = split[1];
	var arrayVar = split[0].split(/ *, */g);
	//TODO handle app1['a as b']
	split = name.split(/ +as +/g);
	name = split[0];
	var as = split.length > 1 ? split[1] : null;
	split = name.split(/ *\.\. */);

	if (split.length > 1) {
		name = uniqueName();
		var m = $cheeta.model.createOrGetModel(parentModels, name);
		elem.setAttribute(attrName, arrayVar + ':' + name);
		if (isNaN(split[1])) {
			$cheeta.model.createOrGetModel(parentModels, split[1]).bind(elem, attrName, function (e) {
				for (i = parseInt(split[0]); i < e.detail.value; i++) {
					if (eval(m.ref() + '[' + i + ']') !== i) {
						eval(m.ref() + '[' + i + '] = ' + i);
					}
				}
			});
		} else {
			for (i = parseInt(split[0]); i < parseInt(split[1]); i++) {
				if (eval(m.ref() + '[' + i + ']') !== i) {
					eval(m.ref() + '[' + i + '] = ' + i);
				}
			}
		}
		this.attach(elem, attrName, parentModels);
	}

	var model = $cheeta.model.createOrGetModel(parentModels, name);
	model.bind(elem, attrName, onChange);
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
	model.unbind(elem, attrName);
	return [model];
});
