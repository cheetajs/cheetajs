$cheeta.keyconsts = {
	'backspace':8,'tab':9,'enter':13,'shift':16,'ctrl':17,'alt':18,'space':32,'pause':19,'break':19,'capslock':20,'escape':27,'esc':27,'pageup':33,'pagedown':34,'end':35,
	'home':36,'left':37,'up':38,'right':39,'down arrow':40,'insert':45,	'delete':46,'colon':58, 'f1':112,'f2':113,'f3':114,'f4':115,'f5':116,'f6':117,'f7':118,
	'f8':119,'f9':120,'f10':121,'f11':122,'f12':123,'numlock':144,'scrolllock':145,'semicolon':186,'comma':188,'dash':189,'dot':190
};
new $cheeta.Directive('on*').onAttach(function(elem, attrName, parentModels) {
	this.resolveModelNames(elem, attrName, parentModels);
	
	var baseAttrName = attrName.substring(attrName.indexOf('data-') == 0 ? 7 : 2, attrName.length - 1);
	var split = baseAttrName.split('-');
	(function bindEvent(event, keys, attrName) {
		var fn = function(e) {
			eval(elem.getAttribute(attrName));
		};
		if (event.indexOf('key') == 0) {
			var codes = [];
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				if (key.length == 1) {
					codes[i] = key.charCodeAt(0);
				} else {
					codes[i] = $cheeta.keyconsts[key.toLowerCase()];
					if (codes[i] == null) {
						codes[i] = parseInt(key);
						if (isNaN(codes[i])) {
							throw 'unknown key: ' + key;
						}
					}
				}
			}
			var keyFn = function(e) {
				if (codes.indexOf(e.which) > -1) {
					fn.apply(elem, [e]);
					e.preventDefault();
					e.stopPropagation();
				}
			};
			elem.addEventListener(event, keyFn, false);			
		} else {
			var listenerFn = function(e) {
				fn.apply(elem, [e]);
				e.preventDefault();
				e.stopPropagation();
			};
			elem.addEventListener(event, listenerFn, false);
		}
	})(split[0], split.slice(1), attrName);
});
