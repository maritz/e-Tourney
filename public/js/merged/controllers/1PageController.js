var _r = function (fn, unshift) {
  if(fn === true) {
    $(function () {
      $.each(_r.fns, function (id, fnn) {
        fnn();
      });
      _r.done = true;
    });
    return true;
  }
  
  if (typeof(_r.done) !== 'undefined')
    return fn();
  
  if (typeof(_r.fns) === 'undefined') {
    _r.fns = [fn];
  } else if (unshift) {
    _r.fns.unshift(fn);
  } else {
    _r.fns.push(fn);
  }
};

if (typeof(console) === 'undefined') {
  var noop = function () {};
  window.console = {
    log: noop,
    dir: noop
  };
}

// this fixes the case where backbone does a GET request with Content-Type: application/json with no body// Map from CRUD to HTTP for our default `Backbone.sync` implementation.

Backbone.sync = function(method, model, success, error) {
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'delete': 'DELETE',
    'read'  : 'GET'
  };
  var type = methodMap[method];
  
  // Helper function to get a URL from a Model or Collection as a property
  // or as a function.
  var getUrl = function(object) {
    if (!(object && object.url)) throw new Error("A 'url' property or function must be specified");
    return _.isFunction(object.url) ? object.url() : object.url;
  };

  // Default JSON-request options.
  var params = {
    url:          getUrl(model),
    type:         type,
    dataType:     'json',
    processData:  false,
    success:      success,
    error:        error
  };
  
  // Ensure that we have the appropriate request data.
  if (!params.data && model && (method == 'create' || method == 'update')) {
    params.contentType = 'application/json';
    params.data = JSON.stringify(model.toJSON());
  }

  // For older servers, emulate JSON by encoding the request into an HTML-form.
  if (Backbone.emulateJSON) {
    params.contentType = 'application/x-www-form-urlencoded';
    params.processData = true;
    params.data        = modelJSON ? {model : modelJSON} : {};
  }

  // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
  // And an `X-HTTP-Method-Override` header.
  if (Backbone.emulateHTTP) {
    if (type === 'PUT' || type === 'DELETE') {
      if (Backbone.emulateJSON) params.data._method = type;
      params.type = 'POST';
      params.beforeSend = function(xhr) {
        xhr.setRequestHeader("X-HTTP-Method-Override", type);
      };
    }
  }

  // Make the request.
  $.ajax(params);
};

var PageController = Backbone.Controller.extend({
  
  initialize: function (spec) {
    var self = this;
    this.config = {
      pageTimeout: 1000*4, // 10 seconds
      $content: $('#content'),
      $breadcrumb: $('#breadcrumb')
    };
    _.extend(this.config, spec);

    this.models = {};
    this.views = {};
    this.controllers = {};
    this.route('*args', 'controller', this.router);
    this._templates = {};
    this._loading = 0;
  },
  
  router: function(route){
    var controller = 'news',
        action = 'index',
        parameters = [],
        refresh = false,
        timeout = false,
        now = +new Date(),
        $pageDiv,
        self = this;
    
    this.currentRoute = route; // for reloading
    
    if (route !== '') {
      route = route.split('/');
      controller = route[0].toLowerCase();
      if (route.length > 1 && route[1])
        action = route[1].toLowerCase();
      if (route.length > 2) {
        route.splice(0, 2);
        parameters = route;
      }
    }
    
    $pageDiv = $('#page_'+controller+'_'+action);
    if ($pageDiv.length === 0) {
      $pageDiv = $('<div/>', {
        id: 'page_'+controller+'_'+action,
        'data-lastLoad': now
      }).appendTo(this.config.$content);
    } else {
      refresh = true;
      timeout = $pageDiv.data('lastLoad')+this.config.pageTimeout < now;
    }
    
    try {
      var req = {
        params: parameters,
        $context: $pageDiv,
        refresh: refresh,
        timeout: timeout
      }, 
      res = {
        show: function (html, no_handle) {
          self.loading--; // this ensures that if you started loading a new page while already loading a page, the loading animation isn't stopped on the first page that finishes but on the last one.
          if (self.loading < 1) {
            self.loading = 0; // just to be sure ;D
            self.trigger('page_loading_done');
          }
          if ( ! no_handle) {
            self.breadcrumb(controller, action, parameters);
            self.replacePage($pageDiv, html, controller, action);
            $pageDiv.data('lastLoad', now);
          }
        }
      };
      this.controllers[controller][action].call(this, req, res);
      this.loading++;
      self.trigger('page_loading_start');
    } catch(e) {
      $.jGrowl('Sorry, there was an error while trying to process your action');
      console.log(e);
    }
  },
  
  reload: function () {
    this.router(this.currentRoute);
  },
  
  replacePage: function ($div, html, controller, action) {
    var self = this,
        siblings = this.config.$breadcrumb.siblings();
    $div.hide();
    if (html && html !== '' && html !== true) {
      $div.html(html);
    } else if (html === true) {
      this.template(controller, action, {}, function (html) {
        $div.html(html);
        if (typeof(self.views[controller]) !== 'undefined' &&
            typeof(self.views[controller][action]) !== 'undefined') {
          new self.views[controller][action]($div);
          // TODO: change this to call the views render() function and let that handle the templating
        }
      });
    }
    if (siblings.length === 0) {
     $div.show();
    } else {
      siblings.hide();
      $div.fadeIn(300);
    }
  },
  
  breadcrumb: function (controller, action, parameters) {
    var locals = {
      controller: controller,
      action: action,
      parameters: parameters && parameters.length && parameters[0].match(/[\d]*/) && parameters[0]
    },
    self = this;
    this.template('page', 'breadcrumb', locals, function (html) {
      self.config.$breadcrumb.html(html);
    });
  },
  
  _templates: {},
  template: function (module, name, locals, callback) {
    var self = this,
    tmpl_module;
    
    locals = locals || {};
    
    _.extend(locals, {
      partial: function (name, locals_) {
        locals_ = _.extend(locals, locals_);
        return self.template(module, name, locals_);
      }
    });
    
    // TODO: cache templates in localStorage
    if (this._templates.hasOwnProperty(module) && this._templates[module].hasOwnProperty(name)) {
      var html = this._templates[module][name](locals);
      if (typeof(callback) === 'function') {
        callback(html);
      } else {
        return html;
      }
    } else {
      if (typeof(callback) !== 'function') {
        console.dir(this._templates);
        console.dir(arguments);
        throw new Error('Can\'t call _template without a callback if the template module was not loaded yet!');
      }
      tmpl_module = $('<div id="tmpl_'+module+'"></div>').appendTo('#templates');
      $.get('/templates/tmpl-'+module+'.html', function (data) {
        var found = false;
        if (!data)
          return callback(false);
        self._templates[module] = {};
        
        tmpl_module.append(data).children('script').each(function (i, val) {
          var tmpl = Haml(val.innerHTML),
              loaded_name = val.getAttribute('name');
          self._templates[module][loaded_name] = tmpl;
          if (loaded_name === name) {
            found = tmpl;
          }
        }).end().remove();
        if (!found) {
          callback(false);
        } else {
          callback(found(locals));
        }
      }, 'html');
    }
  }
});