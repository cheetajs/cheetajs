'use strict';
(function() {
	function extend(fnName, fn) {
		return function() {
			var args = Array.prototype.slice.call(arguments);
			for (var i = 0; i < args.length; i++) {
				var obj = args[i];
				var pro = obj.prototype ? obj.prototype : obj;
				if (!pro[fnName]) {
					pro[fnName] = fn;
				}
			}
		};
	}
	extend('attr', function (n, v) {
		if (v != null) {
			this.setAttribute(n, v);
			return this;
		} else {
			return this.getAttribute(n) || this.getAttribute('data-' + n) ||
				(n.indexOf('.', n.length - 1) === -1 && this.attr(n + '.'));
		}
	})(Element);
	extend('removeAttr', function (n) {
		this.removeAttribute(n);
		this.removeAttribute('data-' + n);
		return this;
	})(Element);
	extend('addClass', function (c) {
		if (c != null) {
			if (!this.hasClass(c)) {
				this.setAttribute('class', (this.getAttribute('class') ? this.getAttribute('class') + ' ' : '') + c);
			}
		}
		return this;
	})(Element);
	extend('removeClass', function (c) {
		if (c != null) {
			if (this.hasClass(c)) {
				this.setAttribute('class', this.getAttribute('class').replace(new RegExp('(' + c + '$)|( ' + c + ')', 'g'), ''));
			}
		}
		return this;
	})(Element);
	extend('hasClass', function (c) {
		return this.getAttribute('class') && this.getAttribute('class').split(' ').indexOf(c) > -1;
	})(Element);
	extend('add', function (e, index) {
		if (e && e.length != null && e[0] != null) {
			for (var i = 0; i < e.length; i++) {
				this.add(e[i], index);
			}
		} else {
			this.insertBefore(e, index && this.childNodes[index]);
		}
		return this;
	})(Element);
	extend('addBefore', function (e) {
		if (e && e.length != null && e[0] != null) {
			for (var i = 0; i < e.length; i++) {
				this.addBefore(e[i]);
			}
		} else {
			this.parentNode.insertBefore(e, this);
		}
		return this;
	})(Element, Node, Comment, Text);
	extend('addAfter', function (e) {
		if (e && e.length != null && e[0] != null) {
			for (var i = 0; i < e.length; i++) {
				this.addAfter(e[i]);
			}
		} else {
			this.parentNode.insertBefore(e, this.nextSibling);
		}
		return this;
	})(Element, Node, Comment, Text);
	extend('parent', function () {
		return this.parentNode;
	})(Element, Node, Comment, Text);
	extend('next', function () {
		return this.nextSibling;
	})(Element, Node, Comment, Text);
	extend('prev', function () {
		return this.previousSibling;
	})(Element, Node, Comment, Text);
	extend('nextE', function () {
		return this.nextElementSibling;
	})(Element, Node, Comment, Text);
	extend('prevE', function () {
		return this.previousElementSibling;
	})(Element, Node, Comment, Text);
	extend('remove', function () {
		if (this.parentNode) {this.parentNode.removeChild(this);}
		return this;
	})(Element);
	extend('html', function (h) {
		if (h === undefined) {
			return this.innerHTML;
		}
		this.innerHTML = h;
		return this;
	})(Element);
	extend('text', function (h) {
		if (h === undefined) {
			return this.innerText;
		}
		this.innerText = h;
		return this;
	})(Element);
	extend('wrap', function (e) {
		this.addAfter(e);
		this.remove();
		e.add(this);
		return this;
	})(Element, Node, Comment, Text);
	extend('create', function (s) {
		if (s.charAt(0) === '<') {
			var div = document.createElement('div');
			div.innerHTML = s;
			return div.removeChild(div.firstChild);
		} else {
			return document.createElement(s);
		}
	})(document);

	extend('on', function(events, fn) {
		var split = events.split(' ');
		for (var i = 0; i < split.length; i++) {
			if (split[i].length > 0) {
				this.addEventListener(split[i], fn, false);
			}
		}
		return fn;
	})(Element, window, document);

	extend('off', function(events, fn) {
		var split = events.split(' ');
		for (var i = 0; i < split.length; i++) {
			if (split[i].length > 0) {
				this.removeEventListener(split[i], fn, false);
			}
		}
	})(Element, window, document);

	window.E = function(o) {
		if (o instanceof Element || o.nodeType != null) {
			return o;
		} else if (Object.isString(o)) {
			return document.create(o);
		}
	};

	document.addCssStyle = function (style) {
		var elHead = document.getElementsByTagName('head')[0], elStyle = document.createElement('style');
		elStyle.type = 'text/css';
		elHead.appendChild(elStyle);
		elStyle.innerHTML = style;
	};
})();