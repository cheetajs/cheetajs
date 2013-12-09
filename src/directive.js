$cheeta.directives = {
	'*': []
};

$cheeta.directive = function(name, fn, order) {
	if (fn == null) {
		var directive = $cheeta.directives[name];
		if (directive == null && name.indexOf('.', name.length - 1) > -1) {
			var wildcards = $cheeta.directives['*']
			name = name.substring(0, name.length - 1);
			for (var i = 0; i < wildcards.length; i++) {
				if (name.indexOf(wildcards[i].name) == 0 || name.indexOf('data-' + wildcards[i].name) == 0) {
					directive = wildcards[i];
					break;
				}
			}
			return directive || $cheeta.directive(''); 
		}
		return directive;
	}
	var index = name.indexOf('*', name.length - 1);
	if (index > -1) {
		name = name.substring(0, name.length - 1);
		$cheeta.directives['*'].push({name: name, fn: fn, order: order});
		return $cheeta.directives['*'][1]; 
	} else {
		return $cheeta.directives['data-' + name] = $cheeta.directives[name] = {name: name, fn: fn, order: order || 10000};
	}
};

$cheeta.directive.resolveModelRefs = function(elem, attr, parentModels, updateFn) {
	var resolveInterceptor = function(name) {
		var binding = updateFn == null ? null : 
			{
				elem: elem, 
				attr: attr,
				baseAttrName: attr.name.substring(attr.name.indexOf('data-') == 0 ? 5 : 0, attr.name.length - 1),
				update: function() {
					updateFn.apply(this, [model]);
				}
			};
		var model = $cheeta.model.bind(parentModels, name, binding);
//		if (binding != null) {
//			$cheeta.futureUpdates.push({binding: binding, model: model});
//		}
		return model != null ? model.toExpr() : name;
	}
	var quote = null, regexpMod = false, result = '', index = -1, models = [];
	var val = attr.value + '\x1a';
	for (var i = 0; i < val.length; i++) {
		var ch = val.charAt(i);
		if (quote != null) {
			if (ch == quote && val.charAt(i - 1) != '\\') {
				if (quote == '/') {
					regexpMod = true;
				}
				quote = null;
			}
			result += ch;
		} else {
			if (regexpMod) {
				if (ch < 'a' && ch > 'z') {
					regexpMod = false;
				}
				result += ch;
			} else if (ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n' || ch == '!' || ch == '"' ||
					(ch >= '%' && ch <= '/' && ch != '.') || (ch >= ':' && ch <= '?') || ch == '\x1a') {
				if (ch == '\'' || ch == '"' || ch == '/') {
					quote = ch;
				}
				if (index > -1) {
					var name = val.substring(index, i);
					var isLiteral = false;
					if (name === 'true' || name === 'false' || name === 'undefined' || name === 'null' || 
						name === 'NaN' || !isNaN(name)) {
						result += name;
					} else {
						var ii = i;
						while (val.charAt(ii) == ' ') {
							ii++;
						}
						if (val.charAt(ii) == '(') {
							var fnIndex = name.lastIndexOf('.');
							if (fnIndex > -1) {
								result += resolveInterceptor(name.substring(0, fnIndex)) + '.';
								result += name.substring(fnIndex + 1);
							} else {
								result += name;
							}
						} else {
							result += resolveInterceptor(name);
						}
					}
					index = -1;
				}
				result += ch;
			} else {
				if (index == -1) {
					index = i;
				}
			}
		}
	}
	return result.substring(0, result.length - 1);
};

$cheeta.directive.onModelUpdate = function(elem, attr, parentModels, fn) {
	var expr = $cheeta.directive.resolveModelRefs(elem, attr, parentModels, function(model) {
		var val = null;
		try {
			val = eval(elem.getAttribute(this.attr.name));
		} catch (e) {}
		fn.apply(this, [val]);
	});
	elem.setAttribute(attr.name, expr);
};