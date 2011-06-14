_r(function () {
  var userModel = window.app.models.base.extend({

    loggedIn: false,
    id: 0,
    fieldCheckUrl: '/User/checkFieldJson',
    self: false,
    
    getSelfFromDocument: function () {
      if (this.self && $(this.view.el).hasClass('logged_in') && userSelf) {
        this.loggedIn = true;
        this.set(userSelf);
      }
    },
    
    url: function () {
      return '/User/details/'+this.id;
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
    },
    
    logout: function (cb) {
      var self = this;
      if (this.loggedIn) {
        $.post('/User/logout', {}, function () {
          self.loggedIn = false;
          self.set({name: '', id: 0});
          window.registry.selfName = 'Guest'+(+new Date());
          cb(true);
        });
      } else {
        cb(false);
      }
    }
  });
  
  window.app.models.user = userModel;
  window.app.views.user = {};

});
