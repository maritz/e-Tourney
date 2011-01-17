$(document).ready(function () {
  window.app.views.Form = Backbone.View.extend({
    
    initialize: function() {
      this.previous = {};
            
      var self = this;
      _.bindAll(this, 'checkField');
      $('input[validate="validate"]').blur(self.checkField);
      
      this.subInitialize();
    },
    
    checkField: function (e) {
	    e.preventDefault();
	    var target = $(e.target)
	    , value = target.val()
	    , self = this;
	    if ( (value === '' && target.attr('required') !== true)
	      || value === this.previous[target[0].name]
	      || !this.model.fieldCheckUrl) {
	      return false;}
	    this.previous[target[0].name] = value;
      
	    if (typeof(this.fieldBuffer) === 'undefined') {
	      this.fieldBuffer = [];
	    }
	    this.fieldBuffer.push({key: target[0].name, val: value});
      
	    target.siblings('div.input_loading').fadeIn(300);
	   
	    clearTimeout(this.fieldTimer);
	    this.fieldTimer = setTimeout( function () {
	      var data = JSON.stringify(self.fieldBuffer);
	      self.fieldBuffer = [];
	      $.ajax({
	        type: 'POST',
	        url: self.model.fieldCheckUrl,
	        data: data,
	        dataType: 'json',
	        contentType: 'application/json',
	        success: function (response) {
	          $.each(response.request, function (id, field) {
						  var error = response.errors[field.key]
						  , input = self.$('input[name="'+field.key+'"]')
						  , span = input.siblings('span.error');
						  input.siblings('div.input_loading').fadeOut(100);
						  if (error) {
						    input.addClass('error');
						    span.fadeOut(200, function() {
						      span.html(error).fadeIn(200)
						    });
						  } else {
						    input.removeClass('error');
						    span.fadeOut(300, function () {
						      span.text('')
						    });
						  }
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
