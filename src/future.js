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
  this.afterFn = null;
};
$cheeta.Futures.prototype = {
  add: function (future) {
    this.list.push(future);
  },
  run: function () {
    var futures = this;
    var list = this.list;
    this.list = [];
    setTimeout(function () {
      for (var i = 0; i < list.length; i++) {
        list[i].run();
      }
      if (futures.list.length) futures.run();
      futures.afterFn.call();
    }, 0);
    return this;
  },
  after: function (fn) {
    this.afterFn = fn;
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