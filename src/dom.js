if (!Element.prototype.attr) 
	Element.prototype.attr = function(n, v) {
		if (v != null) {
			this.setAttribute(n, v)
			return this;
		} else { 
			return this.getAttribute(n);
		}
	}
if (!Element.prototype.addClass) 
	Element.prototype.addClass = function(c) {
		if (c != null) {
			if (!this.hasClass(c)) {
				this.setAttribute('class', (this.getAttribute('class') ? this.getAttribute('class') + ' ' : '') + c);
			}
		}
		return this;
	}
if (!Element.prototype.removeClass) 
	Element.prototype.removeClass = function(c) {
		if (c != null) {
			if (this.hasClass(c)) {
				this.setAttribute('class', this.getAttribute('class').replace(new RegExp('(' + c + '$)|( ' + c + ')', 'g'), ''));
			}
		}
		return this;
	}
if (!Element.prototype.hasClass) 
	Element.prototype.hasClass = function(c) {
		return this.getAttribute('class') && this.getAttribute('class').split(' ').indexOf(c) > -1;
	}
if (!document.elem) 
	document.elem = function(tag, parent, sibling, insertBefore) {
		var el = document.createElement(tag);
		if (parent) 
			if (insertBefore) 
				parent.insertBefore(el, sibling) 
			else 
				sibling && sibling.nextSibling ? parent.insertBefore(el, sibling.nextSibling) : parent.appendChild(el);
		return el;
	}
if (!Element.prototype.on)
	Element.prototype.on = function(events, fn) {
		var split = events.split(' ');
		for (var i = 0; i < split.length; i++) {
			if (split[i].length > 0) {
				this.addEventListener(split[i], fn, false);
			}
		}
	}
if (!Element.prototype.off)
	Element.prototype.off = function(events, fn) {
		var split = events.split(' ');
		for (var i = 0; i < split.length; i++) {
			if (split[i].length > 0) {
				this.removeEventListener(split[i], fn, false);
			}
		}
	}
