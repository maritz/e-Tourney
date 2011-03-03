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

var PageController = Backbone.Controller.extend({
  
  initialize: function (spec) {
    var self = this;
    this.config = {
      pageTimeout: 1000*10, // 10 seconds
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
    var controller = 'news'
    , action = 'index'
    , parameters = []
    , refresh = false
    , timeout = false
    , now = +new Date()
    , $pageDiv
    , self = this;
    
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
      if (timeout)
        $pageDiv.data('lastLoad', now);
    }
    
    try {
      this.controllers[controller][action].call(this, parameters, $pageDiv, refresh, timeout, function (html, no_handle) {
        self.loading--; // this ensures that if you started loading a new page while already loading a page, the loading animation isn't stopped on the first page that finishes but on the last one.
        if (self.loading < 1) {
          self.loading = 0; // just to be sure ;D
          self.trigger('page_loading_done');
        }
        if ( ! no_handle) {
          self.breadcrumb(controller, action, parameters);
          self.replacePage($pageDiv, html, controller, action);
        }
      });
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
    var self = this;
    if (html && html !== '' && html !== true) {
      $div.html(html);
    } else if (html === true) {
      this.template('user', 'register', {}, function (html) {
        $div.html(html);
        if (typeof(self.views[controller]) !== 'undefined' 
          && typeof(self.views[controller][action]) !== 'undefined') {
          new self.views[controller][action]();
        }
      });
    }
    this.config.$breadcrumb.siblings().hide();
    $div.show();
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
    if (typeof(callback) !== 'function') {
      throw new Error('Can\'t call _template without a callback');
    }
    var self = this,
    tmpl_module;
    
    // TODO: cache templates in localStorage
    if (self._templates.hasOwnProperty(module) && self._templates[module].hasOwnProperty(name)) {
      callback(this._templates[module][name](locals));
    } else {
      tmpl_module = $('<div id="tmpl_'+module+'"></div>').appendTo('#templates');
      $.get('/templates/tmpl-'+module+'.html', function (data) {
        var found = false;
        if (!data)
          return callback(false);
        self._templates[module] = {};
        
        tmpl_module.append(data).children('script').each(function (i, val) {
          var tmpl = Haml(val.innerHTML)
          , loaded_name = val.getAttribute('name');
          self._templates[module][loaded_name] = tmpl;
          if (loaded_name === name) {
            found = true;
            callback(tmpl(locals));
          }
        }).end().remove();
        if (!found)
          callback(false);
      }, 'html');
    }
  }
});