_r(function () {
  var userModel = window.app.models.base.extend({

    loggedIn: false,
    id: 0,
    fieldCheckUrl: '/User/checkFieldJson',
    self: false,
    
    getSelf: function () {
      if (this.self && $(this.view.el).hasClass('logged_in') && userSelf) {
        this.set(userSelf);
        this.loggedIn = true;
      }
    },

    login: function (data, cb) {
      if (this.loggedIn)
        return true;
      var self = this;
      $.post('/User/loginJson', data, function (response) {
        if (response.result) {
          self.setLoggedIn(response.user);
          if (typeof(cb) === 'function') {
            cb(true);
          }
        } else if (typeof(cb) !== 'function') {
          self.trigger('login_fail');
        } else {
          cb(false);
        }
      });
    },
    
    setLoggedIn: function (userdata) {
      this.loggedIn = true;
      this.set(userdata);
    }
  });
  
  window.app.models.user = userModel;
  window.app.views.user = {};

});
