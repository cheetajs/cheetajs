(function() {
	$cheeta.templates = $cheeta.templates || {};
	var viewDirective = new $cheeta.Directive('view.').onModelValueChange(function(val, elem, attrName, parentModels) {
		if (!elem.__$cheetaViewIsLoading && val != null) {
			// to avoid infinite loop
			elem.__$cheetaViewIsLoading = true;
			try {
				var content = $cheeta.templates[val];
				if (content != null) {
					this.loadView(elem, content, parentModels);
				} else {
					var url = val.indexOf('/') === 0 ? this.baseURL + val : val;
					if (this.cache[url] != null) {
						this.loadView(elem, this.cache[url], parentModels);
					} else {
//						console.log('XHR: ' + url)
						new $cheeta.XHR(this).open('get', url).onSuccess(function(xhr) {
							this.cache[url] = xhr.data;
							this.loadView(elem, xhr.data, parentModels);
						}).send();
					}
				}
			} finally {
				elem.__$cheetaViewIsLoading = false;
			}
		}
	}).setOrder(900);
	viewDirective.baseURL = window.location.protocol + '//' + window.location.hostname +
		(window.location.port && ':' + window.location.port) + window.location.pathname;
	viewDirective.loadView = function(elem, content, parentModels) {
		$cheeta.compiler.uncompileChildren(parentModels, elem);
		elem.innerHTML = content;
		$cheeta.compiler.compileChildren(parentModels, elem, true);
	};
	viewDirective.cache = {};
})();