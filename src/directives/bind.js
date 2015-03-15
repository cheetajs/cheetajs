(function() {
	new $cheeta.Directive('bind.').onAttach(function(elem, attrName, parentModels) {
		this.fn = this.fn || {};
		this.fn[elem] = function() {
			setTimeout(function() {
				var _tmpFn__ = function() {
					if (elem.type && elem.type.toLowerCase() === 'checkbox') {
						return elem.checked;
					}
					if (elem.tagName.toLowerCase() === 'input' || elem.tagName.toLowerCase() === 'textarea') {
						return elem.value;
					} else {
						return elem.innerHTML;
					}
				};
				_tmpFn__ = _tmpFn__ || {};
				eval(elem.getAttribute(attrName) + '=_tmpFn__()');
//				eval(elem.getAttribute(attrName) + '=\'' + elem.value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\'');
			}, 0);
		};
		if (elem.tagName.toLowerCase() === 'input' || elem.tagName.toLowerCase() === 'textarea') {
			$cheeta.Directive.get('value.').attach(elem, attrName, parentModels);
		} else {
			$cheeta.Directive.get('html.').attach(elem, attrName, parentModels);			
		}
		$cheeta(elem).on('keydown keyup change', this.fn[elem]);
	}).onDetach(function(elem, attrName, parentModels) {
		$cheeta.Directive.get('value.').detach(elem, attrName, parentModels);
		if (this.fn[elem]) {
			$cheeta(elem).off('keydown keyup change', this.fn[elem]);
		}
	}).setOrder(800);
})();
