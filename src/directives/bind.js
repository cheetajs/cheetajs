$cheeta.directive.define({
	name: 'bind.',
	bind: function(elem, attrName, parentModels) {
		$cheeta.directive.get('value.')[0].bind(elem, attrName, parentModels);
		$cheeta.on('keydown keyup change', elem, function(e) {
			setTimeout(function() {
				eval(elem.getAttribute(attrName) + '=\'' + elem.value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\'');
			}, 0);
		});
	},
	order: 800
});