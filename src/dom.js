'use strict';
if (!Element.prototype.attr) {
	Element.prototype.attr = function (n, v) {
		if (v != null) {
			this.setAttribute(n, v);
			return this;
		} else {
			return this.getAttribute(n) || this.getAttribute('data-' + n) ||
				(n.indexOf('.', n.length - 1) > -1 &&this.getAttribute(n.substring(n.length - 1)));
		}
	};
}
if (!Element.prototype.removeAttr) {
	Element.prototype.removeAttr = function (n) {
		return this.removeAttribute(n) || this.removeAttribute('data-' + n);
	};
}
if (!Element.prototype.addClass) {
	Element.prototype.addClass = function (c) {
		if (c != null) {
			if (!this.hasClass(c)) {
				this.setAttribute('class', (this.getAttribute('class') ? this.getAttribute('class') + ' ' : '') + c);
			}
		}
		return this;
	};
}
if (!Element.prototype.removeClass) {
	Element.prototype.removeClass = function (c) {
		if (c != null) {
			if (this.hasClass(c)) {
				this.setAttribute('class', this.getAttribute('class').replace(new RegExp('(' + c + '$)|( ' + c + ')', 'g'), ''));
			}
		}
		return this;
	};
}
if (!Element.prototype.hasClass) {
	Element.prototype.hasClass = function (c) {
		return this.getAttribute('class') && this.getAttribute('class').split(' ').indexOf(c) > -1;
	};
}
if (!Element.prototype.add) {
	Element.prototype.add = function (e, index) {
		if (e && e.length != null && e[0] != null) {
			for (var i = 0; i < e.length; i++) {
				this.add(e[i], index);
			}
		} else {
			this.insertBefore(e, index && this.childNodes[index]);
		}
		e.remove();
		return this;
	};
}
if (!Element.prototype.addBefore) {
	Element.prototype.addBefore = function (e) {
		if (e && e.length != null && e[0] != null) {
			for (var i = 0; i < e.length; i++) {
				this.addBefore(e[i]);
			}
		} else {
			this.parentNode.insertBefore(e, this);
		}
		return this;
	};
}
if (!Element.prototype.addAfter) {
	Element.prototype.addAfter = function (e) {
		if (e && e.length != null && e[0] != null) {
			for (var i = 0; i < e.length; i++) {
				this.addAfter(e[i]);
			}
		} else {
			this.parentNode.insertBefore(e, this.nextSibling);
		}
		return this;
	};
}
if (!Element.prototype.remove) {
	Element.prototype.remove = function () {
		if (this.parentNode) {this.parentNode.removeChild(this);}
		return this;
	};
}
if (!Element.prototype.html) {
	Element.prototype.html = function (h) {
		this.innerHTML = h;
		return this;
	};
}
if (!Element.prototype.wrap) {
	Element.prototype.wrap = function (e) {
		this.addAfter(e);
		this.remove();
		e.add(this);
		return this;
	};
}
if (!document.create) {
	document.create = function (s) {
		if (s.charAt(0) === '<') {
			var div = document.createElement('div');
			div.innerHTML = s;
			return div.removeChild(div.firstChild);
		} else {
			return document.createElement(s);
		}
	};
}
window.El = document.create;

(function() {
	var args = Array.prototype.slice.call(arguments);
	for (var i = 0; i < args.length; i++) {
		(args[i].prototype ? args[i].prototype : args[i]).on = (args[i].prototype ? args[i].prototype : args[i]).on ||
			function(events, fn) {
				var split = events.split(' ');
				for (var i = 0; i < split.length; i++) {
					if (split[i].length > 0) {
						this.addEventListener(split[i], fn, false);
					}
				}
			};
	}
})(Element, window, document);
(function() {
	var args = Array.prototype.slice.call(arguments);
	for (var i = 0; i < args.length; i++) {
		(args[i].prototype ? args[i].prototype : args[i]).off = (args[i].prototype ? args[i].prototype : args[i]).off || 
			function(events, fn) {
				var split = events.split(' ');
				for (var i = 0; i < split.length; i++) {
					if (split[i].length > 0) {
						this.removeEventListener(split[i], fn, false);
					}
				}
			};
	}
})(Element, window, document);