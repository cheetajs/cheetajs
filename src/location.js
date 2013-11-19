$cheeta.location = {
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
		this.watchers[key].push(fn);
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
		window.location.hash = this.toHash();
		this.notify(key, val, oldVal);
	},
	toHash: function() {
		var hash = this.keyval[''] || '';
		for (var key in this.keyval) {
			if (key.length > 0) {
				hash += (hash.length > 0 ? '&' : '') + key + "=" + this.keyval[key];
			}
		}
		return hash;
	},
	init: function() {
		var loc = this;
		window.addEventListener('hashchange', function () {
			var hash = window.location.hash, index = 0, key = '', val, allKeys = {};
			hash = hash.substring(hash.length > 1 && hash.charAt(2) == '&' ? 2 : 1);
			for (var i = 0; i <= hash.length; i++) {
				if (hash.charAt(i) == '&' || i == hash.length) {
					val = hash.substring(index, i);
					if (loc.keyval[key] == null || loc.keyval[key] != val) {
						var prev = loc.keyval[key]; 
						loc.keyval[key] = val;
						loc.notify(key, val, prev);
					}
					index = i + 1;
					allKeys[key] = true;
					key = '';
				} else if (hash.charAt(i) == '=') {
					key = hash.substring(index, i);
					index = i + 1;
				}
			}
			
			for (var key in loc.keyval) {
				if (allKeys[key] == null) {
					var prev = loc.keyval[key];
					delete loc.keyval[key];
					loc.notify(key, null, prev);
				} 
			}
       }, false);
	}
};