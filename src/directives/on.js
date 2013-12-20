$cheeta.keyconsts = {
	'backspace':8,'tab':9,'enter':13,'shift':16,'ctrl':17,'alt':18,'space':32,'pause':19,'break':19,'capslock':20,'escape':27,'pageup':33,'pagedown':34,'end':35,
	'home':36,'left':37,'up':38,'right':39,'down arrow':40,'insert':45,	'delete':46,'colon':58, 'f1':112,'f2':113,'f3':114,'f4':115,'f5':116,'f6':117,'f7':118,
	'f8':119,'f9':120,'f10':121,'f11':122,'f12':123,'numlock':144,'scrolllock':145,'semicolon':186,'comma':188,'dash':189,'dot':190
};
new $cheeta.Directive('on*').onAttach(function(elem, attrName, parentModels) {
	this.resolveModelNames(elem, attrName, parentModels);
	
	var baseAttrName = attrName.substring(attrName.indexOf('data-') == 0 ? 7 : 2, attrName.length - 1);
	var split = baseAttrName.split('-');
	this.listeners = this.listeners || {};
	(function bindEvent(event, key, attrName) {
		var fn = function(e) {
			eval(elem.getAttribute(attrName));
		};
		this.listeners[this.id(elem)]
		elem.__$cheeta_event_listeners = elem.__$cheeta_event_listeners || [];
		if (event.indexOf('key') == 0) {
			var keyFn = function(e) {
				var code = 1;
				if (key.length == 1) {
					code = key.charCodeAt(0);
				} else {
					code = $cheeta.keyconsts[key];
					if (code == null) {
						code = parseInt(key);
						if (isNaN(code)) {
							throw 'unknown key: ' + key;
						}
					}
				}
				if (e.which == code) {
					fn.apply(elem, [e]);
				}
			};
			elem.__$cheeta_event_listeners.push({event: event, fn: keyFn});
			elem.addEventListener(event, keyFn, false);			
		} else {
			var listenerFn = function(e) {
				fn.apply(elem, [e]);
			};
			elem.__$cheeta_event_listeners.push({event: event, fn: listenerFn});
			elem.addEventListener(event, listenerFn, false);
		}
	})(split[0], split[1], attrName);
}).onDetach(function(elem, attrName, parentModels) {
	var listeners = elem.__$cheeta_event_listeners;
	for (var i = 0; i < listeners.length; i++) {
		var listener = listeners[i];
		elem.removeEventListener(listener.event, listener.fn, false)
	}
});
