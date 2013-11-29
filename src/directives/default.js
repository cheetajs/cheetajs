$cheeta.directives[''] = function(def, elem, parentModels, attr, attrName) {
	this.parseExpr = function(val, bindModel) {
		var qoute = null, regexpMod = false, result = '', index = -1, ch = val.charAt(i), models = [];
		for (var i = 0; i < val.length; i++) {
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
						(ch >= '%' && ch <= '/') || (ch >= ':' && ch <= '?')) {
					if (ch == '\'' || ch == '"' || ch == '/') {
						quote = ch;
					}
					if (index > -1) {
						var name = val.substring(index, i);
						var modelVar = bindModel(name)
						result += m != null ? modelVar : name;
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
		return result;
	};

	var expr = this.parseExpr(def, function(name) {
		return $cheeta.model.bind(parentModels, name, 
				{
					elem: elem, 
					attr: attrName,
					bindAttr: attr.name,
					update: function(model) {
						var val = eval(this.elem.getAttribute(bindAttr));
						if (this.attr === 'text') {
							this.elem.innerHTML = '';
							this.elem.appendChild(document.createTextNode(val));
						} else if (this.attr === 'html') {
							this.elem.innerHTML = val;
						} else {
							if (this.attr === 'value') {
								if (this.elem.value !== undefined) {
									this.elem.value = val || null;
								}
							}
							this.elem.setAttribute(this.attr, val);
						}
					}
				}).__toExpr()
	});
	elem.setAttribute(attr.name, expr);
};
