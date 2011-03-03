_r(function () {
  window.app.views.Form = Backbone.View.extend({
    
    t_prefix: 'general',
    
    initialize: function() {
      var self = this;
      
      this.previous = {};
      this.fieldTimer = null;
            
      this.subInitialize();
      
      _.bindAll(this, 'checkField', 'submit', 'checkFieldPreSend',
                      'checkFieldSuccess', 'checkFieldResult', 'submitResult',
                      'checkFieldChanged', 'fieldError');
      this.$('input[type!="submit"][validate="validate"]').blur(function (e) {
        self.fieldTimer = setTimeout(self.checkField, 200, e);
      });
      this.el.submit(this.submit);
      
      this.submitButton = this.$('input[type="submit"]');
      
      this.$('.input_loading').hide();
      
      this.$(":input").bind("invalid", function(e){
        e.preventDefault(); // Don't block the form submit
      });
    },
    
    submitResult: function () {},
    checkFieldResult: function () {},
    checkFieldPreSend: function () {},
    
    checkFieldChanged: function ($elem) {
      return ! ($elem.val() === this.previous[$elem[0].name]);
    },
    
    fieldError: function ($elem, error) {
      var self = this
      , span = $elem.siblings('span.error');
      if (error) {
        error = $elem.attr('name')+'_'+error;
        $elem.addClass('error');
        span.fadeOut(200, function() {
          span.html($.t(self.t_prefix+'.errors.'+error)).fadeIn(200)
        });
      } else {
        $elem.removeClass('error');
        span.fadeOut(300, function () {
          span.text('')
        });
      }
    },
    
    checkField: function (e) {
	    var target = $(e.target)
	    , value = target.val()
	    , self = this;
      
      if (value === '') {
        var error = target.attr('required') ? 'notEmpty' : false;
        this.fieldError(target, error);
        return false;
      }
      
      if ( ! this.checkFieldChanged(target)
        || ! this.model.fieldCheckUrl){
        return false;
      }
      
	    if (typeof(this.fieldBuffer) === 'undefined') {
	      this.fieldBuffer = {};
	    }
	    this.fieldBuffer[target[0].name] = value;
      
	    target.siblings('div.input_loading').fadeIn(300);
	   
	    clearTimeout(this.fieldTimer);
	    this.fieldTimer = setTimeout( function () {
        
        if (typeof(this.checkFieldPreSend) === 'function') {
          $.each(self.fieldBuffer, function (name, value) {
            self.checkFieldPreSend(name, value);
          });
        }
        
	      var data = JSON.stringify(self.fieldBuffer);
	      self.fieldBuffer = {};
	      $.ajax({
	        type: 'POST',
	        url: self.model.fieldCheckUrl,
	        data: data,
	        dataType: 'json',
	        contentType: 'application/json',
	        success: self.checkFieldSuccess, error: function (response) {
	          alert('A server error occured, please contact an administrator.');
	          debugger;
	        }
	      });
	    }, 1500);
    },
    
    checkFieldSuccess: function (response) {
      var self = this;
      $.each(response.request, function (name, value) {
        var error = response.errors[name][0]
        , input = self.$('input[name="'+name+'"]')
        , span = input.siblings('span.error');
        input.siblings('div.input_loading').fadeOut(100);
        self.previous[input.name] = value;
        self.fieldError(input, error);
        self.checkFieldResult(name, error);
      });
    },

    submit: function (e) {
      var self = this
      , data = JSON.stringify(this.el.serializeObject())
      , changed = false;
      
      e.preventDefault();
      
      clearTimeout(this.fieldTimer);
      this.$('div.input_loading').hide();
      
      this.$(':input').not('[type="button"]').each(function () {
        var $this = $(this);
        if ($this.val() === '' && $this.attr('required')) {
          self.fieldError($this, 'notEmpty');
          return;
        }
        
        if (self.checkFieldChanged($this)){
          changed = true;
        }
      });
      
      if ( ! changed && data !== '{}')
        return false;
      
      this.$(':input').attr('disabled', true);
      
      $.ajax({
        type: 'POST',
        url: this.submitUrl,
        data: data,
        dataType: 'json',
        contentType: 'application/json',
        success: function (response) {
          var errors = false;
          self.$(':input').attr('disabled', false);
          $.each(response.request, function (name, value) {
            if ( ! response.errors.hasOwnProperty(name))
              response.errors[name] = [false];
            var error = response.errors[name][0]
            , input = self.$('input[name="'+name+'"]')
            , span = input.siblings('span.error');
            self.previous[input.name] = value;
            if (error) {
              self.fieldError(input, error);
              self.checkFieldResult(name, error); // possibly put this in the if(error) check to enable catching false-positive errors on the client side.
              errors = true;
            } else {
              delete response.errors[name];
            }
          });
          self.submitResult((errors ? response.errors : false));
        }, error: function (response) {
          self.$(':input').attr('disabled', false);
          alert('A server error occured, please contact an administrator.');
          debugger;
        }
      });
    }
  });
  
});
