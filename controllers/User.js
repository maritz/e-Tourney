var Ni = require('ni');

Ni.addRoute(/^\/User\/(loginJson|checkFieldJson).*$/i, '/error/method_not_allowed', 'GET');

var editForm = function (req, res, next, user) {
  if (typeof(req.body) !== 'undefined') {
    res.rlocals.values = req.body;
    user.fill(req.body,  function (valid) {
      if (valid) {
        user.save(function (err) {
          if (err) {
            req.flash('profile_edited', true);
            res.rlocals.db_error = true;
          } else {
            user.getBoxInfo(user.id, function (info) {
              req.session.user = info;
            });
            res.redirect('/User/details/'+user.id);
          }
        });
      } else {
        res.rlocals.errors = user.errors;
        next();
      }
    });
  } else {
    res.rlocals.values = user.allProperties();
    res.rlocals.errors = 'none';
    next();
  }
}


var userController = module.exports = {
  __init: function (cb, req, res, next) {
    if ( ! req.session.logged_in 
      && (   res.Ni.action.indexOf('list') === 0
          || res.Ni.action.indexOf('edit') === 0
          || res.Ni.action.indexOf('profile') === 0) ) {
      res.Ni.action = 'login';
      Ni.controllers.User.login(req, res, next);
    } else {
      cb();
    }
  },
  
  index: function (req, res, next) {
    next();
  },
  
  login: function (req, res, next) {
    next();
  },
  
  list: function (req, res, next) {
    console.log('in list');
    res.Ni.action = 'index';
    next();
  },
  
  loginJson: function (req, res) {
    var response = {
      result: null,
      user: null
    };
    setTimeout(function () { // artificial delay to make bruteforcing less practical
      var user = new Ni.models.User();
      user.login(req.body.name, req.body.password, function (logged) {
        if (logged) {
          response.result = true;
          user.getBoxInfo(user.id, function (info) {
            req.session.regenerate(function () {
              response.user = req.session.user = info;
              req.session.logged_in = true;
              res.send(response);
            });
          });
        } else {
          response.result = false;
          res.send(response);
        }
      });
    }, 400);
  },
  
  logout: function (req, res, next) {
    req.session.destroy();
    res.redirect('/');
  },
  
  register: function (req, res, next) {
    if (req.session.logged_in) {
      res.redirect('/');
    } else if (typeof(req.body) !== 'undefined') {
      var user = new Ni.models.User();
      res.rlocals.values = req.body;
      user.fill(req.body, ['name', 'email', 'password'],  function (valid) {
        if (user.__inDB && false) { ///                                                  ATTENTION !!!!!!!!!!!!!!!!!!!!!!!!!!!   IMPLEMENT SAVE AGAIN!
          user.getBoxInfo(user.id, function (info) {
            var oldUrl = req.session.lastPage || '/';
            req.session.regenerate(function () {
              req.session.user = info;
              req.session.logged_in = true;
              res.redirect(oldUrl);
            });
          });
        } else {
          res.rlocals.errors = user.errors;
          next();
        }
      });
    } else {
      res.rlocals.values = {
        name: '',
        email: ''
      };
      res.rlocals.errors = 'none';
      next();
    }
  },
  
  profile: function (req, res, next) {
    var user = new Ni.models.User()
    , id = req.session.user.id;
    res.rlocals.user_not_found = false;
      
    user.load(id, function (err) {
      if (!user.p('name')) {
        res.rlocals.user_not_found = id;
        next();
      } else {
        editForm(req, res, next, user);
      }
    });
  },
  
  details: function (req, res, next, id) {
    var user = new Ni.models.User();
    res.rlocals.user_not_found = false;
    res.rlocals.profile_edited = req.flash('profile_edited');
    
    if (isNaN(id)) {
      res.rlocals.user_not_found = id;
      return next();
    }
      
    user.load(id, function (err) {
      if (!user.p('name')) {
        res.rlocals.user_not_found = id;
      } else {
        res.rlocals.user = user.allProperties();
      }
      next();
    });
  },
  
  checkFieldJson: function (req, res) {
    var response = {
      errors: {},
      request: req.body
    };
    if (typeof(req.body) !== 'undefined' && Array.isArray(req.body)) {
	    var user = new Ni.models.User()
	    , len = req.body.length
	    , done = function () {
	      len--;
	      if (len === 0) {
	        user.valid(false, false, function (valid) {
	          if ( ! valid) {
	            user.errors.forEach(function (error, field) {
	              if (error.length > 0 && field !== 'salt')
	                response.errors[field] = req.tr('user:errors:'+field+'_'+
	                                                     error[0]);
	            });
	          }
            res.send(response);                                    
	        });
        }
      }
      , propSetter = function () {
        req.body.forEach(function (field) {
          user.p(field.key, field.val);
        });
        done();
      };
      if (req.session.logged_in) {
        user.load(req.session.user.id, function (err) {
          propSetter();
        });
      } else {
        propSetter();
      }
    } else {
      response.errors.push('Request did not contain proper fields to check.');
      res.send(response);
    }
  },
}



