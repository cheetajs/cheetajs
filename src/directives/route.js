$cheeta.directive('route.', function(elem, attr, parentModels) {
	var _this = this;
	
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
				$cheeta.directive('template.').fn(elem, {name: 'template.', value: url}, parentModels);
			}
		});
	});
}, 900);
