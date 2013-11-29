$cheeta.directives['ctrl'] = $cheeta.directives['bind'] = function(def, elem, parentModels) {
	var defs = def.split(/ *; */g);
	var models = [];
	
	for (var i = 0; i < defs.length; i++) {
		var def = defs[i];
		split = def.split(/ +as +/g);
		var name = split[0];
		var as = split.length > 1 ? split[1] : null;

		models.push($cheeta.model.bind(parentModels, name, {
				elem: elem,
				attr: 'ctrl', 
				as: as
			}));
	}
	return models;
};
