$cheeta.futureEvals = [];

$cheeta.directives[''] = function(elem, attr, parentModels, baseAttrName) {
	this.parseExpr = function(val, bindAndResolve) {
		var qoute = null, regexpMod = false, result = '', index = -1, models = [];
		val = val + '\x1a';
		for (var i = 0; i < val.length; i++) {
			var ch = val.charAt(i);
			if (qoute != null) {
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
						result += bindAndResolve(name);
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
	
	var expr = this.parseExpr(attr.value, function(name) {
		var model = $cheeta.model.bind(parentModels, name, baseAttrName === 'init' ? null : 
			{
				elem: elem, 
				attr: attr,
				baseAttrName: baseAttrName,
				update: function(model) {
					var val = eval(this.elem.getAttribute(this.attr.name));
					if (this.baseAttrName === 'text') {
						this.elem.innerHTML = '';
						this.elem.appendChild(document.createTextNode(val));
					} else if (this.baseAttrName === 'html') {
						this.elem.innerHTML = val;
					} else {
						if (this.baseAttrName === 'value') {
							if (this.elem.value !== undefined) {
								this.elem.value = val || null;
							}
						}
						this.elem.setAttribute(this.baseAttrName, val);
					}
				}
			});
		return model != null ? $cheeta.model.toExpr(model) : name;
	});
	
	if (baseAttrName === 'init') {
		$cheeta.futureEvals.push(expr);
	}
	
	elem.setAttribute(attr.name, expr);
};
