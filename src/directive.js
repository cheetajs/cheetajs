$cheeta.directive = {
	get: function(name, parentModels) {
		if (name.indexOf('data-') == 0) {
			name = name.substring(5);
		}
		var endsWithDot = name.indexOf('.', name.length - 1) > -1;
		var directives = [];
		parentModels = parentModels || [$cheeta.model.root];
		for (var i = 0; i < parentModels.length; i++) {
			var model = parentModels[i];
			var directive = model.directives && model.directives[name];
			if (directive == null && model.directives['/'] != null && endsWithDot) {
				var indices = model.directives['/'];
				for (var k = 0; k < indices.length; k++) {
					directive = model.directives[name.substring(0, indices[k]) + '*'];
					if (directive != null) {
						directives.push(directive);
					}
				}
			} else {
				if (directive != null) {
					directives.push(directive);
				}
			}
		}
		return directives.length == 0 ? $cheeta.directive.get('') : directives;
	},
	define: function(def, modelPath) {
		var model = $cheeta.model.root;
		if (modelPath != null) {
			model = $cheeta.model.bind([model], modelPath);
		}
		def.order = def.order || 1000;
		if (model.directives == null) {model.directives = [];}
		model.directives[def.name] = def;
		if (def.name.indexOf('*', def.name.length - 1) > -1) {
			if (model.directives['/'] == null) model.directives['/'] = [];
			model.directives['/'].push(def.name.length - 1);
		}
	},
	tokenizeAttrVal: function(val, tokenFn) {
		var quote = null, regexpMod = false, index = -1, token = '';
		val += '\x1a';
		for (var i = 0; i < val.length; i++) {
			var ch = val.charAt(i);
			if (quote != null) {
				if (ch == quote && val.charAt(i - 1) != '\\') {
					if (quote == '/') {
						regexpMod = true;
					}
					quote = null;
				}
				token += ch;
			} else {
				if (regexpMod) {
					if (ch < 'a' && ch > 'z') {
						regexpMod = false;
					}
					token += ch;
				} else if (ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n' || ch == '!' || ch == '"' ||
						(ch >= '%' && ch <= '/' && ch != '.') || (ch >= ':' && ch <= '?') || ch == '\x1a') {
					if (ch == '\'' || ch == '"' || ch == '/') {
						quote = ch;
					}
					if (index > -1) {
						var name = val.substring(index, i);
						if (name === 'true' || name === 'false' || name === 'undefined' || name === 'null' || 
							name === 'NaN' || !isNaN(name)) {
							token += name;
						} else {
							var ii = i;
							while (val.charAt(ii) == ' ') {
								ii++;
							}
							if (val.charAt(ii) == '(') {
								var fnIndex = name.lastIndexOf('.');
								if (fnIndex > -1) {
									tokens.model(name.substring(0, fnIndex));
									tokens.literal(name.substring(fnIndex + 1));
								} else {
									tokens.literal(name);
								}
							} else {
								tokens.model(name);
							}
						}
						index = -1;
					}
					result += ch;
				} else {
					if (index == -1) {
						tokens.literal(token);
						index = i;
					}
				}
			}
		}
		if (tokens.length > 0) {
			var v = tokens[tokens.length - 1].value;
			tokens[tokens.length - 1].value = v.substring(v.length - 1); 			
		}
		return tokens;
	},
	bindModels: function(elem, attrName, parentModels, updateFn) {
		var baseAttrName = attrName.substring(attrName.indexOf('data-') == 0 ? 5 : 0, attrName.length - 1);
		this.tokenizeAttrVal(elem.getAttribute(attrName), {
			model: function(name) {
				var model = null;
				var binding = updateFn == null ? null : 
					{
						elem: elem, 
						attrName: attrName,
						baseAttrName: baseAttrName,
						update: function() {
							updateFn.apply(this, [model]);
						}
					};
				var model = $cheeta.model.bind(parentModels, name, binding);
				return model != null ? model.toExpr() : name;				
			}
		});
	},
	onModelValueChange: function(elem, attrName, parentModels, fn) {
		this.bindModels(elem.getAttribute(attrName), {
			model: function(name) {
				var model = null;
				var binding = updateFn == null ? null : 
					{
						elem: elem, 
						attrName: attrName,
						baseAttrName: baseAttrName,
						update: function() {
							updateFn.apply(this, [model]);
						}
					};
				var model = $cheeta.model.bind(parentModels, name, binding);
				return model != null ? model.toExpr() : name;				
			}
		});
		var expr = $cheeta.directive.bindModelNames(elem, attrName, parentModels, function(model) {
			var val = eval(elem.getAttribute(this.attrName));
			fn.apply(this, [val]);
		});
		elem.setAttribute(attrName, expr);
	}
};