$cheeta.XHR = function() {
	var origSend = this.send;
	var origOpen = this.open;
	var xhr = this;
	this.open = function() {
		origOpen.apply(_this, arguments);
		return xhr;
	};
	this.send = function() {
		origSend.apply(_this, arguments);
		return xhr;
	};
	var successCallbacks = [], completeCallbacks = [], errorCallbacks = [], stateChangeCallbacks = [];
	this.onError = function(callback) {
		errorCallbacks.push(callback);
		return xhr;
	};
	this.onSuccess = function(callback) {
		successCallbacks.push(callback);
		return xhr;
	};
	this.onComplete = function(callback) {
		completeCallbacks.push(callback);
		return xhr;
	};
	this.onStateChange = function(callback) {
		stateChangeCallbacks.push(callback);
	};
	this.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (200 <= xhr.status && xhr.status < 300) {
				for (var i = 0; i < successCallbacks.length; i++) {
					successCallbacks[i].apply(xhr, [xhr]);
				}
			} else {
				for (var i = 0; i < errorCallbacks.length; i++) {
					errorCallbacks[i].apply(xhr, [xhr]);
				}
			}
			for (var i = 0; i < completeCallbacks.length; i++) {
				completeCallbacks[i].apply(xhr, [xhr]);
			}
        }
		for (var i = 0; i < stateChangeCallbacks.length; i++) {
			stateChangeCallbacks[i].apply(xhr, [xhr]);
		}		
	};
	Object.defineProperty(this, 'data', {
		get: function() {
			xhr.getResponseHeader('Content-Type') == 'application/json' ? JSON.stringify(xhr.responseText) : xhr.responseText;
		}
	}, configurable: true);
};

$cheeta.XHR.prototype = new XMLHttpRequest();
$cheeta.XHR.prototype.constructor = $cheeta.XHR;