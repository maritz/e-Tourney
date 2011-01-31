_r(function () {
  var self = {}; // models/views
  window.app.controllers['user'] = {
    index: function (parameters, $div, refresh, timeout, done) {
      done()
    },
    register: function (parameters, $div, refresh, timeout, done) {
      this.template('user', 'register', {}, function (html) {
        if (!html)
          $.jGrowl('You can\'t register right now');
        else {
          $div.html(html);
        }        
        done();
      });
    }
  };
});