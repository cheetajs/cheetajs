module("TestSuiteName", {
    setup: function() {
        console.log('aaaa');
        var f = jasmine.getFixtures();
        f.fixturesPath = 'base';
        f.load('src/test/js/TestFixture.html');
    },
    teardown: function() {
        var f = jasmine.getFixtures();
        f.cleanUp();
        f.clearCache();
    }
});