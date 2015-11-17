$cheeta.Model.root.value.filter = function (array, q) {
  function contains(obj, q) {
    if (Object.isString(obj)) {
      if (obj.indexOf(q) > -1) {
        return 100;
      }
      var k = 0, i = 0;
      while (k > -1) {
        k = obj.substring(k).indexOf(q[i++]);
      }
      return i;
    }
    if (Object.isObject(obj)) {
      var sum = 0;
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          sum += contains(obj[key], q);
        }
      }
      return sum;
    } else {
      return obj === q ? 100 : 0;
    }
  }

  if (array == null || q == null) {
    return array;
  }
  var result = [];
  array.forEach(function (item) {
    var score = contains(item, q);
    if (score > 0) {
      result.push({item: item, score: score});
    }
  });
  result = result.sort(function (a, b) {
    return b - a;
  });
  return result;
};