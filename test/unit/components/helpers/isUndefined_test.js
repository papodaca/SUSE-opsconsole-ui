// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function() {
  'use strict';

  describe('Component: isUndefined', function () {
    var isUndefined;

    beforeEach(module('pascalprecht.translate'));
    beforeEach(module('ngCookies'));
    beforeEach(module('ngMock'));
    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      isUndefined = $injector.get('isUndefined');
    }));

    it('should be available', function () {
      expect(isUndefined).toBeDefined();
      expect(typeof isUndefined).toBe('function');
    });

    it('should return true', function () {
      expect(isUndefined).toBeDefined();
      expect(typeof isUndefined).toBe('function');

      var object = {};

      expect(isUndefined(null)).toBeTruthy();
      expect(isUndefined(undefined)).toBeTruthy();
      expect(isUndefined(object.r)).toBeTruthy();
      expect(isUndefined(void(0))).toBeTruthy();
    });

    it('should return false', function () {
      expect(isUndefined).toBeDefined();
      expect(typeof isUndefined).toBe('function');

      expect(isUndefined('')).toBeFalsy();
      expect(isUndefined(true)).toBeFalsy();
      expect(isUndefined([])).toBeFalsy();
      expect(isUndefined({})).toBeFalsy();
      expect(isUndefined(15)).toBeFalsy();
      expect(isUndefined(0)).toBeFalsy();
    });

  });

})();
