Test = {
    assertFuture: function(assert, fn){
        setTimeout(function () {
            fn();
            done();
        }, 1);
        var done = assert.async();
    }
};
