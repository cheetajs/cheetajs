//$cheeta.api = new Service({
//    url: 'api url like http://mysite.com/api/user/{id}/fans',
//    method: 'GET|POST|PUT|DELETE',
$cheeta.resource = function (config) {
  if (Object.isString(config)) {
    config = {url: config};
  }
  var ResourceClass = function (obj) {
    Object.copy(obj, this);

    var _this = this;

    function callXHR(method, obj, fn, err) {
      _this.$xhr().open(method, _this.$resolveUrl(), config.async || true).json(obj)
        .after(function (data) {
          if (data && Object.isString(data)) {
            data = JSON.parse(data);
          }
          if (fn) {
            if (data != null) {
              Object.copy(data, _this);
            }
            fn.call(_this, data);
          }
        }).onError(function (status, data) {
        if (err) {
          err.call(_this, status, data);
        }
      });
    }

    this.$resolveUrl = function () {
      var _this = this;
      return config.url.replace(/{:(\w+)}/, function (p, m) {
        var val = _this[m];
        return val ? val : '';
      });
    };
    this.$xhr = function (newXHR) {
      return newXHR ? newXHR() : new $cheeta.http();
    };
    this.$create = function (fn, err) {
      callXHR('POST', this, fn, err);
      return this;
    };
    this.$post = function (fn, err) {
      callXHR('POST', null, fn, err);
      return this;
    };
    this.$put = this.$update = function (fn, err) {
      callXHR('PUT', this, fn, err);
      return this;
    };
    this.$remove = function (fn, err) {
      callXHR('DELETE', null, fn, err);
      return this;
    };
    this.$get = function (fn, err) {
      callXHR('GET', null, fn, err);
      return this;
    };
    this.$query = function (params, dataPath, fn, err) {
      return ResourceClass.$query(this, dataPath).after(fn).error(err);
    };
  };

  ResourceClass.$query = function (params, dataPath) {
    var resp = [], after, err;
    resp.after = function (fn) {
      after = fn;
      return this;
    };

    resp.error = function (fn) {
      err = fn;
      return this;
    };

    var sample = params || params instanceof ResourceClass ? params : new ResourceClass();

    var isStringDataPath = dataPath && Object.isString(dataPath);

    sample.$xhr().open('GET', $cheeta.url(sample.$resolveUrl(config.url)).params(params).toString(),
      config.async || true).send().after(function (data) {
      if (after) {
        if (dataPath == null) {
        } else if (isStringDataPath) {
          var split = dataPath.split('.');
          for (var j = 0; j < split.length; j++) {
            data = data[split[j]];
          }
        }
        for (var i = 0; i < data.length; i++) {
          resp.push(new ResourceClass(data[i]));
        }
        after.call(this, data, resp);
      }
    }).onError(function (status, data) {
      if (err) {
        err.call(this, status, data);
      }
    });
    return resp;
  };

  return ResourceClass;
};