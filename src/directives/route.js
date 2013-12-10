$cheeta.directive.define({
	name: 'route.', 
	bind: function(elem, attrName, parentModels) {
		var _this = this;
		
		$cheeta.directive.onModelUpdate(elem, attrName, parentModels, function(val) {
			if (_this.watchFn != null) {
				$cheeta.location.unwatch(_this.fn);
			}
			_this.watchFn = $cheeta.location.watch(function(hash) {
				var len = 0;
				var url = null;
				for (var key in val) {
					if (hash.indexOf(key) == 0 && len < key.length) {
						len = key.length;
						url = val[key];
					}
				}
				if (url != null) {
					$cheeta.directive.get('template.')[0].bind(elem, {name: 'template.', value: url}, parentModels);
				}
			});
		});
	},
	order: 900
});
