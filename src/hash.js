$cheeta.hash = {
	keyval: {},
	watchers: {},
	watch: function(key, fn) {
		if (key instanceof Function) {
			fn = key;
			key = '';
		}
		if (this.watchers[key] == null) {
			this.watchers[key] = [];
		}
		if (this.watchers[key].indexOf(fn) === -1) {
			this.watchers[key].push(fn);
		}
	},
	unwatch: function(fn, key) {
		if (key instanceof Function) {
			fn = key;
			key = '';
		}
		var list = this.watchers[key];
		if (list != null) {
			var index = list.indexOf(fn);
			if (index > -1) {
				list.splice(index, 1);
			}
		}
	},
	notify: function(key, newVal, oldVal) {
		var list = this.watchers[key];
		if (list != null) {
			for (var i = 0; i < list.length; i++) {
				list[i](newVal, oldVal);
			}
		}
	},
	set: function(key, val) {
		if (val == undefined) {
			val = key;
			key = '';
		}
		var oldVal = this.keyval[key]; 
		this.keyval[key] = val;
		var toHash = function() {
			var hash = this.keyval[''] || '';
			for (var key in this.keyval) {
				if (key.length > 0) {
					hash += (hash.length > 0 ? '&' : '') + key + "=" + this.keyval[key];
				}
			}
			return hash;
		};
		window.location.hash = toHash();
		this.notify(key, val, oldVal);
	},
	init: function() {
		var _this = this;
		window.addEventListener('hashchange', function () {
			var hash = window.location.hash, index = 0, key = '', val, allKeys = {};
			try {
				hash = hash.substring(hash.length > 1 && hash.charAt(2) == '&' ? 2 : 1);
				for (var i = 0; i <= hash.length; i++) {
					if (hash.charAt(i) == '&' || i == hash.length) {
						val = hash.substring(index, i);
						if (_this.keyval[key] == null || _this.keyval[key] != val) {
							var prev = _this.keyval[key]; 
							_this.keyval[key] = val;
							_this.notify(key, val, prev);
						}
						index = i + 1;
						allKeys[key] = true;
						key = '';
					} else if (hash.charAt(i) == '=') {
						key = hash.substring(index, i);
						index = i + 1;
					}
				}
				
				for (var key in _this.keyval) {
					if (allKeys[key] == null) {
						var prev = _this.keyval[key];
						delete _this.keyval[key];
						_this.notify(key, null, prev);
					} 
				}
			} finally {
				_this.value = hash;
			}
		}, false);
	},
	get value() {
		return window.location.hash.length > 0 ? window.location.hash.substring(1) : window.location.hash;
	},
	set value(h) {		
		return window.location.hash = '#' + h;
	}
};
$cheeta.route = $cheeta.route || function(map, hashVal) {
	if (map == null) {
		return null;
	}
	var len = 0;
	var url = null;
	for (var key in map) {
		if (hashVal.indexOf(key) == 0 && len < key.length) {
			len = key.length;
			url = map[key];
		}
	}
	return url;
}