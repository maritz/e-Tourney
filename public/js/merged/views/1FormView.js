$(document).ready(function () {
  window.app.views.Form = Backbone.View.extend({
    
    previous: {},

    events: {
      'blur input[type="text"]': 'checkField'
    },
    
    initialize: function() {
    },
    
    checkField: function (e) {
	    e.preventDefault();
	    var value = $(e.target).val()
	    , self = this;
	    if (value == ''
	      || value === this.previous[e.target.name]
	      || !this.model.fieldCheckUrl) {
	      return false;}
	    this.previous[e.target.name] = value;
	
	    if (typeof(this.fieldBuffer) === 'undefined') {
	      this.fieldBuffer = [];
	    }
	    this.fieldBuffer.push({key: e.target.name, val: value});
	     
	    clearTimeout(this.fieldTimer);
	    this.fieldTimer = setTimeout( function () {
	      $.ajax({
	        type: 'POST',
	        url: self.model.fieldCheckUrl,
	        data: JSON.stringify(self.fieldBuffer),
	        dataType: 'text',
	        contentType: 'application/json',
	        success: function (response) {
	          $.each(response.errors, function (error) {
	            
	          });
	        }, error: function (response) {
	          alert('A server error occured, please contact an administrator.');
	          debugger;
	        }
	      });
	    }, 1500);
    }
  });

});
