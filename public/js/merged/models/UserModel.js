$(document).ready(function () {
  var userModel = Backbone.Model.extend({

    logged_in: false,
    login_failed: false,
    id: 0,

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

    login: function (data) {
      if (this.logged_in)
        return true;
      var self = this;
      $.post('/User/loginJson', data, function (response) {
        if (response.result) {
          self.set({
            logged_in: true
          });
          self.set(response.user);
        } else {
          self.trigger('login_fail');
        }
      });
    }
  });
  
  window.app.models.user = userModel;

});
