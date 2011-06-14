var Ni = require('ni');

Ni.addRoute(/^\/User\/(loginJson|checkFieldJson).*$/i, '/error/method_not_allowed', 'GET');

var editForm = function (req, res, next, user) {
  console.log('using User/editForm function');
  if (typeof(req.body) !== 'undefined') {
    res.rlocals.values = req.body;
    user.checkProperties(req.body,  function (valid) {
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
};


var userController = module.exports = {
  __init: function (cb, req, res, next) {
    if ( ! req.session.logged_in && 
          ( res.Ni.action.indexOf('list') === 0
          ) 
        ) {
      res.send({error: 'login required'});
    } else {
      cb();
    }
  },
  
  index: function (req, res, next) {
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
    req.session.destroy(function () {
      res.send('/');
    });
  },
  
  registerJson: function (req, res, next) {
    var response = {
      errors: {},
      user: null,
      request: req.body
    };
    if (typeof(req.body) !== 'undefined') {
      var user = new Ni.models.User();
      var len = req.body.length;
      var propSetter = function () {
        user.create(req.body, function (valid) {
          if (user.__inDB) {
            user.getBoxInfo(user.id, function (info) {
              req.session.regenerate(function () {
                req.session.user = info;
                req.session.logged_in = true;
                response.user = info;
                res.send(response);
              });
            });
          } else {
            response.errors = user.errors;
            res.send(response);                                    
          }
        });
      };
      if (req.session.logged_in && false) { // this needs to be changed to a check whether the user has user editing rights. if so, he may create new users like this
        user.load(req.session.user.id, function (err) {
          propSetter();
        });
      } else {
        propSetter();
      }
    } else {
      response.errors.general = 'Request did not contain proper fields to check.';
      res.send(response);
    }
  },
  
  profile: function (req, res, next) {
    var user = new Ni.models.User();
    var id = req.session.user.id;
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
    console.log('in details');
    
    if (isNaN(id)) {
      return res.send({error: 'invalid id'});
    }
    
    user.load(id, function (err) {
      if (err) {
        return res.send({error: err});
      } else {
        return res.send({
          error: false,
          data: {
            user: user.getAllowedProperties(req.session.user)
          }
        });
      }
    });
  },
  
  checkFieldJson: function (req, res) {
    var response = {
      errors: {},
      request: req.body
    };
    if (typeof(req.body) !== 'undefined') {
      var user = new Ni.models.User();
      var len = req.body.length;
      var propSetter = function () {
        user.checkProperties(req.body, function (valid) {
          response.errors = user.errors;
          res.send(response);                                    
        });
      };
      if (req.session.logged_in) {
        user.load(req.session.user.id, function (err) {
          propSetter();
        });
      } else {
        propSetter();
      }
    } else {
      response.errors['general'] = 'Request did not contain proper fields to check.';
      res.send(response);
    }
  }
}



