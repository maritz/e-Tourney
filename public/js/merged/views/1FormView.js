_r(function () {  
  window.app.views.Form = Backbone.View.extend({
    
    t_prefix: 'general',
    
    initialize: function() {
      var self = this;
      
      this.previous = {};
      this.fieldTimer = null;
      this.submitButton = this.$('input[type="submit"]');
      
      this.subInitialize();
      
      _.bindAll(this, 'checkField', 'submit', 'checkFieldPreSend', 'fill',
                      'checkFieldSuccess', 'checkFieldResult', 'submitResult',
                      'checkFieldChanged', 'fieldError', 'setLabelWidth',
                      'submitSuccess');
                      
      // event handling
      this.$('input[type!="submit"][validate="validate"]').blur(function (e) {
        self.fieldTimer = setTimeout(self.checkField, 200, e);
      });
      
      this.el.submit(this.submit);
      
      this.$(":input").bind("invalid", function(e){
        e.preventDefault(); // Prevent modern browsers blocking the form submit on error
      });
      
      
      // initialize the form eleemnts
      this.$('.input_loading').hide();
      this.setLabelWidth();
      this.$('*[title]').monnaTip();
    },
    
    // abstract methods
    
    /**
     * If implemented this function is called after the form submit has handled the result
     */
    submitResult: function (errors, response) {},
    
    /**
     * If implemented this function is called 
     *  a) after the fieldcheck has handled the result
     *  b) after the error field of a form submit was handled
     */
    checkFieldResult: function (name, error) {},
    
    // end abstract methods
    
    
    
    /**
     * Calculates the maximum label width inside a fieldset > ul and sets all other labels to that
     */
    setLabelWidth: function () {
      var hidden = this.el.parentsUntil(':visible').show();
      
      this.$('fieldset > ul').each(function () {
        var max = 0
        , labels = $(this).find("label");
        
        labels.each(function(){
          if ($(this).width() > max)
            max = $(this).width();    
        }).width(max);
      });
      hidden.hide(); // this might be dangerous. :/
    },
    
    /**
     * Checks if the given fields value is the same as the previously submitted value
     */
    checkFieldChanged: function ($elem) {
      return ! ($elem.val() === this.previous[$elem[0].name]);
    },
    
    /**
     * Handle an error of a field, including error tooltips, classes and texts.
     */
    fieldError: function ($elem, error) {
      var self = this
      , $span = $elem.siblings('span.error')
      , $img = $elem.siblings('img.error');
      
      if (error) {
        error = $elem.attr('name')+'_'+error;
        error = $.t(self.t_prefix+'.errors.'+error);
        
        if ($span.html() !== error) {
          $elem.addClass('error');
          $span.animate({ opacity: 0 }, 200, 
            function() {
              var width = $elem.closest('div').width()-66;
              $span.html(error).shorten({
                tail: '... <img class="tooltip" src="/images/icons/help.png" title="'+error+'"/>',
                tooltip: false,
                width: width
              });
              $span.animate({opacity: 1}, 200);
            }
          );
        }
      } else {
        $elem.removeClass('error');
        $span.animate({ opacity: 0 }, 200, 
          function() {
            $span.text('');
          }
        );
      }
    },
    
    /**
     * Eventhandler that checks a field for its validity. 
     * This uses a buffer to reduce server load.
     */
    checkField: function (e) {
	    var target = $(e.target)
	    , value = target.val()
	    , self = this;
      
      if (value === '') {
        var error = target.attr('required') ? 'notEmpty' : false;
        this.fieldError(target, error);
        self.previous[target[0].name] = '';
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
    
    
    /**
     * Callback function for the JSON request of the fieldcheck.
     */
    checkFieldSuccess: function (response) {
      var self = this;
      $.each(response.request, function (name, value) {
        var error = response.errors[name][0]
        , input = self.$('input[name="'+name+'"]');
        input.siblings('div.input_loading').fadeOut(100);
        self.previous[name] = value;
        self.fieldError(input, error);
        self.checkFieldResult(name, error);
      });
    },

    /**
     * Event handler for the form submit.
     * This first checks if the form was changed at all.
     */
    submit: function (e) {
      var self = this
      , data = JSON.stringify(this.el.serializeObject())
      , changed = false
      , pre_errors = [];
      
      e.preventDefault();
      clearTimeout(this.fieldTimer);
      
      this.$('div.input_loading').hide();
      
      this.$(':input').not('[type="button"]').each(function () {
        var $this = $(this);
        if ($this.val() === '' && $this.attr('required')) {
          pre_errors.push([$this, 'notEmpty']);
          return;
        }
        
        if (self.checkFieldChanged($this)){
          changed = true;
        }
      });
      
      if ( ! changed && data !== '{}') {
        if (pre_errors.length > 0) {          
          $.each(function (val) {
            self.fieldError(val[0], val[1]);
            self.checkFieldResult(val[0], val[1]);
          });
        }
        return false;
      }
      
      this.$(':input').attr('disabled', true);
      
      $.ajax({
        type: 'POST',
        url: this.submitUrl,
        data: data,
        dataType: 'json',
        contentType: 'application/json',
        success: this.submitSuccess, 
        error: function (response) {
          self.$(':input').attr('disabled', false);
          alert('A server error occured, please contact an administrator.');
          debugger;
        }
      });
    },
    
    /**
     * Handles a submit response
     */
    submitSuccess: function (response) {
      var self = this,
      errors = false;
      this.$(':input').attr('disabled', false);
      $.each(response.request, function (name, value) {
        if ( ! response.errors.hasOwnProperty(name))
          response.errors[name] = [false];
        var error = response.errors[name][0]
        , input = self.$('input[name="'+name+'"]');
        self.previous[name] = value;
        if (error) {
          self.fieldError(input, error);
          self.checkFieldResult(name, error);
          errors = true;
        } else {
          delete response.errors[name];
        }
      });
      this.submitResult((errors ? response.errors : false), response);
    }
  });
  
});
