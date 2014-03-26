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
	this.onAttach = function(attachFn) {
		this.attach = attachFn;
		return this;
	};
	this.onDetach = function(detachFn) {
		this.detach = detachFn;
		return this;
	};
	this.onModelValueChange = function(changeFn, attrValueTransformer) {
		var origAttach = this.attach;
		var origDetach = this.detach;
		this.attach = function(elem, attrName, parentModels) {
			//var models = [];
			if (origAttach) origAttach.apply(this);			
			if (!this.resolveModelNames(elem, attrName, parentModels, function(model) {
				//models.push(model);
				var _this = this; 
				model.bindModelChange(elem, attrName, function(e) {
					var val = eval(elem.getAttribute(attrName));
					changeFn && changeFn.apply(_this, [val, elem, attrName, parentModels]);
				});
			}, false, attrValueTransformer)) {
				var val = eval(elem.getAttribute(attrName));
				changeFn && changeFn.apply(this, [val, elem, attrName, parentModels]);
			}
			//return models;
		}
		this.detach = function(elem, attrName, parentModels) {
			//var models = []; 
			if (origDetach) origDetach.apply(this);
			this.resolveModelNames(elem, attrName, parentModels, function(model) {
				//models.push(model);
				model.unbindModelChange(elem, attrName);
			}, true);
			//return models;
		}
		return this;
	};
//	this.lastId = String.fromCharCode(33); 
//	this.nextId = function() {
//		if (this.lastId.charCodeAt(0) === 126) {
//			this.lastId = String.fromCharCode(33) + this.lastId;
//		}
//		this.lastId[0] = String.fromCharCode(this.lastId.charCodeAt(0) + 1);
//		return this.lastId;
//	}
//	this.id = function(elem) {
//		return elem.__$cheeta__id_ || (elem.__$cheeta__id_ = this.this.nextId());
//	}; 
	this.resolveModelNames = function(elem, attrName, parentModels, onModel, skipSetAttribute, attrValueTransformer) {
		var directive = this, hasModel = false;
		resolvedVal = this.parseModelVars((attrValueTransformer && attrValueTransformer(elem, attrName)) 
				|| elem.getAttribute(attrName), function(modelRef) {
			var model = $cheeta.model.createOrGetModel(parentModels, modelRef.trim());
			hasModel = true;
			if (model instanceof Array) {
				var mexpr = model[0].toExpr();
				return mexpr + (mexpr.length > 0 ? '.' : '') + model[1];
			} else {
				onModel && onModel.call(directive, model);
				return model.toExpr();
			}
		});
		skipSetAttribute || elem.setAttribute(attrName, resolvedVal);
		return hasModel;
	},
	this.parseModelVars = function(val, modelCallback) {
		function replaceModelVars(val) {
			this.modelVarRegExp = /(((((\. *)?[^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+)|\[ *([^ \.!%-\-/:-?\^\[\]{-~\t\r\n'"]+|'(\\'|[^'])*') *\]) *)+\(?)|('(\\'|[^'])*')/g,
			this.reservedWords = '(abstract|else|instanceof|super|boolean|enum|int|switch|break|export|interface|synchronized|byte|extends|let|this|case|false|long|' +
				'throw|catch|final|native|throws|char|finally|new|transient|class|float|null|true|const|for|package|try|continue|function|private|typeof|debugger|' +
				'goto|protected|var|default|if|public|void|delete|implements|return|volatile|do|import|short|while|double|in|static|with)';
			return val.replace(this.modelVarRegExp, function(match) {
				if (match.charAt(0) === '\'' || match.charAt(0) === '"' || match === 'true' || match === 'false' || 
						match === 'undefined' || match === 'null' || match === 'NaN' || !isNaN(match)) {
					return match;
				} else {
					match = match.replace(/\[ *([^0-9'"].*?)\]/g, function(m, $1) {
						return '[' + replaceModelVars($1) + ']';
					});
					var reserved = '';
					match = match.replace(new RegExp('(^|\\W)' + this.reservedWords + '(\\W|$)', 'g'), function(m, $1, $2, $3) {
						reserved += $2 + '|';
						return $1 + '\'' + $2 + '\'' + $3; 
					});
					if (reserved.length > 0) {
						match = replaceModelVars(match);
						return match.replace(new RegExp('\'\(' + reserved.slice(0, -1) + '\)\'', 'g'), function(m) {
							return m.slice(1, -1);
						});
					} else {
						return modelCallback.call(this, match);
					}
				}
			});
		}
		return replaceModelVars(val);
	};
//	this.tokenizeAttrVal = function(val, onToken) {
//		var quote = null, regexpMod = false, index = -1, optionsSplitIndex = val.indexOf(';');
//		if (optionsSplitIndex > -1 && optionsSplitIndex) 
//		val += '\x1a';
//		for (var i = 0; i < val.length; i++) {
//			var ch = val.charAt(i);
//			if (quote != null) {
//				if (ch == quote && val.charAt(i - 1) != '\\') {
//					if (quote == '/') {
//						regexpMod = true;
//					}
//					quote = null;
//				}
//				onToken.onLiteral(ch);
//			} else {
//				if (regexpMod) {
//					if (ch < 'a' && ch > 'z') {
//						regexpMod = false;
//					}
//					onToken.onLiteral(ch);
//				} else if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === '!' || ch === '"' || ch === '[' || ch === ']' || 
//						(ch >= '%' && ch <= '/' && ch != '.') || (ch >= ':' && ch <= '?') || (ch >= '{' && ch <= '~') || ch === '^' || ch == '\x1a') {
//					if (ch === '\'' || ch === '"' || ch === '/') {
//						quote = ch;
//					}
//					if (index > -1) {
//						var name = val.substring(index, i);
//						if (name === 'true' || name === 'false' || name === 'undefined' || name === 'null' || 
//							name === 'NaN' || !isNaN(name)) {
//							onToken.onLiteral(name);
//						} else {
//							var ii = i;
//							while (val.charAt(ii) == ' ') {
//								ii++;
//							}
//							if (val.charAt(ii) == '(') {
//								var fnIndex = name.lastIndexOf('.');
//								if (fnIndex > -1) {
//									onToken.onFnVar(name.substring(0, fnIndex));
//									onToken.onLiteral(name.substring(fnIndex));
//								} else {
//									onToken.onLiteral(name);
//								}
//							} else {
//								onToken.onVar(name);
//							}
//						}
//						index = -1;
//					}
//					if (ch !== '\x1a') {
//						onToken.onLiteral(ch);
//					}
//				} else {
//					if (index == -1) {
//						index = i;
//					}
//				}
//			}
//		}
//	};
	$cheeta.model.get(model).addDirective(this);
};
$cheeta.Directive.get = function(name, parentModels) {
	if (name.indexOf('data-') == 0) {
		name = name.substring(5);
	}
	var endsWithDot = name.indexOf('.', name.length - 1) > -1;
	parentModels = parentModels || [$cheeta.model.root];
	for (var i = 0; i < parentModels.length; i++) {
		var model = parentModels[i];
		var directive = model.getDirective(name);
		if (directive == null && model.directives != null && model.directives['/'] != null && endsWithDot) {
			var indices = model.directives['/'];
			for (var k = 0; k < indices.length; k++) {
				directive = model.directives[name.substring(0, indices[k]) + '*'];
				if (directive != null) {
					return directive;
				}
			}
		} else {
			if (directive != null) {
				return directive;
			}
		}
	}
	return $cheeta.Directive.get('');
}