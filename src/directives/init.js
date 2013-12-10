$cheeta.directive.define({
	name: 'init.', 
	bind: function(elem, attrName, parentModels) {
		var expr = $cheeta.directive.resolveModelRefs(elem, attrName, parentModels);
		$cheeta.future.evals.push(expr);
	},
	order: 700
});
