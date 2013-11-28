$cheeta.directives['for'] = function(def, elem, parentModels) {
	var split = def.split(/ +in +/g), name, arrayVar;
	name = split[1];
	arrayVar = split[0];
	split = name.split(/ +as +/g);
	name = split[0];
	var as = split.length > 1 ? split[1] : null;
	if (name.charAt(0) === '.') {
		// bind dot-starting to the first parent
		for (key in parentModels[0].__bindings) {
			name = key + name;
			break;
		}
	}
	return $cheeta.model.bind(parentModels, name, elem, 'for', true));

	return models;
};
