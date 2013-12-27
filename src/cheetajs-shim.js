if (window.attachEvent) {
	window.prototype.addEventListener = window.document.prototype.addEventListener = HTMLElement.prototype.addEventListener = function(type, listener) {
		this.attachEvent('on' + type, listener);
	};
}

if (!window.console) console = {log: function() {}, error: function() {}};

Array.isArray = Array.isArray || function (vArg) {
    return Object.prototype.toString.call(vArg) === "[object Array]";
};

if (!Array.prototype.forEach){
  Array.prototype.forEach = function(fun /*, thisArg */) {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++)
    {
      if (i in t)
        fun.call(thisArg, t[i], i, t);
    }
  };
}