(function() {
	var attach = function(elem, attrName, parentModels) {
		var defs = elem.getAttribute(attrName).split(/ *, */g);
		var models = [];
		
		for (var i = 0; i < defs.length; i++) {
			var def = defs[i];
			split = def.split(/ +as +/g);
			var name = split[0];
			var as = split.length > 1 ? split[1] : null;
			var model = $cheeta.model.createOrGetModel(parentModels, name);
			model.alias(as);
			models.push(model);
		}
		return models;
	};
	new $cheeta.Directive('ctrl.').setOrder(200).onAttach(attach).onDetach(attach);
	new $cheeta.Directive('model.').setOrder(200).onAttach(attach).onDetach(attach);
})();
