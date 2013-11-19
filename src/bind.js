$cheeta.directives.push({
	name: 'bind',
	fn: function(def, elem, parentModels) {
		if (parentModels == null) {
			parentModels = [$cheeta.rootModel];
		}
		var defs = def.split(/ *; */g);
		var models = [];
		
		for (var ii = 0; ii < defs.length; ii++) {
			var def = defs[ii];
			var split = def.split(/ +in +/g), name;
			if (split.length > 1) {
				name = split[1];
				isArray = true;
			} else {
				name = split[0];
				isArray = false;
			}
			
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
			split = name.split(/\./g);
			name = split[split.length - 1];
			var rootName = split[0];
			var parentModel = $cheeta.rootModel;
			for (var j = 0; j < parentModels.length; j++) {
				parentModel = parentModels[j];
				parentModel = (function findParentModel(model, rootName) {
					while (model != $cheeta.rootModel) {
						for (var key in model.__bindings) {
							if (key == rootName) {
								return model;
							}
						}
						model = model.__parent;
					}
					return model;
				})(parentModel, rootName);
				
				if (parentModel != $cheeta.rootModel) {
					break;
				}
			}
			for (var i = parentModel == $cheeta.rootModel ? 0 : 1; i < split.length - 1; i++) {
				if (parentModel[split[i]] == null) {
					parentModel.__bindElement(elem, split[i]);
				}
				parentModel = parentModel[split[i]];
			}
			
			parentModel.__bindElement(elem, name, as, isArray);
			if (isArray) {
				parentModel.__children[name].__parentModels = [parentModel].concat(parentModels);
			}
			models.push(parentModel.__children[name]);
		}
		return models;
	}
});