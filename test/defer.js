// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
(function(globals) {
  var defer = function(done) {
    return function() {
      setTimeout(done, 1);
    };
  };

  globals.defer = defer;
})(window);
