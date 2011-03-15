_r(function () {
  window.app.views.user.register = window.app.views.Form.extend({
    
    t_prefix: 'user',
    
    submitUrl: '/User/registerJson',
    
    subInitialize: function () {
      this.el = $('#register_form');
      this.model = app.userSelf;
      
      _.bindAll(this, 'login');
                      
      this.loginButton = this.$('input[name="login"]').click(this.login);
      this.loginError = this.$('span.login_failed');
      this.$('input[name="password"]').attr('required', true);
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
    
    submitResult: function (errors, response) {
      if (!errors) {
        this.model.setLoggedIn(response.user);
        window.location.hash = "#User/profile";
        $.jGrowl($.t('user.register.done'), {
          timeout: 10000,
          theme: 'success',
          header: $.t('user.register.done_header')
        });
      }
    }
  });
  
  window.app.views.user.profile = window.app.views.Form.extend({
    
    t_prefix: 'user',
    
    submitUrl: '/User/profileJson',
    
    subInitialize: function () {
      this.el = $('#profile_form');
      this.model = app.userSelf;
      this.fill(this.model.toJSON());
    },
    
    submitResult: function (errors, response) {
      if (!errors) {
        this.model.set(response.user);
      }
    }
  });
});
