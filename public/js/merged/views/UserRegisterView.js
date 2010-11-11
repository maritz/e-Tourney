$(document).ready(function () {
  var form = $('#register_form');
  if (form.length === 1) {
    var userRegisterView = Backbone.View.extend({

      el: $('#register_form'),

      events: {
        'blur input[type="text"]': 'checkField',
        'submit form': 'checkForm'
      },

      initialize: function() {
        var test = this.el.serializeObject();
        _.bindAll(this, 'check', 'render');
        this.model.bind('login_fail', this.showFail);
        this.model.bind('change', this.render);
        this.model.view = this; // stick this view to that model!
      },

      render: function () {
        $(this.el).addClass('logged_in');
        $('#top_bar_logged a').last().addClass('logged_in');
        this.$('#userbox_profile').attr('href', '/User/details/' + this.model.get('id'));
        this.$('#userbox_profile span').text(this.model.get('name'));
        return this;
      },

      check: function (e) {
        e.preventDefault();
        this.$('span.error').hide();
        this.$('input[type="submit"]').attr('disabled', true);
        this.model.login(this.$('form').serializeArray());
      }
    });
  
    var newUser = new app.models.user();

    var registraion = new userRegisterView({ model: newUser});

  }
});
