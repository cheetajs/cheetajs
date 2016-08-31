window.M.filter = function (array, q, options) {
  function contains(obj, q) {
    if (Object.isString(obj)) {
      var i = obj.search(q instanceof RegExp ? q : new RegExp(q, options && options.matchCase ? '' : 'i'));
      if (i > -1) {
        return (obj.length - i + 1) * 100 / obj.length;
      }
      if (!options || !options.sort) {
        return -1;
      }
      var k = 0;
      i = 0;
      while (k > -1) {
        k = obj.substring(k).indexOf(q[i++]);
      }
      return i / obj.length;
    }
    if (Object.isObject(obj)) {
      var sum = 0;
      if (options.field || options.fields) {
        options.fields = options.fields || [options.field];
        options.fields.map(function (f, i) {
          sum += contains(obj[f], q, f) * (options.fields.length - i * 100);
        });
      } else for (var key in obj) {
        if (obj.hasOwnProperty(key) && !Object.isFunction(obj[key])) {
          sum += contains(obj[key], q, key);
        }
      }
      return sum;
    } else {
      return obj === q ? 100 : 0;
    }
  }

  function filter() {
    if (array == null || q == null) {
      return array;
    }
    var result = [];
    array.forEach(function (item) {
      var score = options && options.scoreFn ? options.scoreFn(item, q) : contains(item, q);
      if (score > 0) {
        result.push({item: item, score: score});
      }
    });
    result.sort(function (a, b) {
      return b.score - a.score;
    });
    return result.map(function (obj) {
      return obj.item;
    });
  }

  if (q != null && (!Object.isString(q) || q.length)) {
    return filter();
  } else {
    return array;
  }

};