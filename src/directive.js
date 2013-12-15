$cheeta.Directive = function(name) {
	this.name = name;
	this.isGlobal = function() {
		return this.name.indexOf('*', this.name.length - 1) > -1; 
	};
	this.orderVal = 1000;
	this.order = function(val) {
		this.orderVal = val;
		return this;
	};
	this.onBind = function(fn) {
		if (fn != null) {
			this.bindFn = fn;
			return this;
		} else {
			return this.bindFn;
		}
	};
	this.bind = function(elem, attrName, parentModels) {
		return this.bindFn ? this.bindFn.apply(this, arguments) : null;
	};
	this.onUnbind = function(fn) {
		if (fn != null) {
			this.unbindFn = fn;
			return this;
		} else {
			return this.unbindFn;
		}
	};
	this.unbind = function(elem, attrName, parentModels) {
		return this.unbindFn ? this.unbindFn.apply(this, arguments) : null;
	};
	this.resolveModelNames = function(elem, attrName, parentModels, onModel, skipSetAttribute) {
		var resolvedVal = '';
		var models = [];
		this.tokenizeAttrVal(elem.getAttribute(attrName), {
			onVar: function(t) {
				var model = $cheeta.model.get(parentModels, t, true)
				models.push(model);
				resolvedVal += model.toExpr();
				onModel && onModel(model);
			},
			onLiteral: function(t) {
				resolvedVal += t;
			}
		});
		skipSetAttribute || elem.setAttribute(attrName, resolvedVal);
		return resolvedVal;
	};
	this.tokenizeAttrVal = function(val, onToken) {
		var quote = null, regexpMod = false, index = -1;
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
				onToken.onLiteral(ch);
			} else {
				if (regexpMod) {
					if (ch < 'a' && ch > 'z') {
						regexpMod = false;
					}
					onToken.onLiteral(ch);
				} else if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === '!' || ch === '"' || ch === '[' || ch === ']' || 
						(ch >= '%' && ch <= '/' && ch != '.') || (ch >= ':' && ch <= '?') || (ch >= '{' && ch <= '~') || ch === '^' || ch == '\x1a') {
					if (ch === '\'' || ch === '"' || ch === '/') {
						quote = ch;
					}
					if (index > -1) {
						var name = val.substring(index, i);
						if (name === 'true' || name === 'false' || name === 'undefined' || name === 'null' || 
							name === 'NaN' || !isNaN(name)) {
							onToken.onLiteral(name);
						} else {
							var ii = i;
							while (val.charAt(ii) == ' ') {
								ii++;
							}
							if (val.charAt(ii) == '(') {
								var fnIndex = name.lastIndexOf('.');
								if (fnIndex > -1) {
									onToken.onVar(name.substring(0, fnIndex));
									onToken.onLiteral(name.substring(fnIndex));
								} else {
									onToken.onLiteral(name);
								}
							} else {
								onToken.onVar(name);
							}
						}
						index = -1;
					}
					if (ch !== '\x1a') {
						onToken.onLiteral(ch);
					}
				} else {
					if (index == -1) {
						index = i;
					}
				}
			}
		}
	};
	
	this.onValueChange = function(fn) {
		var origBind = this.bindFn;
		this.bindFn = function(elem, attrName, parentModels) {
			if (origBind) origBind();
			var baseAttrName = attrName.substring(attrName.indexOf('data-') == 0 ? 5 : 0, attrName.length - 1);
			this.resolveModelNames(elem, attrName, parentModels, function(model) {
				var binding = { 
					elem: elem, 
					attrName: attrName,
					baseAttrName: baseAttrName,
					onChange: function() {
						var val = eval(elem.getAttribute(this.attrName));
						fn.apply(this, [val, elem, attrName, parentModels]);
					}
				};
				model.bind(binding);
			});
		}
		return this;
	};
};
$cheeta.directive = {
	add: function(directive) {
		$cheeta.root.addDirective(directive);
	},
	get: function(name, parentModels) {
		if (name.indexOf('data-') == 0) {
			name = name.substring(5);
		}
		var endsWithDot = name.indexOf('.', name.length - 1) > -1;
		var directives = [];
		parentModels = parentModels || [$cheeta.model.root];
		for (var i = 0; i < parentModels.length; i++) {
			var model = parentModels[i];
			var directive = model.getDirective(name);
			if (directive == null && model.directives != null && model.directives['/'] != null && endsWithDot) {
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
	}
}