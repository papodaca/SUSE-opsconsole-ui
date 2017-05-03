// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function() {
  'use strict';

  describe('Component: getTimeToGoBackISODateStr', function () {
    var getTimeToGoBackISODateStr;

    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      getTimeToGoBackISODateStr = $injector.get('getTimeToGoBackISODateStr');
    }));

    it('should be available', function () {
      expect(getTimeToGoBackISODateStr).toBeDefined();
      expect(typeof getTimeToGoBackISODateStr).toBe('function');
    });

    it('should return noting', function() {
      expect(getTimeToGoBackISODateStr).toBeDefined();

      expect(getTimeToGoBackISODateStr()).toBe('');
    });

    it('should return the date', function() {
      expect(getTimeToGoBackISODateStr).toBeDefined();

      var now = moment().subtract(60, 's').unix();
      expect(moment(getTimeToGoBackISODateStr(60000)).unix()).toBeCloseTo(now, 5);
    });

  });

})();
