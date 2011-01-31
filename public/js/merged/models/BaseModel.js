_r(function () {
  window.app.models.base = Backbone.Model.extend({
    
    parse: function (res) {
      if (!res.attr && !res.errors) {
        this.errors = {
          general: 'Server error'
        }
      } else if (res.errors) {
        this.errors = typeof(res.errors) === 'object' ? res.errors : { general: res.errors };
      } else {
        return res.attr;
      }
      this.trigger('error');
      return false;
    }
  });

});