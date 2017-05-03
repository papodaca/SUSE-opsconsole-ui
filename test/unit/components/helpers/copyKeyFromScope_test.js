// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function() {
  'use strict';

  describe('Component: copyKeyFromScope', function () {
    var copyKeyFromScope, $scope, $target;

    beforeEach(module('helpers'));

    beforeEach(inject(function($injector) {
      copyKeyFromScope = $injector.get('copyKeyFromScope');
      $scope = $injector.get('$rootScope').$new();
      $target = $injector.get('$rootScope').$new();
    }));

    it('should be available', function () {
      expect(copyKeyFromScope).toBeDefined();
      expect(typeof copyKeyFromScope).toBe('function');
    });

    it('should return the correct key', function() {
      $scope.this_data = {
        file: '123'
      };
      copyKeyFromScope('this_data.file', $scope, $target);
      expect($target.this_data.file).toBe('123');
    });

  });

})();
