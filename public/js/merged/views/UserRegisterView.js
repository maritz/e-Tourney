$(document).ready(function () {
  var form = $('#register_form');
  if (form.length === 1) {
    var userRegisterView = window.app.views.Form.extend({

      el: $('#register_form'),

      initialize: function() {
        this.model = new app.models.user();
        _.bindAll(this, 'check', 'render');
        this.model.bind('change', this.render);
        this.model.view = this; // stick this view to that model!
      },

      render: function () {
        $(this.el).addClass('logged_in');
        $('#top_bar_logged a').last().addClass('logged_in');
        this.$('#userbox_profile').attr('href', '/User/details/' + this.model.get('id'));
        this.$('#userbox_profile span').text(this.model.get('name'));
        return this;
      }
    });
  
    new userRegisterView();

  }
});
