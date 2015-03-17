$cheeta.directive({
	name: 'view,template',
	order: 900,
	baseURL: window.location.protocol + '//' + window.location.hostname +
			(window.location.port && ':' + window.location.port) + window.location.pathname,
	loadView: function(elem, content, modelRefs) {
		elem.innerHTML = content;
		$cheeta.compiler.compileChildren(elem, modelRefs, true);
	},
	cache: {},
	templates: {},
	loadingElements: {},
	link: function (elem, attr, all, modelRefs) {
		var dir = this;
		attr.watch(function(val) {
			if (!dir.loadingElements[elem] && val != null) {
				// to avoid infinite loop
				dir.loadingElements[elem] = true;
				try {
					var content = dir.templates[val];
					if (content != null) {
						dir.loadView(elem, content, modelRefs);
					} else {
						var url = val.indexOf('/') === 0 ? dir.baseURL + val : val;
						if (dir.cache[url] != null) {
							dir.loadView(elem, dir.cache[url], modelRefs);
						} else {
//						console.log('XHR: ' + url)
							$cheeta.http(this).get(url).send().after(function(data) {
								dir.cache[url] = data;
								dir.loadView(elem, data, modelRefs);
							});
						}
					}
				} finally {
					delete dir.loadingElements[elem];
				}
			}
		});
	}
});