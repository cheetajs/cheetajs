(function() {
	$cheeta.root.addDirective(new $cheeta.Directive('bind.').onBind(function(elem, attrName, parentModels) {
		this.fn = this.fn || {};
		this.fn[elem] = function(e) {
			setTimeout(function() {
				eval(elem.getAttribute(attrName) + '=\'' + elem.value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\'');
			}, 0);
		}
		$cheeta.directive.get('value.')[0].bind(elem, attrName, parentModels);
		$cheeta(elem).on('keydown keyup change', this.fn[elem]);
	}).onUnbind(function(elem, attrName, parentModels) {
		if (this.fn[elem]) {
			$cheeta(elem).off('keydown keyup change', this.fn[elem]);
		}
	}).setOrder(800));
})();
