define(function() {
	var array = require('../../dest/core/core-built').array;
	describe('Test rfl.array', function(){
		describe('Test rfl.array.isArray', function(){
			it('[] should be array.', function(){
				expect(array.isArray([])).toBeTruthy();
			});
			it('Number should not be array.', function(){
				expect(array.isArray(123)).toBeFalsy();
			});
			it('String should not be array.', function(){
				expect(array.isArray("hello,world")).toBeFalsy();
			});
			it('Object should not be array.', function(){
				expect(array.isArray({})).toBeFalsy();
			});
			it('HTMLCollection should not be array.', function(){
				expect(array.isArray(document.getElementsByTagName("head"))).toBeFalsy();
			});
			it('Arugments should not be array.', function(){
				expect(array.isArray(arguments)).toBeFalsy();
			});
		});
	});
});