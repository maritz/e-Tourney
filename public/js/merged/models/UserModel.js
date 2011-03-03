_r(function () {
  var userModel = window.app.models.base.extend({

    logged_in: false,
    login_failed: false,
    id: 0,
    fieldCheckUrl: '/User/checkFieldJson',

    initialize: function (options) {
      this.conf = {
        self: false
      }
      _.extend(this.conf, options);
      
    },
    
    getSelf: function () {
      if (this.conf.self && $(this.view.el).hasClass('logged_in') && userSelf) {
        this.set(userSelf);
      }
    },

    login: function (data, cb) {
      if (this.logged_in)
        return true;
      var self = this;
      console.dir(data);
      $.post('/User/loginJson', data, function (response) {
        if (response.result) {
          self.set({
            logged_in: true
          });
          self.set(response.user);
          if (typeof(cb) === 'function') {
            cb(true);
          }
        } else if (typeof(cb) !== 'function') {
          self.trigger('login_fail');
        } else {
          cb(false);
        }
      });
    }
  });
  
  window.app.models.user = userModel;
  window.app.views.user = {};

});
