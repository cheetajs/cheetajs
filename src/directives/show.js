new $cheeta.Directive('show.').onModelValueChange(function(val, elem, attrName, parentModels) {
	if (val) {
		elem.style.display = '';
		if (!elem.__isCompiled_) {
			elem.__isCompiled_ = true;
			$cheeta.compiler.compileChildren(parentModels, elem);
		}
	} else {
		elem.style.display = 'none';
	}
});
