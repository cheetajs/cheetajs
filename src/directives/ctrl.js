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
			models.push($cheeta.model.bind(parentModels, name, binding));
		}
		return models;
	};
	$cheeta.directive.define({
		name: 'ctrl.', 
		bind: fn, 
		order: 200
	});
	$cheeta.directive.define({
		name: 'model.', 
		bind: fn, 
		order: 200
	});
})();
