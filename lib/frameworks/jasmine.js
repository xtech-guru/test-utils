'use strict';

module.exports = function() {
  return {
    createTest: it,
    doneCB: function(done) {
      return function(err) {
        err && done.fail(err) || done();
      };
    }
  };
};
