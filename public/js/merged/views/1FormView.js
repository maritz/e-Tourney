$(document).ready(function () {
   window.app.views.Form = Backbone.View.extend({

    events: {
      'blur input[type="text"]': 'checkForm',
      'submit': 'checkForm'
    },
    
    initialize: function() {
    },
    
    checkForm: function (e) {
      e.preventDefault();
      var data = this.el.serializeObject();
      
    }
  });

});
