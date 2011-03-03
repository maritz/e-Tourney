_r(function () {
  window.app.views.user.register = window.app.views.Form.extend({
    
    t_prefix: 'user',
    
    submitUrl: '/User/registerJson',
    
    subInitialize: function () {
      this.el = $('#register_form');
      this.model = new app.models.user();
      this.model.view = this; // stick this view to that model!
      
      _.bindAll(this, 'login');
                      
      this.loginButton = this.$('input[name="login"]').click(this.login);
      this.loginError = this.$('span.login_failed');
    },
    
    login: function () {
      var data = _.select(this.el.serializeArray(), function (data) {
        return (data.name === 'name' || data.name === 'password')
      })
      , self = this;
      app.userSelf.login(data, function (success) {
        if ( ! success) {
          self.loginError.show().delay(2500).fadeOut(2000);
        }
      });
    },
    
    checkFieldResult: function (name, error) {
      if (name === 'name' && error === 'notUnique') {
        this.loginButton.show();
        
      }
    },
    
    submitResult: function (errors) {
      debugger;
    },

    render: function () {
      debugger; // we don't actually need this, do we?
    }
  });
});
