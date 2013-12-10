$cheeta.templates = {};

$cheeta.directive.define({
	name: 'template.', 
	bind: function(elem, attrName, parentModels) {
		var baseURL = window.location.protocol + "//" + window.location.hostname + (window.location.port && ":" + window.location.port) + window.location.pathname;
	
		this.loadTemplate = function(elem, content) {
			$cheeta.compiler.uncompile(parentModels, elem);
			elem.innerHTML = content;
			$cheeta.compiler.compile(parentModels, elem, true);
		};
		
		var loadTemplate = this.loadTemplate;
		
		var attrValue = elem.getAttribute(attrName);
		var content = $cheeta.templates[attrValue];
		if (content != null) {
			loadTemplate(elem, content);
		} else {
			new $cheeta.XHR().open('get', attrValue
					.indexOf('/') === 0 ? baseURL + attrValue : attrValue).onSuccess(function(xhr) {
				loadTemplate(elem, xhr.data);
			}).send();
		}
	},
	order: 900
});
