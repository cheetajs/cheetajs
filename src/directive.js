$cheeta.Directive = function(name, model) {	 
	this.name = name;
	this.isGlobal = function() {
		return this.name.indexOf('*', this.name.length - 1) > -1; 
	};
	this.order = 1000;
	this.setOrder = function(val) {
		this.order = val;
		return this;
	};
	this.onAttach = function(fn) {
		this.attach = fn;
		return this;
	};
	this.onDetach = function(fn) {
		this.detach = fn;
		return this;
	};
	this.onModelChange = function(fn) {
		this.modelChangeListeners = this.modelChangeListeners || {};
		var origAttach = this.attach;
		this.onAttach(function(elem, attrName, parentModels) {
			var models = []
			if (origAttach) origAttach();			
			this.resolveModelNames(elem, attrName, parentModels, function(model) {
				models.push(model);
				this.modelChangeListeners[this.id(elem)] = model.addChangeListener(function() {
					var val = eval(elem.getAttribute(attrName));
					fn.apply(this, [val, elem, attrName, parentModels]);
				}, this);
			});
			return models;
		});
		this.onDetach(function(elem, attrName, parentModels) {
			var models = []; 
			this.resolveModelNames(elem, attrName, parentModels, function(model) {
				console.log('directive unbind: ', elem, attrName);
				models.push(model);
				model.removeChangeListener(this.modelChangeListeners[this.id(elem)]);
			}, true);
			return models;
		});

		return this;
	};
	this.lastId = String.fromCharCode(33); 
	this.nextId = function() {
		if (this.lastId.charCodeAt(0) === 126) {
			this.lastId = String.fromCharCode(33) + this.lastId;
		}
		this.lastId[0] = String.fromCharCode(this.lastId.charCodeAt(0) + 1);
		return this.lastId;
	}
	this.id = function(elem) {
		return elem.__$cheeta__id_ || (elem.__$cheeta__id_ = this.this.nextId());
	}; 
	this.resolveModelNames = function(elem, attrName, parentModels, onModel, skipSetAttribute) {
		var resolvedVal = '';
		var models = [], directive = this;
		this.tokenizeAttrVal(elem.getAttribute(attrName), {
			onVar: function(t) {
				var model = $cheeta.model.createOrGetModel(parentModels, t)
				models.push(model);
				resolvedVal += model.toExpr();
				onModel && onModel.apply(directive, [model]);
			},
			onLiteral: function(t) {
				resolvedVal += t;
			},
			onFnVar: function(t) {
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
									onToken.onFnVar(name.substring(0, fnIndex));
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
	$cheeta.model.get(model).addDirective(this);
};
$cheeta.Directive.get = function(name, parentModels) {
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
	return directives.length == 0 ? $cheeta.Directive.get('') : directives;
}