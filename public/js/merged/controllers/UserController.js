_r(function () {
  var self = {}; // models/views
  window.app.controllers['user'] = {
    index: function (parameters, $div, refresh, timeout, show) {
      show()
    },
    register: function (parameters, $div, refresh, timeout, show) {
      show(true);
    }
  };
});