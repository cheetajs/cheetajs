$cheeta.templates = {};

$cheeta.directive.define({
	name: 'load.', 
	bind: function(elem, attrName, parentModels) {
		var loadTemplate = this.loadTemplate;
		
		var attrValue = elem.getAttribute(attrName);
		var content = $cheeta.templates[attrValue];
		elem.__$cheeta_template_loading = attrValue; 
		if (content != null) {
			loadTemplate(elem, content, parentModels);
		} else {
			new $cheeta.XHR().open('get', attrValue.indexOf('/') === 0 ? baseURL + attrValue : attrValue).onSuccess(function(xhr) {
				loadTemplate(elem, xhr.data, parentModels);
			}).send();
		}
	},
	baseURL: window.location.protocol + "//" + window.location.hostname + (window.location.port && ":" + window.location.port) + window.location.pathname,
	loadTemplate: function(elem, content, parentModels) {
		$cheeta.compiler.uncompile(parentModels, elem);
		elem.innerHTML = content;
		$cheeta.compiler.compile(parentModels, elem, true);
	},
	cache: {},
	order: 900
});
