_r(function () {
  var userBoxView = Backbone.View.extend({

    el: $('#header_userbox'),
    
    events: {
      'submit form': 'login'
    },
    
    initialize: function() {
      _.bindAll(this, 'showFail', 'login', 'render');
      this.model.bind('login_fail', this.showFail);
      this.model.bind('change', this.render);
      this.model.view = this; // stick this view to that model!
      
      this.model.getSelfFromDocument(); // get login data
    },

    render: function () {
      // this is called when the self usermodel changes. this means on login/logout and on profile changes.
      if (this.model.loggedIn) {
        this.el.addClass('logged_in');
        $('#top_bar_logged a').last().addClass('logged_in');
        this.$('#userbox_profile').attr('href', '#user/details/' + this.model.get('id'));
        this.$('#userbox_profile span').text(this.model.get('name'));
      } else {
        this.el.removeClass('logged_in');
        $('#top_bar_logged a').last().removeClass('logged_in');
        this.$('#userbox_profile').attr('href', '');
        this.$('#userbox_profile span').text('');
      }
      return true;
    },
    
    showFail: function () {
      console.dir(this.$('span.error'));
      this.$('input[type="submit"]').attr('disabled', false);
      this.$('span.error').show();
    },
    
    login: function (e) {
      e.preventDefault();
      this.$('span.error').hide();
      this.$('input[type="submit"]').attr('disabled', true);
      this.model.login(this.$('form').serializeArray());
      this.$('input[type="password"]').val('');
    }
  });
  
  app.views.userBox = userBoxView;
  
  app.userSelf = new app.models.user();
  app.userSelf.self = true;
  
  var userBoxView = new userBoxView({ model: app.userSelf });

});
