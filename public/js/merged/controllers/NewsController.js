_r(function () {
  var self = {}; // models/views
  window.app.controllers['news'] = {
    index: function (parameters, $div, refresh, timeout, done) {
      if (refresh && timeout)
        $.jGrowl('now the news should be reloaded');
      else if (refresh)
        $.jGrowl('the news are still fresh. no reload needed');
      else if (!refresh)
        $.jGrowl('creating the news');
      done('some news');
    },
    details: function (parameters, $div, refresh, timeout, done) {
      done();
    }
  };
});