// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function() {
  'use strict';

  describe('Component: logout', function () {
    var logout,
    $location = { path: angular.noop },
    $cookieStore = { remove: angular.noop };

    beforeEach(module('helpers', function($provide) {
      $provide.value('$location', $location);
      $provide.value('$cookieStore', $cookieStore);
    }));

    beforeEach(inject(function($injector) {
      logout = $injector.get('logout');
    }));

    it('should be available', function () {
      expect(logout).toBeDefined();
      expect(typeof logout).toBe('function');
    });

    it('should log out user', function() {
      spyOn($location, 'path');
      spyOn($cookieStore, 'remove');
      logout();
      expect($location.path).toHaveBeenCalledWith("/login");
      expect($cookieStore.remove).toHaveBeenCalledWith("auth_cookie");
    });

  });

})();
