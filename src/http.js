$cheeta.XHR = function(target) {
	target = target || this;
	var origSend = this.send;
	var origOpen = this.open;
	var xhr = new XMLHttpRequest();
	xhr.open = function() {
		origOpen.apply(xhr, arguments);
		return xhr;
	};
	xhr.send = function() {
		origSend.apply(xhr, arguments);
		return xhr;
	};
	var successCallbacks = [], completeCallbacks = [], errorCallbacks = [], stateChangeCallbacks = [];
	this.successCallbacks = []; this.completeCallbacks = []; this.errorCallbacks = []; this.stateChangeCallbacks = [];
	xhr.onError = function(callback) {
		errorCallbacks.push(callback);
		return xhr;
	};
	xhr.onSuccess = function(callback) {
		successCallbacks.push(callback);
		return xhr;
	};
	xhr.onComplete = function(callback) {
		completeCallbacks.push(callback);
		return xhr;
	};
	xhr.onStateChange = function(callback) {
		stateChangeCallbacks.push(callback);
		return xhr;
	};
	
	var _this = this;
	this.onError = function(callback) {
		_this.errorCallbacks.push(callback);
		return _this;
	};
	this.onSuccess = function(callback) {
		_this.successCallbacks.push(callback);
		return _this;
	};
	this.onComplete = function(callback) {
		_this.completeCallbacks.push(callback);
		return _this;
	};
	this.onStateChange = function(callback) {
		_this.stateChangeCallbacks.push(callback);
		return this;
	};
	
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (200 <= xhr.status && xhr.status < 300) {
				for (var i = 0; i < successCallbacks.length; i++) {
					successCallbacks[i].apply(target, [xhr]);
				}
				for (var i = 0; i < _this.successCallbacks.length; i++) {
					_this.successCallbacks[i].apply(target, [xhr]);
				}
			} else {
				for (var i = 0; i < errorCallbacks.length; i++) {
					errorCallbacks[i].apply(target, [xhr]);
				}
				for (var i = 0; i < _this.errorCallbacks.length; i++) {
					_this.errorCallbacks[i].apply(target, [xhr]);
				}
			}
			for (var i = 0; i < completeCallbacks.length; i++) {
				completeCallbacks[i].apply(target, [xhr]);
			}
			for (var i = 0; i < _this.completeCallbacks.length; i++) {
				_this.completeCallbacks[i].apply(target, [xhr]);
			}
			
        }
		for (var i = 0; i < stateChangeCallbacks.length; i++) {
			stateChangeCallbacks[i].apply(target, [xhr]);
		}		
		for (var i = 0; i < _this.stateChangeCallbacks.length; i++) {
			_this.stateChangeCallbacks[i].apply(target, [xhr]);
		}
	};
	Object.defineProperty(xhr, 'data', {
		get: function() {
			return xhr.getResponseHeader('Content-Type') === 'application/json' ? JSON.parse(xhr.responseText) : xhr.responseText;
		}, 
		enumerable: true,
		configurable: true
	});
	
	return xhr;
};
$cheeta.XHR.prototype = new XMLHttpRequest();