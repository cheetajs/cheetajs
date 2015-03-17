
Object.isString = function(str) {
    return typeof str === 'string' || str instanceof String;
};

Object.isFunction = function(v) {
    return typeof v === 'function';
};

Object.isBoolean = function(v) {
    return typeof v === 'boolean';
};

Object.isObject = function(v) {
    return v instanceof Object;
};

Object.isArray = function(v) {
    return Array.isArray(v);
};

Object.copy = function(from, to) {
    to = to || {};
    for (var key in from) {
        if (from.hasOwnProperty(key)) {
            to[key] = from[key];
        }
    }
    return to;
};

//window.Service = function(input, fn, output) {
//    this.input = input;
//    this.fn = fn;
//    this.outer = output;
//
//    this.validators = {
//        boolean: function(v) {
//            return Object.isBoolean(v);
//        },
//        number: function(v) {
//            return isNaN(v);
//        }
//    };
//
//    return function(val) {
//        function makeWith(key) {
//            return function(v) {
//                if (input[key].validate) {
//                    input[key].validate(v);
//                }
//                val[key] = v;
//            };
//        }
//        if (input != null) {
//            for (var key in input) {
//                if (input.hasOwnProperty(key)) {
//                    this['with' + key.charAt(0).toUpperCase() + key.substring(1)] = makeWith(key);
//                    if (val) {
//                        if (input[key].validate) {
//                            input[key].validate(val[key]);
//                        }
//                        var defaultV = input[key].defaultVal;
//                        if (!val[key] && defaultV) {
//                            val[key] = Object.isFunction(defaultV) ? defaultV.call(this) : defaultV;
//                        }
//                    }
//                }
//            }
//        }
//
//        var _this = this;
//        this.run = function() {
//            return fn.apply(_this, val);
//        };
//    };
//};