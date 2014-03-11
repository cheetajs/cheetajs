(function() {
	new $cheeta.Directive('bind.').onAttach(function(elem, attrName, parentModels) {
		this.fn = this.fn || {};
		this.fn[elem] = function(e) {
			setTimeout(function() {
				var _tmp__fn__ = function() {
					return elem.value;
				};
				eval(elem.getAttribute(attrName) + '=_tmp__fn__()');
//				eval(elem.getAttribute(attrName) + '=\'' + elem.value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\'');
			}, 0);
		}
		$cheeta.Directive.get('value.').attach(elem, attrName, parentModels);
		$cheeta(elem).on('keydown keyup change', this.fn[elem]);
	}).onDetach(function(elem, attrName, parentModels) {
		$cheeta.Directive.get('value.').detach(elem, attrName, parentModels);
		if (this.fn[elem]) {
			$cheeta(elem).off('keydown keyup change', this.fn[elem]);
		}
	}).setOrder(800);
})();
