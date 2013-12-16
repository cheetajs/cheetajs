(function() {
	$cheeta.templates = $cheeta.templates || {}; 
	var _this = new $cheeta.Directive('view.').onValueChange(function(val, elem, attrName, parentModels) {
		if (!elem.__$cheeta_view_is_loading && val != null) {
			// to avoid infinite loop
			elem.__$cheeta_view_is_loading = true;
			try {
				var content = $cheeta.templates[val];
				if (content != null) {
					_this.loadView(elem, content, parentModels);
				} else {
					var url = val.indexOf('/') === 0 ? _this.baseURL + val : val;
					if (_this.cache[url] != null) {
						_this.loadView(elem, _this.cache[url], parentModels);
					} else {
						new $cheeta.XHR().open('get', url).onSuccess(function(xhr) {
							_this.cache[url] = xhr.data;
							_this.loadView(elem, xhr.data, parentModels);
						}).send();
					}
				}
			} finally {
				elem.__$cheeta_view_is_loading = false;
			}
		}
	}).setOrder(900);
	_this.baseURL = window.location.protocol + "//" + window.location.hostname + 
		(window.location.port && ":" + window.location.port) + window.location.pathname;
	_this.loadView = function(elem, content, parentModels) {
		$cheeta.compiler.uncompileChildren(parentModels, elem);
		elem.innerHTML = content;
		$cheeta.compiler.compileChildren(parentModels, elem, true);
	};
	_this.cache = {};
	$cheeta.directive.add(_this);
})();