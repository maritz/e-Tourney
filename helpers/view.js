var form = exports.form = function (env, module, prefix) {
  this.env = env;
  this.tr = env.tr;
  this.errors = env.errors || {};
  this.values = env.values || {};
  this.module = module;
  this.prefix = prefix ? prefix+'_' : 'form_';
  this.fields = {};
};
  
form.prototype.getErrorClass = function (key) {
  if (this.errors !== 'none' && 
      Array.isArray(this.errors[key]) &&
      this.errors[key].length > 0) {
    return 'error';
  }
  return '';
}

form.prototype.getErrorText = function (key) {
  if (this.errors !== 'none' &&
      Array.isArray(this.errors[key]) &&
      this.errors[key].length > 0) {
    return this.tr(this.module + ':errors:' + key + '_' + this.errors[key][0]);
  }
  return '';
};

form.prototype.getLabel = function (key, options) {
  var html = '<label';
  options = options || {};
  html += ' for="'+this.prefix+key+'"';
  
  if (options.required)
    html += ' class="required"';
  
  html += '>'+this.tr(this.module+':labels:'+key)+'</label>';
  
  return html;
}

form.prototype.getInputHtml = function (type, name, options) {
  var html = '<input'
  , errorClass = this.getErrorClass(name)
  , value = typeof(options.value) === 'undefined' ? (this.values[name] || null) : options.value
  , option
  , trueOption;
  options = options || {};
  
  html += ' type="'+type+'" id="'+this.prefix+name+'" name="'+name+'"';
  
  if (errorClass !== '')
    html += ' class="'+errorClass+'"';
    
  if (value)
    html += ' value="'+value+'"';
    
  for (option in options) {
    if (options.hasOwnProperty(option)) {
      trueOption = options[option] === true ? option : options[option];
      html += ' '+option+'="'+trueOption+'"';
    }
  }
    
  return html+'/>';
}

form.prototype.input = function (type, name, options) {
  if (typeof(this.fields[name]) !== 'undefined')
    return this.fields[name];
  var error = {
    text: this.getErrorText(name, true),
    class: this.getErrorClass(name)
  };
  options = options || {};
  return this.fields[name] = {
    error: error,
    label: this.getLabel(name, options),
	  input: this.getInputHtml(type, name, options),
	  help: '<span class="input_help">HILF HILF!</span>'
  };
  
};





