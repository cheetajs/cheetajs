$cheeta.templates = {};

$cheeta.directive.define({
	name: 'view.',
	bind: function(elem, attrName, parentModels) {
		var _this = this;

		$cheeta.directive.onModelValueChange(elem, attrName, parentModels, function(val) {
			if (!elem.__$cheeta_template_loading && val != null) {
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
		});
	},
	baseURL: window.location.protocol + "//" + window.location.hostname + (window.location.port && ":" + window.location.port) + window.location.pathname,
	loadView: function(elem, content, parentModels) {
		$cheeta.compiler.uncompileChildren(parentModels, elem);
		elem.innerHTML = content;
		$cheeta.compiler.compileChildren(parentModels, elem, true);
	},
	cache: {},
	order: 900
});
