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
    
    getLocal: function () {
      if (this.conf.self) {
        try {
          var data = JSON.parse($('#user_data_self').html());
          if (!data) {
            throw new Error('No data for user-self');
          }
          this.set(data);
        } catch(e) {
          if ($(this.view.el).hasClass('logged_in')) {
            window.location = '/User/logout'; // sorry, something went horribly wrong and we have to spent some time apart.
          }
        }
        
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
          localStorage['user:self'] = JSON.stringify(response.user);
        } else {
          self.trigger('login_fail');
        }
      });
    }
  });
  
  window.app.models.user = userModel;

});
