$cheeta.directive('route.', function(elem, attr, parentModels) {
	var _this = this;
	var baseURL = window.location.protocol + "//" + window.location.hostname + (window.location.port && ":" + window.location.port) + window.location.pathname;
	
	$cheeta.directive.onModelUpdate(elem, attr, parentModels, function(val) {
		var routes = val;
		if (_this.watchFn != null) {
			$cheeta.location.unwatch(_this.fn);
		}
		_this.watchFn = $cheeta.location.watch(function(hash) {
			var len = 0;
			var url = null;
			for (var key in routes) {
				if (hash.indexOf(key) == 0 && len < key.length) {
					len = key.length;
					url = routes[key];
				}
			}
			if (url != null) {
				new $cheeta.XHR().open('get', url.indexOf('/') === 0 ? baseURL + url : url).onSuccess(function(xhr) {
					elem.innerHTML = xhr.data;
					$cheeta.compiler.compileElem(parentModels, elem);
					var scripts = document.getElementsByTagName('script');
					for (var i = 0; i < scripts.length; i++) {
						var script = scripts[i];
						console.log(script);
						if ((script.parentNode == null || script.parentNode.tagName.toLowerCase() != 'head') && 
								(script.type == null || script.type == '' || script.type === 'text/javascript')) {
							var content = script.text || script.textContent || script.innerHTML || "";
							var head = document.getElementsByTagName("head")[0] || document.documentElement;
						    script = document.createElement("script");
						    script.type = "text/javascript";
						    script.appendChild(document.createTextNode(content));
						    head.insertBefore(script, head.firstChild);
						    head.removeChild(script);
						}
					}
				}).send();
			}
		});
	});
}, 900);
