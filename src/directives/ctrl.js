(function() {
	var fn = function(elem, attrName, parentModels) {
		var defs = elem.getAttribute(attrName).split(/ *; */g);
		var models = [];
		
		for (var i = 0; i < defs.length; i++) {
			var def = defs[i];
			split = def.split(/ +as +/g);
			var name = split[0];
			var as = split.length > 1 ? split[1] : null;

			var binding = {
				elem: elem,
				attrName: 'ctrl', 
				as: as, 
			};
			models.push($cheeta.model.define(parentModels, name).bind(binding));
		}
		return models;
	};
	$cheeta.directive.add(new $cheeta.Directive('ctrl.').setOrder(200).onBind(fn));
	$cheeta.directive.add(new $cheeta.Directive('model.').setOrder(200).onBind(fn));
})();
