(function() {
	var fn = function(elem, attr, parentModels) {
		var defs = attr.value.split(/ *; */g);
		var models = [];
		
		for (var i = 0; i < defs.length; i++) {
			var def = defs[i];
			split = def.split(/ +as +/g);
			var name = split[0];
			var as = split.length > 1 ? split[1] : null;

			var binding = {
				elem: elem,
				attr: 'ctrl', 
				as: as, 
			};
			models.push($cheeta.model.bind(parentModels, name, binding));
		}
		return models;
	};
	$cheeta.directive('ctrl.', fn, 200);
	$cheeta.directive('model.', fn, 201);
})();
