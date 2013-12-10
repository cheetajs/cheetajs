$cheeta.templates = {};

$cheeta.directive('template.', function(elem, attr, parentModels) {
	var baseURL = window.location.protocol + "//" + window.location.hostname + (window.location.port && ":" + window.location.port) + window.location.pathname;

	this.loadTemplate = function(elem, content) {
		$cheeta.compiler.uncompile(parentModels, elem);
		elem.innerHTML = content;
		$cheeta.compiler.compile(parentModels, elem, true);
	};
	
	var loadTemplate = this.loadTemplate;
	
	var content = $cheeta.templates[attr.value];
	if (content != null) {
		loadTemplate(elem, content);
	} else {
		new $cheeta.XHR().open('get', attr.value.indexOf('/') === 0 ? baseURL + attr.value : attr.value).onSuccess(function(xhr) {
			loadTemplate(elem, xhr.data);
		}).send();
	}
}, 900);
