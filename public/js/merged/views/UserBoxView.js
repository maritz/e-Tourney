$(document).ready(function () {
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
      this.model.getLocal();
    },

    render: function () {
      $(this.el).addClass('logged_in');
      $('#top_bar_logged a').last().addClass('logged_in');
      this.$('#userbox_profile').attr('href', '/User/details/' + this.model.get('id'));
      this.$('#userbox_profile span').text(this.model.get('name'));
      return this;
    },
    
    showFail: function () {
      this.$('input[type="submit"]').attr('disabled', false);
      this.$('span.error').show();
    },
    
    login: function (e) {
      e.preventDefault();
      this.$('span.error').hide();
      this.$('input[type="submit"]').attr('disabled', true);
      this.model.login(this.$('form').serializeArray());
    }
  });
  
  app.views.userBox = userBoxView;
  
  app.userSelf = new app.models.user({self: true});
  
  var userBoxView = new userBoxView({ model: app.userSelf});

});
