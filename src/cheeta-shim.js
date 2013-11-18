if (window.attachEvent) {
	window.prototype.addEventListener = window.document.prototype.addEventListener = HTMLElement.prototype.addEventListener = function(type, listener) {
		this.attachEvent('on' + type, listener);
	}
}