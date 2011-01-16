var Ni = require('ni');

Ni.addRoute(/^\/User\/(login|login|checkFieldJson).*$/i, '/error/method_not_allowed', 'GET');

var userController = module.exports = {
  __init: function (cb, req, res, next) {
    if (!req.session.logged_in 
      && ( res.Ni.action.indexOf('list') === 0
          ||  res.Ni.action.indexOf('edit') === 0) ) {
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
    setTimeout(function () { // artificial delay to make bruteforcing less practical
      var user = new Ni.models.User();
      user.login(req.body.name, req.body.password, function (logged) {
        if (logged) {
          user.getBoxInfo(user.id, function (info) {
            var oldUrl = req.session.lastPage;
            req.session.regenerate(function () {
              req.session.user = info;
              req.session.logged_in = true;
              res.redirect(oldUrl);
            });
          });
        } else {
          res.rlocals.name = req.body.name;
          next();
        }
      });
    }, 400);
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
      user.p({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      });
      var callback = function (valid) {
        if (user.__inDB) {
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
      }
      if (req.body.password.length < 6) { // we do this here instead of in the model validations because the password is hashed ;)
        user.valid(null, false, function (valid) {
          user.errors.password = 'minLength';
          callback(false);
        });
      } else if (req.body.password != req.body.password_repeat) {
        user.errors.password_repeat = 'passwords_dont_match';
        user.valid(null, false, callback);
      } else {
        user.save(callback);
      }
    } else {
      res.rlocals.values = {
        name: '',
        email: ''
      };
      res.rlocals.errors = 'none';
      next();
    }
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
  	          res.send(response);
	          } else {
  	          res.send(response);
	          }                                    
	        });
        }
      };
      req.body.forEach(function (field) {
        user.p(field.key, field.val);
        done();
      });
    } else {
      response.errors.push('Request did not contain proper fields to check.');
      res.send(response);
    }
  },
}



