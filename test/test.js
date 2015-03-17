module("TestSuiteName", {
    setup: function() {
        console.log('dddddddddddddddd');
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
jasmine.getFixtures().fixturesPath = 'base/test/';
describe('jquery plugin', function() {
    it('should add default classes to the element', function() {
        var f = jasmine.getFixtures();
        f.fixturesPath = 'base';
        f.load('test/cheetajs.html');
        //loadFixtures('cheetajs.html');
        elem = $('#b');
        //elem = document.querySelector('body');
        console.log(elem[0]);
        elem.myTestedPlugin();
        expect(elem).toHaveClass('aa');
    });
    //
    //it('should add default text to the element', function() {
    //    elem.plugin();
    //    expect(elem).toHaveText('Some default text');
    //});
    //
    //it('should add add custom classes to the element', function() {
    //    elem.plugin({ 'classes': 'my custom classes' });
    //    expect(elem).toHaveClass('my custom classes');
    //});
    //
    //it('should add add custom text to the element', function() {
    //    elem.plugin({ 'text': 'Hello' });
    //    expect(elem).toHaveText('Hello');
    //});
});
//
//module('integration tests', {
//    setup: function() {
//        Ember.run(function() {
//            App.reset();
//            App.Person.people = [];
//        });
//    },
//    teardown: function() {
//        $.mockjaxClear();
//    }
//});