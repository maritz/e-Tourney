_r(function () {
  var form = $('#register_form');
  if (form.length === 1) {
    var userRegisterView = window.app.views.Form.extend({

      el: $('#register_form'),

      subInitialize: function() {
        this.model = new app.models.user();
        _.bindAll(this, 'check', 'render');
        this.model.bind('change', this.render);
        this.model.view = this; // stick this view to that model!
      },

      render: function () {
        debugger; // we don't actually need this, do we?
      }
    });
  
    new userRegisterView();

  }
});
