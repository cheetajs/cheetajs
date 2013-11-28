$cheeta.directives['ctrl'] = function(def, elem, parentModels) {
	var defs = def.split(/ *; */g);
	var models = [];
	
	for (var ii = 0; ii < defs.length; ii++) {
		var def = defs[ii];
		split = def.split(/ +as +/g);
		var name = split[0];
		var as = split.length > 1 ? split[1] : null;

		return [$cheeta.model.bind(parentModels, name, elem, 'ctrl', as));
	}
	return models;
};
