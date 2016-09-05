/*jshint -W020 */
window.$cheeta = window.$cheeta || {};
$cheeta.MapList = function () {
  this.list = [];
};

$cheeta.MapList.prototype = {
  sortedIndex: function (list, key) {
    var low = 0,
      high = list.length;

    while (low < high) {
      var mid = (low + high) >>> 1;
      if (list[mid].key < key) low = mid + 1;
      else high = mid;
    }
    return low;
  },
  put: function (key, val) {
    var index = this.sortedIndex(this.list, key);
    if (index < this.list.length && this.list[index].key === key) {
      this.list[index].value.push(val);
    } else {
      this.list.splice(index, 0, {key: key, value: [val]});
    }
    return this;
  },
  get: function (key) {
    var index = this.sortedIndex(this.list, key);
    return this.list[index] !== undefined && this.list[index].key === key ?
      this.list[index].value : undefined;
  },
  getPrefixes: function(key) {
    var entries = [];
    if (!this.list.length) return entries;
    var index = this.sortedIndex(this.list, key);
    for (var i = index; i < this.list.length; i++) {
      if (!this.list[index].key.startsWith(key)) break;
      entries.push(this.list[i]);
    }
    return entries;
  }
};

