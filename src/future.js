$cheeta.Future = function (fn, args) {
  this.fn = fn;
  this.args = args;
};
$cheeta.Future.prototype = {
  run: function () {
    this.fn.apply(this, this.args);
  }
};
$cheeta.Futures = function () {
  this.list = [];
  this.afterFns = [];
};
$cheeta.Futures.prototype = {
  add: function (future) {
    this.list.push(future);
  },
  run: function () {
    if (this.isRunning) return this;
    var futures = this;
    var list = this.list;
    this.list = [];
    setTimeout(function () {
      this.isRunning = true;
      try {
        for (var i = 0; i < list.length; i++) {
          list[i].run();
        }
      } finally {
        delete this.isRunning;
      }
      if (futures.list.length) futures.run();
      for (var j = 0; j < futures.afterFns.length; j++) {
        var fn = futures.afterFns[j];
        fn.call();
      }
    }, 0);
    return this;
  },
  after: function (fn) {
    this.afterFns.push(fn);
  }
};
$cheeta.Futures.current = new $cheeta.Futures();
$cheeta.future = function (fn) {
  $cheeta.Futures.current.add(new $cheeta.Future(fn, Array.prototype.slice.call(arguments, 2)));
};

$cheeta.runFutures = function (after) {
  var f = $cheeta.Futures.current.run();
  if (after) f.after(function (result) {
    after(result);
  });
};